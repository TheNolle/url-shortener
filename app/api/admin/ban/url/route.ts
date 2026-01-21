import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { isAdmin } from '@/lib/utils'
import prisma from '@/lib/database'
import { z } from 'zod'
import { invalidateCache } from '@/lib/cache'

const banUrlSchema = z.object({
  shortCode: z.string(),
  reason: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId || !isAdmin(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const validation = banUrlSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    const { shortCode, reason } = validation.data

    await prisma.url.update({
      where: { shortCode },
      data: {
        isFlagged: true,
        isActive: false,
        flagReason: reason || 'Manually flagged by admin',
      },
    })

    await invalidateCache(shortCode)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ban URL error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
