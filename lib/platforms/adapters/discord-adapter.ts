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

  getCapabilities(): PlatformCapabilities {
    return {
      supportsRichContent: true,
      supportsButtons: true,
      supportsCarousels: false,
      supportsAttachments: true,
      supportsVoice: false,
      supportsVideo: false,
      supportsLocation: false,
      supportsTemplates: false,
      supportsTypingIndicator: true,
      supportsReadReceipts: false,
      maxMessageLength: 2000,
      maxButtonsPerMessage: 5,
      supportedAttachmentTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'video/mp4',
        'application/pdf',
      ],
    }
  }

  async connect(credentials: PlatformCredentials): Promise<void> {
    this.validateCredentials(credentials)

    const discordCreds = credentials.discord as DiscordCredentials
    this.botToken = discordCreds.bot_token
    this.applicationId = discordCreds.application_id
    this.publicKey = discordCreds.public_key || ''

    // Test connection by fetching bot user
    try {
      const response = await this.makeRequest('users/@me')

      this.connected = true
      this.connectionStatus = {
        connected: true,
        lastChecked: new Date(),
        platform: 'discord',
      }

      console.log(`Connected to Discord as ${response.username}#${response.discriminator}`)
    } catch (error) {
      this.connected = false
      throw this.handleError(error)
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false
    this.botToken = ''
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest('users/@me')
      return !!response.id
    } catch {
      return false
    }
  }

  async sendMessage(message: UnifiedMessage): Promise<string> {
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
            label: btn.text,
            url: btn.url,
            custom_id: btn.value || btn.text.replace(/\s/g, '_'),
          })),
        },
      ]
    }

    try {
      const response = await this.makeRequest(`channels/${message.recipientId}/messages`, payload, 'POST')
      return response.id
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async sendTypingIndicator(recipientId: string): Promise<void> {
    this.ensureConnected()
    await this.makeRequest(`channels/${recipientId}/typing`, {}, 'POST')
  }

  async parseWebhookEvent(event: any): Promise<UnifiedMessage> {
    // Handle Discord interaction (button click, slash command, etc.)
    if (event.type === 3) { // MESSAGE_COMPONENT
      return {
        id: event.id,
        platform: 'discord',
        senderId: event.member?.user?.id || event.user?.id,
        senderName: event.member?.user?.username || event.user?.username,
        recipientId: event.channel_id,
        content: event.data?.custom_id || '',
        timestamp: new Date(),
        direction: 'incoming',
        messageType: 'interactive',
        metadata: {
          interactionType: 'button_click',
          componentType: event.data?.component_type,
          customId: event.data?.custom_id,
        },
      }
    }

    // Handle regular message
    if (event.type === 0 && event.content) {
      // Skip bot messages
      if (event.author?.bot) {
        throw new PlatformError('parse', 'Ignoring bot message')
      }

      return {
        id: event.id,
        platform: 'discord',
        senderId: event.author.id,
        senderName: event.author.username,
        recipientId: event.channel_id,
        content: event.content,
        timestamp: new Date(event.timestamp),
        direction: 'incoming',
        messageType: 'text',
        metadata: {
          guildId: event.guild_id,
          channelId: event.channel_id,
        },
      }
    }

    throw new PlatformError('parse', 'Unsupported Discord event type', { event })
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

  async registerWebhook(webhookUrl: string): Promise<void> {
    console.log('Discord interactions are configured in the Discord Developer Portal')
    console.log(`Interactions Endpoint URL: ${webhookUrl}`)
    console.log('Required intents: GUILDS, GUILD_MESSAGES, MESSAGE_CONTENT, DIRECT_MESSAGES')
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
      throw new PlatformError('api', `Discord API error: ${error.message || response.statusText}`, { error })
    }

    return response.json()
  }

  private ensureConnected(): void {
    if (!this.connected || !this.botToken) {
      throw new PlatformError('connection', 'Not connected to Discord. Call connect() first.')
    }
  }

  private handleError(error: any): PlatformError {
    if (error instanceof PlatformError) return error
    return new PlatformError('unknown', error.message || 'Unknown Discord error', { originalError: error })
  }
}
