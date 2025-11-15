import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { executeWebhook, type BotAction } from '@/lib/action-executor'

/**
 * POST /api/bot-actions/test
 * Test an action with sample parameters
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { actionId, parameters } = await request.json()

    if (!actionId) {
      return NextResponse.json({ error: 'Action ID is required' }, { status: 400 })
    }

    // Fetch the action
    const { data: action, error: actionError } = await supabase
      .from('bot_actions')
      .select('*, bots!inner(user_id)')
      .eq('id', actionId)
      .single()

    if (actionError || !action || action.bots.user_id !== user.id) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 })
    }

    // Execute the webhook
    const result = await executeWebhook(action as unknown as BotAction, parameters || {})

    // Log the test execution
    await supabase.from('action_logs').insert({
      action_id: actionId,
      bot_id: action.bot_id,
      session_id: 'test_' + Date.now(),
      status: result.success ? 'executed' : 'failed',
      request_payload: parameters,
      response_payload: result.response,
      http_status: result.httpStatus,
      error_message: result.error,
      execution_time_ms: result.executionTimeMs,
      executed_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: result.success,
      response: result.response,
      error: result.error,
      httpStatus: result.httpStatus,
      executionTimeMs: result.executionTimeMs,
    })
  } catch (error: any) {
    console.error('Error testing bot action:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to test bot action' },
      { status: 500 }
    )
  }
}
