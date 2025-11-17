/**
 * Pipedrive Adapter - Sales CRM and pipeline management
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export interface PipedriveLead {
  id?: string
  title: string
  person_id?: number
  organization_id?: number
  owner_id?: number
  value?: { amount: number; currency: string }
  label_ids?: string[]
  is_archived?: boolean
  add_time?: string
  update_time?: string
}

export interface PipedrivePerson {
  id?: number
  name: string
  email?: Array<{ value: string; primary: boolean }>
  phone?: Array<{ value: string; primary: boolean }>
  org_id?: number
  owner_id?: number
  visible_to?: string
  add_time?: string
  update_time?: string
}

export interface PipedriveDeal {
  id?: number
  title: string
  value?: number
  currency?: string
  status?: 'open' | 'won' | 'lost' | 'deleted'
  probability?: number
  expected_close_date?: string
  person_id?: number
  org_id?: number
  pipeline_id?: number
  stage_id?: number
  user_id?: number
  visible_to?: string
  add_time?: string
  update_time?: string
}

export interface PipedriveOrganization {
  id?: number
  name: string
  owner_id?: number
  visible_to?: string
  address?: string
  label?: number
  add_time?: string
  update_time?: string
}

export interface PipedriveActivity {
  id?: number
  subject: string
  type: string
  due_date?: string
  due_time?: string
  duration?: string
  deal_id?: number
  person_id?: number
  org_id?: number
  user_id?: number
  done?: 0 | 1
  add_time?: string
  update_time?: string
}

export class PipedriveAdapter extends BaseIntegrationAdapter {
  private apiToken?: string
  private companyDomain?: string
  private baseUrl?: string

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: false, canReceiveMessages: false, canSendFiles: false, canSendImages: false,
      canSendVideo: false, canSendAudio: false, canSendLocation: false, canSendButtons: false,
      canSendCards: false, canSendCarousels: false, canSendQuickReplies: false, canSendTemplates: false,
      canScheduleMessages: false, canBroadcast: false, canTag: true, canAssign: true,
      canCreateTickets: false, canCreateLeads: true, canCreateContacts: true, canSyncContacts: true,
      canSyncConversations: false, canSyncTickets: false, canExportData: true, canImportData: true,
      canTrackEvents: true, canTrackMetrics: true, canGenerateReports: true, canCreateWorkflows: true,
      canTriggerActions: true, canListenToWebhooks: true, maxMessageLength: 0,
      maxFileSize: 0, maxBatchSize: 500, rateLimit: { messages: 100, period: 'per_minute' as const },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.apiToken = this.config.credentials.apiToken
    this.companyDomain = this.config.credentials.companyDomain || 'api.pipedrive.com'
    if (!this.apiToken) {
      return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing API token', retryable: false } }
    }
    this.baseUrl = `https://${this.companyDomain}/v1`
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
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users/me?api_token=${this.apiToken}`)
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        return await response.json()
      })
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  async createLead(lead: PipedriveLead): Promise<IntegrationResponse<PipedriveLead>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/leads?api_token=${this.apiToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lead),
        })
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createPerson(person: PipedrivePerson): Promise<IntegrationResponse<PipedrivePerson>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/persons?api_token=${this.apiToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(person),
        })
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createDeal(deal: PipedriveDeal): Promise<IntegrationResponse<PipedriveDeal>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/deals?api_token=${this.apiToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deal),
        })
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createOrganization(org: PipedriveOrganization): Promise<IntegrationResponse<PipedriveOrganization>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/organizations?api_token=${this.apiToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(org),
        })
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createActivity(activity: PipedriveActivity): Promise<IntegrationResponse<PipedriveActivity>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/activities?api_token=${this.apiToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(activity),
        })
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listDeals(params?: { start?: number; limit?: number }): Promise<IntegrationResponse<{ data: PipedriveDeal[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams({ api_token: this.apiToken! })
      if (params?.start) query.set('start', params.start.toString())
      if (params?.limit) query.set('limit', params.limit.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/deals?${query}`, {
          headers: { 'Content-Type': 'application/json' },
        })
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
