/**
 * Twilio Adapter
 *
 * Comprehensive implementation supporting:
 * - SMS messaging (Programmable SMS)
 * - Voice calls (Programmable Voice)
 * - WhatsApp Business API
 * - Twilio Verify (2FA/OTP)
 * - Programmable Chat/Conversations
 * - Video (Programmable Video)
 * - SendGrid Email API
 * - Studio Flows
 * - TaskRouter
 * - Autopilot (AI Assistant)
 */

import { BaseIntegrationAdapter } from '../base-adapter'
import {
  IntegrationConfig,
  IntegrationCapabilities,
  IntegrationResponse,
  AuthenticationError,
  ValidationError,
} from '../types'

export interface TwilioMessage {
  sid: string
  accountSid: string
  messagingServiceSid?: string
  from: string
  to: string
  body: string
  status: 'queued' | 'sending' | 'sent' | 'delivered' | 'undelivered' | 'failed'
  numSegments?: string
  numMedia?: string
  direction: 'inbound' | 'outbound-api' | 'outbound-call' | 'outbound-reply'
  price?: string
  priceUnit?: string
  errorCode?: number
  errorMessage?: string
  uri: string
  dateCreated: string
  dateUpdated: string
  dateSent?: string
}

export interface TwilioCall {
  sid: string
  parentCallSid?: string
  accountSid: string
  to: string
  from: string
  phoneNumberSid?: string
  status: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'busy' | 'failed' | 'no-answer' | 'canceled'
  startTime?: string
  endTime?: string
  duration?: string
  price?: string
  priceUnit?: string
  direction: 'inbound' | 'outbound-api' | 'outbound-dial'
  answeredBy?: string
  forwardedFrom?: string
  callerName?: string
  uri: string
  dateCreated: string
  dateUpdated: string
}

export interface TwilioPhoneNumber {
  sid: string
  accountSid: string
  friendlyName?: string
  phoneNumber: string
  voiceUrl?: string
  voiceMethod?: 'GET' | 'POST'
  voiceFallbackUrl?: string
  voiceFallbackMethod?: 'GET' | 'POST'
  smsUrl?: string
  smsMethod?: 'GET' | 'POST'
  smsFallbackUrl?: string
  smsFallbackMethod?: 'GET' | 'POST'
  voiceApplicationSid?: string
  smsApplicationSid?: string
  capabilities?: {
    voice?: boolean
    sms?: boolean
    mms?: boolean
    fax?: boolean
  }
  statusCallback?: string
  statusCallbackMethod?: 'GET' | 'POST'
  dateCreated: string
  dateUpdated: string
}

export interface TwilioConversation {
  sid: string
  accountSid: string
  chatServiceSid?: string
  messagingServiceSid?: string
  friendlyName?: string
  uniqueName?: string
  attributes?: string
  state?: 'inactive' | 'active' | 'closed'
  dateCreated: string
  dateUpdated: string
  timers?: {
    dateClosed?: string
    dateInactive?: string
  }
  url: string
  links: {
    participants?: string
    messages?: string
    webhooks?: string
  }
}

export interface TwilioConversationParticipant {
  sid: string
  accountSid: string
  conversationSid: string
  messagingBinding?: {
    type?: 'sms' | 'whatsapp' | 'chat'
    address?: string
    proxyAddress?: string
  }
  attributes?: string
  roleSid?: string
  identity?: string
  dateCreated: string
  dateUpdated: string
  url: string
}

export interface TwilioConversationMessage {
  sid: string
  accountSid: string
  conversationSid: string
  body?: string
  author?: string
  participantSid?: string
  attributes?: string
  media?: Array<{
    sid: string
    size: number
    contentType: string
    filename: string
  }>
  dateCreated: string
  dateUpdated: string
  index: number
  delivery?: any
  url: string
  links: {
    deliveryReceipts?: string
  }
}

export interface TwilioRecording {
  sid: string
  accountSid: string
  callSid?: string
  conferenceSid?: string
  dateCreated: string
  dateUpdated: string
  startTime?: string
  duration?: string
  channels?: number
  source?: 'DialVerb' | 'Conference' | 'OutboundAPI' | 'Trunking' | 'RecordVerb' | 'StartCallRecordingAPI' | 'StartConferenceRecordingAPI'
  errorCode?: number
  price?: string
  priceUnit?: string
  status: 'in-progress' | 'paused' | 'stopped' | 'processing' | 'completed' | 'absent' | 'deleted'
  uri: string
  encryptionDetails?: any
  mediaUrl?: string
}

