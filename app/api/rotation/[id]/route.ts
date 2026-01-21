import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { updateRotationLink, deleteRotationLink } from '@/lib/rotation'
import prisma from '@/lib/database'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const rotationLink = await prisma.rotationLink.findUnique({
      where: { id },
      include: {
        url: {
          include: { userUrls: true },
        },
      },
    })

    if (!rotationLink) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const isOwner = rotationLink.url.userUrls.some((u) => u.userId === userId)
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const success = await updateRotationLink(id, body)

    if (!success) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update rotation link error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const rotationLink = await prisma.rotationLink.findUnique({
      where: { id },
      include: {
        url: {
          include: { userUrls: true },
        },
      },
    })

    if (!rotationLink) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const isOwner = rotationLink.url.userUrls.some((u) => u.userId === userId)
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const success = await deleteRotationLink(id)

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete rotation link error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
