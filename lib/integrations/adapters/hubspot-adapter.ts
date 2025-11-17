/**
 * HubSpot Adapter - Comprehensive Integration
 *
 * Complete CRM, Marketing, Sales, Service Hub, Conversations, Workflows, and Analytics implementation
 * Covers Contacts, Companies, Deals, Tickets, Conversations, Engagements, Forms, Lists, Pipelines, and more
 */

import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

// ============================================================================
// CRM OBJECT INTERFACES
// ============================================================================

export interface HubSpotProperties {
  [key: string]: any
}

export interface HubSpotObject {
  id: string
  properties: HubSpotProperties
  createdAt?: string
  updatedAt?: string
  archived?: boolean
}

export interface HubSpotContact extends HubSpotObject {
  properties: {
    email?: string
    firstname?: string
    lastname?: string
    phone?: string
    company?: string
    website?: string
    address?: string
    city?: string
    state?: string
    zip?: string
    country?: string
    jobtitle?: string
    lifecyclestage?: string
    hs_lead_status?: string
    [key: string]: any
  }
}

export interface HubSpotCompany extends HubSpotObject {
  properties: {
    name?: string
    domain?: string
    industry?: string
    city?: string
    state?: string
    country?: string
    phone?: string
    description?: string
    numberofemployees?: number
    annualrevenue?: number
    [key: string]: any
  }
}

export interface HubSpotDeal extends HubSpotObject {
  properties: {
    dealname?: string
    dealstage?: string
    amount?: number
    pipeline?: string
    closedate?: string
    dealtype?: string
    description?: string
    hs_priority?: string
    [key: string]: any
  }
}

export interface HubSpotTicket extends HubSpotObject {
  properties: {
    subject?: string
    content?: string
    hs_pipeline?: string
    hs_pipeline_stage?: string
    hs_ticket_priority?: 'LOW' | 'MEDIUM' | 'HIGH'
    hs_ticket_category?: string
    source_type?: string
    [key: string]: any
  }
}

export interface HubSpotSearchRequest {
  filterGroups?: Array<{
    filters: Array<{
      propertyName: string
      operator: string
      value: string | number | boolean
    }>
  }>
  sorts?: Array<{
    propertyName: string
    direction: 'ASCENDING' | 'DESCENDING'
  }>
  properties?: string[]
  limit?: number
  after?: string
}

export interface HubSpotBatchRequest {
  inputs: Array<{
    id?: string
    properties: HubSpotProperties
  }>
}

export interface HubSpotAssociation {
  from: { id: string }
  to: { id: string }
  type: string
}

// ============================================================================
// CONVERSATIONS INTERFACES
// ============================================================================

export interface HubSpotConversation {
  id: string
  threadId?: string
  status?: 'OPEN' | 'CLOSED'
  createdAt?: number
  latestMessageTimestamp?: number
  inbox?: {
    inboxId: string
  }
}

export interface HubSpotMessage {
  id?: string
  createdAt?: number
  type: 'MESSAGE' | 'COMMENT'
  text?: string
  richText?: string
  senders?: Array<{
    actorId: string
    deliveryIdentifier?: {
      type: string
      value: string
    }
  }>
  recipients?: Array<{
    actorId?: string
    deliveryIdentifier?: {
      type: string
      value: string
    }
  }>
  channelId?: string
  channelAccountId?: string
}

export interface HubSpotVisitorIdentification {
  email: string
  firstName?: string
  lastName?: string
}

// ============================================================================
// ENGAGEMENTS INTERFACES
// ============================================================================

export interface HubSpotEngagement {
  id?: string
  type: 'NOTE' | 'EMAIL' | 'CALL' | 'MEETING' | 'TASK'
  timestamp?: number
  ownerId?: string
  properties?: {
    hs_timestamp?: string
    hs_note_body?: string
    hs_call_title?: string
    hs_call_body?: string
    hs_call_duration?: number
    hs_call_status?: string
    hs_email_subject?: string
    hs_email_text?: string
    hs_meeting_title?: string
    hs_meeting_body?: string
    hs_task_subject?: string
    hs_task_body?: string
    hs_task_status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
    hs_task_priority?: 'LOW' | 'MEDIUM' | 'HIGH'
    [key: string]: any
  }
  associations?: {
    contactIds?: string[]
    companyIds?: string[]
    dealIds?: string[]
    ticketIds?: string[]
  }
}

