import redis from './redis'
import { UrlData } from '@/types'

const IN_MEMORY_CACHE = new Map<string, { data: UrlData; timestamp: number }>()
const MAX_MEMORY_CACHE_SIZE = 1000
const MEMORY_CACHE_TTL = 300000
const REDIS_CACHE_TTL = 86400

export async function getCachedUrl(shortCode: string): Promise<UrlData | null> {
  const memoryCache = IN_MEMORY_CACHE.get(shortCode)
  if (memoryCache) {
    const age = Date.now() - memoryCache.timestamp
    if (age < MEMORY_CACHE_TTL) {
      return memoryCache.data
    }
    IN_MEMORY_CACHE.delete(shortCode)
  }

  try {
    const cached = await redis.get(`url:${shortCode}`)
    if (cached) {
      const data: UrlData = JSON.parse(cached)
      setMemoryCache(shortCode, data)
      return data
    }
  } catch (error) {
    console.error('Redis cache read error:', error)
  }

  return null
}

export async function setCachedUrl(shortCode: string, data: UrlData): Promise<void> {
  setMemoryCache(shortCode, data)

  try {
    await redis.setex(`url:${shortCode}`, REDIS_CACHE_TTL, JSON.stringify(data))
  } catch (error) {
    console.error('Redis cache write error:', error)
  }
}

export async function invalidateCache(shortCode: string): Promise<void> {
  IN_MEMORY_CACHE.delete(shortCode)
  try {
    await redis.del(`url:${shortCode}`)
  } catch (error) {
    console.error('Redis cache invalidation error:', error)
  }
}

function setMemoryCache(shortCode: string, data: UrlData): void {
  if (IN_MEMORY_CACHE.size >= MAX_MEMORY_CACHE_SIZE) {
    const firstKey = IN_MEMORY_CACHE.keys().next().value
    if (!firstKey) return
    IN_MEMORY_CACHE.delete(firstKey)
  }

  IN_MEMORY_CACHE.set(shortCode, {
    data,
    timestamp: Date.now(),
  })
}

export async function incrementClickCount(shortCode: string): Promise<void> {
  try {
    await redis.incr(`clicks:${shortCode}`)
  } catch (error) {
    console.error('Click count increment error:', error)
  }
}