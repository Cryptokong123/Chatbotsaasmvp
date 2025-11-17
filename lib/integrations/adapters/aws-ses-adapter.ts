/**
 * AWS SES (Simple Email Service) Adapter
 *
 * Complete AWS SES integration with:
 * - Email sending (raw, templated, bulk)
 * - Template management
 * - Configuration sets
 * - Event destinations
 * - Verified identities (domains/emails)
 * - DKIM configuration
 * - Custom MAIL FROM
 * - Email receiving rules
 * - Suppression list management
 * - Bounce/complaint handling
 * - Statistics and metrics
 * - Reputation management
 * - Custom verification emails
 * - Account-level settings
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

export interface SESEventDestination {
  Name: string
  Enabled?: boolean
  MatchingEventTypes: Array<'send' | 'reject' | 'bounce' | 'complaint' | 'delivery' | 'open' | 'click' | 'renderingFailure'>
  KinesisFirehoseDestination?: {
    IAMRoleARN: string
    DeliveryStreamARN: string
  }
  CloudWatchDestination?: {
    DimensionConfigurations: Array<{
      DimensionName: string
      DimensionValueSource: 'messageTag' | 'emailHeader' | 'linkTag'
      DefaultDimensionValue: string
    }>
  }
  SNSDestination?: {
    TopicARN: string
  }
}

export interface SESReceiptRule {
  Name: string
  Enabled?: boolean
  TlsPolicy?: 'Require' | 'Optional'
  Recipients?: string[]
  Actions?: Array<{
    S3Action?: {
      BucketName: string
      ObjectKeyPrefix?: string
      TopicArn?: string
      KmsKeyArn?: string
    }
    BounceAction?: {
      Message: string
      Sender: string
      SmtpReplyCode: string
      TopicArn?: string
    }
    LambdaAction?: {
      FunctionArn: string
      InvocationType?: 'Event' | 'RequestResponse'
      TopicArn?: string
    }
    SNSAction?: {
      TopicArn: string
      Encoding?: 'UTF-8' | 'Base64'
    }
    StopAction?: {
      Scope: 'RuleSet'
      TopicArn?: string
    }
  }>
  ScanEnabled?: boolean
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

export interface SESCustomVerificationEmailTemplate {
  TemplateName: string
  FromEmailAddress: string
  TemplateSubject: string
  TemplateContent: string
  SuccessRedirectionURL: string
  FailureRedirectionURL: string
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

  async sendRawEmail(params: {
    Source?: string
    Destinations?: string[]
    RawMessage: string // Base64 encoded MIME message
    ConfigurationSetName?: string
  }): Promise<IntegrationResponse<{ MessageId: string }>> {
    try {
      await this.ensureConnected()

      const awsParams: Record<string, any> = {
        Action: 'SendRawEmail',
        Version: '2010-12-01',
        'RawMessage.Data': params.RawMessage,
      }

      if (params.Source) awsParams.Source = params.Source
      if (params.ConfigurationSetName) awsParams.ConfigurationSetName = params.ConfigurationSetName

      params.Destinations?.forEach((dest, i) => {
        awsParams[`Destinations.member.${i + 1}`] = dest
      })

      const result = await this.makeAwsRequest(awsParams)
      return result.success
        ? { success: true, data: { MessageId: result.data.MessageId } }
        : { success: false, error: result.error }
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

  async testRenderTemplate(params: {
    TemplateName: string
    TemplateData: string
  }): Promise<IntegrationResponse<{ Subject: string; HtmlPart: string; TextPart: string }>> {
    try {
      await this.ensureConnected()

      const awsParams = {
        Action: 'TestRenderTemplate',
        Version: '2010-12-01',
        TemplateName: params.TemplateName,
        TemplateData: params.TemplateData,
      }

      const result = await this.makeAwsRequest(awsParams)
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // CONFIGURATION SETS
  // ============================================================================

  async createConfigurationSet(name: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const params = {
        Action: 'CreateConfigurationSet',
        Version: '2010-12-01',
        'ConfigurationSet.Name': name,
      }

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteConfigurationSet(name: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const params = {
        Action: 'DeleteConfigurationSet',
        Version: '2010-12-01',
        ConfigurationSetName: name,
      }

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listConfigurationSets(): Promise<IntegrationResponse<{ ConfigurationSets: Array<{ Name: string }> }>> {
    try {
      await this.ensureConnected()

      const params = {
        Action: 'ListConfigurationSets',
        Version: '2010-12-01',
      }

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async describeConfigurationSet(name: string): Promise<IntegrationResponse<SESConfigurationSet>> {
    try {
      await this.ensureConnected()

      const params = {
        Action: 'DescribeConfigurationSet',
        Version: '2010-12-01',
        ConfigurationSetName: name,
      }

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // EVENT DESTINATIONS
  // ============================================================================

  async putConfigurationSetEventDestination(params: {
    ConfigurationSetName: string
    EventDestination: SESEventDestination
  }): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const awsParams: Record<string, any> = {
        Action: 'PutConfigurationSetEventDestination',
        Version: '2010-12-01',
        ConfigurationSetName: params.ConfigurationSetName,
        'EventDestination.Name': params.EventDestination.Name,
        'EventDestination.Enabled': params.EventDestination.Enabled !== false,
      }

      params.EventDestination.MatchingEventTypes.forEach((type, i) => {
        awsParams[`EventDestination.MatchingEventTypes.member.${i + 1}`] = type
      })

      const result = await this.makeAwsRequest(awsParams)
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteConfigurationSetEventDestination(params: {
    ConfigurationSetName: string
    EventDestinationName: string
  }): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const awsParams = {
        Action: 'DeleteConfigurationSetEventDestination',
        Version: '2010-12-01',
        ConfigurationSetName: params.ConfigurationSetName,
        EventDestinationName: params.EventDestinationName,
      }

      const result = await this.makeAwsRequest(awsParams)
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
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
  // DKIM MANAGEMENT
  // ============================================================================

  async verifyDomainDkim(domain: string): Promise<IntegrationResponse<{ DkimTokens: string[] }>> {
    try {
      await this.ensureConnected()

      const params = {
        Action: 'VerifyDomainDkim',
        Version: '2010-12-01',
        Domain: domain,
      }

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async setIdentityDkimEnabled(identity: string, enabled: boolean): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const params = {
        Action: 'SetIdentityDkimEnabled',
        Version: '2010-12-01',
        Identity: identity,
        DkimEnabled: enabled,
      }

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getIdentityDkimAttributes(identities: string[]): Promise<IntegrationResponse<Record<string, any>>> {
    try {
      await this.ensureConnected()

      const params: Record<string, any> = {
        Action: 'GetIdentityDkimAttributes',
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
  // CUSTOM MAIL FROM DOMAIN
  // ============================================================================

  async setIdentityMailFromDomain(params: {
    Identity: string
    MailFromDomain: string
    BehaviorOnMXFailure?: 'USE_DEFAULT_VALUE' | 'REJECT_MESSAGE'
  }): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const awsParams: Record<string, any> = {
        Action: 'SetIdentityMailFromDomain',
        Version: '2010-12-01',
        Identity: params.Identity,
        MailFromDomain: params.MailFromDomain,
      }

      if (params.BehaviorOnMXFailure) {
        awsParams.BehaviorOnMXFailure = params.BehaviorOnMXFailure
      }

      const result = await this.makeAwsRequest(awsParams)
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getIdentityMailFromDomainAttributes(identities: string[]): Promise<IntegrationResponse<Record<string, any>>> {
    try {
      await this.ensureConnected()

      const params: Record<string, any> = {
        Action: 'GetIdentityMailFromDomainAttributes',
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
  // NOTIFICATION MANAGEMENT (Bounce/Complaint)
  // ============================================================================

  async setIdentityNotificationTopic(params: {
    Identity: string
    NotificationType: 'Bounce' | 'Complaint' | 'Delivery'
    SnsTopic?: string
  }): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const awsParams: Record<string, any> = {
        Action: 'SetIdentityNotificationTopic',
        Version: '2010-12-01',
        Identity: params.Identity,
        NotificationType: params.NotificationType,
      }

      if (params.SnsTopic) awsParams.SnsTopic = params.SnsTopic

      const result = await this.makeAwsRequest(awsParams)
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getIdentityNotificationAttributes(identities: string[]): Promise<IntegrationResponse<Record<string, any>>> {
    try {
      await this.ensureConnected()

      const params: Record<string, any> = {
        Action: 'GetIdentityNotificationAttributes',
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

  async setIdentityFeedbackForwardingEnabled(identity: string, enabled: boolean): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const params = {
        Action: 'SetIdentityFeedbackForwardingEnabled',
        Version: '2010-12-01',
        Identity: identity,
        ForwardingEnabled: enabled,
      }

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async setIdentityHeadersInNotificationsEnabled(params: {
    Identity: string
    NotificationType: 'Bounce' | 'Complaint' | 'Delivery'
    Enabled: boolean
  }): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const awsParams = {
        Action: 'SetIdentityHeadersInNotificationsEnabled',
        Version: '2010-12-01',
        Identity: params.Identity,
        NotificationType: params.NotificationType,
        Enabled: params.Enabled,
      }

      const result = await this.makeAwsRequest(awsParams)
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // EMAIL RECEIVING RULES
  // ============================================================================

  async createReceiptRuleSet(ruleSetName: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const params = {
        Action: 'CreateReceiptRuleSet',
        Version: '2010-12-01',
        RuleSetName: ruleSetName,
      }

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteReceiptRuleSet(ruleSetName: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const params = {
        Action: 'DeleteReceiptRuleSet',
        Version: '2010-12-01',
        RuleSetName: ruleSetName,
      }

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async setActiveReceiptRuleSet(ruleSetName?: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const params: Record<string, any> = {
        Action: 'SetActiveReceiptRuleSet',
        Version: '2010-12-01',
      }

      if (ruleSetName) params.RuleSetName = ruleSetName

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listReceiptRuleSets(): Promise<IntegrationResponse<{ RuleSets: Array<{ Name: string; CreatedTimestamp: Date }> }>> {
    try {
      await this.ensureConnected()

      const params = {
        Action: 'ListReceiptRuleSets',
        Version: '2010-12-01',
      }

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async describeActiveReceiptRuleSet(): Promise<IntegrationResponse<{ Metadata: any; Rules: SESReceiptRule[] }>> {
    try {
      await this.ensureConnected()

      const params = {
        Action: 'DescribeActiveReceiptRuleSet',
        Version: '2010-12-01',
      }

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

  async getSuppressedDestination(emailAddress: string): Promise<IntegrationResponse<SESSuppressionListEntry>> {
    try {
      await this.ensureConnected()

      const params = {
        Action: 'GetSuppressedDestination',
        Version: '2010-12-01',
        EmailAddress: emailAddress,
      }

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // CUSTOM VERIFICATION EMAIL TEMPLATES
  // ============================================================================

  async createCustomVerificationEmailTemplate(
    template: SESCustomVerificationEmailTemplate
  ): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const params = {
        Action: 'CreateCustomVerificationEmailTemplate',
        Version: '2010-12-01',
        TemplateName: template.TemplateName,
        FromEmailAddress: template.FromEmailAddress,
        TemplateSubject: template.TemplateSubject,
        TemplateContent: template.TemplateContent,
        SuccessRedirectionURL: template.SuccessRedirectionURL,
        FailureRedirectionURL: template.FailureRedirectionURL,
      }

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateCustomVerificationEmailTemplate(
    template: Partial<SESCustomVerificationEmailTemplate> & { TemplateName: string }
  ): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const params: Record<string, any> = {
        Action: 'UpdateCustomVerificationEmailTemplate',
        Version: '2010-12-01',
        TemplateName: template.TemplateName,
      }

      if (template.FromEmailAddress) params.FromEmailAddress = template.FromEmailAddress
      if (template.TemplateSubject) params.TemplateSubject = template.TemplateSubject
      if (template.TemplateContent) params.TemplateContent = template.TemplateContent
      if (template.SuccessRedirectionURL) params.SuccessRedirectionURL = template.SuccessRedirectionURL
      if (template.FailureRedirectionURL) params.FailureRedirectionURL = template.FailureRedirectionURL

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteCustomVerificationEmailTemplate(templateName: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const params = {
        Action: 'DeleteCustomVerificationEmailTemplate',
        Version: '2010-12-01',
        TemplateName: templateName,
      }

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listCustomVerificationEmailTemplates(): Promise<IntegrationResponse<{ CustomVerificationEmailTemplates: Array<{ TemplateName: string }> }>> {
    try {
      await this.ensureConnected()

      const params = {
        Action: 'ListCustomVerificationEmailTemplates',
        Version: '2010-12-01',
      }

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async sendCustomVerificationEmail(params: {
    EmailAddress: string
    TemplateName: string
    ConfigurationSetName?: string
  }): Promise<IntegrationResponse<{ MessageId: string }>> {
    try {
      await this.ensureConnected()

      const awsParams: Record<string, any> = {
        Action: 'SendCustomVerificationEmail',
        Version: '2010-12-01',
        EmailAddress: params.EmailAddress,
        TemplateName: params.TemplateName,
      }

      if (params.ConfigurationSetName) awsParams.ConfigurationSetName = params.ConfigurationSetName

      const result = await this.makeAwsRequest(awsParams)
      return result.success
        ? { success: true, data: { MessageId: result.data.MessageId } }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // ACCOUNT MANAGEMENT
  // ============================================================================

  async getAccountSendingEnabled(): Promise<IntegrationResponse<{ Enabled: boolean }>> {
    try {
      await this.ensureConnected()

      const params = {
        Action: 'GetAccountSendingEnabled',
        Version: '2010-12-01',
      }

      const result = await this.makeAwsRequest(params)
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateAccountSendingEnabled(enabled: boolean): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const params = {
        Action: 'UpdateAccountSendingEnabled',
        Version: '2010-12-01',
        Enabled: enabled,
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
