'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Zap, Plus, Pencil, Trash2, AlertCircle, Play, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'

interface ActionParameter {
  name: string
  type: 'string' | 'number' | 'boolean'
  description: string
  required: boolean
}

interface BotAction {
  id: string
  name: string
  display_name: string
  description: string
  webhook_url: string
  method: string
  headers: Record<string, string>
  parameters: ActionParameter[]
  requires_confirmation: boolean
  confirmation_message?: string
  is_active: boolean
  created_at: string
}

export default function ActionsPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const botId = params.id as string

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAction, setEditingAction] = useState<BotAction | null>(null)
  const [showLogs, setShowLogs] = useState(false)
  const [selectedActionForLogs, setSelectedActionForLogs] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    webhookUrl: '',
    method: 'POST',
    headers: {} as Record<string, string>,
    parameters: [] as ActionParameter[],
    requiresConfirmation: true,
    confirmationMessage: '',
  })

  // Fetch actions
  const { data, isLoading } = useQuery({
    queryKey: ['bot-actions', botId],
    queryFn: async () => {
      const res = await fetch(`/api/bot-actions?botId=${botId}`)
      if (!res.ok) throw new Error('Failed to fetch actions')
      return res.json()
    },
  })

  // Fetch logs
  const { data: logsData } = useQuery({
    queryKey: ['action-logs', botId, selectedActionForLogs],
    queryFn: async () => {
      let url = `/api/bot-actions/logs?botId=${botId}`
      if (selectedActionForLogs) url += `&actionId=${selectedActionForLogs}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch logs')
      return res.json()
    },
    enabled: showLogs,
  })

  // Create action mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/bot-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId,
          name: data.name,
          displayName: data.displayName,
          description: data.description,
          webhookUrl: data.webhookUrl,
          method: data.method,
          headers: data.headers,
          parameters: data.parameters,
          requiresConfirmation: data.requiresConfirmation,
          confirmationMessage: data.confirmationMessage,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create action')
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-actions', botId] })
      toast.success('Action created!')
      resetForm()
      setIsDialogOpen(false)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Update action mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const res = await fetch(`/api/bot-actions?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Failed to update action')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-actions', botId] })
      toast.success('Action updated!')
      resetForm()
      setIsDialogOpen(false)
    },
    onError: () => {
      toast.error('Failed to update action')
    },
  })

  // Delete action mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/bot-actions?id=${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete action')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-actions', botId] })
      toast.success('Action deleted!')
    },
    onError: () => {
      toast.error('Failed to delete action')
    },
  })

  // Test action mutation
  const testMutation = useMutation({
    mutationFn: async ({ actionId, parameters }: { actionId: string; parameters: any }) => {
      const res = await fetch('/api/bot-actions/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId, parameters }),
      })

      if (!res.ok) throw new Error('Failed to test action')
      return res.json()
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Action tested successfully! (${data.executionTimeMs}ms)`)
      } else {
        toast.error(`Action failed: ${data.error}`)
      }
      queryClient.invalidateQueries({ queryKey: ['action-logs', botId] })
    },
    onError: () => {
      toast.error('Failed to test action')
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      webhookUrl: '',
      method: 'POST',
      headers: {},
      parameters: [],
      requiresConfirmation: true,
      confirmationMessage: '',
    })
    setEditingAction(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingAction) {
      updateMutation.mutate({
        id: editingAction.id,
        data: formData,
      })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleEdit = (action: BotAction) => {
    setEditingAction(action)
    setFormData({
      name: action.name,
      displayName: action.display_name,
      description: action.description,
      webhookUrl: action.webhook_url,
      method: action.method,
      headers: action.headers,
      parameters: action.parameters,
      requiresConfirmation: action.requires_confirmation,
      confirmationMessage: action.confirmation_message || '',
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this action?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleTest = (action: BotAction) => {
    // Build test parameters
    const testParams: any = {}
    action.parameters.forEach((param) => {
      if (param.type === 'string') testParams[param.name] = 'test_value'
      else if (param.type === 'number') testParams[param.name] = 123
      else if (param.type === 'boolean') testParams[param.name] = true
    })

    testMutation.mutate({ actionId: action.id, parameters: testParams })
  }

  const addParameter = () => {
    setFormData({
      ...formData,
      parameters: [
        ...formData.parameters,
        { name: '', type: 'string', description: '', required: true },
      ],
    })
  }

  const updateParameter = (index: number, field: keyof ActionParameter, value: any) => {
    const updated = [...formData.parameters]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, parameters: updated })
  }

  const removeParameter = (index: number) => {
    setFormData({
      ...formData,
      parameters: formData.parameters.filter((_, i) => i !== index),
    })
  }

  const actions = data?.actions || []
  const logs = logsData?.logs || []

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          ← Back to Bot
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Webhook Actions</h1>
            <p className="text-muted-foreground mt-2">
              Let your bot perform actions by calling your webhooks
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowLogs(!showLogs)}>
              {showLogs ? 'Hide Logs' : 'View Logs'}
            </Button>
            <Button
              onClick={() => {
                resetForm()
                setIsDialogOpen(true)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Action
            </Button>
          </div>
        </div>
      </div>

      <Alert className="mb-6">
        <Zap className="h-4 w-4" />
        <AlertTitle>How it works</AlertTitle>
        <AlertDescription>
          When users ask your bot to perform an action, it will automatically call your webhook with
          the extracted parameters. Perfect for canceling orders, checking status, or updating records.
        </AlertDescription>
      </Alert>

      {showLogs && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Action Execution Logs</CardTitle>
            <CardDescription>Recent action executions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No logs yet</p>
              ) : (
                logs.map((log: any) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {log.status === 'executed' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">{log.bot_actions.display_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()} • {log.execution_time_ms}ms
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        log.status === 'executed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {log.http_status || log.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-8">Loading actions...</div>
      ) : actions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No actions yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first webhook action to let your bot perform tasks
            </p>
            <Button
              onClick={() => {
                resetForm()
                setIsDialogOpen(true)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Action
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {actions.map((action: BotAction) => (
            <Card key={action.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {action.display_name}
                      {!action.is_active && (
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded">Inactive</span>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">{action.description}</CardDescription>
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                        {action.method}
                      </span>
                      <span className="text-muted-foreground truncate max-w-md">
                        {action.webhook_url}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(action)}
                      disabled={testMutation.isPending}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(action)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(action.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {action.parameters.length > 0 && (
                <CardContent>
                  <p className="text-sm font-medium mb-2">Parameters:</p>
                  <div className="flex flex-wrap gap-2">
                    {action.parameters.map((param) => (
                      <span
                        key={param.name}
                        className="text-xs bg-secondary px-2 py-1 rounded"
                      >
                        {param.name}: {param.type}
                        {param.required && '*'}
                      </span>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAction ? 'Edit Webhook Action' : 'Create Webhook Action'}
            </DialogTitle>
            <DialogDescription>
              Configure a webhook that your bot can call to perform actions
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Internal Name *</Label>
                <Input
                  id="name"
                  placeholder="cancel_order"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/\s/g, '_') })
                  }
                  required
                  disabled={!!editingAction}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Lowercase with underscores (e.g., cancel_order)
                </p>
              </div>

              <div>
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  placeholder="Cancel Order"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Cancels a customer's order by order ID"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                What does this action do? This helps the AI know when to use it.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1">
                <Label htmlFor="method">Method</Label>
                <Select value={formData.method} onValueChange={(value) => setFormData({ ...formData, method: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-3">
                <Label htmlFor="webhookUrl">Webhook URL *</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  placeholder="https://api.example.com/cancel-order"
                  value={formData.webhookUrl}
                  onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Parameters</Label>
                <Button type="button" variant="outline" size="sm" onClick={addParameter}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Parameter
                </Button>
              </div>

              {formData.parameters.map((param, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                  <Input
                    className="col-span-3"
                    placeholder="Parameter name"
                    value={param.name}
                    onChange={(e) => updateParameter(index, 'name', e.target.value)}
                  />
                  <Select
                    value={param.type}
                    onValueChange={(value) => updateParameter(index, 'type', value)}
                  >
                    <SelectTrigger className="col-span-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">String</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    className="col-span-5"
                    placeholder="Description"
                    value={param.description}
                    onChange={(e) => updateParameter(index, 'description', e.target.value)}
                  />
                  <div className="col-span-1 flex items-center">
                    <Checkbox
                      checked={param.required}
                      onCheckedChange={(checked) => updateParameter(index, 'required', checked)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="col-span-1"
                    onClick={() => removeParameter(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="requiresConfirmation"
                checked={formData.requiresConfirmation}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requiresConfirmation: checked as boolean })
                }
              />
              <div className="flex-1">
                <Label htmlFor="requiresConfirmation" className="cursor-pointer">
                  Require user confirmation
                </Label>
                <p className="text-xs text-muted-foreground">
                  Ask the user to confirm before executing (recommended for destructive actions)
                </p>
              </div>
            </div>

            {formData.requiresConfirmation && (
              <div>
                <Label htmlFor="confirmationMessage">Confirmation Message</Label>
                <Input
                  id="confirmationMessage"
                  placeholder="Are you sure you want to cancel this order?"
                  value={formData.confirmationMessage}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmationMessage: e.target.value })
                  }
                />
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : editingAction
                    ? 'Update Action'
                    : 'Create Action'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
