/**
 * Platform Adapter Interface
 *
 * Base interface that all platform integrations must implement
 * This ensures consistent behavior across all messaging platforms
 */

import {
  PlatformType,
  PlatformCredentials,
  PlatformConfig,
  PlatformConnection,
  PlatformCapabilities,
  PlatformWebhookEvent,
  UnifiedMessage,
  MessageDeliveryResult,
  SetupGuideStep,
  ConnectionStatus,
} from './types'

/**
 * Abstract base class for all platform adapters
 */
export abstract class PlatformAdapter {
  protected platform: PlatformType
  protected credentials: PlatformCredentials
  protected config: PlatformConfig
  protected connectionStatus: ConnectionStatus = 'disconnected'

  constructor(
    platform: PlatformType,
    credentials: PlatformCredentials,
    config: PlatformConfig = {}
  ) {
    this.platform = platform
    this.credentials = credentials
    this.config = this.getDefaultConfig(config)
  }

  /**
   * Get platform type
   */
  getPlatform(): PlatformType {
    return this.platform
  }

  /**
   * Get platform capabilities
   */
  abstract getCapabilities(): PlatformCapabilities

  /**
   * Get setup guide steps
   */
  abstract getSetupGuide(): SetupGuideStep[]

  /**
   * Get default configuration merged with user config
   */
  protected abstract getDefaultConfig(userConfig: PlatformConfig): PlatformConfig

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  /**
   * Connect to the platform
   */
  abstract connect(): Promise<PlatformConnection>

  /**
   * Disconnect from the platform
   */
  abstract disconnect(): Promise<void>

