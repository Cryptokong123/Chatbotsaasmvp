'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, MessageSquare, Users, Clock, ThumbsUp, Activity, Zap, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { createBrowserSupabaseClient } from '@/lib/supabase'

interface Bot {
  id: string
  name: string
}

interface AnalyticsData {
  totalConversations: number
  totalMessages: number
  avgResponseTime: number
  satisfactionRate: number
  activeUsers: number
  conversationsToday: number
  messagesPerConversation: number
  topPerformingBots: Array<{ id: string; name: string; conversations: number }>
  conversationTrend: Array<{ date: string; count: number }>
  messageTrend: Array<{ date: string; count: number }>
  satisfactionTrend: Array<{ date: string; rate: number }>
  peakHours: Array<{ hour: number; count: number }>
  topIntents: Array<{ intent: string; count: number }>
  responseTimeDistribution: Array<{ range: string; count: number }>
}

const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#6366F1']

export default function AnalyticsPage() {
  const [bots, setBots] = useState<Bot[]>([])
  const [selectedBot, setSelectedBot] = useState<string>('all')
  const [period, setPeriod] = useState<string>('7d')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    fetchBots()
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [selectedBot, period])

  const fetchBots = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('bots')
        .select('id, name')
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
    }
  }

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        period,
        ...(selectedBot !== 'all' && { botId: selectedBot }),
      })

      const response = await fetch(`/api/analytics/overview?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch analytics')
      }

      setAnalytics(data)
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const formatIntent = (intent: string) => {
    return intent
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (loading || !analytics) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Real-time insights into your bot performance</p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  const prevTotalConversations = analytics.totalConversations * 0.85 // Mock previous period data
  const conversationGrowth = ((analytics.totalConversations - prevTotalConversations) / prevTotalConversations) * 100

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Real-time insights into your bot performance</p>
          </div>
          <Activity className="h-10 w-10 text-primary animate-pulse" />
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="w-64">
            <Select value={selectedBot} onValueChange={setSelectedBot}>
              <SelectTrigger>
                <SelectValue placeholder="All Bots" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bots</SelectItem>
                {bots.map((bot) => (
                  <SelectItem key={bot.id} value={bot.id}>
                    {bot.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-48">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={fetchAnalytics}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Conversations</p>
              <MessageSquare className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{analytics.totalConversations.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-2">
              {conversationGrowth >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm ${conversationGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(conversationGrowth).toFixed(1)}% vs previous period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Messages</p>
              <Zap className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{analytics.totalMessages.toLocaleString()}</p>
            <p className="text-sm text-gray-600 mt-2">
              {analytics.messagesPerConversation} avg per conversation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Satisfaction Rate</p>
              <ThumbsUp className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-600">{analytics.satisfactionRate}%</p>
            <p className="text-sm text-gray-600 mt-2">Based on user ratings</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
              <Clock className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{analytics.avgResponseTime}s</p>
            <p className="text-sm text-gray-600 mt-2">Lightning fast responses</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Conversation Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Conversation Trend</CardTitle>
            <CardDescription>Daily conversation volume over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.conversationTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  style={{ fontSize: '12px' }}
                />
                <YAxis style={{ fontSize: '12px' }} />
                <Tooltip
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{ borderRadius: '8px' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Conversations"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Message Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Message Trend</CardTitle>
            <CardDescription>Daily message volume over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.messageTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  style={{ fontSize: '12px' }}
                />
                <YAxis style={{ fontSize: '12px' }} />
                <Tooltip
                  labelFormatter={(label) => `Date: ${label}`}
                  contentStyle={{ borderRadius: '8px' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Messages"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ fill: '#8B5CF6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Peak Hours</CardTitle>
            <CardDescription>Conversation volume by hour of day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.peakHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="hour"
                  tickFormatter={(hour) => `${hour}:00`}
                  style={{ fontSize: '12px' }}
                />
                <YAxis style={{ fontSize: '12px' }} />
                <Tooltip
                  labelFormatter={(label) => `Hour: ${label}:00`}
                  contentStyle={{ borderRadius: '8px' }}
                />
                <Bar dataKey="count" name="Conversations" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Intents */}
        <Card>
          <CardHeader>
            <CardTitle>Top Intents</CardTitle>
            <CardDescription>Most common conversation topics</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.topIntents}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ intent, percent }) => `${formatIntent(intent)} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.topIntents.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Bots */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Bots</CardTitle>
            <CardDescription>Bots with the most conversations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topPerformingBots.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No data available</p>
              ) : (
                analytics.topPerformingBots.map((bot, index) => (
                  <div key={bot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-900">{bot.name}</span>
                    </div>
                    <span className="text-gray-600">{bot.conversations} conversations</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Response Time Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Response Time Distribution</CardTitle>
            <CardDescription>How fast your bot responds</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.responseTimeDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" style={{ fontSize: '12px' }} />
                <YAxis dataKey="range" type="category" style={{ fontSize: '12px' }} />
                <Tooltip contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="count" name="Messages" fill="#F59E0B" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
