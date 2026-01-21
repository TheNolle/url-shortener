import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import prisma from '@/lib/database'
import { getClientIp } from '@/lib/utils'
import { invalidateCache } from '@/lib/cache'

const reportSchema = z.object({
  shortCode: z.string().min(1).max(20),
  reason: z.string().min(10).max(500),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = reportSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.stack },
        { status: 400 }
      )
    }

    const { shortCode, reason } = validation.data
    const { userId } = await auth()
    const ip = getClientIp(req.headers)

    const url = await prisma.url.findUnique({
      where: { shortCode },
      include: { userUrls: true },
    })

    if (!url) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 })
    }

    if (userId) {
      const ownsUrl = url.userUrls.some(userUrl => userUrl.userId === userId)
      if (ownsUrl) {
        return NextResponse.json(
          { error: 'You cannot report your own URLs' },
          { status: 403 }
        )
      }
    }

    const existingReport = await prisma.report.findFirst({
      where: {
        urlId: url.id,
        reportedBy: userId || ip,
      },
    })

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this URL' },
        { status: 409 }
      )
    }

    await prisma.report.create({
      data: {
        urlId: url.id,
        reportedBy: userId || ip,
        reason,
        status: 'PENDING',
      },
    })

    const reportCount = await prisma.report.count({
      where: { urlId: url.id },
    })

    const threshold = parseInt(process.env.REPORT_AUTO_FLAG_THRESHOLD || '5')

    if (reportCount >= threshold && !url.isFlagged) {
      await prisma.url.update({
        where: { id: url.id },
        data: {
          isFlagged: true,
          isActive: false,
          flagReason: `Auto-flagged after ${reportCount} reports`,
        },
      })

      await invalidateCache(shortCode)
    }

    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully',
      reportCount,
      autoFlagged: reportCount >= threshold,
    })
  } catch (error) {
    console.error('Report API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}