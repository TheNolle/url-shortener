'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Globe, Monitor, ExternalLink, BarChart3 } from 'lucide-react'

interface AnalyticsChartsProps {
  analytics: any
}

export function AnalyticsCharts({ analytics }: AnalyticsChartsProps) {
  return (
    <div className='grid gap-6 md:grid-cols-2'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Globe className='h-5 w-5' />
            Top Countries
          </CardTitle>
          <CardDescription>Clicks by geographic location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {analytics.clicksByCountry.map((item: any, index: number) => {
              const percentage = (item.count / analytics.totalClicks) * 100
              return (
                <div key={index} className='space-y-1'>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='font-medium'>{item.country}</span>
                    <span className='text-muted-foreground'>{item.count} clicks</span>
                  </div>
                  <div className='h-2 bg-muted rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-primary'
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {analytics.clicksByCountry.length === 0 && (
              <p className='text-sm text-muted-foreground text-center py-8'>
                No data available yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Monitor className='h-5 w-5' />
            Devices
          </CardTitle>
          <CardDescription>Clicks by device type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {analytics.clicksByDevice.map((item: any, index: number) => {
              const percentage = (item.count / analytics.totalClicks) * 100
              return (
                <div key={index} className='space-y-1'>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='font-medium capitalize'>{item.device}</span>
                    <span className='text-muted-foreground'>{item.count} clicks</span>
                  </div>
                  <div className='h-2 bg-muted rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-green-600'
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <BarChart3 className='h-5 w-5' />
            Browsers
          </CardTitle>
          <CardDescription>Clicks by browser</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {analytics.clicksByBrowser.map((item: any, index: number) => {
              const percentage = (item.count / analytics.totalClicks) * 100
              return (
                <div key={index} className='space-y-1'>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='font-medium'>{item.browser}</span>
                    <span className='text-muted-foreground'>{item.count} clicks</span>
                  </div>
                  <div className='h-2 bg-muted rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-purple-600'
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <ExternalLink className='h-5 w-5' />
            Top Referrers
          </CardTitle>
          <CardDescription>Traffic sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {analytics.topReferrers.map((item: any, index: number) => {
              const percentage = (item.count / analytics.totalClicks) * 100
              return (
                <div key={index} className='space-y-1'>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='font-medium truncate max-w-50'>
                      {item.referer}
                    </span>
                    <span className='text-muted-foreground'>{item.count} clicks</span>
                  </div>
                  <div className='h-2 bg-muted rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-orange-600'
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {analytics.topReferrers.length === 0 && (
              <p className='text-sm text-muted-foreground text-center py-8'>
                No referrer data available
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
