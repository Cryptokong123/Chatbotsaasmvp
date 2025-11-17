/**
 * Drift Adapter - Conversational marketing and sales platform
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export interface DriftContact {
  id?: number
  attributes?: {
    email?: string
    name?: string
    phone?: string
    tags?: string[]
    start_date?: number
    [key: string]: any
  }
  created_at?: number
  updated_at?: number
}

export interface DriftConversation {
  id?: number
  status?: 'open' | 'closed'
  inbox_id?: number
  contact_id?: number
  created_at?: number
  updated_at?: number
  preview?: string
  messages?: DriftMessage[]
  participants?: number[]
  tags?: string[]
}

export interface DriftMessage {
  id?: number
  conversation_id?: number
  author_id?: number
  author_type?: 'contact' | 'user'
  body?: string
  type?: 'chat' | 'private_note' | 'private_prompt'
  edited?: boolean
  created_at?: number
  attachments?: Array<{
    filename: string
    url: string
    size: number
    type: string
  }>
}

export interface DriftUser {
  id?: number
  name?: string
  email?: string
  bot?: boolean
  verified?: boolean
  availability?: 'AVAILABLE' | 'AWAY' | 'NOT_SET'
  avatar?: string
  role?: string
  created_at?: number
  updated_at?: number
}

export interface DriftPlaybook {
  id?: number
  name: string
  status?: 'draft' | 'published' | 'archived'
  steps?: Array<{
    type: string
    config: any
  }>
  targeting?: {
    url_patterns?: string[]
    exclude_url_patterns?: string[]
  }
  behavior?: {
    trigger_on_load?: boolean
    trigger_on_exit_intent?: boolean
    delay_seconds?: number
  }
  created_at?: number
  updated_at?: number
}

export interface DriftMeeting {
  id?: number
  organizer_id?: number
  contact_id?: number
  status?: 'scheduled' | 'completed' | 'cancelled'
  scheduled_time?: number
  duration_minutes?: number
  meeting_link?: string
  notes?: string
  created_at?: number
  updated_at?: number
}

export interface DriftCampaign {
  id?: string
  name: string
  status?: 'draft' | 'running' | 'paused' | 'completed'
  type?: 'email' | 'chat' | 'in_app'
  audience?: {
    segments?: string[]
    contact_ids?: number[]
  }
  message?: {
    subject?: string
    body: string
  }
  schedule?: {
    send_at?: number
    timezone?: string
  }
  stats?: {
    sent?: number
    delivered?: number
    opened?: number
    clicked?: number
    converted?: number
  }
}

export interface DriftWebhook {
  id?: number
  name: string
  url: string
  events: Array<'contact_created' | 'contact_updated' | 'conversation_created' | 'conversation_updated' | 'message_sent' | 'meeting_scheduled'>
  active?: boolean
  created_at?: number
  updated_at?: number
}

export class DriftAdapter extends BaseIntegrationAdapter {
  private accessToken?: string
  private baseUrl = 'https://driftapi.com'

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: true, canReceiveMessages: true, canSendFiles: false, canSendImages: false,
      canSendVideo: false, canSendAudio: false, canSendLocation: false, canSendButtons: false,
      canSendCards: false, canSendCarousels: false, canSendQuickReplies: false, canSendTemplates: false,
      canScheduleMessages: false, canBroadcast: false, canTag: true, canAssign: true,
      canCreateTickets: false, canCreateLeads: true, canCreateContacts: true, canSyncContacts: true,
      canSyncConversations: true, canSyncTickets: false, canExportData: true, canImportData: false,
      canTrackEvents: true, canTrackMetrics: true, canGenerateReports: false, canCreateWorkflows: false,
      canTriggerActions: true, canListenToWebhooks: true, maxMessageLength: 5000,
      maxFileSize: 0, maxBatchSize: 50, rateLimit: { messages: 60, period: 'per_minute' as const },
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
      const result = await this.listUsers({ limit: 1 })
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  private getHeaders(): Record<string, string> {
    return { 'Authorization': `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' }
  }

  // ===========================
  // Contacts
  // ===========================

  async createContact(contact: DriftContact): Promise<IntegrationResponse<DriftContact>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(contact),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getContact(contactId: number): Promise<IntegrationResponse<DriftContact>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/${contactId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateContact(contactId: number, contact: Partial<DriftContact>): Promise<IntegrationResponse<DriftContact>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/${contactId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(contact),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        const data = await response.json()
        return data.data
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
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listContacts(params?: { limit?: number; email?: string }): Promise<IntegrationResponse<{ data: DriftContact[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.limit) query.set('limit', params.limit.toString())
      if (params?.email) query.set('email', params.email)

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async bulkCreateContacts(contacts: DriftContact[]): Promise<IntegrationResponse<{ created: number; errors: any[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/bulk`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ contacts }),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
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

  async getConversation(conversationId: number): Promise<IntegrationResponse<DriftConversation>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/${conversationId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listConversations(params?: { status?: 'open' | 'closed'; limit?: number }): Promise<IntegrationResponse<{ data: DriftConversation[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.status) query.set('status', params.status)
      if (params?.limit) query.set('limit', params.limit.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createConversation(params: { contact_id: number; inbox_id?: number }): Promise<IntegrationResponse<DriftConversation>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(params),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateConversation(conversationId: number, params: { status?: 'open' | 'closed'; tags?: string[] }): Promise<IntegrationResponse<DriftConversation>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/${conversationId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(params),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async assignConversation(conversationId: number, userId: number): Promise<IntegrationResponse<DriftConversation>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/assign`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ user_id: userId }),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Messages
  // ===========================

  async sendMessage(params: { conversationId: number; body: string; type?: 'chat' | 'private_note' }): Promise<IntegrationResponse<DriftMessage>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/${params.conversationId}/messages`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            body: params.body,
            type: params.type || 'chat',
          }),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listMessages(conversationId: number, params?: { limit?: number }): Promise<IntegrationResponse<{ data: DriftMessage[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.limit) query.set('limit', params.limit.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/messages${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Users
  // ===========================

  async getUser(userId: number): Promise<IntegrationResponse<DriftUser>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users/${userId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listUsers(params?: { limit?: number }): Promise<IntegrationResponse<{ data: DriftUser[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.limit) query.set('limit', params.limit.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateUserAvailability(userId: number, availability: 'AVAILABLE' | 'AWAY'): Promise<IntegrationResponse<DriftUser>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users/${userId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({ availability }),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Playbooks
  // ===========================

  async createPlaybook(playbook: Partial<DriftPlaybook>): Promise<IntegrationResponse<DriftPlaybook>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/playbooks`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(playbook),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getPlaybook(playbookId: number): Promise<IntegrationResponse<DriftPlaybook>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/playbooks/${playbookId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listPlaybooks(): Promise<IntegrationResponse<{ data: DriftPlaybook[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/playbooks`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updatePlaybook(playbookId: number, playbook: Partial<DriftPlaybook>): Promise<IntegrationResponse<DriftPlaybook>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/playbooks/${playbookId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(playbook),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deletePlaybook(playbookId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/playbooks/${playbookId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async publishPlaybook(playbookId: number): Promise<IntegrationResponse<DriftPlaybook>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/playbooks/${playbookId}/publish`, {
          method: 'POST',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Meetings
  // ===========================

  async scheduleMeeting(meeting: Partial<DriftMeeting>): Promise<IntegrationResponse<DriftMeeting>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/meetings`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(meeting),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getMeeting(meetingId: number): Promise<IntegrationResponse<DriftMeeting>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/meetings/${meetingId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listMeetings(params?: { contact_id?: number; status?: 'scheduled' | 'completed' | 'cancelled' }): Promise<IntegrationResponse<{ data: DriftMeeting[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.contact_id) query.set('contact_id', params.contact_id.toString())
      if (params?.status) query.set('status', params.status)

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/meetings${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async cancelMeeting(meetingId: number): Promise<IntegrationResponse<DriftMeeting>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/meetings/${meetingId}/cancel`, {
          method: 'POST',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Webhooks
  // ===========================

  async createWebhook(webhook: Partial<DriftWebhook>): Promise<IntegrationResponse<DriftWebhook>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/webhooks`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(webhook),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listWebhooks(): Promise<IntegrationResponse<{ data: DriftWebhook[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/webhooks`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteWebhook(webhookId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/webhooks/${webhookId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
