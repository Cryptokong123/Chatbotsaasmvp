/**
 * Conversation Flows API
 *
 * CRUD operations for conversation flows
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const botId = searchParams.get('botId')

    if (!botId) {
      return NextResponse.json({ error: 'Bot ID required' }, { status: 400 })
    }

    // Verify bot ownership
    const { data: bot } = await supabase
      .from('bots')
      .select('id')
      .eq('id', botId)
      .eq('user_id', user.id)
      .single()

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }

    // Get all flows for this bot
    const { data: flows, error } = await supabase
      .from('conversation_flows')
      .select('*')
      .eq('bot_id', botId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ flows })
  } catch (error: any) {
    console.error('Error fetching flows:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch flows' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      bot_id,
      name,
      description,
      is_active,
      trigger_type,
      trigger_value,
      entry_node_id,
      nodes,
      edges,
      variables,
      variables_schema,
    } = body

    // Verify bot ownership
    const { data: bot } = await supabase
      .from('bots')
      .select('id')
      .eq('id', bot_id)
      .eq('user_id', user.id)
      .single()

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }

    // Create flow
    const { data: flow, error } = await supabase
      .from('conversation_flows')
      .insert({
        bot_id,
        name,
        description,
        is_active,
        trigger_type,
        trigger_value,
        entry_node_id,
        nodes: nodes || [],
        edges: edges || [],
        variables: variables || {},
        variables_schema: variables_schema || {},
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ flow }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating flow:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create flow' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      id,
      name,
      description,
      is_active,
      trigger_type,
      trigger_value,
      entry_node_id,
      nodes,
      edges,
      variables,
      variables_schema,
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Flow ID required' }, { status: 400 })
    }

    // Verify flow ownership through bot
    const { data: existingFlow } = await supabase
      .from('conversation_flows')
      .select('bot_id, bots!inner(user_id)')
      .eq('id', id)
      .single()

    if (!existingFlow || (existingFlow.bots as any).user_id !== user.id) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
    }

    // Update flow
    const { data: flow, error } = await supabase
      .from('conversation_flows')
      .update({
        name,
        description,
        is_active,
        trigger_type,
        trigger_value,
        entry_node_id,
        nodes: nodes || [],
        edges: edges || [],
        variables: variables || {},
        variables_schema: variables_schema || {},
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ flow })
  } catch (error: any) {
    console.error('Error updating flow:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update flow' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const flowId = searchParams.get('id')

    if (!flowId) {
      return NextResponse.json({ error: 'Flow ID required' }, { status: 400 })
    }

    // Verify flow ownership through bot
    const { data: existingFlow } = await supabase
      .from('conversation_flows')
      .select('bot_id, bots!inner(user_id)')
      .eq('id', flowId)
      .single()

    if (!existingFlow || (existingFlow.bots as any).user_id !== user.id) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
    }

    // Delete flow
    const { error } = await supabase
      .from('conversation_flows')
      .delete()
      .eq('id', flowId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting flow:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete flow' },
      { status: 500 }
    )
  }
}
