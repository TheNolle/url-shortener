import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getDetailedAnalytics } from '@/lib/analytics'
import { AnalyticsCharts } from '@/components/analytics-charts'
import { AnalyticsStats } from '@/components/analytics-stats'
import { RecentClicks } from '@/components/recent-clicks'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface PageProps {
  params: Promise<{ code: string }>
}

export default async function AnalyticsPage({ params }: PageProps) {
  const { code } = await params
  const { userId } = await auth()

  if (!userId) redirect('/sign-in')

  const analytics = await getDetailedAnalytics(code, userId)

  if (!analytics) {
    redirect('/')
  }

  const shortUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${code}`

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
          <h1 className='text-3xl font-bold'>Analytics</h1>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <code className='bg-muted px-2 py-1 rounded'>{shortUrl}</code>
            <span>→</span>
            <span className='truncate max-w-md'>{analytics.url.originalUrl}</span>
          </div>
        </div>
      </div>

      <AnalyticsStats analytics={analytics} />

      <AnalyticsCharts analytics={analytics} />

      <RecentClicks clicks={analytics.recentClicks} />
    </div>
  )
}