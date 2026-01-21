import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/utils'
import { HealthMonitor } from '@/components/health-monitor'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function AdminHealthPage() {
  const { userId } = await auth()

  if (!userId || !isAdmin(userId)) {
    redirect('/')
  }

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-3xl font-bold'>System Health Monitor</h1>
        <p className='text-muted-foreground'>
          Monitor health status of all URLs in the system
        </p>
      </div>

      <HealthMonitor isAdmin={true} />
    </div>
  )
}
