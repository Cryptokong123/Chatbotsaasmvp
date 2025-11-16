/**
 * Message Router
 *
 * Central routing system for messages across all platforms
 * Handles message queuing, retry logic, and delivery tracking
 */

import { PlatformAdapter } from './platform-adapter'
import {
  UnifiedMessage,
  MessageDeliveryResult,
  PlatformType,
  PlatformError,
  RateLimitError,
} from './types'

export interface RouterConfig {
  enableQueue: boolean
  maxRetries: number
  retryDelay: number
  maxConcurrentDeliveries: number
  enableRateLimiting: boolean
  enableDeduplication: boolean
  deduplicationWindowMs: number
}

export interface QueuedMessage {
  id: string
  message: UnifiedMessage
  attempts: number
  scheduledFor: Date
  createdAt: Date
  error?: string
}

export class MessageRouter {
  private adapters: Map<PlatformType, PlatformAdapter> = new Map()
  private config: RouterConfig
  private messageQueue: QueuedMessage[] = []
  private processing: boolean = false
  private deliveredMessages: Set<string> = new Set() // For deduplication

  constructor(config: Partial<RouterConfig> = {}) {
    this.config = {
      enableQueue: true,
      maxRetries: 3,
      retryDelay: 1000,
      maxConcurrentDeliveries: 10,
      enableRateLimiting: true,
      enableDeduplication: true,
      deduplicationWindowMs: 60000, // 1 minute
      ...config,
    }
  }

  /**
   * Register a platform adapter
   */
  registerAdapter(adapter: PlatformAdapter): void {
    this.adapters.set(adapter.getPlatform(), adapter)
    console.log(`✅ Registered ${adapter.getPlatform()} adapter`)
  }

  /**
   * Unregister a platform adapter
   */
  unregisterAdapter(platform: PlatformType): void {
    this.adapters.delete(platform)
    console.log(`❌ Unregistered ${platform} adapter`)
  }

  /**
   * Get adapter for a platform
   */
  getAdapter(platform: PlatformType): PlatformAdapter | undefined {
    return this.adapters.get(platform)
  }

  /**
   * Check if platform is supported
   */
  isPlatformSupported(platform: PlatformType): boolean {
    return this.adapters.has(platform)
  }

  /**
   * Get all registered platforms
   */
  getRegisteredPlatforms(): PlatformType[] {
    return Array.from(this.adapters.keys())
  }

  /**
   * Send a message through the appropriate platform adapter
   */
  async sendMessage(message: UnifiedMessage): Promise<MessageDeliveryResult> {
    // Check if platform is supported
    const adapter = this.adapters.get(message.platform)
    if (!adapter) {
      return {
        success: false,
        deliveryStatus: 'failed',
        timestamp: new Date(),
        error: {
          code: 'PLATFORM_NOT_SUPPORTED',
          message: `Platform ${message.platform} is not registered`,
          retryable: false,
        },
      }
    }

    // Check for duplicate
    if (this.config.enableDeduplication) {
      const dedupeKey = this.getDeduplicationKey(message)
      if (this.deliveredMessages.has(dedupeKey)) {
        console.log(`⚠️ Duplicate message detected: ${dedupeKey}`)
        return {
          success: true,
          deliveryStatus: 'sent',
          timestamp: new Date(),
          messageId: dedupeKey,
        }
      }
    }

    // If queue is enabled, add to queue
    if (this.config.enableQueue) {
      return this.queueMessage(message)
    }

    // Otherwise, send directly
    return this.deliverMessage(message, adapter)
  }

  /**
   * Send multiple messages
   */
  async sendMessages(messages: UnifiedMessage[]): Promise<MessageDeliveryResult[]> {
    return Promise.all(messages.map((msg) => this.sendMessage(msg)))
  }

  /**
   * Queue a message for delivery
   */
  private async queueMessage(message: UnifiedMessage): Promise<MessageDeliveryResult> {
    const queuedMessage: QueuedMessage = {
      id: this.generateMessageId(),
      message,
      attempts: 0,
      scheduledFor: new Date(),
      createdAt: new Date(),
    }

    this.messageQueue.push(queuedMessage)

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue().catch((error) => {
        console.error('Error processing queue:', error)
      })
    }

