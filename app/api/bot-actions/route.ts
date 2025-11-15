import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { canAddAction } from '@/lib/plans'
import { z } from 'zod'

const actionParameterSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
  description: z.string().min(1),
  required: z.boolean(),
  enum: z.array(z.string()).optional(),
})

const botActionSchema = z.object({
  botId: z.string().uuid(),
  name: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/, 'Name must be lowercase with underscores only'),
  displayName: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  webhookUrl: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('POST'),
  headers: z.record(z.string()).default({}),
  parameters: z.array(actionParameterSchema).default([]),
  requiresConfirmation: z.boolean().default(true),
  confirmationMessage: z.string().optional(),
})

/**
 * GET /api/bot-actions
 * List all actions for a bot
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

    // Get all actions for this bot
    const { data: actions, error } = await supabase
      .from('bot_actions')
      .select('*')
      .eq('bot_id', botId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ actions: actions || [] })
  } catch (error) {
    console.error('Error fetching bot actions:', error)
    return NextResponse.json({ error: 'Failed to fetch bot actions' }, { status: 500 })
  }
}

/**
 * POST /api/bot-actions
 * Create a new action
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = botActionSchema.parse(body)

    // Verify user owns this bot
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('id, user_id')
      .eq('id', validatedData.botId)
      .single()

    if (botError || !bot || bot.user_id !== user.id) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }

    // Check if user can add more actions
    const canAdd = await canAddAction(user.id, validatedData.botId)

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

    // Create action
    const { data, error } = await supabase
      .from('bot_actions')
      .insert({
        bot_id: validatedData.botId,
        name: validatedData.name,
        display_name: validatedData.displayName,
        description: validatedData.description,
        webhook_url: validatedData.webhookUrl,
        method: validatedData.method,
        headers: validatedData.headers,
        parameters: validatedData.parameters,
        requires_confirmation: validatedData.requiresConfirmation,
        confirmation_message: validatedData.confirmationMessage,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'An action with this name already exists for this bot' },
          { status: 400 }
        )
      }
      throw error
    }

    return NextResponse.json({ action: data }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', errors: error.errors }, { status: 400 })
    }

    console.error('Error creating bot action:', error)
    return NextResponse.json({ error: 'Failed to create bot action' }, { status: 500 })
  }
}

/**
 * PUT /api/bot-actions
 * Update an action
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const actionId = searchParams.get('id')

    if (!actionId) {
      return NextResponse.json({ error: 'Action ID is required' }, { status: 400 })
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
      displayName: z.string().min(1).max(200).optional(),
      description: z.string().min(1).max(1000).optional(),
      webhookUrl: z.string().url().optional(),
      method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
      headers: z.record(z.string()).optional(),
      parameters: z.array(actionParameterSchema).optional(),
      requiresConfirmation: z.boolean().optional(),
      confirmationMessage: z.string().optional(),
      isActive: z.boolean().optional(),
    })

    const validatedData = updateSchema.parse(body)

    // Verify user owns this action (via bot ownership)
    const { data: action, error: actionError } = await supabase
      .from('bot_actions')
      .select('*, bots!inner(user_id)')
      .eq('id', actionId)
      .single()

    if (actionError || !action || action.bots.user_id !== user.id) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 })
    }

    // Update action
    const { data, error } = await supabase
      .from('bot_actions')
      .update({
        ...(validatedData.displayName && { display_name: validatedData.displayName }),
        ...(validatedData.description && { description: validatedData.description }),
        ...(validatedData.webhookUrl && { webhook_url: validatedData.webhookUrl }),
        ...(validatedData.method && { method: validatedData.method }),
        ...(validatedData.headers && { headers: validatedData.headers }),
        ...(validatedData.parameters && { parameters: validatedData.parameters }),
        ...(validatedData.requiresConfirmation !== undefined && {
          requires_confirmation: validatedData.requiresConfirmation,
        }),
        ...(validatedData.confirmationMessage && {
          confirmation_message: validatedData.confirmationMessage,
        }),
        ...(validatedData.isActive !== undefined && { is_active: validatedData.isActive }),
      })
      .eq('id', actionId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ action: data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', errors: error.errors }, { status: 400 })
    }

    console.error('Error updating bot action:', error)
    return NextResponse.json({ error: 'Failed to update bot action' }, { status: 500 })
  }
}

/**
 * DELETE /api/bot-actions
 * Delete an action
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const actionId = searchParams.get('id')

    if (!actionId) {
      return NextResponse.json({ error: 'Action ID is required' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns this action (via bot ownership)
    const { data: action, error: actionError } = await supabase
      .from('bot_actions')
      .select('*, bots!inner(user_id)')
      .eq('id', actionId)
      .single()

    if (actionError || !action || action.bots.user_id !== user.id) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 })
    }

    // Delete action
    const { error } = await supabase.from('bot_actions').delete().eq('id', actionId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting bot action:', error)
    return NextResponse.json({ error: 'Failed to delete bot action' }, { status: 500 })
  }
}
