/**
 * ServiceNow Adapter - Enterprise IT service management
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export interface ServiceNowIncident {
  sys_id?: string
  number?: string
  short_description: string
  description?: string
  state?: string
  impact?: string
  urgency?: string
  priority?: string
  category?: string
  subcategory?: string
  assignment_group?: string
  assigned_to?: string
  caller_id?: string
  contact_type?: string
  work_notes?: string
  comments?: string
  close_notes?: string
  close_code?: string
  resolved_at?: string
  closed_at?: string
  sys_created_on?: string
  sys_updated_on?: string
  sys_created_by?: string
  sys_updated_by?: string
}

export interface ServiceNowUser {
  sys_id?: string
  user_name: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  mobile_phone?: string
  title?: string
  department?: string
  location?: string
  manager?: string
  active?: boolean
  locked_out?: boolean
  roles?: string
  sys_created_on?: string
  sys_updated_on?: string
}

export interface ServiceNowProblem {
  sys_id?: string
  number?: string
  short_description: string
  description?: string
  state?: string
  impact?: string
  urgency?: string
  priority?: string
  category?: string
  subcategory?: string
  assignment_group?: string
  assigned_to?: string
  workaround?: string
  known_error?: boolean
  root_cause?: string
  related_incidents?: string
  sys_created_on?: string
  sys_updated_on?: string
}

export interface ServiceNowChange {
  sys_id?: string
  number?: string
  short_description: string
  description?: string
  state?: string
  type?: 'standard' | 'normal' | 'emergency'
  risk?: string
  impact?: string
  priority?: string
  category?: string
  assignment_group?: string
  assigned_to?: string
  requested_by?: string
  approval?: string
  start_date?: string
  end_date?: string
  implementation_plan?: string
  backout_plan?: string
  test_plan?: string
  risk_impact_analysis?: string
  sys_created_on?: string
  sys_updated_on?: string
}

export interface ServiceNowCatalogItem {
  sys_id?: string
  name: string
  description?: string
  short_description?: string
  price?: string
  category?: string
  active?: boolean
  availability?: string
  delivery_time?: string
  icon?: string
  picture?: string
  sys_created_on?: string
  sys_updated_on?: string
}

export interface ServiceNowCatalogRequest {
  sys_id?: string
  number?: string
  requested_for?: string
  requested_by?: string
  request_state?: string
  stage?: string
  approval?: string
  opened_at?: string
  closed_at?: string
  short_description?: string
  description?: string
  special_instructions?: string
  sys_created_on?: string
  sys_updated_on?: string
}

export interface ServiceNowKnowledgeArticle {
  sys_id?: string
  number?: string
  short_description: string
  text?: string
  article_type?: string
  knowledge_base?: string
  category?: string
  author?: string
  workflow_state?: string
  published?: string
  valid_to?: string
  use_count?: number
  rating?: number
  helpful_count?: number
  meta?: string
  meta_description?: string
  roles?: string
  sys_created_on?: string
  sys_updated_on?: string
}

export interface ServiceNowGroup {
  sys_id?: string
  name: string
  description?: string
  type?: string
  manager?: string
  parent?: string
  active?: boolean
  email?: string
  roles?: string
  sys_created_on?: string
  sys_updated_on?: string
}

export interface ServiceNowCMDBItem {
  sys_id?: string
  name: string
  sys_class_name: string
  asset_tag?: string
  serial_number?: string
  model?: string
  model_category?: string
  manufacturer?: string
  location?: string
  department?: string
  assigned_to?: string
  owned_by?: string
  managed_by?: string
  install_status?: string
  operational_status?: string
  support_group?: string
  cost?: string
  purchase_date?: string
  warranty_expiration?: string
  attributes?: Record<string, any>
  sys_created_on?: string
  sys_updated_on?: string
}

export interface ServiceNowSLA {
  sys_id?: string
  name?: string
  sla?: string
  task?: string
  task_class?: string
  start_time?: string
  end_time?: string
  duration?: string
  schedule?: string
  business_duration?: string
  business_time_left?: string
  percentage?: number
  stage?: string
  has_breached?: boolean
  breach_time?: string
  sys_created_on?: string
  sys_updated_on?: string
}

export interface ServiceNowAttachment {
  sys_id?: string
  file_name?: string
  content_type?: string
  size_bytes?: string
  size_compressed?: string
  compressed?: boolean
  table_name?: string
  table_sys_id?: string
  download_link?: string
  sys_created_on?: string
  sys_created_by?: string
}

export interface ServiceNowTask {
  sys_id?: string
  number?: string
  short_description?: string
  description?: string
  state?: string
  priority?: string
  assignment_group?: string
  assigned_to?: string
  work_notes?: string
  comments?: string
  sys_class_name?: string
  sys_created_on?: string
  sys_updated_on?: string
}

export interface ServiceNowImportSetRow {
  sys_id?: string
  import_set?: string
  sys_import_state?: string
  sys_import_state_comment?: string
  sys_created_on?: string
  [key: string]: any
}

export class ServiceNowAdapter extends BaseIntegrationAdapter {
  private instance?: string
  private username?: string
  private password?: string
  private baseUrl?: string

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: true, canReceiveMessages: true, canSendFiles: true, canSendImages: true,
      canSendVideo: false, canSendAudio: false, canSendLocation: false, canSendButtons: false,
      canSendCards: false, canSendCarousels: false, canSendQuickReplies: false, canSendTemplates: false,
      canScheduleMessages: false, canBroadcast: false, canTag: true, canAssign: true,
      canCreateTickets: true, canCreateLeads: false, canCreateContacts: true, canSyncContacts: true,
      canSyncConversations: false, canSyncTickets: true, canExportData: true, canImportData: true,
      canTrackEvents: true, canTrackMetrics: true, canGenerateReports: true, canCreateWorkflows: true,
      canTriggerActions: true, canListenToWebhooks: true, maxMessageLength: 65535,
      maxFileSize: 25 * 1024 * 1024, maxBatchSize: 1000, rateLimit: { messages: 1000, period: 'per_hour' as const },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.instance = this.config.credentials.instance
    this.username = this.config.credentials.username
    this.password = this.config.credentials.password
    if (!this.instance || !this.username || !this.password) {
      return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing credentials', retryable: false } }
    }
    this.baseUrl = `https://${this.instance}.service-now.com/api/now`
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
      const result = await this.listIncidents({ sysparm_limit: 1 })
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  private getHeaders(): Record<string, string> {
    const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64')
    return { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/json', 'Accept': 'application/json' }
  }

  // ==================== Incident Management ====================

  async createIncident(incident: ServiceNowIncident): Promise<IntegrationResponse<ServiceNowIncident>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/incident`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(incident),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getIncident(sysId: string): Promise<IntegrationResponse<ServiceNowIncident>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/incident/${sysId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateIncident(sysId: string, updates: Partial<ServiceNowIncident>): Promise<IntegrationResponse<ServiceNowIncident>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/incident/${sysId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteIncident(sysId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/incident/${sysId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listIncidents(params?: { sysparm_limit?: number; sysparm_query?: string; sysparm_offset?: number }): Promise<IntegrationResponse<{ result: ServiceNowIncident[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.sysparm_limit) query.set('sysparm_limit', params.sysparm_limit.toString())
      if (params?.sysparm_query) query.set('sysparm_query', params.sysparm_query)
      if (params?.sysparm_offset) query.set('sysparm_offset', params.sysparm_offset.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/incident${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async assignIncident(sysId: string, assignedTo: string, assignmentGroup?: string): Promise<IntegrationResponse<ServiceNowIncident>> {
    const updates: Partial<ServiceNowIncident> = { assigned_to: assignedTo }
    if (assignmentGroup) updates.assignment_group = assignmentGroup
    return this.updateIncident(sysId, updates)
  }

  async resolveIncident(sysId: string, closeNotes: string, closeCode?: string): Promise<IntegrationResponse<ServiceNowIncident>> {
    return this.updateIncident(sysId, {
      state: '6', // Resolved
      close_notes: closeNotes,
      close_code: closeCode,
    })
  }

  async closeIncident(sysId: string, closeNotes: string, closeCode?: string): Promise<IntegrationResponse<ServiceNowIncident>> {
    return this.updateIncident(sysId, {
      state: '7', // Closed
      close_notes: closeNotes,
      close_code: closeCode,
    })
  }

  async addWorkNoteToIncident(sysId: string, workNote: string): Promise<IntegrationResponse<ServiceNowIncident>> {
    return this.updateIncident(sysId, { work_notes: workNote })
  }

  async addCommentToIncident(sysId: string, comment: string): Promise<IntegrationResponse<ServiceNowIncident>> {
    return this.updateIncident(sysId, { comments: comment })
  }

  // ==================== Problem Management ====================

  async createProblem(problem: ServiceNowProblem): Promise<IntegrationResponse<ServiceNowProblem>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/problem`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(problem),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getProblem(sysId: string): Promise<IntegrationResponse<ServiceNowProblem>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/problem/${sysId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateProblem(sysId: string, updates: Partial<ServiceNowProblem>): Promise<IntegrationResponse<ServiceNowProblem>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/problem/${sysId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listProblems(params?: { sysparm_limit?: number; sysparm_query?: string }): Promise<IntegrationResponse<{ result: ServiceNowProblem[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.sysparm_limit) query.set('sysparm_limit', params.sysparm_limit.toString())
      if (params?.sysparm_query) query.set('sysparm_query', params.sysparm_query)
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/problem${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async associateIncidentToProblem(problemSysId: string, incidentSysId: string): Promise<IntegrationResponse<ServiceNowProblem>> {
    return this.updateProblem(problemSysId, {
      related_incidents: incidentSysId,
    })
  }

  // ==================== Change Management ====================

  async createChange(change: ServiceNowChange): Promise<IntegrationResponse<ServiceNowChange>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/change_request`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(change),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getChange(sysId: string): Promise<IntegrationResponse<ServiceNowChange>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/change_request/${sysId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateChange(sysId: string, updates: Partial<ServiceNowChange>): Promise<IntegrationResponse<ServiceNowChange>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/change_request/${sysId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listChanges(params?: { sysparm_limit?: number; sysparm_query?: string }): Promise<IntegrationResponse<{ result: ServiceNowChange[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.sysparm_limit) query.set('sysparm_limit', params.sysparm_limit.toString())
      if (params?.sysparm_query) query.set('sysparm_query', params.sysparm_query)
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/change_request${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async approveChange(sysId: string): Promise<IntegrationResponse<ServiceNowChange>> {
    return this.updateChange(sysId, { approval: 'approved' })
  }

  async implementChange(sysId: string): Promise<IntegrationResponse<ServiceNowChange>> {
    return this.updateChange(sysId, { state: '3' }) // Implement
  }

  // ==================== Service Catalog ====================

  async listCatalogItems(params?: { sysparm_limit?: number; sysparm_category?: string }): Promise<IntegrationResponse<{ result: ServiceNowCatalogItem[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.sysparm_limit) query.set('sysparm_limit', params.sysparm_limit.toString())
      if (params?.sysparm_category) query.set('sysparm_query', `category=${params.sysparm_category}`)
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/sc_cat_item${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getCatalogItem(sysId: string): Promise<IntegrationResponse<ServiceNowCatalogItem>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/sc_cat_item/${sysId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async orderCatalogItem(itemSysId: string, requestedFor?: string, variables?: Record<string, any>): Promise<IntegrationResponse<ServiceNowCatalogRequest>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/sn_sc/servicecatalog/items/${itemSysId}/order_now`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            sysparm_quantity: 1,
            variables: variables || {},
            ...(requestedFor && { sysparm_requested_for: requestedFor }),
          }),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getCatalogRequest(sysId: string): Promise<IntegrationResponse<ServiceNowCatalogRequest>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/sc_request/${sysId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listCatalogRequests(params?: { sysparm_limit?: number; sysparm_query?: string }): Promise<IntegrationResponse<{ result: ServiceNowCatalogRequest[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.sysparm_limit) query.set('sysparm_limit', params.sysparm_limit.toString())
      if (params?.sysparm_query) query.set('sysparm_query', params.sysparm_query)
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/sc_request${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Knowledge Base ====================

  async createKnowledgeArticle(article: ServiceNowKnowledgeArticle): Promise<IntegrationResponse<ServiceNowKnowledgeArticle>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/kb_knowledge`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(article),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getKnowledgeArticle(sysId: string): Promise<IntegrationResponse<ServiceNowKnowledgeArticle>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/kb_knowledge/${sysId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateKnowledgeArticle(sysId: string, updates: Partial<ServiceNowKnowledgeArticle>): Promise<IntegrationResponse<ServiceNowKnowledgeArticle>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/kb_knowledge/${sysId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async searchKnowledgeArticles(searchTerm: string, limit?: number): Promise<IntegrationResponse<{ result: ServiceNowKnowledgeArticle[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      query.set('sysparm_query', `short_descriptionLIKE${searchTerm}^ORtextLIKE${searchTerm}`)
      if (limit) query.set('sysparm_limit', limit.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/kb_knowledge?${query}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async publishKnowledgeArticle(sysId: string): Promise<IntegrationResponse<ServiceNowKnowledgeArticle>> {
    return this.updateKnowledgeArticle(sysId, { workflow_state: 'published' })
  }

  // ==================== User & Group Management ====================

  async createUser(user: ServiceNowUser): Promise<IntegrationResponse<ServiceNowUser>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/sys_user`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(user),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getUser(sysId: string): Promise<IntegrationResponse<ServiceNowUser>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/sys_user/${sysId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateUser(sysId: string, updates: Partial<ServiceNowUser>): Promise<IntegrationResponse<ServiceNowUser>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/sys_user/${sysId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listUsers(params?: { sysparm_limit?: number; sysparm_query?: string }): Promise<IntegrationResponse<{ result: ServiceNowUser[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.sysparm_limit) query.set('sysparm_limit', params.sysparm_limit.toString())
      if (params?.sysparm_query) query.set('sysparm_query', params.sysparm_query)
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/sys_user${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createGroup(group: ServiceNowGroup): Promise<IntegrationResponse<ServiceNowGroup>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/sys_user_group`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(group),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getGroup(sysId: string): Promise<IntegrationResponse<ServiceNowGroup>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/sys_user_group/${sysId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listGroups(params?: { sysparm_limit?: number; sysparm_query?: string }): Promise<IntegrationResponse<{ result: ServiceNowGroup[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.sysparm_limit) query.set('sysparm_limit', params.sysparm_limit.toString())
      if (params?.sysparm_query) query.set('sysparm_query', params.sysparm_query)
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/sys_user_group${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async addUserToGroup(userSysId: string, groupSysId: string): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/sys_user_grmember`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            user: userSysId,
            group: groupSysId,
          }),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== CMDB (Configuration Management Database) ====================

  async createCMDBItem(item: ServiceNowCMDBItem): Promise<IntegrationResponse<ServiceNowCMDBItem>> {
    try {
      await this.ensureConnected()
      const tableName = item.sys_class_name || 'cmdb_ci'
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/${tableName}`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(item),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getCMDBItem(sysId: string, tableName: string = 'cmdb_ci'): Promise<IntegrationResponse<ServiceNowCMDBItem>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/${tableName}/${sysId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateCMDBItem(sysId: string, updates: Partial<ServiceNowCMDBItem>, tableName: string = 'cmdb_ci'): Promise<IntegrationResponse<ServiceNowCMDBItem>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/${tableName}/${sysId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listCMDBItems(tableName: string = 'cmdb_ci', params?: { sysparm_limit?: number; sysparm_query?: string }): Promise<IntegrationResponse<{ result: ServiceNowCMDBItem[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.sysparm_limit) query.set('sysparm_limit', params.sysparm_limit.toString())
      if (params?.sysparm_query) query.set('sysparm_query', params.sysparm_query)
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/${tableName}${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async queryCMDBRelationships(ciSysId: string): Promise<IntegrationResponse<{ result: any[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      query.set('sysparm_query', `parent=${ciSysId}^ORchild=${ciSysId}`)
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/cmdb_rel_ci?${query}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== SLA Management ====================

  async getSLA(sysId: string): Promise<IntegrationResponse<ServiceNowSLA>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/task_sla/${sysId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listSLAs(params?: { sysparm_limit?: number; sysparm_query?: string }): Promise<IntegrationResponse<{ result: ServiceNowSLA[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.sysparm_limit) query.set('sysparm_limit', params.sysparm_limit.toString())
      if (params?.sysparm_query) query.set('sysparm_query', params.sysparm_query)
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/task_sla${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async pauseSLA(sysId: string): Promise<IntegrationResponse<ServiceNowSLA>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/task_sla/${sysId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({ stage: 'paused' }),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async resumeSLA(sysId: string): Promise<IntegrationResponse<ServiceNowSLA>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/task_sla/${sysId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({ stage: 'in_progress' }),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Attachments ====================

  async uploadAttachment(
    tableName: string,
    tableSysId: string,
    fileName: string,
    contentType: string,
    fileContent: Buffer | string
  ): Promise<IntegrationResponse<ServiceNowAttachment>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/attachment/file?table_name=${tableName}&table_sys_id=${tableSysId}&file_name=${fileName}`, {
          method: 'POST',
          headers: {
            'Authorization': this.getHeaders()['Authorization'],
            'Content-Type': contentType,
            'Accept': 'application/json',
          },
          body: fileContent,
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getAttachment(sysId: string): Promise<IntegrationResponse<ServiceNowAttachment>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/attachment/${sysId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listAttachments(tableName: string, tableSysId: string): Promise<IntegrationResponse<{ result: ServiceNowAttachment[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      query.set('sysparm_query', `table_name=${tableName}^table_sys_id=${tableSysId}`)
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/attachment?${query}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteAttachment(sysId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/attachment/${sysId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Task Management (Generic) ====================

  async getTask(sysId: string): Promise<IntegrationResponse<ServiceNowTask>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/task/${sysId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateTask(sysId: string, updates: Partial<ServiceNowTask>): Promise<IntegrationResponse<ServiceNowTask>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/task/${sysId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const data = await response.json()
        return data.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async assignTask(sysId: string, assignedTo: string, assignmentGroup?: string): Promise<IntegrationResponse<ServiceNowTask>> {
    const updates: Partial<ServiceNowTask> = { assigned_to: assignedTo }
    if (assignmentGroup) updates.assignment_group = assignmentGroup
    return this.updateTask(sysId, updates)
  }

  async addWorkNoteToTask(sysId: string, workNote: string): Promise<IntegrationResponse<ServiceNowTask>> {
    return this.updateTask(sysId, { work_notes: workNote })
  }

  // ==================== Import/Export ====================

  async exportTable(tableName: string, params?: { sysparm_query?: string; sysparm_fields?: string }): Promise<IntegrationResponse<{ result: any[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.sysparm_query) query.set('sysparm_query', params.sysparm_query)
      if (params?.sysparm_fields) query.set('sysparm_fields', params.sysparm_fields)
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/table/${tableName}${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async importData(importSetTable: string, data: Record<string, any>): Promise<IntegrationResponse<ServiceNowImportSetRow>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/import/${importSetTable}`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(data),
        })
        if (!response.ok) throw new Error(`ServiceNow API error: ${response.status}`)
        const responseData = await response.json()
        return responseData.result
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
