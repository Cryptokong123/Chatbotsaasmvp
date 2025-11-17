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

export interface DriftSegment {
  id?: number
  name: string
  description?: string
  conditions?: Array<{
    field: string
    operator: string
    value: any
  }>
  contact_count?: number
  created_at?: number
  updated_at?: number
}

export interface DriftList {
  id?: number
  name: string
  type?: 'static' | 'dynamic'
  contact_ids?: number[]
  filters?: any
  contact_count?: number
  created_at?: number
  updated_at?: number
}

export interface DriftEmailTemplate {
  id?: number
  name: string
  subject: string
  body_html: string
  body_text?: string
  variables?: string[]
  created_at?: number
  updated_at?: number
}

export interface DriftSequence {
  id?: number
  name: string
  status?: 'active' | 'paused' | 'draft'
  steps?: Array<{
    order: number
    type: 'email' | 'wait' | 'task'
    delay_days?: number
    template_id?: number
    subject?: string
    body?: string
  }>
  enrollment_count?: number
  created_at?: number
  updated_at?: number
}

export interface DriftBot {
  id?: number
  name: string
  enabled?: boolean
  trigger_rules?: Array<{
    type: string
    config: any
  }>
  responses?: Array<{
    condition: any
    message: string
    actions?: any[]
  }>
  created_at?: number
  updated_at?: number
}

export interface DriftAnalytics {
  conversations?: {
    total: number
    open: number
    closed: number
    response_time_avg?: number
  }
  contacts?: {
    total: number
    new_this_month?: number
  }
  meetings?: {
    scheduled: number
    completed: number
    cancelled: number
  }
  playbooks?: {
    [playbookId: string]: {
      views: number
      engagements: number
      conversions: number
    }
  }
}

export interface DriftAccount {
  id?: number
  name: string
  domain?: string
  contacts?: number[]
  attributes?: {
    industry?: string
    size?: string
    [key: string]: any
  }
  created_at?: number
  updated_at?: number
}

export interface DriftNote {
  id?: number
  contact_id?: number
  author_id?: number
  body: string
  created_at?: number
  updated_at?: number
}

export interface DriftTask {
  id?: number
  contact_id?: number
  assignee_id?: number
  title: string
  description?: string
  due_date?: number
  status?: 'open' | 'completed'
  priority?: 'low' | 'medium' | 'high'
  created_at?: number
  updated_at?: number
}

export interface DriftEvent {
  contact_id: number
  event: string
  properties?: Record<string, any>
  timestamp?: number
}

export interface DriftInbox {
  id?: number
  name: string
  description?: string
  routing_rules?: Array<{
    condition: any
    assignee_id?: number
  }>
  auto_close_after_hours?: number
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

  // ===========================
  // Campaigns
  // ===========================

