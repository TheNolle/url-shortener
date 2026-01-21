import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { HealthMonitor } from '@/components/health-monitor'
import { Activity } from 'lucide-react'

export default async function HealthPage() {
  const { userId } = await auth()

  if (!userId) redirect('/sign-in')

  return (
    <div className='space-y-8'>
      <div className='text-center space-y-4'>
        <div className='flex justify-center'>
          <div className='p-4 bg-primary/10 rounded-full'>
            <Activity className='h-12 w-12 text-primary' />
          </div>
        </div>
        <h1 className='text-4xl font-bold'>Link Health Monitor</h1>
        <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
          Automatically monitor your links and get notified when they break
        </p>
      </div>

      <HealthMonitor />
    </div>
  )
}
