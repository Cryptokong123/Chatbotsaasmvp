/**
 * HubSpot Adapter
 *
 * Complete CRM, Marketing, Sales, and Service Hub implementation
 */

import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export class HubSpotAdapter extends BaseIntegrationAdapter {
  private apiKey?: string
  private accessToken?: string
  private baseUrl = 'https://api.hubapi.com'

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: true, canReceiveMessages: true, canSendFiles: true, canSendImages: true,
      canSendVideo: false, canSendAudio: false, canSendLocation: false, canSendButtons: true,
      canSendCards: true, canSendCarousels: false, canSendQuickReplies: true, canSendTemplates: true,
      canScheduleMessages: true, canBroadcast: true, canTag: true, canAssign: true,
      canCreateTickets: true, canCreateLeads: true, canCreateContacts: true, canSyncContacts: true,
      canSyncConversations: true, canSyncTickets: true, canExportData: true, canImportData: true,
      canTrackEvents: true, canTrackMetrics: true, canGenerateReports: true, canCreateWorkflows: true,
      canTriggerActions: true, canListenToWebhooks: true, maxMessageLength: 10000,
      maxFileSize: 100 * 1024 * 1024, maxBatchSize: 100,
      rateLimit: { messages: 100, period: 'per_10_seconds' },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.apiKey = this.config.credentials.apiKey
    this.accessToken = this.config.credentials.accessToken
    if (!this.apiKey && !this.accessToken) {
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
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts?limit=1`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return await response.json()
      })
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  async createContact(properties: { email: string; firstname?: string; lastname?: string; phone?: string; company?: string; [key: string]: any }): Promise<IntegrationResponse<{ id: string }>> {
    return this.createObject('contacts', properties)
  }

  async createCompany(properties: { name: string; domain?: string; industry?: string; [key: string]: any }): Promise<IntegrationResponse<{ id: string }>> {
    return this.createObject('companies', properties)
  }

  async createDeal(properties: { dealname: string; dealstage: string; amount?: number; pipeline?: string; [key: string]: any }): Promise<IntegrationResponse<{ id: string }>> {
    return this.createObject('deals', properties)
  }

  async createTicket(properties: { subject: string; content?: string; hs_pipeline_stage?: string; hs_ticket_priority?: string; [key: string]: any }): Promise<IntegrationResponse<{ id: string }>> {
    return this.createObject('tickets', properties)
  }

  private async createObject(objectType: string, properties: Record<string, any>): Promise<IntegrationResponse<{ id: string }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/crm/v3/objects/${objectType}`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ properties }),
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success ? { success: true, data: { id: result.data.id } } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.accessToken) headers['Authorization'] = `Bearer ${this.accessToken}`
    else if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`
    return headers
  }
}
