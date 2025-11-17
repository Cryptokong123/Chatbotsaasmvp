/**
 * Freshdesk Adapter
 *
 * Customer support ticketing system:
 * - Ticket management
 * - Contact management
 * - Company management
 * - Agent management
 * - Groups and roles
 * - Canned responses
 * - Time tracking
 * - SLA policies
 * - Automation
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export interface FreshdeskTicket {
  id?: number
  subject: string
  description: string
  status?: 2 | 3 | 4 | 5 | 6 | 7 // Open, Pending, Resolved, Closed, Waiting on Customer, Waiting on Third Party
  priority?: 1 | 2 | 3 | 4 // Low, Medium, High, Urgent
  source?: 1 | 2 | 3 | 7 | 8 | 9 | 10 // Email, Portal, Phone, Chat, Mobihelp, Feedback Widget, Outbound Email
  email?: string
  phone?: string
  name?: string
  requester_id?: number
  responder_id?: number
  company_id?: number
  group_id?: number
  product_id?: number
  type?: string
  tags?: string[]
  cc_emails?: string[]
  custom_fields?: Record<string, any>
  due_by?: string
  fr_due_by?: string
  created_at?: string
  updated_at?: string
}

export interface FreshdeskContact {
  id?: number
  name: string
  email?: string
  phone?: string
  mobile?: string
  twitter_id?: string
  unique_external_id?: string
  company_id?: number
  description?: string
  tags?: string[]
  custom_fields?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface FreshdeskCompany {
  id?: number
  name: string
  description?: string
  domains?: string[]
  note?: string
  custom_fields?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface FreshdeskConversation {
  body: string
  body_text?: string
  from_email?: string
  user_id?: number
  to_emails?: string[]
  cc_emails?: string[]
  bcc_emails?: string[]
  private?: boolean
  incoming?: boolean
  attachments?: any[]
}

export class FreshdeskAdapter extends BaseIntegrationAdapter {
  private domain?: string
  private apiKey?: string
  private baseUrl?: string

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: true, canReceiveMessages: true, canSendFiles: true, canSendImages: true,
      canSendVideo: false, canSendAudio: false, canSendLocation: false, canSendButtons: false,
      canSendCards: false, canSendCarousels: false, canSendQuickReplies: false, canSendTemplates: false,
      canScheduleMessages: false, canBroadcast: false, canTag: true, canAssign: true,
      canCreateTickets: true, canCreateLeads: false, canCreateContacts: true, canSyncContacts: true,
      canSyncConversations: true, canSyncTickets: true, canExportData: true, canImportData: true,
      canTrackEvents: true, canTrackMetrics: true, canGenerateReports: true, canCreateWorkflows: true,
      canTriggerActions: true, canListenToWebhooks: true, maxMessageLength: 65535,
      maxFileSize: 20 * 1024 * 1024, maxBatchSize: 100, rateLimit: { messages: 50, period: 'per_minute' as const },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.domain = this.config.credentials.domain
    this.apiKey = this.config.credentials.apiKey
    if (!this.domain || !this.apiKey) {
      return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing credentials', retryable: false } }
    }
    this.baseUrl = `https://${this.domain}.freshdesk.com/api/v2`
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
      const result = await this.listTickets({ page: 1, per_page: 1 })
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  private getHeaders(): Record<string, string> {
    const credentials = Buffer.from(`${this.apiKey}:X`).toString('base64')
    return { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/json' }
  }

  async createTicket(ticket: FreshdeskTicket): Promise<IntegrationResponse<FreshdeskTicket>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(ticket),
        })
        if (!response.ok) throw new Error(`Freshdesk API error: ${response.status} ${await response.text()}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateTicket(ticketId: number, updates: Partial<FreshdeskTicket>): Promise<IntegrationResponse<FreshdeskTicket>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`Freshdesk API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getTicket(ticketId: number): Promise<IntegrationResponse<FreshdeskTicket>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}`, { headers: this.getHeaders() })
        if (!response.ok) throw new Error(`Freshdesk API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listTickets(params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<FreshdeskTicket[]>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page) query.set('page', params.page.toString())
      if (params?.per_page) query.set('per_page', params.per_page.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshdesk API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createContact(contact: FreshdeskContact): Promise<IntegrationResponse<FreshdeskContact>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(contact),
        })
        if (!response.ok) throw new Error(`Freshdesk API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createCompany(company: FreshdeskCompany): Promise<IntegrationResponse<FreshdeskCompany>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/companies`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(company),
        })
        if (!response.ok) throw new Error(`Freshdesk API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async addReply(ticketId: number, reply: FreshdeskConversation): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}/reply`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(reply),
        })
        if (!response.ok) throw new Error(`Freshdesk API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
