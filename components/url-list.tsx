'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, ExternalLink, Trash2, BarChart3, Copy, AlertTriangle, Globe, Shuffle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatNumber, timeAgo } from '@/lib/utils'
import { ReportUrlButton } from './report-url-button'
import Link from 'next/link'
import { QRCodeModal } from './qr-code-modal'

interface UrlItem {
  id: string
  originalUrl: string
  shortCode: string
  createdAt: string
  expiresAt: string | null
  isActive: boolean
  isFlagged: boolean
  clicks: number
  lastClick: string | null
  isRotation: boolean
  rotationType: string | null
  healthStatus: string
}

export function UrlList() {
  const [urls, setUrls] = useState<UrlItem[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchUrls()
  }, [])

  const fetchUrls = async () => {
    try {
      const response = await fetch('/api/user/urls')
      if (response.ok) {
        const data = await response.json()
        setUrls(data.urls)
      }
    } catch (error) {
      console.error('Failed to fetch URLs:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteUrl = async (shortCode: string) => {
    try {
      const response = await fetch(`/api/user/urls?code=${shortCode}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setUrls(urls.filter(url => url.shortCode !== shortCode))
        toast({
          title: 'Deleted',
          description: 'URL removed from your account',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete URL',
        variant: 'destructive',
      })
    }
  }

  const copyUrl = async (shortCode: string) => {
    const shortUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${shortCode}`
    await navigator.clipboard.writeText(shortUrl)
    toast({
      title: 'Copied!',
      description: 'Short URL copied to clipboard',
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-12'>
          <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        </CardContent>
      </Card>
    )
  }

  if (urls.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your URLs</CardTitle>
          <CardDescription>URLs you create will appear here</CardDescription>
        </CardHeader>
        <CardContent className='text-center py-12 text-muted-foreground'>
          No URLs yet. Create your first short link above!
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your URLs</CardTitle>
        <CardDescription>{urls.length} shortened URLs</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Short URL</TableHead>
              <TableHead>Original URL</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {urls.map((url) => (
              <TableRow key={url.id}>
                <TableCell className='font-mono font-medium'>
                  {url.shortCode}
                  {url.isRotation && (
                    <Badge variant='secondary' className='gap-1'>
                      <Shuffle className='h-3 w-3' />
                      {url.rotationType}
                    </Badge>
                  )}
                  {url.healthStatus === 'broken' && (
                    <Badge variant='destructive' className='gap-1'>
                      <AlertTriangle className='h-3 w-3' />
                      Broken
                    </Badge>
                  )}
                  {url.healthStatus === 'warning' && (
                    <Badge variant='secondary' className='gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20'>
                      <AlertTriangle className='h-3 w-3' />
                      Warning
                    </Badge>
                  )}
                </TableCell>
                <TableCell className='max-w-xs truncate'>
                  <a
                    href={url.originalUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='hover:underline text-muted-foreground flex items-center gap-1'
                  >
                    {url.originalUrl}
                    <ExternalLink className='h-3 w-3' />
                  </a>
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-1'>
                    <BarChart3 className='h-4 w-4 text-muted-foreground' />
                    {formatNumber(url.clicks)}
                  </div>
                </TableCell>
                <TableCell className='text-sm text-muted-foreground'>
                  {timeAgo(new Date(url.createdAt))}
                </TableCell>
                <TableCell>
                  {url.isFlagged ? (
                    <Badge variant='destructive' className='gap-1'>
                      <AlertTriangle className='h-3 w-3' />
                      Flagged
                    </Badge>
                  ) : url.isActive ? (
                    <Badge variant='default'>Active</Badge>
                  ) : (
                    <Badge variant='secondary'>Expired</Badge>
                  )}
                </TableCell>
                <TableCell className='text-right'>
                  <div className='flex justify-end gap-2'>
                    <ReportUrlButton shortCode={url.shortCode} variant='ghost' />
                    <Link href={`/preview/${url.shortCode}`}>
                      <Button variant='ghost' size='sm' title='Preview with metadata'>
                        <Globe className='h-4 w-4' />
                      </Button>
                    </Link>
                    <Link href={url.isRotation ? `/rotation/${url.shortCode}` : `/analytics/${url.shortCode}`}>
                      <Button variant='outline' size='sm'>
                        <BarChart3 className='h-4 w-4 mr-2' />
                        {url.isRotation ? 'A/B Stats' : 'Analytics'}
                      </Button>
                    </Link>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => copyUrl(url.shortCode)}
                    >
                      <Copy className='h-4 w-4' />
                    </Button>
                    <QRCodeModal
                      shortCode={url.shortCode}
                      shortUrl={`${process.env.NEXT_PUBLIC_BASE_URL}/${url.shortCode}`}
                    />
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => deleteUrl(url.shortCode)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
