/**
 * Copper CRM Adapter (formerly ProsperWorks)
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export interface CopperLead {
  id?: number
  name: string
  prefix?: string
  first_name?: string
  middle_name?: string
  last_name?: string
  suffix?: string
  email?: { email: string; category: string }
  phone_numbers?: Array<{ number: string; category: string }>
  socials?: Array<{ url: string; category: string }>
  websites?: Array<{ url: string; category: string }>
  company_name?: string
  customer_source_id?: number
  monetary_value?: number
  address?: { street?: string; city?: string; state?: string; postal_code?: string; country?: string }
  assignee_id?: number
  status?: string
  status_id?: number
  title?: string
  details?: string
  tags?: string[]
  interaction_count?: number
  custom_fields?: Array<{ custom_field_definition_id: number; value: any }>
  date_created?: number
  date_modified?: number
  date_last_contacted?: number
}

export interface CopperPerson {
  id?: number
  name: string
  prefix?: string
  first_name?: string
  middle_name?: string
  last_name?: string
  suffix?: string
  emails?: Array<{ email: string; category: string }>
  phone_numbers?: Array<{ number: string; category: string }>
  socials?: Array<{ url: string; category: string }>
  websites?: Array<{ url: string; category: string }>
  assignee_id?: number
  company_id?: number
  company_name?: string
  contact_type_id?: number
  details?: string
  title?: string
  address?: { street?: string; city?: string; state?: string; postal_code?: string; country?: string }
  tags?: string[]
  interaction_count?: number
  custom_fields?: Array<{ custom_field_definition_id: number; value: any }>
  date_created?: number
  date_modified?: number
  date_last_contacted?: number
}

export interface CopperOpportunity {
  id?: number
  name: string
  assignee_id?: number
  close_date?: string
  company_id?: number
  company_name?: string
  customer_source_id?: number
  details?: string
  loss_reason_id?: number
  monetary_value?: number
  pipeline_id?: number
  pipeline_stage_id?: number
  primary_contact_id?: number
  priority?: 'None' | 'Low' | 'Medium' | 'High'
  status?: 'Open' | 'Won' | 'Lost' | 'Abandoned'
  tags?: string[]
  interaction_count?: number
  win_probability?: number
  custom_fields?: Array<{ custom_field_definition_id: number; value: any }>
  date_created?: number
  date_modified?: number
  date_last_contacted?: number
}

export interface CopperCompany {
  id?: number
  name: string
  address?: { street?: string; city?: string; state?: string; postal_code?: string; country?: string }
  assignee_id?: number
  contact_type_id?: number
  details?: string
  email_domain?: string
  phone_numbers?: Array<{ number: string; category: string }>
  socials?: Array<{ url: string; category: string }>
  websites?: Array<{ url: string; category: string }>
  tags?: string[]
  interaction_count?: number
  custom_fields?: Array<{ custom_field_definition_id: number; value: any }>
  date_created?: number
  date_modified?: number
  date_last_contacted?: number
}

export interface CopperTask {
  id?: number
  name: string
  related_resource?: {
    id: number
    type: 'lead' | 'person' | 'company' | 'opportunity' | 'project'
  }
  assignee_id?: number
  due_date?: number
  reminder_date?: number
  completed_date?: number
  priority?: 'None' | 'Low' | 'Medium' | 'High'
  status?: 'Open' | 'Completed'
  details?: string
  tags?: string[]
  custom_fields?: Array<{ custom_field_definition_id: number; value: any }>
  date_created?: number
  date_modified?: number
}

export interface CopperActivity {
  id?: number
  parent?: {
    id: number
    type: 'lead' | 'person' | 'company' | 'opportunity' | 'project'
  }
  type?: {
    id: number
    category: 'user' | 'system'
  }
  user_id?: number
  details?: string
  activity_date?: number
  old_value?: any
  new_value?: any
  date_created?: number
  date_modified?: number
}

export interface CopperProject {
  id?: number
  name: string
  related_resource?: {
    id: number
    type: 'company' | 'opportunity'
  }
  assignee_id?: number
  status?: 'Open' | 'Completed'
  details?: string
  tags?: string[]
  custom_fields?: Array<{ custom_field_definition_id: number; value: any }>
  date_created?: number
  date_modified?: number
}

export interface CopperPipeline {
  id?: number
  name?: string
  stages?: Array<{
    id: number
    name: string
    win_probability?: number
  }>
}

export interface CopperWebhook {
  id?: number
  target: string
  type: 'lead' | 'person' | 'company' | 'opportunity' | 'project' | 'task'
  event: 'new' | 'update' | 'delete'
  secret?: string
}

export class CopperAdapter extends BaseIntegrationAdapter {
  private apiKey?: string
  private email?: string
  private baseUrl = 'https://api.copper.com/developer_api/v1'

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: false, canReceiveMessages: false, canSendFiles: false, canSendImages: false,
      canSendVideo: false, canSendAudio: false, canSendLocation: false, canSendButtons: false,
      canSendCards: false, canSendCarousels: false, canSendQuickReplies: false, canSendTemplates: false,
      canScheduleMessages: false, canBroadcast: false, canTag: true, canAssign: true,
      canCreateTickets: false, canCreateLeads: true, canCreateContacts: true, canSyncContacts: true,
      canSyncConversations: false, canSyncTickets: false, canExportData: true, canImportData: true,
      canTrackEvents: true, canTrackMetrics: true, canGenerateReports: true, canCreateWorkflows: false,
      canTriggerActions: true, canListenToWebhooks: true, maxMessageLength: 0,
      maxFileSize: 10 * 1024 * 1024, maxBatchSize: 200, rateLimit: { messages: 600, period: 'per_minute' as const },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.apiKey = this.config.credentials.apiKey
    this.email = this.config.credentials.email
    if (!this.apiKey || !this.email) {
      return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing credentials', retryable: false } }
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
      const result = await this.listLeads({ page_size: 1 })
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'X-PW-AccessToken': this.apiKey!,
      'X-PW-Application': 'developer_api',
      'X-PW-UserEmail': this.email!,
      'Content-Type': 'application/json',
    }
  }

  // ==================== Lead Management ====================

  async createLead(lead: CopperLead): Promise<IntegrationResponse<CopperLead>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/leads`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(lead),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getLead(leadId: number): Promise<IntegrationResponse<CopperLead>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/leads/${leadId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateLead(leadId: number, updates: Partial<CopperLead>): Promise<IntegrationResponse<CopperLead>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/leads/${leadId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteLead(leadId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/leads/${leadId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listLeads(params?: { page_size?: number; page_number?: number; sort_by?: string }): Promise<IntegrationResponse<CopperLead[]>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/leads/search`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            page_size: params?.page_size || 20,
            page_number: params?.page_number || 1,
            sort_by: params?.sort_by,
          }),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async convertLead(leadId: number, personId?: number, opportunityId?: number): Promise<IntegrationResponse<{
    person_id?: number
    opportunity_id?: number
  }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/leads/${leadId}/convert`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            ...(personId && { person_id: personId }),
            ...(opportunityId && { opportunity_id: opportunityId }),
          }),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Person Management ====================

  async createPerson(person: CopperPerson): Promise<IntegrationResponse<CopperPerson>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/people`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(person),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getPerson(personId: number): Promise<IntegrationResponse<CopperPerson>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/people/${personId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updatePerson(personId: number, updates: Partial<CopperPerson>): Promise<IntegrationResponse<CopperPerson>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/people/${personId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deletePerson(personId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/people/${personId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async searchPeople(params: { emails?: string[]; name?: string; company_id?: number; page_size?: number; page_number?: number }): Promise<IntegrationResponse<CopperPerson[]>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/people/search`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            emails: params.emails,
            name: params.name,
            company_id: params.company_id,
            page_size: params.page_size || 20,
            page_number: params.page_number || 1,
          }),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Opportunity Management ====================

  async createOpportunity(opportunity: CopperOpportunity): Promise<IntegrationResponse<CopperOpportunity>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/opportunities`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(opportunity),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getOpportunity(opportunityId: number): Promise<IntegrationResponse<CopperOpportunity>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/opportunities/${opportunityId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateOpportunity(opportunityId: number, updates: Partial<CopperOpportunity>): Promise<IntegrationResponse<CopperOpportunity>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/opportunities/${opportunityId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteOpportunity(opportunityId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/opportunities/${opportunityId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async searchOpportunities(params: { pipeline_stage_ids?: number[]; status?: string; assignee_ids?: number[]; page_size?: number }): Promise<IntegrationResponse<CopperOpportunity[]>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/opportunities/search`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            pipeline_stage_ids: params.pipeline_stage_ids,
            status: params.status,
            assignee_ids: params.assignee_ids,
            page_size: params.page_size || 20,
          }),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Company Management ====================

  async createCompany(company: CopperCompany): Promise<IntegrationResponse<CopperCompany>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/companies`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(company),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getCompany(companyId: number): Promise<IntegrationResponse<CopperCompany>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/companies/${companyId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateCompany(companyId: number, updates: Partial<CopperCompany>): Promise<IntegrationResponse<CopperCompany>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/companies/${companyId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
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
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async searchCompanies(params: { name?: string; email_domain?: string; page_size?: number }): Promise<IntegrationResponse<CopperCompany[]>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/companies/search`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            name: params.name,
            email_domain: params.email_domain,
            page_size: params.page_size || 20,
          }),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Task Management ====================

  async createTask(task: CopperTask): Promise<IntegrationResponse<CopperTask>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tasks`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(task),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getTask(taskId: number): Promise<IntegrationResponse<CopperTask>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateTask(taskId: number, updates: Partial<CopperTask>): Promise<IntegrationResponse<CopperTask>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteTask(taskId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Activity Management ====================

  async listActivities(params: {
    parent: { id: number; type: 'lead' | 'person' | 'company' | 'opportunity' | 'project' }
  }): Promise<IntegrationResponse<CopperActivity[]>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/activities/search`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ parent: params.parent }),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createActivity(activity: Partial<CopperActivity>): Promise<IntegrationResponse<CopperActivity>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/activities`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(activity),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Project Management ====================

  async createProject(project: CopperProject): Promise<IntegrationResponse<CopperProject>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/projects`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(project),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getProject(projectId: number): Promise<IntegrationResponse<CopperProject>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/projects/${projectId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateProject(projectId: number, updates: Partial<CopperProject>): Promise<IntegrationResponse<CopperProject>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/projects/${projectId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteProject(projectId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/projects/${projectId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Pipeline Management ====================

  async listPipelines(): Promise<IntegrationResponse<CopperPipeline[]>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/pipelines`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Webhook Management ====================

  async createWebhook(webhook: CopperWebhook): Promise<IntegrationResponse<CopperWebhook>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/webhooks`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(webhook),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listWebhooks(): Promise<IntegrationResponse<CopperWebhook[]>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/webhooks`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
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
        if (!response.ok) throw new Error(`Copper API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
