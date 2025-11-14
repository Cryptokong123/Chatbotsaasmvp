import { NextRequest, NextResponse } from 'next/server'
import { performRAGQuery } from '@/lib/rag'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { botId, message, sessionId } = await request.json()

    if (!botId || !message || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Verify bot exists and is active
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('*')
      .eq('id', botId)
      .eq('is_active', true)
      .single()

    if (botError || !bot) {
      return NextResponse.json(
        { error: 'Bot not found or inactive' },
        { status: 404 }
      )
    }

    // Get conversation history
    const { data: history } = await supabase
      .from('messages')
      .select('role, content')
      .eq('bot_id', botId)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(10)

    const conversationHistory = history || []

    // Store user message
    await supabase.from('messages').insert({
      bot_id: botId,
      session_id: sessionId,
      role: 'user',
      content: message,
    })

    // Perform RAG query
    const { response, context } = await performRAGQuery(
      botId,
      message,
      conversationHistory as any
    )

    // Store assistant response
    await supabase.from('messages').insert({
      bot_id: botId,
      session_id: sessionId,
      role: 'assistant',
      content: response,
      metadata: {
        context_used: context.length,
      },
    })

    return NextResponse.json({
      success: true,
      response,
      context,
    })
  } catch (error: any) {
    console.error('Error processing message:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
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
