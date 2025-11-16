import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { z } from 'zod'

const createPlatformIntegrationSchema = z.object({
  platform: z.enum([
    'whatsapp', 'telegram', 'slack', 'discord', 'teams',
    'messenger', 'instagram', 'twitter', 'linkedin',
    'sms', 'voice', 'email', 'wechat', 'line', 'viber',
    'kakao', 'alexa', 'google_assistant', 'google_business', 'apple_business'
  ]),
  platform_name: z.string().optional(),
  credentials: z.record(z.any()),
  config: z.record(z.any()).default({}),
  is_active: z.boolean().default(true),
})

/**
 * GET /api/agents/[id]/platforms
 * Get all platform integrations for an agent
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

    // Verify agent ownership
    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single()

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Get all platform integrations
    const { data: platforms, error } = await supabase
      .from('platform_integrations')
      .select(`
        id,
        platform,
        platform_name,
        status,
        is_active,
        webhook_url,
        webhook_verified,
        last_connected_at,
        last_error,
        error_count,
        created_at,
        updated_at
      `)
      .eq('agent_id', agentId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching platform integrations:', error)
      return NextResponse.json({ error: 'Failed to fetch platforms' }, { status: 500 })
    }

    return NextResponse.json({ platforms: platforms || [] })
  } catch (error: any) {
    console.error('Error in GET /api/agents/[id]/platforms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/agents/[id]/platforms
 * Add a new platform integration
 */
export async function POST(
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

    // Verify agent ownership
    const { data: agent } = await supabase
      .from('agents')
      .select('id')
      .eq('id', agentId)
      .eq('user_id', user.id)
      .single()

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Check user's plan for platform limits
    const { data: userData } = await supabase
      .from('users')
      .select('agent_plan, bundle_plan')
      .eq('id', user.id)
      .single()

    const plan = userData?.bundle_plan || userData?.agent_plan || 'agent_demo'

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createPlatformIntegrationSchema.parse(body)

    // Check platform permissions based on plan
    const platformPermissions: Record<string, string[]> = {
      agent_demo: ['telegram'],
      agent_starter: ['whatsapp', 'telegram', 'slack', 'discord', 'sms', 'email'],
      bundle_starter: ['whatsapp', 'telegram', 'slack', 'discord', 'sms', 'email'],
      agent_pro: ['whatsapp', 'telegram', 'slack', 'discord', 'teams', 'messenger', 'instagram', 'twitter', 'linkedin', 'sms', 'voice', 'email', 'wechat', 'line', 'viber', 'kakao', 'alexa', 'google_assistant', 'google_business', 'apple_business'],
      bundle_pro: ['whatsapp', 'telegram', 'slack', 'discord', 'teams', 'messenger', 'instagram', 'twitter', 'linkedin', 'sms', 'voice', 'email', 'wechat', 'line', 'viber', 'kakao', 'alexa', 'google_assistant', 'google_business', 'apple_business'],
      agent_enterprise: ['whatsapp', 'telegram', 'slack', 'discord', 'teams', 'messenger', 'instagram', 'twitter', 'linkedin', 'sms', 'voice', 'email', 'wechat', 'line', 'viber', 'kakao', 'alexa', 'google_assistant', 'google_business', 'apple_business'],
      bundle_enterprise: ['whatsapp', 'telegram', 'slack', 'discord', 'teams', 'messenger', 'instagram', 'twitter', 'linkedin', 'sms', 'voice', 'email', 'wechat', 'line', 'viber', 'kakao', 'alexa', 'google_assistant', 'google_business', 'apple_business'],
    }

    const allowedPlatforms = platformPermissions[plan] || ['telegram']

    if (!allowedPlatforms.includes(validatedData.platform)) {
      return NextResponse.json(
        {
          error: `Platform "${validatedData.platform}" is not available in your plan. Upgrade to access this platform.`,
        },
        { status: 403 }
      )
    }

    // Check if platform already connected
    const { data: existing } = await supabase
      .from('platform_integrations')
      .select('id')
      .eq('agent_id', agentId)
      .eq('platform', validatedData.platform)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: `Platform "${validatedData.platform}" is already connected to this agent.` },
        { status: 409 }
      )
    }

    // Generate webhook URL
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/agents/${agentId}/${validatedData.platform}`

    // Create the platform integration
    const { data: platform, error } = await supabase
      .from('platform_integrations')
      .insert({
        agent_id: agentId,
        user_id: user.id,
        ...validatedData,
        webhook_url: webhookUrl,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating platform integration:', error)
      return NextResponse.json({ error: 'Failed to create platform integration' }, { status: 500 })
    }

    return NextResponse.json({ platform }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/agents/[id]/platforms:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
