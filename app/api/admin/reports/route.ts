import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { isAdmin } from '@/lib/utils'
import prisma from '@/lib/database'
import { z } from 'zod'
import { invalidateCache } from '@/lib/cache'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId || !isAdmin(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'PENDING'

    const reports = await prisma.report.findMany({
      where: { status: status as any },
      include: {
        url: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('Get reports error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

const reviewSchema = z.object({
  reportId: z.string(),
  action: z.enum(['approve', 'reject']),
})

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId || !isAdmin(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const validation = reviewSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    const { reportId, action } = validation.data

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { url: true },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const newStatus = action === 'approve' ? 'REVIEWED' : 'DISMISSED'

    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: newStatus,
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
    })

    if (action === 'approve') {
      await prisma.url.update({
        where: { id: report.urlId },
        data: {
          isFlagged: true,
          isActive: false,
          flagReason: `Manually flagged by admin: ${report.reason}`,
        },
      })

      await invalidateCache(report.url.shortCode)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Review report error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}