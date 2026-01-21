import { auth } from '@clerk/nextjs/server'
import { UrlShortenerForm } from '@/components/url-shortener-form'
import { UrlList } from '@/components/url-list'
import { Shield, Zap, Lock, BarChart3 } from 'lucide-react'

export default async function HomePage() {
  const { userId } = await auth()

  return (
    <div className='space-y-12'>
      <section className='text-center space-y-4 py-12'>
        <h1 className='text-5xl font-bold tracking-tight'>
          Ultra Secure URL Shortener
        </h1>
        <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
          Create short links with M.Y.B.™ Technology. Protected by multiple threat detection systems.
        </p>

        <div className='flex justify-center gap-4 pt-4'>
          <div className='flex items-center gap-2 text-sm'>
            <Shield className='h-4 w-4 text-green-600' />
            <span>Google Safe Browsing</span>
          </div>
          <div className='flex items-center gap-2 text-sm'>
            <Shield className='h-4 w-4 text-green-600' />
            <span>VirusTotal (70+ engines)</span>
          </div>
          <div className='flex items-center gap-2 text-sm'>
            <Shield className='h-4 w-4 text-green-600' />
            <span>AI Detection</span>
          </div>
          <div className='flex items-center gap-2 text-sm'>
            <Shield className='h-4 w-4 text-green-600' />
            <span>Machine Learning</span>
          </div>
        </div>
      </section>

      <UrlShortenerForm userId={userId} />

      {userId && (
        <div className='pt-8'>
          <UrlList />
        </div>
      )}

      <section className='grid md:grid-cols-3 gap-6 py-12'>
        <div className='text-center space-y-2'>
          <div className='mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center'>
            <Zap className='h-6 w-6 text-primary' />
          </div>
          <h3 className='font-semibold'>Lightning Fast</h3>
          <p className='text-sm text-muted-foreground'>
            Multi-layer caching with Redis and in-memory storage
          </p>
        </div>

        <div className='text-center space-y-2'>
          <div className='mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center'>
            <Lock className='h-6 w-6 text-primary' />
          </div>
          <h3 className='font-semibold'>Advanced Security</h3>
          <p className='text-sm text-muted-foreground'>
            Multi-tier phishing and malware protection
          </p>
        </div>

        <div className='text-center space-y-2'>
          <div className='mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center'>
            <BarChart3 className='h-6 w-6 text-primary' />
          </div>
          <h3 className='font-semibold'>Detailed Analytics</h3>
          <p className='text-sm text-muted-foreground'>
            Track clicks, referrers, and user engagement
          </p>
        </div>
      </section>
    </div>
  )
}