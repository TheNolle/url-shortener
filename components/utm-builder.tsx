'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Link2, Copy, ExternalLink, Sparkles, AlertCircle, Tag, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { buildUTMUrl, validateUTMParams, UTM_PRESETS, getUTMSuggestions, type UTMParams } from '@/lib/utm-builder'

export function UTMBuilder() {
  const [baseUrl, setBaseUrl] = useState('')
  const [params, setParams] = useState<Partial<UTMParams>>({
    source: '',
    medium: '',
    campaign: '',
    term: '',
    content: '',
  })
  const [generatedUrl, setGeneratedUrl] = useState('')
  const [shortUrl, setShortUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const { toast } = useToast()

  const suggestions = getUTMSuggestions()

  const handlePresetSelect = (presetName: string) => {
    const preset = UTM_PRESETS.find((p) => p.name === presetName)
    if (preset) {
      setParams({ ...params, ...preset.params })
      toast({
        title: 'Preset Applied',
        description: preset.description,
      })
    }
  }

  const handleGenerate = () => {
    const validationErrors = validateUTMParams(params)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    if (!baseUrl.trim()) {
      setErrors(['Base URL is required'])
      return
    }

    try {
      const url = buildUTMUrl(baseUrl, params as UTMParams)
      setGeneratedUrl(url)
      setErrors([])
      toast({
        title: 'URL Generated',
        description: 'UTM parameters added successfully',
      })
    } catch (error) {
      setErrors(['Invalid URL format'])
    }
  }

  const handleShorten = async () => {
    if (!generatedUrl) return

    setLoading(true)
    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: generatedUrl }),
      })

      const data = await response.json()

      if (response.ok) {
        setShortUrl(data.shortUrl)
        toast({
          title: 'Short URL Created',
          description: 'Your UTM link is ready to share',
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to shorten URL',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied!',
      description: 'URL copied to clipboard',
    })
  }

  const handleReset = () => {
    setBaseUrl('')
    setParams({
      source: '',
      medium: '',
      campaign: '',
      term: '',
      content: '',
    })
    setGeneratedUrl('')
    setShortUrl('')
    setErrors([])
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Tag className='h-6 w-6' />
            Campaign URL Builder
          </CardTitle>
          <CardDescription>
            Create trackable URLs with UTM parameters for your marketing campaigns
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-2'>
            <Label htmlFor='base-url'>Destination URL *</Label>
            <Input
              id='base-url'
              type='url'
              placeholder='https://example.com/landing-page'
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
            <p className='text-xs text-muted-foreground'>
              The full URL where you want to send traffic
            </p>
          </div>

          <div className='space-y-2'>
            <Label className='flex items-center gap-2'>
              <Sparkles className='h-4 w-4' />
              Quick Presets
            </Label>
            <div className='flex flex-wrap gap-2'>
              {UTM_PRESETS.map((preset) => (
                <Button
                  key={preset.name}
                  variant='outline'
                  size='sm'
                  onClick={() => handlePresetSelect(preset.name)}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          <div className='space-y-4 p-4 border rounded-lg bg-muted/50'>
            <h3 className='font-semibold text-sm flex items-center gap-2'>
              <AlertCircle className='h-4 w-4' />
              Required Parameters
            </h3>

            <div className='grid md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='source'>Campaign Source *</Label>
                <Input
                  id='source'
                  placeholder='e.g., google, facebook, newsletter'
                  value={params.source}
                  onChange={(e) => setParams({ ...params, source: e.target.value })}
                  list='source-suggestions'
                />
                <datalist id='source-suggestions'>
                  {suggestions.source.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
                <p className='text-xs text-muted-foreground'>
                  Identify the advertiser, site, publication, etc.
                </p>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='medium'>Campaign Medium *</Label>
                <Input
                  id='medium'
                  placeholder='e.g., cpc, email, social'
                  value={params.medium}
                  onChange={(e) => setParams({ ...params, medium: e.target.value })}
                  list='medium-suggestions'
                />
                <datalist id='medium-suggestions'>
                  {suggestions.medium.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
                <p className='text-xs text-muted-foreground'>
                  Advertising or marketing medium
                </p>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='campaign'>Campaign Name *</Label>
              <Input
                id='campaign'
                placeholder='e.g., spring_sale_2026, product_launch'
                value={params.campaign}
                onChange={(e) => setParams({ ...params, campaign: e.target.value })}
                list='campaign-suggestions'
              />
              <datalist id='campaign-suggestions'>
                {suggestions.campaign.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <p className='text-xs text-muted-foreground'>
                Product, promo code, or slogan
              </p>
            </div>
          </div>

          <div className='space-y-4'>
            <h3 className='font-semibold text-sm text-muted-foreground'>
              Optional Parameters
            </h3>

            <div className='grid md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='term'>Campaign Term</Label>
                <Input
                  id='term'
                  placeholder='e.g., running+shoes, blue+widgets'
                  value={params.term}
                  onChange={(e) => setParams({ ...params, term: e.target.value })}
                />
                <p className='text-xs text-muted-foreground'>
                  Identify paid search keywords
                </p>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='content'>Campaign Content</Label>
                <Input
                  id='content'
                  placeholder='e.g., logolink, textlink, button_a'
                  value={params.content}
                  onChange={(e) => setParams({ ...params, content: e.target.value })}
                />
                <p className='text-xs text-muted-foreground'>
                  Differentiate ads or links
                </p>
              </div>
            </div>
          </div>

          {errors.length > 0 && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                <ul className='list-disc list-inside'>
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className='flex gap-3'>
            <Button onClick={handleGenerate} className='flex-1' size='lg'>
              <Link2 className='h-4 w-4 mr-2' />
              Generate URL
            </Button>
            <Button onClick={handleReset} variant='outline' size='lg'>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedUrl && (
        <Card className='border-green-200 dark:border-green-900'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-green-600'>
              <CheckCircle2 className='h-5 w-5' />
              Generated Campaign URL
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label>Full URL with UTM Parameters</Label>
              <Textarea
                value={generatedUrl}
                readOnly
                rows={3}
                className='font-mono text-sm'
              />
              <div className='flex gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => copyToClipboard(generatedUrl)}
                >
                  <Copy className='h-4 w-4 mr-2' />
                  Copy URL
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => window.open(generatedUrl, '_blank')}
                >
                  <ExternalLink className='h-4 w-4 mr-2' />
                  Test Link
                </Button>
              </div>
            </div>

            <div className='border-t pt-4'>
              <div className='flex items-center justify-between mb-3'>
                <div>
                  <Label>Shorten This URL</Label>
                  <p className='text-xs text-muted-foreground mt-1'>
                    Create a short link for easier sharing
                  </p>
                </div>
                <Button
                  onClick={handleShorten}
                  disabled={loading || !!shortUrl}
                >
                  {loading ? 'Creating...' : shortUrl ? 'Created ✓' : 'Shorten'}
                </Button>
              </div>

              {shortUrl && (
                <div className='p-4 bg-muted rounded-lg space-y-3'>
                  <div className='flex items-center justify-between'>
                    <code className='text-lg font-mono'>{shortUrl}</code>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => copyToClipboard(shortUrl)}
                    >
                      <Copy className='h-4 w-4' />
                    </Button>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    <Badge variant='outline' className='gap-1'>
                      <Tag className='h-3 w-3' />
                      Source: {params.source}
                    </Badge>
                    <Badge variant='outline' className='gap-1'>
                      <Tag className='h-3 w-3' />
                      Medium: {params.medium}
                    </Badge>
                    <Badge variant='outline' className='gap-1'>
                      <Tag className='h-3 w-3' />
                      Campaign: {params.campaign}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
