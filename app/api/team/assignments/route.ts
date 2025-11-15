import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

// Get assignments
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const assignedTo = searchParams.get('assignedTo')
    const status = searchParams.get('status')

    let query = supabase
      .from('conversation_assignments')
      .select(`
        *,
        conversations!inner(id, bot_id, bots!inner(user_id)),
        assigned_to_user:assigned_to(id, email, raw_user_meta_data),
        assigned_by_user:assigned_by(id, email, raw_user_meta_data)
      `)
      .eq('conversations.bots.user_id', user.id)

    if (conversationId) {
      query = query.eq('conversation_id', conversationId)
    }

    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo)
    }

    if (status) {
      query = query.eq('status', status)
    }

    query = query.order('assigned_at', { ascending: false })

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ assignments: data || [] })
  } catch (error: any) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}

// Create assignment
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId, assignedTo, priority, dueDate } = await request.json()

    if (!conversationId || !assignedTo) {
      return NextResponse.json(
        { error: 'Conversation ID and assigned user are required' },
        { status: 400 }
      )
    }

    // Verify user has access to this conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id, bot_id, bots!inner(user_id)')
      .eq('id', conversationId)
      .single()

    if (!conversation || (conversation.bots as any).user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Create or update assignment
    const { data: assignment, error } = await supabase
      .from('conversation_assignments')
      .upsert({
        conversation_id: conversationId,
        assigned_to: assignedTo,
        assigned_by: user.id,
        priority: priority || 'medium',
        due_date: dueDate || null,
        assigned_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, assignment })
  } catch (error: any) {
    console.error('Error creating assignment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create assignment' },
      { status: 500 }
    )
  }
}

// Update assignment
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { assignmentId, status, priority, dueDate, resolvedAt } = await request.json()

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      )
    }

    const updates: any = {}
    if (status !== undefined) updates.status = status
    if (priority !== undefined) updates.priority = priority
    if (dueDate !== undefined) updates.due_date = dueDate
    if (resolvedAt !== undefined) updates.resolved_at = resolvedAt
    if (status === 'resolved' && !resolvedAt) {
      updates.resolved_at = new Date().toISOString()
    }

    const { data: assignment, error } = await supabase
      .from('conversation_assignments')
      .update(updates)
      .eq('id', assignmentId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, assignment })
  } catch (error: any) {
    console.error('Error updating assignment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update assignment' },
      { status: 500 }
    )
  }
}

// Delete assignment
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignmentId')

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('conversation_assignments')
      .delete()
      .eq('id', assignmentId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete assignment' },
      { status: 500 }
    )
  }
}
