import { createServerSupabaseClient } from './supabase'
import { generateChatCompletion } from './openai'

/**
 * Bot Performance Insights & Scoring
 * AI-powered analysis of bot performance and suggestions for improvement
 */

export interface BotPerformanceScore {
  overall_score: number // 0-100
  response_quality: number // 0-100
  user_satisfaction: number // 0-100
  efficiency: number // 0-100
  coverage: number // 0-100
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

export interface BotSuggestion {
  id: string
  type: 'preset' | 'knowledge' | 'personality' | 'action' | 'training'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: string
  effort: 'low' | 'medium' | 'high'
  suggested_action?: any
}

/**
 * Calculate bot performance score
 */
export async function calculateBotPerformance(botId: string): Promise<BotPerformanceScore> {
  const supabase = createServerSupabaseClient()

  // Get last 30 days of data
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Fetch messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('bot_id', botId)
    .gte('created_at', thirtyDaysAgo)

  // Fetch ratings
  const { data: ratings } = await supabase
    .from('conversation_ratings')
    .select('*')
    .eq('bot_id', botId)
    .gte('created_at', thirtyDaysAgo)

  // Fetch action logs
  const { data: actionLogs } = await supabase
    .from('action_logs')
    .select('*')
    .eq('bot_id', botId)
    .gte('executed_at', thirtyDaysAgo)

  // Calculate metrics
  const sessionMap = new Map<string, any[]>()
  let presetCount = 0
  let totalMessages = 0

  messages?.forEach((msg) => {
    if (!sessionMap.has(msg.session_id)) {
      sessionMap.set(msg.session_id, [])
    }
    sessionMap.get(msg.session_id)!.push(msg)
    totalMessages++

    if (msg.metadata?.preset_used) {
      presetCount++
    }
  })

  const totalConversations = sessionMap.size
  const avgMessagesPerConversation = totalConversations > 0 ? totalMessages / totalConversations : 0
  const presetUsageRate = totalMessages > 0 ? (presetCount / totalMessages) * 100 : 0

  // Calculate action success rate
  const totalActions = actionLogs?.length || 0
  const successfulActions = actionLogs?.filter((log) => log.status === 'executed').length || 0
  const actionSuccessRate = totalActions > 0 ? (successfulActions / totalActions) * 100 : 100

  // Calculate average satisfaction
  const totalRatings = ratings?.length || 0
  const positiveRatings = ratings?.filter((r) => r.rating === 1).length || 0
  const avgSatisfaction = totalRatings > 0 ? (positiveRatings / totalRatings) * 100 : 0

  // Score calculations (0-100)
  const responsQuality = Math.min(100, avgSatisfaction + 10) // Boost if high satisfaction
  const userSatisfaction = avgSatisfaction
  const efficiency = Math.min(100, presetUsageRate * 2) // Higher preset usage = more efficient
  const coverage = totalConversations > 10 ? 80 : (totalConversations / 10) * 80 // Coverage based on volume

  const overallScore = Math.round(
    (responsQuality * 0.3 + userSatisfaction * 0.3 + efficiency * 0.2 + coverage * 0.2)
  )

  // Generate insights
  const strengths: string[] = []
  const weaknesses: string[] = []
  const opportunities: string[] = []

  if (userSatisfaction >= 70) strengths.push('High user satisfaction')
  if (presetUsageRate >= 30) strengths.push('Effective use of preset responses')
  if (actionSuccessRate >= 90) strengths.push('Reliable action execution')

  if (userSatisfaction < 50) weaknesses.push('Low user satisfaction - may need better training')
  if (presetUsageRate < 10) weaknesses.push('Underutilized preset responses - missing cost savings')
  if (actionSuccessRate < 70) weaknesses.push('Action reliability issues')

  if (totalConversations < 50) opportunities.push('Increase bot visibility to gather more data')
  if (presetUsageRate < 30) opportunities.push('Add more preset responses for common questions')
  if (totalRatings < 10) opportunities.push('Encourage users to rate conversations')

  return {
    overall_score: overallScore,
    response_quality: Math.round(responsQuality),
    user_satisfaction: Math.round(userSatisfaction),
    efficiency: Math.round(efficiency),
    coverage: Math.round(coverage),
    insights: {
      strengths,
      weaknesses,
      opportunities,
    },
    metrics: {
      total_conversations: totalConversations,
      average_messages_per_conversation: Math.round(avgMessagesPerConversation * 10) / 10,
      preset_usage_rate: Math.round(presetUsageRate * 10) / 10,
      action_success_rate: Math.round(actionSuccessRate * 10) / 10,
      average_satisfaction: Math.round(avgSatisfaction * 10) / 10,
    },
  }
}

/**
 * Generate AI-powered suggestions for bot improvement
 */
export async function generateBotSuggestions(
  botId: string,
  performance: BotPerformanceScore
): Promise<BotSuggestion[]> {
  const supabase = createServerSupabaseClient()

  const suggestions: BotSuggestion[] = []

  // Get recent conversations to analyze
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('bot_id', botId)
    .eq('role', 'user')
    .gte('created_at', thirtyDaysAgo)
    .limit(100)

  // Get existing presets
  const { data: presets } = await supabase
    .from('preset_responses')
    .select('question')
    .eq('bot_id', botId)

  const existingQuestions = new Set(presets?.map((p) => p.question.toLowerCase()) || [])

  // Analyze common questions using AI
  if (messages && messages.length > 10) {
    const userQuestions = messages.map((m) => m.content).slice(0, 50)

    try {
      const prompt = `Analyze these user questions and identify the 5 most common patterns or topics. For each pattern, suggest a preset Q&A response.

Questions:
${userQuestions.join('\n')}

Respond in JSON format:
{
  "patterns": [
    {
      "question": "example question",
      "answer": "example answer",
      "frequency": "high/medium/low"
    }
  ]
}`

      const response = await generateChatCompletion(
        [
          {
            role: 'system',
            content: 'You are an AI assistant that analyzes chatbot conversations to identify common patterns and suggest improvements.',
          },
          { role: 'user', content: prompt },
        ],
        { temperature: 0.3, maxTokens: 1000 }
      )

      const analysis = JSON.parse(response)

      analysis.patterns?.forEach((pattern: any, index: number) => {
        if (!existingQuestions.has(pattern.question.toLowerCase())) {
          suggestions.push({
            id: `preset-${index}`,
            type: 'preset',
            priority: pattern.frequency === 'high' ? 'high' : 'medium',
            title: `Add Preset: "${pattern.question}"`,
            description: `Users frequently ask this question. Adding a preset will improve response time and reduce AI costs.`,
            impact: `Estimated ${pattern.frequency === 'high' ? '20-30%' : '10-15%'} cost reduction`,
            effort: 'low',
            suggested_action: {
              question: pattern.question,
              answer: pattern.answer,
              match_type: 'contains',
            },
          })
        }
      })
    } catch (error) {
      console.error('Error generating AI suggestions:', error)
    }
  }

  // Low satisfaction suggestions
  if (performance.user_satisfaction < 60) {
    suggestions.push({
      id: 'training-1',
      type: 'training',
      priority: 'high',
      title: 'Improve bot training data',
      description: 'Low satisfaction scores suggest the bot may not have enough relevant training data.',
      impact: 'Could increase satisfaction by 20-30%',
      effort: 'medium',
    })
  }

  // Low efficiency suggestions
  if (performance.efficiency < 40) {
    suggestions.push({
      id: 'preset-efficiency',
      type: 'preset',
      priority: 'high',
      title: 'Add more preset responses',
      description: `Only ${performance.metrics.preset_usage_rate}% of responses use presets. Adding presets for common questions will reduce costs significantly.`,
      impact: 'Could save 40-60% on AI costs',
      effort: 'low',
    })
  }

  // Personality optimization
  if (performance.overall_score > 70) {
    suggestions.push({
      id: 'personality-1',
      type: 'personality',
      priority: 'low',
      title: 'Fine-tune bot personality',
      description: 'Your bot is performing well. Consider adjusting personality settings to better match your brand voice.',
      impact: 'Enhances brand consistency',
      effort: 'low',
    })
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return suggestions.slice(0, 10) // Return top 10
}

/**
 * Get common unanswered questions (questions that got low ratings)
 */
export async function getUnansweredQuestions(botId: string): Promise<Array<{ question: string; count: number }>> {
  const supabase = createServerSupabaseClient()

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Get messages that were rated negatively
  const { data: lowRatedMessages } = await supabase
    .from('messages')
    .select('id, content, session_id')
    .eq('bot_id', botId)
    .eq('role', 'user')
    .gte('created_at', thirtyDaysAgo)

  const { data: ratings } = await supabase
    .from('conversation_ratings')
    .select('message_id')
    .eq('bot_id', botId)
    .eq('rating', -1)

  const lowRatedMessageIds = new Set(ratings?.map((r) => r.message_id))

  const questionMap = new Map<string, number>()

  lowRatedMessages?.forEach((msg) => {
    if (lowRatedMessageIds.has(msg.id)) {
      const normalized = msg.content.toLowerCase().trim()
      questionMap.set(normalized, (questionMap.get(normalized) || 0) + 1)
    }
  })

  return Array.from(questionMap.entries())
    .map(([question, count]) => ({ question, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
}
