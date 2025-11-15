import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { createApiError } from '@/lib/api-errors'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      const { response, status } = createApiError('UNAUTHORIZED')
      return NextResponse.json(response, { status })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const botId = searchParams.get('botId')
    const days = parseInt(searchParams.get('days') || '30', 10)

    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get all bots owned by the user
    const { data: bots, error: botsError } = await supabase
      .from('bots')
      .select('id')
      .eq('user_id', user.id)

    if (botsError) throw botsError

    const botIds = bots?.map(b => b.id) || []

    if (botIds.length === 0) {
      return NextResponse.json({
        averageResponseTime: 0,
        totalConversations: 0,
        totalMessages: 0,
        satisfactionScore: 0,
        totalRatings: 0,
        messagesByDay: [],
      })
    }

    // Build query
    let messagesQuery = supabase
      .from('messages')
      .select('id, bot_id, session_id, role, created_at')
      .in('bot_id', botIds)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (botId && botIds.includes(botId)) {
      messagesQuery = messagesQuery.eq('bot_id', botId)
    }

    const { data: messages, error: messagesError } = await messagesQuery

    if (messagesError) throw messagesError

    // Calculate analytics
    const sessions = new Set<string>()
    const responseTimes: number[] = []
    const messagesByDay = new Map<string, number>()

    // Track user messages to calculate response time
    const userMessages = new Map<string, Date>()

    messages?.forEach((msg) => {
      sessions.add(msg.session_id)

      // Count messages by day
      const day = msg.created_at.split('T')[0]
      messagesByDay.set(day, (messagesByDay.get(day) || 0) + 1)

      // Calculate response time
      if (msg.role === 'user') {
        userMessages.set(msg.session_id, new Date(msg.created_at))
      } else if (msg.role === 'assistant') {
        const userMsgTime = userMessages.get(msg.session_id)
        if (userMsgTime) {
          const responseTime = new Date(msg.created_at).getTime() - userMsgTime.getTime()
          responseTimes.push(responseTime)
          userMessages.delete(msg.session_id) // Reset for next message
        }
      }
    })

    // Calculate average response time in milliseconds
    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0

    // Get satisfaction ratings
    let ratingsQuery = supabase
      .from('ratings')
      .select('rating')
      .in('bot_id', botIds)
      .gte('created_at', startDate.toISOString())

    if (botId && botIds.includes(botId)) {
      ratingsQuery = ratingsQuery.eq('bot_id', botId)
    }

    const { data: ratings } = await ratingsQuery

    const totalRatings = ratings?.length || 0
    const positiveRatings = ratings?.filter((r) => r.rating === 1).length || 0
    const satisfactionScore = totalRatings > 0 ? Math.round((positiveRatings / totalRatings) * 100) : 0

    // Convert messages by day to array
    const messagesByDayArray = Array.from(messagesByDay.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      averageResponseTime: Math.round(averageResponseTime), // in ms
      averageResponseTimeSeconds: Math.round(averageResponseTime / 1000), // in seconds
      totalConversations: sessions.size,
      totalMessages: messages?.length || 0,
      satisfactionScore,
      totalRatings,
      positiveRatings,
      negativeRatings: totalRatings - positiveRatings,
      messagesByDay: messagesByDayArray,
      dateRange: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
        days,
      },
    })
  } catch (error: any) {
    console.error('Error fetching conversation analytics:', error)
    const { response, status } = createApiError('INTERNAL_ERROR', {
      errorMessage: error.message,
    })
    return NextResponse.json(response, { status })
  }
}
