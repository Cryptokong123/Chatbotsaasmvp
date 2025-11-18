import { PlatformAdapter } from '../platform-adapter'
import {
  UnifiedMessage,
  PlatformCredentials,
  MessageAttachment,
  PlatformCapabilities,
  PlatformError,
  RichContent,
} from '../types'

interface TelegramCredentials {
  bot_token: string
  webhook_secret?: string
}

interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from: {
      id: number
      first_name: string
      last_name?: string
      username?: string
    }
    chat: {
      id: number
      type: string
    }
    text?: string
    photo?: Array<{ file_id: string; file_size?: number }>
    document?: { file_id: string; file_name?: string }
    voice?: { file_id: string; duration?: number }
    video?: { file_id: string }
    location?: { latitude: number; longitude: number }
    contact?: { phone_number: string; first_name: string }
  }
  callback_query?: {
    id: string
    from: { id: number; first_name: string }
    message: { message_id: number; chat: { id: number } }
    data: string
  }
}

/**
 * Telegram Bot API Adapter
 *
 * Implements the PlatformAdapter for Telegram messaging platform
 * Documentation: https://core.telegram.org/bots/api
 */
export class TelegramAdapter extends PlatformAdapter {
  private baseUrl: string = 'https://api.telegram.org/bot'
  private botToken: string = ''
  private connected: boolean = false

  /**
   * Get platform capabilities
   */
  getCapabilities(): PlatformCapabilities {
    return {
      // Message Types
      supportsText: true,
      supportsImages: true,
      supportsVideos: true,
      supportsAudio: true,
      supportsFiles: true,
      supportsLocation: true,
      supportsContacts: true,
      supportsStickers: true,

      // Rich Content
      supportsButtons: true,
      supportsQuickReplies: false,
      supportsCards: false,
      supportsCarousel: false,
      supportsList: false,
      supportsTemplates: false,

      // Features
      supportsTypingIndicator: true,
      supportsReadReceipts: false,
      supportsDeliveryReceipts: false,
      supportsPresence: false,
      supportsThreads: false,
      supportsGroups: true,
      supportsChannels: true,
      supportsBroadcast: false,

      // Interactive
      supportsInteractiveMessages: true,
      supportsInlineQueries: true,
      supportsCommands: true,

      // Advanced
      supportsVoiceCalls: false,
      supportsVideoCalls: false,
      supportsScreenSharing: false,
      supportsPayments: true,
      supportsE2EEncryption: true,

      // Limits
      maxMessageLength: 4096,
      maxAttachmentSize: 52428800, // 50 MB
      maxButtons: 8,
      maxQuickReplies: 0,
      maxCarouselCards: 0,
    }
  }

  /**
   * Connect to Telegram
   */
  async connect(): Promise<any> {
    // Return connection info
    return {
      connected: this.connected,
      platform: 'telegram',
      status: 'connected',
      timestamp: new Date(),
    }
  }

