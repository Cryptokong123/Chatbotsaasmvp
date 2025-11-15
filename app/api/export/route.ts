import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

/**
 * Export all user data (GDPR compliance)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all user data
    const [bots, trainingData, messages, usageStats] = await Promise.all([
      supabase.from('bots').select('*').eq('user_id', user.id),
      supabase.from('training_data').select('*, bots!inner(user_id)').eq('bots.user_id', user.id),
      supabase.from('messages').select('*, bots!inner(user_id)').eq('bots.user_id', user.id),
      supabase.from('usage_stats').select('*').eq('user_id', user.id),
    ])

    const exportData = {
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      bots: bots.data || [],
      training_data: trainingData.data || [],
      messages: messages.data || [],
      usage_stats: usageStats.data || [],
      exported_at: new Date().toISOString(),
    }

    // Return as JSON download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="chatforge-data-${user.id}.json"`,
      },
    })
  } catch (error: any) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export data' },
      { status: 500 }
    )
  }
}
