import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUrlAnalytics } from '@/lib/analytics'
import prisma from '@/lib/database'

interface RouteContext {
  params: Promise<{ code: string }>
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { code } = await params
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = await prisma.url.findUnique({
      where: { shortCode: code },
      include: {
        userUrls: {
          where: { userId },
        },
      },
    })

    if (!url || url.userUrls.length === 0) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 })
    }

    const analytics = await getUrlAnalytics(code)

    if (!analytics) {
      return NextResponse.json({ error: 'Analytics not found' }, { status: 404 })
    }

    return NextResponse.json({
      shortCode: code,
      originalUrl: url.originalUrl,
      clicks: analytics.clicks,
      lastClick: analytics.lastClick,
      createdAt: url.createdAt,
      expiresAt: url.expiresAt,
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
