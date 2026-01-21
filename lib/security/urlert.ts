import { ScanResult } from '@/types'

interface UrlertResponse {
  status: 'safe' | 'phishing' | 'suspicious' | 'malicious'
  confidence: number
  details?: any
}

export async function scanWithUrlert(url: string): Promise<ScanResult> {
  const apiKey = process.env.URLERT_API_KEY

  if (!apiKey) {
    return {
      service: 'urlert',
      result: 'uncertain',
      details: { error: 'API key not configured' },
      scannedAt: new Date(),
    }
  }

  try {
    const response = await fetch('https://api.urlert.io/v1/scan', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    })

    if (!response.ok) {
      throw new Error(`URLert API error: ${response.status}`)
    }

    const data: UrlertResponse = await response.json()

    let result: 'safe' | 'unsafe' | 'uncertain'
    if (data.status === 'safe') result = 'safe'
    else if (data.status === 'phishing' || data.status === 'malicious') result = 'unsafe'
    else result = 'uncertain'

    return {
      service: 'urlert',
      result,
      details: {
        status: data.status,
        confidence: data.confidence,
        ...data.details,
      },
      scannedAt: new Date(),
    }
  } catch (error) {
    console.error('URLert scan error:', error)
    return {
      service: 'urlert',
      result: 'uncertain',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      scannedAt: new Date(),
    }
  }
}