    return {
      success: true,
      messageId: queuedMessage.id,
      deliveryStatus: 'pending',
      timestamp: new Date(),
    }
  }

  /**
   * Process message queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return

    this.processing = true

    while (this.messageQueue.length > 0) {
      const now = new Date()
      const readyMessages = this.messageQueue.filter(
        (msg) => msg.scheduledFor <= now
      )

      if (readyMessages.length === 0) {
        // Wait a bit before checking again
        await this.sleep(100)
        continue
      }

      // Process messages in batches
      const batch = readyMessages.slice(0, this.config.maxConcurrentDeliveries)
      const deliveryPromises = batch.map((queuedMsg) =>
        this.processQueuedMessage(queuedMsg)
      )

      await Promise.allSettled(deliveryPromises)

      // Remove processed messages
      this.messageQueue = this.messageQueue.filter(
        (msg) => !batch.includes(msg)
      )
    }

    this.processing = false
  }

  /**
   * Process a single queued message
   */
  private async processQueuedMessage(
    queuedMessage: QueuedMessage
  ): Promise<void> {
    const adapter = this.adapters.get(queuedMessage.message.platform)
    if (!adapter) {
      console.error(
        `❌ No adapter found for ${queuedMessage.message.platform}`
      )
      return
    }

    try {
      const result = await this.deliverMessage(queuedMessage.message, adapter)

      if (!result.success && result.error?.retryable) {
        // Retry logic
        if (queuedMessage.attempts < this.config.maxRetries) {
          queuedMessage.attempts++
          queuedMessage.scheduledFor = new Date(
            Date.now() +
              this.config.retryDelay * Math.pow(2, queuedMessage.attempts)
          )
          queuedMessage.error = result.error?.message

          // Re-queue
          this.messageQueue.push(queuedMessage)

          console.log(
            `🔄 Retrying message ${queuedMessage.id} (attempt ${queuedMessage.attempts}/${this.config.maxRetries})`
          )
        } else {
          console.error(
            `❌ Message ${queuedMessage.id} failed after ${this.config.maxRetries} attempts`
          )
        }
      }
    } catch (error: any) {
      console.error(`❌ Error processing message ${queuedMessage.id}:`, error)
    }
  }

  /**
   * Deliver a message using the adapter
   */
  private async deliverMessage(
    message: UnifiedMessage,
    adapter: PlatformAdapter
  ): Promise<MessageDeliveryResult> {
    try {
      console.log(`📤 Sending message via ${message.platform}...`)

      const result = await adapter.sendMessage(message)

      if (result.success) {
        // Add to delivered set for deduplication
        if (this.config.enableDeduplication) {
          const dedupeKey = this.getDeduplicationKey(message)
          this.deliveredMessages.add(dedupeKey)

          // Clean up old entries after window expires
          setTimeout(() => {
            this.deliveredMessages.delete(dedupeKey)
          }, this.config.deduplicationWindowMs)
        }

        console.log(`✅ Message sent successfully via ${message.platform}`)
      } else {
        console.error(`❌ Failed to send message via ${message.platform}:`, result.error)
      }

      return result
    } catch (error: any) {
      console.error(`❌ Error sending message via ${message.platform}:`, error)

      // Handle rate limiting
      if (error instanceof RateLimitError) {
        return {
          success: false,
          deliveryStatus: 'failed',
          timestamp: new Date(),
          error: {
            code: 'RATE_LIMIT',
            message: `Rate limit exceeded. Retry after ${error.retryAfterMs}ms`,
            retryable: true,
          },
        }
      }

      // Handle other platform errors
      if (error instanceof PlatformError) {
        return {
          success: false,
          deliveryStatus: 'failed',
          timestamp: new Date(),
          error: {
            code: error.code,
            message: error.message,
            retryable: error.retryable,
          },
        }
      }

      // Unknown error
      return {
        success: false,
        deliveryStatus: 'failed',
        timestamp: new Date(),
        error: {
          code: 'UNKNOWN_ERROR',
          message: error.message || 'An unknown error occurred',
          retryable: true,
        },
      }
    }
  }

  /**
   * Route incoming webhook event to appropriate adapter
   */
  async routeWebhookEvent(
    platform: PlatformType,
    rawEvent: any
  ): Promise<UnifiedMessage[]> {
    const adapter = this.adapters.get(platform)
    if (!adapter) {
      throw new Error(`No adapter registered for platform: ${platform}`)
    }

    // Parse webhook event
    const events = adapter.parseWebhookEvent(rawEvent)

    // Convert to unified messages
    const messages: UnifiedMessage[] = []
    for (const event of events) {
      if (event.eventType === 'message') {
        try {
          const message = adapter.receiveMessage(event.data)
          messages.push(message)
        } catch (error) {
          console.error('Error parsing message:', error)
        }
      }
    }

    return messages
  }

  /**
   * Get deduplication key for a message
   */
  private getDeduplicationKey(message: UnifiedMessage): string {
    return `${message.platform}:${message.conversationId}:${message.content.substring(0, 50)}:${message.timestamp.getTime()}`
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    queueLength: number
    processing: boolean
    messages: QueuedMessage[]
  } {
    return {
      queueLength: this.messageQueue.length,
      processing: this.processing,
      messages: [...this.messageQueue],
    }
  }

  /**
   * Clear message queue
   */
  clearQueue(): void {
    this.messageQueue = []
    console.log('🗑️ Message queue cleared')
  }

  /**
   * Get router statistics
   */
  getStatistics(): {
    registeredPlatforms: number
    platforms: PlatformType[]
    queueLength: number
    processing: boolean
    deduplicationCacheSize: number
  } {
    return {
      registeredPlatforms: this.adapters.size,
      platforms: this.getRegisteredPlatforms(),
      queueLength: this.messageQueue.length,
      processing: this.processing,
      deduplicationCacheSize: this.deliveredMessages.size,
    }
  }
}

/**
 * Global message router instance
 */
export const globalRouter = new MessageRouter()
