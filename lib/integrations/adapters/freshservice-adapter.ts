/**
 * Freshservice Adapter - IT Service Management
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export interface FreshserviceTicket {
  id?: number
  subject: string
  description: string
  status?: 2 | 3 | 4 | 5 // Open, Pending, Resolved, Closed
  priority?: 1 | 2 | 3 | 4 // Low, Medium, High, Urgent
  type?: 'Incident' | 'Service Request' | 'Change' | 'Problem'
  source?: 1 | 2 | 3 | 4 | 5 // Email, Portal, Phone, Chat, Feedback
  email?: string
  requester_id?: number
  responder_id?: number
  group_id?: number
  department_id?: number
  category?: string
  sub_category?: string
  item_category?: string
  impact?: 1 | 2 | 3 // Low, Medium, High
  urgency?: 1 | 2 | 3 // Low, Medium, High
  custom_fields?: Record<string, any>
  tags?: string[]
  due_by?: string
  fr_due_by?: string
  created_at?: string
  updated_at?: string
  deleted?: boolean
  spam?: boolean
}

export interface FreshserviceRequester {
  id?: number
  first_name: string
  last_name?: string
  primary_email?: string
  work_phone_number?: string
  mobile_phone_number?: string
  department_ids?: number[]
  location_id?: number
  can_see_all_tickets_from_associated_departments?: boolean
  reporting_manager_id?: number
  time_zone?: string
  language?: string
  job_title?: string
  custom_fields?: Record<string, any>
  active?: boolean
  address?: string
  background_information?: string
  created_at?: string
  updated_at?: string
}

export interface FreshserviceAgent {
  id?: number
  first_name: string
  last_name?: string
  email?: string
  job_title?: string
  language?: string
  time_zone?: string
  active?: boolean
  occasional?: boolean
  signature?: string
  department_ids?: number[]
  location_id?: number
  reporting_manager_id?: number
  address?: string
  background_information?: string
  scoreboard_level_id?: number
  member_of?: number[]
  observer_of?: number[]
  roles?: Array<{
    role_id?: number
    assignment_scope?: string
    groups?: number[]
  }>
  created_at?: string
  updated_at?: string
}

export interface FreshserviceAsset {
  id?: number
  name: string
  description?: string
  asset_type_id: number
  asset_tag?: string
  impact?: 'low' | 'medium' | 'high'
  usage_type?: 'permanent' | 'loaner'
  user_id?: number
  location_id?: number
  department_id?: number
  agent_id?: number
  group_id?: number
  assigned_on?: string
  author_type?: string
  discovery_enabled?: boolean
  level_field_attributes?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface FreshserviceProblem {
  id?: number
  subject: string
  description?: string
  requester_id?: number
  agent_id?: number
  group_id?: number
  priority?: 1 | 2 | 3 | 4
  impact?: 1 | 2 | 3
  status?: 1 | 2 | 3 | 4 | 5
  due_by?: string
  known_error?: boolean
  department_id?: number
  category?: string
  sub_category?: string
  item_category?: string
  analysis_fields?: {
    problem_cause?: string
    problem_symptom?: string
    problem_impact?: string
  }
  custom_fields?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface FreshserviceChange {
  id?: number
  subject: string
  description?: string
  requester_id?: number
  agent_id?: number
  group_id?: number
  priority?: 1 | 2 | 3 | 4
  impact?: 1 | 2 | 3
  status?: 1 | 2 | 3 | 4 | 5
  risk?: 1 | 2 | 3 | 4
  change_type?: 1 | 2 | 3 | 4
  planned_start_date?: string
  planned_end_date?: string
  department_id?: number
  category?: string
  sub_category?: string
  item_category?: string
  planning_fields?: {
    change_window_id?: number
    rollout_plan?: string
    backout_plan?: string
    impact_assessment?: string
  }
  custom_fields?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface FreshserviceRelease {
  id?: number
  subject: string
  description?: string
  planned_start_date?: string
  planned_end_date?: string
  status?: 1 | 2 | 3 | 4
  priority?: 1 | 2 | 3 | 4
  release_type?: 1 | 2 | 3
  work_start_date?: string
  work_end_date?: string
  agent_id?: number
  group_id?: number
  department_id?: number
  category?: string
  sub_category?: string
  item_category?: string
  planning_fields?: {
    rollout_plan?: string
    backout_plan?: string
    impact_assessment?: string
  }
  custom_fields?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface FreshserviceContract {
  id?: number
  name: string
  description?: string
  vendor_id?: number
  auto_renew?: boolean
  notify_expiry?: boolean
  notify_before?: number
  approver_id?: number
  start_date?: string
  end_date?: string
  cost?: number
  contract_number?: string
  contract_type_id?: number
  visible_to_id?: number
  notify_to?: string[]
  custom_fields?: Record<string, any>
  software_id?: number
  license_type?: string
  billing_cycle?: string
  license_key?: string
  item_cost_details?: Array<{
    item_name?: string
    pricing_model?: string
    cost?: number
    count?: number
    comments?: string
  }>
  created_at?: string
  updated_at?: string
}

export interface FreshserviceSolution {
  id?: number
  title: string
  description: string
  article_type?: 1 | 2 // Permanent, Workaround
  folder_id?: number
  status?: 1 | 2 // Draft, Published
  approval_status?: number
  tags?: string[]
  keywords?: string[]
  category_id?: number
  sub_category_id?: number
  item_category_id?: number
  thumbs_up?: number
  thumbs_down?: number
  hits?: number
  created_at?: string
  updated_at?: string
}

export interface FreshserviceGroup {
  id?: number
  name: string
  description?: string
  escalate_to?: number
  unassigned_for?: string
  business_hours_id?: number
  agent_ids?: number[]
  members?: number[]
  observers?: number[]
  restricted?: boolean
  approval_required?: boolean
  auto_ticket_assign?: boolean
  created_at?: string
  updated_at?: string
}

export interface FreshserviceConversation {
  id?: number
  user_id?: number
  to_emails?: string[]
  from_email?: string
  cc_emails?: string[]
  bcc_emails?: string[]
  body?: string
  body_text?: string
  incoming?: boolean
  private?: boolean
  source?: number
  support_email?: string
  ticket_id?: number
  created_at?: string
  updated_at?: string
  attachments?: Array<{
    id?: number
    content_type?: string
    size?: number
    name?: string
    attachment_url?: string
    created_at?: string
    updated_at?: string
  }>
}

export interface FreshserviceTimeEntry {
  id?: number
  start_time?: string
  timer_running?: boolean
  billable?: boolean
  time_spent?: string
  executed_at?: string
  task_id?: string
  note?: string
  agent_id?: number
  custom_fields?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export class FreshserviceAdapter extends BaseIntegrationAdapter {
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
      maxFileSize: 20 * 1024 * 1024, maxBatchSize: 100, rateLimit: { messages: 40, period: 'per_minute' as const },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.domain = this.config.credentials.domain
    this.apiKey = this.config.credentials.apiKey
    if (!this.domain || !this.apiKey) {
      return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing credentials', retryable: false } }
    }
    this.baseUrl = `https://${this.domain}.freshservice.com/api/v2`
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

  // ==================== Ticket Management ====================

  async createTicket(ticket: FreshserviceTicket): Promise<IntegrationResponse<FreshserviceTicket>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(ticket),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.ticket
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getTicket(ticketId: number): Promise<IntegrationResponse<FreshserviceTicket>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.ticket
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateTicket(ticketId: number, updates: Partial<FreshserviceTicket>): Promise<IntegrationResponse<FreshserviceTicket>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
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
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listTickets(params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<{ tickets: FreshserviceTicket[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page) query.set('page', params.page.toString())
      if (params?.per_page) query.set('per_page', params.per_page.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async filterTickets(query: string): Promise<IntegrationResponse<{ tickets: FreshserviceTicket[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/filter?query="${encodeURIComponent(query)}"`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async assignTicket(ticketId: number, responderId: number, groupId?: number): Promise<IntegrationResponse<FreshserviceTicket>> {
    const updates: Partial<FreshserviceTicket> = { responder_id: responderId }
    if (groupId) updates.group_id = groupId
    return this.updateTicket(ticketId, updates)
  }

  async closeTicket(ticketId: number): Promise<IntegrationResponse<FreshserviceTicket>> {
    return this.updateTicket(ticketId, { status: 5 })
  }

  // ==================== Requester Management ====================

  async createRequester(requester: FreshserviceRequester): Promise<IntegrationResponse<FreshserviceRequester>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/requesters`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(requester),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.requester
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getRequester(requesterId: number): Promise<IntegrationResponse<FreshserviceRequester>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/requesters/${requesterId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.requester
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateRequester(requesterId: number, updates: Partial<FreshserviceRequester>): Promise<IntegrationResponse<FreshserviceRequester>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/requesters/${requesterId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.requester
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listRequesters(params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<{ requesters: FreshserviceRequester[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page) query.set('page', params.page.toString())
      if (params?.per_page) query.set('per_page', params.per_page.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/requesters${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteRequester(requesterId: number, permanently?: boolean): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const query = permanently ? '?force=true' : ''
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/requesters/${requesterId}${query}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async mergeRequesters(primaryRequesterId: number, secondaryRequesterId: number): Promise<IntegrationResponse<FreshserviceRequester>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/requesters/${primaryRequesterId}/merge`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ secondary_requester_id: secondaryRequesterId }),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.requester
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Agent Management ====================

  async createAgent(agent: FreshserviceAgent): Promise<IntegrationResponse<FreshserviceAgent>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/agents`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(agent),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.agent
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getAgent(agentId: number): Promise<IntegrationResponse<FreshserviceAgent>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/agents/${agentId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.agent
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateAgent(agentId: number, updates: Partial<FreshserviceAgent>): Promise<IntegrationResponse<FreshserviceAgent>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/agents/${agentId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.agent
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listAgents(params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<{ agents: FreshserviceAgent[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page) query.set('page', params.page.toString())
      if (params?.per_page) query.set('per_page', params.per_page.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/agents${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
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
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Asset Management ====================

  async createAsset(asset: FreshserviceAsset): Promise<IntegrationResponse<FreshserviceAsset>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/assets`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(asset),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.asset
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getAsset(assetId: number): Promise<IntegrationResponse<FreshserviceAsset>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/assets/${assetId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.asset
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateAsset(assetId: number, updates: Partial<FreshserviceAsset>): Promise<IntegrationResponse<FreshserviceAsset>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/assets/${assetId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.asset
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listAssets(params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<{ assets: FreshserviceAsset[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page) query.set('page', params.page.toString())
      if (params?.per_page) query.set('per_page', params.per_page.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/assets${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteAsset(assetId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/assets/${assetId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async assignAsset(assetId: number, userId: number): Promise<IntegrationResponse<FreshserviceAsset>> {
    return this.updateAsset(assetId, { user_id: userId })
  }

  // ==================== Problem Management ====================

  async createProblem(problem: FreshserviceProblem): Promise<IntegrationResponse<FreshserviceProblem>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/problems`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(problem),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.problem
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getProblem(problemId: number): Promise<IntegrationResponse<FreshserviceProblem>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/problems/${problemId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.problem
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateProblem(problemId: number, updates: Partial<FreshserviceProblem>): Promise<IntegrationResponse<FreshserviceProblem>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/problems/${problemId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.problem
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listProblems(params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<{ problems: FreshserviceProblem[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page) query.set('page', params.page.toString())
      if (params?.per_page) query.set('per_page', params.per_page.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/problems${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteProblem(problemId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/problems/${problemId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Change Management ====================

  async createChange(change: FreshserviceChange): Promise<IntegrationResponse<FreshserviceChange>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/changes`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(change),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.change
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getChange(changeId: number): Promise<IntegrationResponse<FreshserviceChange>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/changes/${changeId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.change
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateChange(changeId: number, updates: Partial<FreshserviceChange>): Promise<IntegrationResponse<FreshserviceChange>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/changes/${changeId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.change
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listChanges(params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<{ changes: FreshserviceChange[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page) query.set('page', params.page.toString())
      if (params?.per_page) query.set('per_page', params.per_page.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/changes${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteChange(changeId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/changes/${changeId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Release Management ====================

  async createRelease(release: FreshserviceRelease): Promise<IntegrationResponse<FreshserviceRelease>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/releases`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(release),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.release
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getRelease(releaseId: number): Promise<IntegrationResponse<FreshserviceRelease>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/releases/${releaseId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.release
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateRelease(releaseId: number, updates: Partial<FreshserviceRelease>): Promise<IntegrationResponse<FreshserviceRelease>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/releases/${releaseId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.release
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listReleases(params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<{ releases: FreshserviceRelease[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page) query.set('page', params.page.toString())
      if (params?.per_page) query.set('per_page', params.per_page.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/releases${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Contract Management ====================

  async createContract(contract: FreshserviceContract): Promise<IntegrationResponse<FreshserviceContract>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contracts`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(contract),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.contract
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getContract(contractId: number): Promise<IntegrationResponse<FreshserviceContract>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contracts/${contractId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.contract
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateContract(contractId: number, updates: Partial<FreshserviceContract>): Promise<IntegrationResponse<FreshserviceContract>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contracts/${contractId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.contract
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listContracts(params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<{ contracts: FreshserviceContract[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page) query.set('page', params.page.toString())
      if (params?.per_page) query.set('per_page', params.per_page.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contracts${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Solutions (Knowledge Base) ====================

  async createSolution(solution: FreshserviceSolution): Promise<IntegrationResponse<FreshserviceSolution>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/solutions/articles`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(solution),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.article
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getSolution(solutionId: number): Promise<IntegrationResponse<FreshserviceSolution>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/solutions/articles/${solutionId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.article
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateSolution(solutionId: number, updates: Partial<FreshserviceSolution>): Promise<IntegrationResponse<FreshserviceSolution>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/solutions/articles/${solutionId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.article
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listSolutions(params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<{ articles: FreshserviceSolution[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page) query.set('page', params.page.toString())
      if (params?.per_page) query.set('per_page', params.per_page.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/solutions/articles${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async searchSolutions(term: string): Promise<IntegrationResponse<{ articles: FreshserviceSolution[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/solutions/articles/search?term=${encodeURIComponent(term)}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Group Management ====================

  async createGroup(group: FreshserviceGroup): Promise<IntegrationResponse<FreshserviceGroup>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/groups`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(group),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.group
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getGroup(groupId: number): Promise<IntegrationResponse<FreshserviceGroup>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/groups/${groupId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.group
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateGroup(groupId: number, updates: Partial<FreshserviceGroup>): Promise<IntegrationResponse<FreshserviceGroup>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/groups/${groupId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.group
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listGroups(params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<{ groups: FreshserviceGroup[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page) query.set('page', params.page.toString())
      if (params?.per_page) query.set('per_page', params.per_page.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/groups${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Conversations (Notes/Replies) ====================

  async getConversations(ticketId: number): Promise<IntegrationResponse<{ conversations: FreshserviceConversation[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}/conversations`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async addNote(ticketId: number, body: string, isPrivate: boolean = true): Promise<IntegrationResponse<FreshserviceConversation>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}/notes`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ body, private: isPrivate }),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.conversation
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async addReply(ticketId: number, body: string, toEmails?: string[]): Promise<IntegrationResponse<FreshserviceConversation>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}/reply`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ body, ...(toEmails && { to_emails: toEmails }) }),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.conversation
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Time Tracking ====================

  async createTimeEntry(ticketId: number, timeEntry: Partial<FreshserviceTimeEntry>): Promise<IntegrationResponse<FreshserviceTimeEntry>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}/time_entries`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(timeEntry),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.time_entry
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getTimeEntry(timeEntryId: number): Promise<IntegrationResponse<FreshserviceTimeEntry>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/time_entries/${timeEntryId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.time_entry
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateTimeEntry(timeEntryId: number, updates: Partial<FreshserviceTimeEntry>): Promise<IntegrationResponse<FreshserviceTimeEntry>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/time_entries/${timeEntryId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        const data = await response.json()
        return data.time_entry
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listTimeEntries(params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<{ time_entries: FreshserviceTimeEntry[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page) query.set('page', params.page.toString())
      if (params?.per_page) query.set('per_page', params.per_page.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/time_entries${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
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
        if (!response.ok) throw new Error(`Freshservice API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
