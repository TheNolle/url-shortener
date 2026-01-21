'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Flag, CheckCircle2, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ReportUrlButtonProps {
  shortCode: string
  variant?: 'default' | 'ghost' | 'outline'
  isOwnUrl?: boolean
}

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

export function ReportUrlButton({ shortCode, variant = 'outline', isOwnUrl = false }: ReportUrlButtonProps) {
  const [open, setOpen] = useState(false)
  const [selectedReason, setSelectedReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [reported, setReported] = useState(false)
  const { toast } = useToast()

  if (isOwnUrl) {
    return null
  }

  const handleReport = async () => {
    if (!selectedReason) return

    setLoading(true)

    try {
      const reason = REPORT_REASONS.find(r => r.value === selectedReason)
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shortCode,
          reason: `${reason?.label}: ${reason?.description}`,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setReported(true)
        toast({
          title: 'Report Submitted',
          description: data.autoFlagged
            ? 'URL has been automatically flagged and disabled due to multiple reports.'
            : 'Thank you for helping keep our community safe. An admin will review this report.',
        })
        setTimeout(() => setOpen(false), 2000)
      } else if (response.status === 409) {
        toast({
          title: 'Already Reported',
          description: 'You have already reported this URL.',
          variant: 'destructive',
        })
        setOpen(false)
      } else if (response.status === 403) {
        toast({
          title: 'Cannot Report',
          description: 'You cannot report your own URLs.',
          variant: 'destructive',
        })
        setOpen(false)
      } else {
        throw new Error(data.error || 'Failed to submit report')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit report',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size='default'>
          <Flag className='h-4 w-4 mr-2' />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        {!reported ? (
          <>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                <Flag className='h-5 w-5 text-orange-600' />
                Report URL
              </DialogTitle>
              <DialogDescription>
                Help us keep the community safe by reporting suspicious or harmful URLs.
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Why are you reporting this URL?</label>
                <Select value={selectedReason} onValueChange={setSelectedReason}>
                  <SelectTrigger>
                    <SelectValue placeholder='Select a reason...' />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_REASONS.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        <div className='flex flex-col items-start'>
                          <span className='font-medium'>{reason.label}</span>
                          <span className='text-xs text-muted-foreground'>{reason.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='bg-muted p-3 rounded-lg text-xs text-muted-foreground'>
                <div className='flex items-start gap-2'>
                  <AlertTriangle className='h-4 w-4 mt-0.5 shrink-0' />
                  <div>
                    <p className='font-medium mb-1'>What happens next?</p>
                    <ul className='space-y-1'>
                      <li>• Your report is reviewed by our security team</li>
                      <li>• URLs with 5+ reports are auto-flagged</li>
                      <li>• False reports may result in restrictions</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleReport}
                disabled={!selectedReason || loading}
                variant='destructive'
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className='py-8 text-center space-y-4'>
            <CheckCircle2 className='h-16 w-16 text-green-600 mx-auto' />
            <div>
              <h3 className='text-lg font-semibold'>Report Submitted</h3>
              <p className='text-sm text-muted-foreground mt-2'>
                Thank you for helping keep our community safe!
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
