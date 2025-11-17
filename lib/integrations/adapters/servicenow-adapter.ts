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
  sys_created_on?: string
  sys_updated_on?: string
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
  sys_created_on?: string
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

  async listIncidents(params?: { sysparm_limit?: number; sysparm_query?: string }): Promise<IntegrationResponse<{ result: ServiceNowIncident[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.sysparm_limit) query.set('sysparm_limit', params.sysparm_limit.toString())
      if (params?.sysparm_query) query.set('sysparm_query', params.sysparm_query)
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
}
