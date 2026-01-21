import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import { timeAgo } from '@/lib/utils'

interface RecentClicksProps {
  clicks: Array<{
    clickedAt: Date
    country?: string | null
    device?: string | null
    browser?: string | null
    referer?: string | null
  }>
}

export function RecentClicks({ clicks }: RecentClicksProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Clock className='h-5 w-5' />
          Recent Clicks
        </CardTitle>
        <CardDescription>Last 20 clicks on this URL</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-2'>
          {clicks.map((click, index) => (
            <div
              key={index}
              className='flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors'
            >
              <div className='flex items-center gap-4'>
                <div className='text-sm'>
                  <p className='font-medium'>{timeAgo(new Date(click.clickedAt))}</p>
                  <p className='text-muted-foreground'>
                    {click.country || 'Unknown'} • {click.device || 'unknown'} • {click.browser || 'unknown'}
                  </p>
                </div>
              </div>
              {click.referer && (
                <span className='text-xs text-muted-foreground truncate max-w-50'>
                  {click.referer}
                </span>
              )}
            </div>
          ))}
          {clicks.length === 0 && (
            <p className='text-sm text-muted-foreground text-center py-8'>
              No clicks yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
