/**
 * Comprehensive Integration Types
 *
 * Production-grade types for 300+ integrations across all categories
 */

// ============================================================================
// INTEGRATION CATEGORIES
// ============================================================================

export type IntegrationCategory =
  | 'messaging'          // WhatsApp, Telegram, Slack, etc.
  | 'social'             // Facebook, Instagram, Twitter, LinkedIn, etc.
  | 'crm'                // Salesforce, HubSpot, Zendesk, etc.
  | 'support'            // Freshdesk, Intercom, Drift, etc.
  | 'ecommerce'          // Shopify, WooCommerce, Magento, etc.
  | 'payment'            // Stripe, PayPal, Square, etc.
  | 'accounting'         // QuickBooks, Xero, NetSuite, etc.
  | 'marketing'          // Mailchimp, SendGrid, ActiveCampaign, etc.
  | 'analytics'          // Google Analytics, Mixpanel, Amplitude, etc.
  | 'productivity'       // Notion, Airtable, Google Workspace, etc.
  | 'project_management' // Jira, Asana, Monday.com, etc.
  | 'hr'                 // BambooHR, Workday, Gusto, etc.
  | 'communication'      // Zoom, Teams, Webex, etc.
  | 'voice'              // Twilio, Amazon Connect, etc.
  | 'sms'                // Twilio, Vonage, Plivo, etc.
  | 'email'              // SendGrid, AWS SES, Mailgun, etc.
  | 'calendar'           // Google Calendar, Outlook, Calendly, etc.
  | 'storage'            // Dropbox, Google Drive, Box, etc.
  | 'database'           // MongoDB, PostgreSQL, MySQL, etc.
  | 'ai'                 // OpenAI, Anthropic, Cohere, etc.
  | 'automation'         // Zapier, Make, n8n, etc.
  | 'forms'              // Typeform, Google Forms, Jotform, etc.
  | 'legal'              // DocuSign, Clio, PandaDoc, etc.
  | 'education'          // Teachable, Thinkific, Kajabi, etc.
  | 'real_estate'        // Zillow, MLS, etc.
  | 'healthcare'         // HealthKit, FHIR, etc.
  | 'iot'                // AWS IoT, Google IoT, etc.
  | 'blockchain'         // Ethereum, Solana, etc.
  | 'custom'             // Custom integrations

// ============================================================================
// ALL SUPPORTED INTEGRATIONS (300+)
// ============================================================================

