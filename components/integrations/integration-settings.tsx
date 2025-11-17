'use client'

import { useState, useEffect } from 'react'
import { Settings, Trash2, RefreshCw, Activity, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface IntegrationInstance {
  id: string
  integrationType: string
  instanceName: string
  status: 'connected' | 'disconnected' | 'error' | 'reconnecting'
  isHealthy: boolean
  enabled: boolean
  lastSyncedAt?: string
  lastError?: string
  metrics?: {
    totalMessages: number
    totalContacts: number
    totalConversations: number
  }
  createdAt: string
}

export default function IntegrationSettings() {
  const [instances, setInstances] = useState<IntegrationInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInstance, setSelectedInstance] = useState<IntegrationInstance | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    fetchInstances()
  }, [])

  const fetchInstances = async () => {
    try {
      const response = await fetch('/api/integrations/instances')
      const data = await response.json()
      if (data.success) {
        setInstances(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch instances:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleEnabled = async (instanceId: string, enabled: boolean) => {
    try {
      await fetch(`/api/integrations/${instanceId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })
      setInstances((prev) =>
        prev.map((instance) =>
          instance.id === instanceId ? { ...instance, enabled } : instance
        )
      )
    } catch (error) {
      console.error('Failed to toggle integration:', error)
    }
  }

  const handleReconnect = async (instanceId: string, integrationType: string) => {
    try {
      const response = await fetch(`/api/integrations/${integrationType}/reconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId }),
      })
      const data = await response.json()
      if (data.success && data.data.authUrl) {
        window.location.href = data.data.authUrl
      }
    } catch (error) {
      console.error('Failed to reconnect integration:', error)
    }
  }

  const handleDelete = async () => {
    if (!selectedInstance) return

    try {
      await fetch(`/api/integrations/${selectedInstance.integrationType}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId: selectedInstance.id }),
      })
      setInstances((prev) => prev.filter((i) => i.id !== selectedInstance.id))
      setShowDeleteDialog(false)
      setSelectedInstance(null)
    } catch (error) {
      console.error('Failed to delete integration:', error)
    }
  }

  const getStatusIcon = (status: IntegrationInstance['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'disconnected':
        return <XCircle className="h-5 w-5 text-gray-400" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'reconnecting':
        return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
    }
  }

  const getStatusBadge = (status: IntegrationInstance['status']) => {
    const variants: Record<string, { variant: any; label: string }> = {
      connected: { variant: 'default', label: 'Connected' },
      disconnected: { variant: 'secondary', label: 'Disconnected' },
      error: { variant: 'destructive', label: 'Error' },
      reconnecting: { variant: 'outline', label: 'Reconnecting' },
    }
    const config = variants[status]
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading integrations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Integration Settings</h1>
        <p className="text-gray-600">Manage your connected integrations and settings</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({instances.length})</TabsTrigger>
          <TabsTrigger value="active">
            Active ({instances.filter((i) => i.enabled).length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inactive ({instances.filter((i) => !i.enabled).length})
          </TabsTrigger>
          <TabsTrigger value="errors">
            Errors ({instances.filter((i) => i.status === 'error').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <IntegrationList
            instances={instances}
            onToggleEnabled={handleToggleEnabled}
            onReconnect={handleReconnect}
            onDelete={(instance) => {
              setSelectedInstance(instance)
              setShowDeleteDialog(true)
            }}
            getStatusIcon={getStatusIcon}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <IntegrationList
            instances={instances.filter((i) => i.enabled)}
            onToggleEnabled={handleToggleEnabled}
            onReconnect={handleReconnect}
            onDelete={(instance) => {
              setSelectedInstance(instance)
              setShowDeleteDialog(true)
            }}
            getStatusIcon={getStatusIcon}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="inactive" className="mt-6">
          <IntegrationList
            instances={instances.filter((i) => !i.enabled)}
            onToggleEnabled={handleToggleEnabled}
            onReconnect={handleReconnect}
            onDelete={(instance) => {
              setSelectedInstance(instance)
              setShowDeleteDialog(true)
            }}
            getStatusIcon={getStatusIcon}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="errors" className="mt-6">
          <IntegrationList
            instances={instances.filter((i) => i.status === 'error')}
            onToggleEnabled={handleToggleEnabled}
            onReconnect={handleReconnect}
            onDelete={(instance) => {
              setSelectedInstance(instance)
              setShowDeleteDialog(true)
            }}
            getStatusIcon={getStatusIcon}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Integration</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this integration? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedInstance && (
            <div className="py-4">
              <Alert>
                <AlertDescription>
                  You are about to delete <strong>{selectedInstance.instanceName}</strong>. All
                  associated data and configurations will be removed.
                </AlertDescription>
              </Alert>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function IntegrationList({
  instances,
  onToggleEnabled,
  onReconnect,
  onDelete,
  getStatusIcon,
  getStatusBadge,
}: {
  instances: IntegrationInstance[]
  onToggleEnabled: (id: string, enabled: boolean) => void
  onReconnect: (id: string, type: string) => void
  onDelete: (instance: IntegrationInstance) => void
  getStatusIcon: (status: IntegrationInstance['status']) => React.ReactNode
  getStatusBadge: (status: IntegrationInstance['status']) => React.ReactNode
}) {
  if (instances.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No integrations found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {instances.map((instance) => (
        <Card key={instance.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(instance.status)}
                <div>
                  <CardTitle className="text-lg">{instance.instanceName}</CardTitle>
                  <CardDescription className="mt-1">
                    {instance.integrationType.charAt(0).toUpperCase() +
                      instance.integrationType.slice(1)}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(instance.status)}
                {instance.isHealthy && (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    <Activity className="h-3 w-3 mr-1" />
                    Healthy
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {instance.lastError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{instance.lastError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Messages</p>
                <p className="text-2xl font-bold">{instance.metrics?.totalMessages || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Contacts</p>
                <p className="text-2xl font-bold">{instance.metrics?.totalContacts || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Conversations</p>
                <p className="text-2xl font-bold">
                  {instance.metrics?.totalConversations || 0}
                </p>
              </div>
            </div>

            {instance.lastSyncedAt && (
              <p className="text-sm text-gray-600 mt-4">
                Last synced: {new Date(instance.lastSyncedAt).toLocaleString()}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={instance.enabled}
                onCheckedChange={(enabled) => onToggleEnabled(instance.id, enabled)}
              />
              <Label>Enabled</Label>
            </div>
            <div className="flex gap-2">
              {instance.status === 'error' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReconnect(instance.id, instance.integrationType)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reconnect
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  /* Open settings modal */
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="destructive" size="sm" onClick={() => onDelete(instance)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
