import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { TelegramAdapter } from '@/lib/platforms/adapters/telegram-adapter'
import { MessageRouter } from '@/lib/platforms/message-router'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * POST /api/webhooks/agents/[agentId]/[platform]
 * Receive incoming messages from platform webhooks
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { agentId: string; platform: string } }
) {
  const { agentId, platform } = params

  try {
    const supabase = createServerSupabaseClient()

    // Get agent and platform integration
    const { data: agent } = await supabase
      .from('agents')
      .select(`
        *,
        platform_integrations!inner (
          id,
          platform,
          credentials,
          config,
          webhook_secret,
          status,
          user_id
        )
      `)
      .eq('id', agentId)
      .eq('platform_integrations.platform', platform)
      .eq('is_active', true)
      .single()

    if (!agent || !agent.platform_integrations || agent.platform_integrations.length === 0) {
      return NextResponse.json({ error: 'Agent or platform not found' }, { status: 404 })
    }

    const platformIntegration = agent.platform_integrations[0]

    // Verify webhook signature if secret is set
    if (platformIntegration.webhook_secret) {
      const signature = request.headers.get('x-telegram-bot-api-secret-token') || ''
      if (signature !== platformIntegration.webhook_secret) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    // Parse webhook payload
    const payload = await request.json()

    // Initialize platform adapter
    let adapter
    if (platform === 'telegram') {
      adapter = new TelegramAdapter()
      await adapter.connect({
        telegram: platformIntegration.credentials,
      })
    } else {
      return NextResponse.json({ error: `Platform ${platform} not yet implemented` }, {
status: 400 })
    }

    // Parse incoming message
    const incomingMessage = await adapter.parseWebhookEvent(payload)

    // Check if this is a new conversation or existing one
    let conversation = await supabase
      .from('agent_conversations')
      .select('*')
      .eq('agent_id', agentId)
      .eq('platform_integration_id', platformIntegration.id)
      .eq('platform_user_id', incomingMessage.senderId)
      .eq('status', 'active')
      .single()

    // Create new conversation if doesn't exist
    if (!conversation.data) {
      const { data: newConversation } = await supabase
        .from('agent_conversations')
        .insert({
          agent_id: agentId,
          platform_integration_id: platformIntegration.id,
          user_id: platformIntegration.user_id,
          platform_user_id: incomingMessage.senderId,
          platform_user_name: incomingMessage.senderName,
          status: 'active',
        })
        .select()
        .single()

      conversation = { data: newConversation }
    }

    const conversationId = conversation.data?.id

    if (!conversationId) {
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }

    // Store incoming message
    await supabase.from('agent_messages').insert({
      conversation_id: conversationId,
      agent_id: agentId,
      user_id: platformIntegration.user_id,
      platform_message_id: incomingMessage.id,
      direction: 'incoming',
      sender_type: 'user',
      message_type: incomingMessage.messageType,
      content: incomingMessage.content,
      attachments: incomingMessage.attachments || [],
      metadata: incomingMessage.metadata || {},
    })

    // Get conversation history for context
    const { data: messages } = await supabase
      .from('agent_messages')
      .select('sender_type, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20)

    // Build conversation context for AI
    const conversationHistory = messages?.map((msg) => ({
      role: msg.sender_type === 'user' ? 'user' : 'assistant',
      content: msg.content,
    })) || []

    // Generate AI response
    const startTime = Date.now()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: agent.instructions || 'You are a helpful AI assistant.',
        },
        ...conversationHistory,
        {
          role: 'user',
          content: incomingMessage.content,
        },
      ],
      temperature: agent.personality === 'enthusiastic' ? 0.9 : agent.personality === 'formal' ? 0.3 : 0.7,
      max_tokens: agent.response_style === 'concise' ? 150 : agent.response_style === 'detailed' ? 500 : 300,
    })

    const processingTime = Date.now() - startTime
    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.'

    // Send AI response back to user
    await adapter.sendTypingIndicator(incomingMessage.senderId)

    const sentMessageId = await adapter.sendMessage({
      platform,
      recipientId: incomingMessage.senderId,
      content: aiResponse,
      messageType: 'text',
      timestamp: new Date(),
      direction: 'outgoing',
    })

    // Store outgoing message
    await supabase.from('agent_messages').insert({
      conversation_id: conversationId,
      agent_id: agentId,
      user_id: platformIntegration.user_id,
      platform_message_id: sentMessageId,
      direction: 'outgoing',
      sender_type: 'agent',
      message_type: 'text',
      content: aiResponse,
      processing_time_ms: processingTime,
      tokens_used: completion.usage?.total_tokens || 0,
      model_used: completion.model,
      delivery_status: 'sent',
    })

    // Log usage for billing
    await supabase.from('agent_usage_logs').insert({
      user_id: platformIntegration.user_id,
      agent_id: agentId,
      platform_integration_id: platformIntegration.id,
      conversation_id: conversationId,
      usage_type: 'message_sent',
      quantity: 1,
      unit: 'message',
      platform,
      metadata: {
        tokens: completion.usage?.total_tokens || 0,
        model: completion.model,
      },
    })

    return NextResponse.json({ success: true, messageId: sentMessageId })
  } catch (error: any) {
    console.error('Webhook error:', error)

    // Log error for debugging
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/webhooks/agents/[agentId]/[platform]
 * Verification endpoint for some platforms (like Facebook)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { agentId: string; platform: string } }
) {
  const { searchParams } = new URL(request.url)

  // Facebook/WhatsApp verification
  if (params.platform === 'whatsapp' || params.platform === 'messenger') {
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
      return new NextResponse(challenge, { status: 200 })
    }

    return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
  }

  return NextResponse.json({ platform: params.platform, status: 'ok' })
}
