import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { performHealthCheck } from '@/lib/health-monitor'
import prisma from '@/lib/database'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const url = await prisma.url.findUnique({
      where: { id },
      include: { userUrls: true },
    })

    if (!url || !url.userUrls.some((u) => u.userId === userId)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await performHealthCheck(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