export type IntegrationType =
  // Messaging Platforms
  | 'whatsapp' | 'telegram' | 'slack' | 'discord' | 'teams' | 'messenger'
  | 'instagram' | 'wechat' | 'line' | 'viber' | 'kakao' | 'skype' | 'zoom'
  | 'webex' | 'google_chat' | 'rocket_chat' | 'mattermost' | 'matrix' | 'irc'
  | 'signal' | 'threema' | 'rcs' | 'imessage'

  // Social Media
  | 'twitter' | 'linkedin' | 'facebook' | 'instagram_business' | 'tiktok'
  | 'pinterest' | 'reddit' | 'snapchat' | 'youtube' | 'twitch' | 'vimeo'
  | 'buffer' | 'hootsuite' | 'sprout_social' | 'later'

  // CRM Systems
  | 'salesforce' | 'hubspot' | 'zoho_crm' | 'pipedrive' | 'copper'
  | 'close' | 'insightly' | 'nimble' | 'capsule' | 'agile_crm'
  | 'dynamics_365' | 'sap_crm' | 'oracle_cx' | 'sugar_crm' | 'attio'
  | 'folk' | 'affinity' | 'freshsales' | 'zendesk_sell'

  // Support/Helpdesk
  | 'zendesk' | 'freshdesk' | 'freshchat' | 'intercom' | 'drift'
  | 'servicenow' | 'help_scout' | 'front' | 'missive' | 'hiver'
  | 'freshservice' | 'zendesk_sunshine' | 'zoho_desk'
  | 'gorgias' | 'reamaze' | 'kustomer' | 'gladly' | 'richpanel'
  | 'liveagent' | 'kayako' | 'crisp' | 'tawk' | 'livechat'
  | 'olark' | 'pure_chat' | 'tidio' | 'userlike' | 'smartsupp'
  | 'ada' | 'manychat' | 'mobilemonkey' | 'chatfuel' | 'landbot'
  | 'collect_chat' | 'reve_chat' | 'acquire' | 'comm100' | 'snapengage'
  | 'bold360' | 'respond_io' | 'smooch' | 'stream_chat' | 'sendbird'

  // E-commerce
  | 'shopify' | 'woocommerce' | 'magento' | 'bigcommerce' | 'prestashop'
  | 'opencart' | 'wix_stores' | 'squarespace_commerce' | 'amazon_seller'
  | 'ebay' | 'etsy' | 'walmart_marketplace' | 'target_plus'

  // Payment Processing
  | 'stripe' | 'paypal' | 'square' | 'braintree' | 'adyen' | 'klarna'
  | 'afterpay' | 'affirm' | 'razorpay' | 'payu' | 'mollie' | 'checkout'
  | 'authorize_net' | 'worldpay' | 'sage_pay' | 'bambora' | 'paddle'
  | 'lemonsqueezy' | 'fastspring' | 'gumroad' | 'patreon' | 'kofi'
  | 'buy_me_coffee'

  // Subscription & Billing
  | 'chargebee' | 'recurly' | 'chargify' | 'zuora' | 'maxio'

  // Accounting & Finance
  | 'quickbooks' | 'xero' | 'freshbooks' | 'wave' | 'sage' | 'netsuite'
  | 'bill_com' | 'expensify' | 'ramp' | 'brex' | 'divvy' | 'plaid'

  // Email Marketing
  | 'mailchimp' | 'sendgrid' | 'mailgun' | 'ses' | 'postmark'
  | 'constant_contact' | 'aweber' | 'convertkit' | 'campaign_monitor'
  | 'sendinblue' | 'customer_io' | 'klaviyo' | 'omnisend' | 'drip'
  | 'activecampaign' | 'keap' | 'ontraport'

  // SMS/Voice
  | 'twilio' | 'vonage' | 'plivo' | 'bandwidth' | 'messagebird'
  | 'sinch' | 'telnyx' | 'amazon_connect' | 'genesys' | 'five9'
  | 'talkdesk' | 'aircall' | 'ringcentral' | '8x8' | 'dialpad'

  // Analytics
  | 'google_analytics' | 'mixpanel' | 'amplitude' | 'segment' | 'heap'
  | 'hotjar' | 'crazy_egg' | 'fullstory' | 'logrocket' | 'posthog'
  | 'umami' | 'fathom' | 'plausible' | 'matomo' | 'smartlook'
  | 'pendo' | 'walkme' | 'appcues' | 'userguiding' | 'chameleon'

  // Project Management
  | 'jira' | 'asana' | 'trello' | 'monday' | 'clickup' | 'linear'
  | 'shortcut' | 'basecamp' | 'wrike' | 'teamwork' | 'notion' | 'coda'
  | 'airtable' | 'smartsheet' | 'confluence'

  // HR & Recruiting
  | 'bamboohr' | 'workday' | 'adp' | 'gusto' | 'rippling' | 'namely'
  | 'zenefits' | 'justworks' | 'paychex' | 'lever' | 'greenhouse'
  | 'workable' | 'jazzhr' | 'breezy_hr' | 'recruitee' | 'ashby'

  // Document Management
  | 'docusign' | 'hellosign' | 'pandadoc' | 'adobe_sign' | 'signwell'
  | 'signnow' | 'docu_vault'

  // Storage & Files
  | 'dropbox' | 'google_drive' | 'box' | 'onedrive' | 'sharepoint'
  | 's3' | 'azure_blob' | 'gcs' | 'backblaze'

  // Calendar & Scheduling
  | 'google_calendar' | 'outlook_calendar' | 'calendly' | 'cal_com'
  | 'acuity' | 'doodle' | 'chili_piper' | 'setmore' | 'simplybook'
  | 'booksy' | 'square_appointments'

  // Forms & Surveys
  | 'typeform' | 'google_forms' | 'surveymonkey' | 'jotform'
  | 'formstack' | 'wufoo' | 'cognito_forms' | 'formidable'
  | 'gravity_forms' | 'ninja_forms'

  // AI & ML
  | 'openai' | 'anthropic' | 'google_palm' | 'cohere' | 'huggingface'
  | 'aws_bedrock' | 'azure_openai' | 'elevenlabs' | 'assemblyai'
  | 'deepgram' | 'rev_ai' | 'whisper'

  // Automation & Workflows
  | 'zapier' | 'make' | 'n8n' | 'ifttt' | 'workato' | 'tray'
  | 'automate_io' | 'parabola' | 'activepieces'

  // Development Tools
  | 'github' | 'gitlab' | 'bitbucket' | 'circleci' | 'jenkins'
  | 'travis' | 'github_actions' | 'gitlab_ci' | 'docker_hub'
  | 'vercel' | 'netlify' | 'cloudflare' | 'railway' | 'render'
  | 'fly_io' | 'heroku' | 'digital_ocean'

  // Monitoring & Observability
  | 'datadog' | 'new_relic' | 'sentry' | 'pagerduty' | 'opsgenie'
  | 'grafana' | 'prometheus' | 'elastic' | 'splunk' | 'sumologic'

  // Databases & Data
  | 'mongodb' | 'postgresql' | 'mysql' | 'redis' | 'elasticsearch'
  | 'supabase' | 'firebase' | 'planetscale' | 'neon' | 'cockroachdb'
  | 'snowflake' | 'bigquery' | 'redshift' | 'databricks' | 'dbt'
  | 'fivetran' | 'airbyte' | 'stitch' | 'census' | 'hightouch'
  | 'rudderstack' | 'mparticle' | 'tealium'

  // Business Intelligence
  | 'metabase' | 'redash' | 'looker' | 'tableau' | 'power_bi'
  | 'mode' | 'hex' | 'observable'

  // Communication & Real-time
  | 'pubnub' | 'pusher' | 'ably' | 'socket_io' | 'websocket'

  // Message Queues
  | 'kafka' | 'rabbitmq' | 'pulsar' | 'nats' | 'sqs' | 'redis_pub_sub'

  // Auth & Identity
  | 'auth0' | 'okta' | 'onelogin' | 'clerk' | 'stytch' | 'magic'
  | 'firebase_auth' | 'supabase_auth' | 'cognito'

  // Feature Flags
  | 'launchdarkly' | 'flagsmith' | 'unleash' | 'configcat' | 'growthbook'
  | 'split_io'

  // A/B Testing
  | 'optimizely' | 'vwo' | 'ab_tasty' | 'google_optimize'

  // Learning Management
  | 'teachable' | 'thinkific' | 'kajabi' | 'podia' | 'coursera'
  | 'udemy' | 'skillshare' | 'learnworlds'

  // Marketing Automation
  | 'marketo' | 'pardot' | 'eloqua' | 'acoustic' | 'iterable'

  // Landing Pages
  | 'clickfunnels' | 'unbounce' | 'instapage' | 'leadpages'

  // Legal Practice Management
  | 'clio' | 'mycase' | 'practice_panther' | 'smokeball'

  // Website Builders
  | 'wordpress' | 'webflow' | 'bubble' | 'wix' | 'squarespace'

  // Internal Tools
  | 'retool' | 'airplane' | 'superblocks' | 'appsmith' | 'budibase'
  | 'tooljet'

  // Voice Assistants
  | 'alexa' | 'google_assistant' | 'siri' | 'cortana' | 'bixby'

  // Business Messaging
  | 'google_business' | 'apple_business' | 'rcs_business'

  // Custom
  | 'custom' | 'webhook' | 'rest_api' | 'graphql' | 'grpc' | 'soap'

