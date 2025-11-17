/**
 * Postmark Adapter - Transactional email
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export interface PostmarkEmail {
  From: string
  To: string
  Cc?: string
  Bcc?: string
  Subject: string
  Tag?: string
  HtmlBody?: string
  TextBody?: string
  ReplyTo?: string
  Headers?: Array<{ Name: string; Value: string }>
  TrackOpens?: boolean
  TrackLinks?: 'None' | 'HtmlAndText' | 'HtmlOnly' | 'TextOnly'
  Attachments?: Array<{ Name: string; Content: string; ContentType: string }>
  Metadata?: Record<string, string>
  MessageStream?: string
}

export class PostmarkAdapter extends BaseIntegrationAdapter {
  private serverToken?: string
  private baseUrl = 'https://api.postmarkapp.com'

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: true, canReceiveMessages: true, canSendFiles: true, canSendImages: true,
      canSendVideo: false, canSendAudio: false, canSendLocation: false, canSendButtons: false,
      canSendCards: false, canSendCarousels: false, canSendQuickReplies: false, canSendTemplates: true,
      canScheduleMessages: false, canBroadcast: true, canTag: true, canAssign: false,
      canCreateTickets: false, canCreateLeads: false, canCreateContacts: false, canSyncContacts: false,
      canSyncConversations: false, canSyncTickets: false, canExportData: true, canImportData: false,
      canTrackEvents: true, canTrackMetrics: true, canGenerateReports: true, canCreateWorkflows: false,
      canTriggerActions: true, canListenToWebhooks: true, maxMessageLength: 0,
      maxFileSize: 10 * 1024 * 1024, maxBatchSize: 500, rateLimit: { messages: 300, period: 'per_minute' as const },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.serverToken = this.config.credentials.serverToken
    if (!this.serverToken) {
      return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing server token', retryable: false } }
    }
    this.isConnected = true
    return { success: true, data: undefined }
  }

  async disconnect(): Promise<IntegrationResponse<void>> {
    this.isConnected = false
    return { success: true, data: undefined }
  }

  async testConnection(): Promise<IntegrationResponse<boolean>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/server`, {
          headers: { 'X-Postmark-Server-Token': this.serverToken!, 'Accept': 'application/json' },
        })
        if (!response.ok) throw new Error(`Postmark API error: ${response.status}`)
        return await response.json()
      })
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  async sendEmail(email: PostmarkEmail): Promise<IntegrationResponse<{ MessageID: string; To: string }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/email`, {
          method: 'POST',
          headers: {
            'X-Postmark-Server-Token': this.serverToken!,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(email),
        })
        if (!response.ok) throw new Error(`Postmark API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async sendBatchEmails(emails: PostmarkEmail[]): Promise<IntegrationResponse<any[]>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/email/batch`, {
          method: 'POST',
          headers: {
            'X-Postmark-Server-Token': this.serverToken!,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emails),
        })
        if (!response.ok) throw new Error(`Postmark API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