// ============================================================================
// MARKETING INTERFACES
// ============================================================================

export interface HubSpotForm {
  id?: string
  guid?: string
  name: string
  formFieldGroups?: Array<{
    fields: Array<{
      name: string
      label: string
      type: string
      fieldType: string
      required?: boolean
      defaultValue?: string
      options?: Array<{ label: string; value: string }>
    }>
  }>
  submitText?: string
  notifyRecipients?: string
  redirect?: string
}

export interface HubSpotFormSubmission {
  fields: Array<{
    name: string
    value: string
  }>
  context?: {
    hutk?: string
    pageUri?: string
    pageName?: string
  }
  legalConsentOptions?: {
    consent: {
      consentToProcess: boolean
      text: string
    }
  }
}

export interface HubSpotList {
  listId?: number
  name: string
  dynamic?: boolean
  filters?: Array<{
    filterFamily: string
    property: string
    operation: string
    value: string | number
  }>
}

export interface HubSpotEmail {
  emailCampaignId?: number
  appId?: number
  subject: string
  name: string
  fromName: string
  replyTo: string
  htmlBody: string
  textBody?: string
}

// ============================================================================
// SALES INTERFACES
// ============================================================================

export interface HubSpotPipeline {
  pipelineId?: string
  label: string
  displayOrder?: number
  stages?: HubSpotPipelineStage[]
  objectType?: 'DEAL' | 'TICKET'
}

export interface HubSpotPipelineStage {
  stageId?: string
  label: string
  displayOrder: number
  metadata?: {
    probability?: number
    isClosed?: boolean
  }
}

// ============================================================================
// WORKFLOWS INTERFACES
// ============================================================================

export interface HubSpotWorkflow {
  id?: number
  name: string
  type: 'PROPERTY_ANCHOR' | 'FORM_SUBMISSION' | 'MANUAL'
  enabled?: boolean
  actions?: Array<{
    type: string
    delayMillis?: number
    actionType?: string
    propertyName?: string
    newValue?: string
  }>
  enrollmentTriggers?: Array<{
    triggerType: string
    active: boolean
  }>
}

// ============================================================================
// ANALYTICS INTERFACES
// ============================================================================

export interface HubSpotAnalyticsQuery {
  metrics: Array<{
    property: string
    aggregationType?: 'SUM' | 'COUNT' | 'AVG'
  }>
  dimensions?: string[]
  filters?: Array<{
    property: string
    operator: string
    value: any
  }>
  dateRange?: {
    startDate: string
    endDate: string
  }
  limit?: number
}

// ============================================================================
// FILE INTERFACES
// ============================================================================

export interface HubSpotFile {
  id?: string
  name?: string
  url?: string
  size?: number
  type?: string
  extension?: string
  createdAt?: string
}

// ============================================================================
// WEBHOOK INTERFACES
// ============================================================================

export interface HubSpotWebhookSubscription {
  id?: number
  active?: boolean
  eventType: string
  propertyName?: string
  webhookUrl?: string
}

// ============================================================================
// MAIN ADAPTER CLASS
// ============================================================================

