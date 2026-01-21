import { RateLimitResult } from '@/types'
import prisma from './database'
import redis from './redis'

const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10')
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000')

export async function checkRateLimit(identifier: string, isAuthenticated: boolean = false): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`
  const now = Date.now()

  try {
    const bannedIp = await prisma.bannedIp.findUnique({ where: { ip: identifier } })

    if (bannedIp) {
      return {
        success: false,
        limit: 0,
        remaining: 0,
        reset: 0,
      }
    }

    const limit = isAuthenticated ? MAX_REQUESTS * 5 : MAX_REQUESTS

    const requests = await redis.lrange(key, 0, -1)
    const validRequests = requests.map(request => parseInt(request)).filter(timestamp => now - timestamp < WINDOW_MS)

    if (validRequests.length >= limit) {
      const oldestRequest = Math.min(...validRequests)
      const resetTime = oldestRequest + WINDOW_MS

      return {
        success: false,
        limit,
        remaining: 0,
        reset: resetTime,
      }
    }

    await redis.lpush(key, now.toString())
    await redis.ltrim(key, 0, limit - 1)
    await redis.expire(key, Math.ceil(WINDOW_MS / 1000))

    return {
      success: true,
      limit,
      remaining: limit - validRequests.length - 1,
      reset: now + WINDOW_MS,
    }
  } catch (error) {
    console.error('Rate limit check error:', error)
    return {
      success: true,
      limit: MAX_REQUESTS,
      remaining: MAX_REQUESTS - 1,
      reset: now + WINDOW_MS,
    }
  }
}