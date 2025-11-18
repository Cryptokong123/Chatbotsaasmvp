import { PlatformAdapter } from '../platform-adapter'
import { UnifiedMessage, PlatformCredentials, PlatformCapabilities, PlatformError } from '../types'

interface WhatsAppCredentials {
  phone_number_id: string
  access_token: string
  verify_token: string
  business_account_id?: string
}

/**
 * WhatsApp Business API Adapter
 *
 * Implements the PlatformAdapter for WhatsApp Cloud API
 * Documentation: https://developers.facebook.com/docs/whatsapp/cloud-api
 */
export class WhatsAppAdapter extends PlatformAdapter {
  private baseUrl: string = 'https://graph.facebook.com/v18.0'
  private phoneNumberId: string = ''
  private accessToken: string = ''
  private verifyToken: string = ''
  private connected: boolean = false

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
      supportsQuickReplies: true,
      supportsCards: false,
      supportsCarousel: false,
      supportsList: true,
      supportsTemplates: true,

      // Features
      supportsTypingIndicator: false,
      supportsReadReceipts: true,
      supportsDeliveryReceipts: true,
      supportsPresence: false,
      supportsThreads: false,
      supportsGroups: true,
      supportsChannels: true,
      supportsBroadcast: true,

      // Interactive
      supportsInteractiveMessages: true,
      supportsInlineQueries: false,
      supportsCommands: false,

      // Advanced
      supportsVoiceCalls: false,
      supportsVideoCalls: false,
      supportsScreenSharing: false,
      supportsPayments: true,
      supportsE2EEncryption: true,

