import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

/**
 * Save a bot as a user template
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const botId = params.id
    const { templateName, templateDescription, category } = await request.json()

    // Fetch the bot
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('*')
      .eq('id', botId)
      .eq('user_id', user.id) // Ensure user owns the bot
      .single()

    if (botError || !bot) {
      return NextResponse.json(
        { error: 'Bot not found or unauthorized' },
        { status: 404 }
      )
    }

    // Fetch bot's preset responses
    const { data: presets } = await supabase
      .from('preset_responses')
      .select('*')
      .eq('bot_id', botId)

    // Fetch bot's actions
    const { data: actions } = await supabase
      .from('bot_actions')
      .select('*')
      .eq('bot_id', botId)

    // Create template from bot
    const { data: template, error: templateError } = await supabase
      .from('bot_templates')
      .insert({
        user_id: user.id, // Mark as user-created template
        name: templateName || bot.name,
        description: templateDescription || bot.description || 'User created template',
        category: category || 'custom',
        system_prompt: bot.instructions,
        welcome_message: bot.welcome_message,
        primary_color: bot.primary_color,
        placeholder_text: bot.placeholder_text,
        avatar_url: bot.avatar_url,
        tone: bot.tone,
        formality: bot.formality,
        use_emojis: bot.use_emojis,
        response_length: bot.response_length,
        creativity_level: bot.creativity_level,
        is_active: true,
        is_public: false, // User templates are private by default
        use_count: 0,
      })
      .select()
      .single()

    if (templateError) throw templateError

    // Copy preset responses to template
    if (presets && presets.length > 0) {
      const templatePresets = presets.map((preset) => ({
        template_id: template.id,
        trigger: preset.trigger,
        response: preset.response,
        priority: preset.priority,
      }))

      const { error: presetsError } = await supabase
        .from('bot_template_presets')
        .insert(templatePresets)

      if (presetsError) {
        console.error('Error copying presets to template:', presetsError)
      }
    }

    // Copy actions to template
    if (actions && actions.length > 0) {
      const templateActions = actions.map((action) => ({
        template_id: template.id,
        name: action.name,
        description: action.description,
        trigger_type: action.trigger_type,
        trigger_value: action.trigger_value,
        action_type: action.action_type,
        action_config: action.action_config,
        is_active: action.is_active,
      }))

      const { error: actionsError } = await supabase
        .from('bot_template_actions')
        .insert(templateActions)

      if (actionsError) {
        console.error('Error copying actions to template:', actionsError)
      }
    }

    return NextResponse.json({
      success: true,
      template,
      message: 'Bot saved as template successfully',
      copied: {
        presets: presets?.length || 0,
        actions: actions?.length || 0,
      },
    })
  } catch (error: any) {
    console.error('Error saving bot as template:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save bot as template' },
      { status: 500 }
    )
  }
}