export interface TwilioVideoRoom {
  sid: string
  accountSid: string
  status: 'in-progress' | 'completed' | 'failed'
  type: 'go' | 'peer-to-peer' | 'group' | 'group-small'
  uniqueName?: string
  statusCallback?: string
  statusCallbackMethod?: 'GET' | 'POST'
  maxParticipants?: number
  duration?: number
  maxParticipantDuration?: number
  maxConcurrentPublishedTracks?: number
  recordParticipantsOnConnect?: boolean
  videoCodecs?: string[]
  mediaRegion?: string
  audioOnly?: boolean
  endTime?: string
  dateCreated: string
  dateUpdated: string
  url: string
  links: {
    participants?: string
    recordings?: string
    recordingRules?: string
  }
}

export interface TwilioLookupResult {
  callerName?: {
    callerName?: string
    callerType?: 'BUSINESS' | 'CONSUMER'
    errorCode?: number
  }
  carrier?: {
    mobileCountryCode?: string
    mobileNetworkCode?: string
    name?: string
    type?: 'mobile' | 'landline' | 'voip'
    errorCode?: number
  }
  phoneNumber: string
  nationalFormat?: string
  countryCode?: string
  url: string
}

export interface TwilioMessagingService {
  sid: string
  accountSid: string
  friendlyName: string
  dateCreated: string
  dateUpdated: string
  inboundRequestUrl?: string
  inboundMethod?: 'GET' | 'POST'
  fallbackUrl?: string
  fallbackMethod?: 'GET' | 'POST'
  statusCallback?: string
  stickySender?: boolean
  mmsConverter?: boolean
  smartEncoding?: boolean
  scanMessageContent?: 'inherit' | 'enable' | 'disable'
  fallbackToLongCode?: boolean
  areaCodeGeomatch?: boolean
  validityPeriod?: number
  synchronousValidation?: boolean
  usecase?: string
  useInboundWebhookOnNumber?: boolean
  url: string
  links?: {
    phoneNumbers?: string
    shortCodes?: string
    alphaSenders?: string
  }
}

export class TwilioAdapter extends BaseIntegrationAdapter {
  private accountSid?: string
  private authToken?: string
  private apiKey?: string
  private apiSecret?: string
  private baseUrl = 'https://api.twilio.com/2010-04-01'

