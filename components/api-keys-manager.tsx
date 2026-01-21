'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Key, Plus, Trash2, Copy, CheckCircle2, AlertTriangle, Eye, EyeOff, Shield, Zap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { timeAgo } from '@/lib/utils'

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  isActive: boolean
  createdAt: string
  lastUsed: string | null
  expiresAt: string | null
  rateLimit: number
  requestCount: number
  bypassSecurity: boolean
  bypassRateLimit: boolean
}

export function ApiKeysManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [bypassSecurity, setBypassSecurity] = useState(false)
  const [bypassRateLimit, setBypassRateLimit] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [showNewKey, setShowNewKey] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadApiKeys()
    checkAdminStatus()
  }, [])

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/admin/check')
      setIsAdmin(response.ok)
    } catch {
      setIsAdmin(false)
    }
  }

  const loadApiKeys = async () => {
    try {
      const response = await fetch('/api/keys')
      const data = await response.json()
      setApiKeys(data.apiKeys || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load API keys',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const createKey = async () => {
    if (!newKeyName.trim()) return

    setCreating(true)
    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName,
          rateLimit: bypassRateLimit ? 999999 : 1000,
          bypassSecurity,
          bypassRateLimit,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setNewKey(data.apiKey.key)
        setNewKeyName('')
        setBypassSecurity(false)
        setBypassRateLimit(false)
        await loadApiKeys()
        toast({
          title: 'API Key Created',
          description: data.apiKey.bypassSecurity || data.apiKey.bypassRateLimit
            ? 'Privileged key created with bypass permissions'
            : 'Save your key now. You won\'t see it again!',
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create API key',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  const revokeKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/keys?id=${keyId}`, { method: 'DELETE' })

      if (response.ok) {
        await loadApiKeys()
        toast({ title: 'Key Revoked', description: 'API key has been revoked' })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to revoke key',
        variant: 'destructive',
      })
    }
  }

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast({ title: 'Copied!', description: 'API key copied to clipboard' })
  }

  if (loading) {
    return <div className='text-center py-8'>Loading...</div>
  }

  return (
    <div className='space-y-6'>
      {newKey && (
        <Alert>
          <CheckCircle2 className='h-4 w-4' />
          <AlertDescription>
            <div className='space-y-3'>
              <p className='font-semibold'>Your new API key:</p>
              <div className='flex items-center gap-2'>
                <code className='flex-1 bg-muted p-2 rounded text-sm break-all'>
                  {showNewKey ? newKey : '•'.repeat(50)}
                </code>
                <Button size='sm' variant='ghost' onClick={() => setShowNewKey(!showNewKey)}>
                  {showNewKey ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </Button>
                <Button size='sm' variant='outline' onClick={() => copyKey(newKey)}>
                  <Copy className='h-4 w-4' />
                </Button>
              </div>
              <p className='text-sm text-destructive'>
                Save this key now. You will not be able to see it again!
              </p>
              <Button size='sm' onClick={() => setNewKey(null)}>I've saved it</Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Create and manage API keys for programmatic access</CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className='h-4 w-4 mr-2' />
                  Create Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create API Key</DialogTitle>
                  <DialogDescription>
                    Give your API key a descriptive name
                  </DialogDescription>
                </DialogHeader>
                <div className='space-y-4 py-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='keyName'>Key Name</Label>
                    <Input
                      id='keyName'
                      placeholder='My Production API Key'
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                  </div>

                  {isAdmin && (
                    <div className='space-y-3 border-t pt-4'>
                      <div className='flex items-start gap-3'>
                        <Shield className='h-5 w-5 text-orange-600 mt-0.5' />
                        <div className='flex-1 space-y-3'>
                          <div>
                            <h4 className='font-semibold text-sm'>Admin Privileges</h4>
                            <p className='text-xs text-muted-foreground'>
                              Available only for administrators
                            </p>
                          </div>

                          <div className='flex items-center space-x-2'>
                            <Checkbox
                              id='bypassSecurity'
                              checked={bypassSecurity}
                              onCheckedChange={(checked) => setBypassSecurity(checked as boolean)}
                            />
                            <Label htmlFor='bypassSecurity' className='text-sm cursor-pointer'>
                              <span className='font-medium'>Bypass Security Scanning</span>
                              <p className='text-xs text-muted-foreground font-normal'>
                                Skip URL validation and malware detection for automation
                              </p>
                            </Label>
                          </div>

                          <div className='flex items-center space-x-2'>
                            <Checkbox
                              id='bypassRateLimit'
                              checked={bypassRateLimit}
                              onCheckedChange={(checked) => setBypassRateLimit(checked as boolean)}
                            />
                            <Label htmlFor='bypassRateLimit' className='text-sm cursor-pointer'>
                              <span className='font-medium'>Bypass Rate Limiting</span>
                              <p className='text-xs text-muted-foreground font-normal'>
                                Unlimited requests per hour for high-volume automation
                              </p>
                            </Label>
                          </div>

                          {(bypassSecurity || bypassRateLimit) && (
                            <Alert variant='destructive' className='text-xs'>
                              <AlertTriangle className='h-3 w-3' />
                              <AlertDescription>
                                Use privileged keys responsibly. Bypassing security can expose your service to malicious URLs.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button onClick={createKey} disabled={creating || !newKeyName.trim()}>
                    {creating ? 'Creating...' : 'Create Key'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className='text-center py-12'>
              <Key className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
              <p className='text-muted-foreground'>No API keys yet</p>
              <p className='text-sm text-muted-foreground'>Create your first API key to get started</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className='flex items-center justify-between p-4 border rounded-lg'
                >
                  <div className='space-y-1'>
                    <div className='flex items-center gap-2'>
                      <p className='font-medium'>{key.name}</p>
                      {!key.isActive && (
                        <span className='text-xs bg-destructive/10 text-destructive px-2 py-1 rounded'>
                          Revoked
                        </span>
                      )}
                      {key.bypassSecurity && (
                        <span className='text-xs bg-orange-500/10 text-orange-600 px-2 py-1 rounded flex items-center gap-1'>
                          <Shield className='h-3 w-3' />
                          No Scan
                        </span>
                      )}
                      {key.bypassRateLimit && (
                        <span className='text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded flex items-center gap-1'>
                          <Zap className='h-3 w-3' />
                          Unlimited
                        </span>
                      )}
                    </div>
                    <div className='flex items-center gap-3 text-sm text-muted-foreground'>
                      <code className='bg-muted px-2 py-1 rounded'>{key.keyPrefix}...</code>
                      <span>•</span>
                      <span>Created {timeAgo(new Date(key.createdAt))}</span>
                      {key.lastUsed && (
                        <>
                          <span>•</span>
                          <span>Last used {timeAgo(new Date(key.lastUsed))}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{key.requestCount} requests</span>
                    </div>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => revokeKey(key.id)}
                    disabled={!key.isActive}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
          <CardDescription>How to use your API keys</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <h3 className='font-semibold mb-2'>Authentication</h3>
            <p className='text-sm text-muted-foreground mb-2'>
              Include your API key in the Authorization header:
            </p>
            <code className='block bg-muted p-3 rounded text-sm'>
              Authorization: Bearer YOUR_API_KEY
            </code>
          </div>

          <div>
            <h3 className='font-semibold mb-2'>Shorten URL</h3>
            <code className='block bg-muted p-3 rounded text-sm whitespace-pre'>
              {`POST /api/v1/shorten
Content-Type: application/json

{
  "url": "https://example.com",
  "password": "optional",
  "expiresInDays": 30
}`}
            </code>
          </div>

          {isAdmin && (
            <Alert>
              <Shield className='h-4 w-4' />
              <AlertDescription>
                <p className='font-semibold mb-2'>Privileged API Keys</p>
                <ul className='text-sm space-y-1'>
                  <li>• <strong>Bypass Security:</strong> URLs are not scanned for malware or phishing</li>
                  <li>• <strong>Bypass Rate Limit:</strong> No hourly request restrictions</li>
                  <li>• Only available for administrator accounts</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div>
            <h3 className='font-semibold mb-2'>Get URL Info</h3>
            <code className='block bg-muted p-3 rounded text-sm'>
              GET /api/v1/urls/abc1234
            </code>
          </div>

          <div>
            <h3 className='font-semibold mb-2'>Delete URL</h3>
            <code className='block bg-muted p-3 rounded text-sm'>
              DELETE /api/v1/urls/abc1234
            </code>
          </div>

          <div>
            <h3 className='font-semibold mb-2'>List All URLs</h3>
            <code className='block bg-muted p-3 rounded text-sm'>
              GET /api/v1/urls
            </code>
          </div>

          <Alert>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>
              <p className='font-semibold mb-1'>Rate Limits</p>
              <p className='text-sm'>Standard API keys: 1,000 requests per hour</p>
              <p className='text-sm'>Privileged keys (admins only): Unlimited</p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}