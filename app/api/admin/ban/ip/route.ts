import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { isAdmin } from '@/lib/utils'
import prisma from '@/lib/database'
import { z } from 'zod'

const banIpSchema = z.object({
  ip: z.string().min(7).max(45),
  reason: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId || !isAdmin(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const validation = banIpSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    const { ip, reason } = validation.data

    await prisma.bannedIp.create({
      data: {
        ip,
        reason: reason || 'Manual ban by admin',
        bannedBy: userId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ban IP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId || !isAdmin(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    await prisma.bannedIp.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unban IP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId || !isAdmin(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const bannedIps = await prisma.bannedIp.findMany({
      orderBy: { bannedAt: 'desc' },
    })

    return NextResponse.json({ bannedIps })
  } catch (error) {
    console.error('Get banned IPs error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}