import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/database'
import { getRotationStats } from '@/lib/rotation'
import { RotationStats } from '@/components/rotation-stats'
import { ArrowLeft, Shuffle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface PageProps {
  params: Promise<{ code: string }>
}

export default async function RotationAnalyticsPage({ params }: PageProps) {
  const { code } = await params
  const { userId } = await auth()

  if (!userId) redirect('/sign-in')

  const url = await prisma.url.findUnique({
    where: { shortCode: code },
    include: {
      userUrls: true,
      analytics: true,
    },
  })

  if (!url) notFound()

  const userUrl = url.userUrls.find((u) => u.userId === userId)
  if (!userUrl) redirect('/')

  if (!url.isRotation) {
    redirect(`/analytics/${code}`)
  }

  const stats = await getRotationStats(url.id)

  return (
    <div className='space-y-8'>
      <div className='flex items-center justify-between'>
        <div className='space-y-1'>
          <Link href='/'>
            <Button variant='ghost' size='sm'>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back to URLs
            </Button>
          </Link>
          <h1 className='text-3xl font-bold flex items-center gap-2'>
            <Shuffle className='h-8 w-8' />
            A/B Testing Analytics
          </h1>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <code className='bg-muted px-2 py-1 rounded'>
              {process.env.NEXT_PUBLIC_BASE_URL}/{code}
            </code>
            <span>•</span>
            <span className='capitalize'>{url.rotationType} rotation</span>
          </div>
        </div>
      </div>

      <RotationStats
        stats={stats}
        shortCode={code}
        rotationType={url.rotationType || 'random'}
        totalClicks={url.analytics[0]?.clicks || 0}
      />
    </div>
  )
}
