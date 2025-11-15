/**
 * Analytics Tracking
 *
 * Track important events and metrics
 */

import { createServerSupabaseClient } from './supabase'

export type AnalyticsEvent =
  | 'user.registered'
  | 'user.logged_in'
  | 'bot.created'
  | 'bot.updated'
  | 'bot.deleted'
  | 'training_data.uploaded'
  | 'message.sent'
  | 'message.received'
  | 'widget.embedded'
  | 'conversation.started'
  | 'conversation.ended'
  | 'error.occurred'

interface EventMetadata {
  [key: string]: any
}

/**
 * Track an analytics event
 */
export async function trackEvent(
  event: AnalyticsEvent,
  userId?: string,
  metadata?: EventMetadata
) {
  try {
    // In production, send to analytics service (PostHog, Mixpanel, etc.)
    // For now, we'll log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event, { userId, metadata })
    }

    // You can also store important events in the database
    if (userId) {
      const supabase = createServerSupabaseClient()
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: event,
        metadata: metadata || {},
      })
    }
  } catch (error) {
    // Don't let analytics errors crash the app
    console.error('Analytics error:', error)
  }
}

/**
 * Track page view
 */
export async function trackPageView(page: string, userId?: string) {
  await trackEvent('user.logged_in', userId, { page })
}

/**
 * Track conversion funnel
 */
export async function trackFunnelStep(
  step: 'signup' | 'create_bot' | 'add_training' | 'embed_widget',
  userId: string
) {
  await trackEvent('bot.created', userId, { funnelStep: step })
}

/**
 * Track errors
 */
export async function trackError(error: Error, context?: EventMetadata) {
  await trackEvent('error.occurred', undefined, {
    error: error.message,
    stack: error.stack,
    ...context,
  })
}

/**
 * Record usage stats in database
 */
export async function recordUsage(
  userId: string,
  botId: string | null,
  statType: 'message' | 'training_upload' | 'embedding',
  count: number = 1
) {
  try {
    const supabase = createServerSupabaseClient()
    const today = new Date().toISOString().split('T')[0]

    // Upsert usage stats
    const { error } = await supabase.from('usage_stats').insert({
      user_id: userId,
      bot_id: botId,
      stat_type: statType,
      count,
      date: today,
    })

    // If duplicate, update count
    if (error && error.code === '23505') {
      // Unique violation
      await supabase
        .from('usage_stats')
        .update({ count: supabase.sql`count + ${count}` })
        .match({ user_id: userId, bot_id: botId, stat_type: statType, date: today })
    }
  } catch (error) {
    console.error('Failed to record usage:', error)
  }
}

/**
 * Get usage summary for a user
 */
export async function getUserUsage(userId: string, period: 'day' | 'week' | 'month' = 'month') {
  const supabase = createServerSupabaseClient()

  const daysAgo = period === 'day' ? 1 : period === 'week' ? 7 : 30
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysAgo)

  const { data, error } = await supabase
    .from('usage_stats')
    .select('stat_type, count')
    .eq('user_id', userId)
    .gte('date', startDate.toISOString().split('T')[0])

  if (error) {
    console.error('Failed to get usage:', error)
    return null
  }

  const usage = {
    messages: 0,
    embeddings: 0,
    trainingUploads: 0,
  }

  data.forEach((stat) => {
    if (stat.stat_type === 'message') usage.messages += stat.count
    if (stat.stat_type === 'embedding') usage.embeddings += stat.count
    if (stat.stat_type === 'training_upload') usage.trainingUploads += stat.count
  })

  return usage
}
