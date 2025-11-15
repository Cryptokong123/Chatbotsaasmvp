import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { calculateBotPerformance, generateBotSuggestions } from '@/lib/bot-insights'

/**
 * GET /api/bot-insights
 * Get bot performance insights and AI-powered suggestions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const botId = searchParams.get('botId')

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

    // Calculate performance score
    const performance = await calculateBotPerformance(botId)

    // Generate AI suggestions
    const suggestions = await generateBotSuggestions(botId, performance)

    return NextResponse.json({
      performance,
      suggestions,
    })
  } catch (error: any) {
    console.error('Error fetching bot insights:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch insights' },
      { status: 500 }
    )
  }
}
