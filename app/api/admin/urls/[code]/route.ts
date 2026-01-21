import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { isAdmin } from '@/lib/utils'
import { adminDeleteUrl } from '@/lib/shortener'

interface RouteContext {
  params: Promise<{ code: string }>
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await auth()

    if (!userId || !isAdmin(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { code } = await params

    const success = await adminDeleteUrl(code)

    if (!success) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin delete URL error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