// ============================================================================
// INTEGRATION CONFIGURATION
// ============================================================================

export interface IntegrationConfig {
  // Basic Info
  type: IntegrationType
  category: IntegrationCategory
  enabled: boolean
  name: string
  description?: string

  // Credentials
  credentials: IntegrationCredentials

  // API Configuration
  apiVersion?: string
  baseUrl?: string
  timeout?: number
  retryAttempts?: number
  retryDelay?: number

  // Rate Limiting
  rateLimit?: {
    maxRequests: number
    windowMs: number
    strategy: 'sliding' | 'fixed'
  }

  // Features
  features?: {
    supportsWebhooks?: boolean
    supportsOAuth?: boolean
    supportsApiKey?: boolean
    supportsBasicAuth?: boolean
    supportsBatch?: boolean
    supportsStreaming?: boolean
    supportsFileUpload?: boolean
    supportsRichMedia?: boolean
    supportsTemplates?: boolean
    supportsScheduling?: boolean
  }

  // Webhook Configuration
  webhook?: {
    url?: string
    secret?: string
    events?: string[]
    verificationToken?: string
  }

  // OAuth Configuration
  oauth?: {
    clientId?: string
    clientSecret?: string
    scopes?: string[]
    redirectUri?: string
    authorizationUrl?: string
    tokenUrl?: string
    refreshToken?: string
    accessToken?: string
    expiresAt?: Date
  }

