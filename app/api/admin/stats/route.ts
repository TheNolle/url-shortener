import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getAdminStats } from '@/lib/analytics'
import { isAdmin } from '@/lib/utils'

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId || !isAdmin(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const stats = await getAdminStats()

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Admin stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}