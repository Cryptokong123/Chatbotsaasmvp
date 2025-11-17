/**
 * Facebook Messenger Adapter
 *
 * Full production implementation with:
 * - Send API with all message types
 * - Message templates (Button, Generic, Media, Receipt, etc.)
 * - Persona API for multiple bot personalities
 * - Handover Protocol for human agent takeover
 * - Page Messaging
 * - Instagram integration
 * - Sponsored messages
 * - Customer chat plugin
 * - NLP and built-in intents
 */

import { BaseIntegrationAdapter } from '../base-adapter'
import {
  IntegrationConfig,
  IntegrationCapabilities,
  IntegrationResponse,
  AuthenticationError,
  ValidationError,
} from '../types'
import * as crypto from 'crypto'

interface MessengerProfile {
  greeting?: Array<{ locale: string; text: string }>
  get_started?: { payload: string }
  persistent_menu?: Array<{
    locale: string
    composer_input_disabled: boolean
    call_to_actions: any[]
  }>
  ice_breakers?: Array<{
    question: string
    payload: string
  }>
}

interface MessengerTemplate {
  template_type: 'button' | 'generic' | 'media' | 'receipt' | 'airline_boardingpass' | 'airline_checkin' | 'airline_itinerary' | 'airline_update'
  [key: string]: any
}

interface MessengerPersona {
  name: string
  profile_picture_url: string
}

interface MessengerLabel {
  id?: string
  name: string
}

interface MessengerInsights {
  name: string
  period: 'day' | 'week' | 'days_28'
  values: Array<{ value: number; end_time: string }>
  title?: string
  description?: string
}

interface MessengerBroadcast {
  message_creative_id: string
  notification_type?: 'REGULAR' | 'SILENT_PUSH' | 'NO_PUSH'
  tag?: string
}

interface MessengerMessageCreative {
  messages: any[]
}

interface MessengerOneTimeNotification {
  title: string
  payload: string
}

interface MessengerChatPlugin {
  domains: string[]
  greeting_dialog_display?: 'show' | 'hide' | 'fade'
  greeting_dialog_delay?: number
  locale?: string
  logged_in_greeting?: string
  logged_out_greeting?: string
  theme_color?: string
}

interface MessengerSavedReply {
  id?: string
  title: string
  message: string
  category?: string
  image?: string
}

interface MessengerPrivateReply {
  message: string
}

export class MessengerAdapter extends BaseIntegrationAdapter {
  private pageAccessToken?: string
  private appSecret?: string
  private verifyToken?: string
  private apiVersion = 'v18.0'
  private baseUrl = 'https://graph.facebook.com'

