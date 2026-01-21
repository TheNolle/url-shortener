import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { isAdmin } from '@/lib/utils'
import prisma from '@/lib/database'
import { z } from 'zod'

const banDomainSchema = z.object({
  domain: z.string().min(3).max(255),
  reason: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId || !isAdmin(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const validation = banDomainSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    const { domain, reason } = validation.data

    await prisma.bannedDomain.create({
      data: {
        domain: domain.toLowerCase(),
        reason: reason || 'Manual ban by admin',
        bannedBy: userId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Ban domain error:', error)
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

    await prisma.bannedDomain.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unban domain error:', error)
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

    const bannedDomains = await prisma.bannedDomain.findMany({
      orderBy: { bannedAt: 'desc' },
    })

    return NextResponse.json({ bannedDomains })
  } catch (error) {
    console.error('Get banned domains error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}