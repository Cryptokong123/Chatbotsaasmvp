/**
 * Postmark Adapter - Transactional email service
 * Comprehensive email sending, template management, bounce handling, and analytics
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

// Email interfaces
export interface PostmarkEmail {
  From: string
  To: string
  Cc?: string
  Bcc?: string
  Subject: string
  Tag?: string
  HtmlBody?: string
  TextBody?: string
  ReplyTo?: string
  Headers?: Array<{ Name: string; Value: string }>
  TrackOpens?: boolean
  TrackLinks?: 'None' | 'HtmlAndText' | 'HtmlOnly' | 'TextOnly'
  Attachments?: Array<{
    Name: string
    Content: string
    ContentType: string
    ContentID?: string
  }>
  Metadata?: Record<string, string>
  MessageStream?: string
}

export interface PostmarkBatchEmail {
  From: string
  To: string
  Cc?: string
  Bcc?: string
  Subject: string
  Tag?: string
  HtmlBody?: string
  TextBody?: string
  ReplyTo?: string
  Headers?: Array<{ Name: string; Value: string }>
  TrackOpens?: boolean
  TrackLinks?: 'None' | 'HtmlAndText' | 'HtmlOnly' | 'TextOnly'
  Attachments?: Array<{ Name: string; Content: string; ContentType: string }>
  Metadata?: Record<string, string>
  MessageStream?: string
}

export interface PostmarkTemplateEmail {
  From: string
  To: string
  Cc?: string
  Bcc?: string
  Tag?: string
  ReplyTo?: string
  Headers?: Array<{ Name: string; Value: string }>
  TrackOpens?: boolean
  TrackLinks?: 'None' | 'HtmlAndText' | 'HtmlOnly' | 'TextOnly'
  Attachments?: Array<{ Name: string; Content: string; ContentType: string }>
  TemplateId?: number
  TemplateAlias?: string
  TemplateModel?: Record<string, any>
  InlineCss?: boolean
  MessageStream?: string
}

// Template interfaces
export interface PostmarkTemplate {
  TemplateId?: number
  Name: string
  Alias?: string
  Subject: string
  HtmlBody: string
  TextBody?: string
  AssociatedServerId?: number
  TemplateType?: 'Standard' | 'Layout'
  LayoutTemplate?: string
  Active?: boolean
}

export interface PostmarkTemplateValidation {
  AllContentIsValid: boolean
  HtmlBody?: {
    ContentIsValid: boolean
    ValidationErrors?: Array<{
      Message: string
      Line: number
      CharacterPosition: number
    }>
    RenderedContent?: string
  }
  TextBody?: {
    ContentIsValid: boolean
    ValidationErrors?: Array<{
      Message: string
      Line: number
      CharacterPosition: number
    }>
    RenderedContent?: string
  }
  Subject?: {
    ContentIsValid: boolean
    ValidationErrors?: Array<{
      Message: string
      Line: number
      CharacterPosition: number
    }>
    RenderedContent?: string
  }
  SuggestedTemplateModel?: Record<string, any>
}

// Server and domain interfaces
export interface PostmarkServer {
  ID: number
  Name: string
  ApiTokens: string[]
  ServerLink: string
  Color: string
  SmtpApiActivated: boolean
  RawEmailEnabled: boolean
  DeliveryType: string
  InboundAddress: string
  InboundHookUrl: string
  BounceHookUrl: string
  OpenHookUrl: string
  ClickHookUrl: string
  DeliveryHookUrl: string
  PostFirstOpenOnly: boolean
  TrackOpens: boolean
  TrackLinks: 'None' | 'HtmlAndText' | 'HtmlOnly' | 'TextOnly'
  InboundDomain: string
  InboundHash: string
  InboundSpamThreshold: number
}

export interface PostmarkDomain {
  ID: number
  Name: string
  SPFVerified: boolean
  SPFHost: string
  SPFTextValue: string
  DKIMVerified: boolean
  DKIMHost: string
  DKIMTextValue: string
  DKIMPendingHost: string
  DKIMPendingTextValue: string
  DKIMRevokedHost: string
  DKIMRevokedTextValue: string
  SafeToRemoveRevokedKeyFromDNS: boolean
  DKIMUpdateStatus: string
  WeakDKIM: boolean
  ReturnPathDomain: string
  ReturnPathDomainVerified: boolean
  ReturnPathDomainCNAMEValue: string
}

export interface PostmarkSender {
  ID: number
  Name: string
  EmailAddress: string
  ReplyToEmailAddress: string
  Confirmed: boolean
  SPFVerified: boolean
  SPFHost: string
  SPFTextValue: string
  DKIMVerified: boolean
  DKIMHost: string
  DKIMTextValue: string
  DKIMPendingHost: string
  DKIMPendingTextValue: string
  DKIMRevokedHost: string
  DKIMRevokedTextValue: string
  SafeToRemoveRevokedKeyFromDNS: boolean
  DKIMUpdateStatus: string
  WeakDKIM: boolean
  ReturnPathDomain: string
  ReturnPathDomainVerified: boolean
  ReturnPathDomainCNAMEValue: string
}

// Message stream interfaces
export interface PostmarkMessageStream {
  ID: string
  ServerID: number
  Name: string
  Description: string
  MessageStreamType: 'Transactional' | 'Inbound' | 'Broadcasts'
  CreatedAt: string
  UpdatedAt: string
  ArchivedAt?: string
  ExpectedPurgeDate?: string
  SubscriptionManagementConfiguration?: {
    UnsubscribeHandlingType: 'Custom' | 'PostmarkHosted'
  }
}

// Bounce and message interfaces
export interface PostmarkBounce {
  ID: number
  Type: string
  TypeCode: number
  Name: string
  Tag: string
  MessageID: string
  ServerID: number
  Description: string
  Details: string
  Email: string
  From: string
  BouncedAt: string
  DumpAvailable: boolean
  Inactive: boolean
  CanActivate: boolean
  Subject: string
  Content?: string
}

export interface PostmarkOutboundMessage {
  MessageID: string
  To: Array<{ Email: string; Name?: string }>
  Cc: Array<{ Email: string; Name?: string }>
  Bcc: Array<{ Email: string; Name?: string }>
  Recipients: string[]
  ReceivedAt: string
  From: string
  Subject: string
  Attachments: Array<{
    Name: string
    ContentType: string
    ContentLength: number
  }>
  Status: string
  TrackOpens: boolean
  TrackLinks: string
  Tag?: string
  Metadata?: Record<string, string>
}

export interface PostmarkMessageOpens {
  Opens: Array<{
    FirstOpen: boolean
    Client: {
      Name: string
      Company: string
      Family: string
    }
    OS: {
      Name: string
      Company: string
      Family: string
    }
    Platform: string
    UserAgent: string
    ReadSeconds: number
    Geo: {
      CountryISOCode: string
      Country: string
      RegionISOCode: string
      Region: string
      City: string
      Zip: string
      Coords: string
      IP: string
    }
    MessageID: string
    ReceivedAt: string
    Tag?: string
    Recipient: string
  }>
}

export interface PostmarkMessageClicks {
  Clicks: Array<{
    ClickLocation: string
    Client: {
      Name: string
      Company: string
      Family: string
    }
    OS: {
      Name: string
      Company: string
      Family: string
    }
    Platform: string
    UserAgent: string
    OriginalLink: string
    Geo: {
      CountryISOCode: string
      Country: string
      RegionISOCode: string
      Region: string
      City: string
      Zip: string
      Coords: string
      IP: string
    }
    MessageID: string
    ReceivedAt: string
    Tag?: string
    Recipient: string
  }>
}

// Statistics interfaces
export interface PostmarkOutboundStats {
  Sent: number
  BounceRate: number
  SpamComplaints: number
  SpamComplaintsRate: number
  Opens: number
  UniqueOpens: number
  Tracked: number
  WithClientRecorded: number
  WithPlatformRecorded: number
  WithReadTimeRecorded: number
  Clicks: number
  UniqueLinksClicked: number
}

export interface PostmarkSentStats {
  Days: Array<{
    Date: string
    Sent: number
  }>
  Sent: number
}

export interface PostmarkBounceStats {
  Days: Array<{
    Date: string
    HardBounce: number
    SoftBounce: number
    Transient: number
  }>
  HardBounce: number
  SoftBounce: number
  Transient: number
}

export interface PostmarkSpamComplaintStats {
  Days: Array<{
    Date: string
    SpamComplaint: number
  }>
  SpamComplaint: number
}

export interface PostmarkTrackedStats {
  Days: Array<{
    Date: string
    Tracked: number
  }>
  Tracked: number
}

export interface PostmarkOpenStats {
  Days: Array<{
    Date: string
    Opens: number
    Unique: number
  }>
  Opens: number
  Unique: number
}

export interface PostmarkClickStats {
  Days: Array<{
    Date: string
    Clicks: number
    Unique: number
  }>
  Clicks: number
  Unique: number
}

// Suppression interfaces
export interface PostmarkSuppression {
  EmailAddress: string
  SuppressionReason: string
  Origin: string
  CreatedAt: string
}

export class PostmarkAdapter extends BaseIntegrationAdapter {
  private serverToken?: string
  private baseUrl = 'https://api.postmarkapp.com'

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: true, canReceiveMessages: true, canSendFiles: true, canSendImages: true,
      canSendVideo: false, canSendAudio: false, canSendLocation: false, canSendButtons: false,
      canSendCards: false, canSendCarousels: false, canSendQuickReplies: false, canSendTemplates: true,
      canScheduleMessages: false, canBroadcast: true, canTag: true, canAssign: false,
      canCreateTickets: false, canCreateLeads: false, canCreateContacts: false, canSyncContacts: false,
      canSyncConversations: false, canSyncTickets: false, canExportData: true, canImportData: false,
      canTrackEvents: true, canTrackMetrics: true, canGenerateReports: true, canCreateWorkflows: false,
      canTriggerActions: true, canListenToWebhooks: true, maxMessageLength: 0,
      maxFileSize: 10 * 1024 * 1024, maxBatchSize: 500, rateLimit: { messages: 300, period: 'per_minute' as const },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.serverToken = this.config.credentials.serverToken
    if (!this.serverToken) {
      return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing server token', retryable: false } }
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
      const result = await this.getServer()
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  private getHeaders(accountToken?: boolean): Record<string, string> {
    return {
      'X-Postmark-Server-Token': this.serverToken!,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  }

  private async makePostmarkRequest(endpoint: string, options: RequestInit = {}): Promise<IntegrationResponse<any>> {
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
          throw new Error(`Postmark API error: ${response.status} - ${errorText}`)
        }
        const text = await response.text()
        return text ? JSON.parse(text) : {}
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============ Email Sending ============

  async sendEmail(email: PostmarkEmail): Promise<IntegrationResponse<{ MessageID: string; To: string; SubmittedAt: string }>> {
    return this.makePostmarkRequest('/email', {
      method: 'POST',
      body: JSON.stringify(email),
    })
  }

  async sendBatchEmails(emails: PostmarkBatchEmail[]): Promise<IntegrationResponse<Array<{ MessageID: string; To: string; SubmittedAt: string; ErrorCode?: number; Message?: string }>>> {
    return this.makePostmarkRequest('/email/batch', {
      method: 'POST',
      body: JSON.stringify(emails),
    })
  }

  async sendEmailWithTemplate(email: PostmarkTemplateEmail): Promise<IntegrationResponse<{ MessageID: string; To: string; SubmittedAt: string }>> {
    return this.makePostmarkRequest('/email/withTemplate', {
      method: 'POST',
      body: JSON.stringify(email),
    })
  }

  async sendBatchEmailsWithTemplates(emails: PostmarkTemplateEmail[]): Promise<IntegrationResponse<Array<{ MessageID: string; To: string; SubmittedAt: string; ErrorCode?: number; Message?: string }>>> {
    return this.makePostmarkRequest('/email/batchWithTemplates', {
      method: 'POST',
      body: JSON.stringify({ Messages: emails }),
    })
  }

  // ============ Template Management ============

  async createTemplate(template: PostmarkTemplate): Promise<IntegrationResponse<PostmarkTemplate>> {
    return this.makePostmarkRequest('/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    })
  }

  async getTemplate(templateIdOrAlias: number | string): Promise<IntegrationResponse<PostmarkTemplate>> {
    return this.makePostmarkRequest(`/templates/${templateIdOrAlias}`)
  }

  async updateTemplate(templateIdOrAlias: number | string, template: Partial<PostmarkTemplate>): Promise<IntegrationResponse<PostmarkTemplate>> {
    return this.makePostmarkRequest(`/templates/${templateIdOrAlias}`, {
      method: 'PUT',
      body: JSON.stringify(template),
    })
  }

  async deleteTemplate(templateIdOrAlias: number | string): Promise<IntegrationResponse<{ ErrorCode: number; Message: string }>> {
    return this.makePostmarkRequest(`/templates/${templateIdOrAlias}`, {
      method: 'DELETE',
    })
  }

  async listTemplates(params?: { count?: number; offset?: number; templateType?: 'Standard' | 'Layout' }): Promise<IntegrationResponse<{ TotalCount: number; Templates: PostmarkTemplate[] }>> {
    const query = new URLSearchParams()
    if (params?.count) query.set('count', params.count.toString())
    if (params?.offset) query.set('offset', params.offset.toString())
    if (params?.templateType) query.set('templateType', params.templateType)

    return this.makePostmarkRequest(`/templates${query.toString() ? `?${query}` : ''}`)
  }

  async validateTemplate(params: {
    Subject?: string
    HtmlBody?: string
    TextBody?: string
    TestRenderModel?: Record<string, any>
    InlineCssForHtmlTestRender?: boolean
    TemplateType?: 'Standard' | 'Layout'
    LayoutTemplate?: string
  }): Promise<IntegrationResponse<PostmarkTemplateValidation>> {
    return this.makePostmarkRequest('/templates/validate', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  // ============ Server Management ============

  async getServer(): Promise<IntegrationResponse<PostmarkServer>> {
    return this.makePostmarkRequest('/server')
  }

  async updateServer(updates: {
    Name?: string
    Color?: string
    RawEmailEnabled?: boolean
    SmtpApiActivated?: boolean
    InboundHookUrl?: string
    BounceHookUrl?: string
    OpenHookUrl?: string
    PostFirstOpenOnly?: boolean
    TrackOpens?: boolean
    TrackLinks?: 'None' | 'HtmlAndText' | 'HtmlOnly' | 'TextOnly'
    InboundDomain?: string
    InboundSpamThreshold?: number
    ClickHookUrl?: string
    DeliveryHookUrl?: string
  }): Promise<IntegrationResponse<PostmarkServer>> {
    return this.makePostmarkRequest('/server', {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  // ============ Domain Management ============

  async listDomains(params?: { count?: number; offset?: number }): Promise<IntegrationResponse<{ TotalCount: number; Domains: PostmarkDomain[] }>> {
    const query = new URLSearchParams()
    if (params?.count) query.set('count', params.count.toString())
    if (params?.offset) query.set('offset', params.offset.toString())

    return this.makePostmarkRequest(`/domains${query.toString() ? `?${query}` : ''}`)
  }

  async getDomain(domainId: number): Promise<IntegrationResponse<PostmarkDomain>> {
    return this.makePostmarkRequest(`/domains/${domainId}`)
  }

  async createDomain(params: { Name: string; ReturnPathDomain?: string }): Promise<IntegrationResponse<PostmarkDomain>> {
    return this.makePostmarkRequest('/domains', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async updateDomain(domainId: number, params: { ReturnPathDomain?: string }): Promise<IntegrationResponse<PostmarkDomain>> {
    return this.makePostmarkRequest(`/domains/${domainId}`, {
      method: 'PUT',
      body: JSON.stringify(params),
    })
  }

  async deleteDomain(domainId: number): Promise<IntegrationResponse<{ ErrorCode: number; Message: string }>> {
    return this.makePostmarkRequest(`/domains/${domainId}`, {
      method: 'DELETE',
    })
  }

  async verifyDomainDKIM(domainId: number): Promise<IntegrationResponse<PostmarkDomain>> {
    return this.makePostmarkRequest(`/domains/${domainId}/verifyDkim`, {
      method: 'PUT',
    })
  }

  async verifyDomainReturnPath(domainId: number): Promise<IntegrationResponse<PostmarkDomain>> {
    return this.makePostmarkRequest(`/domains/${domainId}/verifyReturnPath`, {
      method: 'PUT',
    })
  }

  async rotateDomainDKIM(domainId: number): Promise<IntegrationResponse<PostmarkDomain>> {
    return this.makePostmarkRequest(`/domains/${domainId}/rotateDkim`, {
      method: 'POST',
    })
  }

  // ============ Sender Signature Management ============

  async listSenderSignatures(params?: { count?: number; offset?: number }): Promise<IntegrationResponse<{ TotalCount: number; SenderSignatures: PostmarkSender[] }>> {
    const query = new URLSearchParams()
    if (params?.count) query.set('count', params.count.toString())
    if (params?.offset) query.set('offset', params.offset.toString())

    return this.makePostmarkRequest(`/senders${query.toString() ? `?${query}` : ''}`)
  }

  async getSenderSignature(signatureId: number): Promise<IntegrationResponse<PostmarkSender>> {
    return this.makePostmarkRequest(`/senders/${signatureId}`)
  }

  async createSenderSignature(params: {
    FromEmail: string
    Name: string
    ReplyToEmail?: string
    ReturnPathDomain?: string
  }): Promise<IntegrationResponse<PostmarkSender>> {
    return this.makePostmarkRequest('/senders', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async updateSenderSignature(signatureId: number, params: {
    Name?: string
    ReplyToEmail?: string
    ReturnPathDomain?: string
  }): Promise<IntegrationResponse<PostmarkSender>> {
    return this.makePostmarkRequest(`/senders/${signatureId}`, {
      method: 'PUT',
      body: JSON.stringify(params),
    })
  }

  async deleteSenderSignature(signatureId: number): Promise<IntegrationResponse<{ ErrorCode: number; Message: string }>> {
    return this.makePostmarkRequest(`/senders/${signatureId}`, {
      method: 'DELETE',
    })
  }

  async resendSenderSignatureConfirmation(signatureId: number): Promise<IntegrationResponse<{ ErrorCode: number; Message: string }>> {
    return this.makePostmarkRequest(`/senders/${signatureId}/resendconfirmation`, {
      method: 'POST',
    })
  }

  async verifySenderSignatureDKIM(signatureId: number): Promise<IntegrationResponse<PostmarkSender>> {
    return this.makePostmarkRequest(`/senders/${signatureId}/verifyDkim`, {
      method: 'PUT',
    })
  }

  async verifySenderSignatureReturnPath(signatureId: number): Promise<IntegrationResponse<PostmarkSender>> {
    return this.makePostmarkRequest(`/senders/${signatureId}/verifyReturnPath`, {
      method: 'PUT',
    })
  }

  // ============ Message Streams ============

  async listMessageStreams(params?: {
    MessageStreamType?: 'Transactional' | 'Inbound' | 'Broadcasts'
    IncludeArchivedStreams?: boolean
  }): Promise<IntegrationResponse<{ MessageStreams: PostmarkMessageStream[] }>> {
    const query = new URLSearchParams()
    if (params?.MessageStreamType) query.set('MessageStreamType', params.MessageStreamType)
    if (params?.IncludeArchivedStreams !== undefined) query.set('IncludeArchivedStreams', params.IncludeArchivedStreams.toString())

    return this.makePostmarkRequest(`/message-streams${query.toString() ? `?${query}` : ''}`)
  }

  async getMessageStream(streamId: string): Promise<IntegrationResponse<PostmarkMessageStream>> {
    return this.makePostmarkRequest(`/message-streams/${streamId}`)
  }

  async createMessageStream(params: {
    ID: string
    MessageStreamType: 'Transactional' | 'Broadcasts'
    Name: string
    Description?: string
  }): Promise<IntegrationResponse<PostmarkMessageStream>> {
    return this.makePostmarkRequest('/message-streams', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async updateMessageStream(streamId: string, params: {
    Name?: string
    Description?: string
  }): Promise<IntegrationResponse<PostmarkMessageStream>> {
    return this.makePostmarkRequest(`/message-streams/${streamId}`, {
      method: 'PATCH',
      body: JSON.stringify(params),
    })
  }

  async archiveMessageStream(streamId: string): Promise<IntegrationResponse<PostmarkMessageStream>> {
    return this.makePostmarkRequest(`/message-streams/${streamId}/archive`, {
      method: 'POST',
    })
  }

  async unarchiveMessageStream(streamId: string): Promise<IntegrationResponse<PostmarkMessageStream>> {
    return this.makePostmarkRequest(`/message-streams/${streamId}/unarchive`, {
      method: 'POST',
    })
  }

  // ============ Bounce Management ============

  async getDeliveryStats(): Promise<IntegrationResponse<{
    InactiveMails: number
    Bounces: Array<{ Name: string; Count: number; Type?: string }>
  }>> {
    return this.makePostmarkRequest('/deliverystats')
  }

  async getBounces(params?: {
    count?: number
    offset?: number
    type?: string
    inactive?: boolean
    emailFilter?: string
    tag?: string
    messageID?: string
    fromdate?: string
    todate?: string
    messageStream?: string
  }): Promise<IntegrationResponse<{ TotalCount: number; Bounces: PostmarkBounce[] }>> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.set(key, value.toString())
      })
    }

    return this.makePostmarkRequest(`/bounces${query.toString() ? `?${query}` : ''}`)
  }

  async getBounce(bounceId: number): Promise<IntegrationResponse<PostmarkBounce>> {
    return this.makePostmarkRequest(`/bounces/${bounceId}`)
  }

  async getBounceDump(bounceId: number): Promise<IntegrationResponse<{ Body: string }>> {
    return this.makePostmarkRequest(`/bounces/${bounceId}/dump`)
  }

  async activateBounce(bounceId: number): Promise<IntegrationResponse<PostmarkBounce>> {
    return this.makePostmarkRequest(`/bounces/${bounceId}/activate`, {
      method: 'PUT',
    })
  }

  async getBounceTags(): Promise<IntegrationResponse<string[]>> {
    return this.makePostmarkRequest('/bounces/tags')
  }

  // ============ Outbound Messages ============

  async getOutboundMessages(params?: {
    count?: number
    offset?: number
    recipient?: string
    fromemail?: string
    tag?: string
    status?: 'queued' | 'sent' | 'processed'
    fromdate?: string
    todate?: string
    subject?: string
    messageStream?: string
  }): Promise<IntegrationResponse<{ TotalCount: number; Messages: PostmarkOutboundMessage[] }>> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.set(key, value.toString())
      })
    }

    return this.makePostmarkRequest(`/messages/outbound${query.toString() ? `?${query}` : ''}`)
  }

  async getOutboundMessageDetails(messageId: string): Promise<IntegrationResponse<PostmarkOutboundMessage>> {
    return this.makePostmarkRequest(`/messages/outbound/${messageId}/details`)
  }

  async getOutboundMessageDump(messageId: string): Promise<IntegrationResponse<{ Body: string }>> {
    return this.makePostmarkRequest(`/messages/outbound/${messageId}/dump`)
  }

  async getMessageOpens(params?: {
    count?: number
    offset?: number
    recipient?: string
    tag?: string
    client_name?: string
    client_company?: string
    client_family?: string
    os_name?: string
    os_family?: string
    os_company?: string
    platform?: string
    country?: string
    region?: string
    city?: string
    messageStream?: string
  }): Promise<IntegrationResponse<{ TotalCount: number } & PostmarkMessageOpens>> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.set(key, value.toString())
      })
    }

    return this.makePostmarkRequest(`/messages/outbound/opens${query.toString() ? `?${query}` : ''}`)
  }

  async getMessageOpensForSingleMessage(messageId: string, params?: {
    count?: number
    offset?: number
  }): Promise<IntegrationResponse<{ TotalCount: number } & PostmarkMessageOpens>> {
    const query = new URLSearchParams()
    if (params?.count) query.set('count', params.count.toString())
    if (params?.offset) query.set('offset', params.offset.toString())

    return this.makePostmarkRequest(`/messages/outbound/opens/${messageId}${query.toString() ? `?${query}` : ''}`)
  }

  async getMessageClicks(params?: {
    count?: number
    offset?: number
    recipient?: string
    tag?: string
    client_name?: string
    client_company?: string
    client_family?: string
    os_name?: string
    os_family?: string
    os_company?: string
    platform?: string
    country?: string
    region?: string
    city?: string
    messageStream?: string
  }): Promise<IntegrationResponse<{ TotalCount: number } & PostmarkMessageClicks>> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.set(key, value.toString())
      })
    }

    return this.makePostmarkRequest(`/messages/outbound/clicks${query.toString() ? `?${query}` : ''}`)
  }

  async getMessageClicksForSingleMessage(messageId: string, params?: {
    count?: number
    offset?: number
  }): Promise<IntegrationResponse<{ TotalCount: number } & PostmarkMessageClicks>> {
    const query = new URLSearchParams()
    if (params?.count) query.set('count', params.count.toString())
    if (params?.offset) query.set('offset', params.offset.toString())

    return this.makePostmarkRequest(`/messages/outbound/clicks/${messageId}${query.toString() ? `?${query}` : ''}`)
  }

  // ============ Statistics ============

  async getOutboundOverview(params?: { tag?: string; fromdate?: string; todate?: string; messageStream?: string }): Promise<IntegrationResponse<PostmarkOutboundStats>> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.set(key, value.toString())
      })
    }

    return this.makePostmarkRequest(`/stats/outbound${query.toString() ? `?${query}` : ''}`)
  }

  async getSentCounts(params?: { tag?: string; fromdate?: string; todate?: string; messageStream?: string }): Promise<IntegrationResponse<PostmarkSentStats>> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.set(key, value.toString())
      })
    }

    return this.makePostmarkRequest(`/stats/outbound/sends${query.toString() ? `?${query}` : ''}`)
  }

  async getBounceCounts(params?: { tag?: string; fromdate?: string; todate?: string; messageStream?: string }): Promise<IntegrationResponse<PostmarkBounceStats>> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.set(key, value.toString())
      })
    }

    return this.makePostmarkRequest(`/stats/outbound/bounces${query.toString() ? `?${query}` : ''}`)
  }

  async getSpamComplaintsCounts(params?: { tag?: string; fromdate?: string; todate?: string; messageStream?: string }): Promise<IntegrationResponse<PostmarkSpamComplaintStats>> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.set(key, value.toString())
      })
    }

    return this.makePostmarkRequest(`/stats/outbound/spam${query.toString() ? `?${query}` : ''}`)
  }

  async getTrackedEmailCounts(params?: { tag?: string; fromdate?: string; todate?: string; messageStream?: string }): Promise<IntegrationResponse<PostmarkTrackedStats>> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.set(key, value.toString())
      })
    }

    return this.makePostmarkRequest(`/stats/outbound/tracked${query.toString() ? `?${query}` : ''}`)
  }

  async getEmailOpenCounts(params?: { tag?: string; fromdate?: string; todate?: string; messageStream?: string }): Promise<IntegrationResponse<PostmarkOpenStats>> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.set(key, value.toString())
      })
    }

    return this.makePostmarkRequest(`/stats/outbound/opens${query.toString() ? `?${query}` : ''}`)
  }

  async getEmailPlatformUsage(params?: { tag?: string; fromdate?: string; todate?: string; messageStream?: string }): Promise<IntegrationResponse<{ Days: Array<{ Date: string; [platform: string]: number | string }> }>> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.set(key, value.toString())
      })
    }

    return this.makePostmarkRequest(`/stats/outbound/opens/platforms${query.toString() ? `?${query}` : ''}`)
  }

  async getEmailClientUsage(params?: { tag?: string; fromdate?: string; todate?: string; messageStream?: string }): Promise<IntegrationResponse<{ Days: Array<{ Date: string; [client: string]: number | string }> }>> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.set(key, value.toString())
      })
    }

    return this.makePostmarkRequest(`/stats/outbound/opens/emailclients${query.toString() ? `?${query}` : ''}`)
  }

  async getEmailReadTimes(params?: { tag?: string; fromdate?: string; todate?: string; messageStream?: string }): Promise<IntegrationResponse<{ Days: Array<{ Date: string; [timeRange: string]: number | string }> }>> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.set(key, value.toString())
      })
    }

    return this.makePostmarkRequest(`/stats/outbound/opens/readtimes${query.toString() ? `?${query}` : ''}`)
  }

  async getClickCounts(params?: { tag?: string; fromdate?: string; todate?: string; messageStream?: string }): Promise<IntegrationResponse<PostmarkClickStats>> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.set(key, value.toString())
      })
    }

    return this.makePostmarkRequest(`/stats/outbound/clicks${query.toString() ? `?${query}` : ''}`)
  }

  async getClickBrowserFamilies(params?: { tag?: string; fromdate?: string; todate?: string; messageStream?: string }): Promise<IntegrationResponse<{ Days: Array<{ Date: string; [browser: string]: number | string }> }>> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.set(key, value.toString())
      })
    }

    return this.makePostmarkRequest(`/stats/outbound/clicks/browserfamilies${query.toString() ? `?${query}` : ''}`)
  }

  async getClickLocation(params?: { tag?: string; fromdate?: string; todate?: string; messageStream?: string }): Promise<IntegrationResponse<{ Days: Array<{ Date: string; [location: string]: number | string }> }>> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.set(key, value.toString())
      })
    }

    return this.makePostmarkRequest(`/stats/outbound/clicks/location${query.toString() ? `?${query}` : ''}`)
  }

  // ============ Suppression Management ============

  async getSuppressions(params?: {
    SuppressionReason?: 'HardBounce' | 'SpamComplaint' | 'ManualSuppression'
    Origin?: 'Recipient' | 'Customer'
    EmailAddress?: string
    FromDate?: string
    ToDate?: string
    Count?: number
    Offset?: number
  }): Promise<IntegrationResponse<{ Suppressions: PostmarkSuppression[] }>> {
    const query = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.set(key, value.toString())
      })
    }

    return this.makePostmarkRequest(`/suppressions/dump${query.toString() ? `?${query}` : ''}`)
  }

  async createSuppressions(params: {
    Suppressions: Array<{
      EmailAddress: string
      SuppressionReason: 'HardBounce' | 'SpamComplaint' | 'ManualSuppression'
    }>
  }): Promise<IntegrationResponse<{ Suppressions: PostmarkSuppression[] }>> {
    return this.makePostmarkRequest('/suppressions', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async deleteSuppressions(params: {
    Suppressions: Array<{ EmailAddress: string }>
  }): Promise<IntegrationResponse<{ Suppressions: Array<{ EmailAddress: string; Status: string }> }>> {
    return this.makePostmarkRequest('/suppressions/delete', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  // ============ Triggers (Inbound Rules) ============

  async listInboundRuleTriggers(params?: { count?: number; offset?: number }): Promise<IntegrationResponse<{
    TotalCount: number
    InboundRules: Array<{
      ID: number
      Rule: string
    }>
  }>> {
    const query = new URLSearchParams()
    if (params?.count) query.set('count', params.count.toString())
    if (params?.offset) query.set('offset', params.offset.toString())

    return this.makePostmarkRequest(`/triggers/inboundrules${query.toString() ? `?${query}` : ''}`)
  }

  async createInboundRuleTrigger(rule: string): Promise<IntegrationResponse<{ ID: number; Rule: string }>> {
    return this.makePostmarkRequest('/triggers/inboundrules', {
      method: 'POST',
      body: JSON.stringify({ Rule: rule }),
    })
  }

  async deleteInboundRuleTrigger(triggerId: number): Promise<IntegrationResponse<{ ErrorCode: number; Message: string }>> {
    return this.makePostmarkRequest(`/triggers/inboundrules/${triggerId}`, {
      method: 'DELETE',
    })
  }
}