  async createCampaign(campaign: Partial<DriftCampaign>): Promise<IntegrationResponse<DriftCampaign>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/campaigns`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(campaign),
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

  async getCampaign(campaignId: string): Promise<IntegrationResponse<DriftCampaign>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/campaigns/${campaignId}`, {
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

  async listCampaigns(params?: { status?: 'draft' | 'running' | 'paused' | 'completed' }): Promise<IntegrationResponse<{ data: DriftCampaign[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.status) query.set('status', params.status)

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/campaigns${query.toString() ? `?${query}` : ''}`, {
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

  async updateCampaign(campaignId: string, campaign: Partial<DriftCampaign>): Promise<IntegrationResponse<DriftCampaign>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/campaigns/${campaignId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(campaign),
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

  async startCampaign(campaignId: string): Promise<IntegrationResponse<DriftCampaign>> {
    return this.updateCampaign(campaignId, { status: 'running' })
  }

  async pauseCampaign(campaignId: string): Promise<IntegrationResponse<DriftCampaign>> {
    return this.updateCampaign(campaignId, { status: 'paused' })
  }

  async deleteCampaign(campaignId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/campaigns/${campaignId}`, {
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

  // ===========================
  // Segments
  // ===========================

  async createSegment(segment: Partial<DriftSegment>): Promise<IntegrationResponse<DriftSegment>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/segments`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(segment),
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

  async getSegment(segmentId: number): Promise<IntegrationResponse<DriftSegment>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/segments/${segmentId}`, {
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

  async listSegments(): Promise<IntegrationResponse<{ data: DriftSegment[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/segments`, {
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

  async updateSegment(segmentId: number, segment: Partial<DriftSegment>): Promise<IntegrationResponse<DriftSegment>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/segments/${segmentId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(segment),
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

  async deleteSegment(segmentId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/segments/${segmentId}`, {
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

  // ===========================
  // Lists
  // ===========================

  async createList(list: Partial<DriftList>): Promise<IntegrationResponse<DriftList>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(list),
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

  async getList(listId: number): Promise<IntegrationResponse<DriftList>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}`, {
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

  async listLists(): Promise<IntegrationResponse<{ data: DriftList[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists`, {
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

  async addContactsToList(listId: number, contactIds: number[]): Promise<IntegrationResponse<DriftList>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}/contacts`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ contact_ids: contactIds }),
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

  async removeContactsFromList(listId: number, contactIds: number[]): Promise<IntegrationResponse<DriftList>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}/contacts`, {
          method: 'DELETE',
          headers: this.getHeaders(),
          body: JSON.stringify({ contact_ids: contactIds }),
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

  async deleteList(listId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}`, {
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

  // ===========================
  // Email Templates
  // ===========================

  async createEmailTemplate(template: Partial<DriftEmailTemplate>): Promise<IntegrationResponse<DriftEmailTemplate>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/email_templates`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(template),
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

  async getEmailTemplate(templateId: number): Promise<IntegrationResponse<DriftEmailTemplate>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/email_templates/${templateId}`, {
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

  async listEmailTemplates(): Promise<IntegrationResponse<{ data: DriftEmailTemplate[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/email_templates`, {
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

  async updateEmailTemplate(templateId: number, template: Partial<DriftEmailTemplate>): Promise<IntegrationResponse<DriftEmailTemplate>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/email_templates/${templateId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(template),
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

  async deleteEmailTemplate(templateId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/email_templates/${templateId}`, {
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

  // ===========================
  // Sequences
  // ===========================

  async createSequence(sequence: Partial<DriftSequence>): Promise<IntegrationResponse<DriftSequence>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/sequences`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(sequence),
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

  async getSequence(sequenceId: number): Promise<IntegrationResponse<DriftSequence>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/sequences/${sequenceId}`, {
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

  async listSequences(): Promise<IntegrationResponse<{ data: DriftSequence[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/sequences`, {
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

  async enrollInSequence(sequenceId: number, contactIds: number[]): Promise<IntegrationResponse<{ enrolled: number }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/sequences/${sequenceId}/enroll`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ contact_ids: contactIds }),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async unenrollFromSequence(sequenceId: number, contactIds: number[]): Promise<IntegrationResponse<{ unenrolled: number }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/sequences/${sequenceId}/unenroll`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ contact_ids: contactIds }),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteSequence(sequenceId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/sequences/${sequenceId}`, {
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

  // ===========================
  // Bots
  // ===========================

  async createBot(bot: Partial<DriftBot>): Promise<IntegrationResponse<DriftBot>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/bots`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(bot),
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

  async getBot(botId: number): Promise<IntegrationResponse<DriftBot>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/bots/${botId}`, {
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

  async listBots(): Promise<IntegrationResponse<{ data: DriftBot[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/bots`, {
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

  async updateBot(botId: number, bot: Partial<DriftBot>): Promise<IntegrationResponse<DriftBot>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/bots/${botId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(bot),
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

  async enableBot(botId: number): Promise<IntegrationResponse<DriftBot>> {
    return this.updateBot(botId, { enabled: true })
  }

  async disableBot(botId: number): Promise<IntegrationResponse<DriftBot>> {
    return this.updateBot(botId, { enabled: false })
  }

  async deleteBot(botId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/bots/${botId}`, {
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

  // ===========================
  // Analytics & Reporting
  // ===========================

  async getAnalytics(params?: { start_date?: string; end_date?: string }): Promise<IntegrationResponse<DriftAnalytics>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.start_date) query.set('start_date', params.start_date)
      if (params?.end_date) query.set('end_date', params.end_date)

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/analytics${query.toString() ? `?${query}` : ''}`, {
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

  async getPlaybookAnalytics(playbookId: number): Promise<IntegrationResponse<{ views: number; engagements: number; conversions: number }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/playbooks/${playbookId}/analytics`, {
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

  async getTeamPerformance(params?: { start_date?: string; end_date?: string }): Promise<IntegrationResponse<{
    users: Array<{
      user_id: number
      conversations: number
      response_time_avg: number
      meetings_scheduled: number
    }>
  }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.start_date) query.set('start_date', params.start_date)
      if (params?.end_date) query.set('end_date', params.end_date)

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/analytics/team${query.toString() ? `?${query}` : ''}`, {
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
  // Accounts (ABM)
  // ===========================

  async createAccount(account: Partial<DriftAccount>): Promise<IntegrationResponse<DriftAccount>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/accounts`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(account),
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

  async getAccount(accountId: number): Promise<IntegrationResponse<DriftAccount>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/accounts/${accountId}`, {
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

  async listAccounts(params?: { limit?: number }): Promise<IntegrationResponse<{ data: DriftAccount[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.limit) query.set('limit', params.limit.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/accounts${query.toString() ? `?${query}` : ''}`, {
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

  async updateAccount(accountId: number, account: Partial<DriftAccount>): Promise<IntegrationResponse<DriftAccount>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/accounts/${accountId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(account),
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

  async deleteAccount(accountId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/accounts/${accountId}`, {
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

  // ===========================
  // Notes
  // ===========================

  async createNote(note: Partial<DriftNote>): Promise<IntegrationResponse<DriftNote>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/notes`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(note),
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

  async listNotes(contactId: number): Promise<IntegrationResponse<{ data: DriftNote[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/${contactId}/notes`, {
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

  async deleteNote(noteId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/notes/${noteId}`, {
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

  // ===========================
  // Tasks
  // ===========================

  async createTask(task: Partial<DriftTask>): Promise<IntegrationResponse<DriftTask>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tasks`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(task),
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

  async getTask(taskId: number): Promise<IntegrationResponse<DriftTask>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
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

  async listTasks(params?: { status?: 'open' | 'completed'; assignee_id?: number }): Promise<IntegrationResponse<{ data: DriftTask[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.status) query.set('status', params.status)
      if (params?.assignee_id) query.set('assignee_id', params.assignee_id.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tasks${query.toString() ? `?${query}` : ''}`, {
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

  async updateTask(taskId: number, task: Partial<DriftTask>): Promise<IntegrationResponse<DriftTask>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(task),
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

  async completeTask(taskId: number): Promise<IntegrationResponse<DriftTask>> {
    return this.updateTask(taskId, { status: 'completed' })
  }

  async deleteTask(taskId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
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

  // ===========================
  // Events
  // ===========================

  async trackEvent(event: DriftEvent): Promise<IntegrationResponse<{ success: boolean }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/events`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(event),
        })
        if (!response.ok) throw new Error(`Drift API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getContactEvents(contactId: number, params?: { event?: string; limit?: number }): Promise<IntegrationResponse<{ data: DriftEvent[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.event) query.set('event', params.event)
      if (params?.limit) query.set('limit', params.limit.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/${contactId}/events${query.toString() ? `?${query}` : ''}`, {
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
  // Inboxes
  // ===========================

  async createInbox(inbox: Partial<DriftInbox>): Promise<IntegrationResponse<DriftInbox>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/inboxes`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(inbox),
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

  async getInbox(inboxId: number): Promise<IntegrationResponse<DriftInbox>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/inboxes/${inboxId}`, {
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

  async listInboxes(): Promise<IntegrationResponse<{ data: DriftInbox[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/inboxes`, {
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

  async updateInbox(inboxId: number, inbox: Partial<DriftInbox>): Promise<IntegrationResponse<DriftInbox>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/inboxes/${inboxId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(inbox),
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

  async deleteInbox(inboxId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/inboxes/${inboxId}`, {
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

  // ===========================
  // Advanced Contact Operations
  // ===========================

  async searchContacts(params: { query?: string; email?: string; tags?: string[] }): Promise<IntegrationResponse<{ data: DriftContact[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params.query) query.set('query', params.query)
      if (params.email) query.set('email', params.email)
      if (params.tags) query.set('tags', params.tags.join(','))

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/search?${query}`, {
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

  async addTagsToContact(contactId: number, tags: string[]): Promise<IntegrationResponse<DriftContact>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/${contactId}/tags`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ tags }),
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

  async removeTagsFromContact(contactId: number, tags: string[]): Promise<IntegrationResponse<DriftContact>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/${contactId}/tags`, {
          method: 'DELETE',
          headers: this.getHeaders(),
          body: JSON.stringify({ tags }),
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
}
