'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CheckCircle2, XCircle, ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { timeAgo } from '@/lib/utils'

interface Report {
  id: string
  reason: string
  createdAt: string
  reportedBy: string
  url: {
    shortCode: string
    originalUrl: string
  }
}

interface ReportQueueProps {
  initialReports: Report[]
}

export function ReportQueue({ initialReports }: ReportQueueProps) {
  const [reports, setReports] = useState(initialReports)
  const [loading, setLoading] = useState<string | null>(null)
  const { toast } = useToast()

  const handleReview = async (reportId: string, action: 'approve' | 'reject') => {
    setLoading(reportId)

    try {
      const response = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, action }),
      })

      if (response.ok) {
        setReports(reports.filter(r => r.id !== reportId))
        toast({
          title: action === 'approve' ? 'URL Flagged' : 'Report Rejected',
          description: `Report has been ${action === 'approve' ? 'approved and URL flagged' : 'rejected'}`,
        })
      } else {
        throw new Error('Failed to review report')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to review report',
        variant: 'destructive',
      })
    } finally {
      setLoading(null)
    }
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Report Queue</CardTitle>
          <CardDescription>No pending reports</CardDescription>
        </CardHeader>
        <CardContent className='text-center py-12 text-muted-foreground'>
          All clear! No reports to review.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Queue</CardTitle>
        <CardDescription>{reports.length} pending reports</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Short Code</TableHead>
              <TableHead>Original URL</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Reported</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell className='font-mono'>
                  {report.url.shortCode}
                </TableCell>
                <TableCell className='max-w-xs truncate'>
                  <a
                    href={report.url.originalUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='hover:underline text-muted-foreground flex items-center gap-1'
                  >
                    {report.url.originalUrl}
                    <ExternalLink className='h-3 w-3' />
                  </a>
                </TableCell>
                <TableCell>
                  <div className='max-w-md text-sm'>{report.reason}</div>
                </TableCell>
                <TableCell className='text-sm text-muted-foreground'>
                  {timeAgo(new Date(report.createdAt))}
                </TableCell>
                <TableCell className='text-right'>
                  <div className='flex justify-end gap-2'>
                    <Button
                      size='sm'
                      variant='default'
                      onClick={() => handleReview(report.id, 'approve')}
                      disabled={loading === report.id}
                    >
                      <CheckCircle2 className='h-4 w-4 mr-1' />
                      Approve
                    </Button>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => handleReview(report.id, 'reject')}
                      disabled={loading === report.id}
                    >
                      <XCircle className='h-4 w-4 mr-1' />
                      Reject
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
