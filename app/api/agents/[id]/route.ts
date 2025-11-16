import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { z } from 'zod'

const updateAgentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
  instructions: z.string().optional(),
  personality: z.enum(['professional', 'friendly', 'casual', 'formal', 'enthusiastic']).optional(),
  response_style: z.enum(['concise', 'balanced', 'detailed']).optional(),
  is_active: z.boolean().optional(),
  deployment_status: z.enum(['draft', 'staging', 'production', 'archived']).optional(),
  enable_sentiment_analysis: z.boolean().optional(),
  enable_multi_language: z.boolean().optional(),
  enable_handoff_to_human: z.boolean().optional(),
  enable_analytics: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
})

/**
 * GET /api/agents/[id]
 * Get a specific agent
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const supabase = createServerSupabaseClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the agent
    const { data: agent, error } = await supabase
      .from('agents')
      .select(`
        *,
        platform_integrations (
          id,
          platform,
          platform_name,
          status,
          is_active,
          last_connected_at,
          created_at
        )
      `)
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single()

    if (error || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    return NextResponse.json({ agent })
  } catch (error: any) {
    console.error('Error in GET /api/agents/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/agents/[id]
 * Update an agent
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const supabase = createServerSupabaseClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateAgentSchema.parse(body)

    // Update the agent
    const { data: agent, error } = await supabase
      .from('agents')
      .update(validatedData)
      .eq('id', agentId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error || !agent) {
      console.error('Error updating agent:', error)
      return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 })
    }

    return NextResponse.json({ agent })
  } catch (error: any) {
    console.error('Error in PUT /api/agents/[id]:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/agents/[id]
 * Delete an agent
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id
    const supabase = createServerSupabaseClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete the agent (cascades to related tables)
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', agentId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting agent:', error)
      return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/agents/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
