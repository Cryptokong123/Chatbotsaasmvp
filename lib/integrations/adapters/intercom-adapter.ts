/**
 * Intercom Adapter - Customer messaging platform
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export interface IntercomContact {
  id?: string
  external_id?: string
  email?: string
  phone?: string
  name?: string
  avatar?: string
  signed_up_at?: number
  last_seen_at?: number
  last_replied_at?: number
  last_contacted_at?: number
  last_email_opened_at?: number
  last_email_clicked_at?: number
  language_override?: string
  browser?: string
  browser_version?: string
  browser_language?: string
  os?: string
  location?: { country?: string; region?: string; city?: string }
  custom_attributes?: Record<string, any>
  tags?: { id?: string; name: string }[]
  notes?: { content: string }[]
  companies?: any[]
  created_at?: number
  updated_at?: number
  role?: 'user' | 'lead'
  unsubscribed_from_emails?: boolean
  marked_email_as_spam?: boolean
  has_hard_bounced?: boolean
  android_app_name?: string
  android_app_version?: string
  ios_app_name?: string
  ios_app_version?: string
  owner_id?: number
}

export interface IntercomConversation {
  id?: string
  type: 'user' | 'lead'
  created_at?: number
  updated_at?: number
  waiting_since?: number
  snoozed_until?: number
  source?: any
  contacts?: any[]
  teammates?: any[]
  admin_assignee_id?: number
  team_assignee_id?: number
  open?: boolean
  state?: 'open' | 'closed' | 'snoozed'
  read?: boolean
  priority?: 'priority' | 'not_priority'
  sla_applied?: any
  statistics?: any
  conversation_rating?: any
  first_contact_reply?: any
  custom_attributes?: Record<string, any>
  tags?: any[]
  conversation_parts?: IntercomConversationPart[]
  title?: string
}

export interface IntercomConversationPart {
  id?: string
  part_type: 'comment' | 'note' | 'assignment'
  body?: string
  created_at?: number
  updated_at?: number
  notified_at?: number
  assigned_to?: any
  author?: { type: string; id: string }
  attachments?: any[]
}

export interface IntercomMessage {
  message_type: 'inapp' | 'email' | 'push'
  subject?: string
  body: string
  from: { type: 'admin'; id: string }
  to: { type: 'user' | 'lead'; id?: string; email?: string; user_id?: string }
  create_conversation_without_contact_reply?: boolean
  template?: string
}

export interface IntercomCompany {
  id?: string
  company_id?: string
  name: string
  plan?: string
  size?: number
  website?: string
  industry?: string
  remote_created_at?: number
  monthly_spend?: number
  custom_attributes?: Record<string, any>
  created_at?: number
  updated_at?: number
}

export interface IntercomTag {
  id?: string
  name: string
  applied_at?: number
  applied_by?: { type: string; id: string }
}

export interface IntercomNote {
  id?: string
  contact?: { type: string; id: string }
  author?: { type: string; id: string }
  body: string
  created_at?: number
}

export interface IntercomSegment {
  id?: string
  name: string
  type?: 'user_segment' | 'company_segment'
  created_at?: number
  updated_at?: number
  person_type?: 'user' | 'lead'
  count?: number
}

export interface IntercomArticle {
  id?: string
  type?: 'article'
  workspace_id?: string
  title: string
  body?: string
  description?: string
  author_id?: number
  state?: 'draft' | 'published'
  created_at?: number
  updated_at?: number
  url?: string
  parent_id?: string
  parent_type?: 'collection'
  default_locale?: string
  translated_content?: any
}

export interface IntercomCollection {
  id?: string
  workspace_id?: string
  name: string
  description?: string
  created_at?: number
  updated_at?: number
  url?: string
  icon?: string
  order?: number
  default_locale?: string
  translated_content?: any
}

export interface IntercomAdmin {
  id?: string
  type: 'admin'
  name?: string
  email?: string
  email_verified?: boolean
  away_mode_enabled?: boolean
  away_mode_reassign?: boolean
  has_inbox_seat?: boolean
  team_ids?: number[]
  avatar?: any
}

export interface IntercomTeam {
  id?: string
  type: 'team'
  name: string
  admin_ids?: number[]
  admin_priority_level?: any
}

export interface IntercomDataAttribute {
  id?: number
  type?: 'data_attribute'
  name: string
  full_name?: string
  label: string
  description?: string
  data_type: 'string' | 'integer' | 'float' | 'boolean' | 'date' | 'datetime'
  options?: string[]
  api_writable?: boolean
  ui_writable?: boolean
  custom?: boolean
  archived?: boolean
  created_at?: number
  updated_at?: number
  model?: 'contact' | 'company' | 'conversation'
  admin_id?: string
}

export interface IntercomVisitor {
  id?: string
  type: 'visitor'
  user_id?: string
  anonymous?: boolean
  email?: string
  phone?: string
  name?: string
  pseudonym?: string
  avatar?: any
  location_data?: any
  last_request_at?: number
  created_at?: number
  remote_created_at?: number
  updated_at?: number
  signed_up_at?: number
  custom_attributes?: Record<string, any>
  referrer?: string
  utm_campaign?: string
  utm_content?: string
  utm_medium?: string
  utm_source?: string
  utm_term?: string
  do_not_track?: boolean
  marked_email_as_spam?: boolean
  unsubscribed_from_emails?: boolean
  has_hard_bounced?: boolean
  social_profiles?: any
  companies?: any
  segments?: any
  tags?: any
}

export interface IntercomNewsItem {
  id?: string
  workspace_id?: string
  title: string
  body?: string
  sender_id?: number
  state?: 'draft' | 'live'
  deliver_silently?: boolean
  labels?: string[]
  reactions?: string[]
  newsfeed_assignments?: Array<{
    newsfeed_id: number
    published_at?: number
  }>
  created_at?: number
  updated_at?: number
}

export interface IntercomSubscriptionType {
  id?: string
  type: 'subscription'
  state?: 'live' | 'draft' | 'archived'
  default_translation: {
    name: string
    description?: string
    locale: string
  }
  consent_type: 'opt_out' | 'opt_in'
  content_types: Array<'email' | 'sms' | 'in_app_message' | 'push'>
  translations?: Array<{
    name: string
    description?: string
    locale: string
  }>
}

export class IntercomAdapter extends BaseIntegrationAdapter {
  private accessToken?: string
  private baseUrl = 'https://api.intercom.io'
  private apiVersion = 'Unstable'

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: true, canReceiveMessages: true, canSendFiles: true, canSendImages: true,
      canSendVideo: false, canSendAudio: false, canSendLocation: false, canSendButtons: true,
      canSendCards: true, canSendCarousels: false, canSendQuickReplies: true, canSendTemplates: false,
      canScheduleMessages: false, canBroadcast: true, canTag: true, canAssign: true,
      canCreateTickets: false, canCreateLeads: true, canCreateContacts: true, canSyncContacts: true,
      canSyncConversations: true, canSyncTickets: false, canExportData: true, canImportData: true,
      canTrackEvents: true, canTrackMetrics: true, canGenerateReports: true, canCreateWorkflows: true,
      canTriggerActions: true, canListenToWebhooks: true, maxMessageLength: 10000,
      maxFileSize: 10 * 1024 * 1024, maxBatchSize: 100, rateLimit: { messages: 1000, period: 'per_minute' as const },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.accessToken = this.config.credentials.accessToken
    if (!this.accessToken) {
      return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing access token', retryable: false } }
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
        const response = await fetch(`${this.baseUrl}/me`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Intercom-Version': this.apiVersion,
    }
  }

  // ===========================
  // Contacts
  // ===========================

  async createContact(contact: IntercomContact): Promise<IntegrationResponse<IntercomContact>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(contact),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getContact(contactId: string): Promise<IntegrationResponse<IntercomContact>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/${contactId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateContact(contactId: string, contact: Partial<IntercomContact>): Promise<IntegrationResponse<IntercomContact>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/${contactId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(contact),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteContact(contactId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/${contactId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listContacts(params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<{ data: IntercomContact[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page) query.set('page', params.page.toString())
      if (params?.per_page) query.set('per_page', params.per_page.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async searchContacts(query: {
    query: {
      field: string
      operator: 'eq' | 'ne' | 'in' | 'nin' | 'lt' | 'lte' | 'gt' | 'gte' | 'contains'
      value: any
    }
    pagination?: { per_page?: number; starting_after?: string }
  }): Promise<IntegrationResponse<{ data: IntercomContact[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/search`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(query),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async mergeContacts(params: { from: string; into: string }): Promise<IntegrationResponse<IntercomContact>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/merge`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(params),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async archiveContact(contactId: string): Promise<IntegrationResponse<IntercomContact>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/${contactId}/archive`, {
          method: 'POST',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async unarchiveContact(contactId: string): Promise<IntegrationResponse<IntercomContact>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/${contactId}/unarchive`, {
          method: 'POST',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Conversations
  // ===========================

  async getConversation(conversationId: string): Promise<IntegrationResponse<IntercomConversation>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/${conversationId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listConversations(params?: { starting_after?: string; per_page?: number }): Promise<IntegrationResponse<{ conversations: IntercomConversation[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.starting_after) query.set('starting_after', params.starting_after)
      if (params?.per_page) query.set('per_page', params.per_page.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async searchConversations(query: {
    query: {
      field: string
      operator: string
      value: any
    }
    pagination?: { per_page?: number; starting_after?: string }
  }): Promise<IntegrationResponse<{ conversations: IntercomConversation[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/search`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(query),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async replyToConversation(conversationId: string, params: {
    message_type: 'comment' | 'note'
    type: 'admin'
    admin_id: string
    body: string
    attachment_urls?: string[]
  }): Promise<IntegrationResponse<IntercomConversation>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/reply`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(params),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async assignConversation(conversationId: string, params: {
    type: 'admin' | 'team'
    admin_id?: string
    team_id?: string
  }): Promise<IntegrationResponse<IntercomConversation>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/parts`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            message_type: 'assignment',
            type: params.type,
            admin_id: params.admin_id,
            assignee_id: params.admin_id || params.team_id,
          }),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async closeConversation(conversationId: string, params: { type: 'admin'; admin_id: string }): Promise<IntegrationResponse<IntercomConversation>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/parts`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            message_type: 'close',
            ...params,
          }),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async openConversation(conversationId: string, params: { type: 'admin'; admin_id: string }): Promise<IntegrationResponse<IntercomConversation>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/parts`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            message_type: 'open',
            ...params,
          }),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async snoozeConversation(conversationId: string, params: { type: 'admin'; admin_id: string; snoozed_until: number }): Promise<IntegrationResponse<IntercomConversation>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/parts`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            message_type: 'snoozed',
            ...params,
          }),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Messages
  // ===========================

  async sendMessage(message: IntercomMessage): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/messages`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(message),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Companies
  // ===========================

  async createCompany(company: IntercomCompany): Promise<IntegrationResponse<IntercomCompany>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/companies`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(company),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getCompany(companyId: string): Promise<IntegrationResponse<IntercomCompany>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/companies/${companyId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateCompany(companyId: string, company: Partial<IntercomCompany>): Promise<IntegrationResponse<IntercomCompany>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/companies/${companyId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(company),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listCompanies(params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<{ data: IntercomCompany[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page) query.set('page', params.page.toString())
      if (params?.per_page) query.set('per_page', params.per_page.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/companies${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteCompany(companyId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/companies/${companyId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async attachContactToCompany(params: { contact_id: string; company_id: string }): Promise<IntegrationResponse<IntercomCompany>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/${params.contact_id}/companies`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ id: params.company_id }),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async detachContactFromCompany(params: { contact_id: string; company_id: string }): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/${params.contact_id}/companies/${params.company_id}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Tags
  // ===========================

  async createTag(tag: IntercomTag): Promise<IntegrationResponse<IntercomTag>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tags`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(tag),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listTags(): Promise<IntegrationResponse<{ data: IntercomTag[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tags`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteTag(tagId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tags/${tagId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async tagContact(params: { contact_id: string; tag_id: string }): Promise<IntegrationResponse<IntercomTag>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/${params.contact_id}/tags`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ id: params.tag_id }),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async untagContact(params: { contact_id: string; tag_id: string }): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/${params.contact_id}/tags/${params.tag_id}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async tagConversation(params: { conversation_id: string; tag_id: string; admin_id: string }): Promise<IntegrationResponse<IntercomTag>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/${params.conversation_id}/tags`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ id: params.tag_id, admin_id: params.admin_id }),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async untagConversation(params: { conversation_id: string; tag_id: string; admin_id: string }): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/${params.conversation_id}/tags/${params.tag_id}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
          body: JSON.stringify({ admin_id: params.admin_id }),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Notes
  // ===========================

  async createNote(note: IntercomNote): Promise<IntegrationResponse<IntercomNote>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/notes`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(note),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getNote(noteId: string): Promise<IntegrationResponse<IntercomNote>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/notes/${noteId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listNotes(contactId: string): Promise<IntegrationResponse<{ data: IntercomNote[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/${contactId}/notes`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Events
  // ===========================

  async trackEvent(params: {
    event_name: string
    created_at?: number
    user_id?: string
    email?: string
    metadata?: Record<string, any>
  }): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/events`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(params),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listEventSummaries(params: {
    user_id?: string
    email?: string
    type?: 'user' | 'company'
  }): Promise<IntegrationResponse<{ events: any[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/events/summaries`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(params),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Segments
  // ===========================

  async listSegments(params?: { include_count?: boolean }): Promise<IntegrationResponse<{ segments: IntercomSegment[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.include_count) query.set('include_count', 'true')

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/segments${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getSegment(segmentId: string): Promise<IntegrationResponse<IntercomSegment>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/segments/${segmentId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Articles (Help Center)
  // ===========================

  async createArticle(article: Partial<IntercomArticle>): Promise<IntegrationResponse<IntercomArticle>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/articles`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(article),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getArticle(articleId: string): Promise<IntegrationResponse<IntercomArticle>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/articles/${articleId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateArticle(articleId: string, article: Partial<IntercomArticle>): Promise<IntegrationResponse<IntercomArticle>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/articles/${articleId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(article),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteArticle(articleId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/articles/${articleId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listArticles(params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<{ data: IntercomArticle[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page) query.set('page', params.page.toString())
      if (params?.per_page) query.set('per_page', params.per_page.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/articles${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Collections (Help Center)
  // ===========================

  async createCollection(collection: Partial<IntercomCollection>): Promise<IntegrationResponse<IntercomCollection>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/help_center/collections`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(collection),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getCollection(collectionId: string): Promise<IntegrationResponse<IntercomCollection>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/help_center/collections/${collectionId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateCollection(collectionId: string, collection: Partial<IntercomCollection>): Promise<IntegrationResponse<IntercomCollection>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/help_center/collections/${collectionId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(collection),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteCollection(collectionId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/help_center/collections/${collectionId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listCollections(): Promise<IntegrationResponse<{ data: IntercomCollection[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/help_center/collections`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Admins & Teams
  // ===========================

  async listAdmins(): Promise<IntegrationResponse<{ admins: IntercomAdmin[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/admins`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getAdmin(adminId: string): Promise<IntegrationResponse<IntercomAdmin>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/admins/${adminId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listTeams(): Promise<IntegrationResponse<{ teams: IntercomTeam[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/teams`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getTeam(teamId: string): Promise<IntegrationResponse<IntercomTeam>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/teams/${teamId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Data Attributes
  // ===========================

  async createDataAttribute(attribute: Partial<IntercomDataAttribute>): Promise<IntegrationResponse<IntercomDataAttribute>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/data_attributes`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(attribute),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateDataAttribute(attributeId: number, attribute: Partial<IntercomDataAttribute>): Promise<IntegrationResponse<IntercomDataAttribute>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/data_attributes/${attributeId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(attribute),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listDataAttributes(params?: { model?: 'contact' | 'company' | 'conversation'; include_archived?: boolean }): Promise<IntegrationResponse<{ data: IntercomDataAttribute[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.model) query.set('model', params.model)
      if (params?.include_archived) query.set('include_archived', 'true')

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/data_attributes${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Visitors
  // ===========================

  async getVisitor(visitorId: string): Promise<IntegrationResponse<IntercomVisitor>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/visitors/${visitorId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateVisitor(visitorId: string, visitor: Partial<IntercomVisitor>): Promise<IntegrationResponse<IntercomVisitor>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/visitors/${visitorId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(visitor),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async convertVisitorToContact(visitor: { visitor: { id?: string; user_id?: string }; user: Partial<IntercomContact>; type: 'user' | 'lead' }): Promise<IntegrationResponse<IntercomContact>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/visitors/convert`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(visitor),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // News Items
  // ===========================

  async createNewsItem(newsItem: Partial<IntercomNewsItem>): Promise<IntegrationResponse<IntercomNewsItem>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/news/news_items`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(newsItem),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getNewsItem(newsItemId: string): Promise<IntegrationResponse<IntercomNewsItem>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/news/news_items/${newsItemId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateNewsItem(newsItemId: string, newsItem: Partial<IntercomNewsItem>): Promise<IntegrationResponse<IntercomNewsItem>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/news/news_items/${newsItemId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(newsItem),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteNewsItem(newsItemId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/news/news_items/${newsItemId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listNewsItems(): Promise<IntegrationResponse<{ data: IntercomNewsItem[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/news/news_items`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Subscription Types
  // ===========================

  async createSubscriptionType(subscriptionType: Partial<IntercomSubscriptionType>): Promise<IntegrationResponse<IntercomSubscriptionType>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/subscription_types`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(subscriptionType),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listSubscriptionTypes(): Promise<IntegrationResponse<{ data: IntercomSubscriptionType[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/subscription_types`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Intercom API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
