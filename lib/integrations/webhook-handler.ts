/**
 * Webhook Handler Service
 *
 * Webhook receiver, signature verification, event routing, and retry logic
 */

import crypto from 'crypto'
import { EventEmitter } from 'events'
import { MessageQueue } from './message-queue'

// ============================================================================
// TYPES
// ============================================================================

export interface WebhookEvent {
  id: string
  webhookId?: string
  instanceId: string
  integrationType: string
  eventType: string
  eventId?: string
  signature?: string
  signatureVerified: boolean
  verificationError?: string
  requestHeaders: Record<string, string>
  requestBody: any
  requestMethod: string
  requestIp?: string
  status: 'received' | 'processing' | 'processed' | 'failed' | 'ignored'
  processingError?: string
  processedAt?: Date
  responseStatus?: number
  responseBody?: any
  processingTimeMs?: number
  retryCount: number
  maxRetries: number
  nextRetryAt?: Date
  receivedAt: Date
}

export interface WebhookConfig {
  url: string
  secret?: string
  verificationToken?: string
  subscribedEvents: string[]
  eventFilters?: Record<string, any>
  signatureHeader?: string
  signatureAlgorithm?: 'sha1' | 'sha256' | 'sha512'
}

export interface SignatureVerification {
  verified: boolean
  error?: string
}

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================

export class WebhookHandler extends EventEmitter {
  private messageQueue: MessageQueue
  private verificationStrategies: Map<
    string,
    (payload: string, signature: string, secret: string) => Promise<boolean>
  > = new Map()

  constructor(messageQueue: MessageQueue) {
    super()
    this.messageQueue = messageQueue

    // Register webhook processing queue
    this.messageQueue.registerProcessor('webhooks', this.processWebhookEvent.bind(this))

    // Register built-in verification strategies
    this.registerBuiltInStrategies()
  }

  // ============================================================================
  // WEBHOOK RECEIPT
  // ============================================================================

  /**
   * Receive and process webhook
   */
  async receiveWebhook(
    instanceId: string,
    integrationType: string,
    config: WebhookConfig,
    request: {
      method: string
      headers: Record<string, string>
      body: any
      ip?: string
    }
  ): Promise<WebhookEvent> {
    const event: WebhookEvent = {
      id: this.generateEventId(),
      instanceId,
      integrationType,
      eventType: this.extractEventType(request.body, integrationType),
      requestMethod: request.method,
      requestHeaders: request.headers,
      requestBody: request.body,
      requestIp: request.ip,
      signatureVerified: false,
      status: 'received',
      retryCount: 0,
      maxRetries: 3,
      receivedAt: new Date(),
    }

    // Extract signature if present
    if (config.signatureHeader) {
      event.signature = request.headers[config.signatureHeader.toLowerCase()]
    }

    // Verify signature if required
    if (config.secret && event.signature) {
      const verification = await this.verifySignature(
        integrationType,
        JSON.stringify(request.body),
        event.signature,
        config.secret,
        config.signatureAlgorithm
      )

      event.signatureVerified = verification.verified
      event.verificationError = verification.error
    } else if (config.verificationToken) {
      // Token-based verification (e.g., Slack)
      const token = request.body.token
      event.signatureVerified = token === config.verificationToken
      if (!event.signatureVerified) {
        event.verificationError = 'Invalid verification token'
      }
    } else {
      // No verification configured
      event.signatureVerified = true
    }

    // Check if event should be processed
    if (!event.signatureVerified) {
      event.status = 'ignored'
      this.emit('webhook:verification_failed', event)
      return event
    }

    // Check event filters
    if (config.eventFilters && !this.matchesFilters(request.body, config.eventFilters)) {
      event.status = 'ignored'
      this.emit('webhook:filtered', event)
      return event
    }

    // Queue for processing
    await this.messageQueue.enqueue('webhooks', 'webhook_event', event, {
      priority: 'high',
      metadata: { instanceId, integrationType },
    })

    this.emit('webhook:received', event)

    return event
  }

  /**
   * Process webhook event
   */
  private async processWebhookEvent(message: { data: WebhookEvent }): Promise<void> {
    const event = message.data
    const startTime = Date.now()

    try {
      event.status = 'processing'

      // Parse and transform the webhook data
      const parsedData = await this.parseWebhookData(event.integrationType, event.requestBody)

      // Emit platform-specific event
      this.emit(`webhook:${event.integrationType}:${event.eventType}`, {
        event,
        data: parsedData,
      })

      // Emit generic webhook event
      this.emit('webhook:processed', {
        event,
        data: parsedData,
      })

      event.status = 'processed'
      event.processedAt = new Date()
      event.processingTimeMs = Date.now() - startTime
      event.responseStatus = 200
    } catch (error: any) {
      event.status = 'failed'
      event.processingError = error.message
      event.processingTimeMs = Date.now() - startTime

      this.emit('webhook:processing_failed', { event, error: error.message })

      throw error // Let queue handle retry
    }
  }

  // ============================================================================
  // SIGNATURE VERIFICATION
  // ============================================================================

  /**
   * Verify webhook signature
   */
  async verifySignature(
    integrationType: string,
    payload: string,
    signature: string,
    secret: string,
    algorithm: 'sha1' | 'sha256' | 'sha512' = 'sha256'
  ): Promise<SignatureVerification> {
    try {
      // Check if there's a platform-specific verification strategy
      const strategy = this.verificationStrategies.get(integrationType)

      if (strategy) {
        const verified = await strategy(payload, signature, secret)
        return { verified }
      }

      // Default HMAC verification
      const verified = this.verifyHmac(payload, signature, secret, algorithm)
      return { verified }
    } catch (error: any) {
      return {
        verified: false,
        error: error.message,
      }
    }
  }

