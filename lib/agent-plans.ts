/**
 * Agent Plan Management System
 *
 * Handles agent plans, pricing, bundles, and feature gates
 */

import { createServerSupabaseClient } from './supabase'

export type AgentPlan = 'agent_demo' | 'agent_starter' | 'agent_pro' | 'agent_enterprise'
export type BundlePlan = 'bundle_starter' | 'bundle_pro' | 'bundle_enterprise'
export type ProductType = 'chatbot' | 'agent' | 'bundle'

export interface AgentPlanFeatures {
  name: string
  price: number // monthly price in USD (0 for demo)
  agentsPerMonth: number // Number of agents that can be deployed (-1 for unlimited)
  messagesPerMonth: number // -1 for unlimited
  platformIntegrations: number // Number of platforms (WhatsApp, Telegram, etc.) (-1 for unlimited)
  maxAgents: number // -1 for unlimited
  concurrentConversations: number // -1 for unlimited
  // Platform Support
  canUseWhatsApp: boolean
  canUseTelegram: boolean
  canUseSlack: boolean
  canUseDiscord: boolean
  canUseTeams: boolean
  canUseFacebookMessenger: boolean
  canUseInstagram: boolean
  canUseTwitter: boolean
  canUseSMS: boolean
  canUseVoice: boolean
  canUseEmail: boolean
  // Advanced Features
  canUseAdvancedNLU: boolean
  canUseMultiLanguage: boolean
  canUseHandoffToHuman: boolean
  canUseSentimentAnalysis: boolean
  canUseABTesting: boolean
  canUseAdvancedAnalytics: boolean
  canUseCustomBranding: boolean
  canUseWhiteLabel: boolean
  canUseSSO: boolean
  canUseCustomDomain: boolean
  // Integrations
  maxWebhooks: number // -1 for unlimited
  maxAPIcalls: number // -1 for unlimited
  canUseCRMIntegration: boolean
  canUseCalendarIntegration: boolean
  canUseTicketingIntegration: boolean
  // Support
  analytics: 'basic' | 'advanced' | 'custom'
  support: 'community' | 'email' | 'priority' | 'dedicated'
  sla: string
  uptime: string
}

export interface BundlePlanFeatures {
  name: string
  price: number
  discount: number // percentage discount vs buying separately
  // Chatbot Features (inherited from chatbot plan)
  maxBots: number
  trainingDataMB: number
  maxPresetResponses: number
  canEmbedBot: boolean
  // Agent Features (inherited from agent plan)
  maxAgents: number
  platformIntegrations: number
  concurrentConversations: number
  // Combined Features
  messagesPerMonth: number
  maxActions: number
  maxActionCalls: number
  // Advanced Bundle Features
  canShareKnowledgeBase: boolean // Bots and agents share same knowledge
  canTransferConversations: boolean // Transfer from bot to agent
  unifiedAnalytics: boolean
  unifiedInbox: boolean
  // Premium Features
  removesBranding: boolean
  canUseSSO: boolean
  canUseAdvancedAnalytics: boolean
  prioritySupport: boolean
  dedicatedAccountManager: boolean
  analytics: 'basic' | 'advanced' | 'custom'
  support: 'community' | 'email' | 'priority' | 'dedicated'
}

