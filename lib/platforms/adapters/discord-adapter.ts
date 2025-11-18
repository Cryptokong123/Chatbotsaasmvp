import { PlatformAdapter } from '../platform-adapter'
import { UnifiedMessage, PlatformCredentials, PlatformCapabilities, PlatformError } from '../types'

interface DiscordCredentials {
  bot_token: string
  application_id: string
  public_key?: string
}

/**
 * Discord Bot API Adapter
 *
 * Implements the PlatformAdapter for Discord
 * Documentation: https://discord.com/developers/docs/
 */
export class DiscordAdapter extends PlatformAdapter {
  private baseUrl: string = 'https://discord.com/api/v10'
  private botToken: string = ''
  private applicationId: string = ''
  private publicKey: string = ''
  private connected: boolean = false

  getCapabilities(): PlatformCapabilities {
    return {
      // Message Types
      supportsText: true,
      supportsImages: true,
      supportsVideos: true,
      supportsAudio: true,
      supportsFiles: true,
      supportsLocation: false,
      supportsContacts: false,
      supportsStickers: true,

      // Rich Content
      supportsButtons: true,
      supportsQuickReplies: false,
      supportsCards: true,
      supportsCarousel: false,
      supportsList: false,
      supportsTemplates: false,

      // Features
      supportsTypingIndicator: true,
      supportsReadReceipts: false,
      supportsDeliveryReceipts: false,
      supportsPresence: true,
      supportsThreads: true,
      supportsGroups: true,
      supportsChannels: true,
      supportsBroadcast: false,

      // Interactive
      supportsInteractiveMessages: true,
      supportsInlineQueries: false,
      supportsCommands: true,

      // Advanced
      supportsVoiceCalls: true,
      supportsVideoCalls: true,
      supportsScreenSharing: false,
      supportsPayments: false,
      supportsE2EEncryption: false,

      // Limits
      maxMessageLength: 2000,
      maxAttachmentSize: 8388608, // 8 MB
      maxButtons: 5,
      maxQuickReplies: 0,
      maxCarouselCards: 0,
    }
  }

  async connect(): Promise<any> {
    // Return connection info
    return {
      connected: this.connected,
      platform: 'discord',
      status: 'connected',
      timestamp: new Date(),
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false
    this.botToken = ''
  }

  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const response = await this.makeRequest('users/@me')
      return {
        success: !!response.id,
        message: response.id ? 'Connected successfully' : 'Connection failed',
        details: response
      }
    } catch (error: any) {
      return {
        success: false,
        message: error?.message || 'Connection failed',
        details: error
      }
    }
  }

  async sendMessage(message: UnifiedMessage): Promise<any> {
    this.ensureConnected()

    const payload: any = {
      content: message.content,
    }

    // Add components (buttons) if present
    if (message.richContent?.buttons && message.richContent.buttons.length > 0) {
      payload.components = [
        {
          type: 1, // Action Row
          components: message.richContent.buttons.map((btn) => ({
            type: 2, // Button
            style: btn.url ? 5 : 1, // Link button : Primary button
            label: btn.label,
            url: btn.url,
            custom_id: btn.value || btn.label.replace(/\s/g, '_'),
          })),
        },
      ]
    }

    try {
      const response = await this.makeRequest(`channels/${message.conversationId}/messages`, payload, 'POST')
      return {
        success: true,
        messageId: message.id,
        platformMessageId: response.id,
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

  async sendTypingIndicator(conversationId: string): Promise<void> {
    this.ensureConnected()
    await this.makeRequest(`channels/${conversationId}/typing`, {}, 'POST')
  }

  parseWebhookEvent(event: any): any[] {
    // Handle Discord interaction (button click, slash command, etc.)
    if (event.type === 3) { // MESSAGE_COMPONENT
      return [{
        id: event.id,
        platform: 'discord',
        type: 'interactive',
        senderId: event.member?.user?.id || event.user?.id,
        senderName: event.member?.user?.username || event.user?.username,
        senderType: 'user',
        conversationId: event.channel_id,
        content: event.data?.custom_id || '',
        timestamp: new Date(),
        direction: 'incoming',
        metadata: {
          interactionType: 'button_click',
          componentType: event.data?.component_type,
          customId: event.data?.custom_id,
        },
      }]
    }

    // Handle regular message
    if (event.type === 0 && event.content) {
      // Skip bot messages
      if (event.author?.bot) {
        throw new PlatformError('Ignoring bot message', 'parse', 'discord')
      }

      return [{
        id: event.id,
        platform: 'discord',
        type: 'text',
        senderId: event.author.id,
        senderName: event.author.username,
        senderType: 'user',
        conversationId: event.channel_id,
        content: event.content,
        timestamp: new Date(event.timestamp),
        direction: 'incoming',
        metadata: {
          guildId: event.guild_id,
          channelId: event.channel_id,
        },
      }]
    }

    throw new PlatformError('Unsupported Discord event type', 'parse', 'discord', false, { event })
  }

  verifyWebhookSignature(body: string, signature: string, timestamp: string): boolean {
    const crypto = require('crypto')
    const isVerified = crypto.verify(
      'sha256',
      Buffer.from(timestamp + body),
      {
        key: this.publicKey,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      },
      Buffer.from(signature, 'hex')
    )

    return isVerified
  }

  async registerWebhook(webhookUrl: string): Promise<{ success: boolean; webhookId?: string; verificationToken?: string; error?: string }> {
    console.log('Discord interactions are configured in the Discord Developer Portal')
    console.log(`Interactions Endpoint URL: ${webhookUrl}`)
    console.log('Required intents: GUILDS, GUILD_MESSAGES, MESSAGE_CONTENT, DIRECT_MESSAGES')
    return {
      success: true,
      webhookId: 'manual-configuration',
    }
  }

  private async makeRequest(endpoint: string, payload?: any, method: string = 'GET'): Promise<any> {
    const url = `${this.baseUrl}/${endpoint}`

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bot ${this.botToken}`,
        'Content-Type': 'application/json',
      },
      body: payload ? JSON.stringify(payload) : undefined,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new PlatformError(`Discord API error: ${error.message || response.statusText}`, 'api', 'discord', false, { error })
    }

    return response.json()
  }

  private ensureConnected(): void {
    if (!this.connected || !this.botToken) {
      throw new PlatformError('Not connected to Discord. Call connect() first.', 'connection', 'discord')
    }
  }

  private handleError(error: any): PlatformError {
    if (error instanceof PlatformError) return error
    return new PlatformError(error.message || 'Unknown Discord error', 'unknown', 'discord', false, { originalError: error })
  }

  getSetupGuide(): any[] {
    return [
      {
        step: 1,
        title: 'Create Discord Application',
        description: 'Create a new application in Discord Developer Portal'
      },
      {
        step: 2,
        title: 'Add Bot',
        description: 'Add a bot user to your application'
      },
      {
        step: 3,
        title: 'Configure Permissions',
        description: 'Set required bot permissions'
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
    return { challenge: query.challenge || body.challenge }
  }

  receiveMessage(rawMessage: any): any {
    return {
      id: rawMessage.id,
      platform: 'discord',
      type: 'text',
      content: rawMessage.content,
      sender: {
        id: rawMessage.author?.id,
        name: rawMessage.author?.username
      },
      timestamp: new Date(rawMessage.timestamp),
      raw: rawMessage
    }
  }
}
