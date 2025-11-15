/**
 * Client-side Error Logging Endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const errorData = await request.json()

    // Log to console on server
    console.error('[Client Error]', {
      userId: user?.id,
      timestamp: errorData.timestamp,
      level: errorData.level,
      message: errorData.message,
      url: errorData.url,
      userAgent: errorData.userAgent,
      error: errorData.error,
      context: errorData.context,
    })

    // In production, you might want to:
    // 1. Store errors in a dedicated errors table in Supabase
    // 2. Send to external logging service (Sentry, LogRocket, etc.)
    // 3. Alert on critical errors

    // Store in Supabase (optional - requires creating error_logs table)
    try {
      await supabase.from('error_logs').insert({
        user_id: user?.id,
        level: errorData.level,
        message: errorData.message,
        error_name: errorData.error?.name,
        error_message: errorData.error?.message,
        error_stack: errorData.error?.stack,
        url: errorData.url,
        user_agent: errorData.userAgent,
        context: errorData.context,
        created_at: errorData.timestamp,
      })
    } catch (e) {
      // Table might not exist yet - that's okay
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in error logging endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to log error' },
      { status: 500 }
    )
  }
}
