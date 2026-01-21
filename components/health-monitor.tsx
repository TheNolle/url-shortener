'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Activity, AlertTriangle, CheckCircle2, Clock, ExternalLink, RefreshCw, TrendingUp, Shield } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { timeAgo } from '@/lib/utils'

interface BrokenUrl {
  id: string
  shortCode: string
  originalUrl: string
  healthStatus: string
  lastStatusCode: number | null
  healthCheckError: string | null
  lastHealthCheck: Date | null
  clicks: number
  userId?: string
}

interface HealthMonitorProps {
  isAdmin?: boolean
}

export function HealthMonitor({ isAdmin = false }: HealthMonitorProps) {
  const [brokenUrls, setBrokenUrls] = useState<BrokenUrl[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadBrokenUrls()
  }, [isAdmin])

  const loadBrokenUrls = async () => {
    try {
      const endpoint = isAdmin ? '/api/admin/health/broken' : '/api/health/broken'
      const response = await fetch(endpoint)
      if (response.ok) {
        const data = await response.json()
        setBrokenUrls(data.urls)
      }
    } catch (error) {
      console.error('Failed to load broken URLs', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadBrokenUrls()
    setRefreshing(false)
    toast({
      title: 'Refreshed',
      description: 'Health status updated',
    })
  }

  const handleCheckNow = async (urlId: string) => {
    try {
      const response = await fetch(`/api/health/check/${urlId}`, {
        method: 'POST',
      })

      if (response.ok) {
        await loadBrokenUrls()
        toast({
          title: 'Checked',
          description: 'Health check completed',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to check URL',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return (
          <Badge variant='default' className='gap-1'>
            <CheckCircle2 className='h-3 w-3' />
            Healthy
          </Badge>
        )
      case 'warning':
        return (
          <Badge variant='secondary' className='gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'>
            <AlertTriangle className='h-3 w-3' />
            Warning
          </Badge>
        )
      case 'broken':
        return (
          <Badge variant='destructive' className='gap-1'>
            <AlertTriangle className='h-3 w-3' />
            Broken
          </Badge>
        )
      default:
        return <Badge variant='outline'>Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className='py-12 text-center'>
          <Activity className='h-8 w-8 animate-pulse mx-auto text-muted-foreground' />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Issues</CardTitle>
            <Activity className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{brokenUrls.length}</div>
            <p className='text-xs text-muted-foreground'>
              {isAdmin ? 'System-wide issues' : 'URLs need attention'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Broken</CardTitle>
            <AlertTriangle className='h-4 w-4 text-destructive' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-destructive'>
              {brokenUrls.filter((u) => u.healthStatus === 'broken').length}
            </div>
            <p className='text-xs text-muted-foreground'>Not accessible</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Warnings</CardTitle>
            <AlertTriangle className='h-4 w-4 text-yellow-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-yellow-600'>
              {brokenUrls.filter((u) => u.healthStatus === 'warning').length}
            </div>
            <p className='text-xs text-muted-foreground'>Slow or rate-limited</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                {isAdmin && <Shield className='h-5 w-5' />}
                Health Issues
              </CardTitle>
              <CardDescription>
                {isAdmin ? 'All URLs with health issues' : 'Your URLs with broken or degraded health'}
              </CardDescription>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {brokenUrls.length === 0 ? (
            <Alert className='border-green-200 bg-green-50 dark:bg-green-900/20'>
              <CheckCircle2 className='h-4 w-4 text-green-600' />
              <AlertDescription className='text-green-800 dark:text-green-400'>
                {isAdmin ? 'All URLs in the system are healthy!' : 'All your URLs are healthy!'}
              </AlertDescription>
            </Alert>
          ) : (
            <div className='space-y-4'>
              {brokenUrls.map((url) => (
                <div
                  key={url.id}
                  className='flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors'
                >
                  <div className='flex-1 space-y-2'>
                    <div className='flex items-center gap-2'>
                      <code className='bg-muted px-2 py-1 rounded text-sm font-mono'>
                        /{url.shortCode}
                      </code>
                      {getStatusBadge(url.healthStatus)}
                      {url.lastStatusCode && (
                        <Badge variant='outline' className='font-mono'>
                          {url.lastStatusCode}
                        </Badge>
                      )}
                    </div>

                    <a
                      href={url.originalUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-sm text-muted-foreground hover:underline flex items-center gap-1'
                    >
                      {url.originalUrl.substring(0, 80)}...
                      <ExternalLink className='h-3 w-3' />
                    </a>

                    {url.healthCheckError && (
                      <p className='text-sm text-destructive'>
                        Error: {url.healthCheckError}
                      </p>
                    )}

                    <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                      <div className='flex items-center gap-1'>
                        <Clock className='h-3 w-3' />
                        Last checked:{' '}
                        {url.lastHealthCheck
                          ? timeAgo(new Date(url.lastHealthCheck))
                          : 'Never'}
                      </div>
                      <div className='flex items-center gap-1'>
                        <TrendingUp className='h-3 w-3' />
                        {url.clicks} clicks
                      </div>
                    </div>
                  </div>

                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => handleCheckNow(url.id)}
                  >
                    Check Now
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}