  // Custom Settings
  settings?: Record<string, any>

  // Metadata
  metadata?: {
    connectedAt?: Date
    lastSyncedAt?: Date
    lastError?: string
    status: 'connected' | 'disconnected' | 'error' | 'pending'
  }
}

export interface IntegrationCredentials {
  // API Keys
  apiKey?: string
  apiSecret?: string
  apiToken?: string

  // OAuth
  accessToken?: string
  refreshToken?: string
  tokenType?: string
  expiresIn?: number
  expiresAt?: Date
  scope?: string[]

  // Platform-specific
  // Messaging
  botToken?: string
  phoneNumberId?: string
  businessAccountId?: string
  verifyToken?: string
  appId?: string
  appSecret?: string

  // CRM
  instanceUrl?: string
  orgId?: string
  domain?: string

  // Email
  sendingDomain?: string
  fromEmail?: string
  fromName?: string

  // Payment
  publishableKey?: string
  secretKey?: string
  webhookSecret?: string
  merchantId?: string

  // Database
  connectionString?: string
  host?: string
  port?: number
  database?: string
  username?: string
  password?: string

  // Cloud Services
  region?: string
  accountId?: string
  projectId?: string

  // Custom
  [key: string]: any
}

// ============================================================================
// INTEGRATION CAPABILITIES
// ============================================================================

export interface IntegrationCapabilities {
  // Communication
  canSendMessages: boolean
  canReceiveMessages: boolean
  canSendFiles: boolean
  canSendImages: boolean
  canSendVideo: boolean
  canSendAudio: boolean
  canSendLocation: boolean

  // Rich Content
  canSendButtons: boolean
  canSendCards: boolean
  canSendCarousels: boolean
  canSendQuickReplies: boolean
  canSendTemplates: boolean

  // Features
  canScheduleMessages: boolean
  canBroadcast: boolean
  canTag: boolean
  canAssign: boolean
  canCreateTickets: boolean
  canCreateLeads: boolean
  canCreateContacts: boolean

  // Data
  canSyncContacts: boolean
  canSyncConversations: boolean
  canSyncTickets: boolean
  canExportData: boolean
  canImportData: boolean

  // Analytics
  canTrackEvents: boolean
  canTrackMetrics: boolean
  canGenerateReports: boolean

  // Automation
  canCreateWorkflows: boolean
  canTriggerActions: boolean
  canListenToWebhooks: boolean

  // Limits
  maxMessageLength?: number
  maxFileSize?: number
  maxBatchSize?: number
  rateLimit?: {
    messages: number
    period: string
  }
}

