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

export interface ZendeskView {
  id?: number
  title: string
  active?: boolean
  position?: number
  description?: string
  conditions?: {
    all?: Array<{ field: string; operator: string; value: any }>
    any?: Array<{ field: string; operator: string; value: any }>
  }
  execution?: {
    group_by?: string
    group_order?: 'asc' | 'desc'
    sort_by?: string
    sort_order?: 'asc' | 'desc'
    columns?: Array<{ id: string; title?: string }>
  }
  restriction?: {
    type: 'User' | 'Group'
    id?: number
    ids?: number[]
  }
  created_at?: string
  updated_at?: string
}

export interface ZendeskMacro {
  id?: number
  title: string
  active?: boolean
  position?: number
  description?: string
  actions?: Array<{ field: string; value: any }>
  restriction?: {
    type: 'User' | 'Group'
    id?: number
    ids?: number[]
  }
  created_at?: string
  updated_at?: string
}

export interface ZendeskGroup {
  id?: number
  name: string
  description?: string
  default?: boolean
  deleted?: boolean
  created_at?: string
  updated_at?: string
}

export interface ZendeskSLAPolicy {
  id?: number
  title: string
  description?: string
  position?: number
  filter?: {
    all?: Array<{ field: string; operator: string; value: any }>
    any?: Array<{ field: string; operator: string; value: any }>
  }
  policy_metrics?: Array<{
    priority: 'low' | 'normal' | 'high' | 'urgent'
    metric: 'first_reply_time' | 'next_reply_time' | 'requester_wait_time' | 'agent_work_time'
    target: number
    business_hours?: boolean
  }>
  created_at?: string
  updated_at?: string
}

export interface ZendeskTrigger {
  id?: number
  title: string
  active?: boolean
  position?: number
  description?: string
  conditions?: {
    all?: Array<{ field: string; operator: string; value: any }>
    any?: Array<{ field: string; operator: string; value: any }>
  }
  actions?: Array<{ field: string; value: any }>
  created_at?: string
  updated_at?: string
}

export interface ZendeskAutomation {
  id?: number
  title: string
  active?: boolean
  position?: number
  conditions?: {
    all?: Array<{ field: string; operator: string; value: any }>
    any?: Array<{ field: string; operator: string; value: any }>
  }
  actions?: Array<{ field: string; value: any }>
  created_at?: string
  updated_at?: string
}

export interface ZendeskTicketField {
  id?: number
  type: 'checkbox' | 'date' | 'decimal' | 'integer' | 'regexp' | 'tagger' | 'text' | 'textarea'
  title: string
  description?: string
  position?: number
  active?: boolean
  required?: boolean
  collapsed_for_agents?: boolean
  regexp_for_validation?: string
  title_in_portal?: string
  visible_in_portal?: boolean
  editable_in_portal?: boolean
  required_in_portal?: boolean
  tag?: string
  custom_field_options?: Array<{
    id?: number
    name: string
    value: string
    default?: boolean
  }>
  system_field_options?: Array<{ name: string; value: any }>
  created_at?: string
  updated_at?: string
}

export interface ZendeskSatisfactionRating {
  id?: number
  assignee_id?: number
  group_id?: number
  requester_id?: number
  ticket_id?: number
  score: 'offered' | 'unoffered' | 'good' | 'bad'
  comment?: string
  reason?: string
  created_at?: string
  updated_at?: string
}

export interface ZendeskTicketMetric {
  id?: number
  ticket_id?: number
  created_at?: string
  updated_at?: string
  group_stations?: number
  assignee_stations?: number
  reopens?: number
  replies?: number
  assignee_updated_at?: string
  requester_updated_at?: string
  status_updated_at?: string
  initially_assigned_at?: string
  assigned_at?: string
  solved_at?: string
  latest_comment_added_at?: string
  first_resolution_time_in_minutes?: {
    calendar: number
    business: number
  }
  reply_time_in_minutes?: {
    calendar: number
    business: number
  }
  full_resolution_time_in_minutes?: {
    calendar: number
    business: number
  }
  agent_wait_time_in_minutes?: {
    calendar: number
    business: number
  }
  requester_wait_time_in_minutes?: {
    calendar: number
    business: number
  }
  on_hold_time_in_minutes?: {
    calendar: number
    business: number
  }
}