export class HubSpotAdapter extends BaseIntegrationAdapter {
  private apiKey?: string
  private accessToken?: string
  private baseUrl = 'https://api.hubapi.com'

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
      maxMessageLength: 10000,
      maxFileSize: 100 * 1024 * 1024,
      maxBatchSize: 100,
      rateLimit: { messages: 100, period: 'per_10_seconds' },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.apiKey = this.config.credentials.apiKey
    this.accessToken = this.config.credentials.accessToken
    if (!this.apiKey && !this.accessToken) {
      return {
        success: false,
        error: { code: 'AUTH_ERROR', message: 'Missing credentials', retryable: false }
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
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/crm/v3/objects/contacts?limit=1`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return await response.json()
      })
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.accessToken) headers['Authorization'] = `Bearer ${this.accessToken}`
    else if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`
    return headers
  }

  // ============================================================================
  // CONTACT METHODS
  // ============================================================================

  /**
   * Create a contact
   */
  async createContact(properties: HubSpotContact['properties']): Promise<IntegrationResponse<HubSpotContact>> {
    return this.createObject('contacts', properties)
  }

  /**
   * Get a contact by ID
   */
  async getContact(contactId: string, properties?: string[]): Promise<IntegrationResponse<HubSpotContact>> {
    return this.getObject('contacts', contactId, properties)
  }

  /**
   * Update a contact
   */
  async updateContact(contactId: string, properties: HubSpotProperties): Promise<IntegrationResponse<HubSpotContact>> {
    return this.updateObject('contacts', contactId, properties)
  }

  /**
   * Delete a contact
   */
  async deleteContact(contactId: string): Promise<IntegrationResponse<void>> {
    return this.deleteObject('contacts', contactId)
  }

  /**
   * Get contact by email
   */
  async getContactByEmail(email: string): Promise<IntegrationResponse<HubSpotContact>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/crm/v3/objects/contacts/${email}?idProperty=email`,
          { headers: this.getHeaders() }
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

  /**
   * Search contacts
   */
  async searchContacts(searchRequest: HubSpotSearchRequest): Promise<IntegrationResponse<{ results: HubSpotContact[] }>> {
    return this.searchObjects('contacts', searchRequest)
  }

  /**
   * Batch create/update contacts
   */
  async batchContacts(inputs: HubSpotBatchRequest['inputs']): Promise<IntegrationResponse<{ results: HubSpotContact[] }>> {
    return this.batchUpsertObjects('contacts', inputs)
  }

  // ============================================================================
  // COMPANY METHODS
  // ============================================================================

  /**
   * Create a company
   */
  async createCompany(properties: HubSpotCompany['properties']): Promise<IntegrationResponse<HubSpotCompany>> {
    return this.createObject('companies', properties)
  }

  /**
   * Get a company by ID
   */
  async getCompany(companyId: string, properties?: string[]): Promise<IntegrationResponse<HubSpotCompany>> {
    return this.getObject('companies', companyId, properties)
  }

  /**
   * Update a company
   */
  async updateCompany(companyId: string, properties: HubSpotProperties): Promise<IntegrationResponse<HubSpotCompany>> {
    return this.updateObject('companies', companyId, properties)
  }

  /**
   * Delete a company
   */
  async deleteCompany(companyId: string): Promise<IntegrationResponse<void>> {
    return this.deleteObject('companies', companyId)
  }

  /**
   * Search companies
   */
  async searchCompanies(searchRequest: HubSpotSearchRequest): Promise<IntegrationResponse<{ results: HubSpotCompany[] }>> {
    return this.searchObjects('companies', searchRequest)
  }

  // ============================================================================
  // DEAL METHODS
  // ============================================================================

  /**
   * Create a deal
   */
  async createDeal(properties: HubSpotDeal['properties']): Promise<IntegrationResponse<HubSpotDeal>> {
    return this.createObject('deals', properties)
  }

  /**
   * Get a deal by ID
   */
  async getDeal(dealId: string, properties?: string[]): Promise<IntegrationResponse<HubSpotDeal>> {
    return this.getObject('deals', dealId, properties)
  }

  /**
   * Update a deal
   */
  async updateDeal(dealId: string, properties: HubSpotProperties): Promise<IntegrationResponse<HubSpotDeal>> {
    return this.updateObject('deals', dealId, properties)
  }

  /**
   * Delete a deal
   */
  async deleteDeal(dealId: string): Promise<IntegrationResponse<void>> {
    return this.deleteObject('deals', dealId)
  }

  /**
   * Search deals
   */
  async searchDeals(searchRequest: HubSpotSearchRequest): Promise<IntegrationResponse<{ results: HubSpotDeal[] }>> {
    return this.searchObjects('deals', searchRequest)
  }

  // ============================================================================
  // TICKET METHODS
  // ============================================================================

  /**
   * Create a ticket
   */
  async createTicket(properties: HubSpotTicket['properties']): Promise<IntegrationResponse<HubSpotTicket>> {
    return this.createObject('tickets', properties)
  }

  /**
   * Get a ticket by ID
   */
  async getTicket(ticketId: string, properties?: string[]): Promise<IntegrationResponse<HubSpotTicket>> {
    return this.getObject('tickets', ticketId, properties)
  }

  /**
   * Update a ticket
   */
  async updateTicket(ticketId: string, properties: HubSpotProperties): Promise<IntegrationResponse<HubSpotTicket>> {
    return this.updateObject('tickets', ticketId, properties)
  }

  /**
   * Delete a ticket
   */
  async deleteTicket(ticketId: string): Promise<IntegrationResponse<void>> {
    return this.deleteObject('tickets', ticketId)
  }

  /**
   * Search tickets
   */
  async searchTickets(searchRequest: HubSpotSearchRequest): Promise<IntegrationResponse<{ results: HubSpotTicket[] }>> {
    return this.searchObjects('tickets', searchRequest)
  }

  // ============================================================================
  // GENERIC CRM OBJECT METHODS
  // ============================================================================

  private async createObject(objectType: string, properties: HubSpotProperties): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/crm/v3/objects/${objectType}`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ properties }),
        })
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

  private async getObject(objectType: string, objectId: string, properties?: string[]): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const params = properties ? `?properties=${properties.join(',')}` : ''
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/crm/v3/objects/${objectType}/${objectId}${params}`, {
          headers: this.getHeaders(),
        })
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

  private async updateObject(objectType: string, objectId: string, properties: HubSpotProperties): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/crm/v3/objects/${objectType}/${objectId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({ properties }),
        })
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

  private async deleteObject(objectType: string, objectId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/crm/v3/objects/${objectType}/${objectId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(await response.text())
        return response.status === 204 ? {} : await response.json()
      })
      return result.success
        ? { success: true, data: undefined }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  private async searchObjects(objectType: string, searchRequest: HubSpotSearchRequest): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/crm/v3/objects/${objectType}/search`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(searchRequest),
        })
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

  private async batchUpsertObjects(objectType: string, inputs: HubSpotBatchRequest['inputs']): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/crm/v3/objects/${objectType}/batch/upsert`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ inputs }),
        })
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
  // ASSOCIATION METHODS
  // ============================================================================

  /**
   * Associate two objects (e.g., contact to company)
   */
  async createAssociation(
    fromObjectType: string,
    fromObjectId: string,
    toObjectType: string,
    toObjectId: string,
    associationType: string
  ): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/crm/v3/objects/${fromObjectType}/${fromObjectId}/associations/${toObjectType}/${toObjectId}/${associationType}`,
          {
            method: 'PUT',
            headers: this.getHeaders(),
          }
        )
        if (!response.ok) throw new Error(await response.text())
        return response.status === 200 || response.status === 204 ? {} : await response.json()
      })
      return result.success
        ? { success: true, data: undefined }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Get associations for an object
   */
  async getAssociations(
    fromObjectType: string,
    fromObjectId: string,
    toObjectType: string
  ): Promise<IntegrationResponse<{ results: any[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(
          `${this.baseUrl}/crm/v3/objects/${fromObjectType}/${fromObjectId}/associations/${toObjectType}`,
          { headers: this.getHeaders() }
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
  // CONVERSATIONS METHODS
  // ============================================================================

  /**
   * Create a conversation thread
   */
  async createConversation(inboxId: string): Promise<IntegrationResponse<HubSpotConversation>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/v3/conversations/threads`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ inbox: { inboxId } }),
        })
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

  /**
   * Send a message in a conversation
   */
  async sendConversationMessage(threadId: string, message: HubSpotMessage): Promise<IntegrationResponse<HubSpotMessage>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/v3/conversations/threads/${threadId}/messages`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(message),
        })
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

  /**
   * Get conversation thread
   */
  async getConversationThread(threadId: string): Promise<IntegrationResponse<HubSpotConversation>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/v3/conversations/threads/${threadId}`, {
          headers: this.getHeaders(),
        })
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
  // ENGAGEMENT METHODS
  // ============================================================================

  /**
   * Create a note
   */
  async createNote(note: {
    body: string
    ownerId?: string
    associations?: { contactIds?: string[]; companyIds?: string[]; dealIds?: string[] }
  }): Promise<IntegrationResponse<HubSpotEngagement>> {
    return this.createEngagement({
      type: 'NOTE',
      properties: {
        hs_timestamp: new Date().toISOString(),
        hs_note_body: note.body,
      },
      associations: note.associations,
    })
  }

  /**
   * Create a call engagement
   */
  async createCall(call: {
    title: string
    body?: string
    duration?: number
    status?: string
    ownerId?: string
    associations?: { contactIds?: string[]; companyIds?: string[]; dealIds?: string[] }
  }): Promise<IntegrationResponse<HubSpotEngagement>> {
    return this.createEngagement({
      type: 'CALL',
      properties: {
        hs_timestamp: new Date().toISOString(),
        hs_call_title: call.title,
        hs_call_body: call.body,
        hs_call_duration: call.duration,
        hs_call_status: call.status,
      },
      associations: call.associations,
    })
  }

  /**
   * Create a task
   */
  async createTask(task: {
    subject: string
    body?: string
    status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
    priority?: 'LOW' | 'MEDIUM' | 'HIGH'
    ownerId?: string
    associations?: { contactIds?: string[]; companyIds?: string[]; dealIds?: string[] }
  }): Promise<IntegrationResponse<HubSpotEngagement>> {
    return this.createEngagement({
      type: 'TASK',
      properties: {
        hs_timestamp: new Date().toISOString(),
        hs_task_subject: task.subject,
        hs_task_body: task.body,
        hs_task_status: task.status,
        hs_task_priority: task.priority,
      },
      associations: task.associations,
    })
  }

  /**
   * Create a meeting engagement
   */
  async createMeeting(meeting: {
    title: string
    body?: string
    startTime?: string
    endTime?: string
    ownerId?: string
    associations?: { contactIds?: string[]; companyIds?: string[]; dealIds?: string[] }
  }): Promise<IntegrationResponse<HubSpotEngagement>> {
    return this.createEngagement({
      type: 'MEETING',
      properties: {
        hs_timestamp: meeting.startTime || new Date().toISOString(),
        hs_meeting_title: meeting.title,
        hs_meeting_body: meeting.body,
      },
      associations: meeting.associations,
    })
  }

  private async createEngagement(engagement: HubSpotEngagement): Promise<IntegrationResponse<HubSpotEngagement>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/crm/v3/objects/engagements`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            properties: engagement.properties,
            associations: this.formatEngagementAssociations(engagement.associations),
          }),
        })
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

  private formatEngagementAssociations(associations?: HubSpotEngagement['associations']) {
    if (!associations) return []
    const formatted: any[] = []
    if (associations.contactIds) {
      associations.contactIds.forEach(id => {
        formatted.push({ to: { id }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 1 }] })
      })
    }
    if (associations.companyIds) {
      associations.companyIds.forEach(id => {
        formatted.push({ to: { id }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 2 }] })
      })
    }
    if (associations.dealIds) {
      associations.dealIds.forEach(id => {
        formatted.push({ to: { id }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }] })
      })
    }
    return formatted
  }

  // ============================================================================
  // MARKETING - FORMS METHODS
  // ============================================================================

  /**
   * Get all forms
   */
  async getForms(): Promise<IntegrationResponse<HubSpotForm[]>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/marketing/v3/forms`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: result.data.results }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Submit a form
   */
  async submitForm(formId: string, submission: HubSpotFormSubmission): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/marketing/v3/forms/${formId}/submissions`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(submission),
        })
        if (!response.ok) throw new Error(await response.text())
        return response.status === 200 ? {} : await response.json()
      })
      return result.success
        ? { success: true, data: undefined }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // MARKETING - LISTS METHODS
  // ============================================================================

  /**
   * Create a contact list
   */
  async createList(list: HubSpotList): Promise<IntegrationResponse<HubSpotList>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/v1/lists`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(list),
        })
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

  /**
   * Add contact to list
   */
  async addContactToList(listId: number, contactId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/contacts/v1/lists/${listId}/add`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ vids: [contactId] }),
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success
        ? { success: true, data: undefined }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // SALES - PIPELINE METHODS
  // ============================================================================

  /**
   * Get pipelines
   */
  async getPipelines(objectType: 'deals' | 'tickets'): Promise<IntegrationResponse<{ results: HubSpotPipeline[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/crm/v3/pipelines/${objectType}`, {
          headers: this.getHeaders(),
        })
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

  /**
   * Create a pipeline
   */
  async createPipeline(objectType: 'deals' | 'tickets', pipeline: HubSpotPipeline): Promise<IntegrationResponse<HubSpotPipeline>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/crm/v3/pipelines/${objectType}`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(pipeline),
        })
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
  // WORKFLOW METHODS
  // ============================================================================

  /**
   * Get workflows
   */
  async getWorkflows(): Promise<IntegrationResponse<{ workflows: HubSpotWorkflow[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/automation/v3/workflows`, {
          headers: this.getHeaders(),
        })
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

  /**
   * Enroll contact in workflow
   */
  async enrollInWorkflow(workflowId: number, email: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/automation/v2/workflows/${workflowId}/enrollments/contacts/${email}`, {
          method: 'POST',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(await response.text())
        return response.status === 204 ? {} : await response.json()
      })
      return result.success
        ? { success: true, data: undefined }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // FILE METHODS
  // ============================================================================

  /**
   * Upload a file
   */
  async uploadFile(file: Buffer | Blob, fileName: string, options?: { folderId?: string }): Promise<IntegrationResponse<HubSpotFile>> {
    try {
      await this.ensureConnected()
      const formData = new FormData()
      formData.append('file', file, fileName)
      if (options?.folderId) formData.append('folderId', options.folderId)

      const result = await this.makeRequest(async () => {
        const headers = this.getHeaders()
        delete headers['Content-Type'] // Let browser set multipart boundary
        const response = await fetch(`${this.baseUrl}/files/v3/files`, {
          method: 'POST',
          headers,
          body: formData,
        })
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

  /**
   * Get file details
   */
  async getFile(fileId: string): Promise<IntegrationResponse<HubSpotFile>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/files/v3/files/${fileId}`, {
          headers: this.getHeaders(),
        })
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
  // ANALYTICS METHODS
  // ============================================================================

  /**
   * Query analytics data
   */
  async queryAnalytics(query: HubSpotAnalyticsQuery): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/analytics/v2/reports/custom`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(query),
        })
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
  // WEBHOOK METHODS
  // ============================================================================

  /**
   * Create webhook subscription
   */
  async createWebhookSubscription(subscription: HubSpotWebhookSubscription): Promise<IntegrationResponse<HubSpotWebhookSubscription>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/webhooks/v3/subscriptions`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(subscription),
        })
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

  /**
   * Get webhook subscriptions
   */
  async getWebhookSubscriptions(): Promise<IntegrationResponse<{ results: HubSpotWebhookSubscription[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/webhooks/v3/subscriptions`, {
          headers: this.getHeaders(),
        })
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

  /**
   * Delete webhook subscription
   */
  async deleteWebhookSubscription(subscriptionId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/webhooks/v3/subscriptions/${subscriptionId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(await response.text())
        return response.status === 204 ? {} : await response.json()
      })
      return result.success
        ? { success: true, data: undefined }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
