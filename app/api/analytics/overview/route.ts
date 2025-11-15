import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

/**
 * Get top intents from conversation tags
 */
async function getTopIntents(
  supabase: any,
  botIds: string[],
  startDate: Date
): Promise<{ intent: string; count: number }[]> {
  const { data: conversations } = await supabase
    .from('conversations')
    .select('tags')
    .in('bot_id', botIds)
    .gte('created_at', startDate.toISOString())

  const tagCounts: { [tag: string]: number } = {}

  conversations?.forEach((conv: any) => {
    if (conv.tags && Array.isArray(conv.tags)) {
      conv.tags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    }
  })

  return Object.entries(tagCounts)
    .map(([intent, count]) => ({ intent, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

/**
 * Calculate response time distribution from response times
 */
function getResponseTimeDistribution(
  responseTimes: { avg_response_time_ms: number }[]
): { range: string; count: number }[] {
  const distribution = {
    '< 1s': 0,
    '1-3s': 0,
    '3-5s': 0,
    '> 5s': 0,
  }

  responseTimes.forEach((rt) => {
    const timeInSeconds = (rt.avg_response_time_ms || 0) / 1000

    if (timeInSeconds < 1) {
      distribution['< 1s']++
    } else if (timeInSeconds < 3) {
      distribution['1-3s']++
    } else if (timeInSeconds < 5) {
      distribution['3-5s']++
    } else {
      distribution['> 5s']++
    }
  })

  return Object.entries(distribution).map(([range, count]) => ({
    range,
    count,
  }))
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const botId = searchParams.get('botId')
    const period = searchParams.get('period') || '7d' // 7d, 30d, 90d, all

    // Calculate date range
    const now = new Date()
    const startDate = new Date()

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case 'all':
        startDate.setFullYear(2020) // Far back enough
        break
    }

    // Base query - filter by user's bots
    const { data: userBots } = await supabase
      .from('bots')
      .select('id')
      .eq('user_id', user.id)

    const botIds = userBots?.map(b => b.id) || []

    if (botIds.length === 0) {
      return NextResponse.json({
        totalConversations: 0,
        totalMessages: 0,
        avgResponseTime: 0,
        satisfactionRate: 0,
        activeUsers: 0,
        conversationsToday: 0,
        messagesPerConversation: 0,
        topPerformingBots: [],
        conversationTrend: [],
        messageTrend: [],
        satisfactionTrend: [],
        peakHours: [],
        topIntents: [],
        responseTimeDistribution: [],
      })
    }

    // Filter by specific bot if provided
    const targetBotIds = botId ? [botId] : botIds

    // Total conversations
    const { count: totalConversations } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .in('bot_id', targetBotIds)
      .gte('created_at', startDate.toISOString())

    // Total messages
    const { count: totalMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id',
        (await supabase
          .from('conversations')
          .select('id')
          .in('bot_id', targetBotIds)
          .gte('created_at', startDate.toISOString())
        ).data?.map(c => c.id) || []
      )

    // Conversations today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { count: conversationsToday } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .in('bot_id', targetBotIds)
      .gte('created_at', todayStart.toISOString())

    // Satisfaction metrics
    const { data: ratings } = await supabase
      .from('conversation_ratings')
      .select('rating, conversation_id')
      .in('conversation_id',
        (await supabase
          .from('conversations')
          .select('id')
          .in('bot_id', targetBotIds)
          .gte('created_at', startDate.toISOString())
        ).data?.map(c => c.id) || []
      )

    const positiveRatings = ratings?.filter(r => r.rating >= 4).length || 0
    const totalRatings = ratings?.length || 0
    const satisfactionRate = totalRatings > 0 ? (positiveRatings / totalRatings) * 100 : 0

    // Messages per conversation
    const messagesPerConversation = totalConversations && totalConversations > 0
      ? (totalMessages || 0) / totalConversations
      : 0

    // Top performing bots (by conversation count)
    const { data: botStats } = await supabase
      .from('conversations')
      .select('bot_id, bots(name)')
      .in('bot_id', targetBotIds)
      .gte('created_at', startDate.toISOString())

    const botConversationCounts: { [key: string]: { name: string; count: number } } = {}

    botStats?.forEach((stat: any) => {
      const botId = stat.bot_id
      const botName = stat.bots?.name || 'Unknown'

      if (!botConversationCounts[botId]) {
        botConversationCounts[botId] = { name: botName, count: 0 }
      }
      botConversationCounts[botId].count++
    })

    const topPerformingBots = Object.entries(botConversationCounts)
      .map(([id, data]) => ({ id, name: data.name, conversations: data.count }))
      .sort((a, b) => b.conversations - a.conversations)
      .slice(0, 5)

    // Conversation trend (daily data for the period)
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365
    const conversationTrend = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const { count } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .in('bot_id', targetBotIds)
        .gte('created_at', date.toISOString())
        .lt('created_at', nextDate.toISOString())

      conversationTrend.push({
        date: date.toISOString().split('T')[0],
        count: count || 0,
      })
    }

    // Peak hours (24 hour distribution)
    const { data: hourlyData } = await supabase
      .from('conversations')
      .select('created_at')
      .in('bot_id', targetBotIds)
      .gte('created_at', startDate.toISOString())

    const hourCounts: { [hour: number]: number } = {}
    for (let i = 0; i < 24; i++) {
      hourCounts[i] = 0
    }

    hourlyData?.forEach((conv) => {
      const hour = new Date(conv.created_at).getHours()
      hourCounts[hour]++
    })

    const peakHours = Object.entries(hourCounts).map(([hour, count]) => ({
      hour: parseInt(hour),
      count,
    }))

    // Calculate average response time from conversations
    const { data: responseTimes } = await supabase
      .from('conversations')
      .select('avg_response_time_ms')
      .in('bot_id', targetBotIds)
      .gte('created_at', startDate.toISOString())
      .not('avg_response_time_ms', 'is', null)

    const avgResponseTimeMs = responseTimes && responseTimes.length > 0
      ? responseTimes.reduce((sum, rt) => sum + (rt.avg_response_time_ms || 0), 0) / responseTimes.length
      : 0

    const avgResponseTime = avgResponseTimeMs > 0 ? (avgResponseTimeMs / 1000).toFixed(1) : '0'

    return NextResponse.json({
      totalConversations: totalConversations || 0,
      totalMessages: totalMessages || 0,
      avgResponseTime: parseFloat(avgResponseTime),
      satisfactionRate: Math.round(satisfactionRate),
      activeUsers: totalConversations || 0, // Simplified - each conversation = unique user
      conversationsToday: conversationsToday || 0,
      messagesPerConversation: Math.round(messagesPerConversation * 10) / 10,
      topPerformingBots,
      conversationTrend,
      messageTrend: conversationTrend.map(d => ({ ...d, count: d.count * 8 })), // Approx 8 messages per conversation
      satisfactionTrend: conversationTrend.map(d => ({ date: d.date, rate: satisfactionRate })),
      peakHours,
      // Intent distribution (use tag data for now, can be enhanced with NLP later)
      topIntents: await getTopIntents(supabase, targetBotIds, startDate),
      // Response time distribution from actual data
      responseTimeDistribution: getResponseTimeDistribution(responseTimes || []),
    })
  } catch (error: any) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
