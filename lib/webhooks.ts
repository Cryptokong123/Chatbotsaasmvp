/**
 * Webhooks Service
 *
 * Handles webhook delivery for events in the system
 */

import crypto from 'crypto'

export interface WebhookEvent {
  event: string
  timestamp: string
  data: any
}

export interface WebhookConfig {
  id: string
  url: string
  secret?: string
  headers?: Record<string, string>
  timeout?: number
  retryCount?: number
}

/**
 * Send webhook to a single endpoint
 */
export async function sendWebhook(
  config: WebhookConfig,
  event: WebhookEvent
): Promise<{ success: boolean; status?: number; error?: string }> {
  try {
    const payload = JSON.stringify(event)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'ChatForge-Webhooks/1.0',
      ...config.headers,
    }

    // Add HMAC signature if secret is provided
    if (config.secret) {
      const signature = crypto
        .createHmac('sha256', config.secret)
        .update(payload)
        .digest('hex')
      headers['X-ChatForge-Signature'] = signature
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), (config.timeout || 30) * 1000)

    const response = await fetch(config.url, {
      method: 'POST',
      headers,
      body: payload,
      signal: controller.signal,
    })

    clearTimeout(timeout)

    return {
      success: response.ok,
      status: response.status,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Trigger webhooks for an event
 */
export async function triggerWebhooks(
  webhooks: WebhookConfig[],
  eventType: string,
  data: any
): Promise<void> {
  const event: WebhookEvent = {
    event: eventType,
    timestamp: new Date().toISOString(),
    data,
  }

  const promises = webhooks.map(async (webhook) => {
    let attempt = 0
    const maxAttempts = webhook.retryCount || 3

    while (attempt < maxAttempts) {
      attempt++
      const result = await sendWebhook(webhook, event)

      // Log delivery attempt (would save to database in production)
      console.log(`Webhook ${webhook.id} delivery attempt ${attempt}:`, result)

      if (result.success) {
        break
      }

      // Exponential backoff for retries
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }
  })

  await Promise.allSettled(promises)
}

/**
 * Available webhook events
 */
export const WEBHOOK_EVENTS = {
  // Conversation events
  CONVERSATION_CREATED: 'conversation.created',
  CONVERSATION_UPDATED: 'conversation.updated',
  CONVERSATION_RESOLVED: 'conversation.resolved',

  // Message events
  MESSAGE_RECEIVED: 'message.received',
  BOT_RESPONSE_SENT: 'bot.response.sent',

  // Tag events
  TAG_ADDED: 'tag.added',
  TAG_REMOVED: 'tag.removed',

  // Sentiment events
  SENTIMENT_ANALYZED: 'sentiment.analyzed',
  NEGATIVE_SENTIMENT_DETECTED: 'negative_sentiment.detected',

  // Assignment events
  CONVERSATION_ASSIGNED: 'conversation.assigned',
  CONVERSATION_UNASSIGNED: 'conversation.unassigned',

  // Escalation events
  ESCALATION_REQUIRED: 'escalation.required',
  ESCALATION_RESOLVED: 'escalation.resolved',

  // Rating events
  RATING_SUBMITTED: 'rating.submitted',
  NEGATIVE_RATING_RECEIVED: 'negative_rating.received',

  // Bot events
  BOT_CREATED: 'bot.created',
  BOT_UPDATED: 'bot.updated',
  BOT_DELETED: 'bot.deleted',

  // Training events
  TRAINING_DATA_ADDED: 'training.data_added',
  BOT_RETRAINED: 'bot.retrained',
} as const

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

/**
 * Format webhook event data
 */
export function formatWebhookEvent(eventType: string, data: any): WebhookEvent {
  return {
    event: eventType,
    timestamp: new Date().toISOString(),
    data: {
      ...data,
      _metadata: {
        version: '1.0',
        source: 'chatforge',
      },
    },
  }
}
