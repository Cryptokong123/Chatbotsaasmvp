'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Bot, Trash2, Settings, MessageSquare, TrendingUp, Zap, Power, Wifi, WifiOff, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { formatRelativeTime } from '@/lib/utils'

interface Agent {
  id: string
  name: string
  description: string | null
  is_active: boolean
  deployment_status: 'draft' | 'staging' | 'production' | 'archived'
  personality: string
  created_at: string
  platform_integrations?: PlatformIntegration[]
}

interface PlatformIntegration {
  id: string
  platform: string
  status: 'connected' | 'disconnected' | 'error' | 'pending'
  is_active: boolean
}

interface AgentStats {
  total_agents: number
  active_agents: number
  total_conversations: number
  total_messages: number
  connected_platforms: number
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [stats, setStats] = useState<AgentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [agentToDelete, setAgentToDelete] = useState<{ id: string; name: string } | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchAgents()
    fetchStats()
  }, [])

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents')
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setAgents(data.agents || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch agents',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/agents')
      const { agents } = await response.json()

      const totalAgents = agents?.length || 0
      const activeAgents = agents?.filter((a: Agent) => a.is_active).length || 0
      const connectedPlatforms = agents?.reduce((sum: number, a: Agent) =>
        sum + (a.platform_integrations?.filter(p => p.status === 'connected').length || 0), 0
      ) || 0

      setStats({
        total_agents: totalAgents,
        active_agents: activeAgents,
        total_conversations: 0, // TODO: Fetch from analytics
        total_messages: 0, // TODO: Fetch from analytics
        connected_platforms: connectedPlatforms,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleDeleteAgent = (agentId: string, agentName: string) => {
    setAgentToDelete({ id: agentId, name: agentName })
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!agentToDelete) return

    try {
      const response = await fetch(`/api/agents/${agentToDelete.id}`, {
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

      fetchAgents()
      setDeleteConfirmOpen(false)
      setAgentToDelete(null)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete agent',
        variant: 'destructive',
      })
    }
  }

  const handleToggleActive = async (agentId: string, currentState: boolean) => {
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentState }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }

      toast({
        title: 'Success',
        description: `Agent ${!currentState ? 'activated' : 'deactivated'} successfully`,
      })

      fetchAgents()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update agent',
        variant: 'destructive',
      })
    }
  }

  const getDeploymentBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      draft: { variant: 'secondary', label: 'Draft' },
      staging: { variant: 'default', label: 'Staging' },
      production: { variant: 'default', label: 'Production' },
      archived: { variant: 'outline', label: 'Archived' },
    }
    const config = variants[status] || variants.draft
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getPlatformIcons = (integrations?: PlatformIntegration[]) => {
    if (!integrations || integrations.length === 0) {
      return <span className="text-sm text-muted-foreground">No platforms</span>
    }

    const connected = integrations.filter(p => p.status === 'connected').length
    const total = integrations.length

    return (
      <div className="flex items-center gap-2">
        {connected > 0 ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-gray-400" />
        )}
        <span className="text-sm text-muted-foreground">
          {connected}/{total} connected
        </span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Agents</h1>
          <p className="text-muted-foreground mt-1">
            Deploy AI agents across 20+ messaging platforms
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/agents/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Agent
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_agents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Zap className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_agents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platforms</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.connected_platforms}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_conversations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_messages}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Agents List */}
      {agents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bot className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No agents yet</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Create your first AI agent to start automating conversations across messaging platforms.
            </p>
            <Button onClick={() => router.push('/dashboard/agents/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Agent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {agent.name}
                      {agent.is_active && (
                        <Power className="h-4 w-4 text-green-500" />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1.5 line-clamp-2">
                      {agent.description || 'No description'}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {getDeploymentBadge(agent.deployment_status)}
                  <Badge variant="outline" className="capitalize">
                    {agent.personality}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  {getPlatformIcons(agent.platform_integrations)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Created {formatRelativeTime(agent.created_at)}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/dashboard/agents/${agent.id}`)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configure
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/agents/${agent.id}/analytics`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(agent.id, agent.is_active)}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteAgent(agent.id, agent.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{agentToDelete?.name}"? This action cannot be undone.
              All conversations, messages, and platform integrations will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
