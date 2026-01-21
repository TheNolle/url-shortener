import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateApiKey, getUserApiKeys, revokeApiKey } from '@/lib/api-keys'
import { isAdmin } from '@/lib/utils'
import { z } from 'zod'

const createKeySchema = z.object({
  name: z.string().min(1).max(100),
  expiresInDays: z.number().min(1).max(365).optional(),
  rateLimit: z.number().min(100).max(10000).optional(),
  bypassSecurity: z.boolean().optional(),
  bypassRateLimit: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKeys = await getUserApiKeys(userId)

    return NextResponse.json({ apiKeys })
  } catch (error) {
    console.error('Get API keys error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = createKeySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.stack },
        { status: 400 }
      )
    }

    const { name, expiresInDays, rateLimit, bypassSecurity, bypassRateLimit } = validation.data

    if ((bypassSecurity || bypassRateLimit) && !isAdmin(userId)) {
      return NextResponse.json(
        { error: 'Only administrators can create privileged API keys' },
        { status: 403 }
      )
    }

    const existingKeys = await getUserApiKeys(userId)
    if (existingKeys.length >= 10) {
      return NextResponse.json(
        { error: 'Maximum of 10 API keys allowed per user' },
        { status: 400 }
      )
    }

    const apiKey = await generateApiKey({
      userId,
      name,
      expiresInDays,
      rateLimit,
      bypassSecurity,
      bypassRateLimit,
    })

    return NextResponse.json({
      success: true,
      apiKey: {
        id: apiKey.id,
        key: apiKey.key,
        keyPrefix: apiKey.keyPrefix,
        name: apiKey.name,
        createdAt: apiKey.createdAt,
        expiresAt: apiKey.expiresAt,
        rateLimit: apiKey.rateLimit,
        bypassSecurity: apiKey.bypassSecurity,
        bypassRateLimit: apiKey.bypassRateLimit,
      },
      warning: 'Save this key now. You will not be able to see it again!',
    })
  } catch (error) {
    console.error('Create API key error:', error)

    if (error instanceof Error && error.message.includes('Only administrators')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

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
    const keyId = searchParams.get('id')

    if (!keyId) {
      return NextResponse.json({ error: 'Key ID required' }, { status: 400 })
    }

    const success = await revokeApiKey(keyId, userId)

    if (!success) {
      return NextResponse.json({ error: 'Failed to revoke key' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Revoke API key error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}