export const AGENT_PLAN_FEATURES: Record<AgentPlan, AgentPlanFeatures> = {
  agent_demo: {
    name: 'Agent Demo',
    price: 0,
    agentsPerMonth: 1,
    messagesPerMonth: 100, // Limited messages for testing
    platformIntegrations: 1, // Can test one platform
    maxAgents: 1,
    concurrentConversations: 5,
    // Platform Support - Limited
    canUseWhatsApp: false,
    canUseTelegram: true, // ✅ Easiest to test
    canUseSlack: false,
    canUseDiscord: false,
    canUseTeams: false,
    canUseFacebookMessenger: false,
    canUseInstagram: false,
    canUseTwitter: false,
    canUseSMS: false,
    canUseVoice: false,
    canUseEmail: false,
    // Advanced Features
    canUseAdvancedNLU: false,
    canUseMultiLanguage: false,
    canUseHandoffToHuman: false,
    canUseSentimentAnalysis: false,
    canUseABTesting: false,
    canUseAdvancedAnalytics: false,
    canUseCustomBranding: false,
    canUseWhiteLabel: false,
    canUseSSO: false,
    canUseCustomDomain: false,
    // Integrations
    maxWebhooks: 1,
    maxAPIcalls: 100,
    canUseCRMIntegration: false,
    canUseCalendarIntegration: false,
    canUseTicketingIntegration: false,
    // Support
    analytics: 'basic',
    support: 'community',
    sla: 'None',
    uptime: 'Best effort',
  },
  agent_starter: {
    name: 'Agent Starter',
    price: 49,
    agentsPerMonth: 3,
    messagesPerMonth: 5000,
    platformIntegrations: 3,
    maxAgents: 3,
    concurrentConversations: 50,
    // Platform Support
    canUseWhatsApp: true,
    canUseTelegram: true,
    canUseSlack: true,
    canUseDiscord: true,
    canUseTeams: false,
    canUseFacebookMessenger: true,
    canUseInstagram: false,
    canUseTwitter: false,
    canUseSMS: true,
    canUseVoice: false,
    canUseEmail: true,
    // Advanced Features
    canUseAdvancedNLU: true,
    canUseMultiLanguage: true,
    canUseHandoffToHuman: true,
    canUseSentimentAnalysis: false,
    canUseABTesting: false,
    canUseAdvancedAnalytics: false,
    canUseCustomBranding: true,
    canUseWhiteLabel: false,
    canUseSSO: false,
    canUseCustomDomain: false,
    // Integrations
    maxWebhooks: 5,
    maxAPIcalls: 5000,
    canUseCRMIntegration: true,
    canUseCalendarIntegration: true,
    canUseTicketingIntegration: false,
    // Support
    analytics: 'advanced',
    support: 'email',
    sla: '24 hours',
    uptime: '99.5%',
  },
  agent_pro: {
    name: 'Agent Pro',
    price: 149,
    agentsPerMonth: -1, // unlimited
    messagesPerMonth: 50000,
    platformIntegrations: -1, // all platforms
    maxAgents: -1, // unlimited
    concurrentConversations: 500,
    // Platform Support - All enabled
    canUseWhatsApp: true,
    canUseTelegram: true,
    canUseSlack: true,
    canUseDiscord: true,
    canUseTeams: true,
    canUseFacebookMessenger: true,
    canUseInstagram: true,
    canUseTwitter: true,
    canUseSMS: true,
    canUseVoice: true,
    canUseEmail: true,
    // Advanced Features - All enabled
    canUseAdvancedNLU: true,
    canUseMultiLanguage: true,
    canUseHandoffToHuman: true,
    canUseSentimentAnalysis: true,
    canUseABTesting: true,
    canUseAdvancedAnalytics: true,
    canUseCustomBranding: true,
    canUseWhiteLabel: true,
    canUseSSO: false,
    canUseCustomDomain: true,
    // Integrations
    maxWebhooks: 25,
    maxAPIcalls: 50000,
    canUseCRMIntegration: true,
    canUseCalendarIntegration: true,
    canUseTicketingIntegration: true,
    // Support
    analytics: 'advanced',
    support: 'priority',
    sla: '4 hours',
    uptime: '99.9%',
  },
  agent_enterprise: {
    name: 'Agent Enterprise',
    price: 0, // custom pricing
    agentsPerMonth: -1,
    messagesPerMonth: -1,
    platformIntegrations: -1,
    maxAgents: -1,
    concurrentConversations: -1,
    // Platform Support - All enabled
    canUseWhatsApp: true,
    canUseTelegram: true,
    canUseSlack: true,
    canUseDiscord: true,
    canUseTeams: true,
    canUseFacebookMessenger: true,
    canUseInstagram: true,
    canUseTwitter: true,
    canUseSMS: true,
    canUseVoice: true,
    canUseEmail: true,
    // Advanced Features - All enabled
    canUseAdvancedNLU: true,
    canUseMultiLanguage: true,
    canUseHandoffToHuman: true,
    canUseSentimentAnalysis: true,
    canUseABTesting: true,
    canUseAdvancedAnalytics: true,
    canUseCustomBranding: true,
    canUseWhiteLabel: true,
    canUseSSO: true,
    canUseCustomDomain: true,
    // Integrations
    maxWebhooks: -1,
    maxAPIcalls: -1,
    canUseCRMIntegration: true,
    canUseCalendarIntegration: true,
    canUseTicketingIntegration: true,
    // Support
    analytics: 'custom',
    support: 'dedicated',
    sla: '1 hour',
    uptime: '99.99%',
  },
}

