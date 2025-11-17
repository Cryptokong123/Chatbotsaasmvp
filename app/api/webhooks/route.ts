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
