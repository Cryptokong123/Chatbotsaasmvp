import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

/**
 * GET /api/conversations/export
 * Export conversations as CSV or JSON
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const botId = searchParams.get('botId')
    const format = searchParams.get('format') || 'csv' // csv or json
    const sessionId = searchParams.get('sessionId') // Optional: export single session
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!botId) {
      return NextResponse.json({ error: 'Bot ID is required' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Verify user owns this bot
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('id, user_id, name')
      .eq('id', botId)
      .single()

    if (botError || !bot || bot.user_id !== user.id) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
    }

    // Build query
    let query = supabase
      .from('messages')
      .select('*')
      .eq('bot_id', botId)
      .order('created_at', { ascending: true })

    if (sessionId) {
      query = query.eq('session_id', sessionId)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data: messages, error } = await query

    if (error) throw error

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'No messages found' }, { status: 404 })
    }

    // Export as CSV
    if (format === 'csv') {
      const csvRows = [
        ['Session ID', 'Role', 'Message', 'Timestamp', 'Metadata'].join(','),
      ]

      messages.forEach((msg) => {
        const row = [
          msg.session_id,
          msg.role,
          `"${msg.content.replace(/"/g, '""')}"`, // Escape quotes
          msg.created_at,
          msg.metadata ? `"${JSON.stringify(msg.metadata).replace(/"/g, '""')}"` : '',
        ].join(',')
        csvRows.push(row)
      })

      const csv = csvRows.join('\n')
      const filename = sessionId
        ? `conversation-${sessionId}.csv`
        : `${bot.name}-conversations-${new Date().toISOString().split('T')[0]}.csv`

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    // Export as JSON
    if (format === 'json') {
      // Group by session for better structure
      const sessions = new Map<string, any[]>()

      messages.forEach((msg) => {
        if (!sessions.has(msg.session_id)) {
          sessions.set(msg.session_id, [])
        }
        sessions.get(msg.session_id)!.push({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.created_at,
          metadata: msg.metadata,
        })
      })

      const exportData = {
        bot_name: bot.name,
        bot_id: botId,
        export_date: new Date().toISOString(),
        total_messages: messages.length,
        total_sessions: sessions.size,
        conversations: Array.from(sessions.entries()).map(([sessionId, msgs]) => ({
          session_id: sessionId,
          message_count: msgs.length,
          start_time: msgs[0]?.timestamp,
          end_time: msgs[msgs.length - 1]?.timestamp,
          messages: msgs,
        })),
      }

      const filename = sessionId
        ? `conversation-${sessionId}.json`
        : `${bot.name}-conversations-${new Date().toISOString().split('T')[0]}.json`

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  } catch (error: any) {
    console.error('Error exporting conversations:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export conversations' },
      { status: 500 }
    )
  }
}
