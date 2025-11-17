/**
 * Pipedrive Adapter - Sales CRM and pipeline management
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export interface PipedriveLead {
  id?: string
  title: string
  person_id?: number
  organization_id?: number
  owner_id?: number
  value?: { amount: number; currency: string }
  expected_close_date?: string
  label_ids?: string[]
  is_archived?: boolean
  source_name?: string
  was_seen?: boolean
  add_time?: string
  update_time?: string
}

export interface PipedrivePerson {
  id?: number
  name: string
  email?: Array<{ value: string; primary: boolean; label?: string }>
  phone?: Array<{ value: string; primary: boolean; label?: string }>
  org_id?: number
  owner_id?: number
  visible_to?: string
  label?: number
  marketing_status?: 'no_consent' | 'unsubscribed' | 'subscribed' | 'archived'
  add_time?: string
  update_time?: string
  first_char?: string
  picture_id?: {
    item_type?: string
    item_id?: number
    active_flag?: boolean
  }
}

export interface PipedriveDeal {
  id?: number
  title: string
  value?: number
  currency?: string
  status?: 'open' | 'won' | 'lost' | 'deleted'
  probability?: number
  expected_close_date?: string
  lost_reason?: string
  visible_to?: string
  add_time?: string
  update_time?: string
  stage_change_time?: string
  active?: boolean
  deleted?: boolean
  stage_id?: number
  pipeline_id?: number
  won_time?: string
  lost_time?: string
  close_time?: string
  person_id?: number
  org_id?: number
  user_id?: number
  products_count?: number
  files_count?: number
  notes_count?: number
  activities_count?: number
  won_by?: number
  lost_by?: number
  next_activity_date?: string
}

export interface PipedriveOrganization {
  id?: number
  name: string
  owner_id?: number
  visible_to?: string
  address?: string
  address_subpremise?: string
  address_street_number?: string
  address_route?: string
  address_sublocality?: string
  address_locality?: string
  address_admin_area_level_1?: string
  address_admin_area_level_2?: string
  address_country?: string
  address_postal_code?: string
  address_formatted_address?: string
  label?: number
  active_flag?: boolean
  add_time?: string
  update_time?: string
  people_count?: number
  activities_count?: number
  done_activities_count?: number
  undone_activities_count?: number
  files_count?: number
  notes_count?: number
  closed_deals_count?: number
  open_deals_count?: number
  won_deals_count?: number
  lost_deals_count?: number
}

export interface PipedriveActivity {
  id?: number
  subject: string
  type: string
  due_date?: string
  due_time?: string
  duration?: string
  deal_id?: number
  person_id?: number
  org_id?: number
  user_id?: number
  participants?: Array<{
    person_id: number
    primary_flag: boolean
  }>
  busy_flag?: boolean
  attendees?: Array<{
    email_address: string
    is_organizer?: boolean
    name?: string
    person_id?: number
    status?: string
  }>
  done?: 0 | 1
  add_time?: string
  update_time?: string
  marked_as_done_time?: string
  active_flag?: boolean
  note?: string
  public_description?: string
}

export interface PipedriveNote {
  id?: number
  content: string
  deal_id?: number
  person_id?: number
  org_id?: number
  lead_id?: string
  user_id?: number
  add_time?: string
  update_time?: string
  active_flag?: boolean
  pinned_to_deal_flag?: boolean
  pinned_to_person_flag?: boolean
  pinned_to_organization_flag?: boolean
  pinned_to_lead_flag?: boolean
}

export interface PipedriveProduct {
  id?: number
  name: string
  code?: string
  description?: string
  unit?: string
  tax?: number
  category?: string
  active_flag?: boolean
  visible_to?: string
  owner_id?: number
  prices?: Array<{
    id?: number
    product_id?: number
    price?: number
    currency?: string
    cost?: number
    overhead_cost?: number
  }>
  add_time?: string
  update_time?: string
}

export interface PipedrivePipeline {
  id?: number
  name: string
  url_title?: string
  order_nr?: number
  active?: boolean
  deal_probability?: boolean
  add_time?: string
  update_time?: string
  selected?: boolean
}

export interface PipedriveStage {
  id?: number
  name: string
  pipeline_id?: number
  order_nr?: number
  deal_probability?: number
  rotten_flag?: boolean
  rotten_days?: number
  active_flag?: boolean
  add_time?: string
  update_time?: string
}

export interface PipedriveFile {
  id?: number
  name?: string
  file_name?: string
  file_type?: string
  file_size?: number
  deal_id?: number
  person_id?: number
  org_id?: number
  product_id?: number
  activity_id?: number
  lead_id?: string
  user_id?: number
  add_time?: string
  update_time?: string
  url?: string
  active_flag?: boolean
}

export class PipedriveAdapter extends BaseIntegrationAdapter {
  private apiToken?: string
  private companyDomain?: string
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
      maxFileSize: 100 * 1024 * 1024, maxBatchSize: 500, rateLimit: { messages: 100, period: 'per_minute' as const },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.apiToken = this.config.credentials.apiToken
    this.companyDomain = this.config.credentials.companyDomain || 'api.pipedrive.com'
    if (!this.apiToken) {
      return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing API token', retryable: false } }
    }
    this.baseUrl = `https://${this.companyDomain}/v1`
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
        const response = await fetch(`${this.baseUrl}/users/me?api_token=${this.apiToken}`)
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        return await response.json()
      })
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  // ==================== Lead Management ====================

  async createLead(lead: PipedriveLead): Promise<IntegrationResponse<PipedriveLead>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/leads?api_token=${this.apiToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lead),
        })
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getLead(leadId: string): Promise<IntegrationResponse<PipedriveLead>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/leads/${leadId}?api_token=${this.apiToken}`)
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateLead(leadId: string, updates: Partial<PipedriveLead>): Promise<IntegrationResponse<PipedriveLead>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/leads/${leadId}?api_token=${this.apiToken}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteLead(leadId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/leads/${leadId}?api_token=${this.apiToken}`, {
          method: 'DELETE',
        })
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listLeads(params?: { start?: number; limit?: number }): Promise<IntegrationResponse<{ data: PipedriveLead[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams({ api_token: this.apiToken! })
      if (params?.start) query.set('start', params.start.toString())
      if (params?.limit) query.set('limit', params.limit.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/leads?${query}`)
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Person Management ====================

  async createPerson(person: PipedrivePerson): Promise<IntegrationResponse<PipedrivePerson>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/persons?api_token=${this.apiToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(person),
        })
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getPerson(personId: number): Promise<IntegrationResponse<PipedrivePerson>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/persons/${personId}?api_token=${this.apiToken}`)
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updatePerson(personId: number, updates: Partial<PipedrivePerson>): Promise<IntegrationResponse<PipedrivePerson>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/persons/${personId}?api_token=${this.apiToken}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deletePerson(personId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/persons/${personId}?api_token=${this.apiToken}`, {
          method: 'DELETE',
        })
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listPersons(params?: { start?: number; limit?: number }): Promise<IntegrationResponse<{ data: PipedrivePerson[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams({ api_token: this.apiToken! })
      if (params?.start) query.set('start', params.start.toString())
      if (params?.limit) query.set('limit', params.limit.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/persons?${query}`)
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async searchPersons(term: string): Promise<IntegrationResponse<{ data: { items: PipedrivePerson[] } }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams({ api_token: this.apiToken!, term })
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/persons/search?${query}`)
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Deal Management ====================

  async createDeal(deal: PipedriveDeal): Promise<IntegrationResponse<PipedriveDeal>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/deals?api_token=${this.apiToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deal),
        })
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getDeal(dealId: number): Promise<IntegrationResponse<PipedriveDeal>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/deals/${dealId}?api_token=${this.apiToken}`)
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateDeal(dealId: number, updates: Partial<PipedriveDeal>): Promise<IntegrationResponse<PipedriveDeal>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/deals/${dealId}?api_token=${this.apiToken}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        const data = await response.json()
        return data.data
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
        const response = await fetch(`${this.baseUrl}/deals/${dealId}?api_token=${this.apiToken}`, {
          method: 'DELETE',
        })
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listDeals(params?: { start?: number; limit?: number; stage_id?: number; status?: string }): Promise<IntegrationResponse<{ data: PipedriveDeal[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams({ api_token: this.apiToken! })
      if (params?.start) query.set('start', params.start.toString())
      if (params?.limit) query.set('limit', params.limit.toString())
      if (params?.stage_id) query.set('stage_id', params.stage_id.toString())
      if (params?.status) query.set('status', params.status)
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/deals?${query}`, {
          headers: { 'Content-Type': 'application/json' },
        })
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async searchDeals(term: string): Promise<IntegrationResponse<{ data: { items: PipedriveDeal[] } }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams({ api_token: this.apiToken!, term })
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/deals/search?${query}`)
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Organization Management ====================

  async createOrganization(org: PipedriveOrganization): Promise<IntegrationResponse<PipedriveOrganization>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/organizations?api_token=${this.apiToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(org),
        })
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getOrganization(orgId: number): Promise<IntegrationResponse<PipedriveOrganization>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/organizations/${orgId}?api_token=${this.apiToken}`)
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateOrganization(orgId: number, updates: Partial<PipedriveOrganization>): Promise<IntegrationResponse<PipedriveOrganization>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/organizations/${orgId}?api_token=${this.apiToken}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteOrganization(orgId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/organizations/${orgId}?api_token=${this.apiToken}`, {
          method: 'DELETE',
        })
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listOrganizations(params?: { start?: number; limit?: number }): Promise<IntegrationResponse<{ data: PipedriveOrganization[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams({ api_token: this.apiToken! })
      if (params?.start) query.set('start', params.start.toString())
      if (params?.limit) query.set('limit', params.limit.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/organizations?${query}`)
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Activity Management ====================

  async createActivity(activity: PipedriveActivity): Promise<IntegrationResponse<PipedriveActivity>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/activities?api_token=${this.apiToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(activity),
        })
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getActivity(activityId: number): Promise<IntegrationResponse<PipedriveActivity>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/activities/${activityId}?api_token=${this.apiToken}`)
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateActivity(activityId: number, updates: Partial<PipedriveActivity>): Promise<IntegrationResponse<PipedriveActivity>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/activities/${activityId}?api_token=${this.apiToken}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteActivity(activityId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/activities/${activityId}?api_token=${this.apiToken}`, {
          method: 'DELETE',
        })
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Note Management ====================

  async createNote(note: PipedriveNote): Promise<IntegrationResponse<PipedriveNote>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/notes?api_token=${this.apiToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(note),
        })
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getNote(noteId: number): Promise<IntegrationResponse<PipedriveNote>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/notes/${noteId}?api_token=${this.apiToken}`)
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateNote(noteId: number, content: string): Promise<IntegrationResponse<PipedriveNote>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/notes/${noteId}?api_token=${this.apiToken}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        })
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        const data = await response.json()
        return data.data
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
        const response = await fetch(`${this.baseUrl}/notes/${noteId}?api_token=${this.apiToken}`, {
          method: 'DELETE',
        })
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Product Management ====================

  async createProduct(product: PipedriveProduct): Promise<IntegrationResponse<PipedriveProduct>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/products?api_token=${this.apiToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product),
        })
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getProduct(productId: number): Promise<IntegrationResponse<PipedriveProduct>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/products/${productId}?api_token=${this.apiToken}`)
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listProducts(params?: { start?: number; limit?: number }): Promise<IntegrationResponse<{ data: PipedriveProduct[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams({ api_token: this.apiToken! })
      if (params?.start) query.set('start', params.start.toString())
      if (params?.limit) query.set('limit', params.limit.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/products?${query}`)
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ==================== Pipeline & Stage Management ====================

  async listPipelines(): Promise<IntegrationResponse<{ data: PipedrivePipeline[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/pipelines?api_token=${this.apiToken}`)
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getStages(pipelineId: number): Promise<IntegrationResponse<{ data: PipedriveStage[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams({ api_token: this.apiToken!, pipeline_id: pipelineId.toString() })
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/stages?${query}`)
        if (!response.ok) throw new Error(`Pipedrive API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
