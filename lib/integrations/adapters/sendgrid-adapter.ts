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
  mail_settings?: {
    bypass_list_management?: { enable: boolean }
    footer?: { enable: boolean; text?: string; html?: string }
    sandbox_mode?: { enable: boolean }
  }
  tracking_settings?: {
    click_tracking?: { enable: boolean; enable_text?: boolean }
    open_tracking?: { enable: boolean; substitution_tag?: string }
    subscription_tracking?: { enable: boolean; text?: string; html?: string; substitution_tag?: string }
    ganalytics?: { enable: boolean; utm_source?: string; utm_medium?: string; utm_term?: string; utm_content?: string; utm_campaign?: string }
  }
}

export interface SendGridContact {
  id?: string
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
  created_at?: string
  updated_at?: string
}

export interface SendGridList {
  id?: string
  name: string
  contact_count?: number
  _metadata?: {
    self?: string
  }
}

export interface SendGridTemplate {
  id?: string
  name: string
  generation?: 'legacy' | 'dynamic'
  updated_at?: string
  versions?: SendGridTemplateVersion[]
}

export interface SendGridTemplateVersion {
  id?: string
  template_id?: string
  active?: number
  name: string
  html_content?: string
  plain_content?: string
  generate_plain_content?: boolean
  subject: string
  updated_at?: string
  editor?: 'code' | 'design'
}

export interface SendGridCampaign {
  id?: string
  title: string
  subject?: string
  sender_id?: number
  list_ids?: string[]
  segment_ids?: string[]
  categories?: string[]
  suppression_group_id?: number
  custom_unsubscribe_url?: string
  ip_pool?: string
  html_content?: string
  plain_content?: string
  status?: 'draft' | 'scheduled' | 'triggered'
  send_at?: string
}

export interface SendGridSender {
  id?: number
  nickname: string
  from: {
    email: string
    name?: string
  }
  reply_to?: {
    email: string
    name?: string
  }
  address: string
  address_2?: string
  city: string
  state?: string
  zip?: string
  country: string
  verified?: boolean
  locked?: boolean
}

export interface SendGridSuppressionGroup {
  id?: number
  name: string
  description: string
  is_default?: boolean
  unsubscribes?: number
}

export interface SendGridBounce {
  created: number
  email: string
  reason: string
  status: string
}

export interface SendGridBlock {
  created: number
  email: string
  reason: string
  status?: string
}

export interface SendGridSpamReport {
  created: number
  email: string
  ip: string
}

export interface SendGridInvalidEmail {
  created: number
  email: string
  reason: string
}

export interface SendGridStats {
  date: string
  stats: Array<{
    metrics: {
      blocks: number
      bounce_drops: number
      bounces: number
      clicks: number
      deferred: number
      delivered: number
      invalid_emails: number
      opens: number
      processed: number
      requests: number
      spam_report_drops: number
      spam_reports: number
      unique_clicks: number
      unique_opens: number
      unsubscribe_drops: number
      unsubscribes: number
    }
  }>
}

export interface SendGridWebhookSettings {
  enabled: boolean
  url: string
  group_resubscribe?: boolean
  delivered?: boolean
  group_unsubscribe?: boolean
  spam_report?: boolean
  bounce?: boolean
  deferred?: boolean
  unsubscribe?: boolean
  dropped?: boolean
  open?: boolean
  click?: boolean
  processed?: boolean
  oauth_client_id?: string
  oauth_token_url?: string
}

export interface SendGridAPIKey {
  api_key_id?: string
  api_key?: string
  name: string
  scopes?: string[]
}

export interface SendGridSubuser {
  id?: number
  username: string
  email: string
  disabled?: boolean
}

export interface SendGridIPAddress {
  ip: string
  pools?: string[]
  warmup?: boolean
  start_date?: number
  subusers?: string[]
  rdns?: string
  assigned_at?: number
}

export interface SendGridIPPool {
  name: string
  ips?: string[]
}

export interface SendGridCustomField {
  id?: string
  name: string
  field_type: 'Text' | 'Number' | 'Date'
}

