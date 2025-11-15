/**
 * Database Diagnostics Endpoint
 *
 * Provides database statistics and health metrics
 * Requires authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      tables: {},
      performance: {},
      issues: [],
    }

    // Get table sizes and row counts
    const tables = [
      'bots',
      'conversations',
      'messages',
      'training_data',
      'conversation_ratings',
      'webhooks',
      'quick_replies',
      'error_logs',
    ]

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (error) {
          diagnostics.issues.push({
            table,
            issue: 'query_failed',
            error: error.message,
          })
        } else {
          diagnostics.tables[table] = {
            rowCount: count || 0,
            status: 'ok',
          }
        }
      } catch (error: any) {
        diagnostics.issues.push({
          table,
          issue: 'table_missing_or_inaccessible',
          error: error.message,
        })
      }
    }

    // Check for orphaned data
    try {
      // Messages without conversations
      const { count: orphanedMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .not('session_id', 'in', `(SELECT session_id FROM conversations)`)

      if (orphanedMessages && orphanedMessages > 0) {
        diagnostics.issues.push({
          type: 'orphaned_data',
          table: 'messages',
          count: orphanedMessages,
          description: 'Messages exist without corresponding conversations',
        })
      }
    } catch (error) {
      // Ignore if conversations table doesn't exist yet
    }

    // Check response time performance
    const perfStart = Date.now()
    await supabase.from('bots').select('id').limit(10)
    const perfTime = Date.now() - perfStart

    diagnostics.performance.simpleQueryTime = perfTime

    if (perfTime > 1000) {
      diagnostics.issues.push({
        type: 'slow_query',
        description: `Simple query took ${perfTime}ms (should be < 1000ms)`,
      })
    }

    // Get user's bot and conversation counts
    const { data: userBots } = await supabase
      .from('bots')
      .select('id')
      .eq('user_id', user.id)

    const botIds = userBots?.map((b) => b.id) || []

    diagnostics.user = {
      id: user.id,
      email: user.email,
      botCount: botIds.length,
    }

    if (botIds.length > 0) {
      const { count: convCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .in('bot_id', botIds)

      const { count: msgCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('bot_id', botIds)

      diagnostics.user.conversationCount = convCount || 0
      diagnostics.user.messageCount = msgCount || 0
    }

    // Overall health assessment
    diagnostics.health =
      diagnostics.issues.length === 0 ? 'healthy' : diagnostics.issues.length < 3 ? 'warning' : 'critical'

    return NextResponse.json(diagnostics)
  } catch (error: any) {
    console.error('Database diagnostics error:', error)
    return NextResponse.json(
      {
        error: 'Failed to run diagnostics',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