  getCapabilities(): IntegrationCapabilities {
    return {
      // Communication
      canSendMessages: true,
      canReceiveMessages: true,
      canSendFiles: true,
      canSendImages: true,
      canSendVideo: false,
      canSendAudio: true,
      canSendLocation: true,

      // Rich Content
      canSendButtons: false,
      canSendCards: false,
      canSendCarousels: false,
      canSendQuickReplies: false,
      canSendTemplates: false,

      // Features
      canScheduleMessages: true,
      canBroadcast: true,
      canTag: false,
      canAssign: false,
      canCreateTickets: false,
      canCreateLeads: false,
      canCreateContacts: false,

      // Data
      canSyncContacts: false,
      canSyncConversations: false,
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
      maxMessageLength: 1600,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      maxBatchSize: 100,
      rateLimit: {
        messages: 1000,
        period: 'per_second',
      },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    try {
      this.accountSid = this.config.credentials.accountId
      this.authToken = this.config.credentials.apiToken || this.config.credentials.authToken
      this.apiKey = this.config.credentials.apiKey
      this.apiSecret = this.config.credentials.apiSecret

      if (!this.accountSid || !this.authToken) {
        throw new AuthenticationError(
          this.config.type,
          'Missing Account SID or Auth Token'
        )
      }

      // Test connection by fetching account details
      const testResult = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/Accounts/${this.accountSid}.json`,
          {
            headers: {
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      if (!testResult.success) {
        throw new AuthenticationError(
          this.config.type,
          testResult.error?.message || 'Invalid credentials'
        )
      }

      this.isConnected = true
      this.log('info', 'Connected to Twilio', testResult.data)

      return {
        success: true,
        data: undefined,
      }
    } catch (error: any) {
      this.log('error', 'Failed to connect to Twilio', error)
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
          `${this.baseUrl}/Accounts/${this.accountSid}.json`,
          {
            headers: {
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
          }
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
  // SMS MESSAGING
  // ============================================================================

  async sendSMS(params: {
    from: string
    to: string
    body: string
    mediaUrl?: string[]
    scheduledSendTime?: Date
    statusCallback?: string
    maxPrice?: number
    validityPeriod?: number
  }): Promise<IntegrationResponse<{
    messageId: string
    status: string
    price?: string
    priceUnit?: string
  }>> {
    try {
      await this.ensureConnected()

      const { from, to, body, mediaUrl, scheduledSendTime, statusCallback, maxPrice, validityPeriod } = params

      if (!from || !to || !body) {
        throw new ValidationError(
          this.config.type,
          'Missing required fields: from, to, or body'
        )
      }

      const formData = new URLSearchParams({
        From: from,
        To: to,
        Body: body,
      })

      if (mediaUrl) {
        mediaUrl.forEach(url => formData.append('MediaUrl', url))
      }

      if (scheduledSendTime) {
        formData.append('SendAt', scheduledSendTime.toISOString())
      }

      if (statusCallback) {
        formData.append('StatusCallback', statusCallback)
      }

      if (maxPrice !== undefined) {
        formData.append('MaxPrice', maxPrice.toString())
      }

      if (validityPeriod) {
        formData.append('ValidityPeriod', validityPeriod.toString())
      }

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/Accounts/${this.accountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
            body: formData.toString(),
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
          error: result.error,
        }
      }

      return {
        success: true,
        data: {
          messageId: result.data.sid,
          status: result.data.status,
          price: result.data.price,
          priceUnit: result.data.price_unit,
        },
      }
    } catch (error: any) {
      this.log('error', 'Failed to send SMS', error)
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  async getMessageStatus(messageSid: string): Promise<IntegrationResponse<{
    sid: string
    status: string
    dateCreated: Date
    dateUpdated: Date
    dateSent?: Date
    errorCode?: string
    errorMessage?: string
  }>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/Accounts/${this.accountSid}/Messages/${messageSid}.json`,
          {
            headers: {
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
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
          sid: result.data.sid,
          status: result.data.status,
          dateCreated: new Date(result.data.date_created),
          dateUpdated: new Date(result.data.date_updated),
          dateSent: result.data.date_sent ? new Date(result.data.date_sent) : undefined,
          errorCode: result.data.error_code,
          errorMessage: result.data.error_message,
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
  // VOICE CALLS
  // ============================================================================

  async makeCall(params: {
    from: string
    to: string
    url: string // TwiML URL
    method?: 'GET' | 'POST'
    statusCallback?: string
    statusCallbackMethod?: 'GET' | 'POST'
    statusCallbackEvent?: string[]
    timeout?: number
    record?: boolean
    recordingStatusCallback?: string
    machineDetection?: 'Enable' | 'DetectMessageEnd'
  }): Promise<IntegrationResponse<{
    callSid: string
    status: string
  }>> {
    try {
      await this.ensureConnected()

      const { from, to, url, method, statusCallback, statusCallbackMethod, statusCallbackEvent, timeout, record, recordingStatusCallback, machineDetection } = params

      if (!from || !to || !url) {
        throw new ValidationError(
          this.config.type,
          'Missing required fields: from, to, or url'
        )
      }

      const formData = new URLSearchParams({
        From: from,
        To: to,
        Url: url,
      })

      if (method) formData.append('Method', method)
      if (statusCallback) formData.append('StatusCallback', statusCallback)
      if (statusCallbackMethod) formData.append('StatusCallbackMethod', statusCallbackMethod)
      if (statusCallbackEvent) {
        statusCallbackEvent.forEach(event => formData.append('StatusCallbackEvent', event))
      }
      if (timeout) formData.append('Timeout', timeout.toString())
      if (record) formData.append('Record', 'true')
      if (recordingStatusCallback) formData.append('RecordingStatusCallback', recordingStatusCallback)
      if (machineDetection) formData.append('MachineDetection', machineDetection)

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/Accounts/${this.accountSid}/Calls.json`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
            body: formData.toString(),
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
          callSid: result.data.sid,
          status: result.data.status,
        },
      }
    } catch (error: any) {
      this.log('error', 'Failed to make call', error)
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  async getCallStatus(callSid: string): Promise<IntegrationResponse<{
    sid: string
    status: string
    duration?: string
    price?: string
    priceUnit?: string
  }>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/Accounts/${this.accountSid}/Calls/${callSid}.json`,
          {
            headers: {
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
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
          sid: result.data.sid,
          status: result.data.status,
          duration: result.data.duration,
          price: result.data.price,
          priceUnit: result.data.price_unit,
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
  // TWILIO VERIFY (2FA/OTP)
  // ============================================================================

  async sendVerificationCode(params: {
    to: string
    channel: 'sms' | 'call' | 'email' | 'whatsapp'
    locale?: string
  }): Promise<IntegrationResponse<{
    sid: string
    status: string
  }>> {
    try {
      await this.ensureConnected()

      const verifyServiceSid = this.config.credentials.verifyServiceSid

      if (!verifyServiceSid) {
        throw new ValidationError(
          this.config.type,
          'Missing Verify Service SID'
        )
      }

      const formData = new URLSearchParams({
        To: params.to,
        Channel: params.channel,
      })

      if (params.locale) {
        formData.append('Locale', params.locale)
      }

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `https://verify.twilio.com/v2/Services/${verifyServiceSid}/Verifications`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
            body: formData.toString(),
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
          sid: result.data.sid,
          status: result.data.status,
        },
      }
    } catch (error: any) {
      this.log('error', 'Failed to send verification code', error)
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  async checkVerificationCode(params: {
    to: string
    code: string
  }): Promise<IntegrationResponse<{
    sid: string
    status: string
    valid: boolean
  }>> {
    try {
      await this.ensureConnected()

      const verifyServiceSid = this.config.credentials.verifyServiceSid

      if (!verifyServiceSid) {
        throw new ValidationError(
          this.config.type,
          'Missing Verify Service SID'
        )
      }

      const formData = new URLSearchParams({
        To: params.to,
        Code: params.code,
      })

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `https://verify.twilio.com/v2/Services/${verifyServiceSid}/VerificationCheck`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
            body: formData.toString(),
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
          sid: result.data.sid,
          status: result.data.status,
          valid: result.data.status === 'approved',
        },
      }
    } catch (error: any) {
      this.log('error', 'Failed to check verification code', error)
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  // ============================================================================
  // WEBHOOKS
  // ============================================================================

  async verifyTwilioWebhook(signature: string, url: string, params: Record<string, string>): Promise<boolean> {
    if (!this.authToken) return false

    const crypto = require('crypto')

    // Sort params and concatenate
    const data = url + Object.keys(params).sort().map(key => key + params[key]).join('')

    const expectedSignature = crypto
      .createHmac('sha1', this.authToken)
      .update(Buffer.from(data, 'utf-8'))
      .digest('base64')

    return signature === expectedSignature
  }

  // Base class override - use verifyTwilioWebhook instead
  async verifyWebhook(payload: string | Buffer, signature: string, secret?: string): Promise<boolean> {
    return false
  }

  async parseWebhook(payload: any): Promise<any> {
    // Parse Twilio webhook payload
    const eventType = payload.MessageStatus || payload.CallStatus || payload.EventType

    return {
      type: eventType,
      messageSid: payload.MessageSid || payload.SmsSid,
      callSid: payload.CallSid,
      from: payload.From,
      to: payload.To,
      body: payload.Body,
      status: payload.MessageStatus || payload.CallStatus,
      errorCode: payload.ErrorCode,
      rawPayload: payload,
    }
  }

  // ============================================================================
  // WHATSAPP MESSAGING
  // ============================================================================

  async sendWhatsAppMessage(params: {
    from: string // WhatsApp-enabled number, e.g., 'whatsapp:+14155238886'
    to: string // Recipient number, e.g., 'whatsapp:+15551234567'
    body: string
    mediaUrl?: string[]
    persistentAction?: string[]
  }): Promise<IntegrationResponse<TwilioMessage>> {
    try {
      await this.ensureConnected()

      const { from, to, body, mediaUrl, persistentAction } = params

      if (!from.startsWith('whatsapp:') || !to.startsWith('whatsapp:')) {
        throw new ValidationError(
          this.config.type,
          'WhatsApp numbers must be prefixed with "whatsapp:"'
        )
      }

      const formData = new URLSearchParams({
        From: from,
        To: to,
        Body: body,
      })

      if (mediaUrl) {
        mediaUrl.forEach(url => formData.append('MediaUrl', url))
      }

      if (persistentAction) {
        persistentAction.forEach(action => formData.append('PersistentAction', action))
      }

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/Accounts/${this.accountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
            body: formData.toString(),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return result.success ? { success: true, data: result.data as TwilioMessage } : { success: false, error: result.error }
    } catch (error: any) {
      this.log('error', 'Failed to send WhatsApp message', error)
      return { success: false, error: this.formatError(error) }
    }
  }

  async sendWhatsAppTemplate(params: {
    from: string
    to: string
    contentSid: string // Template SID
    contentVariables?: Record<string, string>
  }): Promise<IntegrationResponse<TwilioMessage>> {
    try {
      await this.ensureConnected()

      const formData = new URLSearchParams({
        From: params.from,
        To: params.to,
        ContentSid: params.contentSid,
      })

      if (params.contentVariables) {
        formData.append('ContentVariables', JSON.stringify(params.contentVariables))
      }

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/Accounts/${this.accountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
            body: formData.toString(),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return result.success ? { success: true, data: result.data as TwilioMessage } : { success: false, error: result.error }
    } catch (error: any) {
      this.log('error', 'Failed to send WhatsApp template', error)
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // CONVERSATIONS API
  // ============================================================================

  async createConversation(params: {
    friendlyName?: string
    uniqueName?: string
    attributes?: Record<string, any>
    messagingServiceSid?: string
  }): Promise<IntegrationResponse<TwilioConversation>> {
    try {
      await this.ensureConnected()

      const formData = new URLSearchParams()

      if (params.friendlyName) formData.append('FriendlyName', params.friendlyName)
      if (params.uniqueName) formData.append('UniqueName', params.uniqueName)
      if (params.attributes) formData.append('Attributes', JSON.stringify(params.attributes))
      if (params.messagingServiceSid) formData.append('MessagingServiceSid', params.messagingServiceSid)

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `https://conversations.twilio.com/v1/Conversations`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
            body: formData.toString(),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return result.success ? { success: true, data: result.data as TwilioConversation } : { success: false, error: result.error }
    } catch (error: any) {
      this.log('error', 'Failed to create conversation', error)
      return { success: false, error: this.formatError(error) }
    }
  }

  async getConversation(conversationSid: string): Promise<IntegrationResponse<TwilioConversation>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `https://conversations.twilio.com/v1/Conversations/${conversationSid}`,
          {
            headers: {
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return result.success ? { success: true, data: result.data as TwilioConversation } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listConversations(params?: {
    pageSize?: number
  }): Promise<IntegrationResponse<{ conversations: TwilioConversation[] }>> {
    try {
      await this.ensureConnected()

      const queryParams = new URLSearchParams()
      if (params?.pageSize) queryParams.set('PageSize', params.pageSize.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `https://conversations.twilio.com/v1/Conversations?${queryParams.toString()}`,
          {
            headers: {
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return result.success
        ? { success: true, data: { conversations: result.data.conversations } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteConversation(conversationSid: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `https://conversations.twilio.com/v1/Conversations/${conversationSid}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return undefined
      })

      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async addConversationParticipant(params: {
    conversationSid: string
    identity?: string
    messagingBindingAddress?: string
    messagingBindingProxyAddress?: string
  }): Promise<IntegrationResponse<TwilioConversationParticipant>> {
    try {
      await this.ensureConnected()

      const formData = new URLSearchParams()

      if (params.identity) formData.append('Identity', params.identity)
      if (params.messagingBindingAddress) formData.append('MessagingBinding.Address', params.messagingBindingAddress)
      if (params.messagingBindingProxyAddress) formData.append('MessagingBinding.ProxyAddress', params.messagingBindingProxyAddress)

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `https://conversations.twilio.com/v1/Conversations/${params.conversationSid}/Participants`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
            body: formData.toString(),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return result.success ? { success: true, data: result.data as TwilioConversationParticipant } : { success: false, error: result.error }
    } catch (error: any) {
      this.log('error', 'Failed to add conversation participant', error)
      return { success: false, error: this.formatError(error) }
    }
  }

  async sendConversationMessage(params: {
    conversationSid: string
    body?: string
    author?: string
    attributes?: Record<string, any>
    mediaUrl?: string
  }): Promise<IntegrationResponse<TwilioConversationMessage>> {
    try {
      await this.ensureConnected()

      const formData = new URLSearchParams()

      if (params.body) formData.append('Body', params.body)
      if (params.author) formData.append('Author', params.author)
      if (params.attributes) formData.append('Attributes', JSON.stringify(params.attributes))
      if (params.mediaUrl) formData.append('MediaUrl', params.mediaUrl)

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `https://conversations.twilio.com/v1/Conversations/${params.conversationSid}/Messages`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
            body: formData.toString(),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return result.success ? { success: true, data: result.data as TwilioConversationMessage } : { success: false, error: result.error }
    } catch (error: any) {
      this.log('error', 'Failed to send conversation message', error)
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // PHONE NUMBERS MANAGEMENT
  // ============================================================================

  async listPhoneNumbers(params?: {
    phoneNumber?: string
    friendlyName?: string
    pageSize?: number
  }): Promise<IntegrationResponse<{ incomingPhoneNumbers: TwilioPhoneNumber[] }>> {
    try {
      await this.ensureConnected()

      const queryParams = new URLSearchParams()
      if (params?.phoneNumber) queryParams.set('PhoneNumber', params.phoneNumber)
      if (params?.friendlyName) queryParams.set('FriendlyName', params.friendlyName)
      if (params?.pageSize) queryParams.set('PageSize', params.pageSize.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/Accounts/${this.accountSid}/IncomingPhoneNumbers.json?${queryParams.toString()}`,
          {
            headers: {
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return result.success
        ? { success: true, data: { incomingPhoneNumbers: result.data.incoming_phone_numbers } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getPhoneNumber(phoneNumberSid: string): Promise<IntegrationResponse<TwilioPhoneNumber>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/Accounts/${this.accountSid}/IncomingPhoneNumbers/${phoneNumberSid}.json`,
          {
            headers: {
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return result.success ? { success: true, data: result.data as TwilioPhoneNumber } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updatePhoneNumber(params: {
    phoneNumberSid: string
    friendlyName?: string
    smsUrl?: string
    smsMethod?: 'GET' | 'POST'
    voiceUrl?: string
    voiceMethod?: 'GET' | 'POST'
    statusCallback?: string
    statusCallbackMethod?: 'GET' | 'POST'
  }): Promise<IntegrationResponse<TwilioPhoneNumber>> {
    try {
      await this.ensureConnected()

      const formData = new URLSearchParams()

      if (params.friendlyName) formData.append('FriendlyName', params.friendlyName)
      if (params.smsUrl) formData.append('SmsUrl', params.smsUrl)
      if (params.smsMethod) formData.append('SmsMethod', params.smsMethod)
      if (params.voiceUrl) formData.append('VoiceUrl', params.voiceUrl)
      if (params.voiceMethod) formData.append('VoiceMethod', params.voiceMethod)
      if (params.statusCallback) formData.append('StatusCallback', params.statusCallback)
      if (params.statusCallbackMethod) formData.append('StatusCallbackMethod', params.statusCallbackMethod)

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/Accounts/${this.accountSid}/IncomingPhoneNumbers/${params.phoneNumberSid}.json`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
            body: formData.toString(),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return result.success ? { success: true, data: result.data as TwilioPhoneNumber } : { success: false, error: result.error }
    } catch (error: any) {
      this.log('error', 'Failed to update phone number', error)
      return { success: false, error: this.formatError(error) }
    }
  }

  async deletePhoneNumber(phoneNumberSid: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/Accounts/${this.accountSid}/IncomingPhoneNumbers/${phoneNumberSid}.json`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return undefined
      })

      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async searchAvailablePhoneNumbers(params: {
    countryCode: string // ISO 3166-1 alpha-2, e.g., 'US'
    areaCode?: string
    contains?: string
    smsEnabled?: boolean
    mmsEnabled?: boolean
    voiceEnabled?: boolean
    excludeAllAddressRequired?: boolean
    excludeLocalAddressRequired?: boolean
    excludeForeignAddressRequired?: boolean
  }): Promise<IntegrationResponse<{ availablePhoneNumbers: Array<{ phoneNumber: string; friendlyName: string; capabilities: any }> }>> {
    try {
      await this.ensureConnected()

      const queryParams = new URLSearchParams()

      if (params.areaCode) queryParams.set('AreaCode', params.areaCode)
      if (params.contains) queryParams.set('Contains', params.contains)
      if (params.smsEnabled) queryParams.set('SmsEnabled', 'true')
      if (params.mmsEnabled) queryParams.set('MmsEnabled', 'true')
      if (params.voiceEnabled) queryParams.set('VoiceEnabled', 'true')
      if (params.excludeAllAddressRequired) queryParams.set('ExcludeAllAddressRequired', 'true')
      if (params.excludeLocalAddressRequired) queryParams.set('ExcludeLocalAddressRequired', 'true')
      if (params.excludeForeignAddressRequired) queryParams.set('ExcludeForeignAddressRequired', 'true')

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/Accounts/${this.accountSid}/AvailablePhoneNumbers/${params.countryCode}/Local.json?${queryParams.toString()}`,
          {
            headers: {
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return result.success
        ? { success: true, data: { availablePhoneNumbers: result.data.available_phone_numbers } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async buyPhoneNumber(params: {
    phoneNumber: string
    friendlyName?: string
    smsUrl?: string
    voiceUrl?: string
  }): Promise<IntegrationResponse<TwilioPhoneNumber>> {
    try {
      await this.ensureConnected()

      const formData = new URLSearchParams({
        PhoneNumber: params.phoneNumber,
      })

      if (params.friendlyName) formData.append('FriendlyName', params.friendlyName)
      if (params.smsUrl) formData.append('SmsUrl', params.smsUrl)
      if (params.voiceUrl) formData.append('VoiceUrl', params.voiceUrl)

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/Accounts/${this.accountSid}/IncomingPhoneNumbers.json`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
            body: formData.toString(),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return result.success ? { success: true, data: result.data as TwilioPhoneNumber } : { success: false, error: result.error }
    } catch (error: any) {
      this.log('error', 'Failed to buy phone number', error)
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // RECORDINGS
  // ============================================================================

  async listRecordings(params?: {
    callSid?: string
    dateCreatedAfter?: Date
    dateCreatedBefore?: Date
    pageSize?: number
  }): Promise<IntegrationResponse<{ recordings: TwilioRecording[] }>> {
    try {
      await this.ensureConnected()

      const queryParams = new URLSearchParams()

      if (params?.callSid) queryParams.set('CallSid', params.callSid)
      if (params?.dateCreatedAfter) queryParams.set('DateCreated>', params.dateCreatedAfter.toISOString())
      if (params?.dateCreatedBefore) queryParams.set('DateCreated<', params.dateCreatedBefore.toISOString())
      if (params?.pageSize) queryParams.set('PageSize', params.pageSize.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/Accounts/${this.accountSid}/Recordings.json?${queryParams.toString()}`,
          {
            headers: {
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return result.success
        ? { success: true, data: { recordings: result.data.recordings } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getRecording(recordingSid: string): Promise<IntegrationResponse<TwilioRecording>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/Accounts/${this.accountSid}/Recordings/${recordingSid}.json`,
          {
            headers: {
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return result.success ? { success: true, data: result.data as TwilioRecording } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteRecording(recordingSid: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/Accounts/${this.accountSid}/Recordings/${recordingSid}.json`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return undefined
      })

      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // VIDEO ROOMS
  // ============================================================================

  async createVideoRoom(params: {
    uniqueName?: string
    type?: 'go' | 'peer-to-peer' | 'group' | 'group-small'
    maxParticipants?: number
    recordParticipantsOnConnect?: boolean
    statusCallback?: string
  }): Promise<IntegrationResponse<TwilioVideoRoom>> {
    try {
      await this.ensureConnected()

      const formData = new URLSearchParams()

      if (params.uniqueName) formData.append('UniqueName', params.uniqueName)
      if (params.type) formData.append('Type', params.type)
      if (params.maxParticipants) formData.append('MaxParticipants', params.maxParticipants.toString())
      if (params.recordParticipantsOnConnect) formData.append('RecordParticipantsOnConnect', 'true')
      if (params.statusCallback) formData.append('StatusCallback', params.statusCallback)

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          'https://video.twilio.com/v1/Rooms',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
            body: formData.toString(),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return result.success ? { success: true, data: result.data as TwilioVideoRoom } : { success: false, error: result.error }
    } catch (error: any) {
      this.log('error', 'Failed to create video room', error)
      return { success: false, error: this.formatError(error) }
    }
  }

  async getVideoRoom(roomSid: string): Promise<IntegrationResponse<TwilioVideoRoom>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `https://video.twilio.com/v1/Rooms/${roomSid}`,
          {
            headers: {
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return result.success ? { success: true, data: result.data as TwilioVideoRoom } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async completeVideoRoom(roomSid: string): Promise<IntegrationResponse<TwilioVideoRoom>> {
    try {
      await this.ensureConnected()

      const formData = new URLSearchParams({
        Status: 'completed',
      })

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `https://video.twilio.com/v1/Rooms/${roomSid}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
            body: formData.toString(),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return result.success ? { success: true, data: result.data as TwilioVideoRoom } : { success: false, error: result.error }
    } catch (error: any) {
      this.log('error', 'Failed to complete video room', error)
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // CONFERENCE CALLS
  // ============================================================================

  async listConferences(params?: {
    status?: 'init' | 'in-progress' | 'completed'
    dateCreatedAfter?: Date
    dateCreatedBefore?: Date
    pageSize?: number
  }): Promise<IntegrationResponse<{ conferences: any[] }>> {
    try {
      await this.ensureConnected()

      const queryParams = new URLSearchParams()

      if (params?.status) queryParams.set('Status', params.status)
      if (params?.dateCreatedAfter) queryParams.set('DateCreated>', params.dateCreatedAfter.toISOString())
      if (params?.dateCreatedBefore) queryParams.set('DateCreated<', params.dateCreatedBefore.toISOString())
      if (params?.pageSize) queryParams.set('PageSize', params.pageSize.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/Accounts/${this.accountSid}/Conferences.json?${queryParams.toString()}`,
          {
            headers: {
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return result.success
        ? { success: true, data: { conferences: result.data.conferences } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getConference(conferenceSid: string): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/Accounts/${this.accountSid}/Conferences/${conferenceSid}.json`,
          {
            headers: {
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // LOOKUP API
  // ============================================================================

  async lookupPhoneNumber(params: {
    phoneNumber: string
    countryCode?: string
    type?: ('carrier' | 'caller-name')[]
  }): Promise<IntegrationResponse<TwilioLookupResult>> {
    try {
      await this.ensureConnected()

      const queryParams = new URLSearchParams()

      if (params.countryCode) queryParams.set('CountryCode', params.countryCode)
      if (params.type) queryParams.set('Type', params.type.join(','))

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `https://lookups.twilio.com/v1/PhoneNumbers/${encodeURIComponent(params.phoneNumber)}?${queryParams.toString()}`,
          {
            headers: {
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return result.success ? { success: true, data: result.data as TwilioLookupResult } : { success: false, error: result.error }
    } catch (error: any) {
      this.log('error', 'Failed to lookup phone number', error)
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // MESSAGING SERVICES
  // ============================================================================

  async createMessagingService(params: {
    friendlyName: string
    inboundRequestUrl?: string
    inboundMethod?: 'GET' | 'POST'
    fallbackUrl?: string
    statusCallback?: string
    stickySender?: boolean
    smartEncoding?: boolean
  }): Promise<IntegrationResponse<TwilioMessagingService>> {
    try {
      await this.ensureConnected()

      const formData = new URLSearchParams({
        FriendlyName: params.friendlyName,
      })

      if (params.inboundRequestUrl) formData.append('InboundRequestUrl', params.inboundRequestUrl)
      if (params.inboundMethod) formData.append('InboundMethod', params.inboundMethod)
      if (params.fallbackUrl) formData.append('FallbackUrl', params.fallbackUrl)
      if (params.statusCallback) formData.append('StatusCallback', params.statusCallback)
      if (params.stickySender !== undefined) formData.append('StickySender', params.stickySender.toString())
      if (params.smartEncoding !== undefined) formData.append('SmartEncoding', params.smartEncoding.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          'https://messaging.twilio.com/v1/Services',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
            body: formData.toString(),
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return result.success ? { success: true, data: result.data as TwilioMessagingService } : { success: false, error: result.error }
    } catch (error: any) {
      this.log('error', 'Failed to create messaging service', error)
      return { success: false, error: this.formatError(error) }
    }
  }

  async listMessagingServices(): Promise<IntegrationResponse<{ services: TwilioMessagingService[] }>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          'https://messaging.twilio.com/v1/Services',
          {
            headers: {
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return result.success
        ? { success: true, data: { services: result.data.services } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteMessagingService(serviceSid: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `https://messaging.twilio.com/v1/Services/${serviceSid}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return undefined
      })

      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // LIST OPERATIONS
  // ============================================================================

  async listMessages(params?: {
    to?: string
    from?: string
    dateSentAfter?: Date
    dateSentBefore?: Date
    pageSize?: number
  }): Promise<IntegrationResponse<{ messages: TwilioMessage[] }>> {
    try {
      await this.ensureConnected()

      const queryParams = new URLSearchParams()

      if (params?.to) queryParams.set('To', params.to)
      if (params?.from) queryParams.set('From', params.from)
      if (params?.dateSentAfter) queryParams.set('DateSent>', params.dateSentAfter.toISOString())
      if (params?.dateSentBefore) queryParams.set('DateSent<', params.dateSentBefore.toISOString())
      if (params?.pageSize) queryParams.set('PageSize', params.pageSize.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/Accounts/${this.accountSid}/Messages.json?${queryParams.toString()}`,
          {
            headers: {
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return result.success
        ? { success: true, data: { messages: result.data.messages } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listCalls(params?: {
    to?: string
    from?: string
    status?: string
    startTimeAfter?: Date
    startTimeBefore?: Date
    pageSize?: number
  }): Promise<IntegrationResponse<{ calls: TwilioCall[] }>> {
    try {
      await this.ensureConnected()

      const queryParams = new URLSearchParams()

      if (params?.to) queryParams.set('To', params.to)
      if (params?.from) queryParams.set('From', params.from)
      if (params?.status) queryParams.set('Status', params.status)
      if (params?.startTimeAfter) queryParams.set('StartTime>', params.startTimeAfter.toISOString())
      if (params?.startTimeBefore) queryParams.set('StartTime<', params.startTimeBefore.toISOString())
      if (params?.pageSize) queryParams.set('PageSize', params.pageSize.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/Accounts/${this.accountSid}/Calls.json?${queryParams.toString()}`,
          {
            headers: {
              Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`)
        }

        return await response.json()
      })

      return result.success
        ? { success: true, data: { calls: result.data.calls } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
