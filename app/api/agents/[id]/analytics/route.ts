import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

/**
 * GET /api/agents/[id]/analytics
 * Get analytics for a specific agent
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const supabase = createServerSupabaseClient()

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'day' // hour, day, week, month
    const days = parseInt(searchParams.get('days') || '7')

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify agent ownership
    const { data: agent } = await supabase
      .from('agents')
      .select('id, name')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single()

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get analytics data
    const { data: analytics, error: analyticsError } = await supabase
      .from('agent_analytics')
      .select('*')
      .eq('agent_id', agentId)
      .eq('period_type', period)
      .gte('period_start', startDate.toISOString())
      .lte('period_end', endDate.toISOString())
      .order('period_start', { ascending: true })

    if (analyticsError) {
      console.error('Error fetching analytics:', analyticsError)
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }

    // Get conversation stats
    const { data: conversations } = await supabase
      .from('agent_conversations')
      .select('id, status, sentiment_score, satisfaction_score, message_count, created_at')
      .eq('agent_id', agentId)
      .gte('created_at', startDate.toISOString())

    // Get message stats
    const { data: messages } = await supabase
      .from('agent_messages')
      .select('id, direction, sender_type, sentiment, processing_time_ms, created_at')
      .eq('agent_id', agentId)
      .gte('created_at', startDate.toISOString())

    // Calculate summary statistics
    const totalConversations = conversations?.length || 0
    const activeConversations = conversations?.filter(c => c.status === 'active').length || 0
    const resolvedConversations = conversations?.filter(c => c.status === 'resolved').length || 0

    const totalMessages = messages?.length || 0
    const incomingMessages = messages?.filter(m => m.direction === 'incoming').length || 0
    const outgoingMessages = messages?.filter(m => m.direction === 'outgoing').length || 0

    const avgProcessingTime = messages && messages.length > 0
      ? messages.reduce((sum, m) => sum + (m.processing_time_ms || 0), 0) / messages.length
      : 0

    const avgSentiment = conversations && conversations.length > 0
      ? conversations.reduce((sum, c) => sum + (parseFloat(c.sentiment_score as any) || 0), 0) / conversations.length
      : 0

    const avgSatisfaction = conversations && conversations.length > 0
      ? conversations.filter(c => c.satisfaction_score).reduce((sum, c) => sum + (c.satisfaction_score || 0), 0) / conversations.filter(c => c.satisfaction_score).length
      : 0

    return NextResponse.json({
      agent: {
        id: agent.id,
        name: agent.name,
      },
      period,
      days,
      summary: {
        total_conversations: totalConversations,
        active_conversations: activeConversations,
        resolved_conversations: resolvedConversations,
        total_messages: totalMessages,
        incoming_messages: incomingMessages,
        outgoing_messages: outgoingMessages,
        avg_processing_time_ms: Math.round(avgProcessingTime),
        avg_sentiment_score: parseFloat(avgSentiment.toFixed(2)),
        avg_satisfaction_score: parseFloat(avgSatisfaction.toFixed(2)),
      },
      time_series: analytics || [],
      conversations: conversations || [],
    })
  } catch (error: any) {
    console.error('Error in GET /api/agents/[id]/analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
