/**
 * Freshchat Adapter - Modern messaging for customer engagement
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export interface FreshchatUser {
  id?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  properties?: Record<string, any>
  created_time?: string
}

export interface FreshchatConversation {
  conversation_id?: string
  app_id?: string
  status?: 'new' | 'assigned' | 'resolved'
  channel_id?: string
  messages?: FreshchatMessage[]
  assigned_agent_id?: string
  created_time?: string
}

export interface FreshchatMessage {
  id?: string
  message_type: 'normal' | 'private' | 'system'
  message_parts?: Array<{ text?: { content: string } }>
  actor_type: 'agent' | 'user' | 'system'
  actor_id?: string
  created_time?: string
}

export class FreshchatAdapter extends BaseIntegrationAdapter {
  private apiToken?: string
  private baseUrl = 'https://api.freshchat.com/v2'

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: true, canReceiveMessages: true, canSendFiles: true, canSendImages: true,
      canSendVideo: false, canSendAudio: false, canSendLocation: false, canSendButtons: false,
      canSendCards: false, canSendCarousels: false, canSendQuickReplies: false, canSendTemplates: false,
      canScheduleMessages: false, canBroadcast: true, canTag: true, canAssign: true,
      canCreateTickets: false, canCreateLeads: false, canCreateContacts: true, canSyncContacts: true,
      canSyncConversations: true, canSyncTickets: false, canExportData: true, canImportData: false,
      canTrackEvents: true, canTrackMetrics: true, canGenerateReports: false, canCreateWorkflows: false,
      canTriggerActions: true, canListenToWebhooks: true, maxMessageLength: 10000,
      maxFileSize: 25 * 1024 * 1024, maxBatchSize: 50, rateLimit: { messages: 60, period: 'per_minute' as const },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.apiToken = this.config.credentials.apiToken
    if (!this.apiToken) {
      return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing API token', retryable: false } }
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
      const result = await this.listUsers({ page: 1 })
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  private getHeaders(): Record<string, string> {
    return { 'Authorization': `Bearer ${this.apiToken}`, 'Content-Type': 'application/json' }
  }

  async createUser(user: FreshchatUser): Promise<IntegrationResponse<FreshchatUser>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(user),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listUsers(params: { page?: number }): Promise<IntegrationResponse<{ users: FreshchatUser[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params.page) query.set('page', params.page.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async sendMessage(params: {
    conversation_id: string
    message_parts: Array<{ text: { content: string } }>
    actor_id: string
  }): Promise<IntegrationResponse<FreshchatMessage>> {
    try {
      await this.ensureConnected()
      const message: FreshchatMessage = {
        message_type: 'normal',
        message_parts: params.message_parts,
        actor_type: 'agent',
        actor_id: params.actor_id,
      }
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/${params.conversation_id}/messages`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(message),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getConversation(conversationId: string): Promise<IntegrationResponse<FreshchatConversation>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/${conversationId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
