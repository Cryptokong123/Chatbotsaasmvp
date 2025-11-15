'use client'

import { useEffect, useState } from 'react'
import { Key, Plus, Copy, Trash2, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'
import { formatRelativeTime } from '@/lib/utils'
import { ApiKeysListSkeleton } from '@/components/skeletons'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  last_used_at: string | null
  usage_count: number
  rate_limit: number
  is_active: boolean
  expires_at: string | null
  created_at: string
  key?: string
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyRateLimit, setNewKeyRateLimit] = useState('1000')
  const [newKeyExpires, setNewKeyExpires] = useState('never')
  const [createdKey, setCreatedKey] = useState<ApiKey | null>(null)
  const [keyToDelete, setKeyToDelete] = useState<ApiKey | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/api-keys')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch API keys')
      }

      setApiKeys(data.apiKeys || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const expiresIn = newKeyExpires === 'never' ? null : parseInt(newKeyExpires)

      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName,
          rateLimit: parseInt(newKeyRateLimit),
          expiresIn,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create API key')
      }

      setCreatedKey(data.apiKey)
      toast({
        title: 'Success',
        description: 'API key created successfully',
      })

      setNewKeyName('')
      setNewKeyRateLimit('1000')
      setNewKeyExpires('never')
      fetchApiKeys()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  const handleToggleActive = async (keyId: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/api-keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId, isActive: !isActive }),
      })

      if (!response.ok) {
        throw new Error('Failed to update API key')
      }

      toast({
        title: 'Success',
        description: `API key ${!isActive ? 'enabled' : 'disabled'} successfully`,
      })

      fetchApiKeys()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleDeleteKey = async () => {
    if (!keyToDelete) return

    try {
      const response = await fetch(`/api/api-keys?keyId=${keyToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete API key')
      }

      toast({
        title: 'Success',
        description: 'API key deleted successfully',
      })

      setKeyToDelete(null)
      fetchApiKeys()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied!',
      description: 'API key copied to clipboard',
    })
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">API Keys</h1>
              <p className="text-gray-600">Manage API keys for integrating with external systems</p>
            </div>
          </div>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-gray-500" />
              <CardTitle>Your API Keys</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ApiKeysListSkeleton />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">API Keys</h1>
            <p className="text-gray-600">
              Manage API keys for integrating with external systems
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create API Key
          </Button>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 mb-1">Keep your API keys secure</h3>
            <p className="text-sm text-amber-800">
              API keys provide full access to your account. Never share them publicly or commit them to version control.
              Always use environment variables in your applications.
            </p>
          </div>
        </div>
      </div>

      {/* API Keys List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-gray-500" />
            <CardTitle>Your API Keys ({apiKeys.length})</CardTitle>
          </div>
          <CardDescription>View and manage your API keys</CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-12">
              <Key className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No API keys yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first API key to start integrating with external systems
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{apiKey.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          apiKey.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {apiKey.is_active ? 'Active' : 'Disabled'}
                      </span>
                      {apiKey.expires_at && new Date(apiKey.expires_at) < new Date() && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Expired
                        </span>
                      )}
                    </div>
                    <code className="text-sm text-gray-600 font-mono">{apiKey.key_prefix}••••••••••••••••••••</code>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>Created {formatRelativeTime(apiKey.created_at)}</span>
                      {apiKey.last_used_at && (
                        <span>Last used {formatRelativeTime(apiKey.last_used_at)}</span>
                      )}
                      <span>{apiKey.usage_count} requests</span>
                      <span>Rate limit: {apiKey.rate_limit}/hour</span>
                      {apiKey.expires_at && (
                        <span>Expires {formatRelativeTime(apiKey.expires_at)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(apiKey.id, apiKey.is_active)}
                      title={apiKey.is_active ? 'Disable' : 'Enable'}
                    >
                      {apiKey.is_active ? (
                        <EyeOff className="h-4 w-4 text-orange-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-green-500" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setKeyToDelete(apiKey)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create API Key</CardTitle>
              <CardDescription>Generate a new API key for your integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Production Server"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    required
                    disabled={creating}
                  />
                  <p className="text-xs text-gray-500">A descriptive name to identify this key</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rateLimit">Rate Limit (requests/hour)</Label>
                  <Select value={newKeyRateLimit} onValueChange={setNewKeyRateLimit} disabled={creating}>
                    <SelectTrigger id="rateLimit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100 requests/hour</SelectItem>
                      <SelectItem value="500">500 requests/hour</SelectItem>
                      <SelectItem value="1000">1,000 requests/hour</SelectItem>
                      <SelectItem value="5000">5,000 requests/hour</SelectItem>
                      <SelectItem value="10000">10,000 requests/hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires">Expiration</Label>
                  <Select value={newKeyExpires} onValueChange={setNewKeyExpires} disabled={creating}>
                    <SelectTrigger id="expires">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never expires</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={creating} className="flex-1">
                    {creating ? 'Creating...' : 'Create API Key'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateDialog(false)
                      setNewKeyName('')
                      setNewKeyRateLimit('1000')
                      setNewKeyExpires('never')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Created Key Dialog */}
      {createdKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="text-green-600">API Key Created!</CardTitle>
              <CardDescription>Make sure to copy your API key now. You won't be able to see it again!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <Label className="text-sm font-medium mb-2 block">Your API Key</Label>
                <div className="flex gap-2">
                  <code className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm font-mono break-all">
                    {createdKey.key}
                  </code>
                  <Button size="sm" onClick={() => copyToClipboard(createdKey.key!)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    <strong>Important:</strong> Store this key securely. For security reasons, we cannot show it to you again.
                  </p>
                </div>
              </div>

              <Button onClick={() => setCreatedKey(null)} className="w-full">
                I've saved my API key
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!keyToDelete} onOpenChange={(open) => !open && setKeyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the API key <strong>{keyToDelete?.name}</strong>?
              This action cannot be undone and any applications using this key will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteKey} className="bg-red-600 hover:bg-red-700">
              Delete API Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
