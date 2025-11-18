import { PlatformAdapter } from '../platform-adapter'
import { UnifiedMessage, PlatformCredentials, PlatformCapabilities, PlatformError } from '../types'

interface SlackCredentials {
  bot_token: string
  signing_secret: string
  app_id?: string
}

/**
 * Slack Bot API Adapter
 *
 * Implements the PlatformAdapter for Slack
 * Documentation: https://api.slack.com/
 */
export class SlackAdapter extends PlatformAdapter {
  private baseUrl: string = 'https://slack.com/api'
  private botToken: string = ''
  private signingSecret: string = ''
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
      supportsStickers: false,

      // Rich Content
      supportsButtons: true,
      supportsQuickReplies: false,
      supportsCards: true,
      supportsCarousel: false,
      supportsList: false,
      supportsTemplates: false,

      // Features
      supportsTypingIndicator: false,
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
      supportsVoiceCalls: false,
      supportsVideoCalls: false,
      supportsScreenSharing: false,
      supportsPayments: false,
      supportsE2EEncryption: false,

      // Limits
      maxMessageLength: 40000,
      maxAttachmentSize: 1073741824, // 1 GB
      maxButtons: 5,
      maxQuickReplies: 0,
      maxCarouselCards: 0,
    }
  }

  async connect(): Promise<any> {
    // Return connection info
    return {
      connected: this.connected,
      platform: 'slack',
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
      const response = await this.makeRequest('auth.test')
      return {
        success: response.ok === true,
        message: response.ok ? 'Connected successfully' : 'Connection failed',
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
      channel: message.conversationId,
      text: message.content,
    }

    // Add blocks for rich formatting
    if (message.richContent?.buttons && message.richContent.buttons.length > 0) {
      payload.blocks = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message.content,
          },
        },
        {
          type: 'actions',
          elements: message.richContent.buttons.map((btn) => ({
            type: 'button',
            text: {
              type: 'plain_text',
              text: btn.label,
            },
            value: btn.value || btn.label,
            action_id: btn.value || btn.label.replace(/\s/g, '_'),
          })),
        },
      ]
    }

    try {
      const response = await this.makeRequest('chat.postMessage', payload)

      if (!response.ok) {
        return {
          success: false,
          deliveryStatus: 'failed',
          timestamp: new Date(),
          error: {
            code: 'SEND_FAILED',
            message: `Slack API error: ${response.error}`,
            retryable: true
          }
        }
      }

      return {
        success: true,
        messageId: message.id,
        platformMessageId: response.ts,
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

  parseWebhookEvent(event: any): any[] {
    // Handle URL verification challenge
    if (event.type === 'url_verification') {
      throw new PlatformError('URL verification event', 'parse', 'slack', false, { challenge: event.challenge })
    }

    // Handle event callbacks
    if (event.type === 'event_callback') {
      const slackEvent = event.event

      if (slackEvent.type === 'message' && !slackEvent.bot_id) {
        return [{
          id: slackEvent.client_msg_id || slackEvent.ts,
          platform: 'slack',
          type: 'text',
          senderId: slackEvent.user,
          senderName: slackEvent.user,
          senderType: 'user',
          conversationId: slackEvent.channel,
          content: slackEvent.text || '',
          timestamp: new Date(parseFloat(slackEvent.ts) * 1000),
          direction: 'incoming',
          metadata: {
            channel: slackEvent.channel,
            channelType: slackEvent.channel_type,
            threadTs: slackEvent.thread_ts,
          },
        }]
      }

      // Handle button clicks (interactive messages)
      if (slackEvent.type === 'block_actions') {
        const action = slackEvent.actions[0]
        return [{
          id: slackEvent.message?.ts || Date.now().toString(),
          platform: 'slack',
          type: 'interactive',
          senderId: slackEvent.user.id,
          senderName: slackEvent.user.name,
          senderType: 'user',
          conversationId: slackEvent.channel.id,
          content: action.value || action.text?.text || '',
          timestamp: new Date(),
          direction: 'incoming',
          metadata: {
            actionId: action.action_id,
            blockId: action.block_id,
          },
        }]
      }
    }

    throw new PlatformError('Unsupported Slack event type', 'parse', 'slack', false, { event })
  }

  verifyWebhookSignature(payload: string, signature: string, timestamp: string): boolean {
    const crypto = require('crypto')
    const baseString = `v0:${timestamp}:${payload}`
    const mySignature = 'v0=' + crypto
      .createHmac('sha256', this.signingSecret)
      .update(baseString)
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(mySignature)
    )
  }

  async registerWebhook(webhookUrl: string): Promise<{ success: boolean; webhookId?: string; verificationToken?: string; error?: string }> {
    console.log('Slack webhooks are configured in the Slack App Dashboard')
    console.log(`Event Subscriptions URL: ${webhookUrl}`)
    console.log('Required scopes: chat:write, im:history, im:read')
    return {
      success: true,
      webhookId: 'manual-configuration',
    }
  }

  private async makeRequest(method: string, payload?: any): Promise<any> {
    const url = `${this.baseUrl}/${method}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.botToken}`,
        'Content-Type': 'application/json',
      },
      body: payload ? JSON.stringify(payload) : undefined,
    })

    return response.json()
  }

  private ensureConnected(): void {
    if (!this.connected || !this.botToken) {
      throw new PlatformError('Not connected to Slack. Call connect() first.', 'connection', 'slack')
    }
  }

  private handleError(error: any): PlatformError {
    if (error instanceof PlatformError) return error
    return new PlatformError(error.message || 'Unknown Slack error', 'unknown', 'slack', false, { originalError: error })
  }

  getSetupGuide(): any[] {
    return [
      {
        step: 1,
        title: 'Create Slack App',
        description: 'Create a new Slack app in the Slack App Directory'
      },
      {
        step: 2,
        title: 'Add Bot Token',
        description: 'Add a bot user OAuth token to your app'
      },
      {
        step: 3,
        title: 'Configure Permissions',
        description: 'Set required bot token scopes'
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
    return { challenge: body.challenge }
  }

  receiveMessage(rawMessage: any): any {
    return {
      id: rawMessage.ts,
      platform: 'slack',
      type: 'text',
      content: rawMessage.text,
      senderId: rawMessage.user,
      senderType: 'user',
      conversationId: rawMessage.channel,
      timestamp: new Date(parseFloat(rawMessage.ts) * 1000),
      direction: 'incoming',
      raw: rawMessage
    }
  }
}
