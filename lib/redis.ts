import Redis from 'ioredis'

declare global {
  var redis: Redis | undefined
}

const getRedisClient = (): Redis => {
  if (global.redis) return global.redis

  const redis = new Redis(String(process.env.REDIS_URL), {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000)
      return delay
    },
    lazyConnect: true,
  })

  redis.on('error', (error) => console.error('Redis Client Error', error))
  redis.on('connect', () => console.log('Redis client connected'))

  if (process.env.NODE_ENV !== 'production') global.redis = redis

  return redis
}

const redis = getRedisClient()
export default redis