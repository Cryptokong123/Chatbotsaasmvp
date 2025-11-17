/**
 * LinkedIn Messages Adapter
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export class LinkedInAdapter extends BaseIntegrationAdapter {
  private accessToken?: string
  private baseUrl = 'https://api.linkedin.com/v2'

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: true, canReceiveMessages: true, canSendFiles: true, canSendImages: true,
      canSendVideo: false, canSendAudio: false, canSendLocation: false, canSendButtons: false,
      canSendCards: false, canSendCarousels: false, canSendQuickReplies: false, canSendTemplates: false,
      canScheduleMessages: false, canBroadcast: false, canTag: false, canAssign: false,
      canCreateTickets: false, canCreateLeads: true, canCreateContacts: true, canSyncContacts: true,
      canSyncConversations: true, canSyncTickets: false, canExportData: true, canImportData: false,
      canTrackEvents: true, canTrackMetrics: true, canGenerateReports: false, canCreateWorkflows: false,
      canTriggerActions: true, canListenToWebhooks: true, maxMessageLength: 1900,
      maxFileSize: 100 * 1024 * 1024, maxBatchSize: 25, rateLimit: { messages: 100, period: 'per_day' },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.accessToken = this.config.credentials.accessToken
    if (!this.accessToken) return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing access token', retryable: false } }
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
        const response = await fetch(`${this.baseUrl}/me`, {
          headers: { 'Authorization': `Bearer ${this.accessToken}`, 'LinkedIn-Version': '202401' }
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return await response.json()
      })
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  async sendMessage(params: { conversationId: string; text: string }): Promise<IntegrationResponse<{ messageId: string }>> {
    try {
      await this.ensureConnected()
      const message = {
        body: { text: params.text },
        conversationId: params.conversationId
      }

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/messages`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.accessToken}`, 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' },
          body: JSON.stringify(message),
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success ? { success: true, data: { messageId: result.data.value.id } } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
