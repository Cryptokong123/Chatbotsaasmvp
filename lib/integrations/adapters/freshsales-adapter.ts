/**
 * Freshsales Adapter - Sales CRM
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export interface FreshsalesLead {
  id?: number
  first_name?: string
  last_name?: string
  email?: string
  work_number?: string
  mobile_number?: string
  company_name?: string
  lead_source_id?: string
  lead_stage_id?: number
  owner_id?: number
  custom_fields?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface FreshsalesContact {
  id?: number
  first_name?: string
  last_name?: string
  email?: string
  work_number?: string
  mobile_number?: string
  sales_accounts?: any[]
  owner_id?: number
  custom_fields?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface FreshsalesDeal {
  id?: number
  name: string
  amount?: number
  base_currency_amount?: number
  expected_close?: string
  closed_date?: string
  stage_updated_time?: string
  deal_pipeline_id?: number
  deal_stage_id?: number
  age?: number
  sales_account_id?: number
  owner_id?: number
  custom_fields?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface FreshsalesAccount {
  id?: number
  name: string
  website?: string
  phone?: string
  parent_sales_account_id?: number
  owner_id?: number
  custom_fields?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export class FreshsalesAdapter extends BaseIntegrationAdapter {
  private domain?: string
  private apiKey?: string
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
      maxFileSize: 0, maxBatchSize: 100, rateLimit: { messages: 40, period: 'per_minute' as const },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.domain = this.config.credentials.domain
    this.apiKey = this.config.credentials.apiKey
    if (!this.domain || !this.apiKey) {
      return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing credentials', retryable: false } }
    }
    this.baseUrl = `https://${this.domain}.freshsales.io/api`
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
      const result = await this.listLeads({ page: 1, per_page: 1 })
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  private getHeaders(): Record<string, string> {
    return { 'Authorization': `Token token=${this.apiKey}`, 'Content-Type': 'application/json' }
  }

  async createLead(lead: FreshsalesLead): Promise<IntegrationResponse<FreshsalesLead>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/leads`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ lead }),
        })
        if (!response.ok) throw new Error(`Freshsales API error: ${response.status}`)
        const data = await response.json()
        return data.lead
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listLeads(params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<{ leads: FreshsalesLead[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page) query.set('page', params.page.toString())
      if (params?.per_page) query.set('per_page', params.per_page.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/leads/view/all_leads${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshsales API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createContact(contact: FreshsalesContact): Promise<IntegrationResponse<FreshsalesContact>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ contact }),
        })
        if (!response.ok) throw new Error(`Freshsales API error: ${response.status}`)
        const data = await response.json()
        return data.contact
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createDeal(deal: FreshsalesDeal): Promise<IntegrationResponse<FreshsalesDeal>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/deals`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ deal }),
        })
        if (!response.ok) throw new Error(`Freshsales API error: ${response.status}`)
        const data = await response.json()
        return data.deal
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createAccount(account: FreshsalesAccount): Promise<IntegrationResponse<FreshsalesAccount>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/sales_accounts`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ sales_account: account }),
        })
        if (!response.ok) throw new Error(`Freshsales API error: ${response.status}`)
        const data = await response.json()
        return data.sales_account
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
