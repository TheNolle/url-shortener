import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRequest, logApiRequest } from '@/lib/api-auth'
import { getUrlByShortCode, deleteUserUrl } from '@/lib/shortener'
import { getUrlAnalytics } from '@/lib/analytics'

interface RouteContext {
  params: Promise<{ code: string }>
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const auth = await authenticateApiRequest(request)

  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { apiKeyId } = auth
  const { code } = await params

  try {
    const url = await getUrlByShortCode(code)

    if (!url) {
      await logApiRequest(request, apiKeyId, 404)
      return NextResponse.json({ error: 'URL not found' }, { status: 404 })
    }

    const analytics = await getUrlAnalytics(code)

    await logApiRequest(request, apiKeyId, 200)

    return NextResponse.json({
      success: true,
      data: {
        shortCode: url.shortCode,
        originalUrl: url.originalUrl,
        createdAt: url.createdAt,
        expiresAt: url.expiresAt,
        isActive: url.isActive,
        clicks: analytics?.clicks || 0,
        lastClick: analytics?.lastClick,
      },
    })
  } catch (error) {
    console.error('API get URL error:', error)
    await logApiRequest(request, apiKeyId, 500)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const auth = await authenticateApiRequest(request)

  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { userId, apiKeyId } = auth
  const { code } = await params

  try {
    const success = await deleteUserUrl(code, userId)

    if (!success) {
      await logApiRequest(request, apiKeyId, 404)
      return NextResponse.json({ error: 'URL not found or access denied' }, { status: 404 })
    }

    await logApiRequest(request, apiKeyId, 200)

    return NextResponse.json({ success: true, message: 'URL deleted successfully' })
  } catch (error) {
    console.error('API delete URL error:', error)
    await logApiRequest(request, apiKeyId, 500)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
