/**
 * Zendesk Sunshine Adapter
 *
 * Custom CRM platform built on Zendesk:
 * - Customer profiles with custom data
 * - Custom objects and relationships
 * - Events and timelines
 * - Integration with Support/Sell
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export interface SunshineProfile {
  type: string
  identifier_type: string
  identifier_value: string
  attributes?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface SunshineCustomObject {
  type: string
  external_id?: string
  attributes: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface SunshineEvent {
  profile: { type: string; identifier_type: string; identifier_value: string }
  type: string
  source: string
  description?: string
  properties?: Record<string, any>
  created_at?: string
}

export class ZendeskSunshineAdapter extends BaseIntegrationAdapter {
  private subdomain?: string
  private email?: string
  private apiToken?: string
  private baseUrl?: string

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: false, canReceiveMessages: false, canSendFiles: false, canSendImages: false,
      canSendVideo: false, canSendAudio: false, canSendLocation: false, canSendButtons: false,
      canSendCards: false, canSendCarousels: false, canSendQuickReplies: false, canSendTemplates: false,
      canScheduleMessages: false, canBroadcast: false, canTag: true, canAssign: false,
      canCreateTickets: false, canCreateLeads: false, canCreateContacts: true, canSyncContacts: true,
      canSyncConversations: false, canSyncTickets: false, canExportData: true, canImportData: true,
      canTrackEvents: true, canTrackMetrics: true, canGenerateReports: false, canCreateWorkflows: false,
      canTriggerActions: true, canListenToWebhooks: true, maxMessageLength: 0,
      maxFileSize: 0, maxBatchSize: 100, rateLimit: { messages: 600, period: 'per_minute' as const },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.subdomain = this.config.credentials.subdomain
    this.email = this.config.credentials.email
    this.apiToken = this.config.credentials.apiToken
    if (!this.subdomain || !this.email || !this.apiToken) {
      return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing credentials', retryable: false } }
    }
    this.baseUrl = `https://${this.subdomain}.zendesk.com/api/sunshine`
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
      const result = await this.listProfiles({ type: 'person', page_size: 1 })
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  private getHeaders(): Record<string, string> {
    const credentials = Buffer.from(`${this.email}/token:${this.apiToken}`).toString('base64')
    return { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/json' }
  }

  async createProfile(profile: SunshineProfile): Promise<IntegrationResponse<SunshineProfile>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/profiles`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ profile }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.profile
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listProfiles(params: { type: string; page_size?: number }): Promise<IntegrationResponse<{ data: SunshineProfile[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams({ type: params.type })
      if (params.page_size) query.set('page_size', params.page_size.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/profiles?${query}`, { headers: this.getHeaders() })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createEvent(event: SunshineEvent): Promise<IntegrationResponse<SunshineEvent>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/events`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ event }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.event
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createCustomObject(objectType: string, object: SunshineCustomObject): Promise<IntegrationResponse<SunshineCustomObject>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/objects/types/${objectType}/records`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: object }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
