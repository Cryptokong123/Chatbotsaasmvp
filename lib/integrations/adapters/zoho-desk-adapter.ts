/**
 * Zoho Desk Adapter - Help desk software
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export interface ZohoDeskTicket {
  id?: string
  subject: string
  description?: string
  status?: string
  priority?: string
  departmentId?: string
  contactId?: string
  assigneeId?: string
  channel?: string
  classification?: string
  category?: string
  subCategory?: string
  customFields?: Record<string, any>
  createdTime?: string
  modifiedTime?: string
}

export interface ZohoDeskContact {
  id?: string
  firstName?: string
  lastName?: string
  email: string
  phone?: string
  mobile?: string
  accountId?: string
  description?: string
  type?: 'CONTACT' | 'LEAD' | 'ACCOUNT'
  createdTime?: string
}

export interface ZohoDeskAccount {
  id?: string
  accountName: string
  email?: string
  website?: string
  phone?: string
  description?: string
  createdTime?: string
}

export class ZohoDeskAdapter extends BaseIntegrationAdapter {
  private orgId?: string
  private accessToken?: string
  private apiDomain?: string
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
      canTriggerActions: true, canListenToWebhooks: true, maxMessageLength: 32000,
      maxFileSize: 20 * 1024 * 1024, maxBatchSize: 100, rateLimit: { messages: 50, period: 'per_minute' as const },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.orgId = this.config.credentials.orgId
    this.accessToken = this.config.credentials.accessToken
    this.apiDomain = this.config.credentials.apiDomain || 'zohoapis.com'
    if (!this.orgId || !this.accessToken) {
      return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing credentials', retryable: false } }
    }
    this.baseUrl = `https://desk.${this.apiDomain}/api/v1`
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
      const result = await this.listTickets({ limit: 1 })
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  private getHeaders(): Record<string, string> {
    return { 'Authorization': `Zoho-oauthtoken ${this.accessToken}`, 'orgId': this.orgId!, 'Content-Type': 'application/json' }
  }

  async createTicket(ticket: ZohoDeskTicket): Promise<IntegrationResponse<ZohoDeskTicket>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(ticket),
        })
        if (!response.ok) throw new Error(`Zoho Desk API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listTickets(params?: { limit?: number }): Promise<IntegrationResponse<{ data: ZohoDeskTicket[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.limit) query.set('limit', params.limit.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Zoho Desk API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createContact(contact: ZohoDeskContact): Promise<IntegrationResponse<ZohoDeskContact>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(contact),
        })
        if (!response.ok) throw new Error(`Zoho Desk API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createAccount(account: ZohoDeskAccount): Promise<IntegrationResponse<ZohoDeskAccount>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/accounts`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(account),
        })
        if (!response.ok) throw new Error(`Zoho Desk API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
