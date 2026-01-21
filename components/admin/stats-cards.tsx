'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Link2, MousePointerClick, Flag, ShieldAlert, Ban, Trash2 } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

interface StatsCardsProps {
  stats: {
    totalUrls: number
    deletedUrls: number
    totalClicks: number
    totalUsers: number
    pendingReports: number
    flaggedUrls: number
    bannedIps: number
    bannedDomains: number
    last24hUrls: number
    last24hClicks: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total URLs',
      value: stats.totalUrls,
      icon: Link2,
      trend: `+${stats.last24hUrls} today`,
      color: 'text-blue-600',
    },
    {
      title: 'Deleted URLs',
      value: stats.deletedUrls,
      icon: Trash2,
      color: 'text-gray-600',
    },
    {
      title: 'Total Clicks',
      value: stats.totalClicks,
      icon: MousePointerClick,
      trend: `+${stats.last24hClicks} today`,
      color: 'text-green-600',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-purple-600',
    },
    {
      title: 'Pending Reports',
      value: stats.pendingReports,
      icon: Flag,
      color: 'text-orange-600',
      alert: stats.pendingReports > 0,
    },
    {
      title: 'Flagged URLs',
      value: stats.flaggedUrls,
      icon: ShieldAlert,
      color: 'text-red-600',
    },
    {
      title: 'Banned IPs',
      value: stats.bannedIps,
      icon: Ban,
      color: 'text-gray-600',
    },
    {
      title: 'Banned Domains',
      value: stats.bannedDomains,
      icon: Ban,
      color: 'text-gray-600',
    },
  ]

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {cards.map((card, idx) => (
        <Card key={idx} className={card.alert ? 'border-orange-500' : ''}>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{formatNumber(card.value)}</div>
            {card.trend && (
              <p className='text-xs text-muted-foreground mt-1'>
                {card.trend}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
