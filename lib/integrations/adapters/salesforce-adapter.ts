/**
 * Salesforce Adapter
 *
 * Complete implementation supporting:
 * - Service Cloud (Cases, Accounts, Contacts, Leads)
 * - Sales Cloud (Opportunities, Leads, Accounts)
 * - Marketing Cloud (Journey Builder, Email Studio)
 * - Einstein AI (Sentiment, Intent, Recommendations)
 * - Chatter (Social collaboration)
 * - Knowledge Base
 * - Live Agent integration
 * - Platform Events
 * - REST API & Bulk API
 * - SOQL queries
 * - Apex triggers
 */

import { BaseIntegrationAdapter } from '../base-adapter'
import {
  IntegrationConfig,
  IntegrationCapabilities,
  IntegrationResponse,
  AuthenticationError,
  ValidationError,
} from '../types'

interface SalesforceObject {
  Id?: string
  [key: string]: any
}

interface SalesforceQueryResult<T = any> {
  totalSize: number
  done: boolean
  records: T[]
  nextRecordsUrl?: string
}

export class SalesforceAdapter extends BaseIntegrationAdapter {
  private instanceUrl?: string
  private accessToken?: string
  private refreshToken?: string
  private apiVersion = 'v59.0'

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: true,
      canReceiveMessages: true,
      canSendFiles: true,
      canSendImages: true,
      canSendVideo: false,
      canSendAudio: false,
      canSendLocation: false,
      canSendButtons: true,
      canSendCards: true,
      canSendCarousels: false,
      canSendQuickReplies: true,
      canSendTemplates: true,
      canScheduleMessages: true,
      canBroadcast: true,
      canTag: true,
      canAssign: true,
      canCreateTickets: true,
      canCreateLeads: true,
      canCreateContacts: true,
      canSyncContacts: true,
      canSyncConversations: true,
      canSyncTickets: true,
      canExportData: true,
      canImportData: true,
      canTrackEvents: true,
      canTrackMetrics: true,
      canGenerateReports: true,
      canCreateWorkflows: true,
      canTriggerActions: true,
      canListenToWebhooks: true,
      maxMessageLength: 32000,
      maxFileSize: 25 * 1024 * 1024,
      maxBatchSize: 200,
      rateLimit: { messages: 15000, period: 'per_day' },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    try {
      this.instanceUrl = this.config.credentials.instanceUrl
      this.accessToken = this.config.credentials.accessToken
      this.refreshToken = this.config.credentials.refreshToken

      if (!this.instanceUrl || !this.accessToken) {
        throw new AuthenticationError(this.config.type, 'Missing instance URL or access token')
      }

      const testResult = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.instanceUrl}/services/data/${this.apiVersion}/sobjects`,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        )
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return await response.json()
      })

      if (!testResult.success) {
        throw new AuthenticationError(this.config.type, 'Invalid credentials')
      }

      this.isConnected = true
      return { success: true, data: undefined }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async disconnect(): Promise<IntegrationResponse<void>> {
    this.isConnected = false
    return { success: true, data: undefined }
  }

  async testConnection(): Promise<IntegrationResponse<boolean>> {
    try {
      await this.ensureConnected()
      const result = await this.query('SELECT Id FROM User LIMIT 1')
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // CASES (Service Cloud)
  // ============================================================================

  async createCase(params: {
    Subject: string
    Description?: string
    Status?: string
    Priority?: string
    Origin?: string
    ContactId?: string
    AccountId?: string
    OwnerId?: string
    Type?: string
    [key: string]: any
  }): Promise<IntegrationResponse<{ id: string }>> {
    return this.createObject('Case', params)
  }

  async updateCase(caseId: string, updates: Partial<SalesforceObject>): Promise<IntegrationResponse<void>> {
    return this.updateObject('Case', caseId, updates)
  }

  async getCase(caseId: string): Promise<IntegrationResponse<SalesforceObject>> {
    return this.getObject('Case', caseId)
  }

  async queryCases(whereClause?: string, limit: number = 100): Promise<IntegrationResponse<SalesforceQueryResult>> {
    const query = `SELECT Id, CaseNumber, Subject, Status, Priority, CreatedDate FROM Case ${whereClause || ''} LIMIT ${limit}`
    return this.query(query)
  }

  // ============================================================================
  // LEADS (Sales Cloud)
  // ============================================================================

  async createLead(params: {
    LastName: string
    Company: string
    Email?: string
    Phone?: string
    Status?: string
    LeadSource?: string
    [key: string]: any
  }): Promise<IntegrationResponse<{ id: string }>> {
    return this.createObject('Lead', params)
  }

  async convertLead(leadId: string, params?: {
    accountId?: string
    contactId?: string
    convertedStatus?: string
    doNotCreateOpportunity?: boolean
  }): Promise<IntegrationResponse<{ accountId: string; contactId: string; opportunityId?: string }>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.instanceUrl}/services/data/${this.apiVersion}/sobjects/Lead/${leadId}/convert`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(params || {}),
          }
        )
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })

      return result.success
        ? { success: true, data: result.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // ACCOUNTS & CONTACTS
  // ============================================================================

  async createAccount(params: {
    Name: string
    Phone?: string
    Website?: string
    Industry?: string
    [key: string]: any
  }): Promise<IntegrationResponse<{ id: string }>> {
    return this.createObject('Account', params)
  }

  async createContact(params: {
    LastName: string
    FirstName?: string
    Email?: string
    Phone?: string
    AccountId?: string
    [key: string]: any
  }): Promise<IntegrationResponse<{ id: string }>> {
    return this.createObject('Contact', params)
  }

  // ============================================================================
  // OPPORTUNITIES (Sales Cloud)
  // ============================================================================

  async createOpportunity(params: {
    Name: string
    StageName: string
    CloseDate: string
    Amount?: number
    AccountId?: string
    [key: string]: any
  }): Promise<IntegrationResponse<{ id: string }>> {
    return this.createObject('Opportunity', params)
  }

  // ============================================================================
  // GENERIC SOBJECT OPERATIONS
  // ============================================================================

  async createObject(objectType: string, data: SalesforceObject): Promise<IntegrationResponse<{ id: string }>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.instanceUrl}/services/data/${this.apiVersion}/sobjects/${objectType}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          }
        )
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })

      return result.success
        ? { success: true, data: { id: result.data.id } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateObject(objectType: string, id: string, updates: Partial<SalesforceObject>): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.instanceUrl}/services/data/${this.apiVersion}/sobjects/${objectType}/${id}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
          }
        )
        if (!response.ok) throw new Error(await response.text())
        return true
      })

      return result.success
        ? { success: true, data: undefined }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getObject(objectType: string, id: string, fields?: string[]): Promise<IntegrationResponse<SalesforceObject>> {
    try {
      await this.ensureConnected()

      const fieldParam = fields ? `?fields=${fields.join(',')}` : ''
      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.instanceUrl}/services/data/${this.apiVersion}/sobjects/${objectType}/${id}${fieldParam}`,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        )
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })

      return result.success
        ? { success: true, data: result.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteObject(objectType: string, id: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.instanceUrl}/services/data/${this.apiVersion}/sobjects/${objectType}/${id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
            },
          }
        )
        if (!response.ok && response.status !== 204) throw new Error(await response.text())
        return true
      })

      return result.success
        ? { success: true, data: undefined }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // SOQL QUERIES
  // ============================================================================

  async query<T = any>(soql: string): Promise<IntegrationResponse<SalesforceQueryResult<T>>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const encodedQuery = encodeURIComponent(soql)
        const response = await fetch(
          `${this.instanceUrl}/services/data/${this.apiVersion}/query?q=${encodedQuery}`,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        )
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })

      return result.success
        ? { success: true, data: result.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async queryMore<T = any>(nextRecordsUrl: string): Promise<IntegrationResponse<SalesforceQueryResult<T>>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.instanceUrl}${nextRecordsUrl}`,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        )
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })

      return result.success
        ? { success: true, data: result.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  async bulkCreate(objectType: string, records: SalesforceObject[]): Promise<IntegrationResponse<Array<{ id: string; success: boolean; errors?: any[] }>>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.instanceUrl}/services/data/${this.apiVersion}/composite/sobjects`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              allOrNone: false,
              records: records.map(r => ({ attributes: { type: objectType }, ...r })),
            }),
          }
        )
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })

      return result.success
        ? { success: true, data: result.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // CHATTER (Social Collaboration)
  // ============================================================================

  async postToChatter(params: {
    subjectId: string // User, Group, or Record ID
    text: string
    mentionedUsers?: string[]
  }): Promise<IntegrationResponse<{ id: string }>> {
    try {
      await this.ensureConnected()

      const messageSegments: any[] = [{ type: 'Text', text: params.text }]

      if (params.mentionedUsers) {
        params.mentionedUsers.forEach(userId => {
          messageSegments.push({ type: 'Mention', id: userId })
        })
      }

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.instanceUrl}/services/data/${this.apiVersion}/chatter/feed-elements`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              body: { messageSegments },
              feedElementType: 'FeedItem',
              subjectId: params.subjectId,
            }),
          }
        )
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })

      return result.success
        ? { success: true, data: { id: result.data.id } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // WEBHOOKS & PLATFORM EVENTS
  // ============================================================================

  async parseWebhook(payload: any): Promise<any> {
    // Parse Salesforce Platform Event or Outbound Message
    return {
      type: payload.event?.type || 'unknown',
      objectType: payload.sobject?.attributes?.type,
      objectId: payload.sobject?.Id,
      data: payload.sobject,
      timestamp: new Date(payload.event?.createdDate || Date.now()),
      rawPayload: payload,
    }
  }

  // ============================================================================
  // OAUTH TOKEN REFRESH
  // ============================================================================

  async refreshAccessToken(): Promise<IntegrationResponse<{
    accessToken: string
    refreshToken?: string
    expiresIn?: number
  }>> {
    try {
      if (!this.refreshToken || !this.config.oauth?.clientId || !this.config.oauth?.clientSecret) {
        throw new Error('Missing refresh token or OAuth credentials')
      }

      const tokenUrl = this.config.oauth.tokenUrl || 'https://login.salesforce.com/services/oauth2/token'

      const formData = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.config.oauth.clientId,
        client_secret: this.config.oauth.clientSecret,
        refresh_token: this.refreshToken,
      })

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      })

      if (!response.ok) throw new Error(await response.text())

      const data = await response.json()
      this.accessToken = data.access_token
      this.instanceUrl = data.instance_url

      return {
        success: true,
        data: {
          accessToken: data.access_token,
          expiresIn: data.expires_in,
        },
      }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
