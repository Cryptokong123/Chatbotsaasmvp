import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const botId = params.id

    const supabase = createServerSupabaseClient()

    const { data: bot, error } = await supabase
      .from('bots')
      .select('id, name, primary_color, welcome_message, placeholder_text, is_active')
      .eq('id', botId)
      .eq('is_active', true)
      .single()

    if (error || !bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(bot)
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
