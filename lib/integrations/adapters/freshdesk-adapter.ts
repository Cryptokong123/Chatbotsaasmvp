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
 * - Knowledge base
 * - Solutions/Articles
 * - Email configurations
 * - Surveys
 * - Custom fields
 * - Attachments
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export interface FreshdeskTicket {
  id?: number
  subject: string
  description: string
  description_text?: string
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
  fwd_emails?: string[]
  reply_cc_emails?: string[]
  custom_fields?: Record<string, any>
  due_by?: string
  fr_due_by?: string
  is_escalated?: boolean
  spam?: boolean
  deleted?: boolean
  created_at?: string
  updated_at?: string
  stats?: {
    agent_responded_at?: string
    requester_responded_at?: string
    first_responded_at?: string
    status_updated_at?: string
    reopened_at?: string
    resolved_at?: string
    closed_at?: string
    pending_since?: string
  }
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
  view_all_tickets?: boolean
  other_emails?: string[]
  address?: string
  avatar?: any
  description?: string
  job_title?: string
  language?: string
  time_zone?: string
  tags?: string[]
  custom_fields?: Record<string, any>
  deleted?: boolean
  active?: boolean
  created_at?: string
  updated_at?: string
}

export interface FreshdeskCompany {
  id?: number
  name: string
  description?: string
  domains?: string[]
  note?: string
  health_score?: string
  account_tier?: string
  renewal_date?: string
  industry?: string
  custom_fields?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface FreshdeskAgent {
  id?: number
  available?: boolean
  available_since?: string
  contact?: {
    active?: boolean
    email?: string
    job_title?: string
    language?: string
    mobile?: string
    name?: string
    phone?: string
    time_zone?: string
  }
  created_at?: string
  updated_at?: string
  group_ids?: number[]
  role_ids?: number[]
  signature?: string
  ticket_scope?: number
  occasional?: boolean
  type?: 'support_agent' | 'field_agent'
}

export interface FreshdeskGroup {
  id?: number
  name: string
  description?: string
  escalate_to?: number
  unassigned_for?: string
  business_hours_id?: number
  agent_ids?: number[]
  created_at?: string
  updated_at?: string
}

export interface FreshdeskConversation {
  id?: number
  body: string
  body_text?: string
  from_email?: string
  user_id?: number
  to_emails?: string[]
  cc_emails?: string[]
  bcc_emails?: string[]
  private?: boolean
  incoming?: boolean
  source?: number
  support_email?: string
  ticket_id?: number
  attachments?: FreshdeskAttachment[]
  created_at?: string
  updated_at?: string
}

export interface FreshdeskNote {
  body: string
  body_text?: string
  notify_emails?: string[]
  user_id?: number
  private?: boolean
  incoming?: boolean
}

export interface FreshdeskFolder {
  id?: number
  name: string
  description?: string
  visibility?: 1 | 2 | 3 | 4 // All, Logged in users, Agents, Selected companies
  category_id?: number
  company_ids?: number[]
  contact_segment_ids?: number[]
  created_at?: string
  updated_at?: string
}

export interface FreshdeskArticle {
  id?: number
  title: string
  description: string
  description_text?: string
  status?: 1 | 2 // Draft, Published
  type?: 1 | 2 // Permanent, Workaround
  folder_id: number
  category_id?: number
  tags?: string[]
  seo_data?: {
    meta_title?: string
    meta_description?: string
    meta_keywords?: string[]
  }
  thumbs_up?: number
  thumbs_down?: number
  hits?: number
  suggested?: boolean
  created_at?: string
  updated_at?: string
}

export interface FreshdeskCannedResponse {
  id?: number
  title: string
  content: string
  content_html?: string
  group_ids?: number[]
  visibility?: 0 | 1 | 2 // Personal, Global, Group
  created_at?: string
  updated_at?: string
}

export interface FreshdeskTimeEntry {
  id?: number
  agent_id?: number
  billable?: boolean
  executed_at?: string
  note?: string
  start_time?: string
  time_spent: string // HH:MM format
  timer_running?: boolean
  ticket_id?: number
  created_at?: string
  updated_at?: string
}

export interface FreshdeskSLAPolicy {
  id?: number
  name: string
  description?: string
  position?: number
  is_default?: boolean
  active?: boolean
  deleted?: boolean
  business_hours_id?: number
  escalation?: {
    type?: 1 | 2
    priority_id?: number
    email_to?: string[]
  }[]
  applicable_to?: {
    type?: string
    values?: any[]
  }[]
  created_at?: string
  updated_at?: string
}

export interface FreshdeskProduct {
  id?: number
  name: string
  description?: string
  primary_email?: string
  created_at?: string
  updated_at?: string
}

export interface FreshdeskEmailConfig {
  id?: number
  name: string
  product_id?: number
  to_email?: string
  reply_email?: string
  group_id?: number
  primary_role?: boolean
  active?: boolean
  created_at?: string
  updated_at?: string
}

export interface FreshdeskSurvey {
  id?: number
  name: string
  active?: boolean
  questions?: Array<{
    id?: number
    text?: string
    type?: string
    required?: boolean
  }>
  created_at?: string
  updated_at?: string
}

export interface FreshdeskAttachment {
  id?: number
  name: string
  content_type?: string
  size?: number
  attachment_url?: string
  thumb_url?: string
  created_at?: string
  updated_at?: string
}

export interface FreshdeskTicketField {
  id?: number
  name: string
  label: string
  description?: string
  type?: string
  default?: boolean
  customers_can_edit?: boolean
  required_for_closure?: boolean
  required_for_agents?: boolean
  required_for_customers?: boolean
  label_for_customers?: string
  choices?: Record<string, string>
  portal_cc?: boolean
  portal_cc_to?: string
  created_at?: string
  updated_at?: string
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

