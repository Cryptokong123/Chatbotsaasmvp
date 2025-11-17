/**
 * Copper CRM Adapter (formerly ProsperWorks)
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export interface CopperLead {
  id?: number
  name: string
  email?: { email: string; category: string }
  phone_numbers?: Array<{ number: string; category: string }>
  company_name?: string
  address?: { street?: string; city?: string; state?: string; postal_code?: string; country?: string }
  assignee_id?: number
  status?: string
  status_id?: number
  tags?: string[]
  custom_fields?: Array<{ custom_field_definition_id: number; value: any }>
  date_created?: number
  date_modified?: number
}

export interface CopperPerson {
  id?: number
  name: string
  emails?: Array<{ email: string; category: string }>
  phone_numbers?: Array<{ number: string; category: string }>
  assignee_id?: number
  company_name?: string
  contact_type_id?: number
  address?: { street?: string; city?: string; state?: string; postal_code?: string; country?: string }
  tags?: string[]
  custom_fields?: Array<{ custom_field_definition_id: number; value: any }>
  date_created?: number
  date_modified?: number
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
  win_probability?: number
  custom_fields?: Array<{ custom_field_definition_id: number; value: any }>
  date_created?: number
  date_modified?: number
}

export interface CopperCompany {
  id?: number
  name: string
  address?: { street?: string; city?: string; state?: string; postal_code?: string; country?: string }
  assignee_id?: number
  phone_numbers?: Array<{ number: string; category: string }>
  websites?: Array<{ url: string; category: string }>
  tags?: string[]
  email_domain?: string
  custom_fields?: Array<{ custom_field_definition_id: number; value: any }>
  date_created?: number
  date_modified?: number
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
      maxFileSize: 0, maxBatchSize: 200, rateLimit: { messages: 600, period: 'per_minute' as const },
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

  async listLeads(params?: { page_size?: number; page_number?: number }): Promise<IntegrationResponse<CopperLead[]>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/leads/search`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            page_size: params?.page_size || 20,
            page_number: params?.page_number || 1,
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

  async searchPeople(params: { emails?: string[]; name?: string; page_size?: number }): Promise<IntegrationResponse<CopperPerson[]>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/people/search`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            emails: params.emails,
            name: params.name,
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
}
