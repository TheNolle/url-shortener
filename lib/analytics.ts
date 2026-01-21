import prisma from './database'
import { AnalyticsData, AdminStats } from '@/types'

export interface TrackClickOptions {
  shortCode: string
  ip?: string
  userAgent?: string
  referer?: string
  country?: string
  city?: string
}

export async function trackClick({
  shortCode,
  ip,
  userAgent,
  referer,
}: {
  shortCode: string
  ip: string
  userAgent?: string
  referer?: string
}): Promise<void> {
  try {
    const url = await prisma.url.findUnique({
      where: { shortCode },
      include: { analytics: true },
    })

    if (!url) return

    let utmSource, utmMedium, utmCampaign
    if (referer) {
      try {
        const refUrl = new URL(referer)
        utmSource = refUrl.searchParams.get('utm_source')
        utmMedium = refUrl.searchParams.get('utm_medium')
        utmCampaign = refUrl.searchParams.get('utm_campaign')
      } catch (_e) {
      }
    }

    const clickData = {
      urlId: url.id,
      timestamp: new Date(),
      ipAddress: ip,
      userAgent: userAgent || 'Unknown',
      referer: referer || null,
      utmSource,
      utmMedium,
      utmCampaign,
    }

    const analyticsRecord = url.analytics[0]

    if (analyticsRecord) {
      await Promise.all([
        prisma.clickEvent.create({ data: clickData }),
        prisma.analytics.update({
          where: { id: analyticsRecord.id },
          data: {
            clicks: { increment: 1 },
            lastClick: new Date(),
          },
        }),
      ])
    } else {
      await Promise.all([
        prisma.clickEvent.create({ data: clickData }),
        prisma.analytics.create({
          data: {
            urlId: url.id,
            clicks: 1,
            lastClick: new Date(),
          },
        }),
      ])
    }
  } catch (error) {
    console.error('Track click error:', error)
  }
}

export async function getUrlAnalytics(shortCode: string): Promise<AnalyticsData | null> {
  try {
    const url = await prisma.url.findUnique({
      where: { shortCode },
      include: { analytics: true },
    })

    if (!url || !url.analytics[0]) return null

    return url.analytics[0] as AnalyticsData
  } catch (error) {
    console.error('Get URL analytics error:', error)
    return null
  }
}

