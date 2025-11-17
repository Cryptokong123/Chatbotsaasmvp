/**
 * Mailgun Adapter - Transactional email service
 * Comprehensive email delivery, mailing lists, webhooks, analytics, and domain management
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

// Email message interfaces
export interface MailgunMessage {
  from: string
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  text?: string
  html?: string
  template?: string
  'h:X-Mailgun-Variables'?: string
  'v:*'?: Record<string, string>
  'o:tag'?: string | string[]
  'o:campaign'?: string
  'o:deliverytime'?: string
  'o:dkim'?: boolean
  'o:testmode'?: boolean
  'o:tracking'?: boolean
  'o:tracking-clicks'?: boolean | 'htmlonly'
  'o:tracking-opens'?: boolean
  'o:require-tls'?: boolean
  'o:skip-verification'?: boolean
  attachment?: any[]
  inline?: any[]
}

export interface MailgunBatchMessage {
  from: string
  to: string[]
  subject: string
  text?: string
  html?: string
  template?: string
  'recipient-variables'?: Record<string, Record<string, any>>
  'o:tag'?: string | string[]
  'o:tracking'?: boolean
  'o:tracking-clicks'?: boolean | 'htmlonly'
  'o:tracking-opens'?: boolean
}

// Template interfaces
export interface MailgunTemplate {
  name: string
  description?: string
  template: string
  tag?: string
  engine?: 'handlebars' | 'template'
  comment?: string
}

export interface MailgunTemplateVersion {
  tag: string
  template: string
  engine?: 'handlebars' | 'template'
  comment?: string
  active?: boolean
}

// Mailing list interfaces
export interface MailgunMailingList {
  address: string
  name?: string
  description?: string
  access_level?: 'readonly' | 'members' | 'everyone'
  reply_preference?: 'list' | 'sender'
  created_at?: string
  members_count?: number
}

export interface MailgunMailingListMember {
  address: string
  name?: string
  vars?: Record<string, any>
  subscribed?: boolean
}

// Domain interfaces
export interface MailgunDomain {
  name: string
  smtp_login?: string
  smtp_password?: string
  spam_action?: 'disabled' | 'block' | 'tag'
  wildcard?: boolean
  force_dkim_authority?: boolean
  dkim_key_size?: 1024 | 2048
  ips?: string[]
  web_scheme?: 'http' | 'https'
  state?: string
  created_at?: string
  require_tls?: boolean
  skip_verification?: boolean
  type?: 'custom' | 'sandbox'
}

export interface MailgunDKIMSelector {
  dkim_key: string
}

export interface MailgunDomainConnection {
  require_tls: boolean
  skip_verification: boolean
}

export interface MailgunDomainTracking {
  active: boolean
  html_only: boolean
}

export interface MailgunWebPrefix {
  web_prefix: string
}

// IP interfaces
export interface MailgunIP {
  ip: string
  dedicated: boolean
  rdns?: string
}

// Webhook interfaces
export interface MailgunWebhook {
  urls: string[]
}

// Event interfaces
export interface MailgunEvent {
  event: string
  id: string
  timestamp: number
  recipient?: string
  message?: {
    headers: {
      'message-id': string
      to: string
      from: string
      subject: string
    }
  }
  tags?: string[]
  'user-variables'?: Record<string, any>
  storage?: {
    url: string
    key: string
  }
}

// Route interfaces
export interface MailgunRoute {
  priority?: number
  description?: string
  expression: string
  actions: string[]
}

// Suppression interfaces
export interface MailgunSuppression {
  address: string
  created_at?: string
  reason?: string
  error?: string
  code?: string
  tag?: string
}

export interface MailgunBounce extends MailgunSuppression {
  error?: string
  code?: string
}

export interface MailgunUnsubscribe extends MailgunSuppression {
  tag?: string
}

export interface MailgunComplaint extends MailgunSuppression {
  // Spam complaint specific fields
}

export interface MailgunWhitelist {
  value: string
  reason?: string
  type: 'address' | 'domain'
  created_at?: string
}

// Statistics interfaces
export interface MailgunStats {
  start: string
  end: string
  resolution: 'hour' | 'day' | 'month'
  stats: Array<{
    time: string
    accepted?: {
      incoming?: number
      outgoing?: number
      total?: number
    }
    delivered?: {
      smtp?: number
      http?: number
      total?: number
    }
    failed?: {
      permanent?: {
        suppress_bounce?: number
        suppress_unsubscribe?: number
        suppress_complaint?: number
        bounce?: number
        delayed_bounce?: number
        total?: number
      }
      temporary?: {
        espblock?: number
        total?: number
      }
    }
    opened?: {
      total?: number
      unique?: number
    }
    clicked?: {
      total?: number
      unique?: number
    }
    unsubscribed?: {
      total?: number
      unique?: number
    }
    complained?: {
      total?: number
      unique?: number
    }
    stored?: {
      total?: number
    }
  }>
}

export interface MailgunTag {
  tag: string
  description?: string
  first_seen?: string
  last_seen?: string
}

export interface MailgunTagStats {
  tag: string
  start: string
  end: string
  resolution: 'hour' | 'day' | 'month'
  stats: Array<{
    time: string
    accepted?: number
    delivered?: number
    failed?: number
    opened?: number
    clicked?: number
    unsubscribed?: number
    complained?: number
    stored?: number
  }>
}

export class MailgunAdapter extends BaseIntegrationAdapter {
  private apiKey?: string
  private domain?: string
  private baseUrl?: string
  private region?: 'us' | 'eu'

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: true, canReceiveMessages: true, canSendFiles: true, canSendImages: true,
      canSendVideo: false, canSendAudio: false, canSendLocation: false, canSendButtons: false,
      canSendCards: false, canSendCarousels: false, canSendQuickReplies: false, canSendTemplates: true,
      canScheduleMessages: true, canBroadcast: true, canTag: true, canAssign: false,
      canCreateTickets: false, canCreateLeads: false, canCreateContacts: true, canSyncContacts: true,
      canSyncConversations: false, canSyncTickets: false, canExportData: true, canImportData: true,
      canTrackEvents: true, canTrackMetrics: true, canGenerateReports: true, canCreateWorkflows: false,
      canTriggerActions: true, canListenToWebhooks: true, maxMessageLength: 0,
      maxFileSize: 25 * 1024 * 1024, maxBatchSize: 1000, rateLimit: { messages: 1000, period: 'per_hour' as const },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.apiKey = this.config.credentials.apiKey
    this.domain = this.config.credentials.domain
    this.region = (this.config.credentials.region as 'us' | 'eu') || 'us'
    if (!this.apiKey || !this.domain) {
      return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing credentials', retryable: false } }
    }
    this.baseUrl = this.region === 'eu' ? 'https://api.eu.mailgun.net/v3' : 'https://api.mailgun.net/v3'
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
      const result = await this.getDomain()
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  private getHeaders(): Record<string, string> {
    const credentials = Buffer.from(`api:${this.apiKey}`).toString('base64')
    return { 'Authorization': `Basic ${credentials}` }
  }

  private async makeMailgunRequest(endpoint: string, options: RequestInit = {}): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: {
            ...this.getHeaders(),
            ...options.headers,
          },
        })
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Mailgun API error: ${response.status} - ${errorText}`)
        }
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============ Email Sending ============

  async sendEmail(message: MailgunMessage): Promise<IntegrationResponse<{ id: string; message: string }>> {
    const formData = new FormData()
    Object.entries(message).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => formData.append(key, v.toString()))
        } else {
          formData.append(key, value.toString())
        }
      }
    })

    return this.makeMailgunRequest(`/${this.domain}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData as any,
    })
  }

  async sendBatchEmail(message: MailgunBatchMessage): Promise<IntegrationResponse<{ id: string; message: string }>> {
    const formData = new FormData()
    Object.entries(message).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'recipient-variables') {
          formData.append(key, JSON.stringify(value))
        } else if (Array.isArray(value)) {
          value.forEach(v => formData.append(key, v.toString()))
        } else {
          formData.append(key, value.toString())
        }
      }
    })

    return this.makeMailgunRequest(`/${this.domain}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData as any,
    })
  }

  async sendMIMEEmail(params: { to: string | string[]; message: string }): Promise<IntegrationResponse<{ id: string; message: string }>> {
    const formData = new FormData()
    const toAddresses = Array.isArray(params.to) ? params.to : [params.to]
    toAddresses.forEach(to => formData.append('to', to))
    formData.append('message', params.message)

    return this.makeMailgunRequest(`/${this.domain}/messages.mime`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData as any,
    })
  }

  // ============ Template Management ============

  async listTemplates(params?: { limit?: number; page?: string }): Promise<IntegrationResponse<{ items: MailgunTemplate[]; paging: any }>> {
    const query = new URLSearchParams()
    if (params?.limit) query.set('limit', params.limit.toString())
    if (params?.page) query.set('page', params.page)

    return this.makeMailgunRequest(`/${this.domain}/templates${query.toString() ? `?${query}` : ''}`)
  }

  async getTemplate(templateName: string): Promise<IntegrationResponse<MailgunTemplate>> {
    return this.makeMailgunRequest(`/${this.domain}/templates/${templateName}`)
  }

  async createTemplate(template: MailgunTemplate): Promise<IntegrationResponse<MailgunTemplate>> {
    const formData = new FormData()
    Object.entries(template).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, value.toString())
    })

    return this.makeMailgunRequest(`/${this.domain}/templates`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData as any,
    })
  }

  async updateTemplate(templateName: string, updates: Partial<MailgunTemplate>): Promise<IntegrationResponse<MailgunTemplate>> {
    const formData = new FormData()
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, value.toString())
    })

    return this.makeMailgunRequest(`/${this.domain}/templates/${templateName}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: formData as any,
    })
  }

  async deleteTemplate(templateName: string): Promise<IntegrationResponse<{ message: string }>> {
    return this.makeMailgunRequest(`/${this.domain}/templates/${templateName}`, {
      method: 'DELETE',
    })
  }

  async listTemplateVersions(templateName: string, params?: { limit?: number; page?: string }): Promise<IntegrationResponse<{ items: MailgunTemplateVersion[]; paging: any }>> {
    const query = new URLSearchParams()
    if (params?.limit) query.set('limit', params.limit.toString())
    if (params?.page) query.set('page', params.page)

    return this.makeMailgunRequest(`/${this.domain}/templates/${templateName}/versions${query.toString() ? `?${query}` : ''}`)
  }

  async getTemplateVersion(templateName: string, tag: string): Promise<IntegrationResponse<MailgunTemplateVersion>> {
    return this.makeMailgunRequest(`/${this.domain}/templates/${templateName}/versions/${tag}`)
  }

  async createTemplateVersion(templateName: string, version: MailgunTemplateVersion): Promise<IntegrationResponse<MailgunTemplateVersion>> {
    const formData = new FormData()
    Object.entries(version).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, value.toString())
    })

    return this.makeMailgunRequest(`/${this.domain}/templates/${templateName}/versions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData as any,
    })
  }

  async updateTemplateVersion(templateName: string, tag: string, updates: Partial<MailgunTemplateVersion>): Promise<IntegrationResponse<MailgunTemplateVersion>> {
    const formData = new FormData()
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, value.toString())
    })

    return this.makeMailgunRequest(`/${this.domain}/templates/${templateName}/versions/${tag}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: formData as any,
    })
  }

  async deleteTemplateVersion(templateName: string, tag: string): Promise<IntegrationResponse<{ message: string }>> {
    return this.makeMailgunRequest(`/${this.domain}/templates/${templateName}/versions/${tag}`, {
      method: 'DELETE',
    })
  }

  // ============ Mailing List Management ============

  async listMailingLists(params?: { limit?: number; skip?: number; address?: string }): Promise<IntegrationResponse<{ items: MailgunMailingList[]; total_count: number }>> {
    const query = new URLSearchParams()
    if (params?.limit) query.set('limit', params.limit.toString())
    if (params?.skip) query.set('skip', params.skip.toString())
    if (params?.address) query.set('address', params.address)

    return this.makeMailgunRequest(`/lists/pages${query.toString() ? `?${query}` : ''}`)
  }

  async getMailingList(address: string): Promise<IntegrationResponse<MailgunMailingList>> {
    return this.makeMailgunRequest(`/lists/${address}`)
  }

  async createMailingList(list: MailgunMailingList): Promise<IntegrationResponse<MailgunMailingList>> {
    const formData = new FormData()
    Object.entries(list).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, value.toString())
    })

    return this.makeMailgunRequest('/lists', {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData as any,
    })
  }

  async updateMailingList(address: string, updates: Partial<MailgunMailingList>): Promise<IntegrationResponse<MailgunMailingList>> {
    const formData = new FormData()
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, value.toString())
    })

    return this.makeMailgunRequest(`/lists/${address}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: formData as any,
    })
  }

  async deleteMailingList(address: string): Promise<IntegrationResponse<{ message: string }>> {
    return this.makeMailgunRequest(`/lists/${address}`, {
      method: 'DELETE',
    })
  }

  async listMailingListMembers(address: string, params?: { subscribed?: boolean; limit?: number; skip?: number }): Promise<IntegrationResponse<{ items: MailgunMailingListMember[]; total_count: number }>> {
    const query = new URLSearchParams()
    if (params?.subscribed !== undefined) query.set('subscribed', params.subscribed.toString())
    if (params?.limit) query.set('limit', params.limit.toString())
    if (params?.skip) query.set('skip', params.skip.toString())

    return this.makeMailgunRequest(`/lists/${address}/members/pages${query.toString() ? `?${query}` : ''}`)
  }

  async getMailingListMember(address: string, memberAddress: string): Promise<IntegrationResponse<MailgunMailingListMember>> {
    return this.makeMailgunRequest(`/lists/${address}/members/${memberAddress}`)
  }

  async addMailingListMember(address: string, member: MailgunMailingListMember): Promise<IntegrationResponse<MailgunMailingListMember>> {
    const formData = new FormData()
    formData.append('address', member.address)
    if (member.name) formData.append('name', member.name)
    if (member.vars) formData.append('vars', JSON.stringify(member.vars))
    if (member.subscribed !== undefined) formData.append('subscribed', member.subscribed.toString())

    return this.makeMailgunRequest(`/lists/${address}/members`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData as any,
    })
  }

  async updateMailingListMember(address: string, memberAddress: string, updates: Partial<MailgunMailingListMember>): Promise<IntegrationResponse<MailgunMailingListMember>> {
    const formData = new FormData()
    if (updates.name) formData.append('name', updates.name)
    if (updates.vars) formData.append('vars', JSON.stringify(updates.vars))
    if (updates.subscribed !== undefined) formData.append('subscribed', updates.subscribed.toString())

    return this.makeMailgunRequest(`/lists/${address}/members/${memberAddress}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: formData as any,
    })
  }

  async deleteMailingListMember(address: string, memberAddress: string): Promise<IntegrationResponse<{ message: string }>> {
    return this.makeMailgunRequest(`/lists/${address}/members/${memberAddress}`, {
      method: 'DELETE',
    })
  }

  async bulkAddMailingListMembers(address: string, members: MailgunMailingListMember[], upsert?: boolean): Promise<IntegrationResponse<{ message: string }>> {
    const formData = new FormData()
    formData.append('members', JSON.stringify(members))
    if (upsert !== undefined) formData.append('upsert', upsert.toString())

    return this.makeMailgunRequest(`/lists/${address}/members.json`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData as any,
    })
  }

  // ============ Domain Management ============

  async listDomains(params?: { limit?: number; skip?: number }): Promise<IntegrationResponse<{ items: MailgunDomain[]; total_count: number }>> {
    const query = new URLSearchParams()
    if (params?.limit) query.set('limit', params.limit.toString())
    if (params?.skip) query.set('skip', params.skip.toString())

    return this.makeMailgunRequest(`/domains${query.toString() ? `?${query}` : ''}`)
  }

  async getDomain(): Promise<IntegrationResponse<MailgunDomain>> {
    return this.makeMailgunRequest(`/domains/${this.domain}`)
  }

  async createDomain(domain: Partial<MailgunDomain>): Promise<IntegrationResponse<MailgunDomain>> {
    const formData = new FormData()
    Object.entries(domain).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => formData.append(key, v.toString()))
        } else {
          formData.append(key, value.toString())
        }
      }
    })

    return this.makeMailgunRequest('/domains', {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData as any,
    })
  }

  async deleteDomain(domainName: string): Promise<IntegrationResponse<{ message: string }>> {
    return this.makeMailgunRequest(`/domains/${domainName}`, {
      method: 'DELETE',
    })
  }

  async verifyDomain(domainName: string): Promise<IntegrationResponse<any>> {
    return this.makeMailgunRequest(`/domains/${domainName}/verify`, {
      method: 'PUT',
    })
  }

  async getDomainConnection(domainName: string): Promise<IntegrationResponse<MailgunDomainConnection>> {
    return this.makeMailgunRequest(`/domains/${domainName}/connection`)
  }

  async updateDomainConnection(domainName: string, connection: Partial<MailgunDomainConnection>): Promise<IntegrationResponse<MailgunDomainConnection>> {
    const formData = new FormData()
    if (connection.require_tls !== undefined) formData.append('require_tls', connection.require_tls.toString())
    if (connection.skip_verification !== undefined) formData.append('skip_verification', connection.skip_verification.toString())

    return this.makeMailgunRequest(`/domains/${domainName}/connection`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: formData as any,
    })
  }

  async getDomainTracking(domainName: string): Promise<IntegrationResponse<{ click: MailgunDomainTracking; open: MailgunDomainTracking; unsubscribe: MailgunDomainTracking }>> {
    return this.makeMailgunRequest(`/domains/${domainName}/tracking`)
  }

  async updateDomainClickTracking(domainName: string, active: boolean): Promise<IntegrationResponse<MailgunDomainTracking>> {
    const formData = new FormData()
    formData.append('active', active.toString())

    return this.makeMailgunRequest(`/domains/${domainName}/tracking/click`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: formData as any,
    })
  }

  async updateDomainOpenTracking(domainName: string, active: boolean): Promise<IntegrationResponse<MailgunDomainTracking>> {
    const formData = new FormData()
    formData.append('active', active.toString())

    return this.makeMailgunRequest(`/domains/${domainName}/tracking/open`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: formData as any,
    })
  }

  async updateDomainUnsubscribeTracking(domainName: string, active: boolean, htmlFooter?: string, textFooter?: string): Promise<IntegrationResponse<MailgunDomainTracking>> {
    const formData = new FormData()
    formData.append('active', active.toString())
    if (htmlFooter) formData.append('html_footer', htmlFooter)
    if (textFooter) formData.append('text_footer', textFooter)

    return this.makeMailgunRequest(`/domains/${domainName}/tracking/unsubscribe`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: formData as any,
    })
  }

  async getDKIMSelector(domainName: string): Promise<IntegrationResponse<MailgunDKIMSelector>> {
    return this.makeMailgunRequest(`/domains/${domainName}/dkim_selector`)
  }

  async updateDKIMSelector(domainName: string, dkim_key: string): Promise<IntegrationResponse<{ message: string }>> {
    const formData = new FormData()
    formData.append('dkim_key', dkim_key)

    return this.makeMailgunRequest(`/domains/${domainName}/dkim_selector`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: formData as any,
    })
  }

  async getWebPrefix(domainName: string): Promise<IntegrationResponse<MailgunWebPrefix>> {
    return this.makeMailgunRequest(`/domains/${domainName}/web_prefix`)
  }

  async updateWebPrefix(domainName: string, web_prefix: string): Promise<IntegrationResponse<{ message: string }>> {
    const formData = new FormData()
    formData.append('web_prefix', web_prefix)

    return this.makeMailgunRequest(`/domains/${domainName}/web_prefix`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: formData as any,
    })
  }

  // ============ IP Management ============

  async listIPs(): Promise<IntegrationResponse<{ items: MailgunIP[]; total_count: number }>> {
    return this.makeMailgunRequest('/ips')
  }

  async getIP(ip: string): Promise<IntegrationResponse<MailgunIP>> {
    return this.makeMailgunRequest(`/ips/${ip}`)
  }

  async listDomainIPs(domainName: string): Promise<IntegrationResponse<{ items: string[]; total_count: number }>> {
    return this.makeMailgunRequest(`/domains/${domainName}/ips`)
  }

  async assignIPToDomain(domainName: string, ip: string): Promise<IntegrationResponse<{ message: string }>> {
    const formData = new FormData()
    formData.append('ip', ip)

    return this.makeMailgunRequest(`/domains/${domainName}/ips`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData as any,
    })
  }

  async unassignIPFromDomain(domainName: string, ip: string): Promise<IntegrationResponse<{ message: string }>> {
    return this.makeMailgunRequest(`/domains/${domainName}/ips/${ip}`, {
      method: 'DELETE',
    })
  }

  // ============ Webhook Management ============

  async listWebhooks(domainName: string): Promise<IntegrationResponse<{ webhooks: Record<string, MailgunWebhook> }>> {
    return this.makeMailgunRequest(`/domains/${domainName}/webhooks`)
  }

  async getWebhook(domainName: string, webhookName: string): Promise<IntegrationResponse<MailgunWebhook>> {
    return this.makeMailgunRequest(`/domains/${domainName}/webhooks/${webhookName}`)
  }

  async createWebhook(domainName: string, webhookName: string, url: string | string[]): Promise<IntegrationResponse<MailgunWebhook>> {
    const formData = new FormData()
    const urls = Array.isArray(url) ? url : [url]
    urls.forEach(u => formData.append('url', u))

    return this.makeMailgunRequest(`/domains/${domainName}/webhooks`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData as any,
    })
  }

  async updateWebhook(domainName: string, webhookName: string, url: string | string[]): Promise<IntegrationResponse<MailgunWebhook>> {
    const formData = new FormData()
    const urls = Array.isArray(url) ? url : [url]
    urls.forEach(u => formData.append('url', u))

    return this.makeMailgunRequest(`/domains/${domainName}/webhooks/${webhookName}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: formData as any,
    })
  }

  async deleteWebhook(domainName: string, webhookName: string): Promise<IntegrationResponse<{ message: string }>> {
    return this.makeMailgunRequest(`/domains/${domainName}/webhooks/${webhookName}`, {
      method: 'DELETE',
    })
  }

  // ============ Event Retrieval ============

  async getEvents(params?: {
    begin?: string
    end?: string
    ascending?: boolean
    limit?: number
    event?: string
    attachment?: string
    from?: string
    'message-id'?: string
    subject?: string
    to?: string
    size?: string
    recipient?: string
    tags?: string
    severity?: string
  }): Promise<IntegrationResponse<{ items: MailgunEvent[]; paging: any }>> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.set(key, value.toString())
      })
    }

    return this.makeMailgunRequest(`/${this.domain}/events${query.toString() ? `?${query}` : ''}`)
  }

  // ============ Statistics ============

  async getStats(params?: { event?: string; start?: string; end?: string; resolution?: 'hour' | 'day' | 'month'; duration?: string }): Promise<IntegrationResponse<MailgunStats>> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.set(key, value.toString())
      })
    }

    return this.makeMailgunRequest(`/${this.domain}/stats/total${query.toString() ? `?${query}` : ''}`)
  }

  async getTags(params?: { limit?: number }): Promise<IntegrationResponse<{ items: MailgunTag[]; paging: any }>> {
    const query = new URLSearchParams()
    if (params?.limit) query.set('limit', params.limit.toString())

    return this.makeMailgunRequest(`/${this.domain}/tags${query.toString() ? `?${query}` : ''}`)
  }

  async getTag(tag: string): Promise<IntegrationResponse<MailgunTag>> {
    return this.makeMailgunRequest(`/${this.domain}/tags/${tag}`)
  }

  async updateTag(tag: string, description: string): Promise<IntegrationResponse<{ message: string }>> {
    const formData = new FormData()
    formData.append('description', description)

    return this.makeMailgunRequest(`/${this.domain}/tags/${tag}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: formData as any,
    })
  }

  async getTagStats(tag: string, params?: { event?: string; start?: string; end?: string; resolution?: 'hour' | 'day' | 'month'; duration?: string }): Promise<IntegrationResponse<MailgunTagStats>> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.set(key, value.toString())
      })
    }

    return this.makeMailgunRequest(`/${this.domain}/tags/${tag}/stats${query.toString() ? `?${query}` : ''}`)
  }

  async deleteTag(tag: string): Promise<IntegrationResponse<{ message: string }>> {
    return this.makeMailgunRequest(`/${this.domain}/tags/${tag}`, {
      method: 'DELETE',
    })
  }

  // ============ Suppressions (Bounces, Unsubscribes, Complaints) ============

  async getBounces(params?: { limit?: number }): Promise<IntegrationResponse<{ items: MailgunBounce[]; paging: any }>> {
    const query = new URLSearchParams()
    if (params?.limit) query.set('limit', params.limit.toString())

    return this.makeMailgunRequest(`/${this.domain}/bounces${query.toString() ? `?${query}` : ''}`)
  }

  async getBounce(address: string): Promise<IntegrationResponse<MailgunBounce>> {
    return this.makeMailgunRequest(`/${this.domain}/bounces/${address}`)
  }

  async addBounce(bounce: MailgunBounce): Promise<IntegrationResponse<{ message: string }>> {
    const formData = new FormData()
    formData.append('address', bounce.address)
    if (bounce.code) formData.append('code', bounce.code)
    if (bounce.error) formData.append('error', bounce.error)

    return this.makeMailgunRequest(`/${this.domain}/bounces`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData as any,
    })
  }

  async deleteBounce(address: string): Promise<IntegrationResponse<{ message: string }>> {
    return this.makeMailgunRequest(`/${this.domain}/bounces/${address}`, {
      method: 'DELETE',
    })
  }

  async deleteAllBounces(): Promise<IntegrationResponse<{ message: string }>> {
    return this.makeMailgunRequest(`/${this.domain}/bounces`, {
      method: 'DELETE',
    })
  }

  async getUnsubscribes(params?: { limit?: number }): Promise<IntegrationResponse<{ items: MailgunUnsubscribe[]; paging: any }>> {
    const query = new URLSearchParams()
    if (params?.limit) query.set('limit', params.limit.toString())

    return this.makeMailgunRequest(`/${this.domain}/unsubscribes${query.toString() ? `?${query}` : ''}`)
  }

  async getUnsubscribe(address: string): Promise<IntegrationResponse<MailgunUnsubscribe>> {
    return this.makeMailgunRequest(`/${this.domain}/unsubscribes/${address}`)
  }

  async addUnsubscribe(unsubscribe: MailgunUnsubscribe): Promise<IntegrationResponse<{ message: string }>> {
    const formData = new FormData()
    formData.append('address', unsubscribe.address)
    if (unsubscribe.tag) formData.append('tag', unsubscribe.tag)

    return this.makeMailgunRequest(`/${this.domain}/unsubscribes`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData as any,
    })
  }

  async deleteUnsubscribe(address: string): Promise<IntegrationResponse<{ message: string }>> {
    return this.makeMailgunRequest(`/${this.domain}/unsubscribes/${address}`, {
      method: 'DELETE',
    })
  }

  async getComplaints(params?: { limit?: number }): Promise<IntegrationResponse<{ items: MailgunComplaint[]; paging: any }>> {
    const query = new URLSearchParams()
    if (params?.limit) query.set('limit', params.limit.toString())

    return this.makeMailgunRequest(`/${this.domain}/complaints${query.toString() ? `?${query}` : ''}`)
  }

  async getComplaint(address: string): Promise<IntegrationResponse<MailgunComplaint>> {
    return this.makeMailgunRequest(`/${this.domain}/complaints/${address}`)
  }

  async addComplaint(address: string): Promise<IntegrationResponse<{ message: string }>> {
    const formData = new FormData()
    formData.append('address', address)

    return this.makeMailgunRequest(`/${this.domain}/complaints`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData as any,
    })
  }

  async deleteComplaint(address: string): Promise<IntegrationResponse<{ message: string }>> {
    return this.makeMailgunRequest(`/${this.domain}/complaints/${address}`, {
      method: 'DELETE',
    })
  }

  async getWhitelists(params?: { limit?: number }): Promise<IntegrationResponse<{ items: MailgunWhitelist[]; paging: any }>> {
    const query = new URLSearchParams()
    if (params?.limit) query.set('limit', params.limit.toString())

    return this.makeMailgunRequest(`/${this.domain}/whitelists${query.toString() ? `?${query}` : ''}`)
  }

  async getWhitelist(address: string): Promise<IntegrationResponse<MailgunWhitelist>> {
    return this.makeMailgunRequest(`/${this.domain}/whitelists/${address}`)
  }

  async addWhitelist(whitelist: MailgunWhitelist): Promise<IntegrationResponse<{ message: string; type: string; value: string }>> {
    const formData = new FormData()
    formData.append('address', whitelist.value)
    if (whitelist.reason) formData.append('reason', whitelist.reason)

    return this.makeMailgunRequest(`/${this.domain}/whitelists`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData as any,
    })
  }

  async deleteWhitelist(address: string): Promise<IntegrationResponse<{ message: string }>> {
    return this.makeMailgunRequest(`/${this.domain}/whitelists/${address}`, {
      method: 'DELETE',
    })
  }

  // ============ Routes ============

  async listRoutes(params?: { limit?: number; skip?: number }): Promise<IntegrationResponse<{ items: MailgunRoute[]; total_count: number }>> {
    const query = new URLSearchParams()
    if (params?.limit) query.set('limit', params.limit.toString())
    if (params?.skip) query.set('skip', params.skip.toString())

    return this.makeMailgunRequest(`/routes${query.toString() ? `?${query}` : ''}`)
  }

  async getRoute(routeId: string): Promise<IntegrationResponse<MailgunRoute>> {
    return this.makeMailgunRequest(`/routes/${routeId}`)
  }

  async createRoute(route: MailgunRoute): Promise<IntegrationResponse<MailgunRoute>> {
    const formData = new FormData()
    if (route.priority !== undefined) formData.append('priority', route.priority.toString())
    if (route.description) formData.append('description', route.description)
    formData.append('expression', route.expression)
    route.actions.forEach(action => formData.append('action', action))

    return this.makeMailgunRequest('/routes', {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData as any,
    })
  }

  async updateRoute(routeId: string, updates: Partial<MailgunRoute>): Promise<IntegrationResponse<MailgunRoute>> {
    const formData = new FormData()
    if (updates.priority !== undefined) formData.append('priority', updates.priority.toString())
    if (updates.description) formData.append('description', updates.description)
    if (updates.expression) formData.append('expression', updates.expression)
    if (updates.actions) updates.actions.forEach(action => formData.append('action', action))

    return this.makeMailgunRequest(`/routes/${routeId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: formData as any,
    })
  }

  async deleteRoute(routeId: string): Promise<IntegrationResponse<{ message: string }>> {
    return this.makeMailgunRequest(`/routes/${routeId}`, {
      method: 'DELETE',
    })
  }
}
