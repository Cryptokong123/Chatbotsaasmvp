'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Bot, Code, Trash2, Settings, Copy, MessageSquare, TrendingUp, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { formatRelativeTime } from '@/lib/utils'
import { OnboardingWizard } from '@/components/onboarding-wizard'

interface BotType {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  primary_color: string
}

interface DashboardStats {
  totalBots: number
  activeBots: number
  totalConversations: number
  totalMessages: number
  avgSatisfaction: number
}

export default function DashboardPage() {
  const [bots, setBots] = useState<BotType[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    fetchBots()
    fetchStats()
    checkOnboarding()
  }, [])

  const checkOnboarding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      const { data: userData } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single()

      // Show onboarding if user hasn't completed it yet
      if (userData && !userData.onboarding_completed) {
        setShowOnboarding(true)
      }
    } catch (error) {
      console.error('Error checking onboarding:', error)
    }
  }

  const fetchBots = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('bots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setBots(data || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch bots',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setStats(data)
    } catch (error: any) {
      console.error('Error fetching stats:', error)
      // Don't show error toast for stats - it's not critical
    }
  }

  const handleDeleteBot = async (botId: string) => {
    if (!confirm('Are you sure you want to delete this bot? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('bots')
        .delete()
        .eq('id', botId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Bot deleted successfully',
      })

      fetchBots()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete bot',
        variant: 'destructive',
      })
    }
  }

  const handleCloneBot = async (botId: string, botName: string) => {
    const newName = prompt(`Enter a name for the cloned bot:`, `${botName} (Copy)`)

    if (!newName) return

    try {
      const response = await fetch('/api/bots/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId, newName }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      toast({
        title: 'Success',
        description: `Bot cloned successfully! Copied ${data.cloned.presets} presets and ${data.cloned.actions} actions.`,
      })

      fetchBots()

      // Navigate to the new bot
      router.push(`/dashboard/bots/${data.bot.id}`)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to clone bot',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Onboarding Wizard */}
      {userId && (
        <OnboardingWizard
          open={showOnboarding}
          onOpenChange={(open) => {
            setShowOnboarding(open)
            if (!open) fetchBots() // Refresh bots when onboarding closes
          }}
          userId={userId}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Bots</h1>
          <p className="text-gray-600 mt-1">Manage your AI chatbots</p>
        </div>
        <Button onClick={() => router.push('/dashboard/bots/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Bot
        </Button>
      </div>

      {/* Dashboard Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Bots</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalBots}</p>
                </div>
                <Bot className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Bots</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{stats.activeBots}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversations</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalConversations}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Last 30 days</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Messages</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalMessages}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Last 30 days</p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Satisfaction</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{stats.avgSatisfaction}%</p>
                  <p className="text-xs text-gray-500 mt-0.5">Last 30 days</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bots Grid */}
      {bots.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No bots yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first AI chatbot to get started
            </p>
            <Button onClick={() => router.push('/dashboard/bots/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Bot
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.map((bot) => (
            <Card key={bot.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: bot.primary_color + '20' }}
                  >
                    <Bot className="h-6 w-6" style={{ color: bot.primary_color }} />
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/dashboard/bots/${bot.id}`)}
                      title="Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCloneBot(bot.id, bot.name)}
                      title="Clone Bot"
                    >
                      <Copy className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteBot(bot.id)}
                      title="Delete Bot"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="mt-4">{bot.name}</CardTitle>
                <CardDescription>
                  {bot.description || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bot.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {bot.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Created</span>
                    <span className="text-gray-900">
                      {formatRelativeTime(bot.created_at)}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => router.push(`/dashboard/bots/${bot.id}/embed`)}
                  >
                    <Code className="h-4 w-4 mr-2" />
                    Get Embed Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
