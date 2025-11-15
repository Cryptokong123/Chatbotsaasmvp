'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, TrendingUp, Lightbulb, Target, Zap, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

interface BotPerformance {
  overall_score: number
  response_quality: number
  user_satisfaction: number
  efficiency: number
  coverage: number
  insights: {
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
  }
  metrics: {
    total_conversations: number
    average_messages_per_conversation: number
    preset_usage_rate: number
    action_success_rate: number
    average_satisfaction: number
  }
}

interface Suggestion {
  id: string
  type: string
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: string
  effort: 'low' | 'medium' | 'high'
  suggested_action?: any
}

export default function InsightsPage() {
  const params = useParams()
  const router = useRouter()
  const botId = params.id as string
  const [performance, setPerformance] = useState<BotPerformance | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchInsights()
  }, [botId])

  const fetchInsights = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/bot-insights?botId=${botId}`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      setPerformance(data.performance)
      setSuggestions(data.suggestions)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch insights',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'A+'
    if (score >= 80) return 'A'
    if (score >= 70) return 'B'
    if (score >= 60) return 'C'
    if (score >= 50) return 'D'
    return 'F'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700'
      case 'low':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getEffortBadge = (effort: string) => {
    switch (effort) {
      case 'low':
        return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Quick Win</span>
      case 'medium':
        return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Moderate</span>
      case 'high':
        return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Complex</span>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!performance) return null

  return (
    <div className="max-w-7xl">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.push(`/dashboard/bots/${botId}`)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Bot
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Bot Performance Insights</h1>
        <p className="text-gray-600 mt-1">AI-powered analysis and improvement suggestions</p>
      </div>

      {/* Overall Score */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeDasharray={`${(performance.overall_score / 100) * 351.86} 351.86`}
                    className={getScoreColor(performance.overall_score)}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className={`text-4xl font-bold ${getScoreColor(performance.overall_score)}`}>
                    {performance.overall_score}
                  </div>
                  <div className="text-sm text-gray-500">Score</div>
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold mb-2">
                  Grade: {getScoreGrade(performance.overall_score)}
                </div>
                <p className="text-gray-600 max-w-md">
                  {performance.overall_score >= 80 && 'Excellent performance! Your bot is doing great.'}
                  {performance.overall_score >= 60 && performance.overall_score < 80 && 'Good performance with room for improvement.'}
                  {performance.overall_score < 60 && 'Your bot needs attention. Review the suggestions below.'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Detailed Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Performance Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Response Quality</span>
                <span className={`text-sm font-medium ${getScoreColor(performance.response_quality)}`}>
                  {performance.response_quality}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getScoreColor(performance.response_quality)} bg-current`}
                  style={{ width: `${performance.response_quality}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">User Satisfaction</span>
                <span className={`text-sm font-medium ${getScoreColor(performance.user_satisfaction)}`}>
                  {performance.user_satisfaction}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getScoreColor(performance.user_satisfaction)} bg-current`}
                  style={{ width: `${performance.user_satisfaction}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Efficiency</span>
                <span className={`text-sm font-medium ${getScoreColor(performance.efficiency)}`}>
                  {performance.efficiency}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getScoreColor(performance.efficiency)} bg-current`}
                  style={{ width: `${performance.efficiency}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Coverage</span>
                <span className={`text-sm font-medium ${getScoreColor(performance.coverage)}`}>
                  {performance.coverage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getScoreColor(performance.coverage)} bg-current`}
                  style={{ width: `${performance.coverage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Key Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Conversations</span>
              <span className="font-medium">{performance.metrics.total_conversations}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg. Messages/Conversation</span>
              <span className="font-medium">{performance.metrics.average_messages_per_conversation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Preset Usage Rate</span>
              <span className="font-medium text-green-600">{performance.metrics.preset_usage_rate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Action Success Rate</span>
              <span className="font-medium text-blue-600">{performance.metrics.action_success_rate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">User Satisfaction</span>
              <span className="font-medium text-purple-600">{performance.metrics.average_satisfaction}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Strengths */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            {performance.insights.strengths.length > 0 ? (
              <ul className="space-y-2">
                {performance.insights.strengths.map((strength, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {strength}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No strengths identified yet. Keep improving!</p>
            )}
          </CardContent>
        </Card>

        {/* Weaknesses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Weaknesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {performance.insights.weaknesses.length > 0 ? (
              <ul className="space-y-2">
                {performance.insights.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">!</span>
                    {weakness}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Great! No weaknesses identified.</p>
            )}
          </CardContent>
        </Card>

        {/* Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Zap className="h-5 w-5" />
              Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {performance.insights.opportunities.length > 0 ? (
              <ul className="space-y-2">
                {performance.insights.opportunities.map((opp, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">→</span>
                    {opp}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">You're optimizing well!</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            AI-Powered Suggestions
          </CardTitle>
          <CardDescription>Smart recommendations to improve your bot</CardDescription>
        </CardHeader>
        <CardContent>
          {suggestions.length > 0 ? (
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs uppercase px-2 py-1 rounded font-medium ${getPriorityColor(suggestion.priority)}`}>
                        {suggestion.priority}
                      </span>
                      {getEffortBadge(suggestion.effort)}
                    </div>
                  </div>
                  <h4 className="font-semibold mb-1">{suggestion.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-600 font-medium">
                      Impact: {suggestion.impact}
                    </span>
                    {suggestion.suggested_action && (
                      <Button size="sm" variant="outline">
                        Apply Suggestion
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Lightbulb className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No suggestions at the moment. Your bot is well-configured!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
