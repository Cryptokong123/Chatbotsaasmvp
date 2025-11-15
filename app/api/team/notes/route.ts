import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

// Get internal notes for a conversation
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    // Verify access
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id, bot_id, bots!inner(user_id)')
      .eq('id', conversationId)
      .single()

    if (!conversation || (conversation.bots as any).user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data: notes, error } = await supabase
      .from('internal_notes')
      .select(`
        *,
        user:user_id(id, email, raw_user_meta_data)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ notes: notes || [] })
  } catch (error: any) {
    console.error('Error fetching notes:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}

// Create internal note
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId, content, mentions, isPinned } = await request.json()

    if (!conversationId || !content) {
      return NextResponse.json(
        { error: 'Conversation ID and content are required' },
        { status: 400 }
      )
    }

    // Verify access
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id, bot_id, bots!inner(user_id)')
      .eq('id', conversationId)
      .single()

    if (!conversation || (conversation.bots as any).user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data: note, error } = await supabase
      .from('internal_notes')
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        content,
        mentions: mentions || [],
        is_pinned: isPinned || false,
      })
      .select(`
        *,
        user:user_id(id, email, raw_user_meta_data)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, note })
  } catch (error: any) {
    console.error('Error creating note:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create note' },
      { status: 500 }
    )
  }
}

// Update internal note
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { noteId, content, isPinned } = await request.json()

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      )
    }

    const updates: any = {}
    if (content !== undefined) updates.content = content
    if (isPinned !== undefined) updates.is_pinned = isPinned

    const { data: note, error } = await supabase
      .from('internal_notes')
      .update(updates)
      .eq('id', noteId)
      .eq('user_id', user.id) // Only allow updating own notes
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, note })
  } catch (error: any) {
    console.error('Error updating note:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update note' },
      { status: 500 }
    )
  }
}

// Delete internal note
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get('noteId')

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('internal_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', user.id) // Only allow deleting own notes

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting note:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete note' },
      { status: 500 }
    )
  }
}
