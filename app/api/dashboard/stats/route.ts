import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

/**
 * GET /api/dashboard/stats
 * Get dashboard overview statistics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get total bots
    const { count: totalBots } = await supabase
      .from('bots')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Get active bots
    const { count: activeBots } = await supabase
      .from('bots')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true)

    // Get last 30 days stats
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Get user's bot IDs
    const { data: userBots } = await supabase
      .from('bots')
      .select('id')
      .eq('user_id', user.id)

    const botIds = userBots?.map((bot) => bot.id) || []

    if (botIds.length === 0) {
      return NextResponse.json({
        totalBots: 0,
        activeBots: 0,
        totalConversations: 0,
        totalMessages: 0,
        avgSatisfaction: 0,
      })
    }

    // Get total messages (last 30 days)
    const { count: totalMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('bot_id', botIds)
      .gte('created_at', thirtyDaysAgo)

    // Get unique conversations (last 30 days)
    const { data: messages } = await supabase
      .from('messages')
      .select('session_id')
      .in('bot_id', botIds)
      .gte('created_at', thirtyDaysAgo)

    const uniqueSessions = new Set(messages?.map((m) => m.session_id) || [])
    const totalConversations = uniqueSessions.size

    // Get average satisfaction (last 30 days)
    const { data: ratings } = await supabase
      .from('conversation_ratings')
      .select('rating')
      .in('bot_id', botIds)
      .gte('created_at', thirtyDaysAgo)

    const totalRatings = ratings?.length || 0
    const positiveRatings = ratings?.filter((r) => r.rating === 1).length || 0
    const avgSatisfaction = totalRatings > 0 ? Math.round((positiveRatings / totalRatings) * 100) : 0

    return NextResponse.json({
      totalBots: totalBots || 0,
      activeBots: activeBots || 0,
      totalConversations,
      totalMessages: totalMessages || 0,
      avgSatisfaction,
    })
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
