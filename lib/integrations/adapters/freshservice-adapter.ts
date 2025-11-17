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
  created_at?: string
  updated_at?: string
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
  assigned_on?: string
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
}