  /**
   * Test the connection
   */
  abstract testConnection(): Promise<{
    success: boolean
    message: string
    details?: any
  }>

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus
  }

  /**
   * Validate credentials
   */
  abstract validateCredentials(credentials: PlatformCredentials): Promise<{
    valid: boolean
    errors?: Record<string, string>
  }>

  // ============================================================================
  // WEBHOOK MANAGEMENT
  // ============================================================================

  /**
   * Register webhook with the platform
   */
  abstract registerWebhook(webhookUrl: string): Promise<{
    success: boolean
    webhookId?: string
    verificationToken?: string
    error?: string
  }>

  /**
   * Verify webhook signature
   */
  abstract verifyWebhookSignature(
    payload: string | Buffer,
    signature: string,
    secret?: string
  ): boolean

  /**
   * Parse webhook event
   */
  abstract parseWebhookEvent(rawEvent: any): PlatformWebhookEvent[]

  /**
   * Handle webhook verification/challenge
   */
  abstract handleWebhookChallenge(query: any, body: any): any

  // ============================================================================
  // MESSAGE HANDLING
  // ============================================================================

  /**
   * Send a message
   */
  abstract sendMessage(message: UnifiedMessage): Promise<MessageDeliveryResult>

  /**
   * Send multiple messages (batch)
   */
  async sendMessages(
    messages: UnifiedMessage[]
  ): Promise<MessageDeliveryResult[]> {
    // Default implementation: send one by one
    // Platforms can override for true batch support
    return Promise.all(messages.map((msg) => this.sendMessage(msg)))
  }

  /**
   * Receive and parse incoming message
   */
  abstract receiveMessage(rawMessage: any): UnifiedMessage

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string, conversationId: string): Promise<void> {
    // Optional: not all platforms support this
    throw new Error(`markAsRead not implemented for ${this.platform}`)
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(conversationId: string): Promise<void> {
    // Optional: not all platforms support this
    throw new Error(`sendTypingIndicator not implemented for ${this.platform}`)
  }

  /**
   * Delete/recall a message
   */
  async deleteMessage(messageId: string, conversationId: string): Promise<void> {
    // Optional: not all platforms support this
    throw new Error(`deleteMessage not implemented for ${this.platform}`)
  }

  // ============================================================================
  // MEDIA HANDLING
  // ============================================================================

  /**
   * Upload media file
   */
  async uploadMedia(
    file: Buffer | string,
    mimeType: string,
    filename?: string
  ): Promise<{ url: string; mediaId?: string }> {
    // Optional: not all platforms require pre-upload
    throw new Error(`uploadMedia not implemented for ${this.platform}`)
  }

  /**
   * Download media file
   */
  async downloadMedia(
    mediaId: string
  ): Promise<{ buffer: Buffer; mimeType: string; filename?: string }> {
    // Optional
    throw new Error(`downloadMedia not implemented for ${this.platform}`)
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  /**
   * Get user profile information
   */
  async getUserProfile(userId: string): Promise<{
    id: string
    name?: string
    username?: string
    avatarUrl?: string
    metadata?: Record<string, any>
  }> {
    // Optional: return basic info if not available
    return {
      id: userId,
      name: undefined,
      username: undefined,
      avatarUrl: undefined,
    }
  }

  /**
   * Block a user
   */
  async blockUser(userId: string): Promise<void> {
    // Optional
    throw new Error(`blockUser not implemented for ${this.platform}`)
  }

  /**
   * Unblock a user
   */
  async unblockUser(userId: string): Promise<void> {
    // Optional
    throw new Error(`unblockUser not implemented for ${this.platform}`)
  }

  // ============================================================================
  // CONVERSATION MANAGEMENT
  // ============================================================================

  /**
   * Get conversation history
   */
  async getConversationHistory(
    conversationId: string,
    limit: number = 50,
    before?: string
  ): Promise<UnifiedMessage[]> {
    // Optional: not all platforms support fetching history
    throw new Error(`getConversationHistory not implemented for ${this.platform}`)
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(conversationId: string): Promise<void> {
    // Optional
    throw new Error(`archiveConversation not implemented for ${this.platform}`)
  }

  // ============================================================================
  // PLATFORM-SPECIFIC FEATURES
  // ============================================================================

  /**
   * Send platform-specific formatted message
   * (e.g., Slack blocks, WhatsApp templates, etc.)
   */
  async sendPlatformSpecific(
    conversationId: string,
    data: any
  ): Promise<MessageDeliveryResult> {
    // Optional: for advanced platform features
    throw new Error(`sendPlatformSpecific not implemented for ${this.platform}`)
  }

  /**
   * Execute platform-specific action
   */
  async executePlatformAction(action: string, params: any): Promise<any> {
    // Optional: for platform-specific operations
    throw new Error(
      `executePlatformAction '${action}' not implemented for ${this.platform}`
    )
  }

  // ============================================================================
  // ANALYTICS & MONITORING
  // ============================================================================

  /**
   * Get platform metrics
   */
  async getMetrics(startDate: Date, endDate: Date): Promise<{
    messagesSent: number
    messagesReceived: number
    deliveryRate: number
    errorRate: number
    averageResponseTime: number
    [key: string]: any
  }> {
    // Optional: return empty metrics if not available
    return {
      messagesSent: 0,
      messagesReceived: 0,
      deliveryRate: 0,
      errorRate: 0,
      averageResponseTime: 0,
    }
  }

  /**
   * Get rate limit status
   */
  async getRateLimitStatus(): Promise<{
    remaining: number
    limit: number
    resetAt: Date
  }> {
    // Optional
    throw new Error(`getRateLimitStatus not implemented for ${this.platform}`)
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Format error for consistent error handling
   */
  protected formatError(error: any): {
    code: string
    message: string
    retryable: boolean
    originalError?: any
  } {
    return {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      retryable: error.retryable || false,
      originalError: error,
    }
  }

  /**
   * Wait with exponential backoff
   */
  protected async exponentialBackoff(
    attempt: number,
    baseDelay: number = 1000
  ): Promise<void> {
    const delay = Math.min(baseDelay * Math.pow(2, attempt), 30000) // Max 30 seconds
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  /**
   * Retry operation with exponential backoff
   */
  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3
  ): Promise<T> {
    let lastError: any

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error: any) {
        lastError = error

        // Don't retry if not retryable
        if (error.retryable === false) {
          throw error
        }

        // Don't wait after last attempt
        if (attempt < maxAttempts - 1) {
          await this.exponentialBackoff(attempt)
        }
      }
    }

    throw lastError
  }

  /**
   * Sanitize message content
   */
  protected sanitizeContent(content: string, maxLength?: number): string {
    let sanitized = content.trim()

    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength - 3) + '...'
    }

    return sanitized
  }

  /**
   * Generate unique ID
   */
  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }
}
