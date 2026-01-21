import { notFound, redirect } from 'next/navigation'
import { getCachedUrl, setCachedUrl, incrementClickCount } from '@/lib/cache'
import { getUrlByShortCode } from '@/lib/shortener'
import { trackClick } from '@/lib/analytics'
import { getRotationDestination } from '@/lib/rotation'
import { headers, cookies } from 'next/headers'
import { getClientIp } from '@/lib/utils'
import { isSocialBot } from '@/lib/bot-detector'
import prisma from '@/lib/database'
import { Metadata } from 'next'

interface PageProps {
  params: Promise<{ code: string }>
  searchParams: Promise<{ preview?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params

  let urlData = await getCachedUrl(code)
  if (!urlData) {
    urlData = await getUrlByShortCode(code)
  }

  if (!urlData) {
    return {
      title: 'URL Not Found',
    }
  }

  const metadata = await prisma.linkMetadata.findUnique({
    where: { urlId: urlData.id },
  })

  const shortUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${code}`

  return {
    title: metadata?.title || 'Shortened Link',
    description: metadata?.description || `Redirecting to: ${urlData.originalUrl}`,
    openGraph: {
      title: metadata?.title || 'Shortened Link',
      description: metadata?.description || 'Click to visit',
      url: shortUrl,
      siteName: 'S - URL Shortener',
      images: [
        {
          url: metadata?.image || `/preview/${code}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: metadata?.title || 'Link Preview',
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: metadata?.title || 'Shortened Link',
      description: metadata?.description || 'Click to visit',
      images: [metadata?.image || `/preview/${code}/opengraph-image`],
    },
  }
}

export default async function RedirectPage({ params, searchParams }: PageProps) {
  const { code } = await params
  const { preview } = await searchParams

  const headersList = await headers()
  const userAgent = headersList.get('user-agent')

  if (isSocialBot(userAgent)) {
    redirect(`/preview/${code}`)
  }

  if (preview === '1' || preview === 'true') {
    redirect(`/preview/${code}`)
  }

  let urlData = await getCachedUrl(code)
  if (!urlData) {
    urlData = await getUrlByShortCode(code)
    if (urlData) {
      await setCachedUrl(code, urlData)
    }
  }

  if (!urlData) {
    notFound()
  }

  if (urlData.isPasswordProtected) {
    const cookieStore = await cookies()
    const isAuthenticated = cookieStore.get(`url_auth_${code}`)

    if (!isAuthenticated) {
      redirect(`/preview/${code}`)
    }
  }

  const ip = getClientIp(headersList)
  const referer = headersList.get('referer') || undefined

  trackClick({ shortCode: code, ip, userAgent: userAgent || undefined, referer }).catch((err) =>
    console.error('Track click error:', err)
  )

  incrementClickCount(code).catch((err) => console.error('Increment click error:', err))

  let finalDestination = urlData.originalUrl

  if (urlData.isRotation && urlData.rotationType) {
    const rotationDest = await getRotationDestination(
      urlData.id,
      urlData.rotationType as 'RANDOM' | 'WEIGHTED' | 'SEQUENTIAL'
    )

    if (rotationDest) {
      finalDestination = rotationDest
    }
  }

  redirect(finalDestination)
}
