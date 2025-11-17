/**
 * Zoho CRM Adapter
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export interface ZohoLead {
  id?: string
  First_Name?: string
  Last_Name: string
  Email?: string
  Phone?: string
  Company: string
  Lead_Source?: string
  Lead_Status?: string
  Owner?: { id: string }
  created_time?: string
  modified_time?: string
}

export interface ZohoContact {
  id?: string
  First_Name?: string
  Last_Name: string
  Email?: string
  Phone?: string
  Account_Name?: { id: string }
  Owner?: { id: string }
  created_time?: string
  modified_time?: string
}

export interface ZohoDeal {
  id?: string
  Deal_Name: string
  Stage: string
  Amount?: number
  Closing_Date?: string
  Account_Name?: { id: string }
  Contact_Name?: { id: string }
  Owner?: { id: string }
  created_time?: string
  modified_time?: string
}

export interface ZohoAccount {
  id?: string
  Account_Name: string
  Website?: string
  Phone?: string
  Account_Type?: string
  Owner?: { id: string }
  created_time?: string
  modified_time?: string
}

export class ZohoCRMAdapter extends BaseIntegrationAdapter {
  private accessToken?: string
  private apiDomain?: string
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
      maxFileSize: 0, maxBatchSize: 100, rateLimit: { messages: 10, period: 'per_second' as const },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.accessToken = this.config.credentials.accessToken
    this.apiDomain = this.config.credentials.apiDomain || 'zohoapis.com'
    if (!this.accessToken) {
      return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing access token', retryable: false } }
    }
    this.baseUrl = `https://www.${this.apiDomain}/crm/v3`
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
      const result = await this.listLeads({ per_page: 1 })
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  private getHeaders(): Record<string, string> {
    return { 'Authorization': `Zoho-oauthtoken ${this.accessToken}`, 'Content-Type': 'application/json' }
  }

  async createLead(lead: ZohoLead): Promise<IntegrationResponse<ZohoLead>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/Leads`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: [lead] }),
        })
        if (!response.ok) throw new Error(`Zoho CRM API error: ${response.status}`)
        const data = await response.json()
        return data.data[0].details
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listLeads(params?: { per_page?: number; page?: number }): Promise<IntegrationResponse<{ data: ZohoLead[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.per_page) query.set('per_page', params.per_page.toString())
      if (params?.page) query.set('page', params.page.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/Leads${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Zoho CRM API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createContact(contact: ZohoContact): Promise<IntegrationResponse<ZohoContact>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/Contacts`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: [contact] }),
        })
        if (!response.ok) throw new Error(`Zoho CRM API error: ${response.status}`)
        const data = await response.json()
        return data.data[0].details
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createDeal(deal: ZohoDeal): Promise<IntegrationResponse<ZohoDeal>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/Deals`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: [deal] }),
        })
        if (!response.ok) throw new Error(`Zoho CRM API error: ${response.status}`)
        const data = await response.json()
        return data.data[0].details
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createAccount(account: ZohoAccount): Promise<IntegrationResponse<ZohoAccount>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/Accounts`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: [account] }),
        })
        if (!response.ok) throw new Error(`Zoho CRM API error: ${response.status}`)
        const data = await response.json()
        return data.data[0].details
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
