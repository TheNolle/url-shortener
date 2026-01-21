'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Shuffle, BarChart3, ArrowRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface RotationLink {
  url: string
  weight: number
  label: string
}

export function RotationCreator() {
  const [links, setLinks] = useState<RotationLink[]>([
    { url: '', weight: 1, label: 'Variant A' },
    { url: '', weight: 1, label: 'Variant B' },
  ])
  const [rotationType, setRotationType] = useState<'random' | 'weighted' | 'sequential'>('random')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { toast } = useToast()

  const addLink = () => {
    setLinks([...links, { url: '', weight: 1, label: `Variant ${String.fromCharCode(65 + links.length)}` }])
  }

  const removeLink = (index: number) => {
    if (links.length <= 2) {
      toast({
        title: 'Minimum Required',
        description: 'You need at least 2 links for rotation',
        variant: 'destructive',
      })
      return
    }
    setLinks(links.filter((_, i) => i !== index))
  }

  const updateLink = (index: number, field: keyof RotationLink, value: string | number) => {
    const newLinks = [...links]
    newLinks[index] = { ...newLinks[index], [field]: value }
    setLinks(newLinks)
  }

  const handleCreate = async () => {
    const invalidLinks = links.filter((link) => !link.url.trim())
    if (invalidLinks.length > 0) {
      toast({
        title: 'Invalid URLs',
        description: 'All links must have a destination URL',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/rotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          links: links.map((link) => ({
            url: link.url,
            weight: rotationType === 'weighted' ? link.weight : 1,
            label: link.label,
          })),
          rotationType,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        toast({
          title: 'Rotation Created!',
          description: `Your A/B test link is ready`,
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create rotation',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <Card>
        <CardContent className='py-12 text-center space-y-6'>
          <div className='mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center'>
            <Shuffle className='h-8 w-8 text-green-600' />
          </div>
          <div>
            <h3 className='text-2xl font-bold mb-2'>Rotation Link Created!</h3>
            <p className='text-muted-foreground'>Traffic will be distributed across {links.length} destinations</p>
          </div>
          <div className='bg-muted p-4 rounded-lg'>
            <p className='text-sm text-muted-foreground mb-2'>Your rotation link:</p>
            <code className='text-lg font-mono'>{result.shortUrl}</code>
          </div>
          <Button onClick={() => { setResult(null); setLinks([{ url: '', weight: 1, label: 'Variant A' }, { url: '', weight: 1, label: 'Variant B' }]) }}>
            Create Another
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Shuffle className='h-6 w-6' />
          A/B Testing & Link Rotation
        </CardTitle>
        <CardDescription>
          Create one short link that rotates between multiple destinations
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='space-y-2'>
          <Label>Rotation Type</Label>
          <Select value={rotationType} onValueChange={(v: any) => setRotationType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='random'>
                <div className='flex flex-col items-start'>
                  <span className='font-medium'>Random</span>
                  <span className='text-xs text-muted-foreground'>Equal distribution</span>
                </div>
              </SelectItem>
              <SelectItem value='weighted'>
                <div className='flex flex-col items-start'>
                  <span className='font-medium'>Weighted</span>
                  <span className='text-xs text-muted-foreground'>Custom traffic split</span>
                </div>
              </SelectItem>
              <SelectItem value='sequential'>
                <div className='flex flex-col items-start'>
                  <span className='font-medium'>Sequential</span>
                  <span className='text-xs text-muted-foreground'>Round-robin</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <Label>Destination Links ({links.length})</Label>
            <Button size='sm' variant='outline' onClick={addLink}>
              <Plus className='h-4 w-4 mr-2' />
              Add Link
            </Button>
          </div>

          {links.map((link, index) => (
            <div key={index} className='flex gap-3 items-start p-4 border rounded-lg'>
              <div className='flex-1 space-y-3'>
                <Input
                  placeholder={`Destination URL ${index + 1}`}
                  value={link.url}
                  onChange={(e) => updateLink(index, 'url', e.target.value)}
                />
                <div className='grid grid-cols-2 gap-3'>
                  <Input
                    placeholder='Label'
                    value={link.label}
                    onChange={(e) => updateLink(index, 'label', e.target.value)}
                  />
                  {rotationType === 'weighted' && (
                    <Input
                      type='number'
                      min='1'
                      placeholder='Weight'
                      value={link.weight}
                      onChange={(e) => updateLink(index, 'weight', parseInt(e.target.value) || 1)}
                    />
                  )}
                </div>
              </div>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => removeLink(index)}
                disabled={links.length <= 2}
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </div>
          ))}
        </div>

        {rotationType === 'weighted' && (
          <div className='bg-muted p-4 rounded-lg'>
            <div className='flex items-center gap-2 mb-2'>
              <BarChart3 className='h-4 w-4' />
              <span className='text-sm font-medium'>Traffic Distribution</span>
            </div>
            {links.map((link, index) => {
              const total = links.reduce((sum, l) => sum + l.weight, 0)
              const percentage = ((link.weight / total) * 100).toFixed(1)
              return (
                <div key={index} className='flex items-center gap-2 text-sm'>
                  <span className='w-24'>{link.label}:</span>
                  <div className='flex-1 bg-background rounded-full h-2'>
                    <div
                      className='bg-primary h-2 rounded-full'
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className='w-12 text-right'>{percentage}%</span>
                </div>
              )
            })}
          </div>
        )}

        <Button onClick={handleCreate} disabled={loading} className='w-full' size='lg'>
          {loading ? 'Creating...' : 'Create Rotation Link'}
          <ArrowRight className='h-4 w-4 ml-2' />
        </Button>
      </CardContent>
    </Card>
  )
}
