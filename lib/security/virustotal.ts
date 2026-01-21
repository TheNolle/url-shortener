import { ScanResult } from '@/types'

interface VirusTotalAnalysis {
  data: {
    attributes: {
      stats: {
        malicious: number
        suspicious: number
        undetected: number
        harmless: number
      }
      last_analysis_results: Record<string, any>
    }
  }
}

export async function scanWithVirusTotal(url: string): Promise<ScanResult> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY

  if (!apiKey) {
    return {
      service: 'virustotal',
      result: 'uncertain',
      details: { error: 'API key not configured' },
      scannedAt: new Date(),
    }
  }

  try {
    const submitResponse = await fetch('https://www.virustotal.com/api/v3/urls', {
      method: 'POST',
      headers: {
        'x-apikey': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `url=${encodeURIComponent(url)}`,
    })

    if (!submitResponse.ok) {
      throw new Error(`VirusTotal API error: ${submitResponse.status}`)
    }

    const submitData = await submitResponse.json()
    const analysisId = submitData.data.id

    await new Promise(resolve => setTimeout(resolve, 2000))

    const analysisResponse = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, { headers: { 'x-apikey': apiKey } })

    if (!analysisResponse.ok) {
      throw new Error(`VirusTotal analysis fetch error: ${analysisResponse.status}`)
    }

    const analysisData: VirusTotalAnalysis = await analysisResponse.json()
    const stats = analysisData.data.attributes.stats

    const totalScans = stats.malicious + stats.suspicious + stats.undetected + stats.harmless
    const threatCount = stats.malicious + stats.suspicious

    const threatPercentage = totalScans > 0 ? (threatCount / totalScans) * 100 : 0

    let result: 'safe' | 'unsafe' | 'uncertain'
    if (threatPercentage > 10) result = 'unsafe'
    else if (threatPercentage > 5) result = 'uncertain'
    else result = 'safe'

    return {
      service: 'virustotal',
      result,
      details: {
        stats,
        threatPercentage: Math.round(threatPercentage * 100) / 100,
        engines: totalScans,
      },
      scannedAt: new Date(),
    }
  } catch (error) {
    console.error('VirusTotal scan error:', error)
    return {
      service: 'virustotal',
      result: 'uncertain',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      scannedAt: new Date(),
    }
  }
}