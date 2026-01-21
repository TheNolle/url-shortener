'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Ban, Trash2, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { timeAgo } from '@/lib/utils'

interface BanItem {
  id: string
  target: string
  reason: string | null
  bannedAt: string
  bannedBy: string
}

interface BanManagerProps {
  type: 'ip' | 'domain'
  initialBans: BanItem[]
}

export function BanManager({ type, initialBans }: BanManagerProps) {
  const [bans, setBans] = useState(initialBans)
  const [newTarget, setNewTarget] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()

  const handleBan = async () => {
    if (!newTarget.trim()) return

    setLoading(true)

    try {
      const endpoint = type === 'ip' ? '/api/admin/ban/ip' : '/api/admin/ban/domain'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [type]: newTarget.trim(),
          reason: reason.trim() || undefined,
        }),
      })

      if (response.ok) {
        const listResponse = await fetch(endpoint)
        const data = await listResponse.json()
        setBans(type === 'ip' ? data.bannedIps : data.bannedDomains)

        toast({
          title: 'Banned',
          description: `${type.toUpperCase()} has been banned`,
        })

        setNewTarget('')
        setReason('')
        setDialogOpen(false)
      } else {
        throw new Error('Failed to ban')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ban ${type}`,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUnban = async (id: string) => {
    try {
      const endpoint = type === 'ip' ? '/api/admin/ban/ip' : '/api/admin/ban/domain'
      const response = await fetch(`${endpoint}?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setBans(bans.filter(b => b.id !== id))
        toast({
          title: 'Unbanned',
          description: `${type.toUpperCase()} has been unbanned`,
        })
      } else {
        throw new Error('Failed to unban')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to unban ${type}`,
        variant: 'destructive',
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Banned {type === 'ip' ? 'IPs' : 'Domains'}</CardTitle>
            <CardDescription>{bans.length} {type === 'ip' ? 'IPs' : 'domains'} banned</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size='sm'>
                <Plus className='h-4 w-4 mr-2' />
                Ban {type === 'ip' ? 'IP' : 'Domain'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ban {type === 'ip' ? 'IP Address' : 'Domain'}</DialogTitle>
                <DialogDescription>
                  Add a new {type} to the ban list. This will prevent all requests from this {type}.
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-4 py-4'>
                <Input
                  placeholder={type === 'ip' ? '192.168.1.1' : 'example.com'}
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                />
                <Input
                  placeholder='Reason (optional)'
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant='outline' onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBan} disabled={loading || !newTarget.trim()}>
                  <Ban className='h-4 w-4 mr-2' />
                  Ban
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {bans.length === 0 ? (
          <div className='text-center py-12 text-muted-foreground'>
            No banned {type === 'ip' ? 'IPs' : 'domains'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{type === 'ip' ? 'IP Address' : 'Domain'}</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Banned</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bans.map((ban) => (
                <TableRow key={ban.id}>
                  <TableCell className='font-mono'>{ban.target}</TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {ban.reason || 'No reason provided'}
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {timeAgo(new Date(ban.bannedAt))}
                  </TableCell>
                  <TableCell className='text-right'>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => handleUnban(ban.id)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
