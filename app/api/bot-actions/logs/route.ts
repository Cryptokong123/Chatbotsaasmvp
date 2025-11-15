import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

/**
 * GET /api/bot-actions/logs
 * Get action execution logs for a bot
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const botId = searchParams.get('botId')
    const actionId = searchParams.get('actionId')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!botId) {
      return NextResponse.json({ error: 'Bot ID is required' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Verify user owns this bot
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('id, user_id')
      .eq('id', botId)
      .single()

    if (botError || !bot || bot.user_id !== user.id) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }

    // Build query
    let query = supabase
      .from('action_logs')
      .select(`
        *,
        bot_actions!inner(name, display_name)
      `)
      .eq('bot_id', botId)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filter by action if specified
    if (actionId) {
      query = query.eq('action_id', actionId)
    }

    const { data: logs, error } = await query

    if (error) throw error

    return NextResponse.json({ logs: logs || [] })
  } catch (error) {
    console.error('Error fetching action logs:', error)
    return NextResponse.json({ error: 'Failed to fetch action logs' }, { status: 500 })
  }
}
