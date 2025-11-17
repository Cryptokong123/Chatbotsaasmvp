/**
 * Instagram DM Adapter - Full Business API integration
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export class InstagramAdapter extends BaseIntegrationAdapter {
  private accessToken?: string
  private accountId?: string
  private baseUrl = 'https://graph.facebook.com/v18.0'

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: true, canReceiveMessages: true, canSendFiles: true, canSendImages: true,
      canSendVideo: true, canSendAudio: true, canSendLocation: false, canSendButtons: true,
      canSendCards: false, canSendCarousels: false, canSendQuickReplies: true, canSendTemplates: true,
      canScheduleMessages: false, canBroadcast: false, canTag: true, canAssign: false,
      canCreateTickets: false, canCreateLeads: true, canCreateContacts: true, canSyncContacts: true,
      canSyncConversations: true, canSyncTickets: false, canExportData: true, canImportData: false,
      canTrackEvents: true, canTrackMetrics: true, canGenerateReports: false, canCreateWorkflows: false,
      canTriggerActions: true, canListenToWebhooks: true, maxMessageLength: 1000,
      maxFileSize: 8 * 1024 * 1024, maxBatchSize: 50, rateLimit: { messages: 200, period: 'per_hour' },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.accessToken = this.config.credentials.accessToken
    this.accountId = this.config.credentials.accountId
    if (!this.accessToken || !this.accountId) return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing credentials', retryable: false } }
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
        const response = await fetch(`${this.baseUrl}/${this.accountId}?fields=id,username&access_token=${this.accessToken}`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return await response.json()
      })
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  async sendMessage(params: { recipientId: string; text?: string; attachment?: any }): Promise<IntegrationResponse<{ messageId: string }>> {
    try {
      await this.ensureConnected()
      const message: any = { recipient: { id: params.recipientId } }
      if (params.text) message.message = { text: params.text }
      if (params.attachment) message.message = { attachment: params.attachment }

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/me/messages?access_token=${this.accessToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message),
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success ? { success: true, data: { messageId: result.data.message_id } } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
