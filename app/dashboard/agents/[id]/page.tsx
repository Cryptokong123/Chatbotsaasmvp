'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Trash2, Plus, Check, X, Settings2, Zap, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

interface Agent {
  id: string
  name: string
  description: string | null
  instructions: string
  personality: string
  response_style: string
  is_active: boolean
  deployment_status: string
  enable_sentiment_analysis: boolean
  enable_multi_language: boolean
  enable_handoff_to_human: boolean
  enable_analytics: boolean
  platform_integrations?: PlatformIntegration[]
}

interface PlatformIntegration {
  id: string
  platform: string
  platform_name: string | null
  status: string
  is_active: boolean
  webhook_url: string | null
  last_connected_at: string | null
}

export default function AgentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const agentId = params.id as string

  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Agent>>({})

  useEffect(() => {
    fetchAgent()
  }, [agentId])

  const fetchAgent = async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setAgent(data.agent)
      setFormData(data.agent)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch agent',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      toast({
        title: 'Success',
        description: 'Agent updated successfully',
      })

      setAgent(data.agent)
      setFormData(data.agent)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update agent',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }

      toast({
        title: 'Success',
        description: 'Agent deleted successfully',
      })

      router.push('/dashboard/agents')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete agent',
        variant: 'destructive',
      })
    }
  }

  const platformConfig: Record<string, { name: string; description: string; icon: string }> = {
    telegram: { name: 'Telegram', description: 'Connect to Telegram Bot API', icon: '✈️' },
    whatsapp: { name: 'WhatsApp', description: 'WhatsApp Business API', icon: '💬' },
    slack: { name: 'Slack', description: 'Team collaboration', icon: '💼' },
    discord: { name: 'Discord', description: 'Community engagement', icon: '🎮' },
    messenger: { name: 'Messenger', description: 'Facebook Messenger', icon: '📱' },
    instagram: { name: 'Instagram', description: 'Instagram Direct', icon: '📸' },
    twitter: { name: 'Twitter/X', description: 'Direct messages', icon: '🐦' },
    sms: { name: 'SMS', description: 'Text messaging via Twilio', icon: '📧' },
    email: { name: 'Email', description: 'Email conversations', icon: '✉️' },
    voice: { name: 'Voice', description: 'Phone support via Twilio', icon: '📞' },
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; label: string }> = {
      connected: { variant: 'default', label: 'Connected' },
      disconnected: { variant: 'secondary', label: 'Disconnected' },
      error: { variant: 'destructive', label: 'Error' },
      pending: { variant: 'outline', label: 'Pending' },
    }
    return config[status] || config.pending
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold mb-2">Agent not found</h2>
        <Button onClick={() => router.push('/dashboard/agents')}>
          Go back to agents
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{agent.name}</h1>
            <p className="text-muted-foreground mt-1">
              {agent.description || 'Configure your agent'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/dashboard/agents/${agentId}/analytics`)}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList>
          <TabsTrigger value="config">
            <Settings2 className="mr-2 h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="platforms">
            <Zap className="mr-2 h-4 w-4" />
            Platforms
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Configure your agent's identity and behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">System Instructions</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions || ''}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  rows={8}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="personality">Personality</Label>
                  <Select
                    value={formData.personality}
                    onValueChange={(value) => setFormData({ ...formData, personality: value })}
                  >
                    <SelectTrigger id="personality">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="response_style">Response Style</Label>
                  <Select
                    value={formData.response_style}
                    onValueChange={(value) => setFormData({ ...formData, response_style: value })}
                  >
                    <SelectTrigger id="response_style">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concise">Concise</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-medium">Advanced Features</h3>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Agent Active</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable or disable this agent
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sentiment Analysis</Label>
                    <p className="text-xs text-muted-foreground">
                      Detect user emotions and sentiment
                    </p>
                  </div>
                  <Switch
                    checked={formData.enable_sentiment_analysis}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, enable_sentiment_analysis: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Multi-Language Support</Label>
                    <p className="text-xs text-muted-foreground">
                      Auto-detect and respond in user's language
                    </p>
                  </div>
                  <Switch
                    checked={formData.enable_multi_language}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, enable_multi_language: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Handoff to Human</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow escalation to human agents
                    </p>
                  </div>
                  <Switch
                    checked={formData.enable_handoff_to_human}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, enable_handoff_to_human: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions for this agent</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={() => setDeleteConfirmOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Agent
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Connected Platforms</CardTitle>
                  <CardDescription>
                    Manage messaging platform integrations
                  </CardDescription>
                </div>
                <Button onClick={() => router.push(`/dashboard/agents/${agentId}/platforms/new`)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Platform
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!agent.platform_integrations || agent.platform_integrations.length === 0 ? (
                <div className="text-center py-12">
                  <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No platforms connected</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect your first messaging platform to start using this agent
                  </p>
                  <Button onClick={() => router.push(`/dashboard/agents/${agentId}/platforms/new`)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Connect Platform
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {agent.platform_integrations.map((platform) => {
                    const config = platformConfig[platform.platform]
                    const statusConfig = getStatusBadge(platform.status)

                    return (
                      <Card key={platform.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">{config?.icon || '📱'}</div>
                              <div>
                                <CardTitle className="text-base">
                                  {platform.platform_name || config?.name || platform.platform}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                  {config?.description || platform.platform}
                                </CardDescription>
                              </div>
                            </div>
                            <Badge variant={statusConfig.variant}>
                              {statusConfig.label}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {platform.webhook_url && (
                            <div>
                              <Label className="text-xs">Webhook URL</Label>
                              <code className="block text-xs bg-muted p-2 rounded mt-1 truncate">
                                {platform.webhook_url}
                              </code>
                            </div>
                          )}
                          {platform.last_connected_at && (
                            <p className="text-xs text-muted-foreground">
                              Last connected: {new Date(platform.last_connected_at).toLocaleDateString()}
                            </p>
                          )}
                          <div className="flex gap-2 pt-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              Configure
                            </Button>
                            <Button variant="outline" size="sm">
                              Test
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{agent.name}"? This action cannot be undone.
              All conversations, messages, and platform integrations will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
