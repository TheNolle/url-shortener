import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import prisma from '@/lib/database'
import { invalidateCache } from '@/lib/cache'

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

if (!webhookSecret) {
  throw new Error('Please add CLERK_WEBHOOK_SECRET to .env')
}

type ClerkWebhookEvent = {
  type: string
  data: {
    id: string
    email_addresses?: Array<{ email_address: string }>
    username?: string
    first_name?: string
    last_name?: string
    created_at?: number
    updated_at?: number
  }
}

export async function POST(req: NextRequest) {
  try {
    const headerPayload = await headers()
    const svixId = headerPayload.get('svix-id')
    const svixTimestamp = headerPayload.get('svix-timestamp')
    const svixSignature = headerPayload.get('svix-signature')

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json(
        { error: 'Missing svix headers' },
        { status: 400 }
      )
    }

    const payload = await req.json()
    const body = JSON.stringify(payload)

    const wh = new Webhook(webhookSecret!)

    let evt: ClerkWebhookEvent

    try {
      evt = wh.verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ClerkWebhookEvent
    } catch (err) {
      console.error('Webhook verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const { type, data } = evt
    const userId = data.id

    console.log(`Clerk Webhook: ${type} for user ${userId}`)

    switch (type) {
      case 'user.created':
        console.log(`New user signed up: ${userId}`)
        break

      case 'user.updated':
        console.log(`User updated: ${userId}`)
        break

      case 'user.deleted':
        await handleUserDeletion(userId)
        console.log(`User deleted and cleaned up: ${userId}`)
        break

      default:
        console.log(`Unhandled webhook type: ${type}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleUserDeletion(userId: string) {
  try {
    const userUrls = await prisma.userUrl.findMany({
      where: { userId },
      include: { url: true },
    })

    for (const userUrl of userUrls) {
      await prisma.userUrl.delete({
        where: { id: userUrl.id },
      })

      const remainingOwners = await prisma.userUrl.count({
        where: { urlId: userUrl.urlId },
      })

      if (remainingOwners === 0) {
        await prisma.url.update({
          where: { id: userUrl.urlId },
          data: { isActive: false },
        })

        await invalidateCache(userUrl.url.shortCode)
      }
    }

    console.log(`🗑️ Cleaned up ${userUrls.length} URLs for user ${userId}`)
  } catch (error) {
    console.error('Error handling user deletion:', error)
    throw error
  }
}