  /**
   * Disconnect from Telegram
   */
  async disconnect(): Promise<void> {
    // Delete webhook if set
    try {
      await this.makeRequest('deleteWebhook')
    } catch (error) {
      console.warn('Failed to delete webhook:', error)
    }

    this.connected = false
    this.botToken = ''
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const response = await this.makeRequest('getMe')
      const data = await response.json()
      return {
        success: data.ok === true,
        message: data.ok ? 'Connected successfully' : 'Connection failed',
        details: data
      }
    } catch (error: any) {
      return {
        success: false,
        message: error?.message || 'Connection failed',
        details: error
      }
    }
  }

  /**
   * Send a message
   */
  async sendMessage(message: UnifiedMessage): Promise<any> {
    this.ensureConnected()

    const payload: any = {
      chat_id: message.conversationId,
      text: message.content,
    }

    // Add buttons if present
    if (message.richContent?.buttons && message.richContent.buttons.length > 0) {
      payload.reply_markup = {
        inline_keyboard: [
          message.richContent.buttons.map((button) => ({
            text: button.label,
            callback_data: button.value || button.label,
            url: button.url,
          })),
        ],
      }
    }

    try {
      const response = await this.makeRequest('sendMessage', payload)
      const data = await response.json()

      if (!data.ok) {
        return {
          success: false,
          deliveryStatus: 'failed',
          timestamp: new Date(),
          error: {
            code: 'SEND_FAILED',
            message: `Failed to send message: ${data.description}`,
            retryable: true
          }
        }
      }

      return {
        success: true,
        messageId: message.id,
        platformMessageId: data.result.message_id.toString(),
        deliveryStatus: 'sent',
        timestamp: new Date()
      }
    } catch (error: any) {
      return {
        success: false,
        deliveryStatus: 'failed',
        timestamp: new Date(),
        error: {
          code: 'SEND_FAILED',
          message: error?.message || 'Failed to send message',
          retryable: true
        }
      }
    }
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(recipientId: string): Promise<void> {
    this.ensureConnected()

    await this.makeRequest('sendChatAction', {
      chat_id: recipientId,
      action: 'typing',
    })
  }

  /**
   * Upload media file
   */
  async uploadMedia(file: Buffer | string, mimeType: string, filename?: string): Promise<{ url: string; mediaId?: string }> {
    this.ensureConnected()

    const buffer = typeof file === 'string' ? Buffer.from(file, 'base64') : file
    const formData = new FormData()
    formData.append('photo', new Blob([new Uint8Array(buffer)], { type: mimeType }), filename || 'file')

    try {
      const response = await fetch(`${this.baseUrl}${this.botToken}/sendPhoto`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!data.ok) {
        throw new PlatformError(`Failed to upload media: ${data.description}`, 'upload', 'telegram', false, {
          response: data,
        })
      }

      const fileId = data.result.photo[0].file_id
      return {
        url: fileId,
        mediaId: fileId
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Register webhook
   */
  async registerWebhook(webhookUrl: string, secret?: string): Promise<{ success: boolean; webhookId?: string; verificationToken?: string; error?: string }> {
    this.ensureConnected()

    const payload: any = {
      url: webhookUrl,
      max_connections: 40,
      allowed_updates: ['message', 'callback_query'],
    }

    if (secret) {
      payload.secret_token = secret
    }

    try {
      const response = await this.makeRequest('setWebhook', payload)
      const data = await response.json()

      if (!data.ok) {
        return {
          success: false,
          error: `Failed to set webhook: ${data.description}`
        }
      }

      console.log('Telegram webhook registered successfully')
      return {
        success: true,
        webhookId: 'telegram-webhook',
        verificationToken: secret
      }
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Failed to register webhook'
      }
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // Telegram uses X-Telegram-Bot-Api-Secret-Token header for verification
    return signature === secret
  }

  /**
   * Parse incoming webhook event
   */
  parseWebhookEvent(event: any): any[] {
    const update = event as TelegramUpdate

    // Handle regular message
    if (update.message) {
      const msg = update.message

      return [{
        id: msg.message_id.toString(),
        platform: 'telegram',
        type: 'text',
        senderId: msg.from.id.toString(),
        senderName: `${msg.from.first_name}${msg.from.last_name ? ' ' + msg.from.last_name : ''}`,
        senderType: 'user',
        conversationId: msg.chat.id.toString(),
        content: msg.text || '',
        timestamp: new Date(),
        direction: 'incoming',
        attachments: [],
        metadata: {
          chatType: msg.chat.type,
          username: msg.from.username,
          hasPhoto: !!msg.photo,
          hasDocument: !!msg.document,
          hasVoice: !!msg.voice,
          hasLocation: !!msg.location,
        },
      }]
    }

    // Handle callback query (button click)
    if (update.callback_query) {
      const query = update.callback_query

      return [{
        id: query.id,
        platform: 'telegram',
        type: 'interactive',
        senderId: query.from.id.toString(),
        senderName: query.from.first_name,
        senderType: 'user',
        conversationId: query.message.chat.id.toString(),
        content: query.data,
        timestamp: new Date(),
        direction: 'incoming',
        metadata: {
          interactionType: 'button_click',
          callbackData: query.data,
        },
      }]
    }

    throw new PlatformError('Unable to parse Telegram update', 'parse', 'telegram', false, { update })
  }

  /**
   * Get platform-specific user info
   */
  async getUserInfo(userId: string): Promise<any> {
    this.ensureConnected()

    try {
      const response = await this.makeRequest('getChat', { chat_id: userId })
      const data = await response.json()

      if (!data.ok) {
        throw new PlatformError(`Failed to get user info: ${data.description}`, 'api', 'telegram', false, {
          response: data,
        })
      }

      return {
        id: data.result.id.toString(),
        name: `${data.result.first_name}${data.result.last_name ? ' ' + data.result.last_name : ''}`,
        username: data.result.username,
        type: data.result.type,
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Helper: Make API request to Telegram
   */
  private async makeRequest(method: string, payload?: any): Promise<Response> {
    const url = `${this.baseUrl}${this.botToken}/${method}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload ? JSON.stringify(payload) : undefined,
    })

    return response
  }

  /**
   * Helper: Get file URL from file_id
   */
  private async getFileUrl(fileId: string): Promise<string> {
    const response = await this.makeRequest('getFile', { file_id: fileId })
    const data = await response.json()

    if (!data.ok) {
      throw new PlatformError(`Failed to get file: ${data.description}`, 'api', 'telegram', false, {
        response: data,
      })
    }

    return `https://api.telegram.org/file/bot${this.botToken}/${data.result.file_path}`
  }

  /**
   * Ensure adapter is connected
   */
  private ensureConnected(): void {
    if (!this.connected || !this.botToken) {
      throw new PlatformError('Not connected to Telegram. Call connect() first.', 'connection', 'telegram')
    }
  }

  /**
   * Handle and normalize errors
   */
  private handleError(error: any): PlatformError {
    if (error instanceof PlatformError) {
      return error
    }

    return new PlatformError(error.message || 'Unknown Telegram error', 'unknown', 'telegram', false, {
      originalError: error,
    })
  }

  getSetupGuide(): any[] {
    return [
      {
        step: 1,
        title: 'Create Telegram Bot',
        description: 'Create a new bot via @BotFather on Telegram'
      },
      {
        step: 2,
        title: 'Get Bot Token',
        description: 'Copy the bot token provided by @BotFather'
      },
      {
        step: 3,
        title: 'Configure Webhook',
        description: 'Set up webhook URL for receiving updates'
      }
    ]
  }

  protected getDefaultConfig(userConfig: any): any {
    return {
      ...userConfig,
      webhookUrl: userConfig.webhookUrl || '',
      botToken: userConfig.botToken || ''
    }
  }

  async validateCredentials(credentials: any): Promise<{ valid: boolean; error?: string }> {
    if (!credentials.botToken) {
      return { valid: false, error: 'Bot token is required' }
    }
    return { valid: true }
  }

  handleWebhookChallenge(query: any, body: any): any {
    return {}  // Telegram doesn't use webhook challenges
  }

  receiveMessage(rawMessage: any): any {
    const msg = rawMessage.message || rawMessage
    return {
      id: msg.message_id?.toString() || Date.now().toString(),
      platform: 'telegram',
      type: 'text',
      content: msg.text || '',
      senderId: msg.from?.id?.toString() || '',
      senderType: 'user',
      conversationId: msg.chat?.id?.toString() || '',
      timestamp: new Date(msg.date * 1000),
      direction: 'incoming',
      raw: rawMessage
    }
  }
}
