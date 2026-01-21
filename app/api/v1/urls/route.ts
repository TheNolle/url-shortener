import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRequest, logApiRequest } from '@/lib/api-auth'
import { getUserUrls } from '@/lib/analytics'

export async function GET(request: NextRequest) {
  const auth = await authenticateApiRequest(request)

  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { userId, apiKeyId } = auth

  try {
    const urls = await getUserUrls(userId)

    await logApiRequest(request, apiKeyId, 200)

    return NextResponse.json({
      success: true,
      data: urls,
      count: urls.length,
    })
  } catch (error) {
    console.error('API get URLs error:', error)
    await logApiRequest(request, apiKeyId, 500)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
