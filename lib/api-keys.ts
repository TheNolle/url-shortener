import crypto from 'crypto'
import prisma from './database'
import { isAdmin } from './utils'

export interface CreateApiKeyOptions {
  userId: string
  name: string
  expiresInDays?: number
  rateLimit?: number
  bypassSecurity?: boolean
  bypassRateLimit?: boolean
}

export interface ApiKeyResult {
  id: string
  key: string
  keyPrefix: string
  name: string
  createdAt: Date
  expiresAt: Date | null
  rateLimit: number
  bypassSecurity: boolean
  bypassRateLimit: boolean
}

export async function generateApiKey(options: CreateApiKeyOptions): Promise<ApiKeyResult> {
  const { userId, name, expiresInDays, rateLimit = 1000, bypassSecurity = false, bypassRateLimit = false } = options

  if ((bypassSecurity || bypassRateLimit) && !isAdmin(userId)) {
    throw new Error('Only administrators can create privileged API keys')
  }

  const randomBytes = crypto.randomBytes(32)
  const key = `sk_live_${randomBytes.toString('base64url')}`
  const keyPrefix = key.substring(0, 15)
  const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null

  const apiKey = await prisma.apiKey.create({
    data: {
      userId,
      name,
      key: await hashApiKey(key),
      keyPrefix,
      isActive: true,
      expiresAt,
      rateLimit,
      bypassSecurity,
      bypassRateLimit,
    },
  })

  return {
    id: apiKey.id,
    key,
    keyPrefix: apiKey.keyPrefix,
    name: apiKey.name,
    createdAt: apiKey.createdAt,
    expiresAt: apiKey.expiresAt,
    rateLimit: apiKey.rateLimit,
    bypassSecurity: apiKey.bypassSecurity,
    bypassRateLimit: apiKey.bypassRateLimit,
  }
}

export async function hashApiKey(key: string): Promise<string> {
  return crypto.createHash('sha256').update(key).digest('hex')
}

export async function validateApiKey(key: string): Promise<{
  userId: string
  apiKeyId: string
  bypassSecurity: boolean
  bypassRateLimit: boolean
} | null> {
  try {
    const hashedKey = await hashApiKey(key)

    const apiKey = await prisma.apiKey.findUnique({
      where: { key: hashedKey },
    })

    if (!apiKey || !apiKey.isActive) return null

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { isActive: false },
      })
      return null
    }

    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsed: new Date() },
    })

    return {
      userId: apiKey.userId,
      apiKeyId: apiKey.id,
      bypassSecurity: apiKey.bypassSecurity,
      bypassRateLimit: apiKey.bypassRateLimit,
    }
  } catch (error) {
    console.error('API key validation error:', error)
    return null
  }
}

export async function revokeApiKey(keyId: string, userId: string): Promise<boolean> {
  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
    })

    if (!apiKey || apiKey.userId !== userId) return false

    await prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    })

    return true
  } catch (error) {
    console.error('Revoke API key error:', error)
    return false
  }
}

export async function getUserApiKeys(userId: string) {
  return await prisma.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      isActive: true,
      createdAt: true,
      lastUsed: true,
      expiresAt: true,
      rateLimit: true,
      requestCount: true,
      bypassSecurity: true,
      bypassRateLimit: true,
    },
  })
}

export async function logApiKeyUsage(
  apiKeyId: string,
  endpoint: string,
  method: string,
  status: number,
  ipAddress?: string
) {
  try {
    await prisma.apiKeyUsage.create({
      data: {
        apiKeyId,
        endpoint,
        method,
        status,
        ipAddress,
      },
    })

    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { requestCount: { increment: 1 } },
    })
  } catch (error) {
    console.error('Log API key usage error:', error)
  }
}

export async function checkApiKeyRateLimit(
  apiKeyId: string,
  bypassRateLimit: boolean
): Promise<{ allowed: boolean; limit: number; remaining: number }> {
  if (bypassRateLimit) {
    return { allowed: true, limit: 999999, remaining: 999999 }
  }

  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: apiKeyId },
    })

    if (!apiKey) {
      return { allowed: false, limit: 0, remaining: 0 }
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const usageCount = await prisma.apiKeyUsage.count({
      where: {
        apiKeyId,
        timestamp: { gte: oneHourAgo },
      },
    })

    const remaining = Math.max(0, apiKey.rateLimit - usageCount)
    const allowed = usageCount < apiKey.rateLimit

    return {
      allowed,
      limit: apiKey.rateLimit,
      remaining,
    }
  } catch (error) {
    console.error('Check API key rate limit error:', error)
    return { allowed: false, limit: 0, remaining: 0 }
  }
}
