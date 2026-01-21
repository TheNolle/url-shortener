import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/database'
import { scrapeAndSaveMetadata } from '@/lib/metadata-scraper'

export const runtime = 'nodejs'

interface RouteContext {
  params: Promise<{ code: string }>
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { code } = await params

    const url = await prisma.url.findUnique({
      where: { shortCode: code },
      include: { metadata: true },
    })

    if (!url) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 })
    }

    if (url.metadata) {
      const age = Date.now() - url.metadata.scrapedAt.getTime()
      const sevenDays = 7 * 24 * 60 * 60 * 1000

      if (age < sevenDays) {
        return NextResponse.json({
          success: true,
          metadata: {
            title: url.metadata.title,
            description: url.metadata.description,
            image: url.metadata.image,
            logo: url.metadata.logo,
            author: url.metadata.author,
            publisher: url.metadata.publisher,
            date: url.metadata.date,
            favicon: url.metadata.favicon,
            scrapedAt: url.metadata.scrapedAt,
          },
          cached: true,
        })
      }
    }

    const metadata = await scrapeAndSaveMetadata(url.id, url.originalUrl)

    if (!metadata) {
      return NextResponse.json(
        { error: 'Failed to fetch metadata' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      metadata,
      cached: false,
    })
  } catch (error) {
    console.error('Metadata API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const { code } = await params

    const url = await prisma.url.findUnique({
      where: { shortCode: code },
    })

    if (!url) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 })
    }

    const metadata = await scrapeAndSaveMetadata(url.id, url.originalUrl)

    if (!metadata) {
      return NextResponse.json(
        { error: 'Failed to fetch metadata' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      metadata,
      refreshed: true,
    })
  } catch (error) {
    console.error('Metadata refresh error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
