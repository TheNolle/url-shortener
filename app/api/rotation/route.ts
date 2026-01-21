import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createRotationUrl } from '@/lib/rotation'
import { customAlphabet } from 'nanoid'
import { z } from 'zod'

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const generateShortCode = customAlphabet(alphabet, 7)

const rotationSchema = z.object({
  links: z.array(
    z.object({
      url: z.string().url(),
      weight: z.number().min(1).optional(),
      label: z.string().optional(),
    })
  ).min(2),
  rotationType: z.enum(['RANDOM', 'WEIGHTED', 'SEQUENTIAL']),
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    const body = await request.json()
    const validation = rotationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.stack },
        { status: 400 }
      )
    }

    const { links, rotationType } = validation.data
    const shortCode = generateShortCode()

    const result = await createRotationUrl(
      shortCode,
      links,
      rotationType,
      userId || undefined
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      shortUrl: result.shortUrl,
      shortCode,
      rotationType,
      linksCount: links.length,
    })
  } catch (error) {
    console.error('Rotation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
