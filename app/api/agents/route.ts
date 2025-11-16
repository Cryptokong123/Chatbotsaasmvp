import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { z } from 'zod'

const createAgentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
  instructions: z.string().default('You are a helpful AI assistant.'),
  personality: z.enum(['professional', 'friendly', 'casual', 'formal', 'enthusiastic']).default('professional'),
  response_style: z.enum(['concise', 'balanced', 'detailed']).default('balanced'),
  enable_sentiment_analysis: z.boolean().default(false),
  enable_multi_language: z.boolean().default(false),
  enable_handoff_to_human: z.boolean().default(false),
  enable_analytics: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
})

/**
 * GET /api/agents
 * List all agents for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all agents for the user
    const { data: agents, error } = await supabase
      .from('agents')
      .select(`
        id,
        name,
        description,
        avatar_url,
        instructions,
        personality,
        response_style,
        is_active,
        deployment_status,
        version,
        enable_sentiment_analysis,
        enable_multi_language,
        enable_handoff_to_human,
        enable_analytics,
        tags,
        metadata,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching agents:', error)
      return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 })
    }

    return NextResponse.json({ agents: agents || [] })
  } catch (error: any) {
    console.error('Error in GET /api/agents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/agents
 * Create a new agent
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's plan to check limits
    const { data: userData } = await supabase
      .from('users')
      .select('agent_plan, bundle_plan')
      .eq('id', user.id)
      .single()

    const plan = userData?.bundle_plan || userData?.agent_plan || 'agent_demo'

    // Check agent count limits
    const { count } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const limits: Record<string, number> = {
      agent_demo: 1,
      agent_starter: 3,
      bundle_starter: 3,
      agent_pro: 999999,
      bundle_pro: 999999,
      agent_enterprise: 999999,
      bundle_enterprise: 999999,
    }

    const limit = limits[plan] || 1

    if ((count || 0) >= limit) {
      return NextResponse.json(
        {
          error: `Agent limit reached. Your plan allows ${limit} agent(s). Upgrade to create more.`,
        },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createAgentSchema.parse(body)

    // Create the agent
    const { data: agent, error } = await supabase
      .from('agents')
      .insert({
        user_id: user.id,
        ...validatedData,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating agent:', error)
      return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 })
    }

    // Create initial deployment record
    await supabase.from('agent_deployments').insert({
      agent_id: agent.id,
      user_id: user.id,
      version: '1.0.0',
      version_name: 'Initial Version',
      environment: 'development',
      status: 'active',
      deployed_by: user.id,
      deployed_at: new Date().toISOString(),
      config_snapshot: agent,
    })

    return NextResponse.json({ agent }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/agents:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
