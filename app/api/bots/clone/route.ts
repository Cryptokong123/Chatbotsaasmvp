import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

/**
 * POST /api/bots/clone
 * Clone a bot with all its configurations, presets, and actions
 */
export async function POST(request: NextRequest) {
  try {
    const { botId, newName } = await request.json()

    if (!botId) {
      return NextResponse.json({ error: 'Bot ID is required' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Verify user owns the bot
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the original bot
    const { data: originalBot, error: botError } = await supabase
      .from('bots')
      .select('*')
      .eq('id', botId)
      .eq('user_id', user.id)
      .single()

    if (botError || !originalBot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }

    // Create the cloned bot
    const clonedBotData = {
      user_id: user.id,
      name: newName || `${originalBot.name} (Copy)`,
      description: originalBot.description,
      instructions: originalBot.instructions,
      avatar_url: originalBot.avatar_url,
      primary_color: originalBot.primary_color,
      welcome_message: originalBot.welcome_message,
      placeholder_text: originalBot.placeholder_text,
      is_active: false, // Start as inactive
      tone: originalBot.tone,
      formality: originalBot.formality,
      use_emojis: originalBot.use_emojis,
      response_length: originalBot.response_length,
      creativity_level: originalBot.creativity_level,
    }

    const { data: newBot, error: createError } = await supabase
      .from('bots')
      .insert(clonedBotData)
      .select()
      .single()

    if (createError) throw createError

    // Clone preset responses
    const { data: presets } = await supabase
      .from('preset_responses')
      .select('*')
      .eq('bot_id', botId)

    if (presets && presets.length > 0) {
      const clonedPresets = presets.map((preset) => ({
        bot_id: newBot.id,
        question: preset.question,
        answer: preset.answer,
        match_type: preset.match_type,
        priority: preset.priority,
        is_active: preset.is_active,
      }))

      await supabase.from('preset_responses').insert(clonedPresets)
    }

    // Clone bot actions
    const { data: actions } = await supabase
      .from('bot_actions')
      .select('*')
      .eq('bot_id', botId)

    if (actions && actions.length > 0) {
      const clonedActions = actions.map((action) => ({
        bot_id: newBot.id,
        name: action.name,
        display_name: action.display_name,
        description: action.description,
        webhook_url: action.webhook_url,
        method: action.method,
        headers: action.headers,
        parameters: action.parameters,
        requires_confirmation: action.requires_confirmation,
        confirmation_message: action.confirmation_message,
        is_active: false, // Start actions as inactive
      }))

      await supabase.from('bot_actions').insert(clonedActions)
    }

    // Note: We don't clone training_data or messages as those are conversation-specific

    return NextResponse.json({
      success: true,
      bot: newBot,
      cloned: {
        presets: presets?.length || 0,
        actions: actions?.length || 0,
      },
    })
  } catch (error: any) {
    console.error('Error cloning bot:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to clone bot' },
      { status: 500 }
    )
  }
}
