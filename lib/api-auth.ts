import { NextRequest } from 'next/server'
import { validateApiKey, checkApiKeyRateLimit, logApiKeyUsage } from './api-keys'

export async function authenticateApiRequest(
  request: NextRequest
): Promise<{
  userId: string
  apiKeyId: string
  bypassSecurity: boolean
  bypassRateLimit: boolean
} | { error: string; status: number }> {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid authorization header', status: 401 }
  }

  const apiKey = authHeader.substring(7)

  const auth = await validateApiKey(apiKey)

  if (!auth) {
    return { error: 'Invalid or expired API key', status: 401 }
  }

  if (!auth.bypassRateLimit) {
    const rateLimit = await checkApiKeyRateLimit(auth.apiKeyId, auth.bypassRateLimit)

    if (!rateLimit.allowed) {
      return { error: 'Rate limit exceeded', status: 429 }
    }
  }

  return auth
}

export async function logApiRequest(
  request: NextRequest,
  apiKeyId: string,
  status: number
) {
  const url = new URL(request.url)
  const endpoint = url.pathname
  const method = request.method
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'

  await logApiKeyUsage(apiKeyId, endpoint, method, status, ipAddress)
}