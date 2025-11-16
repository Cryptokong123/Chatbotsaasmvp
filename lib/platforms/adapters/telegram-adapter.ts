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

  /**
   * Get platform capabilities
   */
  getCapabilities(): PlatformCapabilities {
    return {
      supportsRichContent: true,
      supportsButtons: true,
      supportsCarousels: false,
      supportsAttachments: true,
      supportsVoice: true,
      supportsVideo: true,
      supportsLocation: true,
      supportsTemplates: false,
      supportsTypingIndicator: true,
      supportsReadReceipts: false,
      maxMessageLength: 4096,
      maxButtonsPerMessage: 8,
      supportedAttachmentTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'video/mp4',
        'audio/mpeg',
        'application/pdf',
      ],
    }
  }

  /**
   * Connect to Telegram
   */
  async connect(credentials: PlatformCredentials): Promise<void> {
    this.validateCredentials(credentials)

    const telegramCreds = credentials.telegram as TelegramCredentials
    this.botToken = telegramCreds.bot_token

    // Test connection by getting bot info
    try {
      const response = await this.makeRequest('getMe')
      const data = await response.json()

      if (!data.ok) {
        throw new PlatformError(
          'authentication',
          `Failed to authenticate with Telegram: ${data.description}`,
          { response: data }
        )
      }

      this.connected = true
      this.connectionStatus = {
        connected: true,
        lastChecked: new Date(),
        platform: 'telegram',
      }

      console.log(`Connected to Telegram as @${data.result.username}`)
    } catch (error) {
      this.connected = false
      throw this.handleError(error)
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
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('getMe')
      const data = await response.json()
      return data.ok === true
    } catch {
      return false
    }
  }

  /**
   * Send a message
   */
  async sendMessage(message: UnifiedMessage): Promise<string> {
    this.ensureConnected()

    const payload: any = {
      chat_id: message.recipientId,
      text: message.content,
    }

    // Add buttons if present
    if (message.richContent?.buttons && message.richContent.buttons.length > 0) {
      payload.reply_markup = {
        inline_keyboard: [
          message.richContent.buttons.map((button) => ({
            text: button.text,
            callback_data: button.value || button.text,
            url: button.url,
          })),
        ],
      }
    }

    try {
      const response = await this.makeRequest('sendMessage', payload)
      const data = await response.json()

      if (!data.ok) {
        throw new PlatformError('send', `Failed to send message: ${data.description}`, {
          response: data,
        })
      }

      return data.result.message_id.toString()
    } catch (error) {
      throw this.handleError(error)
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
  async uploadMedia(file: Buffer, filename: string, mimeType: string): Promise<string> {
    this.ensureConnected()

    const formData = new FormData()
    formData.append('photo', new Blob([file], { type: mimeType }), filename)

    try {
      const response = await fetch(`${this.baseUrl}${this.botToken}/sendPhoto`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!data.ok) {
        throw new PlatformError('upload', `Failed to upload media: ${data.description}`, {
          response: data,
        })
      }

      return data.result.photo[0].file_id
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Register webhook
   */
  async registerWebhook(webhookUrl: string, secret?: string): Promise<void> {
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
        throw new PlatformError('webhook', `Failed to set webhook: ${data.description}`, {
          response: data,
        })
      }

      console.log('Telegram webhook registered successfully')
    } catch (error) {
      throw this.handleError(error)
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
  async parseWebhookEvent(event: any): Promise<UnifiedMessage> {
    const update = event as TelegramUpdate

    // Handle regular message
    if (update.message) {
      const msg = update.message

      const unifiedMessage: UnifiedMessage = {
        id: msg.message_id.toString(),
        platform: 'telegram',
        senderId: msg.from.id.toString(),
        senderName: `${msg.from.first_name}${msg.from.last_name ? ' ' + msg.from.last_name : ''}`,
        recipientId: msg.chat.id.toString(),
        content: msg.text || '',
        timestamp: new Date(),
        direction: 'incoming',
        messageType: 'text',
        attachments: [],
        metadata: {
          chatType: msg.chat.type,
          username: msg.from.username,
        },
      }

      // Handle photos
      if (msg.photo && msg.photo.length > 0) {
        const photo = msg.photo[msg.photo.length - 1] // Get largest photo
        unifiedMessage.messageType = 'media'
        unifiedMessage.attachments = [
          {
            type: 'image',
            url: await this.getFileUrl(photo.file_id),
            size: photo.file_size,
          },
        ]
      }

      // Handle documents
      if (msg.document) {
        unifiedMessage.messageType = 'media'
        unifiedMessage.attachments = [
          {
            type: 'file',
            url: await this.getFileUrl(msg.document.file_id),
            filename: msg.document.file_name,
          },
        ]
      }

      // Handle voice
      if (msg.voice) {
        unifiedMessage.messageType = 'media'
        unifiedMessage.attachments = [
          {
            type: 'audio',
            url: await this.getFileUrl(msg.voice.file_id),
          },
        ]
      }

      // Handle location
      if (msg.location) {
        unifiedMessage.messageType = 'location'
        unifiedMessage.metadata.location = {
          latitude: msg.location.latitude,
          longitude: msg.location.longitude,
        }
      }

      return unifiedMessage
    }

    // Handle callback query (button click)
    if (update.callback_query) {
      const query = update.callback_query

      // Answer callback query
      await this.makeRequest('answerCallbackQuery', {
        callback_query_id: query.id,
      })

      return {
        id: query.id,
        platform: 'telegram',
        senderId: query.from.id.toString(),
        senderName: query.from.first_name,
        recipientId: query.message.chat.id.toString(),
        content: query.data,
        timestamp: new Date(),
        direction: 'incoming',
        messageType: 'interactive',
        metadata: {
          interactionType: 'button_click',
          callbackData: query.data,
        },
      }
    }

    throw new PlatformError('parse', 'Unable to parse Telegram update', { update })
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
        throw new PlatformError('api', `Failed to get user info: ${data.description}`, {
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
      throw new PlatformError('api', `Failed to get file: ${data.description}`, {
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
      throw new PlatformError('connection', 'Not connected to Telegram. Call connect() first.')
    }
  }

  /**
   * Handle and normalize errors
   */
  private handleError(error: any): PlatformError {
    if (error instanceof PlatformError) {
      return error
    }

    return new PlatformError('unknown', error.message || 'Unknown Telegram error', {
      originalError: error,
    })
  }
}
