import { ReportAnyUrlForm } from '@/components/report-any-url-form'
import { Shield } from 'lucide-react'

export default function ReportPage() {
  return (
    <div className='space-y-8'>
      <div className='text-center space-y-4'>
        <div className='flex justify-center'>
          <div className='p-4 bg-orange-100 dark:bg-orange-900/20 rounded-full'>
            <Shield className='h-12 w-12 text-orange-600' />
          </div>
        </div>
        <h1 className='text-4xl font-bold'>Report a URL</h1>
        <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
          Help us keep the community safe by reporting suspicious or harmful shortened URLs
        </p>
      </div>

      <ReportAnyUrlForm />
    </div>
  )
}
