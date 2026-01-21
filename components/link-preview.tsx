'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ExternalLink, Globe, User, Calendar, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface LinkPreviewProps {
  shortCode: string
  originalUrl: string
}

interface Metadata {
  title?: string
  description?: string
  image?: string
  logo?: string
  author?: string
  publisher?: string
  date?: string
  favicon?: string
  scrapedAt?: string
}

export function LinkPreview({ shortCode, originalUrl }: LinkPreviewProps) {
  const [metadata, setMetadata] = useState<Metadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadMetadata()
  }, [shortCode])

  const loadMetadata = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/metadata/${shortCode}`)
      const data = await response.json()

      if (response.ok && data.metadata) {
        setMetadata(data.metadata)
      } else {
        setError('Failed to load preview')
      }
    } catch (err) {
      setError('Failed to load preview')
    } finally {
      setLoading(false)
    }
  }

  const refreshMetadata = async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`/api/metadata/${shortCode}`, {
        method: 'POST',
      })
      const data = await response.json()

      if (response.ok && data.metadata) {
        setMetadata(data.metadata)
      }
    } catch (err) {
      console.error('Refresh error:', err)
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className='py-8'>
          <div className='flex items-center justify-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary' />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !metadata) {
    return (
      <Card>
        <CardContent className='py-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Globe className='h-10 w-10 text-muted-foreground' />
              <div>
                <p className='font-medium'>Link Preview Unavailable</p>
                <a
                  href={originalUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-sm text-primary hover:underline flex items-center gap-1'
                >
                  {originalUrl.substring(0, 60)}...
                  <ExternalLink className='h-3 w-3' />
                </a>
              </div>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={refreshMetadata}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='overflow-hidden hover:shadow-lg transition-shadow'>
      <CardContent className='p-0'>
        <div className='flex flex-col md:flex-row'>
          {metadata.image && (
            <div className='relative w-full md:w-64 h-48 md:h-auto bg-muted'>
              <Image
                src={metadata.image}
                alt={metadata.title || 'Link preview'}
                fill
                className='object-cover'
                unoptimized
              />
            </div>
          )}
          
          <div className='flex-1 p-6 space-y-4'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex-1 space-y-2'>
                <div className='flex items-center gap-2'>
                  {metadata.favicon && (
                    <Image
                      src={metadata.favicon}
                      alt='Favicon'
                      width={16}
                      height={16}
                      className='rounded'
                      unoptimized
                    />
                  )}
                  {metadata.publisher && (
                    <span className='text-sm text-muted-foreground'>
                      {metadata.publisher}
                    </span>
                  )}
                </div>

                <h3 className='text-xl font-bold line-clamp-2'>
                  {metadata.title || 'Untitled'}
                </h3>

                {metadata.description && (
                  <p className='text-sm text-muted-foreground line-clamp-3'>
                    {metadata.description}
                  </p>
                )}

                <div className='flex items-center gap-4 text-xs text-muted-foreground pt-2'>
                  {metadata.author && (
                    <div className='flex items-center gap-1'>
                      <User className='h-3 w-3' />
                      <span>{metadata.author}</span>
                    </div>
                  )}
                  {metadata.date && (
                    <div className='flex items-center gap-1'>
                      <Calendar className='h-3 w-3' />
                      <span>{new Date(metadata.date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <Button
                variant='ghost'
                size='sm'
                onClick={refreshMetadata}
                disabled={refreshing}
                title='Refresh preview'
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className='flex items-center gap-2 pt-2 border-t'>
              <a
                href={originalUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='text-sm text-primary hover:underline flex items-center gap-1 truncate'
              >
                <ExternalLink className='h-3 w-3 shrink-0' />
                <span className='truncate'>{originalUrl}</span>
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