export const BUNDLE_PLAN_FEATURES: Record<BundlePlan, BundlePlanFeatures> = {
  bundle_starter: {
    name: 'Starter Bundle',
    price: 69, // $29 (chatbot) + $49 (agent) - $9 (13% discount)
    discount: 13,
    // Chatbot Features
    maxBots: 3,
    trainingDataMB: 10,
    maxPresetResponses: 100,
    canEmbedBot: true,
    // Agent Features
    maxAgents: 3,
    platformIntegrations: 3,
    concurrentConversations: 50,
    // Combined Features
    messagesPerMonth: 6000, // 1000 + 5000
    maxActions: 8, // 3 + 5
    maxActionCalls: 600, // 100 + 500
    // Advanced Bundle Features
    canShareKnowledgeBase: true,
    canTransferConversations: true,
    unifiedAnalytics: true,
    unifiedInbox: true,
    // Premium Features
    removesBranding: true,
    canUseSSO: false,
    canUseAdvancedAnalytics: false,
    prioritySupport: false,
    dedicatedAccountManager: false,
    analytics: 'advanced',
    support: 'email',
  },
  bundle_pro: {
    name: 'Pro Bundle',
    price: 219, // $99 (chatbot) + $149 (agent) - $29 (12% discount)
    discount: 12,
    // Chatbot Features
    maxBots: -1,
    trainingDataMB: 100,
    maxPresetResponses: -1,
    canEmbedBot: true,
    // Agent Features
    maxAgents: -1,
    platformIntegrations: -1,
    concurrentConversations: 500,
    // Combined Features
    messagesPerMonth: 60000, // 10000 + 50000
    maxActions: 35, // 10 + 25
    maxActionCalls: 51000, // 1000 + 50000
    // Advanced Bundle Features
    canShareKnowledgeBase: true,
    canTransferConversations: true,
    unifiedAnalytics: true,
    unifiedInbox: true,
    // Premium Features
    removesBranding: true,
    canUseSSO: false,
    canUseAdvancedAnalytics: true,
    prioritySupport: true,
    dedicatedAccountManager: false,
    analytics: 'advanced',
    support: 'priority',
  },
  bundle_enterprise: {
    name: 'Enterprise Bundle',
    price: 0, // custom pricing
    discount: 20, // Typical 20% discount
    // Chatbot Features
    maxBots: -1,
    trainingDataMB: -1,
    maxPresetResponses: -1,
    canEmbedBot: true,
    // Agent Features
    maxAgents: -1,
    platformIntegrations: -1,
    concurrentConversations: -1,
    // Combined Features
    messagesPerMonth: -1,
    maxActions: -1,
    maxActionCalls: -1,
    // Advanced Bundle Features
    canShareKnowledgeBase: true,
    canTransferConversations: true,
    unifiedAnalytics: true,
    unifiedInbox: true,
    // Premium Features
    removesBranding: true,
    canUseSSO: true,
    canUseAdvancedAnalytics: true,
    prioritySupport: true,
    dedicatedAccountManager: true,
    analytics: 'custom',
    support: 'dedicated',
  },
}

