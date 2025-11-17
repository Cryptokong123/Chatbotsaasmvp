/**
 * Mailchimp Adapter - Email marketing platform
 *
 * Complete Mailchimp integration with:
 * - Audience/list management
 * - Member (subscriber) management
 * - Campaign creation & management
 * - Automation workflows
 * - Tags and segments
 * - Email templates
 * - Reports and analytics
 * - E-commerce integration
 * - Landing pages
 * - Batch operations
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export interface MailchimpList {
  id?: string
  web_id?: number
  name: string
  contact: {
    company: string
    address1: string
    city: string
    state: string
    zip: string
    country: string
  }
  permission_reminder: string
  campaign_defaults: {
    from_name: string
    from_email: string
    subject: string
    language: string
  }
  email_type_option: boolean
  stats?: {
    member_count?: number
    unsubscribe_count?: number
    cleaned_count?: number
    member_count_since_send?: number
    unsubscribe_count_since_send?: number
    cleaned_count_since_send?: number
    campaign_count?: number
    campaign_last_sent?: string
    merge_field_count?: number
    avg_sub_rate?: number
    avg_unsub_rate?: number
    target_sub_rate?: number
    open_rate?: number
    click_rate?: number
    last_sub_date?: string
    last_unsub_date?: string
  }
}

export interface MailchimpMember {
  id?: string
  email_address: string
  unique_email_id?: string
  email_type?: string
  status: 'subscribed' | 'unsubscribed' | 'cleaned' | 'pending' | 'transactional'
  merge_fields?: Record<string, any>
  interests?: Record<string, boolean>
  stats?: {
    avg_open_rate?: number
    avg_click_rate?: number
  }
  ip_signup?: string
  timestamp_signup?: string
  ip_opt?: string
  timestamp_opt?: string
  member_rating?: number
  last_changed?: string
  language?: string
  vip?: boolean
  email_client?: string
  location?: {
    latitude?: number
    longitude?: number
    gmtoff?: number
    dstoff?: number
    country_code?: string
    timezone?: string
  }
  tags?: Array<{ id?: number; name: string }>
  list_id?: string
}

export interface MailchimpCampaign {
  id?: string
  web_id?: number
  type: 'regular' | 'plaintext' | 'absplit' | 'rss' | 'variate'
  create_time?: string
  archive_url?: string
  status?: 'save' | 'paused' | 'schedule' | 'sending' | 'sent'
  emails_sent?: number
  send_time?: string
  content_type?: 'template' | 'html' | 'url'
  recipients: {
    list_id: string
    list_name?: string
    segment_text?: string
    recipient_count?: number
    segment_opts?: {
      saved_segment_id?: number
      match?: 'any' | 'all'
      conditions?: any[]
    }
  }
  settings: {
    subject_line: string
    preview_text?: string
    title: string
    from_name: string
    reply_to: string
    use_conversation?: boolean
    to_name?: string
    folder_id?: string
    authenticate?: boolean
    auto_footer?: boolean
    inline_css?: boolean
    auto_tweet?: boolean
    fb_comments?: boolean
    timewarp?: boolean
    template_id?: number
    drag_and_drop?: boolean
  }
  tracking?: {
    opens?: boolean
    html_clicks?: boolean
    text_clicks?: boolean
    goal_tracking?: boolean
    ecomm360?: boolean
    google_analytics?: string
    clicktale?: string
  }
  social_card?: {
    image_url?: string
    description?: string
    title?: string
  }
}

export interface MailchimpAutomation {
  id?: string
  create_time?: string
  start_time?: string
  status?: 'save' | 'paused' | 'sending'
  emails_sent?: number
  recipients: {
    list_id: string
    store_id?: string
    segment_opts?: any
  }
  settings: {
    title: string
    from_name: string
    reply_to: string
    use_conversation?: boolean
    to_name?: string
    authenticate?: boolean
    auto_footer?: boolean
    inline_css?: boolean
  }
  tracking?: {
    opens?: boolean
    html_clicks?: boolean
    text_clicks?: boolean
    goal_tracking?: boolean
    ecomm360?: boolean
    google_analytics?: string
  }
  trigger_settings: {
    workflow_type: string
    send_immediately?: boolean
    trigger_on_import?: boolean
    runtime?: {
      days?: string[]
      hours?: {
        type?: 'send_asap' | 'send_between' | 'send_at'
      }
    }
  }
}

export interface MailchimpTemplate {
  id?: number
  type?: string
  name: string
  drag_drop?: boolean
  responsive?: boolean
  category?: string
  date_created?: string
  created_by?: string
  active?: boolean
  folder_id?: string
  thumbnail?: string
  share_url?: string
}

export interface MailchimpSegment {
  id?: number
  name: string
  member_count?: number
  type?: 'saved' | 'static' | 'fuzzy'
  created_at?: string
  updated_at?: string
  options?: {
    match?: 'any' | 'all'
    conditions?: Array<{
      condition_type: string
      field: string
      op: string
      value?: any
      extra?: any
    }>
  }
  list_id?: string
}

export interface MailchimpReport {
  id?: string
  campaign_title?: string
  type?: string
  list_id?: string
  list_name?: string
  subject_line?: string
  emails_sent?: number
  abuse_reports?: number
  unsubscribed?: number
  send_time?: string
  bounces?: {
    hard_bounces?: number
    soft_bounces?: number
    syntax_errors?: number
  }
  forwards?: {
    forwards_count?: number
    forwards_opens?: number
  }
  opens?: {
    opens_total?: number
    unique_opens?: number
    open_rate?: number
    last_open?: string
  }
  clicks?: {
    clicks_total?: number
    unique_clicks?: number
    unique_subscriber_clicks?: number
    click_rate?: number
    last_click?: string
  }
  ecommerce?: {
    total_orders?: number
    total_spent?: number
    total_revenue?: number
  }
}

export interface MailchimpMergeField {
  merge_id?: number
  tag: string
  name: string
  type: 'text' | 'number' | 'address' | 'phone' | 'date' | 'url' | 'imageurl' | 'radio' | 'dropdown' | 'birthday' | 'zip'
  required?: boolean
  default_value?: string
  public?: boolean
  display_order?: number
  options?: {
    default_country?: number
    phone_format?: string
    date_format?: string
    choices?: string[]
    size?: number
  }
  help_text?: string
  list_id?: string
}

export interface MailchimpInterestCategory {
  list_id?: string
  id?: string
  title: string
  display_order?: number
  type: 'checkboxes' | 'dropdown' | 'radio' | 'hidden'
}

export interface MailchimpInterest {
  category_id?: string
  list_id?: string
  id?: string
  name: string
  subscriber_count?: number
  display_order?: number
}

export interface MailchimpMemberActivity {
  action: string
  timestamp: string
  type?: string
  campaign_id?: string
  title?: string
  parent_campaign?: string
}

export interface MailchimpMemberNote {
  id?: number
  created_at?: string
  created_by?: string
  updated_at?: string
  note: string
  list_id?: string
  email_id?: string
}

export interface MailchimpBatchOperation {
  id?: string
  status?: 'pending' | 'preprocessing' | 'started' | 'finalizing' | 'finished'
  total_operations?: number
  finished_operations?: number
  errored_operations?: number
  submitted_at?: string
  completed_at?: string
  response_body_url?: string
}

export interface MailchimpWebhook {
  id?: string
  url: string
  events: {
    subscribe?: boolean
    unsubscribe?: boolean
    profile?: boolean
    cleaned?: boolean
    upemail?: boolean
    campaign?: boolean
  }
  sources: {
    user?: boolean
    admin?: boolean
    api?: boolean
  }
  list_id?: string
}

export interface MailchimpLandingPage {
  id?: string
  name: string
  title?: string
  description?: string
  template_id?: number
  status?: 'published' | 'unpublished' | 'draft'
  list_id?: string
  store_id?: string
  web_id?: number
  created_at?: string
  published_at?: string
  unpublished_at?: string
  updated_at?: string
  url?: string
  tracking?: {
    opens?: boolean
    html_clicks?: boolean
    text_clicks?: boolean
    goal_tracking?: boolean
    ecomm360?: boolean
    google_analytics?: string
  }
}

export interface MailchimpFile {
  id?: number
  folder_id?: number
  type?: string
  name: string
  full_size_url?: string
  thumbnail_url?: string
  size?: number
  created_at?: string
  created_by?: string
}

export interface MailchimpFolder {
  id?: number
  name: string
  file_count?: number
}

export class MailchimpAdapter extends BaseIntegrationAdapter {
  private apiKey?: string
  private serverPrefix?: string
  private baseUrl?: string

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: true,
      canReceiveMessages: false,
      canSendFiles: false,
      canSendImages: true,
      canSendVideo: false,
      canSendAudio: false,
      canSendLocation: false,
      canSendButtons: true,
      canSendCards: false,
      canSendCarousels: false,
      canSendQuickReplies: false,
      canSendTemplates: true,
      canScheduleMessages: true,
      canBroadcast: true,
      canTag: true,
      canAssign: false,
      canCreateTickets: false,
      canCreateLeads: false,
      canCreateContacts: true,
      canSyncContacts: true,
      canSyncConversations: false,
      canSyncTickets: false,
      canExportData: true,
      canImportData: true,
      canTrackEvents: true,
      canTrackMetrics: true,
      canGenerateReports: true,
      canCreateWorkflows: true,
      canTriggerActions: true,
      canListenToWebhooks: true,
      maxMessageLength: 0,
      maxFileSize: 0,
      maxBatchSize: 500,
      rateLimit: { messages: 10, period: 'per_second' as const },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.apiKey = this.config.credentials.apiKey
    if (!this.apiKey) {
      return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing API key', retryable: false } }
    }
    this.serverPrefix = this.apiKey.split('-')[1] || 'us1'
    this.baseUrl = `https://${this.serverPrefix}.api.mailchimp.com/3.0`
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
        const response = await fetch(`${this.baseUrl}/ping`, {
          headers: { 'Authorization': `Bearer ${this.apiKey}` },
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  private getHeaders(): Record<string, string> {
    return { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' }
  }

  // ============================================================================
  // LIST MANAGEMENT
  // ============================================================================

  async createList(list: MailchimpList): Promise<IntegrationResponse<MailchimpList>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(list),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status} ${await response.text()}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateList(listId: string, updates: Partial<MailchimpList>): Promise<IntegrationResponse<MailchimpList>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getList(listId: string): Promise<IntegrationResponse<MailchimpList>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listLists(params?: { count?: number; offset?: number }): Promise<IntegrationResponse<{ lists: MailchimpList[]; total_items: number }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.count) query.set('count', params.count.toString())
      if (params?.offset) query.set('offset', params.offset.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteList(listId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // MEMBER MANAGEMENT
  // ============================================================================

  async addListMember(listId: string, member: MailchimpMember): Promise<IntegrationResponse<MailchimpMember>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}/members`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(member),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status} ${await response.text()}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateListMember(listId: string, subscriberHash: string, updates: Partial<MailchimpMember>): Promise<IntegrationResponse<MailchimpMember>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}/members/${subscriberHash}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getListMember(listId: string, subscriberHash: string): Promise<IntegrationResponse<MailchimpMember>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}/members/${subscriberHash}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteListMember(listId: string, subscriberHash: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}/members/${subscriberHash}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async batchAddMembers(listId: string, members: MailchimpMember[], updateExisting: boolean = false): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            members,
            update_existing: updateExisting,
          }),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // CAMPAIGN MANAGEMENT
  // ============================================================================

  async createCampaign(campaign: MailchimpCampaign): Promise<IntegrationResponse<MailchimpCampaign>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/campaigns`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(campaign),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status} ${await response.text()}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async setCampaignContent(campaignId: string, content: { html?: string; plain_text?: string; template?: { id: number; sections: Record<string, string> } }): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/campaigns/${campaignId}/content`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(content),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async sendCampaign(campaignId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/campaigns/${campaignId}/actions/send`, {
          method: 'POST',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async scheduleCampaign(campaignId: string, scheduleTime: string, timezoneUseSubscriber: boolean = false): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/campaigns/${campaignId}/actions/schedule`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            schedule_time: scheduleTime,
            timewarp: timezoneUseSubscriber,
          }),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getCampaign(campaignId: string): Promise<IntegrationResponse<MailchimpCampaign>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/campaigns/${campaignId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteCampaign(campaignId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/campaigns/${campaignId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // AUTOMATION
  // ============================================================================

  async listAutomations(): Promise<IntegrationResponse<{ automations: MailchimpAutomation[]; total_items: number }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/automations`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getAutomation(workflowId: string): Promise<IntegrationResponse<MailchimpAutomation>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/automations/${workflowId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async pauseAutomation(workflowId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/automations/${workflowId}/actions/pause-all-emails`, {
          method: 'POST',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async startAutomation(workflowId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/automations/${workflowId}/actions/start-all-emails`, {
          method: 'POST',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // REPORTS
  // ============================================================================

  async getCampaignReport(campaignId: string): Promise<IntegrationResponse<MailchimpReport>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/reports/${campaignId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listReports(params?: { count?: number; offset?: number }): Promise<IntegrationResponse<{ reports: MailchimpReport[]; total_items: number }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.count) query.set('count', params.count.toString())
      if (params?.offset) query.set('offset', params.offset.toString())
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/reports${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // TAGS
  // ============================================================================

  async addMemberTags(listId: string, subscriberHash: string, tags: Array<{ name: string; status: 'active' | 'inactive' }>): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}/members/${subscriberHash}/tags`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ tags }),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // SEGMENTS
  // ============================================================================

  async createSegment(listId: string, segment: MailchimpSegment): Promise<IntegrationResponse<MailchimpSegment>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}/segments`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(segment),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listSegments(listId: string): Promise<IntegrationResponse<{ segments: MailchimpSegment[]; total_items: number }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}/segments`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateSegment(listId: string, segmentId: string, updates: Partial<MailchimpSegment>): Promise<IntegrationResponse<MailchimpSegment>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}/segments/${segmentId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteSegment(listId: string, segmentId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}/segments/${segmentId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async addSegmentMember(listId: string, segmentId: string, emailAddress: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}/segments/${segmentId}/members`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ email_address: emailAddress }),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // MERGE FIELDS
  // ============================================================================

  async createMergeField(listId: string, mergeField: MailchimpMergeField): Promise<IntegrationResponse<MailchimpMergeField>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}/merge-fields`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(mergeField),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listMergeFields(listId: string): Promise<IntegrationResponse<{ merge_fields: MailchimpMergeField[]; total_items: number }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}/merge-fields`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateMergeField(listId: string, mergeId: string, updates: Partial<MailchimpMergeField>): Promise<IntegrationResponse<MailchimpMergeField>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}/merge-fields/${mergeId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteMergeField(listId: string, mergeId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}/merge-fields/${mergeId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // INTEREST CATEGORIES
  // ============================================================================

  async createInterestCategory(listId: string, category: MailchimpInterestCategory): Promise<IntegrationResponse<MailchimpInterestCategory>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}/interest-categories`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(category),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listInterestCategories(listId: string): Promise<IntegrationResponse<{ categories: MailchimpInterestCategory[]; total_items: number }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}/interest-categories`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createInterest(listId: string, categoryId: string, interest: MailchimpInterest): Promise<IntegrationResponse<MailchimpInterest>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}/interest-categories/${categoryId}/interests`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(interest),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listInterests(listId: string, categoryId: string): Promise<IntegrationResponse<{ interests: MailchimpInterest[]; total_items: number }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}/interest-categories/${categoryId}/interests`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // MEMBER ACTIVITY & NOTES
  // ============================================================================

  async getMemberActivity(listId: string, subscriberHash: string): Promise<IntegrationResponse<{ activity: MailchimpMemberActivity[]; total_items: number }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}/members/${subscriberHash}/activity`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async addMemberNote(listId: string, subscriberHash: string, note: string): Promise<IntegrationResponse<MailchimpMemberNote>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}/members/${subscriberHash}/notes`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ note }),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listMemberNotes(listId: string, subscriberHash: string): Promise<IntegrationResponse<{ notes: MailchimpMemberNote[]; total_items: number }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}/members/${subscriberHash}/notes`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async searchMembers(query: string, params?: { list_id?: string }): Promise<IntegrationResponse<{ exact_matches: { members: MailchimpMember[] }; full_search: { members: MailchimpMember[] } }>> {
    try {
      await this.ensureConnected()
      const queryParams = new URLSearchParams({ query })
      if (params?.list_id) queryParams.set('list_id', params.list_id)

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/search-members?${queryParams}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // TEMPLATES
  // ============================================================================

  async listTemplates(params?: { count?: number; offset?: number }): Promise<IntegrationResponse<{ templates: MailchimpTemplate[]; total_items: number }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.count) query.set('count', params.count.toString())
      if (params?.offset) query.set('offset', params.offset.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/templates${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getTemplate(templateId: string): Promise<IntegrationResponse<MailchimpTemplate>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/templates/${templateId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteTemplate(templateId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/templates/${templateId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // ADVANCED CAMPAIGN ACTIONS
  // ============================================================================

  async testCampaign(campaignId: string, testEmails: string[], sendType: 'html' | 'plaintext' = 'html'): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/campaigns/${campaignId}/actions/test`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ test_emails: testEmails, send_type: sendType }),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async pauseCampaign(campaignId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/campaigns/${campaignId}/actions/pause`, {
          method: 'POST',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async resumeCampaign(campaignId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/campaigns/${campaignId}/actions/resume`, {
          method: 'POST',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async replicateCampaign(campaignId: string): Promise<IntegrationResponse<MailchimpCampaign>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/campaigns/${campaignId}/actions/replicate`, {
          method: 'POST',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async unscheduleCampaign(campaignId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/campaigns/${campaignId}/actions/unschedule`, {
          method: 'POST',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async cancelCampaign(campaignId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/campaigns/${campaignId}/actions/cancel-send`, {
          method: 'POST',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  async createBatchOperation(operations: any[]): Promise<IntegrationResponse<MailchimpBatchOperation>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/batches`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ operations }),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getBatchOperation(batchId: string): Promise<IntegrationResponse<MailchimpBatchOperation>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/batches/${batchId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listBatchOperations(): Promise<IntegrationResponse<{ batches: MailchimpBatchOperation[]; total_items: number }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/batches`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // WEBHOOKS
  // ============================================================================

  async createWebhook(listId: string, webhook: MailchimpWebhook): Promise<IntegrationResponse<MailchimpWebhook>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}/webhooks`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(webhook),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listWebhooks(listId: string): Promise<IntegrationResponse<{ webhooks: MailchimpWebhook[]; total_items: number }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}/webhooks`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteWebhook(listId: string, webhookId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/lists/${listId}/webhooks/${webhookId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // LANDING PAGES
  // ============================================================================

  async createLandingPage(landingPage: MailchimpLandingPage): Promise<IntegrationResponse<MailchimpLandingPage>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/landing-pages`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(landingPage),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listLandingPages(params?: { count?: number; offset?: number }): Promise<IntegrationResponse<{ landing_pages: MailchimpLandingPage[]; total_items: number }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.count) query.set('count', params.count.toString())
      if (params?.offset) query.set('offset', params.offset.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/landing-pages${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getLandingPage(pageId: string): Promise<IntegrationResponse<MailchimpLandingPage>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/landing-pages/${pageId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async publishLandingPage(pageId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/landing-pages/${pageId}/actions/publish`, {
          method: 'POST',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async unpublishLandingPage(pageId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/landing-pages/${pageId}/actions/unpublish`, {
          method: 'POST',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteLandingPage(pageId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/landing-pages/${pageId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // FILE MANAGER
  // ============================================================================

  async uploadFile(file: { file_data: string; name: string; folder_id?: number }): Promise<IntegrationResponse<MailchimpFile>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/file-manager/files`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(file),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listFiles(params?: { count?: number; offset?: number }): Promise<IntegrationResponse<{ files: MailchimpFile[]; total_items: number }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.count) query.set('count', params.count.toString())
      if (params?.offset) query.set('offset', params.offset.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/file-manager/files${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteFile(fileId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/file-manager/files/${fileId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return undefined
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createFolder(name: string): Promise<IntegrationResponse<MailchimpFolder>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/file-manager/folders`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ name }),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listFolders(): Promise<IntegrationResponse<{ folders: MailchimpFolder[]; total_items: number }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/file-manager/folders`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Mailchimp API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