export async function getDetailedAnalytics(shortCode: string, userId: string) {
  try {
    const url = await prisma.url.findUnique({
      where: { shortCode },
      include: {
        analytics: true,
        userUrls: { where: { userId } },
        clickEvents: {
          orderBy: { clickedAt: 'desc' },
          take: 100,
        },
      },
    })

    if (!url || url.userUrls.length === 0) return null

    const now = new Date()
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const clicksByDay = await prisma.clickEvent.groupBy({
      by: ['clickedAt'],
      where: {
        urlId: url.id,
        clickedAt: { gte: last30Days },
      },
      _count: { id: true },
    })

    const clicksByCountry = await prisma.clickEvent.groupBy({
      by: ['country'],
      where: { urlId: url.id },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    })

    const clicksByDevice = await prisma.clickEvent.groupBy({
      by: ['device'],
      where: { urlId: url.id },
      _count: { id: true },
    })

    const clicksByBrowser = await prisma.clickEvent.groupBy({
      by: ['browser'],
      where: { urlId: url.id },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    })

    const topReferrers = await prisma.clickEvent.groupBy({
      by: ['referer'],
      where: {
        urlId: url.id,
        referer: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    })

    const last7DaysClicks = await prisma.clickEvent.count({
      where: {
        urlId: url.id,
        clickedAt: { gte: last7Days },
      },
    })

    const last30DaysClicks = await prisma.clickEvent.count({
      where: {
        urlId: url.id,
        clickedAt: { gte: last30Days },
      },
    })

    return {
      url: {
        id: url.id,
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        createdAt: url.createdAt,
        expiresAt: url.expiresAt,
      },
      totalClicks: url.analytics[0]?.clicks || 0,
      last7DaysClicks,
      last30DaysClicks,
      lastClick: url.analytics[0]?.lastClick,
      clicksByDay: clicksByDay.map(item => ({
        date: item.clickedAt,
        count: item._count.id,
      })),
      clicksByCountry: clicksByCountry.map(item => ({
        country: item.country || 'Unknown',
        count: item._count.id,
      })),
      clicksByDevice: clicksByDevice.map(item => ({
        device: item.device || 'unknown',
        count: item._count.id,
      })),
      clicksByBrowser: clicksByBrowser.map(item => ({
        browser: item.browser || 'unknown',
        count: item._count.id,
      })),
      topReferrers: topReferrers.map(item => ({
        referer: item.referer || 'Direct',
        count: item._count.id,
      })),
      recentClicks: url.clickEvents.slice(0, 20).map(event => ({
        clickedAt: event.clickedAt,
        country: event.country,
        device: event.device,
        browser: event.browser,
        referer: event.referer,
      })),
    }
  } catch (error) {
    console.error('Get detailed analytics error:', error)
    return null
  }
}

export async function getUserUrls(userId: string): Promise<any[]> {
  try {
    const userUrls = await prisma.userUrl.findMany({
      where: { userId },
      include: {
        url: {
          include: {
            analytics: true,
            rotationLinks: {
              select: {
                id: true,
                destination: true,
                label: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return userUrls.map((userUrl) => ({
      id: userUrl.url.id,
      originalUrl: userUrl.url.originalUrl,
      shortCode: userUrl.url.shortCode,
      createdAt: userUrl.url.createdAt,
      expiresAt: userUrl.url.expiresAt,
      isActive: userUrl.url.isActive,
      isFlagged: userUrl.url.isFlagged,
      clicks: userUrl.url.analytics[0]?.clicks || 0,
      lastClick: userUrl.url.analytics[0]?.lastClick,
      isRotation: userUrl.url.isRotation,
      rotationType: userUrl.url.rotationType,
      rotationCount: userUrl.url.rotationLinks?.length || 0,
    }))
  } catch (error) {
    console.error('Get user URLs error:', error)
    return []
  }
}

export async function getAdminStats(): Promise<AdminStats> {
  try {
    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [
      totalUrls,
      deletedUrls,
      totalClicks,
      uniqueUsers,
      pendingReports,
      flaggedUrls,
      bannedIps,
      bannedDomains,
      last24hUrls,
      last24hClicksData,
    ] = await Promise.all([
      prisma.url.count({ where: { isActive: true } }),
      prisma.url.count({ where: { isActive: false } }),
      prisma.analytics.aggregate({ _sum: { clicks: true } }),
      prisma.userUrl.groupBy({ by: ['userId'] }),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.url.count({ where: { isFlagged: true } }),
      prisma.bannedIp.count(),
      prisma.bannedDomain.count(),
      prisma.url.count({ where: { createdAt: { gte: last24h } } }),
      prisma.analytics.aggregate({
        _sum: { clicks: true },
        where: { lastClick: { gte: last24h } },
      }),
    ])

    return {
      totalUrls,
      deletedUrls,
      totalClicks: totalClicks._sum.clicks || 0,
      totalUsers: uniqueUsers.length,
      pendingReports,
      flaggedUrls,
      bannedIps,
      bannedDomains,
      last24hUrls,
      last24hClicks: last24hClicksData._sum.clicks || 0,
    }
  } catch (error) {
    console.error('Get admin stats error:', error)
    return {
      totalUrls: 0,
      deletedUrls: 0,
      totalClicks: 0,
      totalUsers: 0,
      pendingReports: 0,
      flaggedUrls: 0,
      bannedIps: 0,
      bannedDomains: 0,
      last24hUrls: 0,
      last24hClicks: 0,
    }
  }
}