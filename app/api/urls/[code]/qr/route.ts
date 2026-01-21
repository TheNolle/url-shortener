import { NextRequest, NextResponse } from 'next/server'
import { generateQRCodeBuffer } from '@/lib/qr-code'
import prisma from '@/lib/database'

interface RouteContext {
  params: Promise<{ code: string }>
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { code } = await params

    const url = await prisma.url.findUnique({
      where: { shortCode: code },
    })

    if (!url || !url.isActive) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 })
    }

    const shortUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${code}`
    const qrCodeBuffer = await generateQRCodeBuffer(shortUrl)

    return new NextResponse(new Uint8Array(qrCodeBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="qr-${code}.png"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('QR code API error:', error)
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 })
  }
}
