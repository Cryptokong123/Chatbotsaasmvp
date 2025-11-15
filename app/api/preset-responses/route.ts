import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { canAddPresetResponse } from '@/lib/plans'
import { z } from 'zod'

const presetResponseSchema = z.object({
  botId: z.string().uuid(),
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(2000),
  matchType: z.enum(['exact', 'contains', 'starts_with']).default('exact'),
  priority: z.number().int().min(0).max(100).default(0),
})

/**
 * GET /api/preset-responses
 * List all preset responses for a bot
 */
export async function GET(request: Request) {
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

    // Get all preset responses for this bot
    const { data: presets, error } = await supabase
      .from('preset_responses')
      .select('*')
      .eq('bot_id', botId)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ presets: presets || [] })
  } catch (error) {
    console.error('Error fetching preset responses:', error)
    return NextResponse.json({ error: 'Failed to fetch preset responses' }, { status: 500 })
  }
}

/**
 * POST /api/preset-responses
 * Create a new preset response
 */
export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = presetResponseSchema.parse(body)

    // Verify user owns this bot
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('id, user_id')
      .eq('id', validatedData.botId)
      .single()

    if (botError || !bot || bot.user_id !== user.id) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }

    // Check if user can add more preset responses
    const canAdd = await canAddPresetResponse(user.id, validatedData.botId)

    if (!canAdd.allowed) {
      return NextResponse.json(
        {
          error: canAdd.reason,
          current: canAdd.current,
          limit: canAdd.limit,
        },
        { status: 403 }
      )
    }

    // Create preset response
    const { data, error } = await supabase
      .from('preset_responses')
      .insert({
        bot_id: validatedData.botId,
        question: validatedData.question,
        answer: validatedData.answer,
        match_type: validatedData.matchType,
        priority: validatedData.priority,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ preset: data }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', errors: error.errors }, { status: 400 })
    }

    console.error('Error creating preset response:', error)
    return NextResponse.json({ error: 'Failed to create preset response' }, { status: 500 })
  }
}

/**
 * PUT /api/preset-responses
 * Update a preset response
 */
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const presetId = searchParams.get('id')

    if (!presetId) {
      return NextResponse.json({ error: 'Preset ID is required' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const updateSchema = z.object({
      question: z.string().min(1).max(500).optional(),
      answer: z.string().min(1).max(2000).optional(),
      matchType: z.enum(['exact', 'contains', 'starts_with']).optional(),
      priority: z.number().int().min(0).max(100).optional(),
      isActive: z.boolean().optional(),
    })

    const validatedData = updateSchema.parse(body)

    // Verify user owns this preset (via bot ownership)
    const { data: preset, error: presetError } = await supabase
      .from('preset_responses')
      .select('*, bots!inner(user_id)')
      .eq('id', presetId)
      .single()

    if (presetError || !preset || preset.bots.user_id !== user.id) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
    }

    // Update preset
    const { data, error } = await supabase
      .from('preset_responses')
      .update({
        ...(validatedData.question && { question: validatedData.question }),
        ...(validatedData.answer && { answer: validatedData.answer }),
        ...(validatedData.matchType && { match_type: validatedData.matchType }),
        ...(validatedData.priority !== undefined && { priority: validatedData.priority }),
        ...(validatedData.isActive !== undefined && { is_active: validatedData.isActive }),
      })
      .eq('id', presetId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ preset: data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', errors: error.errors }, { status: 400 })
    }

    console.error('Error updating preset response:', error)
    return NextResponse.json({ error: 'Failed to update preset response' }, { status: 500 })
  }
}

/**
 * DELETE /api/preset-responses
 * Delete a preset response
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const presetId = searchParams.get('id')

    if (!presetId) {
      return NextResponse.json({ error: 'Preset ID is required' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns this preset (via bot ownership)
    const { data: preset, error: presetError } = await supabase
      .from('preset_responses')
      .select('*, bots!inner(user_id)')
      .eq('id', presetId)
      .single()

    if (presetError || !preset || preset.bots.user_id !== user.id) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
    }

    // Delete preset
    const { error } = await supabase.from('preset_responses').delete().eq('id', presetId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting preset response:', error)
    return NextResponse.json({ error: 'Failed to delete preset response' }, { status: 500 })
  }
}
