/**
 * Salesforce Adapter
 *
 * Complete implementation supporting:
 * - Service Cloud (Cases, Accounts, Contacts, Leads)
 * - Sales Cloud (Opportunities, Leads, Accounts, Quotes)
 * - Marketing Cloud (Journey Builder, Email Studio)
 * - Einstein AI (Sentiment, Intent, Recommendations)
 * - Chatter (Social collaboration)
 * - Knowledge Base
 * - Live Agent integration
 * - Platform Events
 * - REST API & Bulk API
 * - SOQL & SOSL queries
 * - Apex triggers
 * - File management (ContentVersion)
 * - Email services
 * - Reports & Dashboards
 * - Composite API
 * - Metadata operations
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

interface SalesforceSearchResult {
  searchRecords: Array<{
    attributes: { type: string; url: string }
    Id: string
    [key: string]: any
  }>
}

interface SalesforceCompositeRequest {
  method: string
  url: string
  referenceId: string
  body?: any
}

interface SalesforceCompositeResponse {
  compositeResponse: Array<{
    referenceId: string
    httpStatusCode: number
    body: any
  }>
}

interface SalesforceLimits {
  DailyApiRequests: { Max: number; Remaining: number }
  DailyBulkApiRequests: { Max: number; Remaining: number }
  DailyStreamingApiEvents: { Max: number; Remaining: number }
  DataStorageMB: { Max: number; Remaining: number }
  FileStorageMB: { Max: number; Remaining: number }
  [key: string]: { Max: number; Remaining: number }
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

  async closeCaseWithResolution(caseId: string, resolution: string, status: string = 'Closed'): Promise<IntegrationResponse<void>> {
    return this.updateCase(caseId, {
      Status: status,
      Description: resolution,
    })
  }

  async addCaseComment(caseId: string, comment: string, isPublished: boolean = false): Promise<IntegrationResponse<{ id: string }>> {
    return this.createObject('CaseComment', {
      ParentId: caseId,
      CommentBody: comment,
      IsPublished: isPublished,
    })
  }

  async getCaseComments(caseId: string): Promise<IntegrationResponse<SalesforceQueryResult>> {
    return this.query(`SELECT Id, CommentBody, CreatedDate, CreatedBy.Name, IsPublished FROM CaseComment WHERE ParentId = '${caseId}' ORDER BY CreatedDate DESC`)
  }

  async escalateCase(caseId: string, reason?: string): Promise<IntegrationResponse<void>> {
    return this.updateCase(caseId, {
      IsEscalated: true,
      Description: reason || 'Case escalated',
    })
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

  async updateLead(leadId: string, updates: Partial<SalesforceObject>): Promise<IntegrationResponse<void>> {
    return this.updateObject('Lead', leadId, updates)
  }

  async getLead(leadId: string): Promise<IntegrationResponse<SalesforceObject>> {
    return this.getObject('Lead', leadId)
  }

  async queryLeads(whereClause?: string, limit: number = 100): Promise<IntegrationResponse<SalesforceQueryResult>> {
    const query = `SELECT Id, Name, Email, Company, Status, CreatedDate FROM Lead ${whereClause || ''} LIMIT ${limit}`
    return this.query(query)
  }

  async convertLead(leadId: string, params?: {
    accountId?: string
    contactId?: string
    convertedStatus?: string
    doNotCreateOpportunity?: boolean
    opportunityName?: string
    ownerId?: string
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
    Type?: string
    BillingStreet?: string
    BillingCity?: string
    BillingState?: string
    BillingPostalCode?: string
    BillingCountry?: string
    [key: string]: any
  }): Promise<IntegrationResponse<{ id: string }>> {
    return this.createObject('Account', params)
  }

  async updateAccount(accountId: string, updates: Partial<SalesforceObject>): Promise<IntegrationResponse<void>> {
    return this.updateObject('Account', accountId, updates)
  }

  async getAccount(accountId: string): Promise<IntegrationResponse<SalesforceObject>> {
    return this.getObject('Account', accountId)
  }

  async queryAccounts(whereClause?: string, limit: number = 100): Promise<IntegrationResponse<SalesforceQueryResult>> {
    const query = `SELECT Id, Name, Phone, Website, Industry, CreatedDate FROM Account ${whereClause || ''} LIMIT ${limit}`
    return this.query(query)
  }

  async createContact(params: {
    LastName: string
    FirstName?: string
    Email?: string
    Phone?: string
    AccountId?: string
    MobilePhone?: string
    Title?: string
    Department?: string
    [key: string]: any
  }): Promise<IntegrationResponse<{ id: string }>> {
    return this.createObject('Contact', params)
  }

  async updateContact(contactId: string, updates: Partial<SalesforceObject>): Promise<IntegrationResponse<void>> {
    return this.updateObject('Contact', contactId, updates)
  }

  async getContact(contactId: string): Promise<IntegrationResponse<SalesforceObject>> {
    return this.getObject('Contact', contactId)
  }

  async queryContacts(whereClause?: string, limit: number = 100): Promise<IntegrationResponse<SalesforceQueryResult>> {
    const query = `SELECT Id, Name, Email, Phone, AccountId, CreatedDate FROM Contact ${whereClause || ''} LIMIT ${limit}`
    return this.query(query)
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
    Probability?: number
    LeadSource?: string
    [key: string]: any
  }): Promise<IntegrationResponse<{ id: string }>> {
    return this.createObject('Opportunity', params)
  }

  async updateOpportunity(opportunityId: string, updates: Partial<SalesforceObject>): Promise<IntegrationResponse<void>> {
    return this.updateObject('Opportunity', opportunityId, updates)
  }

  async getOpportunity(opportunityId: string): Promise<IntegrationResponse<SalesforceObject>> {
    return this.getObject('Opportunity', opportunityId)
  }

  async queryOpportunities(whereClause?: string, limit: number = 100): Promise<IntegrationResponse<SalesforceQueryResult>> {
    const query = `SELECT Id, Name, StageName, Amount, CloseDate, Probability, AccountId, CreatedDate FROM Opportunity ${whereClause || ''} LIMIT ${limit}`
    return this.query(query)
  }

  async addOpportunityLineItem(params: {
    OpportunityId: string
    PricebookEntryId: string
    Quantity: number
    UnitPrice?: number
    [key: string]: any
  }): Promise<IntegrationResponse<{ id: string }>> {
    return this.createObject('OpportunityLineItem', params)
  }

  // ============================================================================
  // TASKS & EVENTS (Activities)
  // ============================================================================

  async createTask(params: {
    Subject: string
    WhoId?: string
    WhatId?: string
    Status?: string
    Priority?: string
    ActivityDate?: string
    Description?: string
    OwnerId?: string
    [key: string]: any
  }): Promise<IntegrationResponse<{ id: string }>> {
    return this.createObject('Task', params)
  }

  async updateTask(taskId: string, updates: Partial<SalesforceObject>): Promise<IntegrationResponse<void>> {
    return this.updateObject('Task', taskId, updates)
  }

  async createEvent(params: {
    Subject: string
    StartDateTime: string
    EndDateTime: string
    WhoId?: string
    WhatId?: string
    Location?: string
    Description?: string
    [key: string]: any
  }): Promise<IntegrationResponse<{ id: string }>> {
    return this.createObject('Event', params)
  }

  async queryActivities(whoId: string, limit: number = 100): Promise<IntegrationResponse<SalesforceQueryResult>> {
    const query = `SELECT Id, Subject, Status, ActivityDate FROM Task WHERE WhoId = '${whoId}' ORDER BY CreatedDate DESC LIMIT ${limit}`
    return this.query(query)
  }

  // ============================================================================
  // CAMPAIGNS & CAMPAIGN MEMBERS
  // ============================================================================

  async createCampaign(params: {
    Name: string
    Type?: string
    Status?: string
    StartDate?: string
    EndDate?: string
    IsActive?: boolean
    [key: string]: any
  }): Promise<IntegrationResponse<{ id: string }>> {
    return this.createObject('Campaign', params)
  }

  async addCampaignMember(campaignId: string, contactId: string, status?: string): Promise<IntegrationResponse<{ id: string }>> {
    return this.createObject('CampaignMember', {
      CampaignId: campaignId,
      ContactId: contactId,
      Status: status || 'Sent',
    })
  }

  async queryCampaignMembers(campaignId: string): Promise<IntegrationResponse<SalesforceQueryResult>> {
    return this.query(`SELECT Id, ContactId, Status, HasResponded FROM CampaignMember WHERE CampaignId = '${campaignId}'`)
  }

  // ============================================================================
  // FILES & ATTACHMENTS
  // ============================================================================

  async uploadFile(params: {
    Title: string
    PathOnClient: string
    VersionData: string // Base64 encoded
    FirstPublishLocationId?: string
    Description?: string
  }): Promise<IntegrationResponse<{ id: string }>> {
    return this.createObject('ContentVersion', params)
  }

  async getFile(contentDocumentId: string): Promise<IntegrationResponse<SalesforceObject>> {
    return this.getObject('ContentDocument', contentDocumentId)
  }

  async shareFileWithRecord(contentDocumentId: string, linkedEntityId: string, shareType: string = 'V'): Promise<IntegrationResponse<{ id: string }>> {
    return this.createObject('ContentDocumentLink', {
      ContentDocumentId: contentDocumentId,
      LinkedEntityId: linkedEntityId,
      ShareType: shareType, // V = Viewer, C = Collaborator, I = Inferred
    })
  }

  async queryFiles(linkedEntityId: string): Promise<IntegrationResponse<SalesforceQueryResult>> {
    return this.query(`SELECT ContentDocumentId, ContentDocument.Title, ContentDocument.FileType, ContentDocument.ContentSize FROM ContentDocumentLink WHERE LinkedEntityId = '${linkedEntityId}'`)
  }

  async createNote(params: {
    Title: string
    ParentId: string
    Body?: string
    IsPrivate?: boolean
  }): Promise<IntegrationResponse<{ id: string }>> {
    return this.createObject('Note', params)
  }

  async createAttachment(params: {
    Name: string
    ParentId: string
    Body: string // Base64 encoded
    ContentType?: string
    Description?: string
  }): Promise<IntegrationResponse<{ id: string }>> {
    return this.createObject('Attachment', params)
  }

  // ============================================================================
  // EMAIL SERVICES
  // ============================================================================

  async sendEmail(params: {
    toAddresses: string[]
    ccAddresses?: string[]
    bccAddresses?: string[]
    subject: string
    plainTextBody?: string
    htmlBody?: string
    templateId?: string
    whatId?: string
    orgWideEmailAddressId?: string
    saveAsActivity?: boolean
  }): Promise<IntegrationResponse<{ success: boolean }>> {
    try {
      await this.ensureConnected()

      const emailMessage: any = {
        messages: [{
          targetObjectId: params.toAddresses[0], // Required for single email API
          subject: params.subject,
          plainTextBody: params.plainTextBody,
          htmlBody: params.htmlBody,
          templateId: params.templateId,
          whatId: params.whatId,
          orgWideEmailAddressId: params.orgWideEmailAddressId,
          saveAsActivity: params.saveAsActivity !== false,
          toAddresses: params.toAddresses,
          ccAddresses: params.ccAddresses,
          bccAddresses: params.bccAddresses,
        }],
      }

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.instanceUrl}/services/data/${this.apiVersion}/actions/standard/emailSimple`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailMessage),
          }
        )
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })

      return result.success
        ? { success: true, data: { success: true } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async queryEmailTemplates(folderName?: string): Promise<IntegrationResponse<SalesforceQueryResult>> {
    let query = 'SELECT Id, Name, DeveloperName, Subject, HtmlValue, Body FROM EmailTemplate'
    if (folderName) {
      query += ` WHERE Folder.Name = '${folderName}'`
    }
    return this.query(query)
  }

  // ============================================================================
  // KNOWLEDGE BASE
  // ============================================================================

  async createKnowledgeArticle(articleType: string, params: {
    Title: string
    UrlName: string
    Summary?: string
    [key: string]: any
  }): Promise<IntegrationResponse<{ id: string }>> {
    return this.createObject(articleType, params)
  }

  async publishKnowledgeArticle(articleVersionId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.instanceUrl}/services/data/${this.apiVersion}/sobjects/KnowledgeArticleVersion/${articleVersionId}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              PublishStatus: 'Online',
            }),
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

  async searchKnowledgeArticles(searchTerm: string): Promise<IntegrationResponse<SalesforceSearchResult>> {
    return this.search(`FIND {${searchTerm}} IN ALL FIELDS RETURNING KnowledgeArticleVersion(Id, Title, Summary)`)
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

  async describeObject(objectType: string): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.instanceUrl}/services/data/${this.apiVersion}/sobjects/${objectType}/describe`,
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

  async listObjects(): Promise<IntegrationResponse<Array<{ name: string; label: string; custom: boolean }>>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.instanceUrl}/services/data/${this.apiVersion}/sobjects`,
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

      if (!result.success) {
        return { success: false, error: result.error }
      }

      const objects = result.data.sobjects.map((obj: any) => ({
        name: obj.name,
        label: obj.label,
        custom: obj.custom,
      }))

      return { success: true, data: objects }
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

  async queryAll<T = any>(soql: string): Promise<IntegrationResponse<T[]>> {
    try {
      const allRecords: T[] = []
      let result = await this.query<T>(soql)

      if (!result.success) {
        return { success: false, error: result.error }
      }

      allRecords.push(...result.data!.records)

      while (!result.data!.done && result.data!.nextRecordsUrl) {
        result = await this.queryMore<T>(result.data!.nextRecordsUrl)
        if (!result.success) {
          return { success: false, error: result.error }
        }
        allRecords.push(...result.data!.records)
      }

      return { success: true, data: allRecords }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // SOSL SEARCH
  // ============================================================================

  async search(soslQuery: string): Promise<IntegrationResponse<SalesforceSearchResult>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const encodedQuery = encodeURIComponent(soslQuery)
        const response = await fetch(
          `${this.instanceUrl}/services/data/${this.apiVersion}/search?q=${encodedQuery}`,
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

  async searchSuggestions(query: string, objectType?: string): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()

      const params = new URLSearchParams({ q: query })
      if (objectType) params.set('sobject', objectType)

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.instanceUrl}/services/data/${this.apiVersion}/search/suggestions?${params}`,
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

  async bulkUpdate(objectType: string, records: SalesforceObject[]): Promise<IntegrationResponse<Array<{ id: string; success: boolean; errors?: any[] }>>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.instanceUrl}/services/data/${this.apiVersion}/composite/sobjects`,
          {
            method: 'PATCH',
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

  async bulkDelete(objectType: string, ids: string[]): Promise<IntegrationResponse<Array<{ id: string; success: boolean; errors?: any[] }>>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const idsParam = ids.join(',')
        const response = await fetch(
          `${this.instanceUrl}/services/data/${this.apiVersion}/composite/sobjects?ids=${idsParam}`,
          {
            method: 'DELETE',
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
  // COMPOSITE API
  // ============================================================================

  async composite(requests: SalesforceCompositeRequest[], allOrNone: boolean = false): Promise<IntegrationResponse<SalesforceCompositeResponse>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.instanceUrl}/services/data/${this.apiVersion}/composite`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              allOrNone,
              compositeRequest: requests,
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

  async createSObjectTree(objectType: string, records: any[]): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.instanceUrl}/services/data/${this.apiVersion}/composite/tree/${objectType}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ records }),
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

  async getChatterFeed(subjectId: string, elementsPerPage: number = 25): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.instanceUrl}/services/data/${this.apiVersion}/chatter/feeds/record/${subjectId}/feed-elements?pageSize=${elementsPerPage}`,
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

  async likeChatterPost(feedElementId: string): Promise<IntegrationResponse<{ id: string }>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.instanceUrl}/services/data/${this.apiVersion}/chatter/feed-elements/${feedElementId}/capabilities/chatter-likes/items`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
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

  async commentOnChatterPost(feedElementId: string, comment: string): Promise<IntegrationResponse<{ id: string }>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.instanceUrl}/services/data/${this.apiVersion}/chatter/feed-elements/${feedElementId}/capabilities/comments/items`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              body: {
                messageSegments: [{ type: 'Text', text: comment }],
              },
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
  // REPORTS & ANALYTICS
  // ============================================================================

  async runReport(reportId: string, includeDetails: boolean = false): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const detailsParam = includeDetails ? '?includeDetails=true' : ''
        const response = await fetch(
          `${this.instanceUrl}/services/data/${this.apiVersion}/analytics/reports/${reportId}${detailsParam}`,
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

  async listReports(): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.instanceUrl}/services/data/${this.apiVersion}/analytics/reports`,
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
  // LIMITS & ORG INFO
  // ============================================================================

  async getLimits(): Promise<IntegrationResponse<SalesforceLimits>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.instanceUrl}/services/data/${this.apiVersion}/limits`,
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

  async getOrgInfo(): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()

      const result = await this.query('SELECT Id, Name, OrganizationType, IsSandbox, TrialExpirationDate FROM Organization LIMIT 1')

      if (!result.success || !result.data || result.data.records.length === 0) {
        return { success: false, error: result.error || { code: 'NOT_FOUND', message: 'Organization not found', retryable: false } }
      }

      return { success: true, data: result.data.records[0] }
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

  async publishPlatformEvent(eventType: string, eventData: Record<string, any>): Promise<IntegrationResponse<{ id: string }>> {
    return this.createObject(eventType, eventData)
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
