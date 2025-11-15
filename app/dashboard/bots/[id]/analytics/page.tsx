'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MessageSquare,
  Users,
  ThumbsUp,
  Zap,
  TrendingUp,
  DollarSign,
  Clock
} from 'lucide-react'
import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function AnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const botId = params.id as string
  const [timeRange, setTimeRange] = useState('30')

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', botId, timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/analytics?botId=${botId}&days=${timeRange}`)
      if (!res.ok) throw new Error('Failed to fetch analytics')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const analytics = data || {}

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          ← Back to Bot
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Track performance and user engagement
            </p>
          </div>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overview?.totalMessages?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview?.userMessages || 0} from users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.overview?.totalConversations?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.satisfaction?.score || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.satisfaction?.totalRatings || 0} ratings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics.costSavings?.estimatedSavings || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              From {analytics.costSavings?.presetResponses || 0} preset responses
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Message Volume Chart */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Message Volume</CardTitle>
            <CardDescription>Daily message activity</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {analytics.chartData && analytics.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#6C47FF"
                    strokeWidth={2}
                    dot={{ fill: '#6C47FF' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data available for this time period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Response Types */}
        <Card>
          <CardHeader>
            <CardTitle>Response Types</CardTitle>
            <CardDescription>How your bot responds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">Preset Responses</span>
                </div>
                <span className="font-semibold">
                  {analytics.responseTypes?.preset || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">AI Responses</span>
                </div>
                <span className="font-semibold">
                  {analytics.responseTypes?.ai || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Actions Executed</span>
                </div>
                <span className="font-semibold">
                  {analytics.responseTypes?.actions || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Stats */}
        {analytics.actions?.total > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Action Performance</CardTitle>
              <CardDescription>Webhook execution stats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Executions</span>
                  <span className="font-semibold">{analytics.actions.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Successful</span>
                  <span className="font-semibold text-green-600">
                    {analytics.actions.successful}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Failed</span>
                  <span className="font-semibold text-red-600">
                    {analytics.actions.failed}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg. Time</span>
                  <span className="font-semibold">
                    {Math.round(analytics.actions.avgExecutionTime || 0)}ms
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Questions */}
      {analytics.topQuestions && analytics.topQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Most Common Questions</CardTitle>
            <CardDescription>What users are asking about</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topQuestions.map((item: any, index: number) => (
                <div key={index} className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm">{item.question}</p>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {item.count}×
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
