import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

/**
 * POST /api/messages/rate
 * Rate a bot message (thumbs up/down)
 */
export async function POST(request: NextRequest) {
  try {
    const { messageId, botId, sessionId, rating, feedback } = await request.json()

    if (!messageId || !botId || !sessionId || rating === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (rating !== 1 && rating !== -1) {
      return NextResponse.json(
        { error: 'Rating must be 1 (thumbs up) or -1 (thumbs down)' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Store the rating
    const { data, error } = await supabase
      .from('conversation_ratings')
      .insert({
        message_id: messageId,
        bot_id: botId,
        session_id: sessionId,
        rating,
        feedback: feedback || null,
      })
      .select()
      .single()

    if (error) {
      // Check if rating already exists, if so update it
      if (error.code === '23505') {
        const { data: updateData, error: updateError } = await supabase
          .from('conversation_ratings')
          .update({
            rating,
            feedback: feedback || null,
          })
          .eq('message_id', messageId)
          .select()
          .single()

        if (updateError) throw updateError

        return NextResponse.json({ success: true, data: updateData })
      }

      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error rating message:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to rate message' },
      { status: 500 }
    )
  }
}

// Allow CORS for widget
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
