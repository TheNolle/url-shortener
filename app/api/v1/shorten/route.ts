import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRequest, logApiRequest } from '@/lib/api-auth'
import { createShortUrl } from '@/lib/shortener'
import { validateUrl } from '@/lib/security/url-validator'
import { isValidUrl } from '@/lib/utils'
import { z } from 'zod'

const shortenSchema = z.object({
  url: z.string().url().max(2048),
  password: z.string().min(6).max(128).optional(),
  expiresInDays: z.number().min(1).max(365).optional(),
})

export async function POST(request: NextRequest) {
  const auth = await authenticateApiRequest(request)

  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { userId, apiKeyId, bypassSecurity } = auth

  try {
    const body = await request.json()
    const validation = shortenSchema.safeParse(body)

    if (!validation.success) {
      await logApiRequest(request, apiKeyId, 400)
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.stack },
        { status: 400 }
      )
    }

    const { url, password, expiresInDays } = validation.data

    if (!isValidUrl(url)) {
      await logApiRequest(request, apiKeyId, 400)
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    if (!bypassSecurity) {
      const securityCheck = await validateUrl(url)

      if (!securityCheck.isSafe) {
        await logApiRequest(request, apiKeyId, 403)
        return NextResponse.json(
          {
            error: 'URL failed security validation',
            reason: securityCheck.reason,
          },
          { status: 403 }
        )
      }
    }

    const customExpiry = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null

    const result = await createShortUrl({
      originalUrl: url,
      userId,
      customExpiry,
      isAuthenticated: true,
      password,
    })

    if (!result.success) {
      await logApiRequest(request, apiKeyId, 500)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    await logApiRequest(request, apiKeyId, 201)

    return NextResponse.json({
      success: true,
      data: {
        shortCode: result.shortCode,
        shortUrl: result.shortUrl,
        originalUrl: url,
        isNew: result.isNew,
        expiresAt: customExpiry,
        isPasswordProtected: !!password,
        securityBypass: bypassSecurity,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('API shorten error:', error)
    await logApiRequest(request, apiKeyId, 500)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}