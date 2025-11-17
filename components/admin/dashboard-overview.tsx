'use client'

import { useState, useEffect } from 'react'
import { Activity, Users, MessageSquare, Zap, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface DashboardStats {
  integrations: {
    total: number
    active: number
    connected: number
    disconnected: number
    errors: number
  }
  messages: {
    total: number
    sent: number
    received: number
    failed: number
    last24h: number
    trend: number
  }
  conversations: {
    total: number
    open: number
    closed: number
    avgResponseTime: number
    trend: number
  }
  contacts: {
    total: number
    synced: number
    duplicates: number
    trend: number
  }
  performance: {
    uptime: number
    avgLatency: number
    errorRate: number
    requestRate: number
  }
  recentActivity: Array<{
    id: string
    type: string
    message: string
    timestamp: string
    status: 'success' | 'error' | 'warning'
  }>
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('24h')

  useEffect(() => {
    fetchStats()
  }, [timeRange])

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/admin/stats?range=${timeRange}`)
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
          <p className="text-gray-600">Monitor your integrations and system performance</p>
        </div>
        <Tabs value={timeRange} onValueChange={setTimeRange}>
          <TabsList>
            <TabsTrigger value="24h">24h</TabsTrigger>
            <TabsTrigger value="7d">7d</TabsTrigger>
            <TabsTrigger value="30d">30d</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.integrations.active}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.integrations.connected} connected,{' '}
              {stats.integrations.disconnected} disconnected
            </p>
            {stats.integrations.errors > 0 && (
              <div className="mt-2">
                <Badge variant="destructive" className="text-xs">
                  {stats.integrations.errors} errors
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messages.last24h.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.messages.sent} sent, {stats.messages.received} received
            </p>
            <div className="flex items-center mt-2">
              {stats.messages.trend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
              )}
              <span className={`text-xs ${stats.messages.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(stats.messages.trend)}% vs last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversations.total.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.conversations.open} open, {stats.conversations.closed} closed
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Avg response time: {stats.conversations.avgResponseTime}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Contacts</CardTitle>
            <Zap className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contacts.total.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.contacts.synced} synced
            </p>
            {stats.contacts.duplicates > 0 && (
              <p className="text-xs text-orange-600 mt-1">
                {stats.contacts.duplicates} duplicates detected
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>System Performance</CardTitle>
          <CardDescription>Real-time performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Uptime</span>
                <span className="text-sm text-gray-600">{stats.performance.uptime}%</span>
              </div>
              <Progress value={stats.performance.uptime} className="h-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-600">Avg Latency</p>
                <p className="text-2xl font-bold mt-1">{stats.performance.avgLatency}ms</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-600">Error Rate</p>
                <p className="text-2xl font-bold mt-1">{stats.performance.errorRate}%</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-600">Request Rate</p>
                <p className="text-2xl font-bold mt-1">{stats.performance.requestRate}/s</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest events and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                <div className="mt-1">
                  {activity.status === 'success' && (
                    <div className="h-2 w-2 rounded-full bg-green-600"></div>
                  )}
                  {activity.status === 'error' && (
                    <div className="h-2 w-2 rounded-full bg-red-600"></div>
                  )}
                  {activity.status === 'warning' && (
                    <div className="h-2 w-2 rounded-full bg-orange-600"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <Badge variant="outline" className="text-xs">
                      {activity.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
