'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, Ban, Search, ExternalLink, BarChart3, AlertTriangle, Shuffle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { timeAgo, formatNumber } from '@/lib/utils'

interface UrlItem {
  id: string
  shortCode: string
  originalUrl: string
  createdAt: Date
  isActive: boolean
  isFlagged: boolean
  flagReason?: string
  analytics: Array<{ clicks: number }>
  userUrls: Array<{ userId: string }>
  isRotation: boolean
  rotationType: string | null
  rotationLinks?: Array<{ id: string }>
}

interface AdminUrlManagerProps {
  initialUrls: UrlItem[]
}

export function AdminUrlManager({ initialUrls }: AdminUrlManagerProps) {
  const [urls, setUrls] = useState<UrlItem[]>(initialUrls)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const { toast } = useToast()

  const filteredUrls = urls.filter(
    (url) =>
      url.shortCode.toLowerCase().includes(search.toLowerCase()) ||
      url.originalUrl.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (shortCode: string) => {
    if (!confirm('Permanently delete this URL? This cannot be undone.')) return

    setLoading(shortCode)
    try {
      const response = await fetch(`/api/admin/urls/${shortCode}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setUrls(urls.filter((url) => url.shortCode !== shortCode))
        toast({
          title: 'Deleted',
          description: 'URL permanently deleted',
        })
      } else {
        throw new Error('Failed to delete')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete URL',
        variant: 'destructive',
      })
    } finally {
      setLoading(null)
    }
  }

  const handleFlag = async (shortCode: string, flag: boolean) => {
    setLoading(shortCode)
    try {
      const response = await fetch(`/api/admin/urls/${shortCode}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flag }),
      })

      if (response.ok) {
        setUrls(
          urls.map((url) =>
            url.shortCode === shortCode
              ? { ...url, isFlagged: flag, isActive: !flag }
              : url
          )
        )
        toast({
          title: flag ? 'Flagged' : 'Unflagged',
          description: flag ? 'URL has been flagged' : 'URL has been unflagged',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update URL',
        variant: 'destructive',
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All URLs</CardTitle>
        <CardDescription>{urls.length} total URLs in system</CardDescription>
        <div className='flex items-center gap-2 pt-4'>
          <Search className='h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search by short code or URL...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='max-w-sm'
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Short Code</TableHead>
              <TableHead>Original URL</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUrls.map((url) => (
              <TableRow key={url.id}>
                <TableCell className='font-mono'>{url.shortCode}</TableCell>
                <TableCell className='max-w-xs truncate'>
                  {url.isRotation ? (
                    <div className='flex items-center gap-2'>
                      <Shuffle className='h-4 w-4 text-muted-foreground' />
                      <span className='text-muted-foreground'>{url.rotationType}</span>
                      <Badge variant='outline' className='text-xs'>
                        {url.rotationLinks?.length || 0} variants
                      </Badge>
                    </div>
                  ) : (
                    <a
                      href={url.originalUrl}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='hover:underline text-muted-foreground flex items-center gap-1'
                    >
                      {url.originalUrl}
                      <ExternalLink className='h-3 w-3' />
                    </a>
                  )}
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-1'>
                    <BarChart3 className='h-4 w-4 text-muted-foreground' />
                    {formatNumber(url.analytics[0]?.clicks || 0)}
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
                    <Badge variant='secondary'>Inactive</Badge>
                  )}
                </TableCell>
                <TableCell className='text-right'>
                  <div className='flex justify-end gap-2'>
                    <Button
                      size='sm'
                      variant={url.isFlagged ? 'outline' : 'ghost'}
                      onClick={() => handleFlag(url.shortCode, !url.isFlagged)}
                      disabled={loading === url.shortCode}
                    >
                      <Ban className='h-4 w-4' />
                    </Button>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => handleDelete(url.shortCode)}
                      disabled={loading === url.shortCode}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredUrls.length === 0 && (
          <div className='text-center py-12 text-muted-foreground'>
            No URLs found
          </div>
        )}
      </CardContent>
    </Card>
  )
}
