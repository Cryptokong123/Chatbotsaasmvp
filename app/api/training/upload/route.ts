import { NextRequest, NextResponse } from 'next/server'
import { processTrainingData } from '@/lib/rag'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { botId, content, sourceType, sourceName } = await request.json()

    if (!botId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Verify bot exists and user has access (done via RLS)
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('id')
      .eq('id', botId)
      .single()

    if (botError || !bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      )
    }

    // Process and store training data with embeddings
    await processTrainingData(
      botId,
      content,
      sourceType || 'text',
      sourceName
    )

    return NextResponse.json({
      success: true,
      message: 'Training data uploaded successfully',
    })
  } catch (error: any) {
    console.error('Error uploading training data:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
