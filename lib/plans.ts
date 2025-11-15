/**
 * Plan Management System
 *
 * Handles user plans, features gates, and upgrades
 */

import { createServerSupabaseClient } from './supabase'

export type Plan = 'demo' | 'starter' | 'pro' | 'enterprise'

export interface PlanFeatures {
  name: string
  price: number // monthly price in USD (0 for demo)
  messagesPerMonth: number // -1 for unlimited
  maxBots: number // -1 for unlimited
  trainingDataMB: number
  maxPresetResponses: number // -1 for unlimited
  canEmbed: boolean
  canUseAPI: boolean
  removesBranding: boolean
  analytics: 'basic' | 'advanced' | 'custom'
  support: 'community' | 'email' | 'priority' | 'dedicated'
}

export const PLAN_FEATURES: Record<Plan, PlanFeatures> = {
  demo: {
    name: 'Demo',
    price: 0,
    messagesPerMonth: 0, // Preview only, no real messages
    maxBots: 3,
    trainingDataMB: 10,
    maxPresetResponses: 50,
    canEmbed: false, // 🔒 Cannot embed
    canUseAPI: false, // 🔒 Cannot use API
    removesBranding: false,
    analytics: 'basic',
    support: 'community',
  },
  starter: {
    name: 'Starter',
    price: 29,
    messagesPerMonth: 1000,
    maxBots: 3,
    trainingDataMB: 10,
    maxPresetResponses: 100,
    canEmbed: true, // ✅ Can embed
    canUseAPI: true, // ✅ Can use API
    removesBranding: true, // ✅ White-label
    analytics: 'advanced',
    support: 'email',
  },
  pro: {
    name: 'Pro',
    price: 99,
    messagesPerMonth: 10000,
    maxBots: -1, // unlimited
    trainingDataMB: 100,
    maxPresetResponses: -1, // unlimited
    canEmbed: true,
    canUseAPI: true,
    removesBranding: true,
    analytics: 'advanced',
    support: 'priority',
  },
  enterprise: {
    name: 'Enterprise',
    price: 0, // custom pricing
    messagesPerMonth: -1, // unlimited
    maxBots: -1, // unlimited
    trainingDataMB: -1, // unlimited
    maxPresetResponses: -1, // unlimited
    canEmbed: true,
    canUseAPI: true,
    removesBranding: true,
    analytics: 'custom',
    support: 'dedicated',
  },
}

/**
 * Get user's plan
 */
export async function getUserPlan(userId: string): Promise<Plan> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('users')
    .select('plan')
    .eq('id', userId)
    .single()

  if (error || !data) return 'demo'

  return (data.plan as Plan) || 'demo'
}

/**
 * Check if user can access a feature
 */
export async function canAccessFeature(
  userId: string,
  feature: keyof PlanFeatures
): Promise<boolean> {
  const plan = await getUserPlan(userId)
  const features = PLAN_FEATURES[plan]

  return Boolean(features[feature])
}

/**
 * Check if user can embed bots
 */
export async function canEmbed(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId)
  return PLAN_FEATURES[plan].canEmbed
}

/**
 * Check if user can use API
 */
export async function canUseAPI(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId)
  return PLAN_FEATURES[plan].canUseAPI
}

/**
 * Check if user has white-label (branding removed)
 */
export async function hasWhiteLabel(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId)
  return PLAN_FEATURES[plan].removesBranding
}

/**
 * Get plan limits for a user
 */
export async function getPlanLimits(userId: string) {
  const plan = await getUserPlan(userId)
  const features = PLAN_FEATURES[plan]

  return {
    plan,
    features,
    limits: {
      messages: features.messagesPerMonth,
      bots: features.maxBots,
      trainingDataMB: features.trainingDataMB,
      presetResponses: features.maxPresetResponses,
    },
  }
}

/**
 * Check if user can create more bots
 */
export async function canCreateBot(userId: string): Promise<{
  allowed: boolean
  current: number
  limit: number
  reason?: string
}> {
  const supabase = createServerSupabaseClient()
  const plan = await getUserPlan(userId)
  const features = PLAN_FEATURES[plan]

  const { count } = await supabase
    .from('bots')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const current = count || 0
  const limit = features.maxBots

  if (limit === -1) {
    return { allowed: true, current, limit: -1 }
  }

  const allowed = current < limit

  return {
    allowed,
    current,
    limit,
    reason: allowed ? undefined : `You've reached your bot limit. Upgrade to create more.`,
  }
}

/**
 * Check if user can add more preset responses
 */
export async function canAddPresetResponse(
  userId: string,
  botId: string
): Promise<{
  allowed: boolean
  current: number
  limit: number
  reason?: string
}> {
  const supabase = createServerSupabaseClient()
  const plan = await getUserPlan(userId)
  const features = PLAN_FEATURES[plan]

  const { count } = await supabase
    .from('preset_responses')
    .select('*', { count: 'exact', head: true })
    .eq('bot_id', botId)

  const current = count || 0
  const limit = features.maxPresetResponses

  if (limit === -1) {
    return { allowed: true, current, limit: -1 }
  }

  const allowed = current < limit

  return {
    allowed,
    current,
    limit,
    reason: allowed ? undefined : `You've reached your preset response limit. Upgrade for more.`,
  }
}

/**
 * Upgrade user to a new plan
 */
export async function upgradePlan(userId: string, newPlan: Plan) {
  const supabase = createServerSupabaseClient()

  const { error } = await supabase
    .from('users')
    .update({
      plan: newPlan,
      remove_branding: PLAN_FEATURES[newPlan].removesBranding,
    })
    .eq('id', userId)

  if (error) throw error
}

/**
 * Get upgrade prompt message
 */
export function getUpgradeMessage(feature: string, recommendedPlan: Plan = 'starter'): string {
  const plan = PLAN_FEATURES[recommendedPlan]

  return `Upgrade to ${plan.name} ($${plan.price}/mo) to unlock ${feature}.`
}
