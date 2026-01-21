'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BarChart3, ExternalLink, TrendingUp, Edit, Check, X, Pause, Play } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface RotationLink {
  id: string
  destination: string
  label: string | null
  weight: number
  clicks: number
  percentage: string
  isActive: boolean
}

interface RotationStatsProps {
  stats: {
    links: RotationLink[]
    totalClicks: number
  }
  shortCode: string
  rotationType: string
  totalClicks: number
}

export function RotationStats({ stats, shortCode, rotationType, totalClicks }: RotationStatsProps) {
  const [links, setLinks] = useState(stats.links)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editWeight, setEditWeight] = useState(1)
  const { toast } = useToast()

  const handleEdit = (link: RotationLink) => {
    setEditingId(link.id)
    setEditLabel(link.label || '')
    setEditWeight(link.weight)
  }

  const handleSave = async (linkId: string) => {
    try {
      const response = await fetch(`/api/rotation/${linkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: editLabel,
          weight: editWeight,
        }),
      })

      if (response.ok) {
        setLinks(
          links.map((link) =>
            link.id === linkId
              ? { ...link, label: editLabel, weight: editWeight }
              : link
          )
        )
        setEditingId(null)
        toast({ title: 'Updated', description: 'Link updated successfully' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update link', variant: 'destructive' })
    }
  }

  const handleToggle = async (linkId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/rotation/${linkId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (response.ok) {
        setLinks(
          links.map((link) =>
            link.id === linkId ? { ...link, isActive: !isActive } : link
          )
        )
        toast({
          title: isActive ? 'Disabled' : 'Enabled',
          description: `Variant ${isActive ? 'disabled' : 'enabled'}`,
        })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to toggle link', variant: 'destructive' })
    }
  }

  const winner = links.reduce((prev, current) =>
    current.clicks > prev.clicks ? current : prev
  )

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Clicks</CardTitle>
            <BarChart3 className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalClicks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Variants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{links.length}</div>
            <p className='text-xs text-muted-foreground'>
              {links.filter((l) => l.isActive).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Rotation Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold capitalize'>{rotationType}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Top Performer</CardTitle>
            <TrendingUp className='h-4 w-4 text-green-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{winner.percentage}%</div>
            <p className='text-xs text-muted-foreground'>{winner.label}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Variant Performance</CardTitle>
          <CardDescription>
            Click distribution across all destinations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {links.map((link) => (
              <div
                key={link.id}
                className={`p-4 border rounded-lg ${!link.isActive ? 'opacity-50 bg-muted/50' : ''
                  }`}
              >
                <div className='space-y-3'>
                  {/* Header */}
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      {editingId === link.id ? (
                        <div className='flex items-center gap-2'>
                          <Input
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            className='w-48'
                            placeholder='Label'
                          />
                          {rotationType === 'weighted' && (
                            <Input
                              type='number'
                              min='1'
                              value={editWeight}
                              onChange={(e) => setEditWeight(parseInt(e.target.value) || 1)}
                              className='w-24'
                              placeholder='Weight'
                            />
                          )}
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => handleSave(link.id)}
                          >
                            <Check className='h-4 w-4' />
                          </Button>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => setEditingId(null)}
                          >
                            <X className='h-4 w-4' />
                          </Button>
                        </div>
                      ) : (
                        <div className='flex items-center gap-2'>
                          <h4 className='font-semibold'>{link.label || 'Variant'}</h4>
                          {link.id === winner.id && totalClicks > 0 && (
                            <Badge variant='default' className='gap-1'>
                              <TrendingUp className='h-3 w-3' />
                              Winner
                            </Badge>
                          )}
                          {!link.isActive && (
                            <Badge variant='secondary'>Disabled</Badge>
                          )}
                          {rotationType === 'weighted' && (
                            <Badge variant='outline'>Weight: {link.weight}</Badge>
                          )}
                        </div>
                      )}
                      <a
                        href={link.destination}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-sm text-muted-foreground hover:underline flex items-center gap-1 mt-1'
                      >
                        {link.destination.substring(0, 60)}...
                        <ExternalLink className='h-3 w-3' />
                      </a>
                    </div>

                    <div className='flex items-center gap-2'>
                      {editingId !== link.id && (
                        <>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => handleEdit(link)}
                          >
                            <Edit className='h-4 w-4' />
                          </Button>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => handleToggle(link.id, link.isActive)}
                          >
                            {link.isActive ? <Pause className='h-4 w-4' /> : <Play className='h-4 w-4' />}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>Clicks</span>
                      <span className='font-semibold'>
                        {link.clicks} ({link.percentage}%)
                      </span>
                    </div>
                    <div className='w-full bg-muted rounded-full h-2'>
                      <div
                        className='bg-primary h-2 rounded-full transition-all'
                        style={{ width: `${link.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
