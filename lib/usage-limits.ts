/**
 * Usage Limits Enforcement
 *
 * Check if user has exceeded their plan limits
 */

import { createServerSupabaseClient } from './supabase'
import { getUserUsage } from './analytics'

export interface UsageLimits {
  messages: number
  bots: number
  trainingDataMB: number
}

export const PLAN_LIMITS: Record<string, UsageLimits> = {
  free: {
    messages: 100,
    bots: 1,
    trainingDataMB: 1,
  },
  starter: {
    messages: 1000,
    bots: 3,
    trainingDataMB: 10,
  },
  pro: {
    messages: 10000,
    bots: -1, // unlimited
    trainingDataMB: 100,
  },
}

export async function checkMessageLimit(userId: string): Promise<{
  allowed: boolean
  usage: number
  limit: number
}> {
  const usage = await getUserUsage(userId, 'month')
  const plan = 'free' // TODO: Get actual plan from user
  const limits = PLAN_LIMITS[plan]

  return {
    allowed: !usage || usage.messages < limits.messages,
    usage: usage?.messages || 0,
    limit: limits.messages,
  }
}

export async function checkBotLimit(userId: string): Promise<{
  allowed: boolean
  usage: number
  limit: number
}> {
  const supabase = createServerSupabaseClient()

  const { count } = await supabase
    .from('bots')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const plan = 'free' // TODO: Get actual plan from user
  const limits = PLAN_LIMITS[plan]

  return {
    allowed: limits.bots === -1 || (count || 0) < limits.bots,
    usage: count || 0,
    limit: limits.bots,
  }
}

export async function enforceMessageLimit(userId: string) {
  const result = await checkMessageLimit(userId)

  if (!result.allowed) {
    throw new Error(
      `Message limit exceeded. You've used ${result.usage}/${result.limit} messages this month.`
    )
  }
}

export async function enforceBotLimit(userId: string) {
  const result = await checkBotLimit(userId)

  if (!result.allowed) {
    throw new Error(
      `Bot limit exceeded. You have ${result.usage} bots. Upgrade to create more.`
    )
  }
}
