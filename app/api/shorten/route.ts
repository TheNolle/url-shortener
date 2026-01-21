import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { createShortUrl } from '@/lib/shortener'
import { validateUrl } from '@/lib/security/url-validator'
import { checkRateLimit } from '@/lib/rate-limiter'
import { isValidUrl, getClientIp } from '@/lib/utils'

const shortenSchema = z.object({
  url: z.url().max(2048),
  customExpiry: z.iso.datetime().optional(),
  password: z.string().min(6).max(128).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = shortenSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.stack },
        { status: 400 }
      )
    }

    const { url, customExpiry, password } = validation.data

    if (!isValidUrl(url)) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    const { userId } = await auth()
    const isAuthenticated = !!userId

    if (password && !isAuthenticated) {
      return NextResponse.json(
        { error: 'Password protection requires authentication' },
        { status: 403 }
      )
    }

    const ip = getClientIp(request.headers)
    const identifier = userId || ip
    const rateLimit = await checkRateLimit(identifier, isAuthenticated)

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          limit: rateLimit.limit,
          reset: rateLimit.reset,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.reset.toString(),
          },
        }
      )
    }

    const securityCheck = await validateUrl(url)

    if (!securityCheck.isSafe) {
      return NextResponse.json(
        {
          error: 'URL failed security validation',
          reason: securityCheck.reason,
          scans: securityCheck.scans.map(s => ({
            service: s.service,
            result: s.result,
          })),
        },
        { status: 403 }
      )
    }

    const result = await createShortUrl({
      originalUrl: url,
      userId: userId || null,
      customExpiry: customExpiry ? new Date(customExpiry) : null,
      isAuthenticated,
      password,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(
      {
        success: true,
        shortCode: result.shortCode,
        shortUrl: result.shortUrl,
        isNew: result.isNew,
        expiresAt: !isAuthenticated ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
        securityScans: securityCheck.scans.map(s => ({
          service: s.service,
          result: s.result,
        })),
      },
      {
        status: 201,
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.reset.toString(),
        },
      }
    )
  } catch (error) {
    console.error('Shorten API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}