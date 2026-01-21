'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Flag, AlertTriangle, CheckCircle2, Link2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const REPORT_REASONS = [
  { value: 'phishing', label: 'Phishing / Scam', description: 'Attempts to steal personal information or credentials' },
  { value: 'malware', label: 'Malware / Virus', description: 'Contains malicious software or security threats' },
  { value: 'spam', label: 'Spam / Unwanted Content', description: 'Unsolicited or repetitive promotional material' },
  { value: 'illegal', label: 'Illegal Content', description: 'Violates applicable laws or regulations' },
  { value: 'adult', label: 'Adult Content', description: 'Sexually explicit or inappropriate material' },
  { value: 'copyright', label: 'Copyright Violation', description: 'Unauthorized distribution of copyrighted material' },
  { value: 'misleading', label: 'Misleading Information', description: 'Contains deceptive or factually incorrect information' },
  { value: 'other', label: 'Other Concern', description: 'Other security, privacy, or policy violation' },
]

export function ReportAnyUrlForm() {
  const [shortCode, setShortCode] = useState('')
  const [selectedReason, setSelectedReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const extractShortCode = (input: string): string => {
    try {
      const url = new URL(input)
      const pathParts = url.pathname.split('/').filter(Boolean)
      return pathParts[pathParts.length - 1] || ''
    } catch {
      return input.trim()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const code = extractShortCode(shortCode)

    if (!code || !selectedReason) {
      setError('Please enter a URL and select a reason')
      setLoading(false)
      return
    }

    try {
      const reason = REPORT_REASONS.find(r => r.value === selectedReason)
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shortCode: code,
          reason: `${reason?.label}: ${reason?.description}`,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setShortCode('')
        setSelectedReason('')
        toast({
          title: 'Report Submitted',
          description: data.autoFlagged
            ? 'URL has been automatically flagged due to multiple reports.'
            : 'Thank you! An admin will review this report.',
        })
      } else if (response.status === 403) {
        setError('You cannot report your own URLs')
      } else if (response.status === 409) {
        setError('You have already reported this URL')
      } else if (response.status === 404) {
        setError('URL not found. Please check the short code and try again.')
      } else {
        throw new Error(data.error || 'Failed to submit report')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report')
      toast({
        title: 'Error',
        description: 'Failed to submit report. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className='max-w-2xl mx-auto'>
        <CardContent className='py-12 text-center space-y-4'>
          <CheckCircle2 className='h-16 w-16 text-green-600 mx-auto' />
          <div>
            <h3 className='text-2xl font-bold'>Report Submitted!</h3>
            <p className='text-muted-foreground mt-2'>
              Thank you for helping keep our community safe.
            </p>
          </div>
          <Button onClick={() => setSuccess(false)}>Report Another URL</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='max-w-2xl mx-auto'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Flag className='h-6 w-6' />
          Report a Shortened URL
        </CardTitle>
        <CardDescription>
          Enter any shortened URL from our service to report it
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Shortened URL or Code</label>
            <div className='flex gap-2'>
              <div className='relative flex-1'>
                <Link2 className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='https://s.thenolle.com/abc1234 or abc1234'
                  value={shortCode}
                  onChange={(e) => setShortCode(e.target.value)}
                  className='pl-9'
                  required
                />
              </div>
            </div>
            <p className='text-xs text-muted-foreground'>
              Enter the full URL or just the short code
            </p>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>Report Reason</label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger>
                <SelectValue placeholder='Why are you reporting this URL?' />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    <div className='flex flex-col items-start'>
                      <span className='font-medium'>{reason.label}</span>
                      <span className='text-xs text-muted-foreground'>
                        {reason.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Alert>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription className='text-sm'>
              <p className='font-medium mb-2'>What happens next?</p>
              <ul className='space-y-1 text-xs'>
                <li>• Reports are reviewed by our security team</li>
                <li>• URLs with 5+ reports are automatically disabled</li>
                <li>• False reports may result in account restrictions</li>
              </ul>
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type='submit'
            disabled={!shortCode.trim() || !selectedReason || loading}
            className='w-full'
            variant='destructive'
          >
            {loading ? 'Submitting Report...' : 'Submit Report'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
