'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Bot, Code, Trash2, Settings, Copy, MessageSquare, TrendingUp, Users, Eye, Power, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { formatRelativeTime } from '@/lib/utils'
import { OnboardingWizard } from '@/components/onboarding-wizard'
import { DashboardSkeleton } from '@/components/skeletons'
import { NoBotsEmpty } from '@/components/empty-states'

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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [botToDelete, setBotToDelete] = useState<{ id: string; name: string } | null>(null)
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

  const handleDeleteBot = (botId: string, botName: string) => {
    setBotToDelete({ id: botId, name: botName })
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!botToDelete) return

    try {
      const { error } = await supabase
        .from('bots')
        .delete()
        .eq('id', botToDelete.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Bot deleted successfully',
      })

      fetchBots()
      setDeleteConfirmOpen(false)
      setBotToDelete(null)
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

  const handleToggleActive = async (botId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('bots')
        .update({ is_active: !currentState })
        .eq('id', botId)

      if (error) throw error

      toast({
        title: 'Success',
        description: `Bot ${!currentState ? 'activated' : 'deactivated'} successfully`,
      })

      fetchBots()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update bot status',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return <DashboardSkeleton />
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
      <div className="flex justify-between items-center mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 dark:from-white dark:via-purple-200 dark:to-white bg-clip-text">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your AI chatbots and agents</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => router.push('/dashboard/bots/new')}
            variant="outline"
            className="dark:border-white/20 dark:text-white dark:hover:bg-white/10 hover:scale-105 transition-transform shadow-md hover:shadow-lg"
          >
            <Bot className="h-4 w-4 mr-2" />
            Create Chatbot
          </Button>
          <Button
            onClick={() => router.push('/dashboard/agents/new')}
            className="bg-gradient-to-r from-primary to-purple-600 text-white hover:from-primary/90 hover:to-purple-600/90 hover:scale-105 transition-transform shadow-lg hover:shadow-xl"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        </div>
      </div>

      {/* Dashboard Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="dark:bg-white/5 dark:border-white/10 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group animate-in fade-in slide-in-from-bottom-4 delay-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Bots</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalBots}</p>
                </div>
                <div className="relative">
                  <Bot className="h-8 w-8 text-blue-500 transition-transform group-hover:scale-110" />
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-white/5 dark:border-white/10 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group animate-in fade-in slide-in-from-bottom-4 delay-150">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Bots</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.activeBots}</p>
                </div>
                <div className="relative">
                  <TrendingUp className="h-8 w-8 text-green-500 transition-transform group-hover:scale-110" />
                  <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-white/5 dark:border-white/10 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group animate-in fade-in slide-in-from-bottom-4 delay-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Conversations</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalConversations}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Last 30 days</p>
                </div>
                <div className="relative">
                  <Users className="h-8 w-8 text-purple-500 transition-transform group-hover:scale-110" />
                  <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-white/5 dark:border-white/10 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group animate-in fade-in slide-in-from-bottom-4 delay-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Messages</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalMessages}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Last 30 days</p>
                </div>
                <div className="relative">
                  <MessageSquare className="h-8 w-8 text-blue-500 transition-transform group-hover:scale-110" />
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-white/5 dark:border-white/10 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group animate-in fade-in slide-in-from-bottom-4 delay-[400ms]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Satisfaction</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.avgSatisfaction}%</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Last 30 days</p>
                </div>
                <div className="relative">
                  <TrendingUp className="h-8 w-8 text-green-500 transition-transform group-hover:scale-110" />
                  <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bots Grid */}
      {bots.length === 0 ? (
        <NoBotsEmpty
          onCreateBot={() => router.push('/dashboard/bots/new')}
          onCreateAgent={() => router.push('/dashboard/agents/new')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.map((bot, index) => (
            <Card
              key={bot.id}
              className="hover:shadow-xl hover:scale-105 transition-all duration-300 dark:bg-white/5 dark:border-white/10 group cursor-pointer animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 50}ms` }}
            >
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
                      aria-label={`Edit ${bot.name} settings`}
                      title="Edit settings"
                      className="dark:hover:bg-white/10 dark:text-white"
                    >
                      <Settings className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCloneBot(bot.id, bot.name)}
                      aria-label={`Clone ${bot.name}`}
                      title="Clone bot"
                      className="dark:hover:bg-white/10"
                    >
                      <Copy className="h-4 w-4 text-blue-500" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteBot(bot.id, bot.name)}
                      aria-label={`Delete ${bot.name}`}
                      title="Delete bot"
                      className="dark:hover:bg-white/10"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="mt-4 dark:text-white">{bot.name}</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  {bot.description || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Status</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bot.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {bot.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Created</span>
                    <span className="text-gray-900 dark:text-white">
                      {formatRelativeTime(bot.created_at)}
                    </span>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/bots/${bot.id}/preview`)}
                      aria-label={`Preview ${bot.name}`}
                      title="Preview bot"
                      className="dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(bot.id, bot.is_active)}
                      aria-label={`Toggle ${bot.name} status`}
                      title={bot.is_active ? 'Deactivate bot' : 'Activate bot'}
                      className={`dark:border-white/20 dark:hover:bg-white/10 ${bot.is_active ? 'text-orange-600 hover:text-orange-700 dark:text-orange-400' : 'text-green-600 hover:text-green-700 dark:text-green-400'}`}
                    >
                      <Power className="h-4 w-4 mr-1" />
                      {bot.is_active ? 'Disable' : 'Enable'}
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full dark:border-white/20 dark:text-white dark:hover:bg-white/10"
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete bot &quot;{botToDelete?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the bot and all associated data:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All conversations and messages</li>
                <li>Training data</li>
                <li>Preset responses</li>
                <li>Bot actions and webhooks</li>
              </ul>
              <p className="mt-3 font-semibold text-red-600">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
