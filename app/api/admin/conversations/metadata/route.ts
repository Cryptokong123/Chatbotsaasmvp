import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { createApiError } from '@/lib/api-errors'

// GET - Fetch metadata for conversations
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      const { response, status } = createApiError('UNAUTHORIZED')
      return NextResponse.json(response, { status })
    }

    const searchParams = request.nextUrl.searchParams
    const sessionIds = searchParams.get('sessionIds')?.split(',') || []

    if (sessionIds.length === 0) {
      return NextResponse.json({ metadata: [] })
    }

    const { data, error } = await supabase
      .from('conversation_metadata')
      .select('*')
      .eq('user_id', user.id)
      .in('session_id', sessionIds)

    if (error) throw error

    return NextResponse.json({ metadata: data || [] })
  } catch (error: any) {
    console.error('Error fetching conversation metadata:', error)
    const { response, status } = createApiError('INTERNAL_ERROR', {
      errorMessage: error.message,
    })
    return NextResponse.json(response, { status })
  }
}

// POST - Create or update metadata
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      const { response, status } = createApiError('UNAUTHORIZED')
      return NextResponse.json(response, { status })
    }

    const body = await request.json()
    const { sessionId, botId, tags, notes } = body

    if (!sessionId || !botId) {
      const { response, status } = createApiError('MISSING_REQUIRED_FIELDS', {
        missing: ['sessionId', 'botId'].filter(field => !body[field]),
      })
      return NextResponse.json(response, { status })
    }

    // Upsert metadata
    const { data, error } = await supabase
      .from('conversation_metadata')
      .upsert(
        {
          session_id: sessionId,
          bot_id: botId,
          user_id: user.id,
          tags: tags || [],
          notes: notes || '',
        },
        {
          onConflict: 'session_id,bot_id',
        }
      )
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ metadata: data })
  } catch (error: any) {
    console.error('Error updating conversation metadata:', error)
    const { response, status } = createApiError('INTERNAL_ERROR', {
      errorMessage: error.message,
    })
    return NextResponse.json(response, { status })
  }
}

// DELETE - Remove metadata
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      const { response, status } = createApiError('UNAUTHORIZED')
      return NextResponse.json(response, { status })
    }

    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('sessionId')
    const botId = searchParams.get('botId')

    if (!sessionId || !botId) {
      const { response, status } = createApiError('MISSING_REQUIRED_FIELDS')
      return NextResponse.json(response, { status })
    }

    const { error } = await supabase
      .from('conversation_metadata')
      .delete()
      .eq('session_id', sessionId)
      .eq('bot_id', botId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting conversation metadata:', error)
    const { response, status } = createApiError('INTERNAL_ERROR', {
      errorMessage: error.message,
    })
    return NextResponse.json(response, { status })
  }
}
