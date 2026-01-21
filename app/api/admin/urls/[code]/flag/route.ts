import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { isAdmin } from '@/lib/utils'
import prisma from '@/lib/database'
import { invalidateCache } from '@/lib/cache'

interface RouteContext {
  params: Promise<{ code: string }>
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await auth()

    if (!userId || !isAdmin(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { code } = await params
    const { flag } = await request.json()

    await prisma.url.update({
      where: { shortCode: code },
      data: {
        isFlagged: flag,
        isActive: !flag,
        flagReason: flag ? 'Manually flagged by admin' : null,
      },
    })

    await invalidateCache(code)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Flag URL error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