export interface ZendeskTicketAudit {
  id?: number
  ticket_id?: number
  created_at?: string
  author_id?: number
  metadata?: {
    system?: {
      client?: string
      ip_address?: string
      location?: string
      latitude?: number
      longitude?: number
    }
    custom?: Record<string, any>
  }
  events?: Array<{
    id?: number
    type: string
    value?: any
    field_name?: string
    previous_value?: any
    public?: boolean
    body?: string
    html_body?: string
    plain_body?: string
    author_id?: number
    attachments?: ZendeskAttachment[]
  }>
  via?: any
}

export interface ZendeskBrand {
  id?: number
  name: string
  brand_url?: string
  has_help_center?: boolean
  help_center_state?: 'enabled' | 'disabled' | 'restricted'
  active?: boolean
  default?: boolean
  logo?: ZendeskAttachment
  ticket_form_ids?: number[]
  signature_template?: string
  created_at?: string
  updated_at?: string
}

export interface ZendeskTicketForm {
  id?: number
  name: string
  display_name?: string
  position?: number
  active?: boolean
  default?: boolean
  end_user_visible?: boolean
  in_all_brands?: boolean
  restricted_brand_ids?: number[]
  ticket_field_ids?: number[]
  created_at?: string
  updated_at?: string
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
        const fileBlob = params.file instanceof Buffer ? new Blob([params.file as any]) : params.file
        formData.append('file', fileBlob as Blob, params.filename)

