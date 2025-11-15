import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const botId = params.id

    const supabase = createServerSupabaseClient()

    // Fetch bot with owner's remove_branding setting
    const { data: bot, error } = await supabase
      .from('bots')
      .select(`
        id,
        name,
        primary_color,
        welcome_message,
        placeholder_text,
        is_active,
        user_id
      `)
      .eq('id', botId)
      .eq('is_active', true)
      .single()

    if (error || !bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      )
    }

    // Get user's remove_branding setting
    const { data: user } = await supabase
      .from('users')
      .select('remove_branding')
      .eq('id', bot.user_id)
      .single()

    return NextResponse.json({
      id: bot.id,
      name: bot.name,
      primary_color: bot.primary_color,
      welcome_message: bot.welcome_message,
      placeholder_text: bot.placeholder_text,
      is_active: bot.is_active,
      remove_branding: user?.remove_branding || false,
    })
  } catch (error: any) {
    console.error('Error fetching bot config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
