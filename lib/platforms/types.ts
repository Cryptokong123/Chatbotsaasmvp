/**
 * Platform Integration Types
 *
 * Core types and interfaces for multi-platform agent system
 */

export type PlatformType =
  | 'whatsapp'
  | 'telegram'
  | 'slack'
  | 'discord'
  | 'teams'
  | 'messenger'
  | 'instagram'
  | 'twitter'
  | 'linkedin'
  | 'sms'
  | 'voice'
  | 'email'
  | 'wechat'
  | 'line'
  | 'viber'
  | 'kakao'
  | 'alexa'
  | 'google_assistant'
  | 'google_business'
  | 'apple_business'

export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'file'
  | 'location'
  | 'contact'
  | 'sticker'
  | 'template'
  | 'interactive'
  | 'system'

export type MessageDirection = 'incoming' | 'outgoing'

export type DeliveryStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'deleted'

export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'pending'

/**
 * Standardized message format across all platforms
 */
export interface UnifiedMessage {
  // Identifiers
  id?: string
  conversationId: string
  platformMessageId?: string

  // Content
  type: MessageType
  content: string
  richContent?: RichContent
  attachments?: MessageAttachment[]

  // Sender Info
  senderId: string
  senderName?: string
  senderType: 'user' | 'agent' | 'human' | 'system'

  // Direction & Status
  direction: MessageDirection
  deliveryStatus?: DeliveryStatus

  // Metadata
  platform: PlatformType
  timestamp: Date
  metadata?: Record<string, any>

  // AI Analysis
  intent?: string
  entities?: Record<string, any>
  confidenceScore?: number
  sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed'
  sentimentScore?: number
}

/**
 * Rich content for interactive messages
 */
export interface RichContent {
  buttons?: Button[]
  quickReplies?: QuickReply[]
  cards?: Card[]
  carousel?: Card[]
  list?: ListItem[]
  template?: Template
  customPayload?: Record<string, any>
}

export interface Button {
  id: string
  type: 'postback' | 'url' | 'phone' | 'share' | 'custom'
  label: string
  value?: string
  url?: string
  payload?: any
}

export interface QuickReply {
  id: string
  label: string
  value?: string
  imageUrl?: string
  payload?: any
}

export interface Card {
  id: string
  title?: string
  subtitle?: string
  description?: string
  imageUrl?: string
  buttons?: Button[]
  url?: string
  metadata?: Record<string, any>
}

export interface ListItem {
  id: string
  title: string
  description?: string
  imageUrl?: string
  metadata?: Record<string, any>
}

export interface Template {
  type: string
  data: Record<string, any>
}

export interface MessageAttachment {
  id?: string
  type: 'image' | 'video' | 'audio' | 'file' | 'document'
  url: string
  mimeType?: string
  filename?: string
  size?: number
  thumbnail?: string
  metadata?: Record<string, any>
}

/**
 * Platform-specific credentials and configuration
 */
export interface PlatformCredentials {
  // Common fields
  apiKey?: string
  apiSecret?: string
  accessToken?: string
  refreshToken?: string
  tokenExpiresAt?: Date

  // Platform-specific
  botToken?: string // Telegram, Discord
  appId?: string // Facebook, Slack
  appSecret?: string // Facebook
  verifyToken?: string // Facebook
  webhookSecret?: string // Slack, GitHub
  phoneNumberId?: string // WhatsApp
  businessAccountId?: string // WhatsApp
  workspaceId?: string // Slack
  teamId?: string // Slack, Teams
  tenantId?: string // Teams
  channelId?: string // Various platforms
  guildId?: string // Discord

  // OAuth
  clientId?: string
  clientSecret?: string
  scope?: string[]
  redirectUri?: string

  // Additional config
  [key: string]: any
}

/**
 * Platform configuration
 */
export interface PlatformConfig {
  // Connection
  baseUrl?: string
  apiVersion?: string
  timeout?: number
  retryAttempts?: number
  retryDelay?: number

  // Features
  enableTypingIndicator?: boolean
  enableReadReceipts?: boolean
  enableDeliveryReceipts?: boolean
  enablePresence?: boolean

  // Limits
  maxMessageLength?: number
  maxAttachmentSize?: number
  rateLimit?: RateLimitConfig

  // Webhook
  webhookUrl?: string
  webhookSecret?: string
  webhookEvents?: string[]

  // Custom
  [key: string]: any
}

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  retryAfterMs?: number
}

