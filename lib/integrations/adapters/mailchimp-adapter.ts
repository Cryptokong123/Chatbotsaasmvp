/**
 * Mailchimp Adapter - Email marketing platform
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export class MailchimpAdapter extends BaseIntegrationAdapter {
  private apiKey?: string
  private serverPrefix?: string
  private baseUrl?: string

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: true, canReceiveMessages: false, canSendFiles: false, canSendImages: true,
      canSendVideo: false, canSendAudio: false, canSendLocation: false, canSendButtons: true,
      canSendCards: false, canSendCarousels: false, canSendQuickReplies: false, canSendTemplates: true,
      canScheduleMessages: true, canBroadcast: true, canTag: true, canAssign: false,
      canCreateTickets: false, canCreateLeads: false, canCreateContacts: true, canSyncContacts: true,
      canSyncConversations: false, canSyncTickets: false, canExportData: true, canImportData: true,
      canTrackEvents: true, canTrackMetrics: true, canGenerateReports: true, canCreateWorkflows: true,
      canTriggerActions: true, canListenToWebhooks: true, maxMessageLength: 0,
      maxFileSize: 0, maxBatchSize: 500, rateLimit: { messages: 10, period: 'per_second' as const },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.apiKey = this.config.credentials.apiKey
    if (!this.apiKey) return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing API key', retryable: false } }
    this.serverPrefix = this.apiKey.split('-')[1] || 'us1'
    this.baseUrl = `https://${this.serverPrefix}.api.mailchimp.com/3.0`
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
        const response = await fetch(`${this.baseUrl}/ping`, {
          headers: { 'Authorization': `Bearer ${this.apiKey}` },
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  async addListMember(listId: string, params: { email_address: string; status: string; merge_fields?: Record<string, any> }): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}/members`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createCampaign(params: { type: string; recipients: { list_id: string }; settings: { subject_line: string; from_name: string; reply_to: string } }): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/campaigns`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