  /**
   * Verify HMAC signature
   */
  private verifyHmac(
    payload: string,
    signature: string,
    secret: string,
    algorithm: 'sha1' | 'sha256' | 'sha512'
  ): boolean {
    const hmac = crypto.createHmac(algorithm, secret)
    hmac.update(payload)
    const computedSignature = hmac.digest('hex')

    // Handle different signature formats
    const normalizedSignature = signature.replace(/^(sha1|sha256|sha512)=/, '')

    return crypto.timingSafeEqual(
      Buffer.from(computedSignature),
      Buffer.from(normalizedSignature)
    )
  }

  /**
   * Register platform-specific verification strategy
   */
  registerVerificationStrategy(
    integrationType: string,
    strategy: (payload: string, signature: string, secret: string) => Promise<boolean>
  ): void {
    this.verificationStrategies.set(integrationType, strategy)
  }

  /**
   * Register built-in verification strategies
   */
  private registerBuiltInStrategies(): void {
    // GitHub
    this.registerVerificationStrategy('github', async (payload, signature, secret) => {
      const hmac = crypto.createHmac('sha256', secret)
      hmac.update(payload)
      const computed = 'sha256=' + hmac.digest('hex')
      return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature))
    })

    // Stripe
    this.registerVerificationStrategy('stripe', async (payload, signature, secret) => {
      const parts = signature.split(',')
      const timestamp = parts.find(p => p.startsWith('t='))?.substring(2)
      const sigs = parts.filter(p => p.startsWith('v1='))

      if (!timestamp || sigs.length === 0) return false

      const signedPayload = `${timestamp}.${payload}`
      const hmac = crypto.createHmac('sha256', secret)
      hmac.update(signedPayload)
      const computed = hmac.digest('hex')

      return sigs.some(sig => {
        const sigValue = sig.substring(3)
        return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(sigValue))
      })
    })

    // Shopify
    this.registerVerificationStrategy('shopify', async (payload, signature, secret) => {
      const hmac = crypto.createHmac('sha256', secret)
      hmac.update(payload, 'utf8')
      const computed = hmac.digest('base64')
      return signature === computed
    })

    // Twilio
    this.registerVerificationStrategy('twilio', async (payload, signature, secret) => {
      // Twilio uses a special validation (URL + sorted params + secret)
      // This is a simplified version
      const hmac = crypto.createHmac('sha1', secret)
      hmac.update(payload)
      const computed = hmac.digest('base64')
      return signature === computed
    })

    // Facebook/Messenger
    this.registerVerificationStrategy('messenger', async (payload, signature, secret) => {
      const hmac = crypto.createHmac('sha256', secret)
      hmac.update(payload)
      const computed = 'sha256=' + hmac.digest('hex')
      return signature === computed
    })

    // HubSpot
    this.registerVerificationStrategy('hubspot', async (payload, signature, secret) => {
      const hmac = crypto.createHmac('sha256', secret)
      hmac.update(payload)
      const computed = hmac.digest('hex')
      return signature === computed
    })

    // Salesforce
    this.registerVerificationStrategy('salesforce', async (payload, signature, secret) => {
      const hmac = crypto.createHmac('sha256', secret)
      hmac.update(payload)
      const computed = hmac.digest('base64')
      return signature === computed
    })
  }

  // ============================================================================
  // EVENT PARSING
  // ============================================================================

  /**
   * Extract event type from payload
   */
  private extractEventType(body: any, integrationType: string): string {
    // Platform-specific event type extraction
    switch (integrationType) {
      case 'github':
        return body.action || 'unknown'
      case 'stripe':
        return body.type || 'unknown'
      case 'shopify':
        return body.topic || 'unknown'
      case 'messenger':
      case 'instagram':
        return body.entry?.[0]?.messaging?.[0] ? 'message' : body.object || 'unknown'
      case 'hubspot':
        return body.subscriptionType || 'unknown'
      case 'salesforce':
        return body.event?.type || 'unknown'
      case 'slack':
        return body.type || body.event?.type || 'unknown'
      default:
        return body.event_type || body.type || body.event || 'unknown'
    }
  }

  /**
   * Parse webhook data
   */
  private async parseWebhookData(integrationType: string, body: any): Promise<any> {
    // Platform-specific parsing
    // This would be implemented for each platform
    // For now, return the body as-is
    return body
  }

  /**
   * Check if event matches filters
   */
  private matchesFilters(body: any, filters: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(filters)) {
      const bodyValue = this.getNestedValue(body, key)

      if (Array.isArray(value)) {
        if (!value.includes(bodyValue)) return false
      } else if (bodyValue !== value) {
        return false
      }
    }

    return true
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  // ============================================================================
  // RETRY LOGIC
  // ============================================================================

  /**
   * Retry failed webhook
   */
  async retryWebhook(eventId: string): Promise<boolean> {
    const result = this.messageQueue.findMessage(eventId)

    if (!result) {
      return false
    }

    return await this.messageQueue.retryMessage(eventId)
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `whevt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Respond to webhook verification challenge (for some platforms)
   */
  handleVerificationChallenge(body: any, integrationType: string): string | null {
    switch (integrationType) {
      case 'messenger':
      case 'instagram':
        return body['hub.challenge'] || null

      case 'slack':
        return body.challenge || null

      case 'zoom':
        return body.payload?.plainToken || null

      default:
        return null
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default WebhookHandler
