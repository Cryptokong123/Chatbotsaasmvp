import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

/**
 * Export analytics data as CSV for Excel
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'conversations'
    const botId = searchParams.get('botId')
    const period = searchParams.get('period') || '30d'

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    if (period === '7d') {
      startDate.setDate(now.getDate() - 7)
    } else if (period === '30d') {
      startDate.setDate(now.getDate() - 30)
    } else if (period === '90d') {
      startDate.setDate(now.getDate() - 90)
    } else {
      startDate = new Date(0) // All time
    }

    let csvContent = ''
    let filename = ''

    switch (type) {
      case 'conversations': {
        // Export conversations with message counts
        let query = supabase
          .from('messages')
          .select('session_id, bot_id, created_at, bots!inner(name, user_id)')
          .eq('bots.user_id', user.id)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })

        if (botId && botId !== 'all') {
          query = query.eq('bot_id', botId)
        }

        const { data: messages, error } = await query

        if (error) throw error

        // Group by session_id to get conversations
        const conversationMap = new Map()
        messages?.forEach((msg: any) => {
          const sessionId = msg.session_id
          if (!conversationMap.has(sessionId)) {
            conversationMap.set(sessionId, {
              session_id: sessionId,
              bot_name: msg.bots.name,
              started_at: msg.created_at,
              message_count: 0,
            })
          }
          conversationMap.get(sessionId).message_count++
        })

        const conversations = Array.from(conversationMap.values())

        // Generate CSV
        csvContent = 'Session ID,Bot Name,Started At,Message Count\n'
        conversations.forEach((conv) => {
          csvContent += `"${conv.session_id}","${conv.bot_name}","${new Date(
            conv.started_at
          ).toLocaleString()}",${conv.message_count}\n`
        })

        filename = `conversations-${period}-${Date.now()}.csv`
        break
      }

      case 'messages': {
        // Export all messages
        let query = supabase
          .from('messages')
          .select('session_id, role, content, created_at, bots!inner(name, user_id)')
          .eq('bots.user_id', user.id)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false })
          .limit(5000) // Limit to prevent huge exports

        if (botId && botId !== 'all') {
          query = query.eq('bot_id', botId)
        }

        const { data: messages, error } = await query

        if (error) throw error

        // Generate CSV
        csvContent = 'Bot Name,Session ID,Role,Message,Timestamp\n'
        messages?.forEach((msg: any) => {
          const content = msg.content.replace(/"/g, '""') // Escape quotes
          csvContent += `"${msg.bots.name}","${msg.session_id}","${msg.role}","${content}","${new Date(
            msg.created_at
          ).toLocaleString()}"\n`
        })

        filename = `messages-${period}-${Date.now()}.csv`
        break
      }

      case 'bot-performance': {
        // Export bot performance metrics
        const { data: bots, error: botsError } = await supabase
          .from('bots')
          .select('id, name')
          .eq('user_id', user.id)

        if (botsError) throw botsError

        const performanceData = []

        for (const bot of bots || []) {
          const { count: messageCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('bot_id', bot.id)
            .gte('created_at', startDate.toISOString())

          const { data: sessions } = await supabase
            .from('messages')
            .select('session_id')
            .eq('bot_id', bot.id)
            .gte('created_at', startDate.toISOString())

          const uniqueSessions = new Set(sessions?.map((s) => s.session_id) || []).size

          performanceData.push({
            bot_name: bot.name,
            total_messages: messageCount || 0,
            total_conversations: uniqueSessions,
            avg_messages_per_conversation:
              uniqueSessions > 0 ? ((messageCount || 0) / uniqueSessions).toFixed(1) : '0',
          })
        }

        // Generate CSV
        csvContent = 'Bot Name,Total Messages,Total Conversations,Avg Messages per Conversation\n'
        performanceData.forEach((data) => {
          csvContent += `"${data.bot_name}",${data.total_messages},${data.total_conversations},${data.avg_messages_per_conversation}\n`
        })

        filename = `bot-performance-${period}-${Date.now()}.csv`
        break
      }

      case 'training-data': {
        // Export training data
        let query = supabase
          .from('training_data')
          .select('content, source_type, source_name, created_at, bots!inner(name, user_id)')
          .eq('bots.user_id', user.id)
          .order('created_at', { ascending: false })

        if (botId && botId !== 'all') {
          query = query.eq('bot_id', botId)
        }

        const { data: trainingData, error } = await query

        if (error) throw error

        // Generate CSV
        csvContent = 'Bot Name,Source Name,Source Type,Content,Created At\n'
        trainingData?.forEach((data: any) => {
          const content = data.content.replace(/"/g, '""').substring(0, 500) // Truncate and escape
          csvContent += `"${data.bots.name}","${data.source_name || 'N/A'}","${data.source_type}","${content}","${new Date(
            data.created_at
          ).toLocaleString()}"\n`
        })

        filename = `training-data-${Date.now()}.csv`
        break
      }

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
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