// ============================================================================
// INTEGRATION EVENTS
// ============================================================================

export type IntegrationEventType =
  | 'message.received'
  | 'message.sent'
  | 'message.delivered'
  | 'message.read'
  | 'message.failed'
  | 'conversation.created'
  | 'conversation.updated'
  | 'conversation.closed'
  | 'contact.created'
  | 'contact.updated'
  | 'contact.deleted'
  | 'ticket.created'
  | 'ticket.updated'
  | 'ticket.closed'
  | 'lead.created'
  | 'lead.updated'
  | 'lead.converted'
  | 'deal.created'
  | 'deal.won'
  | 'deal.lost'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.cancelled'
  | 'order.created'
  | 'order.fulfilled'
  | 'order.cancelled'
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'webhook.received'
  | 'error.occurred'
  | 'connection.established'
  | 'connection.lost'
  | 'sync.started'
  | 'sync.completed'
  | 'sync.failed'

export interface IntegrationEvent {
  id: string
  type: IntegrationEventType
  integration: IntegrationType
  timestamp: Date
  data: any
  metadata?: Record<string, any>
}

// ============================================================================
// INTEGRATION ACTIONS
// ============================================================================

export interface IntegrationAction {
  type: string
  integration: IntegrationType
  params: Record<string, any>
  timestamp: Date
}

// ============================================================================
// INTEGRATION RESPONSE
// ============================================================================

export interface IntegrationResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
    retryable: boolean
  }
  metadata?: {
    requestId?: string
    timestamp: Date
    duration?: number
    rateLimit?: {
      limit: number
      remaining: number
      reset: Date
    }
  }
}

// ============================================================================
// INTEGRATION SYNC
// ============================================================================

export interface IntegrationSyncConfig {
  enabled: boolean
  direction: 'one_way' | 'two_way'
  frequency: 'real_time' | 'hourly' | 'daily' | 'weekly' | 'custom'
  customCron?: string
  entities: string[]
  filters?: Record<string, any>
  mapping?: Record<string, string>
}

export interface IntegrationSyncResult {
  success: boolean
  startedAt: Date
  completedAt: Date
  recordsProcessed: number
  recordsCreated: number
  recordsUpdated: number
  recordsFailed: number
  errors?: Array<{
    record: any
    error: string
  }>
}

// ============================================================================
// INTEGRATION MAPPING
// ============================================================================

export interface IntegrationFieldMapping {
  source: string
  target: string
  transform?: (value: any) => any
  default?: any
  required?: boolean
}

// ============================================================================
// INTEGRATION ERRORS
// ============================================================================

export class IntegrationError extends Error {
  constructor(
    message: string,
    public code: string,
    public integration: IntegrationType,
    public retryable: boolean = false,
    public originalError?: any
  ) {
    super(message)
    this.name = 'IntegrationError'
  }
}

export class AuthenticationError extends IntegrationError {
  constructor(integration: IntegrationType, message = 'Authentication failed') {
    super(message, 'AUTH_ERROR', integration, false)
    this.name = 'AuthenticationError'
  }
}

export class RateLimitError extends IntegrationError {
  constructor(
    integration: IntegrationType,
    public retryAfterMs: number,
    message = 'Rate limit exceeded'
  ) {
    super(message, 'RATE_LIMIT', integration, true)
    this.name = 'RateLimitError'
  }
}

export class ValidationError extends IntegrationError {
  constructor(integration: IntegrationType, message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', integration, false)
    this.name = 'ValidationError'
  }
}

export class NetworkError extends IntegrationError {
  constructor(integration: IntegrationType, message = 'Network error') {
    super(message, 'NETWORK_ERROR', integration, true)
    this.name = 'NetworkError'
  }
}

export class QuotaExceededError extends IntegrationError {
  constructor(integration: IntegrationType, message = 'Quota exceeded') {
    super(message, 'QUOTA_EXCEEDED', integration, false)
    this.name = 'QuotaExceededError'
  }
}
