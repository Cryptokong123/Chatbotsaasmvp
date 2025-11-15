import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { analyzeSentiment, getConversationSentiment } from '@/lib/sentiment-analysis'

// Analyze sentiment for a specific conversation
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

    const { conversationId } = await request.json()

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, bot_id, bots!inner(user_id)')
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
      .select('id, content, is_bot')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (messagesError) throw messagesError

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'No messages found in conversation' },
        { status: 404 }
      )
    }

    // Analyze sentiment for each message
    const sentimentResults = []

    for (const message of messages) {
      const sentiment = analyzeSentiment(message.content)

      // Update message with sentiment
      await supabase
        .from('messages')
        .update({
          sentiment_score: sentiment.score,
          sentiment_label: sentiment.label,
          emotions: sentiment.emotions,
        })
        .eq('id', message.id)

      sentimentResults.push({
        messageId: message.id,
        sentiment,
      })
    }

    // Calculate overall conversation sentiment
    const conversationSentiment = getConversationSentiment(
      sentimentResults.map(r => r.sentiment)
    )

    // Update conversation with overall sentiment
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        sentiment_score: conversationSentiment.score,
        sentiment_label: conversationSentiment.label,
        sentiment_analyzed_at: new Date().toISOString(),
      })
      .eq('id', conversationId)

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      conversationSentiment,
      messageSentiments: sentimentResults,
      totalMessages: messages.length,
    })
  } catch (error: any) {
    console.error('Error analyzing sentiment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to analyze sentiment' },
      { status: 500 }
    )
  }
}

// Batch analyze sentiment for multiple conversations
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

    const { botId, limit = 100 } = await request.json()

    // Get conversations to analyze
    let query = supabase
      .from('conversations')
      .select('id, bot_id, bots!inner(user_id)')
      .eq('bots.user_id', user.id)
      .is('sentiment_analyzed_at', null)
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
    const errors = []

    // Analyze each conversation
    for (const conversation of conversations) {
      try {
        // Get messages
        const { data: messages } = await supabase
          .from('messages')
          .select('id, content')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true })

        if (!messages || messages.length === 0) continue

        // Analyze sentiment for each message
        const sentimentResults = []

        for (const message of messages) {
          const sentiment = analyzeSentiment(message.content)

          await supabase
            .from('messages')
            .update({
              sentiment_score: sentiment.score,
              sentiment_label: sentiment.label,
              emotions: sentiment.emotions,
            })
            .eq('id', message.id)

          sentimentResults.push(sentiment)
        }

        // Update conversation
        const conversationSentiment = getConversationSentiment(sentimentResults)

        await supabase
          .from('conversations')
          .update({
            sentiment_score: conversationSentiment.score,
            sentiment_label: conversationSentiment.label,
            sentiment_analyzed_at: new Date().toISOString(),
          })
          .eq('id', conversation.id)

        analyzed++
      } catch (error: any) {
        errors.push({
          conversationId: conversation.id,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      analyzed,
      total: conversations.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('Error batch analyzing sentiment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to batch analyze sentiment' },
      { status: 500 }
    )
  }
}
