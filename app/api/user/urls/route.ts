import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserUrls } from '@/lib/analytics'
import { deleteUserUrl } from '@/lib/shortener'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const urls = await getUserUrls(userId)

    return NextResponse.json({ urls })
  } catch (error) {
    console.error('Get user URLs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const shortCode = searchParams.get('code')

    if (!shortCode) {
      return NextResponse.json({ error: 'Short code required' }, { status: 400 })
    }

    const success = await deleteUserUrl(shortCode, userId)

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete URL' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user URL error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}