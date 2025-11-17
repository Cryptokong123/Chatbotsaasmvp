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

  async replyToConversation(conversationId: string, params: {
    message_type: 'comment' | 'note'
    type: 'admin'
    admin_id: string
    body: string
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
}
