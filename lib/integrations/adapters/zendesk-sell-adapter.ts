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
}
