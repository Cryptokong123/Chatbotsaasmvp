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

  getCapabilities(): PlatformCapabilities {
    return {
      supportsRichContent: true,
      supportsButtons: true,
      supportsCarousels: true,
      supportsAttachments: true,
      supportsVoice: true,
      supportsVideo: true,
      supportsLocation: true,
      supportsTemplates: true,
      supportsTypingIndicator: false,
      supportsReadReceipts: true,
      maxMessageLength: 4096,
      maxButtonsPerMessage: 3,
      supportedAttachmentTypes: [
        'image/jpeg',
        'image/png',
        'video/mp4',
        'audio/mpeg',
        'audio/ogg',
        'application/pdf',
      ],
    }
  }

  async connect(credentials: PlatformCredentials): Promise<void> {
    this.validateCredentials(credentials)

    const whatsappCreds = credentials.whatsapp as WhatsAppCredentials
    this.phoneNumberId = whatsappCreds.phone_number_id
    this.accessToken = whatsappCreds.access_token
    this.verifyToken = whatsappCreds.verify_token

    this.connected = true
    this.connectionStatus = {
      connected: true,
      lastChecked: new Date(),
      platform: 'whatsapp',
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false
    this.phoneNumberId = ''
    this.accessToken = ''
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}`, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      })
      return response.ok
    } catch {
      return false
    }
  }

  async sendMessage(message: UnifiedMessage): Promise<string> {
    this.ensureConnected()

    const payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: message.recipientId,
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
              title: btn.text.substring(0, 20), // Max 20 chars
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
        throw new PlatformError('send', `WhatsApp API error: ${data.error?.message || 'Unknown error'}`, { response: data })
      }

      return data.messages[0].id
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async parseWebhookEvent(event: any): Promise<UnifiedMessage> {
    const entry = event.entry?.[0]
    const change = entry?.changes?.[0]
    const value = change?.value

    if (!value?.messages || value.messages.length === 0) {
      throw new PlatformError('parse', 'No messages in webhook payload')
    }

    const message = value.messages[0]
    const contact = value.contacts?.[0]

    const unifiedMessage: UnifiedMessage = {
      id: message.id,
      platform: 'whatsapp',
      senderId: message.from,
      senderName: contact?.profile?.name || message.from,
      recipientId: value.metadata.phone_number_id,
      content: message.text?.body || '',
      timestamp: new Date(parseInt(message.timestamp) * 1000),
      direction: 'incoming',
      messageType: 'text',
      metadata: {
        messageType: message.type,
      },
    }

    // Handle different message types
    if (message.type === 'interactive') {
      unifiedMessage.content = message.interactive.button_reply?.title || message.interactive.list_reply?.title || ''
      unifiedMessage.messageType = 'interactive'
      unifiedMessage.metadata.interactionType = message.interactive.type
      unifiedMessage.metadata.interactionId = message.interactive.button_reply?.id || message.interactive.list_reply?.id
    } else if (message.type === 'image' || message.type === 'video' || message.type === 'audio' || message.type === 'document') {
      unifiedMessage.messageType = 'media'
      unifiedMessage.attachments = [
        {
          type: message.type === 'document' ? 'file' : message.type,
          url: message[message.type].id, // File ID that needs to be resolved
          mimeType: message[message.type].mime_type,
        },
      ]
      unifiedMessage.content = message[message.type].caption || ''
    } else if (message.type === 'location') {
      unifiedMessage.messageType = 'location'
      unifiedMessage.metadata.location = {
        latitude: message.location.latitude,
        longitude: message.location.longitude,
        name: message.location.name,
        address: message.location.address,
      }
    }

    return unifiedMessage
  }

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    // WhatsApp uses hub.verify_token for verification
    return signature === this.verifyToken
  }

  async registerWebhook(webhookUrl: string, secret?: string): Promise<void> {
    // WhatsApp webhook registration is done via Meta Developer Console
    console.log('WhatsApp webhooks must be configured in Meta Developer Console')
    console.log(`Webhook URL: ${webhookUrl}`)
    console.log(`Verify Token: ${this.verifyToken}`)
  }

  private ensureConnected(): void {
    if (!this.connected || !this.phoneNumberId || !this.accessToken) {
      throw new PlatformError('connection', 'Not connected to WhatsApp. Call connect() first.')
    }
  }

  private handleError(error: any): PlatformError {
    if (error instanceof PlatformError) return error
    return new PlatformError('unknown', error.message || 'Unknown WhatsApp error', { originalError: error })
  }
}
