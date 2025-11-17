/**
 * Zoho Desk Adapter - Help desk software
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export interface ZohoDeskTicket {
  id?: string
  ticketNumber?: string
  subject: string
  description?: string
  status?: string
  priority?: 'Low' | 'Medium' | 'High'
  departmentId?: string
  contactId?: string
  assigneeId?: string
  channel?: 'Email' | 'Phone' | 'Web' | 'Chat' | 'Twitter' | 'Facebook'
  classification?: string
  category?: string
  subCategory?: string
  dueDate?: string
  closedTime?: string
  customFields?: Record<string, any>
  cf?: Record<string, any>
  createdTime?: string
  modifiedTime?: string
  productId?: string
  teamId?: string
  webUrl?: string
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
  title?: string
  city?: string
  state?: string
  country?: string
  zip?: string
  street?: string
  customFields?: Record<string, any>
  createdTime?: string
  modifiedTime?: string
}

export interface ZohoDeskAccount {
  id?: string
  accountName: string
  email?: string
  website?: string
  phone?: string
  description?: string
  industry?: string
  city?: string
  state?: string
  country?: string
  customFields?: Record<string, any>
  createdTime?: string
  modifiedTime?: string
}

export interface ZohoDeskAgent {
  id?: string
  firstName?: string
  lastName?: string
  email?: string
  roleId?: string
  departmentIds?: string[]
  profileId?: string
  status?: 'ACTIVE' | 'INACTIVE'
  photoURL?: string
  createdTime?: string
}

export interface ZohoDeskDepartment {
  id?: string
  name: string
  description?: string
  isDefault?: boolean
  createdTime?: string
}

export interface ZohoDeskThread {
  id?: string
  direction?: 'in' | 'out'
  channel?: string
  summary?: string
  content?: string
  contentType?: 'html' | 'plainText'
  from?: string
  to?: string
  cc?: string
  bcc?: string
  isForward?: boolean
  createdTime?: string
  attachments?: ZohoDeskAttachment[]
}

export interface ZohoDeskAttachment {
  id?: string
  name: string
  size?: number
  href?: string
  createdTime?: string
}

export interface ZohoDeskComment {
  id?: string
  content: string
  contentType?: 'html' | 'plainText'
  isPublic?: boolean
  creatorId?: string
  createdTime?: string
  attachments?: ZohoDeskAttachment[]
}

export interface ZohoDeskTask {
  id?: string
  subject: string
  description?: string
  status?: 'Open' | 'In Progress' | 'Completed'
  priority?: 'Low' | 'Medium' | 'High'
  dueDate?: string
  completedDate?: string
  ownerId?: string
  ticketId?: string
  createdTime?: string
}

export interface ZohoDeskArticle {
  id?: string
  title: string
  answer?: string
  categoryId?: string
  status?: 'Draft' | 'Published' | 'Archived'
  viewCount?: number
  likeCount?: number
  dislikeCount?: number
  createdTime?: string
  modifiedTime?: string
  author?: { id: string; name: string }
}

export interface ZohoDeskProduct {
  id?: string
  productName: string
  description?: string
  departmentId?: string
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
      const result = await this.listDepartments()
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  private getHeaders(): Record<string, string> {
    return { 'Authorization': `Zoho-oauthtoken ${this.accessToken}`, 'orgId': this.orgId!, 'Content-Type': 'application/json' }
  }

  // ===========================
  // Tickets
  // ===========================

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

  async getTicket(ticketId: string): Promise<IntegrationResponse<ZohoDeskTicket>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}`, {
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

  async updateTicket(ticketId: string, ticket: Partial<ZohoDeskTicket>): Promise<IntegrationResponse<ZohoDeskTicket>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}`, {
          method: 'PATCH',
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

  async deleteTicket(ticketId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Zoho Desk API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listTickets(params?: { limit?: number; from?: number; status?: string; departmentId?: string }): Promise<IntegrationResponse<{ data: ZohoDeskTicket[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.limit) query.set('limit', params.limit.toString())
      if (params?.from) query.set('from', params.from.toString())
      if (params?.status) query.set('status', params.status)
      if (params?.departmentId) query.set('departmentId', params.departmentId)

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

  async searchTickets(searchStr: string): Promise<IntegrationResponse<{ data: ZohoDeskTicket[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/search?searchStr=${encodeURIComponent(searchStr)}`, {
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

  async moveTicketToTrash(ticketId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}/moveToTrash`, {
          method: 'POST',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Zoho Desk API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Threads
  // ===========================

  async getTicketThreads(ticketId: string): Promise<IntegrationResponse<{ data: ZohoDeskThread[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}/threads`, {
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

  async addTicketThread(ticketId: string, thread: Partial<ZohoDeskThread>): Promise<IntegrationResponse<ZohoDeskThread>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}/threads`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(thread),
        })
        if (!response.ok) throw new Error(`Zoho Desk API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Comments
  // ===========================

  async addComment(ticketId: string, comment: ZohoDeskComment): Promise<IntegrationResponse<ZohoDeskComment>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}/comments`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(comment),
        })
        if (!response.ok) throw new Error(`Zoho Desk API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getComments(ticketId: string): Promise<IntegrationResponse<{ data: ZohoDeskComment[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tickets/${ticketId}/comments`, {
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

  // ===========================
  // Contacts
  // ===========================

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

  async getContact(contactId: string): Promise<IntegrationResponse<ZohoDeskContact>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/${contactId}`, {
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

  async updateContact(contactId: string, contact: Partial<ZohoDeskContact>): Promise<IntegrationResponse<ZohoDeskContact>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/${contactId}`, {
          method: 'PATCH',
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

  async deleteContact(contactId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/${contactId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Zoho Desk API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listContacts(params?: { limit?: number; from?: number }): Promise<IntegrationResponse<{ data: ZohoDeskContact[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.limit) query.set('limit', params.limit.toString())
      if (params?.from) query.set('from', params.from.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts${query.toString() ? `?${query}` : ''}`, {
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

  async searchContacts(searchStr: string): Promise<IntegrationResponse<{ data: ZohoDeskContact[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/search?searchStr=${encodeURIComponent(searchStr)}`, {
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

  // ===========================
  // Accounts
  // ===========================

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

  async getAccount(accountId: string): Promise<IntegrationResponse<ZohoDeskAccount>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/accounts/${accountId}`, {
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

  async updateAccount(accountId: string, account: Partial<ZohoDeskAccount>): Promise<IntegrationResponse<ZohoDeskAccount>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/accounts/${accountId}`, {
          method: 'PATCH',
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

  async deleteAccount(accountId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/accounts/${accountId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Zoho Desk API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listAccounts(params?: { limit?: number; from?: number }): Promise<IntegrationResponse<{ data: ZohoDeskAccount[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.limit) query.set('limit', params.limit.toString())
      if (params?.from) query.set('from', params.from.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/accounts${query.toString() ? `?${query}` : ''}`, {
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

  // ===========================
  // Agents
  // ===========================

  async listAgents(): Promise<IntegrationResponse<{ data: ZohoDeskAgent[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/agents`, {
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

  async getAgent(agentId: string): Promise<IntegrationResponse<ZohoDeskAgent>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/agents/${agentId}`, {
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

  // ===========================
  // Departments
  // ===========================

  async listDepartments(): Promise<IntegrationResponse<{ data: ZohoDeskDepartment[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/departments`, {
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

  async getDepartment(departmentId: string): Promise<IntegrationResponse<ZohoDeskDepartment>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/departments/${departmentId}`, {
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

  // ===========================
  // Tasks
  // ===========================

  async createTask(task: Partial<ZohoDeskTask>): Promise<IntegrationResponse<ZohoDeskTask>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tasks`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(task),
        })
        if (!response.ok) throw new Error(`Zoho Desk API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listTasks(ticketId?: string): Promise<IntegrationResponse<{ data: ZohoDeskTask[] }>> {
    try {
      await this.ensureConnected()
      const url = ticketId ? `${this.baseUrl}/tickets/${ticketId}/tasks` : `${this.baseUrl}/tasks`

      const result = await this.makeRequest(async () => {
        const response = await fetch(url, {
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

  // ===========================
  // Products
  // ===========================

  async createProduct(product: Partial<ZohoDeskProduct>): Promise<IntegrationResponse<ZohoDeskProduct>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/products`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(product),
        })
        if (!response.ok) throw new Error(`Zoho Desk API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listProducts(departmentId?: string): Promise<IntegrationResponse<{ data: ZohoDeskProduct[] }>> {
    try {
      await this.ensureConnected()
      const query = departmentId ? `?departmentId=${departmentId}` : ''

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/products${query}`, {
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

  // ===========================
  // Articles (Knowledge Base)
  // ===========================

  async listArticles(params?: { categoryId?: string; limit?: number }): Promise<IntegrationResponse<{ data: ZohoDeskArticle[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.categoryId) query.set('categoryId', params.categoryId)
      if (params?.limit) query.set('limit', params.limit.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/articles${query.toString() ? `?${query}` : ''}`, {
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

  async getArticle(articleId: string): Promise<IntegrationResponse<ZohoDeskArticle>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/articles/${articleId}`, {
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

  async searchArticles(searchStr: string): Promise<IntegrationResponse<{ data: ZohoDeskArticle[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/articles/search?searchStr=${encodeURIComponent(searchStr)}`, {
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
}
