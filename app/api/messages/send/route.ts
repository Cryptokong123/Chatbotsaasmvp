import { NextRequest, NextResponse } from 'next/server'
import { performRAGQuery } from '@/lib/rag'
import { createServerSupabaseClient } from '@/lib/supabase'
import { findMatchingPreset, type PresetResponse } from '@/lib/preset-matcher'
import { processWithActions } from '@/lib/action-executor'

export async function POST(request: NextRequest) {
  try {
    const { botId, message, sessionId, confirmAction } = await request.json()

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

    // Store user message
    await supabase.from('messages').insert({
      bot_id: botId,
      session_id: sessionId,
      role: 'user',
      content: message,
    })

    // 🎯 STEP 1: Check preset responses FIRST (saves AI costs!)
    const { data: presets } = await supabase
      .from('preset_responses')
      .select('*')
      .eq('bot_id', botId)
      .eq('is_active', true)

    const matchedPreset = presets ? findMatchingPreset(message, presets as PresetResponse[]) : null

    let response: string
    let context: any[] = []
    let usedPreset = false
    let actionExecuted = false
    let requiresConfirmation = false
    let confirmationData: any = null

    if (matchedPreset) {
      // ✅ Found a preset match - use it directly (no AI cost!)
      response = matchedPreset.answer
      usedPreset = true

      // Store assistant response (preset)
      await supabase.from('messages').insert({
        bot_id: botId,
        session_id: sessionId,
        role: 'assistant',
        content: response,
        metadata: {
          preset_id: matchedPreset.id,
          preset_used: true,
        },
      })
    } else {
      // ❌ No preset match - try actions or fall back to AI
      // Get conversation history for AI
      const { data: history } = await supabase
        .from('messages')
        .select('role, content')
        .eq('bot_id', botId)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(10)

      const conversationHistory = history || []

      // 🎯 STEP 2: Check if actions can handle this (function calling)
      const actionResult = await processWithActions(
        botId,
        message,
        conversationHistory as any,
        bot.instructions
      )

      if (actionResult.actionExecuted || actionResult.requiresConfirmation || actionResult.response) {
        // Action was executed or needs confirmation
        response = actionResult.response
        actionExecuted = actionResult.actionExecuted || false
        requiresConfirmation = actionResult.requiresConfirmation || false
        confirmationData = actionResult.confirmationData || null

        // Store assistant response (action)
        await supabase.from('messages').insert({
          bot_id: botId,
          session_id: sessionId,
          role: 'assistant',
          content: response,
          metadata: {
            action_executed: actionExecuted,
            requires_confirmation: requiresConfirmation,
            confirmation_data: confirmationData,
            preset_used: false,
          },
        })
      } else {
        // 🎯 STEP 3: Fall back to regular RAG query
        const ragResult = await performRAGQuery(
          botId,
          message,
          conversationHistory as any
        )

        response = ragResult.response
        context = ragResult.context

        // Store assistant response (AI)
        await supabase.from('messages').insert({
          bot_id: botId,
          session_id: sessionId,
          role: 'assistant',
          content: response,
          metadata: {
            context_used: context.length,
            preset_used: false,
            action_executed: false,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      response,
      context,
      usedPreset,
      actionExecuted,
      requiresConfirmation,
      confirmationData,
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