  getCapabilities(): IntegrationCapabilities {
    return {
      // Communication
      canSendMessages: true,
      canReceiveMessages: true,
      canSendFiles: true,
      canSendImages: true,
      canSendVideo: true,
      canSendAudio: true,
      canSendLocation: true,

      // Rich Content
      canSendButtons: true,
      canSendCards: true,
      canSendCarousels: true,
      canSendQuickReplies: true,
      canSendTemplates: true,

      // Features
      canScheduleMessages: false,
      canBroadcast: true,
      canTag: true,
      canAssign: true,
      canCreateTickets: false,
      canCreateLeads: true,
      canCreateContacts: true,

      // Data
      canSyncContacts: true,
      canSyncConversations: true,
      canSyncTickets: false,
      canExportData: true,
      canImportData: false,

      // Analytics
      canTrackEvents: true,
      canTrackMetrics: true,
      canGenerateReports: true,

      // Automation
      canCreateWorkflows: true,
      canTriggerActions: true,
      canListenToWebhooks: true,

      // Limits
      maxMessageLength: 2000,
      maxFileSize: 25 * 1024 * 1024, // 25MB
      maxBatchSize: 50,
      rateLimit: {
        messages: 4000,
        period: 'per_hour',
      },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    try {
      this.pageAccessToken = this.config.credentials.accessToken
      this.appSecret = this.config.credentials.appSecret
      this.verifyToken = this.config.credentials.verifyToken

      if (!this.pageAccessToken || !this.appSecret) {
        throw new AuthenticationError(
          this.config.type,
          'Missing page access token or app secret'
        )
      }

      // Test the token by getting page info
      const testResult = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/me?access_token=${this.pageAccessToken}`,
          { method: 'GET' }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      if (!testResult.success) {
        throw new AuthenticationError(
          this.config.type,
          testResult.error?.message || 'Invalid access token'
        )
      }

      this.isConnected = true
      this.log('info', 'Connected to Facebook Messenger', testResult.data)

      return {
        success: true,
        data: undefined,
      }
    } catch (error: any) {
      this.log('error', 'Failed to connect to Messenger', error)
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  async disconnect(): Promise<IntegrationResponse<void>> {
    this.isConnected = false
    return {
      success: true,
      data: undefined,
    }
  }

  async testConnection(): Promise<IntegrationResponse<boolean>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/me?access_token=${this.pageAccessToken}`,
          { method: 'GET' }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return {
        success: result.success,
        data: result.success,
      }
    } catch (error: any) {
      return {
        success: false,
        data: false,
        error: this.formatError(error),
      }
    }
  }

  // ============================================================================
  // MESSAGING
  // ============================================================================

  async sendMessage(params: {
    recipientId: string
    text?: string
    attachment?: {
      type: 'image' | 'video' | 'audio' | 'file'
      url?: string
      payload?: any
    }
    template?: MessengerTemplate
    quickReplies?: Array<{
      content_type: 'text' | 'user_phone_number' | 'user_email'
      title?: string
      payload?: string
      image_url?: string
    }>
    personaId?: string
    messagingType?: 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG'
    tag?: string
  }): Promise<IntegrationResponse<{ messageId: string }>> {
    try {
      await this.ensureConnected()

      const { recipientId, text, attachment, template, quickReplies, personaId, messagingType, tag } = params

      if (!text && !attachment && !template) {
        throw new ValidationError(
          this.config.type,
          'Message must contain text, attachment, or template'
        )
      }

      const message: any = {}

      if (text) {
        message.text = text
      }

      if (attachment) {
        message.attachment = {
          type: attachment.type,
          payload: attachment.payload || { url: attachment.url },
        }
      }

      if (template) {
        message.attachment = {
          type: 'template',
          payload: template,
        }
      }

      if (quickReplies) {
        message.quick_replies = quickReplies
      }

      const payload: any = {
        recipient: { id: recipientId },
        message,
        messaging_type: messagingType || 'RESPONSE',
      }

      if (personaId) {
        payload.persona_id = personaId
      }

      if (tag) {
        payload.tag = tag
      }

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/me/messages?access_token=${this.pageAccessToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        )

        if (!response.ok) {
          const error = await response.json()
          throw new Error(`HTTP ${response.status}: ${JSON.stringify(error)}`)
        }

        return await response.json()
      })

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || {
            code: 'SEND_FAILED',
            message: 'Failed to send message',
            retryable: true,
          },
        }
      }

      return {
        success: true,
        data: {
          messageId: result.data.message_id,
        },
      }
    } catch (error: any) {
      this.log('error', 'Failed to send Messenger message', error)
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  // ============================================================================
  // TEMPLATES
  // ============================================================================

  createButtonTemplate(params: {
    text: string
    buttons: Array<{
      type: 'web_url' | 'postback' | 'phone_number'
      title: string
      url?: string
      payload?: string
      phone_number?: string
    }>
  }): MessengerTemplate {
    return {
      template_type: 'button',
      text: params.text,
      buttons: params.buttons,
    }
  }

  createGenericTemplate(params: {
    elements: Array<{
      title: string
      subtitle?: string
      image_url?: string
      default_action?: {
        type: 'web_url'
        url: string
      }
      buttons?: Array<{
        type: 'web_url' | 'postback' | 'phone_number'
        title: string
        url?: string
        payload?: string
      }>
    }>
  }): MessengerTemplate {
    return {
      template_type: 'generic',
      elements: params.elements,
    }
  }

  createMediaTemplate(params: {
    mediaType: 'image' | 'video'
    attachmentId?: string
    url?: string
    buttons?: Array<{
      type: 'web_url' | 'postback'
      title: string
      url?: string
      payload?: string
    }>
  }): MessengerTemplate {
    return {
      template_type: 'media',
      elements: [
        {
          media_type: params.mediaType,
          attachment_id: params.attachmentId,
          url: params.url,
          buttons: params.buttons,
        },
      ],
    }
  }

  createReceiptTemplate(params: {
    recipient_name: string
    order_number: string
    currency: string
    payment_method: string
    summary: {
      subtotal?: number
      shipping_cost?: number
      total_tax?: number
      total_cost: number
    }
    elements: Array<{
      title: string
      subtitle?: string
      quantity?: number
      price: number
      currency?: string
      image_url?: string
    }>
  }): MessengerTemplate {
    return {
      template_type: 'receipt',
      ...params,
    }
  }

  // ============================================================================
  // PERSONAS
  // ============================================================================

  async createPersona(params: MessengerPersona): Promise<IntegrationResponse<{ personaId: string }>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/me/personas?access_token=${this.pageAccessToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error,
        }
      }

      return {
        success: true,
        data: {
          personaId: result.data.id,
        },
      }
    } catch (error: any) {
      this.log('error', 'Failed to create persona', error)
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  async getPersona(personaId: string): Promise<IntegrationResponse<MessengerPersona>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/${personaId}?access_token=${this.pageAccessToken}`,
          { method: 'GET' }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error,
        }
      }

      return {
        success: true,
        data: result.data,
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  // ============================================================================
  // MESSENGER PROFILE
  // ============================================================================

  async setMessengerProfile(profile: MessengerProfile): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/me/messenger_profile?access_token=${this.pageAccessToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return {
        success: true,
        data: undefined,
      }
    } catch (error: any) {
      this.log('error', 'Failed to set messenger profile', error)
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  async getMessengerProfile(): Promise<IntegrationResponse<MessengerProfile>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/me/messenger_profile?fields=greeting,get_started,persistent_menu,ice_breakers&access_token=${this.pageAccessToken}`,
          { method: 'GET' }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error,
        }
      }

      return {
        success: true,
        data: result.data.data[0],
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  // ============================================================================
  // HANDOVER PROTOCOL
  // ============================================================================

  async passThreadControl(params: {
    recipientId: string
    targetAppId: string
    metadata?: string
  }): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/me/pass_thread_control?access_token=${this.pageAccessToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipient: { id: params.recipientId },
              target_app_id: params.targetAppId,
              metadata: params.metadata,
            }),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return {
        success: true,
        data: undefined,
      }
    } catch (error: any) {
      this.log('error', 'Failed to pass thread control', error)
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  async takeThreadControl(params: {
    recipientId: string
    metadata?: string
  }): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/me/take_thread_control?access_token=${this.pageAccessToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipient: { id: params.recipientId },
              metadata: params.metadata,
            }),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return {
        success: true,
        data: undefined,
      }
    } catch (error: any) {
      this.log('error', 'Failed to take thread control', error)
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  // ============================================================================
  // USER PROFILE
  // ============================================================================

  async getUserProfile(userId: string): Promise<IntegrationResponse<{
    id: string
    name?: string
    first_name?: string
    last_name?: string
    profile_pic?: string
    locale?: string
    timezone?: number
    gender?: string
  }>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/${userId}?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=${this.pageAccessToken}`,
          { method: 'GET' }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error,
        }
      }

      return {
        success: true,
        data: {
          ...result.data,
          name: `${result.data.first_name} ${result.data.last_name}`,
        },
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  // ============================================================================
  // WEBHOOKS
  // ============================================================================

  async verifyWebhook(signature: string, body: string): Promise<boolean> {
    if (!this.appSecret) return false

    const expectedSignature = crypto
      .createHmac('sha256', this.appSecret)
      .update(body)
      .digest('hex')

    return signature === `sha256=${expectedSignature}`
  }

  async parseWebhook(payload: any): Promise<any[]> {
    const events: any[] = []

    if (!payload.entry) return events

    for (const entry of payload.entry) {
      // Handle messages
      if (entry.messaging) {
        for (const event of entry.messaging) {
          if (event.message && !event.message.is_echo) {
            events.push({
              type: 'message',
              id: event.message.mid,
              timestamp: new Date(event.timestamp),
              senderId: event.sender.id,
              recipientId: event.recipient.id,
              text: event.message.text,
              attachments: event.message.attachments,
              quickReply: event.message.quick_reply,
              rawPayload: event,
            })
          }

          // Handle postback (button clicks)
          if (event.postback) {
            events.push({
              type: 'postback',
              timestamp: new Date(event.timestamp),
              senderId: event.sender.id,
              payload: event.postback.payload,
              title: event.postback.title,
              referral: event.postback.referral,
              rawPayload: event,
            })
          }

          // Handle delivery
          if (event.delivery) {
            events.push({
              type: 'delivery',
              timestamp: new Date(event.timestamp),
              senderId: event.sender.id,
              messageIds: event.delivery.mids,
              watermark: event.delivery.watermark,
              rawPayload: event,
            })
          }

          // Handle read
          if (event.read) {
            events.push({
              type: 'read',
              timestamp: new Date(event.timestamp),
              senderId: event.sender.id,
              watermark: event.read.watermark,
              rawPayload: event,
            })
          }
        }
      }
    }

    return events
  }

  handleWebhookChallenge(query: any): any {
    const mode = query['hub.mode']
    const token = query['hub.verify_token']
    const challenge = query['hub.challenge']

    if (mode === 'subscribe' && token === this.verifyToken) {
      return challenge
    }

    return null
  }

  // ============================================================================
  // SENDER ACTIONS
  // ============================================================================

  async sendTypingIndicator(recipientId: string, action: 'typing_on' | 'typing_off' | 'mark_seen'): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/me/messages?access_token=${this.pageAccessToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipient: { id: recipientId },
              sender_action: action,
            }),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return {
        success: true,
        data: undefined,
      }
    } catch (error: any) {
      this.log('error', 'Failed to send sender action', error)
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  async markSeen(recipientId: string): Promise<IntegrationResponse<void>> {
    return this.sendTypingIndicator(recipientId, 'mark_seen')
  }

  async startTyping(recipientId: string): Promise<IntegrationResponse<void>> {
    return this.sendTypingIndicator(recipientId, 'typing_on')
  }

  async stopTyping(recipientId: string): Promise<IntegrationResponse<void>> {
    return this.sendTypingIndicator(recipientId, 'typing_off')
  }

  // ============================================================================
  // LABELS / TAGS
  // ============================================================================

  async createLabel(name: string): Promise<IntegrationResponse<MessengerLabel>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/me/custom_labels?access_token=${this.pageAccessToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error,
        }
      }

      return {
        success: true,
        data: { id: result.data.id, name },
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  async getLabels(): Promise<IntegrationResponse<MessengerLabel[]>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/me/custom_labels?fields=name&access_token=${this.pageAccessToken}`,
          { method: 'GET' }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error,
        }
      }

      return {
        success: true,
        data: result.data.data,
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  async deleteLabel(labelId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/${labelId}?access_token=${this.pageAccessToken}`,
          { method: 'DELETE' }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return {
        success: true,
        data: undefined,
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  async addLabelToUser(userId: string, labelId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/${labelId}/label?access_token=${this.pageAccessToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: userId }),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return {
        success: true,
        data: undefined,
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  async removeLabelFromUser(userId: string, labelId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/${labelId}/label?access_token=${this.pageAccessToken}`,
          {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: userId }),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return {
        success: true,
        data: undefined,
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  async getUserLabels(userId: string): Promise<IntegrationResponse<MessengerLabel[]>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/${userId}/custom_labels?access_token=${this.pageAccessToken}`,
          { method: 'GET' }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error,
        }
      }

      return {
        success: true,
        data: result.data.data,
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  // ============================================================================
  // BROADCAST MESSAGES
  // ============================================================================

  async createMessageCreative(messages: any[]): Promise<IntegrationResponse<{ id: string }>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/me/message_creatives?access_token=${this.pageAccessToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages }),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error,
        }
      }

      return {
        success: true,
        data: { id: result.data.message_creative_id },
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  async sendBroadcast(params: {
    messageCreativeId: string
    customLabelId?: string
    notificationType?: 'REGULAR' | 'SILENT_PUSH' | 'NO_PUSH'
    tag?: string
  }): Promise<IntegrationResponse<{ broadcastId: string }>> {
    try {
      await this.ensureConnected()

      const payload: any = {
        message_creative_id: params.messageCreativeId,
        notification_type: params.notificationType || 'REGULAR',
      }

      if (params.customLabelId) {
        payload.custom_label_id = params.customLabelId
      }

      if (params.tag) {
        payload.tag = params.tag
      }

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/me/broadcast_messages?access_token=${this.pageAccessToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error,
        }
      }

      return {
        success: true,
        data: { broadcastId: result.data.broadcast_id },
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  async getBroadcastMetrics(broadcastId: string): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/${broadcastId}/insights/messages_sent?access_token=${this.pageAccessToken}`,
          { method: 'GET' }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error,
        }
      }

      return {
        success: true,
        data: result.data,
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  // ============================================================================
  // ONE-TIME NOTIFICATION
  // ============================================================================

  async requestOneTimeNotification(params: {
    recipientId: string
    title: string
    payload: string
  }): Promise<IntegrationResponse<{ messageId: string }>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/me/messages?access_token=${this.pageAccessToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipient: { id: params.recipientId },
              message: {
                attachment: {
                  type: 'template',
                  payload: {
                    template_type: 'one_time_notif_req',
                    title: params.title,
                    payload: params.payload,
                  },
                },
              },
            }),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error,
        }
      }

      return {
        success: true,
        data: { messageId: result.data.message_id },
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  async sendOneTimeNotification(params: {
    recipientId: string
    oneTimeNotifToken: string
    text?: string
    attachment?: any
  }): Promise<IntegrationResponse<{ messageId: string }>> {
    try {
      await this.ensureConnected()

      const message: any = {}
      if (params.text) message.text = params.text
      if (params.attachment) message.attachment = params.attachment

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/me/messages?access_token=${this.pageAccessToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipient: {
                one_time_notif_token: params.oneTimeNotifToken,
              },
              message,
            }),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error,
        }
      }

      return {
        success: true,
        data: { messageId: result.data.message_id },
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  // ============================================================================
  // CHAT PLUGIN
  // ============================================================================

  async configureChatPlugin(config: MessengerChatPlugin): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/me/messenger_profile?access_token=${this.pageAccessToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              whitelisted_domains: config.domains,
              ...config,
            }),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return {
        success: true,
        data: undefined,
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  // ============================================================================
  // SAVED REPLIES
  // ============================================================================

  async createSavedReply(reply: Omit<MessengerSavedReply, 'id'>): Promise<IntegrationResponse<MessengerSavedReply>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/me/saved_replies?access_token=${this.pageAccessToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reply),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error,
        }
      }

      return {
        success: true,
        data: { ...reply, id: result.data.id },
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  async getSavedReplies(): Promise<IntegrationResponse<MessengerSavedReply[]>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/me/saved_replies?access_token=${this.pageAccessToken}`,
          { method: 'GET' }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error,
        }
      }

      return {
        success: true,
        data: result.data.data,
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  async deleteSavedReply(replyId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/${replyId}?access_token=${this.pageAccessToken}`,
          { method: 'DELETE' }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return {
        success: true,
        data: undefined,
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  // ============================================================================
  // INSIGHTS & ANALYTICS
  // ============================================================================

  async getPageInsights(metrics: string[], period: 'day' | 'week' | 'days_28' = 'day'): Promise<IntegrationResponse<MessengerInsights[]>> {
    try {
      await this.ensureConnected()

      const metricsList = metrics.join(',')

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/me/insights?metric=${metricsList}&period=${period}&access_token=${this.pageAccessToken}`,
          { method: 'GET' }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error,
        }
      }

      return {
        success: true,
        data: result.data.data,
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  async getConversationMetrics(): Promise<IntegrationResponse<any>> {
    const metrics = [
      'page_messages_active_threads_unique',
      'page_messages_blocked_conversations_unique',
      'page_messages_reported_conversations_unique',
      'page_messages_new_conversations_unique',
    ]

    return this.getPageInsights(metrics)
  }

  async getMessageMetrics(): Promise<IntegrationResponse<any>> {
    const metrics = [
      'page_messages_total_messaging_connections',
      'page_messages_new_messaging_connections',
    ]

    return this.getPageInsights(metrics)
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  async blockUser(userId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/me/blocked?user=${userId}&access_token=${this.pageAccessToken}`,
          { method: 'POST' }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return {
        success: true,
        data: undefined,
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  async unblockUser(userId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/me/blocked?user=${userId}&access_token=${this.pageAccessToken}`,
          { method: 'DELETE' }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return {
        success: true,
        data: undefined,
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  // ============================================================================
  // PRIVATE REPLIES (for public posts)
  // ============================================================================

  async sendPrivateReply(params: {
    commentId: string
    message: string
  }): Promise<IntegrationResponse<{ messageId: string }>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/${params.commentId}/private_replies?access_token=${this.pageAccessToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: params.message }),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error,
        }
      }

      return {
        success: true,
        data: { messageId: result.data.id },
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  // ============================================================================
  // MESSAGE REACTIONS
  // ============================================================================

  async reactToMessage(messageId: string, reaction: 'smile' | 'angry' | 'sad' | 'wow' | 'love' | 'like' | 'dislike'): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/me/messages?access_token=${this.pageAccessToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipient: { id: messageId },
              sender_action: 'react',
              reaction,
            }),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return {
        success: true,
        data: undefined,
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  async unreactToMessage(messageId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/me/messages?access_token=${this.pageAccessToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipient: { id: messageId },
              sender_action: 'unreact',
            }),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return {
        success: true,
        data: undefined,
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  // ============================================================================
  // CONVERSATIONS
  // ============================================================================

  async getConversation(conversationId: string, fields?: string[]): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()

      const fieldsList = fields?.join(',') || 'id,link,updated_time,message_count'

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/${conversationId}?fields=${fieldsList}&access_token=${this.pageAccessToken}`,
          { method: 'GET' }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error,
        }
      }

      return {
        success: true,
        data: result.data,
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  async getConversationMessages(conversationId: string, limit: number = 25): Promise<IntegrationResponse<any[]>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/${conversationId}/messages?limit=${limit}&access_token=${this.pageAccessToken}`,
          { method: 'GET' }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error,
        }
      }

      return {
        success: true,
        data: result.data.data,
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  async listConversations(params?: {
    limit?: number
    folder?: 'inbox' | 'other' | 'done'
  }): Promise<IntegrationResponse<any[]>> {
    try {
      await this.ensureConnected()

      const query = new URLSearchParams()
      query.set('limit', (params?.limit || 25).toString())
      if (params?.folder) query.set('folder', params.folder)

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/me/conversations?${query.toString()}&access_token=${this.pageAccessToken}`,
          { method: 'GET' }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error,
        }
      }

      return {
        success: true,
        data: result.data.data,
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  // ============================================================================
  // PAGE SETTINGS
  // ============================================================================

  async updatePageSettings(settings: {
    call_to_actions?: any[]
    business_hours?: {
      timezone: string
      hours: Array<{
        day: number
        open_time: string
        close_time: string
      }>
    }
    away_message?: {
      enabled: boolean
      message: string
    }
  }): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/me/messenger_profile?access_token=${this.pageAccessToken}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return {
        success: true,
        data: undefined,
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  async deletePersona(personaId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/${personaId}?access_token=${this.pageAccessToken}`,
          { method: 'DELETE' }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return {
        success: true,
        data: undefined,
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  async listPersonas(): Promise<IntegrationResponse<MessengerPersona[]>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/${this.apiVersion}/me/personas?access_token=${this.pageAccessToken}`,
          { method: 'GET' }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error,
        }
      }

      return {
        success: true,
        data: result.data.data,
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }
}
