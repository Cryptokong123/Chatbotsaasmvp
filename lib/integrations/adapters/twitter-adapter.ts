/**
 * Twitter/X DM Adapter - API v2
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export class TwitterAdapter extends BaseIntegrationAdapter {
  private bearerToken?: string
  private apiKey?: string
  private apiSecret?: string
  private accessToken?: string
  private accessSecret?: string
  private baseUrl = 'https://api.twitter.com/2'

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: true, canReceiveMessages: true, canSendFiles: true, canSendImages: true,
      canSendVideo: true, canSendAudio: false, canSendLocation: false, canSendButtons: true,
      canSendCards: false, canSendCarousels: false, canSendQuickReplies: true, canSendTemplates: false,
      canScheduleMessages: false, canBroadcast: false, canTag: true, canAssign: false,
      canCreateTickets: false, canCreateLeads: true, canCreateContacts: true, canSyncContacts: true,
      canSyncConversations: true, canSyncTickets: false, canExportData: true, canImportData: false,
      canTrackEvents: true, canTrackMetrics: true, canGenerateReports: false, canCreateWorkflows: false,
      canTriggerActions: true, canListenToWebhooks: true, maxMessageLength: 10000,
      maxFileSize: 5 * 1024 * 1024, maxBatchSize: 50, rateLimit: { messages: 500, period: 'per_day' },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.bearerToken = this.config.credentials.bearerToken
    this.accessToken = this.config.credentials.accessToken
    if (!this.bearerToken && !this.accessToken) return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing credentials', retryable: false } }
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
        const response = await fetch(`${this.baseUrl}/users/me`, {
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}` }
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return await response.json()
      })
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  async sendDirectMessage(params: { recipientId: string; text: string; mediaId?: string }): Promise<IntegrationResponse<{ messageId: string }>> {
    try {
      await this.ensureConnected()
      const event: any = {
        event: {
          type: 'message_create',
          message_create: {
            target: { recipient_id: params.recipientId },
            message_data: { text: params.text }
          }
        }
      }
      if (params.mediaId) event.event.message_create.message_data.attachment = { type: 'media', media: { id: params.mediaId } }

      const result = await this.makeRequest(async () => {
        const response = await fetch('https://api.twitter.com/1.1/direct_messages/events/new.json', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.bearerToken || this.accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success ? { success: true, data: { messageId: result.data.event.id } } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
