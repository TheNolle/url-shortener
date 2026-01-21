import { ScanResult } from '@/types'

interface SafeBrowsingResponse {
  matches?: Array<{
    threatType: string
    platformType: string
    threat: { url: string }
  }>
}

export async function scanWithGoogleSafeBrowsing(url: string): Promise<ScanResult> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY

  if (!apiKey) {
    return {
      service: 'google-safe-browsing',
      result: 'uncertain',
      details: { error: 'API key not configured' },
      scannedAt: new Date()
    }
  }

  try {
    const response = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client: {
          clientId: 'url-shortener',
          clientVersion: '1.0.0',
        },
        threatInfo: {
          threatTypes: [
            'MALWARE',
            'SOCIAL_ENGINEERING',
            'UNWANTED_SOFTWARE',
            'POTENTIALLY_HARMFUL_APPLICATION',
          ],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }],
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Google Safe Browsing API error: ${response.status}`)
    }

    const data: SafeBrowsingResponse = await response.json()

    if (data.matches && data.matches.length > 0) {
      return {
        service: 'google-safe-browsing',
        result: 'unsafe',
        details: { threats: data.matches },
        scannedAt: new Date(),
      }
    }

    return {
      service: 'google-safe-browsing',
      result: 'safe',
      details: { message: 'No threats detected' },
      scannedAt: new Date(),
    }
  } catch (error) {
    console.error('Google Safe Browsing scan error:', error)
    return {
      service: 'google-safe-browsing',
      result: 'uncertain',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      scannedAt: new Date(),
    }
  }
}