import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    let query = supabase
      .from('bot_templates')
      .select(`
        *,
        presets:bot_template_presets(id, trigger, response, priority),
        actions:bot_template_actions(id, name, description, trigger_type, trigger_value, action_type, action_config)
      `)
      .eq('is_active', true)
      .order('use_count', { ascending: false })

    // Filter by category if provided
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data: templates, error } = await query

    if (error) throw error

    return NextResponse.json({
      templates: templates || [],
    })
  } catch (error: any) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

// Create a bot from a template
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { templateId, customName } = await request.json()

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Fetch template with presets and actions
    const { data: template, error: templateError } = await supabase
      .from('bot_templates')
      .select(`
        *,
        presets:bot_template_presets(*),
        actions:bot_template_actions(*)
      `)
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Create new bot from template
    const { data: newBot, error: botError } = await supabase
      .from('bots')
      .insert({
        user_id: user.id,
        name: customName || template.name,
        description: template.description,
        system_prompt: template.system_prompt,
        welcome_message: template.welcome_message,
        primary_color: template.primary_color,
        display_name: template.display_name,
        placeholder_text: template.placeholder_text,
        is_active: true,
      })
      .select()
      .single()

    if (botError) throw botError

    // Copy presets from template
    if (template.presets && template.presets.length > 0) {
      const presets = template.presets.map((preset: any) => ({
        bot_id: newBot.id,
        trigger: preset.trigger,
        response: preset.response,
        priority: preset.priority,
      }))

      const { error: presetsError } = await supabase
        .from('preset_responses')
        .insert(presets)

      if (presetsError) {
        console.error('Error copying presets:', presetsError)
      }
    }

    // Copy actions from template
    if (template.actions && template.actions.length > 0) {
      const actions = template.actions.map((action: any) => ({
        bot_id: newBot.id,
        name: action.name,
        description: action.description,
        trigger_type: action.trigger_type,
        trigger_value: action.trigger_value,
        action_type: action.action_type,
        action_config: action.action_config,
        is_active: action.is_active,
      }))

      const { error: actionsError } = await supabase
        .from('bot_actions')
        .insert(actions)

      if (actionsError) {
        console.error('Error copying actions:', actionsError)
      }
    }

    // Increment template use count
    await supabase
      .from('bot_templates')
      .update({ use_count: template.use_count + 1 })
      .eq('id', templateId)

    return NextResponse.json({
      success: true,
      bot: newBot,
      copied: {
        presets: template.presets?.length || 0,
        actions: template.actions?.length || 0,
      },
    })
  } catch (error: any) {
    console.error('Error creating bot from template:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create bot from template' },
      { status: 500 }
    )
  }
}
