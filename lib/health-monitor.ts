import prisma from './database'

export type HealthStatus = 'HEALTHY' | 'WARNING' | 'BROKEN' | 'UNKNOWN'

export interface HealthCheckResult {
  status: HealthStatus
  statusCode?: number
  responseTime?: number
  error?: string
}

export async function checkUrlHealth(url: string): Promise<HealthCheckResult> {
  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'S-URL-Shortener/1.0 (Health Monitor)',
      },
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeoutId)
    const responseTime = Date.now() - startTime

    let status: HealthStatus
    if (response.status >= 200 && response.status < 300) {
      status = 'HEALTHY'
    } else if (response.status >= 300 && response.status < 400) {
      status = 'HEALTHY'
    } else if (response.status === 429 || response.status === 503) {
      status = 'WARNING'
    } else {
      status = 'BROKEN'
    }

    return {
      status,
      statusCode: response.status,
      responseTime,
    }
  } catch (error) {
    const responseTime = Date.now() - startTime

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          status: 'WARNING',
          responseTime,
          error: 'Request timeout (10s)',
        }
      }

      return {
        status: 'BROKEN',
        responseTime,
        error: error.message,
      }
    }

    return {
      status: 'BROKEN',
      responseTime,
      error: 'Unknown error',
    }
  }
}

export async function performHealthCheck(urlId: string): Promise<void> {
  try {
    const url = await prisma.url.findUnique({
      where: { id: urlId },
      include: { rotationLinks: true },
    })

    if (!url) return

    const targetUrl = url.isRotation && url.rotationLinks.length > 0
      ? url.rotationLinks[0].destination
      : url.originalUrl

    const result = await checkUrlHealth(targetUrl)

    await prisma.healthCheck.create({
      data: {
        urlId: url.id,
        statusCode: result.statusCode,
        responseTime: result.responseTime,
        status: result.status,
        errorMessage: result.error,
      },
    })

    await prisma.url.update({
      where: { id: url.id },
      data: {
        lastHealthCheck: new Date(),
        healthStatus: result.status,
        lastStatusCode: result.statusCode,
        healthCheckError: result.error,
      },
    })

    if (result.status === 'BROKEN') {
      const recentChecks = await prisma.healthCheck.findMany({
        where: { urlId: url.id },
        orderBy: { checkedAt: 'desc' },
        take: 3,
      })

      if (recentChecks.length === 3 && recentChecks.every((c) => c.status === 'BROKEN')) {
        await prisma.url.update({
          where: { id: url.id },
          data: {
            isFlagged: true,
            flagReason: 'Automatically flagged: destination URL is broken',
          },
        })
      }
    }
  } catch (error) {
    console.error('Health check error:', error)
  }
}

export async function runHealthCheckBatch(limit: number = 50): Promise<void> {
  try {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000)

    const urlsToCheck = await prisma.url.findMany({
      where: {
        isActive: true,
        isFlagged: false,
        OR: [
          { lastHealthCheck: null },
          { lastHealthCheck: { lt: sixHoursAgo } },
        ],
      },
      orderBy: { lastHealthCheck: 'asc' },
      take: limit,
    })

    console.log(`Running health checks on ${urlsToCheck.length} URLs...`)

    const batchSize = 10
    for (let i = 0; i < urlsToCheck.length; i += batchSize) {
      const batch = urlsToCheck.slice(i, i + batchSize)
      await Promise.all(batch.map((url) => performHealthCheck(url.id)))

      if (i + batchSize < urlsToCheck.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    console.log(`Health check batch complete!`)
  } catch (error) {
    console.error('Health check batch error:', error)
  }
}

export async function getUrlHealthHistory(urlId: string) {
  try {
    const healthChecks = await prisma.healthCheck.findMany({
      where: { urlId },
      orderBy: { checkedAt: 'desc' },
      take: 30,
    })

    const stats = {
      total: healthChecks.length,
      healthy: healthChecks.filter((c) => c.status === 'HEALTHY').length,
      warning: healthChecks.filter((c) => c.status === 'WARNING').length,
      broken: healthChecks.filter((c) => c.status === 'BROKEN').length,
      avgResponseTime: healthChecks.length > 0
        ? Math.round(
          healthChecks.reduce((sum, c) => sum + (c.responseTime || 0), 0) /
          healthChecks.length
        )
        : 0,
      uptime: healthChecks.length > 0
        ? ((healthChecks.filter((c) => c.status === 'HEALTHY').length / healthChecks.length) * 100).toFixed(1)
        : '100.0',
    }

    return {
      checks: healthChecks,
      stats,
    }
  } catch (error) {
    console.error('Get health history error:', error)
    return null
  }
}

export async function getBrokenUrls(userId?: string) {
  try {
    const where: any = {
      healthStatus: { in: ['BROKEN', 'WARNING'] },
      isActive: true,
    }

    if (userId) {
      where.userUrls = {
        some: { userId },
      }
    }

    const urls = await prisma.url.findMany({
      where,
      include: {
        analytics: true,
      },
      orderBy: { lastHealthCheck: 'desc' },
      take: 50,
    })

    return urls.map((url) => ({
      id: url.id,
      shortCode: url.shortCode,
      originalUrl: url.originalUrl,
      healthStatus: url.healthStatus,
      lastStatusCode: url.lastStatusCode,
      healthCheckError: url.healthCheckError,
      lastHealthCheck: url.lastHealthCheck,
      clicks: url.analytics[0]?.clicks || 0,
    }))
  } catch (error) {
    console.error('Get broken URLs error:', error)
    return []
  }
}
