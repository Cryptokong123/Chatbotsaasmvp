import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { createApiError } from '@/lib/api-errors'

// GET - Fetch notification preferences
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      const { response, status } = createApiError('UNAUTHORIZED')
      return NextResponse.json(response, { status })
    }

    // Get or create preferences
    let { data: prefs, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Create default preferences if they don't exist
    if (error && error.code === 'PGRST116') {
      const { data: newPrefs, error: insertError } = await supabase
        .from('notification_preferences')
        .insert({ user_id: user.id })
        .select()
        .single()

      if (insertError) throw insertError
      prefs = newPrefs
    } else if (error) {
      throw error
    }

    return NextResponse.json({ preferences: prefs })
  } catch (error: any) {
    console.error('Error fetching notification preferences:', error)
    const { response, status } = createApiError('INTERNAL_ERROR', {
      errorMessage: error.message,
    })
    return NextResponse.json(response, { status })
  }
}

// PATCH - Update notification preferences
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      const { response, status } = createApiError('UNAUTHORIZED')
      return NextResponse.json(response, { status })
    }

    const body = await request.json()

    // Validate allowed fields
    const allowedFields = [
      'email_enabled',
      'new_conversation_enabled',
      'negative_rating_enabled',
      'bot_offline_enabled',
      'daily_summary_enabled',
      'weekly_report_enabled',
      'team_mention_enabled',
      'assignment_enabled',
    ]

    const updates: Record<string, any> = {}
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key) && typeof value === 'boolean') {
        updates[key] = value
      }
    }

    if (Object.keys(updates).length === 0) {
      const { response, status } = createApiError('MISSING_REQUIRED_FIELDS', {
        message: 'No valid fields to update',
      })
      return NextResponse.json(response, { status })
    }

    // Update preferences
    const { data: prefs, error } = await supabase
      .from('notification_preferences')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      preferences: prefs,
      message: 'Notification preferences updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating notification preferences:', error)
    const { response, status } = createApiError('INTERNAL_ERROR', {
      errorMessage: error.message,
    })
    return NextResponse.json(response, { status })
  }
}
