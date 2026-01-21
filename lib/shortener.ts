import { customAlphabet } from 'nanoid'
import prisma from './database'
import { hashUrl, hashPassword } from './utils'
import { UrlData } from '@/types'
import { invalidateCache } from './cache'
import { scrapeAndSaveMetadata } from './metadata-scraper'

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const generateShortCode = customAlphabet(alphabet, 7)

export interface CreateShortUrlOptions {
  originalUrl: string
  userId?: string | null
  customExpiry?: Date | null
  isAuthenticated: boolean
  password?: string
}

export interface CreateShortUrlResult {
  success: boolean
  shortCode?: string
  shortUrl?: string
  isNew: boolean
  error?: string
}

export async function createShortUrl(options: CreateShortUrlOptions): Promise<CreateShortUrlResult> {
  const { originalUrl, userId, customExpiry, isAuthenticated, password } = options

  let expiresAt: Date | null = null
  if (!isAuthenticated) {
    const days = parseInt(process.env.NON_AUTH_EXPIRY_DAYS || '7')
    expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  } else if (customExpiry) {
    expiresAt = customExpiry
  }

  const urlHash = hashUrl(originalUrl)

  try {
    let url = await prisma.url.findFirst({
      where: {
        urlHash,
        isActive: true,
        isFlagged: false,
      },
    })

    let isNew = false

    if (url) {
      if (userId) {
        const existingUserUrl = await prisma.userUrl.findUnique({
          where: {
            userId_urlId: {
              userId,
              urlId: url.id,
            },
          },
        })

        if (!existingUserUrl) {
          await prisma.userUrl.create({
            data: {
              userId,
              urlId: url.id,
            },
          })
        }
      }
    } else {
      isNew = true
      const shortCode = await generateUniqueShortCode()
      const passwordHash = password ? await hashPassword(password) : null

      url = await prisma.url.create({
        data: {
          originalUrl,
          urlHash,
          shortCode,
          expiresAt,
          isActive: true,
          isFlagged: false,
          isPasswordProtected: !!password,
          passwordHash,
        },
      })

      await prisma.analytics.create({
        data: {
          urlId: url.id,
          clicks: 0,
        },
      })

      if (userId) {
        await prisma.userUrl.create({
          data: {
            userId,
            urlId: url.id,
          },
        })
      }

      scrapeAndSaveMetadata(url.id, originalUrl).catch((err) =>
        console.error('Background metadata scraping error:', err)
      )
    }

    const shortUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${url.shortCode}`

    return {
      success: true,
      shortCode: url.shortCode,
      shortUrl,
      isNew,
    }
  } catch (error) {
    console.error('Create short URL error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create short URL',
      isNew: false,
    }
  }
}

async function generateUniqueShortCode(): Promise<string> {
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const shortCode = generateShortCode()
    const existing = await prisma.url.findUnique({
      where: { shortCode },
    })

    if (!existing) return shortCode
    attempts++
  }

  return customAlphabet(alphabet, 10)()
}

export async function getUrlByShortCode(shortCode: string): Promise<UrlData | null> {
  try {
    const url = await prisma.url.findUnique({
      where: { shortCode },
    })

    if (!url) return null

    if (url.expiresAt && url.expiresAt < new Date()) {
      await prisma.url.update({
        where: { id: url.id },
        data: { isActive: false },
      })
      return null
    }

    if (!url.isActive || url.isFlagged) {
      return null
    }

    return url as UrlData
  } catch (error) {
    console.error('Get URL by short code error:', error)
    return null
  }
}

export async function deleteUserUrl(shortCode: string, userId: string): Promise<boolean> {
  try {
    const url = await prisma.url.findUnique({
      where: { shortCode },
      include: { userUrls: true },
    })

    if (!url) return false

    const userUrl = url.userUrls.find((u) => u.userId === userId)
    if (!userUrl) return false

    await prisma.userUrl.delete({
      where: { id: userUrl.id },
    })

    const remainingOwners = await prisma.userUrl.count({
      where: { urlId: url.id },
    })

    if (remainingOwners === 0) {
      await prisma.url.delete({
        where: { id: url.id },
      })

      await invalidateCache(shortCode)
    }

    return true
  } catch (error) {
    console.error('Delete user URL error:', error)
    return false
  }
}

export async function adminDeleteUrl(shortCode: string): Promise<boolean> {
  try {
    const url = await prisma.url.findUnique({
      where: { shortCode },
    })

    if (!url) return false

    await prisma.url.delete({
      where: { id: url.id },
    })

    await invalidateCache(shortCode)

    return true
  } catch (error) {
    console.error('Admin delete URL error:', error)
    return false
  }
}