/**
 * Webhook event from platform
 */
export interface PlatformWebhookEvent {
  platform: PlatformType
  eventType: string
  eventId?: string
  timestamp: Date
  data: any
  rawEvent: any // Original platform event
  signature?: string
}

/**
 * Platform connection info
 */
export interface PlatformConnection {
  id: string
  platform: PlatformType
  status: ConnectionStatus
  credentials: PlatformCredentials
  config: PlatformConfig
  lastConnected?: Date
  lastError?: string
  metadata?: Record<string, any>
}

/**
 * Message delivery result
 */
export interface MessageDeliveryResult {
  success: boolean
  messageId?: string
  platformMessageId?: string
  deliveryStatus: DeliveryStatus
  timestamp: Date
  error?: {
    code: string
    message: string
    retryable: boolean
  }
  metadata?: Record<string, any>
}

/**
 * Platform capabilities
 */
export interface PlatformCapabilities {
  // Message Types
  supportsText: boolean
  supportsImages: boolean
  supportsVideos: boolean
  supportsAudio: boolean
  supportsFiles: boolean
  supportsLocation: boolean
  supportsContacts: boolean
  supportsStickers: boolean

  // Rich Content
  supportsButtons: boolean
  supportsQuickReplies: boolean
  supportsCards: boolean
  supportsCarousel: boolean
  supportsList: boolean
  supportsTemplates: boolean

  // Features
  supportsTypingIndicator: boolean
  supportsReadReceipts: boolean
  supportsDeliveryReceipts: boolean
  supportsPresence: boolean
  supportsThreads: boolean
  supportsGroups: boolean
  supportsChannels: boolean
  supportsBroadcast: boolean

  // Interactive
  supportsInteractiveMessages: boolean
  supportsInlineQueries: boolean
  supportsCommands: boolean

  // Advanced
  supportsVoiceCalls: boolean
  supportsVideoCalls: boolean
  supportsScreenSharing: boolean
  supportsPayments: boolean
  supportsE2EEncryption: boolean

  // Limits
  maxMessageLength: number
  maxAttachmentSize: number
  maxButtons: number
  maxQuickReplies: number
  maxCarouselCards: number
}

/**
 * Analytics event
 */
export interface AnalyticsEvent {
  eventType: string
  agentId: string
  conversationId?: string
  messageId?: string
  platform: PlatformType
  timestamp: Date
  properties?: Record<string, any>
  metrics?: Record<string, number>
}

/**
 * Error types
 */
export class PlatformError extends Error {
  constructor(
    message: string,
    public code: string,
    public platform: PlatformType,
    public retryable: boolean = false,
    public originalError?: any
  ) {
    super(message)
    this.name = 'PlatformError'
  }
}

export class AuthenticationError extends PlatformError {
  constructor(platform: PlatformType, message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', platform, false)
    this.name = 'AuthenticationError'
  }
}

export class RateLimitError extends PlatformError {
  constructor(
    platform: PlatformType,
    public retryAfterMs: number,
    message: string = 'Rate limit exceeded'
  ) {
    super(message, 'RATE_LIMIT', platform, true)
    this.name = 'RateLimitError'
  }
}

export class ValidationError extends PlatformError {
  constructor(platform: PlatformType, message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', platform, false)
    this.name = 'ValidationError'
  }
}

export class NetworkError extends PlatformError {
  constructor(platform: PlatformType, message: string = 'Network error') {
    super(message, 'NETWORK_ERROR', platform, true)
    this.name = 'NetworkError'
  }
}

/**
 * Setup guide step
 */
export interface SetupGuideStep {
  id: string
  title: string
  description: string
  videoUrl?: string
  imageUrl?: string
  docsUrl?: string
  fields?: SetupField[]
  validationRules?: ValidationRule[]
  tips?: string[]
  commonErrors?: CommonError[]
}

export interface SetupField {
  name: string
  label: string
  type: 'text' | 'password' | 'url' | 'select' | 'multiselect' | 'file'
  placeholder?: string
  helpText?: string
  required: boolean
  defaultValue?: any
  options?: { label: string; value: string }[]
  validation?: ValidationRule[]
}

export interface ValidationRule {
  type: 'required' | 'pattern' | 'length' | 'url' | 'custom'
  message: string
  pattern?: string
  minLength?: number
  maxLength?: number
  customValidator?: (value: any) => boolean
}

export interface CommonError {
  code: string
  message: string
  solution: string
  docsUrl?: string
}
