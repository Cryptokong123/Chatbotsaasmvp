/**
 * Mailgun Adapter - Transactional email service
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export interface MailgunMessage {
  from: string
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  text?: string
  html?: string
  template?: string
  'h:X-Mailgun-Variables'?: string
  'o:tag'?: string | string[]
  'o:campaign'?: string
  'o:deliverytime'?: string
  'o:testmode'?: boolean
  'o:tracking'?: boolean
  'o:tracking-clicks'?: boolean | 'htmlonly'
  'o:tracking-opens'?: boolean
  'o:require-tls'?: boolean
  'o:skip-verification'?: boolean
  attachment?: any[]
}

export class MailgunAdapter extends BaseIntegrationAdapter {
  private apiKey?: string
  private domain?: string
  private baseUrl?: string
  private region?: 'us' | 'eu'

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: true, canReceiveMessages: true, canSendFiles: true, canSendImages: true,
      canSendVideo: false, canSendAudio: false, canSendLocation: false, canSendButtons: false,
      canSendCards: false, canSendCarousels: false, canSendQuickReplies: false, canSendTemplates: true,
      canScheduleMessages: true, canBroadcast: true, canTag: true, canAssign: false,
      canCreateTickets: false, canCreateLeads: false, canCreateContacts: false, canSyncContacts: false,
      canSyncConversations: false, canSyncTickets: false, canExportData: true, canImportData: false,
      canTrackEvents: true, canTrackMetrics: true, canGenerateReports: true, canCreateWorkflows: false,
      canTriggerActions: true, canListenToWebhooks: true, maxMessageLength: 0,
      maxFileSize: 25 * 1024 * 1024, maxBatchSize: 1000, rateLimit: { messages: 1000, period: 'per_hour' as const },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.apiKey = this.config.credentials.apiKey
    this.domain = this.config.credentials.domain
    this.region = (this.config.credentials.region as 'us' | 'eu') || 'us'
    if (!this.apiKey || !this.domain) {
      return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing credentials', retryable: false } }
    }
    this.baseUrl = this.region === 'eu' ? 'https://api.eu.mailgun.net/v3' : 'https://api.mailgun.net/v3'
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
      const result = await this.getDomain()
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  private getHeaders(): Record<string, string> {
    const credentials = Buffer.from(`api:${this.apiKey}`).toString('base64')
    return { 'Authorization': `Basic ${credentials}` }
  }

  async sendEmail(message: MailgunMessage): Promise<IntegrationResponse<{ id: string; message: string }>> {
    try {
      await this.ensureConnected()
      const formData = new FormData()
      Object.entries(message).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => formData.append(key, v.toString()))
          } else {
            formData.append(key, value.toString())
          }
        }
      })

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/${this.domain}/messages`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: formData as any,
        })
        if (!response.ok) throw new Error(`Mailgun API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getDomain(): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/domains/${this.domain}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailgun API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getStats(params?: { event?: string; start?: string; end?: string }): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.event) query.set('event', params.event)
      if (params?.start) query.set('start', params.start)
      if (params?.end) query.set('end', params.end)
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/${this.domain}/stats/total${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailgun API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