        const response = await fetch(`${this.baseUrl}/uploads.json?filename=${encodeURIComponent(params.filename)}`, {
          method: 'POST',
          headers: {
            ...this.getAuthHeaders(),
            'Content-Type': params.contentType,
          },
          body: fileBlob as BodyInit,
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
  // ADVANCED TICKET OPERATIONS
  // ============================================================================

  async mergeTickets(params: {
    target_ticket_id: number
    source_ticket_ids: number[]
    target_comment?: string
    source_comment?: string
  }): Promise<IntegrationResponse<{ job_status: any }>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${params.target_ticket_id}/merge.json`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            ids: params.source_ticket_ids,
            target_comment: params.target_comment,
            source_comment: params.source_comment,
          }),
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

  async markTicketAsSpam(ticketId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}/mark_as_spam.json`, {
          method: 'PUT',
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

  async bulkDeleteTickets(ticketIds: number[]): Promise<IntegrationResponse<{ job_status: any }>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/destroy_many.json?ids=${ticketIds.join(',')}`, {
          method: 'DELETE',
          headers: this.getAuthHeaders(),
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

  async addTagsToTicket(ticketId: number, tags: string[]): Promise<IntegrationResponse<ZendeskTicket>> {
    try {
      await this.ensureConnected()

      const ticket = await this.getTicket(ticketId)
      if (!ticket.success) return ticket

      const existingTags = ticket.data.tags || []
      const newTags = [...new Set([...existingTags, ...tags])]

      return this.updateTicket(ticketId, { tags: newTags })
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async removeTagsFromTicket(ticketId: number, tags: string[]): Promise<IntegrationResponse<ZendeskTicket>> {
    try {
      await this.ensureConnected()

      const ticket = await this.getTicket(ticketId)
      if (!ticket.success) return ticket

      const existingTags = ticket.data.tags || []
      const newTags = existingTags.filter(tag => !tags.includes(tag))

      return this.updateTicket(ticketId, { tags: newTags })
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // TICKET METRICS & AUDITS
  // ============================================================================

  async getTicketMetrics(ticketId: number): Promise<IntegrationResponse<ZendeskTicketMetric>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}/metrics.json`, {
          headers: this.getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.ticket_metric
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getTicketAudits(ticketId: number): Promise<IntegrationResponse<ZendeskTicketAudit[]>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}/audits.json`, {
          headers: this.getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.audits
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // VIEWS
  // ============================================================================

  async listViews(params?: { active?: boolean; page?: number; per_page?: number }): Promise<IntegrationResponse<{ views: ZendeskView[]; next_page?: string }>> {
    try {
      await this.ensureConnected()

      let url = `${this.baseUrl}/views.json`
      const queryParams = new URLSearchParams()

      if (params?.active !== undefined) queryParams.set('active', params.active.toString())
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
        ? { success: true, data: { views: result.data.views, next_page: result.data.next_page } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getView(viewId: number): Promise<IntegrationResponse<ZendeskView>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/views/${viewId}.json`, {
          headers: this.getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.view
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async executeView(viewId: number, params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<{ tickets: ZendeskTicket[]; next_page?: string; count: number }>> {
    try {
      await this.ensureConnected()

      let url = `${this.baseUrl}/views/${viewId}/tickets.json`
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
        ? {
            success: true,
            data: {
              tickets: result.data.tickets,
              next_page: result.data.next_page,
              count: result.data.count,
            },
          }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createView(view: ZendeskView): Promise<IntegrationResponse<ZendeskView>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/views.json`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ view }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.view
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateView(viewId: number, updates: Partial<ZendeskView>): Promise<IntegrationResponse<ZendeskView>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/views/${viewId}.json`, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ view: updates }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.view
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteView(viewId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/views/${viewId}.json`, {
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

  // ============================================================================
  // MACROS
  // ============================================================================

  async listMacros(params?: { active?: boolean; page?: number; per_page?: number }): Promise<IntegrationResponse<{ macros: ZendeskMacro[]; next_page?: string }>> {
    try {
      await this.ensureConnected()

      let url = `${this.baseUrl}/macros.json`
      const queryParams = new URLSearchParams()

      if (params?.active !== undefined) queryParams.set('active', params.active.toString())
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
        ? { success: true, data: { macros: result.data.macros, next_page: result.data.next_page } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getMacro(macroId: number): Promise<IntegrationResponse<ZendeskMacro>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/macros/${macroId}.json`, {
          headers: this.getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.macro
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async applyMacro(ticketId: number, macroId: number): Promise<IntegrationResponse<{ result: { ticket: ZendeskTicket; comment?: ZendeskComment } }>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}/macros/${macroId}/apply.json`, {
          method: 'GET',
          headers: this.getAuthHeaders(),
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

  async createMacro(macro: ZendeskMacro): Promise<IntegrationResponse<ZendeskMacro>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/macros.json`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ macro }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.macro
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateMacro(macroId: number, updates: Partial<ZendeskMacro>): Promise<IntegrationResponse<ZendeskMacro>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/macros/${macroId}.json`, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ macro: updates }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.macro
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteMacro(macroId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/macros/${macroId}.json`, {
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

  // ============================================================================
  // GROUPS
  // ============================================================================

  async listGroups(params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<{ groups: ZendeskGroup[]; next_page?: string }>> {
    try {
      await this.ensureConnected()

      let url = `${this.baseUrl}/groups.json`
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
        ? { success: true, data: { groups: result.data.groups, next_page: result.data.next_page } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getGroup(groupId: number): Promise<IntegrationResponse<ZendeskGroup>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/groups/${groupId}.json`, {
          headers: this.getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.group
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createGroup(group: ZendeskGroup): Promise<IntegrationResponse<ZendeskGroup>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/groups.json`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ group }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.group
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateGroup(groupId: number, updates: Partial<ZendeskGroup>): Promise<IntegrationResponse<ZendeskGroup>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/groups/${groupId}.json`, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ group: updates }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.group
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteGroup(groupId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/groups/${groupId}.json`, {
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

  // ============================================================================
  // SLA POLICIES
  // ============================================================================

  async listSLAPolicies(): Promise<IntegrationResponse<{ sla_policies: ZendeskSLAPolicy[] }>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/slas/policies.json`, {
          headers: this.getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        return await response.json()
      })

      return result.success
        ? { success: true, data: { sla_policies: result.data.sla_policies } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getSLAPolicy(policyId: number): Promise<IntegrationResponse<ZendeskSLAPolicy>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/slas/policies/${policyId}.json`, {
          headers: this.getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.sla_policy
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // TRIGGERS
  // ============================================================================

  async listTriggers(params?: { active?: boolean; page?: number; per_page?: number }): Promise<IntegrationResponse<{ triggers: ZendeskTrigger[]; next_page?: string }>> {
    try {
      await this.ensureConnected()

      let url = `${this.baseUrl}/triggers.json`
      const queryParams = new URLSearchParams()

      if (params?.active !== undefined) queryParams.set('active', params.active.toString())
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
        ? { success: true, data: { triggers: result.data.triggers, next_page: result.data.next_page } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getTrigger(triggerId: number): Promise<IntegrationResponse<ZendeskTrigger>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/triggers/${triggerId}.json`, {
          headers: this.getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.trigger
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createTrigger(trigger: ZendeskTrigger): Promise<IntegrationResponse<ZendeskTrigger>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/triggers.json`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ trigger }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.trigger
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateTrigger(triggerId: number, updates: Partial<ZendeskTrigger>): Promise<IntegrationResponse<ZendeskTrigger>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/triggers/${triggerId}.json`, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ trigger: updates }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.trigger
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteTrigger(triggerId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/triggers/${triggerId}.json`, {
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

  // ============================================================================
  // AUTOMATIONS
  // ============================================================================

  async listAutomations(params?: { active?: boolean; page?: number; per_page?: number }): Promise<IntegrationResponse<{ automations: ZendeskAutomation[]; next_page?: string }>> {
    try {
      await this.ensureConnected()

      let url = `${this.baseUrl}/automations.json`
      const queryParams = new URLSearchParams()

      if (params?.active !== undefined) queryParams.set('active', params.active.toString())
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
        ? { success: true, data: { automations: result.data.automations, next_page: result.data.next_page } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getAutomation(automationId: number): Promise<IntegrationResponse<ZendeskAutomation>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/automations/${automationId}.json`, {
          headers: this.getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.automation
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createAutomation(automation: ZendeskAutomation): Promise<IntegrationResponse<ZendeskAutomation>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/automations.json`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ automation }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.automation
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateAutomation(automationId: number, updates: Partial<ZendeskAutomation>): Promise<IntegrationResponse<ZendeskAutomation>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/automations/${automationId}.json`, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ automation: updates }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.automation
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteAutomation(automationId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/automations/${automationId}.json`, {
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

  // ============================================================================
  // TICKET FIELDS
  // ============================================================================

  async listTicketFields(): Promise<IntegrationResponse<{ ticket_fields: ZendeskTicketField[] }>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/ticket_fields.json`, {
          headers: this.getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        return await response.json()
      })

      return result.success
        ? { success: true, data: { ticket_fields: result.data.ticket_fields } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getTicketField(fieldId: number): Promise<IntegrationResponse<ZendeskTicketField>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/ticket_fields/${fieldId}.json`, {
          headers: this.getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.ticket_field
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createTicketField(field: ZendeskTicketField): Promise<IntegrationResponse<ZendeskTicketField>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/ticket_fields.json`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ ticket_field: field }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.ticket_field
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateTicketField(fieldId: number, updates: Partial<ZendeskTicketField>): Promise<IntegrationResponse<ZendeskTicketField>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/ticket_fields/${fieldId}.json`, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ ticket_field: updates }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.ticket_field
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteTicketField(fieldId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/ticket_fields/${fieldId}.json`, {
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

  // ============================================================================
  // SATISFACTION RATINGS
  // ============================================================================

  async listSatisfactionRatings(params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<{ satisfaction_ratings: ZendeskSatisfactionRating[]; next_page?: string }>> {
    try {
      await this.ensureConnected()

      let url = `${this.baseUrl}/satisfaction_ratings.json`
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
        ? {
            success: true,
            data: {
              satisfaction_ratings: result.data.satisfaction_ratings,
              next_page: result.data.next_page,
            },
          }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getSatisfactionRating(ratingId: number): Promise<IntegrationResponse<ZendeskSatisfactionRating>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/satisfaction_ratings/${ratingId}.json`, {
          headers: this.getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.satisfaction_rating
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createSatisfactionRating(params: {
    ticket_id: number
    score: 'good' | 'bad'
    comment?: string
  }): Promise<IntegrationResponse<ZendeskSatisfactionRating>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/satisfaction_ratings.json`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ satisfaction_rating: params }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.satisfaction_rating
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // ADVANCED USER OPERATIONS
  // ============================================================================

  async listUsers(params?: { role?: string; page?: number; per_page?: number }): Promise<IntegrationResponse<{ users: ZendeskUser[]; next_page?: string }>> {
    try {
      await this.ensureConnected()

      let url = `${this.baseUrl}/users.json`
      const queryParams = new URLSearchParams()

      if (params?.role) queryParams.set('role', params.role)
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
        ? { success: true, data: { users: result.data.users, next_page: result.data.next_page } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteUser(userId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users/${userId}.json`, {
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

  async suspendUser(userId: number): Promise<IntegrationResponse<ZendeskUser>> {
    return this.updateUser(userId, { suspended: true } as any)
  }

  async unsuspendUser(userId: number): Promise<IntegrationResponse<ZendeskUser>> {
    return this.updateUser(userId, { suspended: false } as any)
  }

  async mergeUsers(sourceUserId: number, targetUserId: number): Promise<IntegrationResponse<ZendeskUser>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users/${sourceUserId}/merge.json`, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ user: { id: targetUserId } }),
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

  // ============================================================================
  // ADVANCED ORGANIZATION OPERATIONS
  // ============================================================================

  async listOrganizations(params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<{ organizations: ZendeskOrganization[]; next_page?: string }>> {
    try {
      await this.ensureConnected()

      let url = `${this.baseUrl}/organizations.json`
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
        ? {
            success: true,
            data: {
              organizations: result.data.organizations,
              next_page: result.data.next_page,
            },
          }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateOrganization(orgId: number, updates: Partial<ZendeskOrganization>): Promise<IntegrationResponse<ZendeskOrganization>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/organizations/${orgId}.json`, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ organization: updates }),
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

  async deleteOrganization(orgId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/organizations/${orgId}.json`, {
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

  async searchOrganizations(query: string): Promise<IntegrationResponse<{ organizations: ZendeskOrganization[] }>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/organizations/search.json?query=${encodeURIComponent(query)}`, {
          headers: this.getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        return await response.json()
      })

      return result.success
        ? { success: true, data: { organizations: result.data.organizations } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // BRANDS
  // ============================================================================

  async listBrands(): Promise<IntegrationResponse<{ brands: ZendeskBrand[] }>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/brands.json`, {
          headers: this.getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        return await response.json()
      })

      return result.success ? { success: true, data: { brands: result.data.brands } } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getBrand(brandId: number): Promise<IntegrationResponse<ZendeskBrand>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/brands/${brandId}.json`, {
          headers: this.getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.brand
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // TICKET FORMS
  // ============================================================================

  async listTicketForms(): Promise<IntegrationResponse<{ ticket_forms: ZendeskTicketForm[] }>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/ticket_forms.json`, {
          headers: this.getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        return await response.json()
      })

      return result.success
        ? { success: true, data: { ticket_forms: result.data.ticket_forms } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getTicketForm(formId: number): Promise<IntegrationResponse<ZendeskTicketForm>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/ticket_forms/${formId}.json`, {
          headers: this.getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        const data = await response.json()
        return data.ticket_form
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // INCREMENTAL EXPORT
  // ============================================================================

  async exportTickets(startTime: number): Promise<IntegrationResponse<{ tickets: ZendeskTicket[]; end_time: number; next_page?: string }>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/incremental/tickets.json?start_time=${startTime}`, {
          headers: this.getAuthHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk API error: ${response.status}`)
        }

        return await response.json()
      })

      return result.success
        ? {
            success: true,
            data: {
              tickets: result.data.tickets,
              end_time: result.data.end_time,
              next_page: result.data.next_page,
            },
          }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
