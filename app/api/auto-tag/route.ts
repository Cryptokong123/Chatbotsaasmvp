import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { predictTags, analyzeUrgency, extractIntent, needsEscalation } from '@/lib/auto-tagging'

// Auto-tag a specific conversation
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

    const { conversationId, autoApply = false } = await request.json()

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        bot_id,
        sentiment_score,
        bots!inner(user_id)
      `)
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Check if user owns the bot
    if ((conversation.bots as any).user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Get all messages from the conversation
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (messagesError) throw messagesError

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'No messages found in conversation' },
        { status: 404 }
      )
    }

    // Combine all messages for analysis
    const conversationText = messages.map(m => m.content).join(' ')

    // Analyze conversation
    const predictions = predictTags(conversationText, 0.3)
    const urgency = analyzeUrgency(conversationText)
    const intent = extractIntent(conversationText)
    const escalation = needsEscalation(conversationText, conversation.sentiment_score || undefined)

    // Get top 3 tags
    const suggestedTags = predictions.slice(0, 3).map(p => p.tag)

    // Auto-apply tags if requested
    if (autoApply && suggestedTags.length > 0) {
      // Get existing metadata
      const { data: metadata } = await supabase
        .from('conversation_metadata')
        .select('tags')
        .eq('session_id', conversationId)
        .eq('bot_id', conversation.bot_id)
        .single()

      const existingTags = metadata?.tags || []
      const newTags = Array.from(new Set([...existingTags, ...suggestedTags]))

      // Update or insert metadata
      await supabase
        .from('conversation_metadata')
        .upsert({
          session_id: conversationId,
          bot_id: conversation.bot_id,
          tags: newTags,
          updated_at: new Date().toISOString(),
        })
    }

    return NextResponse.json({
      success: true,
      predictions,
      suggestedTags,
      urgency,
      intent,
      needsEscalation: escalation,
      applied: autoApply,
    })
  } catch (error: any) {
    console.error('Error auto-tagging conversation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to auto-tag conversation' },
      { status: 500 }
    )
  }
}

// Batch auto-tag conversations
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

    const { botId, limit = 50, autoApply = false } = await request.json()

    // Get conversations to analyze
    let query = supabase
      .from('conversations')
      .select('id, bot_id, bots!inner(user_id), sentiment_score')
      .eq('bots.user_id', user.id)
      .limit(limit)

    if (botId) {
      query = query.eq('bot_id', botId)
    }

    const { data: conversations, error: convsError } = await query

    if (convsError) throw convsError

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({
        success: true,
        analyzed: 0,
        message: 'No conversations to analyze',
      })
    }

    let analyzed = 0
    let tagged = 0
    const results = []

    // Analyze each conversation
    for (const conversation of conversations) {
      try {
        // Get messages
        const { data: messages } = await supabase
          .from('messages')
          .select('content')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true })

        if (!messages || messages.length === 0) continue

        const conversationText = messages.map(m => m.content).join(' ')

        // Analyze
        const predictions = predictTags(conversationText, 0.3)
        const suggestedTags = predictions.slice(0, 3).map(p => p.tag)
        const urgency = analyzeUrgency(conversationText)
        const intent = extractIntent(conversationText)

        results.push({
          conversationId: conversation.id,
          tags: suggestedTags,
          urgency,
          intent,
        })

        // Auto-apply if requested
        if (autoApply && suggestedTags.length > 0) {
          const { data: metadata } = await supabase
            .from('conversation_metadata')
            .select('tags')
            .eq('session_id', conversation.id)
            .eq('bot_id', conversation.bot_id)
            .single()

          const existingTags = metadata?.tags || []
          const newTags = Array.from(new Set([...existingTags, ...suggestedTags]))

          await supabase
            .from('conversation_metadata')
            .upsert({
              session_id: conversation.id,
              bot_id: conversation.bot_id,
              tags: newTags,
              updated_at: new Date().toISOString(),
            })

          tagged++
        }

        analyzed++
      } catch (error: any) {
        console.error(`Error analyzing conversation ${conversation.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      analyzed,
      tagged,
      total: conversations.length,
      results: autoApply ? undefined : results,
    })
  } catch (error: any) {
    console.error('Error batch auto-tagging:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to batch auto-tag' },
      { status: 500 }
    )
  }
}
