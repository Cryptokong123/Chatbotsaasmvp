import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

/**
 * Analytics API
 * Get conversation and usage analytics
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const botId = request.nextUrl.searchParams.get('botId')
    const days = parseInt(request.nextUrl.searchParams.get('days') || '30')

    if (!botId) {
      return NextResponse.json({ error: 'Bot ID required' }, { status: 400 })
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get message stats
    const { count: messageCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('bot_id', botId)
      .gte('created_at', startDate.toISOString())

    // Get unique conversations
    const { data: sessions } = await supabase
      .from('messages')
      .select('session_id')
      .eq('bot_id', botId)
      .gte('created_at', startDate.toISOString())

    const uniqueSessions = new Set(sessions?.map((s) => s.session_id) || []).size

    // Get messages over time
    const { data: messagesOverTime } = await supabase
      .from('messages')
      .select('created_at')
      .eq('bot_id', botId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    // Group by day
    const messagesByDay: Record<string, number> = {}
    messagesOverTime?.forEach((msg) => {
      const date = msg.created_at.split('T')[0]
      messagesByDay[date] = (messagesByDay[date] || 0) + 1
    })

    return NextResponse.json({
      totalMessages: messageCount || 0,
      totalConversations: uniqueSessions,
      avgMessagesPerConversation:
        uniqueSessions > 0 ? Math.round((messageCount || 0) / uniqueSessions) : 0,
      messagesOverTime: Object.entries(messagesByDay).map(([date, count]) => ({
        date,
        count,
      })),
    })
  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
