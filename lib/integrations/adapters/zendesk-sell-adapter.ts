/**
 * Zendesk Sell Adapter (formerly Base CRM)
 *
 * Complete sales CRM integration:
 * - Lead management
 * - Contact management
 * - Deal/opportunity pipeline
 * - Task management
 * - Note and activity tracking
 * - Call logging
 * - Email integration
 * - Sales automation
 * - Reporting and forecasting
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export interface ZendeskSellLead {
  id?: number
  creator_id?: number
  owner_id?: number
  first_name?: string
  last_name?: string
  organization_name?: string
  status?: string
  title?: string
  description?: string
  industry?: string
  website?: string
  email?: string
  phone?: string
  mobile?: string
  fax?: string
  twitter?: string
  facebook?: string
  linkedin?: string
  skype?: string
  address?: {
    line1?: string
    city?: string
    postal_code?: string
    state?: string
    country?: string
  }
  tags?: string[]
  custom_fields?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface ZendeskSellContact {
  id?: number
  creator_id?: number
  owner_id?: number
  is_organization?: boolean
  first_name?: string
  last_name?: string
  name?: string
  customer_status?: string
  prospect_status?: string
  title?: string
  description?: string
  industry?: string
  website?: string
  email?: string
  phone?: string
  mobile?: string
  fax?: string
  twitter?: string
  facebook?: string
  linkedin?: string
  skype?: string
  address?: {
    line1?: string
    city?: string
    postal_code?: string
    state?: string
    country?: string
  }
  tags?: string[]
  custom_fields?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface ZendeskSellDeal {
  id?: number
  creator_id?: number
  owner_id?: number
  name: string
  value?: number
  currency?: string
  hot?: boolean
  stage_id: number
  last_stage_change_at?: string
  contact_id?: number
  organization_id?: number
  source_id?: number
  loss_reason_id?: number
  dropbox_email?: string
  description?: string
  custom_fields?: Record<string, any>
  tags?: string[]
  estimated_close_date?: string
  created_at?: string
  updated_at?: string
}

export interface ZendeskSellTask {
  id?: number
  creator_id?: number
  owner_id?: number
  completed?: boolean
  completed_at?: string
  due_date?: string
  overdue?: boolean
  remind_at?: string
  content: string
  resource_type?: 'lead' | 'contact' | 'deal'
  resource_id?: number
  created_at?: string
  updated_at?: string
}

export interface ZendeskSellNote {
  id?: number
  creator_id?: number
  resource_type: 'lead' | 'contact' | 'deal'
  resource_id: number
  content: string
  created_at?: string
  updated_at?: string
}

export interface ZendeskSellCall {
  id?: number
  user_id?: number
  resource_type?: 'lead' | 'contact' | 'deal'
  resource_id?: number
  direction?: 'inbound' | 'outbound'
  duration?: number
  outcome?: string
  phone?: string
  summary?: string
  created_at?: string
  updated_at?: string
}

export interface ZendeskSellPipeline {
  id?: number
  name: string
  stages?: ZendeskSellStage[]
  created_at?: string
  updated_at?: string
}

export interface ZendeskSellStage {
  id?: number
  name: string
  category?: 'working' | 'won' | 'lost' | 'unqualified'
  likelihood?: number
  position?: number
}

export interface ZendeskSellUser {
  id?: number
  name: string
  email: string
  role?: string
  status?: string
  confirmed?: boolean
  phone?: string
  created_at?: string
  updated_at?: string
}

export interface ZendeskSellSource {
  id?: number
  name: string
  resource_type?: 'lead' | 'deal'
  created_at?: string
  updated_at?: string
}

export interface ZendeskSellLossReason {
  id?: number
  name: string
  created_at?: string
  updated_at?: string
}

export interface ZendeskSellEmail {
  id?: number
  user_id?: number
  resource_type?: 'lead' | 'contact' | 'deal'
  resource_id?: number
  subject?: string
  body?: string
  from?: string
  to?: string[]
  cc?: string[]
  bcc?: string[]
  sent_at?: string
  created_at?: string
  updated_at?: string
}

export interface ZendeskSellProduct {
  id?: number
  name: string
  description?: string
  sku?: string
  active?: boolean
  cost?: number
  cost_currency?: string
  price?: number
  price_currency?: string
  max_discount?: number
  max_markup?: number
  created_at?: string
  updated_at?: string
}

export interface ZendeskSellOrder {
  id?: number
  deal_id?: number
  discount?: number
  discount_type?: 'percentage' | 'fixed'
  created_at?: string
  updated_at?: string
}

export interface ZendeskSellLineItem {
  id?: number
  product_id: number
  value?: number
  quantity?: number
  discount?: number
  discount_type?: 'percentage' | 'fixed'
  position?: number
  currency?: string
  created_at?: string
  updated_at?: string
}

export interface ZendeskSellTextMessage {
  id?: number
  user_id?: number
  resource_type?: 'lead' | 'contact' | 'deal'
  resource_id?: number
  direction?: 'inbound' | 'outbound'
  phone?: string
  content?: string
  created_at?: string
  updated_at?: string
}

export interface ZendeskSellActivity {
  id?: number
  user_id?: number
  activity_type?: 'email' | 'call' | 'meeting' | 'lunch' | 'task' | 'deadline' | 'note'
  resource_type?: 'lead' | 'contact' | 'deal'
  resource_id?: number
  content?: string
  date?: string
  duration?: number
  created_at?: string
  updated_at?: string
}

export interface ZendeskSellTag {
  id?: number
  name: string
  resource_type?: 'lead' | 'contact' | 'deal'
  created_at?: string
}

export class ZendeskSellAdapter extends BaseIntegrationAdapter {
  private accessToken?: string
  private baseUrl = 'https://api.getbase.com/v2'

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: false,
      canReceiveMessages: false,
      canSendFiles: false,
      canSendImages: false,
      canSendVideo: false,
      canSendAudio: false,
      canSendLocation: false,
      canSendButtons: false,
      canSendCards: false,
      canSendCarousels: false,
      canSendQuickReplies: false,
      canSendTemplates: false,
      canScheduleMessages: false,
      canBroadcast: false,
      canTag: true,
      canAssign: true,
      canCreateTickets: false,
      canCreateLeads: true,
      canCreateContacts: true,
      canSyncContacts: true,
      canSyncConversations: false,
      canSyncTickets: false,
      canExportData: true,
      canImportData: true,
      canTrackEvents: true,
      canTrackMetrics: true,
      canGenerateReports: true,
      canCreateWorkflows: false,
      canTriggerActions: true,
      canListenToWebhooks: true,
      maxMessageLength: 0,
      maxFileSize: 0,
      maxBatchSize: 100,
      rateLimit: {
        messages: 300,
        period: 'per_minute' as const,
      },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.accessToken = this.config.credentials.accessToken
    if (!this.accessToken) {
      return {
        success: false,
        error: { code: 'AUTH_ERROR', message: 'Missing access token', retryable: false },
      }
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
      const result = await this.getCurrentUser()
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  }

  async getCurrentUser(): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users/self`, {
          headers: this.getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.data
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // LEAD MANAGEMENT
  // ============================================================================

  async createLead(lead: ZendeskSellLead): Promise<IntegrationResponse<ZendeskSellLead>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/leads`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: lead }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status} ${await response.text()}`)
        }

        const data = await response.json()
        return data.data
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateLead(leadId: number, updates: Partial<ZendeskSellLead>): Promise<IntegrationResponse<ZendeskSellLead>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/leads/${leadId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: updates }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.data
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getLead(leadId: number): Promise<IntegrationResponse<ZendeskSellLead>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/leads/${leadId}`, {
          headers: this.getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.data
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listLeads(params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<{ items: ZendeskSellLead[] }>> {
    try {
      await this.ensureConnected()

      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.set('page', params.page.toString())
      if (params?.per_page) queryParams.set('per_page', params.per_page.toString())

      const result = await this.makeRequest(async () => {
        const url = `${this.baseUrl}/leads${queryParams.toString() ? `?${queryParams}` : ''}`
        const response = await fetch(url, {
          headers: this.getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.items
      })

      return result.success ? { success: true, data: { items: result.data } } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // CONTACT MANAGEMENT
  // ============================================================================

  async createContact(contact: ZendeskSellContact): Promise<IntegrationResponse<ZendeskSellContact>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: contact }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status} ${await response.text()}`)
        }

        const data = await response.json()
        return data.data
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateContact(contactId: number, updates: Partial<ZendeskSellContact>): Promise<IntegrationResponse<ZendeskSellContact>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/${contactId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: updates }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.data
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getContact(contactId: number): Promise<IntegrationResponse<ZendeskSellContact>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/${contactId}`, {
          headers: this.getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.data
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // DEAL MANAGEMENT
  // ============================================================================

  async createDeal(deal: ZendeskSellDeal): Promise<IntegrationResponse<ZendeskSellDeal>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/deals`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: deal }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status} ${await response.text()}`)
        }

        const data = await response.json()
        return data.data
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateDeal(dealId: number, updates: Partial<ZendeskSellDeal>): Promise<IntegrationResponse<ZendeskSellDeal>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/deals/${dealId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: updates }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.data
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getDeal(dealId: number): Promise<IntegrationResponse<ZendeskSellDeal>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/deals/${dealId}`, {
          headers: this.getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.data
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // TASKS
  // ============================================================================

  async createTask(task: ZendeskSellTask): Promise<IntegrationResponse<ZendeskSellTask>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tasks`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: task }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.data
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async completeTask(taskId: number): Promise<IntegrationResponse<ZendeskSellTask>> {
    return this.updateTask(taskId, { completed: true })
  }

  async updateTask(taskId: number, updates: Partial<ZendeskSellTask>): Promise<IntegrationResponse<ZendeskSellTask>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: updates }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.data
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // NOTES
  // ============================================================================

  async createNote(note: ZendeskSellNote): Promise<IntegrationResponse<ZendeskSellNote>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/notes`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: note }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.data
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // CALLS
  // ============================================================================

  async logCall(call: ZendeskSellCall): Promise<IntegrationResponse<ZendeskSellCall>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/calls`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: call }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.data
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // PIPELINES
  // ============================================================================

  async listPipelines(): Promise<IntegrationResponse<{ items: ZendeskSellPipeline[] }>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/pipelines`, {
          headers: this.getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.items
      })

      return result.success ? { success: true, data: { items: result.data } } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getPipeline(pipelineId: number): Promise<IntegrationResponse<ZendeskSellPipeline>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/pipelines/${pipelineId}`, {
          headers: this.getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.data
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // DELETE OPERATIONS
  // ============================================================================

  async deleteLead(leadId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/leads/${leadId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        return undefined
      })

      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
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

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        return undefined
      })

      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
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

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        return undefined
      })

      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
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

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        return undefined
      })

      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
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

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        return undefined
      })

      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // LIST OPERATIONS
  // ============================================================================

  async listContacts(params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<{ items: ZendeskSellContact[] }>> {
    try {
      await this.ensureConnected()

      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.set('page', params.page.toString())
      if (params?.per_page) queryParams.set('per_page', params.per_page.toString())

      const result = await this.makeRequest(async () => {
        const url = `${this.baseUrl}/contacts${queryParams.toString() ? `?${queryParams}` : ''}`
        const response = await fetch(url, {
          headers: this.getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.items
      })

      return result.success ? { success: true, data: { items: result.data } } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listDeals(params?: { page?: number; per_page?: number; stage_id?: number; hot?: boolean }): Promise<IntegrationResponse<{ items: ZendeskSellDeal[] }>> {
    try {
      await this.ensureConnected()

      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.set('page', params.page.toString())
      if (params?.per_page) queryParams.set('per_page', params.per_page.toString())
      if (params?.stage_id) queryParams.set('stage_id', params.stage_id.toString())
      if (params?.hot !== undefined) queryParams.set('hot', params.hot.toString())

      const result = await this.makeRequest(async () => {
        const url = `${this.baseUrl}/deals${queryParams.toString() ? `?${queryParams}` : ''}`
        const response = await fetch(url, {
          headers: this.getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.items
      })

      return result.success ? { success: true, data: { items: result.data } } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listTasks(params?: { page?: number; per_page?: number; completed?: boolean; overdue?: boolean }): Promise<IntegrationResponse<{ items: ZendeskSellTask[] }>> {
    try {
      await this.ensureConnected()

      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.set('page', params.page.toString())
      if (params?.per_page) queryParams.set('per_page', params.per_page.toString())
      if (params?.completed !== undefined) queryParams.set('completed', params.completed.toString())
      if (params?.overdue !== undefined) queryParams.set('overdue', params.overdue.toString())

      const result = await this.makeRequest(async () => {
        const url = `${this.baseUrl}/tasks${queryParams.toString() ? `?${queryParams}` : ''}`
        const response = await fetch(url, {
          headers: this.getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.items
      })

      return result.success ? { success: true, data: { items: result.data } } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listNotes(params?: { resource_type: 'lead' | 'contact' | 'deal'; resource_id: number; page?: number; per_page?: number }): Promise<IntegrationResponse<{ items: ZendeskSellNote[] }>> {
    try {
      await this.ensureConnected()

      const queryParams = new URLSearchParams()
      queryParams.set('resource_type', params.resource_type)
      queryParams.set('resource_id', params.resource_id.toString())
      if (params?.page) queryParams.set('page', params.page.toString())
      if (params?.per_page) queryParams.set('per_page', params.per_page.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/notes?${queryParams}`, {
          headers: this.getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.items
      })

      return result.success ? { success: true, data: { items: result.data } } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listCalls(params?: { resource_type?: 'lead' | 'contact' | 'deal'; resource_id?: number; page?: number; per_page?: number }): Promise<IntegrationResponse<{ items: ZendeskSellCall[] }>> {
    try {
      await this.ensureConnected()

      const queryParams = new URLSearchParams()
      if (params?.resource_type) queryParams.set('resource_type', params.resource_type)
      if (params?.resource_id) queryParams.set('resource_id', params.resource_id.toString())
      if (params?.page) queryParams.set('page', params.page.toString())
      if (params?.per_page) queryParams.set('per_page', params.per_page.toString())

      const result = await this.makeRequest(async () => {
        const url = `${this.baseUrl}/calls${queryParams.toString() ? `?${queryParams}` : ''}`
        const response = await fetch(url, {
          headers: this.getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.items
      })

      return result.success ? { success: true, data: { items: result.data } } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // GET OPERATIONS
  // ============================================================================

  async getTask(taskId: number): Promise<IntegrationResponse<ZendeskSellTask>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
          headers: this.getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.data
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getNote(noteId: number): Promise<IntegrationResponse<ZendeskSellNote>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/notes/${noteId}`, {
          headers: this.getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.data
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getCall(callId: number): Promise<IntegrationResponse<ZendeskSellCall>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/calls/${callId}`, {
          headers: this.getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.data
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // SEARCH OPERATIONS
  // ============================================================================

  async searchLeads(query: string): Promise<IntegrationResponse<{ items: ZendeskSellLead[] }>> {
    try {
      await this.ensureConnected()

      const queryParams = new URLSearchParams()
      queryParams.set('q', query)

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/leads/search?${queryParams}`, {
          headers: this.getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.items
      })

      return result.success ? { success: true, data: { items: result.data } } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async searchContacts(query: string): Promise<IntegrationResponse<{ items: ZendeskSellContact[] }>> {
    try {
      await this.ensureConnected()

      const queryParams = new URLSearchParams()
      queryParams.set('q', query)

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/search?${queryParams}`, {
          headers: this.getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.items
      })

      return result.success ? { success: true, data: { items: result.data } } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async searchDeals(query: string): Promise<IntegrationResponse<{ items: ZendeskSellDeal[] }>> {
    try {
      await this.ensureConnected()

      const queryParams = new URLSearchParams()
      queryParams.set('q', query)

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/deals/search?${queryParams}`, {
          headers: this.getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.items
      })

      return result.success ? { success: true, data: { items: result.data } } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // LEAD CONVERSION
  // ============================================================================

  async convertLead(params: {
    leadId: number
    contact_id?: number
    organization_id?: number
    owner_id?: number
  }): Promise<IntegrationResponse<{ contact?: ZendeskSellContact; deal?: ZendeskSellDeal }>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/leads/${params.leadId}/convert`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            data: {
              contact_id: params.contact_id,
              organization_id: params.organization_id,
              owner_id: params.owner_id,
            },
          }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        return await response.json()
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // USERS
  // ============================================================================

  async listUsers(params?: { page?: number; per_page?: number }): Promise<IntegrationResponse<{ items: ZendeskSellUser[] }>> {
    try {
      await this.ensureConnected()

      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.set('page', params.page.toString())
      if (params?.per_page) queryParams.set('per_page', params.per_page.toString())

      const result = await this.makeRequest(async () => {
        const url = `${this.baseUrl}/users${queryParams.toString() ? `?${queryParams}` : ''}`
        const response = await fetch(url, {
          headers: this.getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.items
      })

      return result.success ? { success: true, data: { items: result.data } } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getUser(userId: number): Promise<IntegrationResponse<ZendeskSellUser>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users/${userId}`, {
          headers: this.getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.data
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // SOURCES
  // ============================================================================

  async listSources(params?: { resource_type?: 'lead' | 'deal' }): Promise<IntegrationResponse<{ items: ZendeskSellSource[] }>> {
    try {
      await this.ensureConnected()

      const queryParams = new URLSearchParams()
      if (params?.resource_type) queryParams.set('resource_type', params.resource_type)

      const result = await this.makeRequest(async () => {
        const url = `${this.baseUrl}/sources${queryParams.toString() ? `?${queryParams}` : ''}`
        const response = await fetch(url, {
          headers: this.getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.items
      })

      return result.success ? { success: true, data: { items: result.data } } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createSource(source: ZendeskSellSource): Promise<IntegrationResponse<ZendeskSellSource>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/sources`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: source }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.data
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // LOSS REASONS
  // ============================================================================

  async listLossReasons(): Promise<IntegrationResponse<{ items: ZendeskSellLossReason[] }>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/loss_reasons`, {
          headers: this.getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.items
      })

      return result.success ? { success: true, data: { items: result.data } } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createLossReason(lossReason: ZendeskSellLossReason): Promise<IntegrationResponse<ZendeskSellLossReason>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/loss_reasons`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: lossReason }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.data
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // PRODUCTS
  // ============================================================================

  async listProducts(params?: { page?: number; per_page?: number; active?: boolean }): Promise<IntegrationResponse<{ items: ZendeskSellProduct[] }>> {
    try {
      await this.ensureConnected()

      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.set('page', params.page.toString())
      if (params?.per_page) queryParams.set('per_page', params.per_page.toString())
      if (params?.active !== undefined) queryParams.set('active', params.active.toString())

      const result = await this.makeRequest(async () => {
        const url = `${this.baseUrl}/products${queryParams.toString() ? `?${queryParams}` : ''}`
        const response = await fetch(url, {
          headers: this.getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.items
      })

      return result.success ? { success: true, data: { items: result.data } } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createProduct(product: ZendeskSellProduct): Promise<IntegrationResponse<ZendeskSellProduct>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/products`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: product }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.data
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getProduct(productId: number): Promise<IntegrationResponse<ZendeskSellProduct>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/products/${productId}`, {
          headers: this.getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.data
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateProduct(productId: number, updates: Partial<ZendeskSellProduct>): Promise<IntegrationResponse<ZendeskSellProduct>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/products/${productId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: updates }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.data
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteProduct(productId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/products/${productId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        return undefined
      })

      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // ORDERS & LINE ITEMS
  // ============================================================================

  async createOrder(order: ZendeskSellOrder): Promise<IntegrationResponse<ZendeskSellOrder>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/orders`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: order }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.data
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async addLineItem(params: { orderId: number; lineItem: ZendeskSellLineItem }): Promise<IntegrationResponse<ZendeskSellLineItem>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/orders/${params.orderId}/line_items`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: params.lineItem }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.data
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // ACTIVITIES
  // ============================================================================

  async logTextMessage(textMessage: ZendeskSellTextMessage): Promise<IntegrationResponse<ZendeskSellTextMessage>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/text_messages`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: textMessage }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.data
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async logEmail(email: ZendeskSellEmail): Promise<IntegrationResponse<ZendeskSellEmail>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/emails`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: email }),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.data
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // TAGS
  // ============================================================================

  async listTags(params?: { resource_type?: 'lead' | 'contact' | 'deal' }): Promise<IntegrationResponse<{ items: ZendeskSellTag[] }>> {
    try {
      await this.ensureConnected()

      const queryParams = new URLSearchParams()
      if (params?.resource_type) queryParams.set('resource_type', params.resource_type)

      const result = await this.makeRequest(async () => {
        const url = `${this.baseUrl}/tags${queryParams.toString() ? `?${queryParams}` : ''}`
        const response = await fetch(url, {
          headers: this.getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Zendesk Sell API error: ${response.status}`)
        }

        const data = await response.json()
        return data.items
      })

      return result.success ? { success: true, data: { items: result.data } } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