  private getMultipartHeaders(): Record<string, string> {
    const credentials = Buffer.from(`${this.apiKey}:X`).toString('base64')
    return { 'Authorization': `Basic ${credentials}` }
  }

  // ==================== Ticket Management ====================

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

  async getTicket(ticketId: number, include?: string[]): Promise<IntegrationResponse<FreshdeskTicket>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (include && include.length > 0) {
        query.set('include', include.join(','))
      }
      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/tickets/${ticketId}${query.toString() ? `?${query}` : ''}`,
          { headers: this.getHeaders() }
        )
        if (!response.ok) throw new Error(`Freshdesk API error: ${response.status}`)
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

  async deleteTicket(ticketId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshdesk API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listTickets(params?: {
    page?: number
    per_page?: number
    order_by?: string
    order_type?: 'asc' | 'desc'
    include?: string[]
  }): Promise<IntegrationResponse<FreshdeskTicket[]>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page) query.set('page', params.page.toString())
      if (params?.per_page) query.set('per_page', params.per_page.toString())
      if (params?.order_by) query.set('order_by', params.order_by)
      if (params?.order_type) query.set('order_type', params.order_type)
      if (params?.include && params.include.length > 0) {
        query.set('include', params.include.join(','))
      }
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

  async filterTickets(query: string): Promise<IntegrationResponse<{ results: FreshdeskTicket[]; total: number }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/search/tickets?query="${encodeURIComponent(query)}"`, {
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

  async assignTicket(ticketId: number, responderId: number): Promise<IntegrationResponse<FreshdeskTicket>> {
    return this.updateTicket(ticketId, { responder_id: responderId })
  }

  async closeTicket(ticketId: number): Promise<IntegrationResponse<FreshdeskTicket>> {
    return this.updateTicket(ticketId, { status: 5 }) // 5 = Closed
  }

  async reopenTicket(ticketId: number): Promise<IntegrationResponse<FreshdeskTicket>> {
    return this.updateTicket(ticketId, { status: 2 }) // 2 = Open
  }

  async spamTicket(ticketId: number): Promise<IntegrationResponse<FreshdeskTicket>> {
    return this.updateTicket(ticketId, { spam: true })
  }

  async restoreTicket(ticketId: number): Promise<IntegrationResponse<FreshdeskTicket>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}/restore`, {
          method: 'PUT',
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

  async listDeletedTickets(params?: { page?: number }): Promise<IntegrationResponse<FreshdeskTicket[]>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page) query.set('page', params.page.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/deleted${query.toString() ? `?${query}` : ''}`, {
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

  // ==================== Contact Management ====================

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

  async getContact(contactId: number): Promise<IntegrationResponse<FreshdeskContact>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/${contactId}`, {
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

  async updateContact(contactId: number, updates: Partial<FreshdeskContact>): Promise<IntegrationResponse<FreshdeskContact>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/${contactId}`, {
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

  async deleteContact(contactId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/${contactId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshdesk API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listContacts(params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<FreshdeskContact[]>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page) query.set('page', params.page.toString())
      if (params?.per_page) query.set('per_page', params.per_page.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts${query.toString() ? `?${query}` : ''}`, {
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

  async searchContacts(query: string): Promise<IntegrationResponse<{ results: FreshdeskContact[]; total: number }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/search/contacts?query="${encodeURIComponent(query)}"`, {
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

  async filterContacts(query: string): Promise<IntegrationResponse<{ results: FreshdeskContact[]; total: number }>> {
    return this.searchContacts(query)
  }

  async makeContactAnAgent(contactId: number): Promise<IntegrationResponse<FreshdeskAgent>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/${contactId}/make_agent`, {
          method: 'PUT',
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

  // ==================== Company Management ====================

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

  async getCompany(companyId: number): Promise<IntegrationResponse<FreshdeskCompany>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/companies/${companyId}`, {
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

  async updateCompany(companyId: number, updates: Partial<FreshdeskCompany>): Promise<IntegrationResponse<FreshdeskCompany>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/companies/${companyId}`, {
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

  async deleteCompany(companyId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/companies/${companyId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshdesk API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listCompanies(params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<FreshdeskCompany[]>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page) query.set('page', params.page.toString())
      if (params?.per_page) query.set('per_page', params.per_page.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/companies${query.toString() ? `?${query}` : ''}`, {
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

  async filterCompanies(query: string): Promise<IntegrationResponse<{ results: FreshdeskCompany[]; total: number }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/search/companies?query="${encodeURIComponent(query)}"`, {
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

  // ==================== Agent Management ====================

  async listAgents(params?: { page?: number; per_page?: number; email?: string }): Promise<IntegrationResponse<FreshdeskAgent[]>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page) query.set('page', params.page.toString())
      if (params?.per_page) query.set('per_page', params.per_page.toString())
      if (params?.email) query.set('email', params.email)
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/agents${query.toString() ? `?${query}` : ''}`, {
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

  async getAgent(agentId: number): Promise<IntegrationResponse<FreshdeskAgent>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/agents/${agentId}`, {
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

  async updateAgent(agentId: number, updates: Partial<FreshdeskAgent>): Promise<IntegrationResponse<FreshdeskAgent>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/agents/${agentId}`, {
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

  async deleteAgent(agentId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/agents/${agentId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshdesk API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getCurrentAgent(): Promise<IntegrationResponse<FreshdeskAgent>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/agents/me`, {
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

  // ==================== Group Management ====================

  async listGroups(params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<FreshdeskGroup[]>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page) query.set('page', params.page.toString())
      if (params?.per_page) query.set('per_page', params.per_page.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/groups${query.toString() ? `?${query}` : ''}`, {
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

  async getGroup(groupId: number): Promise<IntegrationResponse<FreshdeskGroup>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/groups/${groupId}`, {
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

  async createGroup(group: Partial<FreshdeskGroup>): Promise<IntegrationResponse<FreshdeskGroup>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/groups`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(group),
        })
        if (!response.ok) throw new Error(`Freshdesk API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateGroup(groupId: number, updates: Partial<FreshdeskGroup>): Promise<IntegrationResponse<FreshdeskGroup>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/groups/${groupId}`, {
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

  // ==================== Conversations & Notes ====================

  async listConversations(ticketId: number): Promise<IntegrationResponse<FreshdeskConversation[]>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}/conversations`, {
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

  async addNote(ticketId: number, note: FreshdeskNote): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}/notes`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(note),
        })
        if (!response.ok) throw new Error(`Freshdesk API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateConversation(
    conversationId: number,
    updates: { body: string }
  ): Promise<IntegrationResponse<FreshdeskConversation>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/${conversationId}`, {
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

  async deleteConversation(conversationId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/${conversationId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshdesk API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Knowledge Base (Solutions) ====================

  async listFolders(categoryId: number): Promise<IntegrationResponse<FreshdeskFolder[]>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/solutions/categories/${categoryId}/folders`, {
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

  async createFolder(categoryId: number, folder: Partial<FreshdeskFolder>): Promise<IntegrationResponse<FreshdeskFolder>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/solutions/categories/${categoryId}/folders`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(folder),
        })
        if (!response.ok) throw new Error(`Freshdesk API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listArticles(folderId: number): Promise<IntegrationResponse<FreshdeskArticle[]>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/solutions/folders/${folderId}/articles`, {
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

  async getArticle(articleId: number): Promise<IntegrationResponse<FreshdeskArticle>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/solutions/articles/${articleId}`, {
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

  async createArticle(folderId: number, article: Partial<FreshdeskArticle>): Promise<IntegrationResponse<FreshdeskArticle>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/solutions/folders/${folderId}/articles`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(article),
        })
        if (!response.ok) throw new Error(`Freshdesk API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateArticle(articleId: number, updates: Partial<FreshdeskArticle>): Promise<IntegrationResponse<FreshdeskArticle>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/solutions/articles/${articleId}`, {
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

  async deleteArticle(articleId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/solutions/articles/${articleId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshdesk API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async searchArticles(term: string): Promise<IntegrationResponse<FreshdeskArticle[]>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/search/solutions?term=${encodeURIComponent(term)}`, {
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

  // ==================== Canned Responses ====================

  async listCannedResponses(params?: { type?: 'personal' | 'global' | 'group' }): Promise<IntegrationResponse<FreshdeskCannedResponse[]>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.type) query.set('type', params.type)
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/canned_responses${query.toString() ? `?${query}` : ''}`, {
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

  async getCannedResponse(responseId: number): Promise<IntegrationResponse<FreshdeskCannedResponse>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/canned_responses/${responseId}`, {
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

  async createCannedResponse(
    cannedResponse: Partial<FreshdeskCannedResponse>
  ): Promise<IntegrationResponse<FreshdeskCannedResponse>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/canned_responses`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(cannedResponse),
        })
        if (!response.ok) throw new Error(`Freshdesk API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateCannedResponse(
    responseId: number,
    updates: Partial<FreshdeskCannedResponse>
  ): Promise<IntegrationResponse<FreshdeskCannedResponse>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/canned_responses/${responseId}`, {
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

  async deleteCannedResponse(responseId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/canned_responses/${responseId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshdesk API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Time Tracking ====================

  async createTimeEntry(ticketId: number, timeEntry: Partial<FreshdeskTimeEntry>): Promise<IntegrationResponse<FreshdeskTimeEntry>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}/time_entries`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(timeEntry),
        })
        if (!response.ok) throw new Error(`Freshdesk API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listTimeEntries(ticketId: number): Promise<IntegrationResponse<FreshdeskTimeEntry[]>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}/time_entries`, {
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

  async updateTimeEntry(timeEntryId: number, updates: Partial<FreshdeskTimeEntry>): Promise<IntegrationResponse<FreshdeskTimeEntry>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/time_entries/${timeEntryId}`, {
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

  async deleteTimeEntry(timeEntryId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/time_entries/${timeEntryId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshdesk API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== SLA Policies ====================

  async listSLAPolicies(): Promise<IntegrationResponse<FreshdeskSLAPolicy[]>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/sla_policies`, {
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

  async getSLAPolicy(policyId: number): Promise<IntegrationResponse<FreshdeskSLAPolicy>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/sla_policies/${policyId}`, {
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

  // ==================== Products ====================

  async listProducts(): Promise<IntegrationResponse<FreshdeskProduct[]>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/products`, {
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

  async getProduct(productId: number): Promise<IntegrationResponse<FreshdeskProduct>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/products/${productId}`, {
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

  async createProduct(product: Partial<FreshdeskProduct>): Promise<IntegrationResponse<FreshdeskProduct>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/products`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(product),
        })
        if (!response.ok) throw new Error(`Freshdesk API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateProduct(productId: number, updates: Partial<FreshdeskProduct>): Promise<IntegrationResponse<FreshdeskProduct>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/products/${productId}`, {
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

  // ==================== Email Configs ====================

  async listEmailConfigs(): Promise<IntegrationResponse<FreshdeskEmailConfig[]>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/email_configs`, {
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

  async getEmailConfig(emailConfigId: number): Promise<IntegrationResponse<FreshdeskEmailConfig>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/email_configs/${emailConfigId}`, {
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

  // ==================== Surveys ====================

  async listSurveys(): Promise<IntegrationResponse<FreshdeskSurvey[]>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/surveys/satisfaction_surveys`, {
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

  async getSurvey(surveyId: number): Promise<IntegrationResponse<FreshdeskSurvey>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/surveys/satisfaction_surveys/${surveyId}`, {
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

  async getSurveyResults(surveyId: number, params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page) query.set('page', params.page.toString())
      if (params?.per_page) query.set('per_page', params.per_page.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/surveys/satisfaction_surveys/${surveyId}/survey_results${query.toString() ? `?${query}` : ''}`,
          { headers: this.getHeaders() }
        )
        if (!response.ok) throw new Error(`Freshdesk API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Custom Fields ====================

  async listTicketFields(): Promise<IntegrationResponse<FreshdeskTicketField[]>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/ticket_fields`, {
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

  async listContactFields(): Promise<IntegrationResponse<FreshdeskTicketField[]>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contact_fields`, {
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

  // ==================== Attachments ====================

  async uploadAttachment(file: Buffer | Blob, fileName?: string): Promise<IntegrationResponse<FreshdeskAttachment>> {
    try {
      await this.ensureConnected()
      const formData = new FormData()
      const blob = file instanceof Buffer ? new Blob([file as any]) : file
      formData.append('attachments[]', blob as Blob, fileName || 'file')

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/attachments`, {
          method: 'POST',
          headers: this.getMultipartHeaders(),
          body: formData,
        })
        if (!response.ok) throw new Error(`Freshdesk API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getAttachment(attachmentId: number): Promise<IntegrationResponse<FreshdeskAttachment>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/attachments/${attachmentId}`, {
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

  async deleteAttachment(attachmentId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/attachments/${attachmentId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshdesk API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
