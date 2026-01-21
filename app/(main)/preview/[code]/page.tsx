import { notFound } from 'next/navigation'
import { getCachedUrl, setCachedUrl } from '@/lib/cache'
import { getUrlByShortCode } from '@/lib/shortener'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, Shield, Clock, Lock } from 'lucide-react'
import Link from 'next/link'
import { ReportUrlButton } from '@/components/report-url-button'
import { QRCodeModal } from '@/components/qr-code-modal'
import { QRCodeDisplay } from '@/components/qr-code-display'
import { LinkPreview } from '@/components/link-preview'
import { cookies } from 'next/headers'
import { PasswordEntry } from '@/components/password-entry'
import prisma from '@/lib/database'
import { Metadata } from 'next'

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
    description: metadata?.description || `View this shortened URL: ${urlData.originalUrl}`,
    openGraph: {
      title: metadata?.title || 'Shortened Link',
      description: metadata?.description || `View this shortened URL`,
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
      description: metadata?.description || 'View this shortened URL',
      images: [metadata?.image || `/preview/${code}/opengraph-image`],
    },
  }
}

interface PageProps {
  params: Promise<{ code: string }>
}

export default async function PreviewPage({ params }: PageProps) {
  const { code } = await params

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

  const shortUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${code}`

  if (urlData.isPasswordProtected) {
    const cookieStore = await cookies()
    const isAuthenticated = cookieStore.get(`url_auth_${code}`)

    if (!isAuthenticated) {
      return <PasswordEntry shortCode={code} />
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <div className='w-full max-w-4xl space-y-6'>
        <LinkPreview shortCode={code} originalUrl={urlData.originalUrl} />
        <Card className='w-full max-w-2xl'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Shield className='h-6 w-6 text-green-600' />
              URL Preview
            </CardTitle>
            <CardDescription>
              Review this link before visiting
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='space-y-2'>
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <span className='font-medium'>Short URL:</span>
                <code className='bg-muted px-2 py-1 rounded text-xs'>{shortUrl}</code>
              </div>
              <div className='flex items-start gap-2 text-sm'>
                <span className='font-medium text-muted-foreground'>Destination:</span>
                <a
                  href={urlData.originalUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary hover:underline break-all'
                >
                  {urlData.originalUrl}
                </a>
              </div>
            </div>

            <div className='flex items-center gap-2 text-sm'>
              <Shield className='h-4 w-4 text-green-600' />
              <span className='text-muted-foreground'>Scanned by Google Safe Browsing, VirusTotal & URLert</span>
            </div>

            {urlData.expiresAt && (
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <Clock className='h-4 w-4' />
                <span>Expires: {new Date(urlData.expiresAt).toLocaleDateString()}</span>
              </div>
            )}

            {urlData.isPasswordProtected && (
              <div className='flex items-center gap-2 text-sm text-orange-600 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg'>
                <Lock className='h-4 w-4' />
                <span className='font-medium'>This link is password protected</span>
              </div>
            )}

            <div className='border-t pt-6'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-sm font-medium'>QR Code</h3>
                <QRCodeModal shortCode={code} shortUrl={shortUrl} />
              </div>
              <div className='flex justify-center'>
                <QRCodeDisplay url={shortUrl} size={200} />
              </div>
            </div>

            <div className='flex gap-3'>
              <Button asChild className='flex-1'>
                <a href={urlData.originalUrl} target='_blank' rel='noopener noreferrer'>
                  <ExternalLink className='h-4 w-4 mr-2' />
                  Continue to Destination
                </a>
              </Button>
              <ReportUrlButton shortCode={code} />
            </div>

            <div className='text-center text-xs text-muted-foreground'>
              <Link href='/' className='hover:underline'>
                ← Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
