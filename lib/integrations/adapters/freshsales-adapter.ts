/**
 * Freshsales Adapter - Sales CRM
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export interface FreshsalesLead {
  id?: number
  first_name?: string
  last_name?: string
  display_name?: string
  email?: string
  work_number?: string
  mobile_number?: string
  company_name?: string
  job_title?: string
  lead_source_id?: string
  lead_stage_id?: number
  territory_id?: number
  owner_id?: number
  address?: string
  city?: string
  state?: string
  zipcode?: string
  country?: string
  tags?: string[]
  custom_fields?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface FreshsalesContact {
  id?: number
  first_name?: string
  last_name?: string
  display_name?: string
  email?: string
  work_number?: string
  mobile_number?: string
  job_title?: string
  sales_accounts?: any[]
  owner_id?: number
  territory_id?: number
  address?: string
  city?: string
  state?: string
  zipcode?: string
  country?: string
  lifecycle_stage_id?: number
  contact_status_id?: number
  tags?: string[]
  custom_fields?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface FreshsalesDeal {
  id?: number
  name: string
  amount?: number
  base_currency_amount?: number
  currency_code?: string
  expected_close?: string
  closed_date?: string
  stage_updated_time?: string
  deal_pipeline_id?: number
  deal_stage_id?: number
  deal_type_id?: number
  deal_payment_status_id?: number
  deal_product_id?: number
  deal_reason_id?: number
  probability?: number
  age?: number
  sales_account_id?: number
  lead_id?: number
  contacts?: number[]
  owner_id?: number
  territory_id?: number
  tags?: string[]
  custom_fields?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface FreshsalesAccount {
  id?: number
  name: string
  website?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipcode?: string
  country?: string
  number_of_employees?: number
  annual_revenue?: number
  business_type_id?: number
  industry_type_id?: number
  parent_sales_account_id?: number
  owner_id?: number
  territory_id?: number
  tags?: string[]
  custom_fields?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface FreshsalesTask {
  id?: number
  title: string
  description?: string
  due_date?: string
  owner_id?: number
  targetable_id?: number
  targetable_type?: 'Lead' | 'Contact' | 'SalesAccount' | 'Deal'
  task_type_id?: number
  outcome_id?: number
  completed?: boolean
  completed_at?: string
  created_at?: string
  updated_at?: string
}

export interface FreshsalesAppointment {
  id?: number
  title: string
  description?: string
  from_date?: string
  end_date?: string
  location?: string
  time_zone?: string
  attendees?: Array<{
    id?: number
    type?: 'Contact' | 'Lead' | 'User'
  }>
  targetable_id?: number
  targetable_type?: 'Lead' | 'Contact' | 'SalesAccount' | 'Deal'
  owner_id?: number
  appointment_type_id?: number
  outcome_id?: number
  created_at?: string
  updated_at?: string
}

export interface FreshsalesNote {
  id?: number
  description: string
  targetable_id: number
  targetable_type: 'Lead' | 'Contact' | 'SalesAccount' | 'Deal'
  created_at?: string
  updated_at?: string
}

export interface FreshsalesProduct {
  id?: number
  name: string
  description?: string
  product_code?: string
  category?: string
  sku?: string
  pricing_type?: 'one_time' | 'recurring'
  active?: boolean
  prices?: Array<{
    currency_code?: string
    unit_price?: number
  }>
  custom_fields?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface FreshsalesDocument {
  id?: number
  name?: string
  file_name?: string
  file_size?: number
  content_type?: string
  targetable_id?: number
  targetable_type?: 'Lead' | 'Contact' | 'SalesAccount' | 'Deal'
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
      maxFileSize: 20 * 1024 * 1024, maxBatchSize: 100, rateLimit: { messages: 40, period: 'per_minute' as const },
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

  // ==================== Lead Management ====================

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

  async getLead(leadId: number): Promise<IntegrationResponse<FreshsalesLead>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/leads/${leadId}`, {
          headers: this.getHeaders(),
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

  async updateLead(leadId: number, updates: Partial<FreshsalesLead>): Promise<IntegrationResponse<FreshsalesLead>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/leads/${leadId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ lead: updates }),
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

  async deleteLead(leadId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/leads/${leadId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshsales API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
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

  async searchLeads(term: string): Promise<IntegrationResponse<{ leads: FreshsalesLead[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lookup?q=${encodeURIComponent(term)}&f=lead&entities=lead`, {
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

  async convertLead(leadId: number, contactId?: number, accountId?: number, dealId?: number): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/leads/${leadId}/convert`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            ...(contactId && { contact_id: contactId }),
            ...(accountId && { sales_account_id: accountId }),
            ...(dealId && { deal_id: dealId }),
          }),
        })
        if (!response.ok) throw new Error(`Freshsales API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Contact Management ====================

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

  async getContact(contactId: number): Promise<IntegrationResponse<FreshsalesContact>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/${contactId}`, {
          headers: this.getHeaders(),
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

  async updateContact(contactId: number, updates: Partial<FreshsalesContact>): Promise<IntegrationResponse<FreshsalesContact>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/${contactId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ contact: updates }),
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

  async deleteContact(contactId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/${contactId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshsales API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listContacts(params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<{ contacts: FreshsalesContact[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page) query.set('page', params.page.toString())
      if (params?.per_page) query.set('per_page', params.per_page.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/view/all_contacts${query.toString() ? `?${query}` : ''}`, {
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

  async searchContacts(term: string): Promise<IntegrationResponse<{ contacts: FreshsalesContact[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lookup?q=${encodeURIComponent(term)}&f=contact&entities=contact`, {
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

  // ==================== Deal Management ====================

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

  async getDeal(dealId: number): Promise<IntegrationResponse<FreshsalesDeal>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/deals/${dealId}`, {
          headers: this.getHeaders(),
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

  async updateDeal(dealId: number, updates: Partial<FreshsalesDeal>): Promise<IntegrationResponse<FreshsalesDeal>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/deals/${dealId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ deal: updates }),
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

  async deleteDeal(dealId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/deals/${dealId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshsales API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listDeals(params?: { page?: number; per_page?: number; view_id?: string }): Promise<IntegrationResponse<{ deals: FreshsalesDeal[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page) query.set('page', params.page.toString())
      if (params?.per_page) query.set('per_page', params.per_page.toString())
      const viewId = params?.view_id || 'all_deals'
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/deals/view/${viewId}${query.toString() ? `?${query}` : ''}`, {
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

  // ==================== Account Management ====================

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

  async getAccount(accountId: number): Promise<IntegrationResponse<FreshsalesAccount>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/sales_accounts/${accountId}`, {
          headers: this.getHeaders(),
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

  async updateAccount(accountId: number, updates: Partial<FreshsalesAccount>): Promise<IntegrationResponse<FreshsalesAccount>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/sales_accounts/${accountId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ sales_account: updates }),
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

  async deleteAccount(accountId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/sales_accounts/${accountId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshsales API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listAccounts(params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<{ sales_accounts: FreshsalesAccount[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page) query.set('page', params.page.toString())
      if (params?.per_page) query.set('per_page', params.per_page.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/sales_accounts/view/all_accounts${query.toString() ? `?${query}` : ''}`, {
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

  // ==================== Task Management ====================

  async createTask(task: FreshsalesTask): Promise<IntegrationResponse<FreshsalesTask>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tasks`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ task }),
        })
        if (!response.ok) throw new Error(`Freshsales API error: ${response.status}`)
        const data = await response.json()
        return data.task
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getTask(taskId: number): Promise<IntegrationResponse<FreshsalesTask>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshsales API error: ${response.status}`)
        const data = await response.json()
        return data.task
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateTask(taskId: number, updates: Partial<FreshsalesTask>): Promise<IntegrationResponse<FreshsalesTask>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ task: updates }),
        })
        if (!response.ok) throw new Error(`Freshsales API error: ${response.status}`)
        const data = await response.json()
        return data.task
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteTask(taskId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshsales API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Appointment Management ====================

  async createAppointment(appointment: FreshsalesAppointment): Promise<IntegrationResponse<FreshsalesAppointment>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/appointments`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ appointment }),
        })
        if (!response.ok) throw new Error(`Freshsales API error: ${response.status}`)
        const data = await response.json()
        return data.appointment
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getAppointment(appointmentId: number): Promise<IntegrationResponse<FreshsalesAppointment>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/appointments/${appointmentId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshsales API error: ${response.status}`)
        const data = await response.json()
        return data.appointment
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateAppointment(appointmentId: number, updates: Partial<FreshsalesAppointment>): Promise<IntegrationResponse<FreshsalesAppointment>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/appointments/${appointmentId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ appointment: updates }),
        })
        if (!response.ok) throw new Error(`Freshsales API error: ${response.status}`)
        const data = await response.json()
        return data.appointment
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteAppointment(appointmentId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/appointments/${appointmentId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshsales API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Note Management ====================

  async createNote(note: FreshsalesNote): Promise<IntegrationResponse<FreshsalesNote>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/notes`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ note }),
        })
        if (!response.ok) throw new Error(`Freshsales API error: ${response.status}`)
        const data = await response.json()
        return data.note
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateNote(noteId: number, description: string): Promise<IntegrationResponse<FreshsalesNote>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/notes/${noteId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ note: { description } }),
        })
        if (!response.ok) throw new Error(`Freshsales API error: ${response.status}`)
        const data = await response.json()
        return data.note
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteNote(noteId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/notes/${noteId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshsales API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Product Management ====================

  async createProduct(product: FreshsalesProduct): Promise<IntegrationResponse<FreshsalesProduct>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/products`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ product }),
        })
        if (!response.ok) throw new Error(`Freshsales API error: ${response.status}`)
        const data = await response.json()
        return data.product
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getProduct(productId: number): Promise<IntegrationResponse<FreshsalesProduct>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/products/${productId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshsales API error: ${response.status}`)
        const data = await response.json()
        return data.product
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listProducts(params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<{ products: FreshsalesProduct[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page) query.set('page', params.page.toString())
      if (params?.per_page) query.set('per_page', params.per_page.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/products${query.toString() ? `?${query}` : ''}`, {
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

  // ==================== Document Management ====================

  async uploadDocument(file: Buffer | Blob, fileName: string, targetableType: string, targetableId: number): Promise<IntegrationResponse<FreshsalesDocument>> {
    try {
      await this.ensureConnected()
      const formData = new FormData()
      const blob = file instanceof Buffer ? new Blob([file as any]) : file
      formData.append('file', blob as Blob, fileName)
      formData.append('targetable_type', targetableType)
      formData.append('targetable_id', targetableId.toString())

      const result = await this.makeRequest(async () => {
        const headers = { 'Authorization': `Token token=${this.apiKey}` }
        const response = await fetch(`${this.baseUrl}/documents`, {
          method: 'POST',
          headers,
          body: formData,
        })
        if (!response.ok) throw new Error(`Freshsales API error: ${response.status}`)
        const data = await response.json()
        return data.document
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteDocument(documentId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/documents/${documentId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshsales API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
