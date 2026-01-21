import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDetailedAnalytics } from '@/lib/analytics'

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

    const analytics = await getDetailedAnalytics(code, userId)

    if (!analytics) {
      return NextResponse.json({ error: 'URL not found or access denied' }, { status: 404 })
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}