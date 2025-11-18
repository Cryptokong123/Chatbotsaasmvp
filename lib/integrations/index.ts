/**
 * Integration System Exports
 *
 * Centralized exports for the entire integration system
 */

// Core types
export * from './types'

// Base adapter
export { BaseIntegrationAdapter } from './base-adapter'

// Registry
export {
  IntegrationRegistry,
  type IntegrationMetadata,
  type RegisteredIntegration,
  type IntegrationInstance,
  type RegistryConfig,
  type QueryOptions,
  type HealthCheckResult,
} from './integration-registry'

// Registry loader
export { loadAllIntegrations, ADAPTER_METADATA } from './registry-loader'

// Individual adapters
export { AWSSESAdapter } from './adapters/aws-ses-adapter'
export { ClaudeAdapter } from './adapters/claude-adapter'
export { CopperAdapter } from './adapters/copper-adapter'
export { DriftAdapter } from './adapters/drift-adapter'
export { FreshchatAdapter } from './adapters/freshchat-adapter'
export { FreshdeskAdapter } from './adapters/freshdesk-adapter'
export { FreshsalesAdapter } from './adapters/freshsales-adapter'
export { FreshserviceAdapter } from './adapters/freshservice-adapter'
export { HubSpotAdapter } from './adapters/hubspot-adapter'
export { InstagramAdapter } from './adapters/instagram-adapter'
export { IntercomAdapter } from './adapters/intercom-adapter'
export { LinkedInAdapter } from './adapters/linkedin-adapter'
export { MailchimpAdapter } from './adapters/mailchimp-adapter'
export { MailgunAdapter } from './adapters/mailgun-adapter'
export { MessengerAdapter } from './adapters/messenger-adapter'
export { OpenAIAdapter } from './adapters/openai-adapter'
export { PayPalAdapter } from './adapters/paypal-adapter'
export { PipedriveAdapter } from './adapters/pipedrive-adapter'
export { PostmarkAdapter } from './adapters/postmark-adapter'
export { SalesforceAdapter } from './adapters/salesforce-adapter'
export { SendGridAdapter } from './adapters/sendgrid-adapter'
export { ServiceNowAdapter } from './adapters/servicenow-adapter'
export { ShopifyAdapter } from './adapters/shopify-adapter'
export { StripeAdapter } from './adapters/stripe-adapter'
export { TeamsAdapter } from './adapters/teams-adapter'
export { TwilioAdapter } from './adapters/twilio-adapter'
export { TwitterAdapter } from './adapters/twitter-adapter'
export { ZendeskAdapter } from './adapters/zendesk-adapter'
export { ZendeskSellAdapter } from './adapters/zendesk-sell-adapter'
export { ZendeskSunshineAdapter } from './adapters/zendesk-sunshine-adapter'
export { ZohoCRMAdapter } from './adapters/zoho-crm-adapter'
export { ZohoDeskAdapter } from './adapters/zoho-desk-adapter'
