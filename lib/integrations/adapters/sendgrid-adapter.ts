/**
 * SendGrid Adapter - Email delivery platform
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export interface SendGridEmail {
  personalizations: Array<{
    to: Array<{ email: string; name?: string }>
    cc?: Array<{ email: string; name?: string }>
    bcc?: Array<{ email: string; name?: string }>
    subject?: string
    headers?: Record<string, string>
    substitutions?: Record<string, string>
    dynamic_template_data?: Record<string, any>
    custom_args?: Record<string, string>
    send_at?: number
  }>
  from: { email: string; name?: string }
  reply_to?: { email: string; name?: string }
  subject?: string
  content?: Array<{ type: 'text/plain' | 'text/html'; value: string }>
  attachments?: Array<{
    content: string
    filename: string
    type?: string
    disposition?: 'inline' | 'attachment'
    content_id?: string
  }>
  template_id?: string
  categories?: string[]
  send_at?: number
  batch_id?: string
  asm?: { group_id: number; groups_to_display?: number[] }
  ip_pool_name?: string
  mail_settings?: any
  tracking_settings?: any
}

export interface SendGridContact {
  email: string
  first_name?: string
  last_name?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  state_province_region?: string
  postal_code?: string
  country?: string
  phone_number?: string
  whatsapp?: string
  line?: string
  facebook?: string
  unique_name?: string
  custom_fields?: Record<string, any>
  list_ids?: string[]
}

export interface SendGridList {
  id?: string
  name: string
  contact_count?: number
  _metadata?: any
}

export class SendGridAdapter extends BaseIntegrationAdapter {
  private apiKey?: string
  private baseUrl = 'https://api.sendgrid.com/v3'

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: true, canReceiveMessages: false, canSendFiles: true, canSendImages: true,
      canSendVideo: false, canSendAudio: false, canSendLocation: false, canSendButtons: false,
      canSendCards: false, canSendCarousels: false, canSendQuickReplies: false, canSendTemplates: true,
      canScheduleMessages: true, canBroadcast: true, canTag: true, canAssign: false,
      canCreateTickets: false, canCreateLeads: false, canCreateContacts: true, canSyncContacts: true,
      canSyncConversations: false, canSyncTickets: false, canExportData: true, canImportData: true,
      canTrackEvents: true, canTrackMetrics: true, canGenerateReports: true, canCreateWorkflows: false,
      canTriggerActions: true, canListenToWebhooks: true, maxMessageLength: 0,
      maxFileSize: 30 * 1024 * 1024, maxBatchSize: 1000, rateLimit: { messages: 1000, period: 'per_second' as const },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.apiKey = this.config.credentials.apiKey
    if (!this.apiKey) {
      return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing API key', retryable: false } }
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
        const response = await fetch(`${this.baseUrl}/scopes`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return await response.json()
      })
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  private getHeaders(): Record<string, string> {
    return { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' }
  }

  async sendEmail(email: SendGridEmail): Promise<IntegrationResponse<{ message_id: string }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/mail/send`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(email),
        })
        if (!response.ok) {
          const error = await response.text()
          throw new Error(`SendGrid API error: ${response.status} ${error}`)
        }
        const messageId = response.headers.get('x-message-id')
        return { message_id: messageId || 'sent' }
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async sendSimpleEmail(params: {
    to: string | string[]
    from: string
    subject: string
    text?: string
    html?: string
  }): Promise<IntegrationResponse<{ message_id: string }>> {
    const toEmails = Array.isArray(params.to) ? params.to : [params.to]
    const email: SendGridEmail = {
      personalizations: [
        {
          to: toEmails.map(email => ({ email })),
          subject: params.subject,
        },
      ],
      from: { email: params.from },
      content: [],
    }

    if (params.text) email.content!.push({ type: 'text/plain', value: params.text })
    if (params.html) email.content!.push({ type: 'text/html', value: params.html })

    return this.sendEmail(email)
  }

  async sendTemplateEmail(params: {
    to: string | string[]
    from: string
    templateId: string
    dynamicData?: Record<string, any>
  }): Promise<IntegrationResponse<{ message_id: string }>> {
    const toEmails = Array.isArray(params.to) ? params.to : [params.to]
    const email: SendGridEmail = {
      personalizations: [
        {
          to: toEmails.map(email => ({ email })),
          dynamic_template_data: params.dynamicData,
        },
      ],
      from: { email: params.from },
      template_id: params.templateId,
    }

    return this.sendEmail(email)
  }

  async addContact(contact: SendGridContact): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/marketing/contacts`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ contacts: [contact] }),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createList(list: SendGridList): Promise<IntegrationResponse<SendGridList>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/marketing/lists`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(list),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getEmailActivity(params: { limit?: number; query?: string }): Promise<IntegrationResponse<{ messages: any[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params.limit) query.set('limit', params.limit.toString())
      if (params.query) query.set('query', params.query)
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/messages${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getStats(params?: { start_date?: string; end_date?: string }): Promise<IntegrationResponse<any[]>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.start_date) query.set('start_date', params.start_date)
      if (params?.end_date) query.set('end_date', params.end_date)
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/stats${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
