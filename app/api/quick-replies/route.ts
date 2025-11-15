import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

// Get all quick replies for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const botId = searchParams.get('botId')
    const category = searchParams.get('category')

    let query = supabase
      .from('quick_replies')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('use_count', { ascending: false })

    // Filter by bot or get global templates
    if (botId) {
      query = query.or(`bot_id.eq.${botId},is_global.eq.true`)
    }

    // Filter by category
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data: quickReplies, error } = await query

    if (error) throw error

    return NextResponse.json({
      quickReplies: quickReplies || [],
    })
  } catch (error: any) {
    console.error('Error fetching quick replies:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quick replies' },
      { status: 500 }
    )
  }
}

// Create a new quick reply
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

    const { title, message, shortcut, category, botId, isGlobal } = await request.json()

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      )
    }

    // Validate shortcut format (should start with /)
    if (shortcut && !shortcut.startsWith('/')) {
      return NextResponse.json(
        { error: 'Shortcut must start with /' },
        { status: 400 }
      )
    }

    // Check if shortcut is already in use
    if (shortcut) {
      const { data: existing } = await supabase
        .from('quick_replies')
        .select('id')
        .eq('user_id', user.id)
        .eq('shortcut', shortcut)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: `Shortcut ${shortcut} is already in use` },
          { status: 400 }
        )
      }
    }

    const { data: quickReply, error } = await supabase
      .from('quick_replies')
      .insert({
        user_id: user.id,
        title,
        message,
        shortcut,
        category: category || 'general',
        bot_id: isGlobal ? null : botId,
        is_global: isGlobal || false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      quickReply,
    })
  } catch (error: any) {
    console.error('Error creating quick reply:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create quick reply' },
      { status: 500 }
    )
  }
}

// Update a quick reply
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { quickReplyId, title, message, shortcut, category, isActive } = await request.json()

    if (!quickReplyId) {
      return NextResponse.json(
        { error: 'Quick reply ID is required' },
        { status: 400 }
      )
    }

    // Validate shortcut format if provided
    if (shortcut && !shortcut.startsWith('/')) {
      return NextResponse.json(
        { error: 'Shortcut must start with /' },
        { status: 400 }
      )
    }

    // Check if shortcut is already in use by another quick reply
    if (shortcut) {
      const { data: existing } = await supabase
        .from('quick_replies')
        .select('id')
        .eq('user_id', user.id)
        .eq('shortcut', shortcut)
        .neq('id', quickReplyId)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: `Shortcut ${shortcut} is already in use` },
          { status: 400 }
        )
      }
    }

    const updates: any = {}
    if (title !== undefined) updates.title = title
    if (message !== undefined) updates.message = message
    if (shortcut !== undefined) updates.shortcut = shortcut
    if (category !== undefined) updates.category = category
    if (isActive !== undefined) updates.is_active = isActive

    const { data: quickReply, error } = await supabase
      .from('quick_replies')
      .update(updates)
      .eq('id', quickReplyId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      quickReply,
    })
  } catch (error: any) {
    console.error('Error updating quick reply:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update quick reply' },
      { status: 500 }
    )
  }
}

// Delete a quick reply
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const quickReplyId = searchParams.get('quickReplyId')

    if (!quickReplyId) {
      return NextResponse.json(
        { error: 'Quick reply ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('quick_replies')
      .delete()
      .eq('id', quickReplyId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error('Error deleting quick reply:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete quick reply' },
      { status: 500 }
    )
  }
}