/**
 * Get user's agent plan
 */
export async function getUserAgentPlan(userId: string): Promise<AgentPlan> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('users')
    .select('agent_plan')
    .eq('id', userId)
    .single()

  if (error || !data) return 'agent_demo'

  return (data.agent_plan as AgentPlan) || 'agent_demo'
}

/**
 * Get user's bundle plan
 */
export async function getUserBundlePlan(userId: string): Promise<BundlePlan | null> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('users')
    .select('bundle_plan')
    .eq('id', userId)
    .single()

  if (error || !data || !data.bundle_plan) return null

  return data.bundle_plan as BundlePlan
}

/**
 * Check if user can use a specific platform
 */
export async function canUsePlatform(
  userId: string,
  platform: 'whatsapp' | 'telegram' | 'slack' | 'discord' | 'teams' | 'messenger' | 'instagram' | 'twitter' | 'sms' | 'voice' | 'email'
): Promise<boolean> {
  const agentPlan = await getUserAgentPlan(userId)
  const features = AGENT_PLAN_FEATURES[agentPlan]

  const platformMap = {
    whatsapp: features.canUseWhatsApp,
    telegram: features.canUseTelegram,
    slack: features.canUseSlack,
    discord: features.canUseDiscord,
    teams: features.canUseTeams,
    messenger: features.canUseFacebookMessenger,
    instagram: features.canUseInstagram,
    twitter: features.canUseTwitter,
    sms: features.canUseSMS,
    voice: features.canUseVoice,
    email: features.canUseEmail,
  }

  return platformMap[platform] || false
}

/**
 * Check if user can create more agents
 */
export async function canCreateAgent(userId: string): Promise<{
  allowed: boolean
  current: number
  limit: number
  reason?: string
}> {
  const supabase = createServerSupabaseClient()
  const agentPlan = await getUserAgentPlan(userId)
  const features = AGENT_PLAN_FEATURES[agentPlan]

  const { count } = await supabase
    .from('agents')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const current = count || 0
  const limit = features.maxAgents

  if (limit === -1) {
    return { allowed: true, current, limit: -1 }
  }

  const allowed = current < limit

  return {
    allowed,
    current,
    limit,
    reason: allowed ? undefined : `You've reached your agent limit. Upgrade to create more agents.`,
  }
}

/**
 * Get upgrade message for agents
 */
export function getAgentUpgradeMessage(feature: string, recommendedPlan: AgentPlan = 'agent_starter'): string {
  const plan = AGENT_PLAN_FEATURES[recommendedPlan]

  if (plan.price === 0) {
    return `Upgrade to ${plan.name} for ${feature}. Contact sales for custom pricing.`
  }

  return `Upgrade to ${plan.name} ($${plan.price}/mo) to unlock ${feature}.`
}

/**
 * Get bundle savings message
 */
export function getBundleSavingsMessage(bundlePlan: BundlePlan): string {
  const bundle = BUNDLE_PLAN_FEATURES[bundlePlan]

  if (bundle.price === 0) {
    return `Save ${bundle.discount}% with Enterprise Bundle. Contact sales for custom pricing.`
  }

  return `Save ${bundle.discount}% by bundling chatbots + agents for only $${bundle.price}/mo!`
}

// Export plan arrays for pricing pages
export const agentPlans = Object.entries(AGENT_PLAN_FEATURES).map(([id, features]) => ({
  id: id as AgentPlan,
  ...features,
}))

export const bundlePlans = Object.entries(BUNDLE_PLAN_FEATURES).map(([id, features]) => ({
  id: id as BundlePlan,
  ...features,
}))
