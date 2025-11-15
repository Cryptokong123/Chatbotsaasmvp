import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { createWebhookSchema } from '@/lib/validations'

/**
 * Webhook Management API
 */

// List webhooks for a bot
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const botId = request.nextUrl.searchParams.get('botId')

    if (!botId) {
      return NextResponse.json({ error: 'Bot ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('bot_id', botId)

    if (error) throw error

    return NextResponse.json({ webhooks: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Create webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createWebhookSchema.parse(body)

    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from('webhooks')
      .insert(validated)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ webhook: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Delete webhook
export async function DELETE(request: NextRequest) {
  try {
    const webhookId = request.nextUrl.searchParams.get('id')

    if (!webhookId) {
      return NextResponse.json({ error: 'Webhook ID required' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    const { error } = await supabase.from('webhooks').delete().eq('id', webhookId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * Send webhook notification
 */
export async function sendWebhookNotification(
  botId: string,
  event: string,
  payload: any
) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: webhooks } = await supabase
      .from('webhooks')
      .select('*')
      .eq('bot_id', botId)
      .eq('is_active', true)
      .contains('events', [event])

    if (!webhooks || webhooks.length === 0) return

    // Send to all matching webhooks
    await Promise.all(
      webhooks.map(async (webhook) => {
        try {
          await fetch(webhook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(webhook.secret && { 'X-Webhook-Secret': webhook.secret }),
            },
            body: JSON.stringify({
              event,
              bot_id: botId,
              timestamp: new Date().toISOString(),
              data: payload,
            }),
          })
        } catch (error) {
          console.error(`Webhook delivery failed for ${webhook.url}:`, error)
        }
      })
    )
  } catch (error) {
    console.error('Webhook notification error:', error)
  }
}
