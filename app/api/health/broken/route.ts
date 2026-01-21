import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getBrokenUrls } from '@/lib/health-monitor'

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const urls = await getBrokenUrls(userId)

    return NextResponse.json({ urls })
  } catch (error) {
    console.error('Get broken URLs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