      // Limits
      maxMessageLength: 4096,
      maxAttachmentSize: 16777216, // 16 MB
      maxButtons: 3,
      maxQuickReplies: 10,
      maxCarouselCards: 0,
    }
  }

  async connect(): Promise<any> {
    // Return connection info
    return {
      connected: this.connected,
      platform: 'whatsapp',
      status: 'connected',
      timestamp: new Date(),
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false
    this.phoneNumberId = ''
    this.accessToken = ''
  }

  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}`, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      })
      return {
        success: response.ok,
        message: response.ok ? 'Connected successfully' : 'Connection failed',
        details: { status: response.status }
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
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: message.conversationId,
      type: 'text',
      text: { body: message.content },
    }

    // Add interactive buttons if present
    if (message.richContent?.buttons && message.richContent.buttons.length > 0) {
      payload.type = 'interactive'
      payload.interactive = {
        type: 'button',
        body: { text: message.content },
        action: {
          buttons: message.richContent.buttons.slice(0, 3).map((btn, idx) => ({
            type: 'reply',
            reply: {
              id: btn.value || `btn_${idx}`,
              title: btn.label.substring(0, 20), // Max 20 chars
            },
          })),
        },
      }
      delete payload.text
    }

    try {
      const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        return {
          success: false,
          deliveryStatus: 'failed',
          timestamp: new Date(),
          error: {
            code: 'SEND_FAILED',
            message: `WhatsApp API error: ${data.error?.message || 'Unknown error'}`,
            retryable: true
          }
        }
      }

      return {
        success: true,
        messageId: message.id,
        platformMessageId: data.messages[0].id,
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
    const entry = event.entry?.[0]
    const change = entry?.changes?.[0]
    const value = change?.value

    if (!value?.messages || value.messages.length === 0) {
      throw new PlatformError('No messages in webhook payload', 'parse', 'whatsapp', false, { event })
    }

    const message = value.messages[0]
    const contact = value.contacts?.[0]

    const unifiedMessage: any = {
      id: message.id,
      platform: 'whatsapp',
      type: 'text',
      senderId: message.from,
      senderName: contact?.profile?.name || message.from,
      senderType: 'user',
      conversationId: message.from,
      content: message.text?.body || '',
      timestamp: new Date(parseInt(message.timestamp) * 1000),
      direction: 'incoming',
      metadata: {
        messageType: message.type,
        phoneNumberId: value.metadata.phone_number_id,
      },
    }

    // Handle different message types
    if (message.type === 'interactive') {
      unifiedMessage.content = message.interactive.button_reply?.title || message.interactive.list_reply?.title || ''
      unifiedMessage.type = 'interactive'
      unifiedMessage.metadata.interactionType = message.interactive.type
      unifiedMessage.metadata.interactionId = message.interactive.button_reply?.id || message.interactive.list_reply?.id
    } else if (message.type === 'image' || message.type === 'video' || message.type === 'audio' || message.type === 'document') {
      unifiedMessage.type = 'media'
      unifiedMessage.attachments = [
        {
          type: message.type === 'document' ? 'file' : message.type,
          url: message[message.type].id, // File ID that needs to be resolved
          mimeType: message[message.type].mime_type,
        },
      ]
      unifiedMessage.content = message[message.type].caption || ''
    } else if (message.type === 'location') {
      unifiedMessage.type = 'location'
      unifiedMessage.metadata.location = {
        latitude: message.location.latitude,
        longitude: message.location.longitude,
        name: message.location.name,
        address: message.location.address,
      }
    }

    return [unifiedMessage]
  }

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // WhatsApp uses hub.verify_token for verification
    return signature === this.verifyToken
  }

  async registerWebhook(webhookUrl: string, secret?: string): Promise<{ success: boolean; webhookId?: string; verificationToken?: string; error?: string }> {
    // WhatsApp webhook registration is done via Meta Developer Console
    console.log('WhatsApp webhooks must be configured in Meta Developer Console')
    console.log(`Webhook URL: ${webhookUrl}`)
    console.log(`Verify Token: ${this.verifyToken}`)
    return {
      success: true,
      webhookId: 'manual-configuration',
      verificationToken: this.verifyToken,
    }
  }

  private ensureConnected(): void {
    if (!this.connected || !this.phoneNumberId || !this.accessToken) {
      throw new PlatformError('Not connected to WhatsApp. Call connect() first.', 'connection', 'whatsapp')
    }
  }

  private handleError(error: any): PlatformError {
    if (error instanceof PlatformError) return error
    return new PlatformError(error.message || 'Unknown WhatsApp error', 'unknown', 'whatsapp', false, { originalError: error })
  }

  getSetupGuide(): any[] {
    return [
      {
        step: 1,
        title: 'Create WhatsApp Business Account',
        description: 'Create a WhatsApp Business Account via Meta Business Suite'
      },
      {
        step: 2,
        title: 'Get API Credentials',
        description: 'Obtain phone_number_id, access_token, and verify_token from Meta Developer Console'
      },
      {
        step: 3,
        title: 'Configure Webhook',
        description: 'Set up webhook URL and verify token in Meta Developer Console'
      }
    ]
  }

  protected getDefaultConfig(userConfig: any): any {
    return {
      ...userConfig,
      webhookUrl: userConfig.webhookUrl || '',
      phoneNumberId: userConfig.phoneNumberId || '',
      accessToken: userConfig.accessToken || ''
    }
  }

  async validateCredentials(credentials: any): Promise<{ valid: boolean; error?: string }> {
    if (!credentials.phone_number_id) {
      return { valid: false, error: 'Phone number ID is required' }
    }
    if (!credentials.access_token) {
      return { valid: false, error: 'Access token is required' }
    }
    if (!credentials.verify_token) {
      return { valid: false, error: 'Verify token is required' }
    }
    return { valid: true }
  }

  handleWebhookChallenge(query: any, body: any): any {
    // WhatsApp uses hub.mode, hub.verify_token, hub.challenge
    if (query['hub.mode'] === 'subscribe' && query['hub.verify_token'] === this.verifyToken) {
      return { challenge: query['hub.challenge'] }
    }
    return {}
  }

  receiveMessage(rawMessage: any): any {
    const entry = rawMessage.entry?.[0]
    const change = entry?.changes?.[0]
    const value = change?.value
    const message = value?.messages?.[0]
    const contact = value?.contacts?.[0]

    return {
      id: message?.id || Date.now().toString(),
      platform: 'whatsapp',
      type: 'text',
      content: message?.text?.body || '',
      senderId: message?.from || '',
      senderType: 'user',
      conversationId: message?.from || '',
      timestamp: new Date(parseInt(message?.timestamp || Date.now()) * 1000),
      direction: 'incoming',
      raw: rawMessage
    }
  }
}
