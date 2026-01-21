'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Link2, Shield, Copy, CheckCircle2, Lock, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { QRCodeDisplay } from './qr-code-display'
import { QRCodeModal } from './qr-code-modal'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface UrlShortenerFormProps {
  userId: string | null
}

export function UrlShortenerForm({ userId }: UrlShortenerFormProps) {
  const [url, setUrl] = useState('')
  const [password, setPassword] = useState('')
  const [enablePassword, setEnablePassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleShorten = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)

    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          password: enablePassword ? password : undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        setUrl('')
        setPassword('')
        setEnablePassword(false)
        toast({
          title: 'Success!',
          description: data.isNew ? 'URL shortened successfully!' : 'URL already exists',
        })
      } else {
        setError(data.error || 'Failed to shorten URL')
        toast({
          title: 'Error',
          description: data.error || 'Failed to shorten URL',
          variant: 'destructive',
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className='w-full max-w-2xl mx-auto'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Link2 className='h-6 w-6' />
          Shorten Your URL
        </CardTitle>
        <CardDescription>
          Create a secure shortened link{userId ? ' with optional password protection' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <form onSubmit={handleShorten} className='space-y-4'>
          <div className='space-y-2'>
            <Input
              type='url'
              placeholder='https://example.com/your-long-url'
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              required
              className='flex-1'
            />
          </div>
          {userId && (
            <div className='space-y-3 p-4 border rounded-lg bg-muted/50'>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='enable-password'
                  checked={enablePassword}
                  onCheckedChange={(checked) => setEnablePassword(checked as boolean)}
                />
                <Label htmlFor='enable-password' className='flex items-center gap-2 cursor-pointer'>
                  <Lock className='h-4 w-4' />
                  Password protect this link
                </Label>
              </div>

              {enablePassword && (
                <div className='space-y-2 pt-2'>
                  <Input
                    type='password'
                    placeholder='Enter password (min 6 characters)'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required={enablePassword}
                  />
                  <p className='text-xs text-muted-foreground'>
                    Visitors will need this password to access the link
                  </p>
                </div>
              )}
            </div>
          )}
          <Button type='submit' disabled={loading || !url} className='w-full'>
            {loading ? 'Shortening...' : 'Shorten URL'}
          </Button>
        </form>

        {error && (
          <Alert variant='destructive' className='mt-4'>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className='space-y-4'>
            <div className='p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg'>
              <div className='flex items-start gap-3'>
                <CheckCircle2 className='h-5 w-5 text-green-600 mt-0.5' />
                <div className='flex-1 space-y-3'>
                  <div>
                    <p className='font-medium text-green-900 dark:text-green-100'>
                      {result.isNew ? 'URL shortened successfully!' : 'URL already exists'}
                    </p>
                    <p className='text-sm text-green-700 dark:text-green-300'>
                      Your shortened URL is ready to use
                    </p>
                  </div>

                  <div className='flex items-center gap-2'>
                    <Input
                      value={result.shortUrl}
                      readOnly
                      className='bg-white dark:bg-gray-900'
                    />
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        navigator.clipboard.writeText(result.shortUrl)
                        toast({ title: 'Copied!', description: 'URL copied to clipboard' })
                      }}
                    >
                      <Copy className='h-4 w-4' />
                    </Button>
                  </div>

                  {enablePassword && (
                    <div className='flex items-center gap-2 text-sm text-orange-600'>
                      <Lock className='h-4 w-4' />
                      <span className='font-medium'>This link is password protected</span>
                    </div>
                  )}

                  <div className='flex flex-col items-center gap-2 pt-2'>
                    <p className='text-sm font-medium'>QR Code</p>
                    <QRCodeDisplay url={result.shortUrl} size={150} />
                    <QRCodeModal shortCode={result.shortCode!} shortUrl={result.shortUrl} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className='pt-4 border-t'>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <Shield className='h-4 w-4' />
            <span>Protected by M.Y.B.™ Technology</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}