import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MousePointerClick, TrendingUp, Calendar, Clock } from 'lucide-react'
import { formatNumber, timeAgo } from '@/lib/utils'

interface AnalyticsStatsProps {
  analytics: any
}

export function AnalyticsStats({ analytics }: AnalyticsStatsProps) {
  const stats = [
    {
      title: 'Total Clicks',
      value: formatNumber(analytics.totalClicks),
      icon: MousePointerClick,
      color: 'text-blue-600',
    },
    {
      title: 'Last 7 Days',
      value: formatNumber(analytics.last7DaysClicks),
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      title: 'Last 30 Days',
      value: formatNumber(analytics.last30DaysClicks),
      icon: Calendar,
      color: 'text-purple-600',
    },
    {
      title: 'Last Click',
      value: analytics.lastClick ? timeAgo(new Date(analytics.lastClick)) : 'Never',
      icon: Clock,
      color: 'text-orange-600',
    },
  ]

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}