export interface SendGridSegment {
  id?: string
  name: string
  list_id?: string
  conditions?: Array<{
    field: string
    value: string
    operator: 'eq' | 'ne' | 'lt' | 'gt' | 'contains'
    and_or?: 'and' | 'or'
  }>
  recipient_count?: number
  created_at?: string
  updated_at?: string
}

export interface SendGridDesign {
  id?: string
  name: string
  editor: 'code' | 'design'
  html_content?: string
  plain_content?: string
  generate_plain_content?: boolean
  thumbnail_url?: string
  subject?: string
  categories?: string[]
  created_at?: string
  updated_at?: string
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

  // ===========================
  // Email Sending
  // ===========================

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

  async sendBatchEmail(emails: SendGridEmail[]): Promise<IntegrationResponse<{ message_ids: string[] }>> {
    try {
      await this.ensureConnected()
      const messageIds: string[] = []

      for (const email of emails) {
        const result = await this.sendEmail(email)
        if (result.success && result.data) {
          messageIds.push(result.data.message_id)
        } else {
          return { success: false, error: result.error }
        }
      }

      return { success: true, data: { message_ids: messageIds } }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async scheduleEmail(email: SendGridEmail, sendAt: Date): Promise<IntegrationResponse<{ message_id: string; batch_id: string }>> {
    try {
      await this.ensureConnected()

      // First, create a batch ID
      const batchResult = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/mail/batch`, {
          method: 'POST',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return await response.json()
      })

      if (!batchResult.success) {
        return { success: false, error: batchResult.error }
      }

      const batchId = batchResult.data.batch_id
      email.batch_id = batchId
      email.send_at = Math.floor(sendAt.getTime() / 1000)

      const sendResult = await this.sendEmail(email)

      if (sendResult.success) {
        return { success: true, data: { message_id: sendResult.data!.message_id, batch_id: batchId } }
      }

      return { success: false, error: sendResult.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async cancelScheduledEmail(batchId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/user/scheduled_sends`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ batch_id: batchId, status: 'cancel' }),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async pauseScheduledEmail(batchId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/user/scheduled_sends`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ batch_id: batchId, status: 'pause' }),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Templates
  // ===========================

  async createTemplate(template: Partial<SendGridTemplate>): Promise<IntegrationResponse<SendGridTemplate>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/templates`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(template),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getTemplate(templateId: string): Promise<IntegrationResponse<SendGridTemplate>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/templates/${templateId}`, {
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

  async listTemplates(params?: { generations?: string; page_size?: number }): Promise<IntegrationResponse<{ result: SendGridTemplate[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.generations) query.set('generations', params.generations)
      if (params?.page_size) query.set('page_size', params.page_size.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/templates${query.toString() ? `?${query}` : ''}`, {
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

  async updateTemplate(templateId: string, template: Partial<SendGridTemplate>): Promise<IntegrationResponse<SendGridTemplate>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/templates/${templateId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(template),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteTemplate(templateId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/templates/${templateId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createTemplateVersion(templateId: string, version: Partial<SendGridTemplateVersion>): Promise<IntegrationResponse<SendGridTemplateVersion>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/templates/${templateId}/versions`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(version),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async activateTemplateVersion(templateId: string, versionId: string): Promise<IntegrationResponse<SendGridTemplateVersion>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/templates/${templateId}/versions/${versionId}/activate`, {
          method: 'POST',
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

  // ===========================
  // Contacts & Lists
  // ===========================

  async addContact(contact: SendGridContact): Promise<IntegrationResponse<{ job_id: string }>> {
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

  async addContactsBatch(contacts: SendGridContact[]): Promise<IntegrationResponse<{ job_id: string }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/marketing/contacts`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ contacts }),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getContact(contactId: string): Promise<IntegrationResponse<SendGridContact>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/marketing/contacts/${contactId}`, {
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

  async searchContacts(query: { query: string }): Promise<IntegrationResponse<{ result: SendGridContact[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/marketing/contacts/search`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(query),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteContact(contactId: string): Promise<IntegrationResponse<{ job_id: string }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/marketing/contacts?ids=${contactId}`, {
          method: 'DELETE',
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

  async getContactCount(): Promise<IntegrationResponse<{ contact_count: number }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/marketing/contacts/count`, {
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

  async getLists(params?: { page_size?: number; page_token?: string }): Promise<IntegrationResponse<{ result: SendGridList[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page_size) query.set('page_size', params.page_size.toString())
      if (params?.page_token) query.set('page_token', params.page_token)

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/marketing/lists${query.toString() ? `?${query}` : ''}`, {
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

  async getList(listId: string): Promise<IntegrationResponse<SendGridList>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/marketing/lists/${listId}`, {
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

  async updateList(listId: string, list: Partial<SendGridList>): Promise<IntegrationResponse<SendGridList>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/marketing/lists/${listId}`, {
          method: 'PATCH',
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

  async deleteList(listId: string, deleteContacts: boolean = false): Promise<IntegrationResponse<{ job_id: string }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/marketing/lists/${listId}?delete_contacts=${deleteContacts}`, {
          method: 'DELETE',
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

  // ===========================
  // Campaigns
  // ===========================

  async createCampaign(campaign: Partial<SendGridCampaign>): Promise<IntegrationResponse<SendGridCampaign>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/marketing/singlesends`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(campaign),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getCampaign(campaignId: string): Promise<IntegrationResponse<SendGridCampaign>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/marketing/singlesends/${campaignId}`, {
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

  async listCampaigns(params?: { page_size?: number; page_token?: string }): Promise<IntegrationResponse<{ result: SendGridCampaign[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page_size) query.set('page_size', params.page_size.toString())
      if (params?.page_token) query.set('page_token', params.page_token)

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/marketing/singlesends${query.toString() ? `?${query}` : ''}`, {
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

  async updateCampaign(campaignId: string, campaign: Partial<SendGridCampaign>): Promise<IntegrationResponse<SendGridCampaign>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/marketing/singlesends/${campaignId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(campaign),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteCampaign(campaignId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/marketing/singlesends/${campaignId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async scheduleCampaign(campaignId: string, sendAt: string): Promise<IntegrationResponse<SendGridCampaign>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/marketing/singlesends/${campaignId}/schedule`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ send_at: sendAt }),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Senders
  // ===========================

  async createSender(sender: Partial<SendGridSender>): Promise<IntegrationResponse<SendGridSender>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/marketing/senders`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(sender),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getSenders(): Promise<IntegrationResponse<{ results: SendGridSender[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/marketing/senders`, {
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

  async getSender(senderId: number): Promise<IntegrationResponse<SendGridSender>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/marketing/senders/${senderId}`, {
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

  async updateSender(senderId: number, sender: Partial<SendGridSender>): Promise<IntegrationResponse<SendGridSender>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/marketing/senders/${senderId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(sender),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteSender(senderId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/marketing/senders/${senderId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Suppressions
  // ===========================

  async getBounces(params?: { start_time?: number; end_time?: number }): Promise<IntegrationResponse<SendGridBounce[]>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.start_time) query.set('start_time', params.start_time.toString())
      if (params?.end_time) query.set('end_time', params.end_time.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/suppression/bounces${query.toString() ? `?${query}` : ''}`, {
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

  async deleteBounce(email: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/suppression/bounces/${email}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getBlocks(params?: { start_time?: number; end_time?: number }): Promise<IntegrationResponse<SendGridBlock[]>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.start_time) query.set('start_time', params.start_time.toString())
      if (params?.end_time) query.set('end_time', params.end_time.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/suppression/blocks${query.toString() ? `?${query}` : ''}`, {
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

  async deleteBlock(email: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/suppression/blocks/${email}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getSpamReports(params?: { start_time?: number; end_time?: number }): Promise<IntegrationResponse<SendGridSpamReport[]>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.start_time) query.set('start_time', params.start_time.toString())
      if (params?.end_time) query.set('end_time', params.end_time.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/suppression/spam_reports${query.toString() ? `?${query}` : ''}`, {
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

  async deleteSpamReport(email: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/suppression/spam_reports/${email}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getInvalidEmails(params?: { start_time?: number; end_time?: number }): Promise<IntegrationResponse<SendGridInvalidEmail[]>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.start_time) query.set('start_time', params.start_time.toString())
      if (params?.end_time) query.set('end_time', params.end_time.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/suppression/invalid_emails${query.toString() ? `?${query}` : ''}`, {
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

  async deleteInvalidEmail(email: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/suppression/invalid_emails/${email}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createSuppressionGroup(group: Partial<SendGridSuppressionGroup>): Promise<IntegrationResponse<SendGridSuppressionGroup>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/asm/groups`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(group),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getSuppressionGroups(): Promise<IntegrationResponse<SendGridSuppressionGroup[]>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/asm/groups`, {
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

  // ===========================
  // Stats & Analytics
  // ===========================

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

  async getStats(params?: { start_date?: string; end_date?: string; aggregated_by?: 'day' | 'week' | 'month' }): Promise<IntegrationResponse<SendGridStats[]>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.start_date) query.set('start_date', params.start_date)
      if (params?.end_date) query.set('end_date', params.end_date)
      if (params?.aggregated_by) query.set('aggregated_by', params.aggregated_by)

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

  async getCategoryStats(categories: string[], params?: { start_date?: string; end_date?: string }): Promise<IntegrationResponse<SendGridStats[]>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      categories.forEach(cat => query.append('categories', cat))
      if (params?.start_date) query.set('start_date', params.start_date)
      if (params?.end_date) query.set('end_date', params.end_date)

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/categories/stats${query.toString() ? `?${query}` : ''}`, {
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

  async getGlobalStats(params?: { start_date?: string; end_date?: string }): Promise<IntegrationResponse<SendGridStats[]>> {
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

  // ===========================
  // Webhooks
  // ===========================

  async getWebhookSettings(): Promise<IntegrationResponse<SendGridWebhookSettings>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/user/webhooks/event/settings`, {
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

  async updateWebhookSettings(settings: Partial<SendGridWebhookSettings>): Promise<IntegrationResponse<SendGridWebhookSettings>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/user/webhooks/event/settings`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(settings),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async testWebhook(url: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/user/webhooks/event/test`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ url }),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // IP Management
  // ===========================

  async getIPAddresses(): Promise<IntegrationResponse<SendGridIPAddress[]>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/ips`, {
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

  async getIPPools(): Promise<IntegrationResponse<SendGridIPPool[]>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/ips/pools`, {
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

  async createIPPool(pool: SendGridIPPool): Promise<IntegrationResponse<SendGridIPPool>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/ips/pools`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(pool),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async addIPToPool(poolName: string, ip: string): Promise<IntegrationResponse<SendGridIPPool>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/ips/pools/${poolName}/ips`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ ip }),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // API Keys
  // ===========================

  async createAPIKey(apiKey: SendGridAPIKey): Promise<IntegrationResponse<SendGridAPIKey>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/api_keys`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(apiKey),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getAPIKeys(): Promise<IntegrationResponse<{ result: SendGridAPIKey[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/api_keys`, {
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

  async deleteAPIKey(keyId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/api_keys/${keyId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Custom Fields & Segments
  // ===========================

  async createCustomField(field: SendGridCustomField): Promise<IntegrationResponse<SendGridCustomField>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/marketing/field_definitions`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(field),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getCustomFields(): Promise<IntegrationResponse<{ custom_fields: SendGridCustomField[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/marketing/field_definitions`, {
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

  async createSegment(segment: Partial<SendGridSegment>): Promise<IntegrationResponse<SendGridSegment>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/marketing/segments`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(segment),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getSegments(): Promise<IntegrationResponse<{ results: SendGridSegment[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/marketing/segments`, {
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

  // ===========================
  // Design Library
  // ===========================

  async createDesign(design: Partial<SendGridDesign>): Promise<IntegrationResponse<SendGridDesign>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/designs`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(design),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getDesigns(params?: { page_size?: number; page_token?: string }): Promise<IntegrationResponse<{ result: SendGridDesign[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page_size) query.set('page_size', params.page_size.toString())
      if (params?.page_token) query.set('page_token', params.page_token)

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/designs${query.toString() ? `?${query}` : ''}`, {
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

  async getDesign(designId: string): Promise<IntegrationResponse<SendGridDesign>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/designs/${designId}`, {
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

  async updateDesign(designId: string, design: Partial<SendGridDesign>): Promise<IntegrationResponse<SendGridDesign>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/designs/${designId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(design),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteDesign(designId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/designs/${designId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`SendGrid API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
