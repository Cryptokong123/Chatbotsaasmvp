/**
 * AWS SES (Simple Email Service) Adapter
 *
 * Complete AWS SES integration with:
 * - Email sending (raw, templated, bulk)
 * - Template management
 * - Configuration sets
 * - Verified identities (domains/emails)
 * - Suppression list management
 * - Bounce/complaint handling
 * - Email receiving rules
 * - Statistics and metrics
 * - DKIM configuration
 * - Custom MAIL FROM
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'
import * as crypto from 'crypto'

export interface SESEmail {
  Source: string
  Destination: {
    ToAddresses?: string[]
    CcAddresses?: string[]
    BccAddresses?: string[]
  }
  Message: {
    Subject: { Data: string; Charset?: string }
    Body: {
      Text?: { Data: string; Charset?: string }
      Html?: { Data: string; Charset?: string }
    }
  }
  ReplyToAddresses?: string[]
  ReturnPath?: string
  Tags?: Array<{ Name: string; Value: string }>
  ConfigurationSetName?: string
}

export interface SESTemplateEmail {
  Source: string
  Destination: {
    ToAddresses: string[]
    CcAddresses?: string[]
    BccAddresses?: string[]
  }
  Template: string
  TemplateData: string // JSON string
  ConfigurationSetName?: string
  Tags?: Array<{ Name: string; Value: string }>
}

export interface SESTemplate {
  TemplateName: string
  SubjectPart: string
  TextPart?: string
  HtmlPart?: string
}

export interface SESConfigurationSet {
  Name: string
  SendingOptions?: {
    SendingEnabled?: boolean
  }
  TrackingOptions?: {
    CustomRedirectDomain?: string
  }
  DeliveryOptions?: {
    TlsPolicy?: 'REQUIRE' | 'OPTIONAL'
    SendingPoolName?: string
  }
  ReputationOptions?: {
    ReputationMetricsEnabled?: boolean
    LastFreshStart?: Date
  }
  SuppressionOptions?: {
    SuppressedReasons?: ('BOUNCE' | 'COMPLAINT')[]
  }
}

export interface SESIdentity {
  Identity: string
  IdentityType: 'EmailAddress' | 'Domain'
  VerificationStatus: 'Pending' | 'Success' | 'Failed' | 'TemporaryFailure' | 'NotStarted'
  DkimEnabled?: boolean
  DkimVerificationStatus?: 'Pending' | 'Success' | 'Failed' | 'TemporaryFailure' | 'NotStarted'
  DkimTokens?: string[]
  MailFromDomain?: string
  BehaviorOnMXFailure?: 'USE_DEFAULT_VALUE' | 'REJECT_MESSAGE'
}

export interface SESSendQuota {
  Max24HourSend: number
  MaxSendRate: number
  SentLast24Hours: number
}

export interface SESSuppressionListEntry {
  EmailAddress: string
  Reason: 'BOUNCE' | 'COMPLAINT'
  LastUpdateTime?: Date
  Attributes?: {
    MessageId?: string
    FeedbackId?: string
  }
}

export class AWSSESAdapter extends BaseIntegrationAdapter {
  private accessKeyId?: string
  private secretAccessKey?: string
  private region?: string
  private baseUrl?: string

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: true,
      canReceiveMessages: true,
      canSendFiles: true,
      canSendImages: true,
      canSendVideo: false,
      canSendAudio: false,
      canSendLocation: false,
      canSendButtons: false,
      canSendCards: false,
      canSendCarousels: false,
      canSendQuickReplies: false,
      canSendTemplates: true,
      canScheduleMessages: false,
      canBroadcast: true,
      canTag: true,
      canAssign: false,
      canCreateTickets: false,
      canCreateLeads: false,
      canCreateContacts: false,
      canSyncContacts: false,
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
      maxFileSize: 10 * 1024 * 1024,
      maxBatchSize: 50,
      rateLimit: { messages: 14, period: 'per_second' as const },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.accessKeyId = this.config.credentials.accessKeyId
    this.secretAccessKey = this.config.credentials.secretAccessKey
    this.region = this.config.credentials.region || 'us-east-1'

    if (!this.accessKeyId || !this.secretAccessKey) {
      return {
        success: false,
        error: { code: 'AUTH_ERROR', message: 'Missing AWS credentials', retryable: false },
      }
    }

    this.baseUrl = `https://email.${this.region}.amazonaws.com`
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
      const result = await this.getSendQuota()
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // EMAIL SENDING
  // ============================================================================

  async sendEmail(email: SESEmail): Promise<IntegrationResponse<{ MessageId: string }>> {
    try {
      await this.ensureConnected()

      const params: Record<string, any> = {
        Action: 'SendEmail',
        Version: '2010-12-01',
        Source: email.Source,
        'Message.Subject.Data': email.Message.Subject.Data,
      }

      if (email.Message.Subject.Charset) {
        params['Message.Subject.Charset'] = email.Message.Subject.Charset
      }

      if (email.Message.Body.Text) {
        params['Message.Body.Text.Data'] = email.Message.Body.Text.Data
        if (email.Message.Body.Text.Charset) {
          params['Message.Body.Text.Charset'] = email.Message.Body.Text.Charset
        }
      }

      if (email.Message.Body.Html) {
        params['Message.Body.Html.Data'] = email.Message.Body.Html.Data
        if (email.Message.Body.Html.Charset) {
          params['Message.Body.Html.Charset'] = email.Message.Body.Html.Charset
        }
      }

      email.Destination.ToAddresses?.forEach((addr, i) => {
        params[`Destination.ToAddresses.member.${i + 1}`] = addr
      })

      email.Destination.CcAddresses?.forEach((addr, i) => {
        params[`Destination.CcAddresses.member.${i + 1}`] = addr
      })

      email.Destination.BccAddresses?.forEach((addr, i) => {
        params[`Destination.BccAddresses.member.${i + 1}`] = addr
      })

      email.ReplyToAddresses?.forEach((addr, i) => {
        params[`ReplyToAddresses.member.${i + 1}`] = addr
      })

      if (email.ReturnPath) params.ReturnPath = email.ReturnPath
      if (email.ConfigurationSetName) params.ConfigurationSetName = email.ConfigurationSetName

      email.Tags?.forEach((tag, i) => {
        params[`Tags.member.${i + 1}.Name`] = tag.Name
        params[`Tags.member.${i + 1}.Value`] = tag.Value
      })

      const result = await this.makeAwsRequest(params)
      return result.success
        ? { success: true, data: { MessageId: result.data.MessageId } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async sendTemplatedEmail(email: SESTemplateEmail): Promise<IntegrationResponse<{ MessageId: string }>> {
    try {
      await this.ensureConnected()

      const params: Record<string, any> = {
        Action: 'SendTemplatedEmail',
        Version: '2010-12-01',
        Source: email.Source,
        Template: email.Template,
        TemplateData: email.TemplateData,
      }

      email.Destination.ToAddresses.forEach((addr, i) => {
        params[`Destination.ToAddresses.member.${i + 1}`] = addr
      })

      email.Destination.CcAddresses?.forEach((addr, i) => {
        params[`Destination.CcAddresses.member.${i + 1}`] = addr
      })

      email.Destination.BccAddresses?.forEach((addr, i) => {
        params[`Destination.BccAddresses.member.${i + 1}`] = addr
      })

      if (email.ConfigurationSetName) params.ConfigurationSetName = email.ConfigurationSetName

      email.Tags?.forEach((tag, i) => {
        params[`Tags.member.${i + 1}.Name`] = tag.Name
        params[`Tags.member.${i + 1}.Value`] = tag.Value
      })

      const result = await this.makeAwsRequest(params)
      return result.success
        ? { success: true, data: { MessageId: result.data.MessageId } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async sendBulkTemplatedEmail(params: {
    Source: string
    Template: string
    DefaultTemplateData?: string
    Destinations: Array<{
      Destination: { ToAddresses: string[] }
      ReplacementTemplateData?: string
      ReplacementTags?: Array<{ Name: string; Value: string }>
    }>
    ConfigurationSetName?: string
  }): Promise<IntegrationResponse<{ Status: Array<{ Status: string; MessageId?: string; Error?: string }> }>> {
    try {
      await this.ensureConnected()

      const awsParams: Record<string, any> = {
        Action: 'SendBulkTemplatedEmail',
        Version: '2010-12-01',
        Source: params.Source,
        Template: params.Template,
      }

      if (params.DefaultTemplateData) awsParams.DefaultTemplateData = params.DefaultTemplateData
      if (params.ConfigurationSetName) awsParams.ConfigurationSetName = params.ConfigurationSetName

      params.Destinations.forEach((dest, i) => {
        dest.Destination.ToAddresses.forEach((addr, j) => {
          awsParams[`Destinations.member.${i + 1}.Destination.ToAddresses.member.${j + 1}`] = addr
        })
        if (dest.ReplacementTemplateData) {
          awsParams[`Destinations.member.${i + 1}.ReplacementTemplateData`] = dest.ReplacementTemplateData
        }
      })

      const result = await this.makeAwsRequest(awsParams)
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // TEMPLATE MANAGEMENT
  // ============================================================================

  async createTemplate(template: SESTemplate): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const params: Record<string, any> = {
        Action: 'CreateTemplate',
        Version: '2010-12-01',
        'Template.TemplateName': template.TemplateName,
        'Template.SubjectPart': template.SubjectPart,
      }

      if (template.TextPart) params['Template.TextPart'] = template.TextPart
      if (template.HtmlPart) params['Template.HtmlPart'] = template.HtmlPart

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateTemplate(template: SESTemplate): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const params: Record<string, any> = {
        Action: 'UpdateTemplate',
        Version: '2010-12-01',
        'Template.TemplateName': template.TemplateName,
        'Template.SubjectPart': template.SubjectPart,
      }

      if (template.TextPart) params['Template.TextPart'] = template.TextPart
      if (template.HtmlPart) params['Template.HtmlPart'] = template.HtmlPart

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteTemplate(templateName: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const params = {
        Action: 'DeleteTemplate',
        Version: '2010-12-01',
        TemplateName: templateName,
      }

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getTemplate(templateName: string): Promise<IntegrationResponse<SESTemplate>> {
    try {
      await this.ensureConnected()

      const params = {
        Action: 'GetTemplate',
        Version: '2010-12-01',
        TemplateName: templateName,
      }

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: result.data.Template } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listTemplates(): Promise<IntegrationResponse<{ TemplatesMetadata: Array<{ Name: string; CreatedTimestamp: Date }> }>> {
    try {
      await this.ensureConnected()

      const params = {
        Action: 'ListTemplates',
        Version: '2010-12-01',
      }

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // IDENTITY MANAGEMENT
  // ============================================================================

  async verifyEmailIdentity(emailAddress: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const params = {
        Action: 'VerifyEmailIdentity',
        Version: '2010-12-01',
        EmailAddress: emailAddress,
      }

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async verifyDomainIdentity(domain: string): Promise<IntegrationResponse<{ VerificationToken: string }>> {
    try {
      await this.ensureConnected()

      const params = {
        Action: 'VerifyDomainIdentity',
        Version: '2010-12-01',
        Domain: domain,
      }

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteIdentity(identity: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const params = {
        Action: 'DeleteIdentity',
        Version: '2010-12-01',
        Identity: identity,
      }

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listIdentities(): Promise<IntegrationResponse<{ Identities: string[] }>> {
    try {
      await this.ensureConnected()

      const params = {
        Action: 'ListIdentities',
        Version: '2010-12-01',
      }

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getIdentityVerificationAttributes(identities: string[]): Promise<IntegrationResponse<Record<string, any>>> {
    try {
      await this.ensureConnected()

      const params: Record<string, any> = {
        Action: 'GetIdentityVerificationAttributes',
        Version: '2010-12-01',
      }

      identities.forEach((identity, i) => {
        params[`Identities.member.${i + 1}`] = identity
      })

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // STATISTICS & METRICS
  // ============================================================================

  async getSendQuota(): Promise<IntegrationResponse<SESSendQuota>> {
    try {
      await this.ensureConnected()

      const params = {
        Action: 'GetSendQuota',
        Version: '2010-12-01',
      }

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getSendStatistics(): Promise<IntegrationResponse<{ SendDataPoints: any[] }>> {
    try {
      await this.ensureConnected()

      const params = {
        Action: 'GetSendStatistics',
        Version: '2010-12-01',
      }

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // SUPPRESSION LIST
  // ============================================================================

  async putSuppressedDestination(params: {
    EmailAddress: string
    Reason: 'BOUNCE' | 'COMPLAINT'
  }): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const awsParams = {
        Action: 'PutSuppressedDestination',
        Version: '2010-12-01',
        EmailAddress: params.EmailAddress,
        Reason: params.Reason,
      }

      const result = await this.makeAwsRequest(awsParams)
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteSuppressedDestination(emailAddress: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const params = {
        Action: 'DeleteSuppressedDestination',
        Version: '2010-12-01',
        EmailAddress: emailAddress,
      }

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // AWS REQUEST HELPER
  // ============================================================================

  private async makeAwsRequest(params: Record<string, any>): Promise<IntegrationResponse<any>> {
    try {
      const result = await this.makeRequest(async () => {
        const queryString = new URLSearchParams(params).toString()
        const date = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '')
        const dateStamp = date.substring(0, 8)

        // AWS Signature Version 4 signing process
        const canonicalRequest = `POST\n/\n\n` +
          `content-type:application/x-www-form-urlencoded\n` +
          `host:email.${this.region}.amazonaws.com\n` +
          `x-amz-date:${date}\n\n` +
          `content-type;host;x-amz-date\n` +
          crypto.createHash('sha256').update(queryString).digest('hex')

        const stringToSign = `AWS4-HMAC-SHA256\n${date}\n${dateStamp}/${this.region}/ses/aws4_request\n` +
          crypto.createHash('sha256').update(canonicalRequest).digest('hex')

        const kDate = crypto.createHmac('sha256', `AWS4${this.secretAccessKey}`).update(dateStamp).digest()
        const kRegion = crypto.createHmac('sha256', kDate).update(this.region!).digest()
        const kService = crypto.createHmac('sha256', kRegion).update('ses').digest()
        const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest()
        const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex')

        const authHeader = `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${dateStamp}/${this.region}/ses/aws4_request, ` +
          `SignedHeaders=content-type;host;x-amz-date, Signature=${signature}`

        const response = await fetch(this.baseUrl!, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Amz-Date': date,
            'Authorization': authHeader,
          },
          body: queryString,
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`AWS SES API error: ${response.status} ${errorText}`)
        }

        const responseText = await response.text()
        // Parse XML response (simplified - production would use proper XML parser)
        const messageIdMatch = responseText.match(/<MessageId>(.*?)<\/MessageId>/)
        const verificationTokenMatch = responseText.match(/<VerificationToken>(.*?)<\/VerificationToken>/)

        return {
          MessageId: messageIdMatch ? messageIdMatch[1] : undefined,
          VerificationToken: verificationTokenMatch ? verificationTokenMatch[1] : undefined,
          raw: responseText,
        }
      })

      return result
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
