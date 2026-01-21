import prisma from './database'

export interface RotationDestination {
  id: string
  destination: string
  weight: number
  label?: string
  clicks: number
  isActive: boolean
}

export type RotationType = 'RANDOM' | 'WEIGHTED' | 'SEQUENTIAL'

export async function getRotationDestination(
  urlId: string,
  rotationType: RotationType
): Promise<string | null> {
  try {
    const rotationLinks = await prisma.rotationLink.findMany({
      where: {
        urlId,
        isActive: true,
      },
    })

    if (rotationLinks.length === 0) return null

    let selectedLink: typeof rotationLinks[0]

    switch (rotationType) {
      case 'RANDOM':
        selectedLink = rotationLinks[Math.floor(Math.random() * rotationLinks.length)]
        break

      case 'WEIGHTED':
        const totalWeight = rotationLinks.reduce((sum, link) => sum + link.weight, 0)
        let random = Math.random() * totalWeight
        selectedLink = rotationLinks[0]

        for (const link of rotationLinks) {
          random -= link.weight
          if (random <= 0) {
            selectedLink = link
            break
          }
        }
        break

      case 'SEQUENTIAL':
        const url = await prisma.url.findUnique({ where: { id: urlId } })
        if (!url) return null

        const currentIndex = url.currentRotation % rotationLinks.length
        selectedLink = rotationLinks[currentIndex]

        await prisma.url.update({
          where: { id: urlId },
          data: { currentRotation: url.currentRotation + 1 },
        })
        break

      default:
        selectedLink = rotationLinks[0]
    }

    await prisma.rotationLink.update({
      where: { id: selectedLink.id },
      data: { clicks: { increment: 1 } },
    })

    return selectedLink.destination
  } catch (error) {
    console.error('Rotation destination error:', error)
    return null
  }
}

export async function createRotationUrl(
  shortCode: string,
  destinations: Array<{ url: string; weight?: number; label?: string }>,
  rotationType: RotationType = 'RANDOM',
  userId?: string
): Promise<{ success: boolean; shortUrl?: string; error?: string }> {
  try {
    const url = await prisma.url.create({
      data: {
        originalUrl: destinations[0].url,
        urlHash: `rotation_${shortCode}`,
        shortCode,
        isActive: true,
        isFlagged: false,
        isRotation: true,
        rotationType,
      },
    })

    await prisma.rotationLink.createMany({
      data: destinations.map((dest) => ({
        urlId: url.id,
        destination: dest.url,
        weight: dest.weight || 1,
        label: dest.label,
      })),
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

    return {
      success: true,
      shortUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/${shortCode}`,
    }
  } catch (error) {
    console.error('Create rotation URL error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create rotation URL',
    }
  }
}

export async function getRotationStats(urlId: string) {
  const rotationLinks = await prisma.rotationLink.findMany({
    where: { urlId },
    orderBy: { clicks: 'desc' },
  })

  const totalClicks = rotationLinks.reduce((sum, link) => sum + link.clicks, 0)

  return {
    links: rotationLinks.map((link) => ({
      id: link.id,
      destination: link.destination,
      label: link.label,
      weight: link.weight,
      clicks: link.clicks,
      percentage: totalClicks > 0 ? ((link.clicks / totalClicks) * 100).toFixed(1) : '0',
      isActive: link.isActive,
    })),
    totalClicks,
  }
}

export async function updateRotationLink(
  linkId: string,
  data: { destination?: string; weight?: number; label?: string; isActive?: boolean }
): Promise<boolean> {
  try {
    await prisma.rotationLink.update({
      where: { id: linkId },
      data,
    })
    return true
  } catch (error) {
    console.error('Update rotation link error:', error)
    return false
  }
}

export async function deleteRotationLink(linkId: string): Promise<boolean> {
  try {
    await prisma.rotationLink.delete({
      where: { id: linkId },
    })
    return true
  } catch (error) {
    console.error('Delete rotation link error:', error)
    return false
  }
}