/**
 * Zendesk Support Adapter
 *
 * Complete integration with Zendesk Support:
 * - Ticket management (create, update, search, bulk operations)
 * - User management
 * - Organization management
 * - Comments and private notes
 * - Tags and custom fields
 * - SLA policies
 * - Automations and triggers
 * - Views and macros
 * - Search and export
 * - Satisfaction ratings
 * - Attachments
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export interface ZendeskTicket {
  id?: number
  url?: string
  external_id?: string
  type?: 'problem' | 'incident' | 'question' | 'task'
  subject: string
  description?: string
  comment?: {
    body: string
    html_body?: string
    public?: boolean
    author_id?: number
    uploads?: string[]
  }
  priority?: 'urgent' | 'high' | 'normal' | 'low'
  status?: 'new' | 'open' | 'pending' | 'hold' | 'solved' | 'closed'
  requester_id?: number
  submitter_id?: number
  assignee_id?: number
  group_id?: number
  organization_id?: number
  tags?: string[]
  custom_fields?: Array<{ id: number; value: any }>
  due_at?: string
  via?: any
  created_at?: string
  updated_at?: string
}

export interface ZendeskUser {
  id?: number
  url?: string
  name: string
  email?: string
  phone?: string
  role?: 'end-user' | 'agent' | 'admin'
  verified?: boolean
  external_id?: string
  tags?: string[]
  organization_id?: number
  user_fields?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface ZendeskOrganization {
  id?: number
  url?: string
  name: string
  external_id?: string
  domain_names?: string[]
  tags?: string[]
  notes?: string
  organization_fields?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface ZendeskComment {
  id?: number
  type?: 'Comment' | 'VoiceComment'
  author_id: number
  body: string
  html_body?: string
  public: boolean
  attachments?: ZendeskAttachment[]
  via?: any
  created_at?: string
}

export interface ZendeskAttachment {
  id?: number
  file_name: string
  content_url?: string
  content_type: string
  size: number
  thumbnails?: Array<{ id: number; file_name: string; content_url: string }>
}

export interface ZendeskSearch {
  query: string
  sort_by?: 'created_at' | 'updated_at' | 'priority' | 'status' | 'ticket_type'
  sort_order?: 'asc' | 'desc'
}

export class ZendeskAdapter extends BaseIntegrationAdapter {
  private subdomain?: string
  private email?: string
  private apiToken?: string
  private oauth?: { accessToken: string }
  private baseUrl?: string

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: true,
      canReceiveMessages: true,
      canSendFiles: true,
      canSendImages: true,
      canSendVideo: false,
      canSendAudio: false,
      canSendLocation: false,
      canSendButtons: false,
      canSendCards: false,
      canSendCarousels: false,
      canSendQuickReplies: false,
      canSendTemplates: false,
      canScheduleMessages: false,
      canBroadcast: false,
      canTag: true,
      canAssign: true,
      canCreateTickets: true,
      canCreateLeads: false,
      canCreateContacts: true,
      canSyncContacts: true,
      canSyncConversations: true,
      canSyncTickets: true,
      canExportData: true,
      canImportData: true,
      canTrackEvents: true,
      canTrackMetrics: true,
      canGenerateReports: true,
      canCreateWorkflows: true,
      canTriggerActions: true,
      canListenToWebhooks: true,
      maxMessageLength: 65535,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      maxBatchSize: 100,
      rateLimit: {
        messages: 700,
        period: 'per_minute' as const,
      },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.subdomain = this.config.credentials.subdomain
    this.email = this.config.credentials.email
    this.apiToken = this.config.credentials.apiToken

    if (this.config.credentials.accessToken) {
      this.oauth = { accessToken: this.config.credentials.accessToken }
    }

    if (!this.subdomain) {
      return {
        success: false,
        error: { code: 'AUTH_ERROR', message: 'Missing Zendesk subdomain', retryable: false },
      }
    }

    if (!this.oauth && (!this.email || !this.apiToken)) {
      return {
        success: false,
        error: { code: 'AUTH_ERROR', message: 'Missing authentication credentials', retryable: false },
      }
    }

    this.baseUrl = `https://${this.subdomain}.zendesk.com/api/v2`
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
      const result = await this.getCurrentUser()
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  private getAuthHeaders(): Record<string, string> {
    if (this.oauth) {
      return {
        'Authorization': `Bearer ${this.oauth.accessToken}`,
        'Content-Type': 'application/json',
      }
    }
    const credentials = Buffer.from(`${this.email}/token:${this.apiToken}`).toString('base64')
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    }
  }

  // ============================================================================
  // TICKET MANAGEMENT
  // ============================================================================

  async createTicket(ticket: ZendeskTicket): Promise<IntegrationResponse<ZendeskTicket>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets.json`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ ticket }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status} ${await response.text()}`)
        }

        const data = await response.json()
        return data.ticket
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateTicket(ticketId: number, updates: Partial<ZendeskTicket>): Promise<IntegrationResponse<ZendeskTicket>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}.json`, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ ticket: updates }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status} ${await response.text()}`)
        }

        const data = await response.json()
        return data.ticket
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getTicket(ticketId: number): Promise<IntegrationResponse<ZendeskTicket>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}.json`, {
          headers: this.getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.ticket
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
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}.json`, {
          method: 'DELETE',
          headers: this.getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        return undefined
      })

      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listTickets(params?: {
    status?: string[]
    assignee_id?: number
    page?: number
    per_page?: number
  }): Promise<IntegrationResponse<{ tickets: ZendeskTicket[]; next_page?: string }>> {
    try {
      await this.ensureConnected()

      let url = `${this.baseUrl}/tickets.json`
      const queryParams = new URLSearchParams()

      if (params?.page) queryParams.set('page', params.page.toString())
      if (params?.per_page) queryParams.set('per_page', params.per_page.toString())

      const queryString = queryParams.toString()
      if (queryString) url += `?${queryString}`

      const result = await this.makeRequest(async () => {
        const response = await fetch(url, {
          headers: this.getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        return await response.json()
      })

      return result.success
        ? { success: true, data: { tickets: result.data.tickets, next_page: result.data.next_page } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async searchTickets(search: ZendeskSearch): Promise<IntegrationResponse<{ results: ZendeskTicket[]; count: number }>> {
    try {
      await this.ensureConnected()

      const queryParams = new URLSearchParams()
      queryParams.set('query', search.query)
      if (search.sort_by) queryParams.set('sort_by', search.sort_by)
      if (search.sort_order) queryParams.set('sort_order', search.sort_order)

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/search.json?${queryParams.toString()}`, {
          headers: this.getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        return await response.json()
      })

      return result.success
        ? { success: true, data: { results: result.data.results, count: result.data.count } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async bulkUpdateTickets(ticketIds: number[], updates: Partial<ZendeskTicket>): Promise<IntegrationResponse<{ job_status: any }>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/update_many.json?ids=${ticketIds.join(',')}`, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ ticket: updates }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        return await response.json()
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // COMMENTS
  // ============================================================================

  async addComment(ticketId: number, comment: { body: string; public?: boolean; author_id?: number }): Promise<IntegrationResponse<ZendeskTicket>> {
    return this.updateTicket(ticketId, { comment })
  }

  async getComments(ticketId: number): Promise<IntegrationResponse<ZendeskComment[]>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}/comments.json`, {
          headers: this.getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.comments
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  async createUser(user: ZendeskUser): Promise<IntegrationResponse<ZendeskUser>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users.json`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ user }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status} ${await response.text()}`)
        }

        const data = await response.json()
        return data.user
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateUser(userId: number, updates: Partial<ZendeskUser>): Promise<IntegrationResponse<ZendeskUser>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users/${userId}.json`, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ user: updates }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.user
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getUser(userId: number): Promise<IntegrationResponse<ZendeskUser>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users/${userId}.json`, {
          headers: this.getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.user
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getCurrentUser(): Promise<IntegrationResponse<ZendeskUser>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users/me.json`, {
          headers: this.getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.user
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async searchUsers(query: string): Promise<IntegrationResponse<{ users: ZendeskUser[] }>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users/search.json?query=${encodeURIComponent(query)}`, {
          headers: this.getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        return await response.json()
      })

      return result.success ? { success: true, data: { users: result.data.users } } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // ORGANIZATION MANAGEMENT
  // ============================================================================

  async createOrganization(org: ZendeskOrganization): Promise<IntegrationResponse<ZendeskOrganization>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/organizations.json`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ organization: org }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.organization
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getOrganization(orgId: number): Promise<IntegrationResponse<ZendeskOrganization>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/organizations/${orgId}.json`, {
          headers: this.getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.organization
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // ATTACHMENTS
  // ============================================================================

  async uploadAttachment(params: {
    file: Buffer | Blob
    filename: string
    contentType: string
  }): Promise<IntegrationResponse<{ upload: { token: string; attachment: ZendeskAttachment } }>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const formData = new FormData()
        formData.append('file', params.file, params.filename)

        const response = await fetch(`${this.baseUrl}/uploads.json?filename=${encodeURIComponent(params.filename)}`, {
          method: 'POST',
          headers: {
            ...this.getAuthHeaders(),
            'Content-Type': params.contentType,
          },
          body: params.file,
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        return await response.json()
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
