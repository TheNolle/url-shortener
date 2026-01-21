import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/database'
import { verifyPassword } from '@/lib/utils'
import { cookies } from 'next/headers'

interface RouteContext {
  params: Promise<{ code: string }>
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { code } = await params
    const body = await request.json()
    const { password } = body

    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 })
    }

    const url = await prisma.url.findUnique({
      where: { shortCode: code },
    })

    if (!url || !url.isActive) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 })
    }

    if (!url.isPasswordProtected || !url.passwordHash) {
      return NextResponse.json({ error: 'URL is not password protected' }, { status: 400 })
    }

    const isValid = await verifyPassword(password, url.passwordHash)

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const cookieStore = await cookies()
    cookieStore.set(`url_auth_${code}`, 'verified', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Password verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}