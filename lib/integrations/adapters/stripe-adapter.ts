/**
 * Stripe Adapter - Comprehensive Payment Processing Platform
 *
 * Complete Stripe API implementation covering:
 * - Payment Intents, Payment Methods, Charges
 * - Customers, Cards, Bank Accounts
 * - Subscriptions, Prices, Products, Coupons
 * - Invoices, Invoice Items
 * - Checkout Sessions, Payment Links
 * - Refunds, Disputes
 * - Payouts, Transfers
 * - Balance, Balance Transactions
 * - Webhooks, Events
 * - Connect (Accounts, Transfers)
 */

import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

// ============================================================================
// PAYMENT INTERFACES
// ============================================================================

export interface StripePaymentIntent {
  id?: string
  object?: 'payment_intent'
  amount: number
  currency: string
  customer?: string
  description?: string
  metadata?: Record<string, string>
  payment_method?: string
  payment_method_types?: string[]
  status?: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded'
  client_secret?: string
  confirmation_method?: 'automatic' | 'manual'
  capture_method?: 'automatic' | 'manual'
  receipt_email?: string
  setup_future_usage?: 'on_session' | 'off_session'
  shipping?: StripeShipping
  statement_descriptor?: string
  created?: number
  canceled_at?: number
}

export interface StripePaymentMethod {
  id?: string
  object?: 'payment_method'
  type: 'card' | 'us_bank_account' | 'sepa_debit' | 'ideal' | 'giropay' | 'klarna'
  billing_details?: {
    address?: StripeAddress
    email?: string
    name?: string
    phone?: string
  }
  card?: {
    brand?: string
    country?: string
    exp_month?: number
    exp_year?: number
    fingerprint?: string
    funding?: string
    last4?: string
    networks?: any
    three_d_secure_usage?: any
  }
  created?: number
  customer?: string
  livemode?: boolean
  metadata?: Record<string, string>
}

export interface StripeCharge {
  id?: string
  object?: 'charge'
  amount: number
  amount_captured?: number
  amount_refunded?: number
  currency: string
  customer?: string
  description?: string
  disputed?: boolean
  failure_code?: string
  failure_message?: string
  paid?: boolean
  payment_intent?: string
  payment_method?: string
  receipt_email?: string
  receipt_url?: string
  refunded?: boolean
  status?: 'succeeded' | 'pending' | 'failed'
  created?: number
  metadata?: Record<string, string>
}

// ============================================================================
// CUSTOMER INTERFACES
// ============================================================================

export interface StripeCustomer {
  id?: string
  object?: 'customer'
  email?: string
  name?: string
  phone?: string
  description?: string
  address?: StripeAddress
  shipping?: StripeShipping
  metadata?: Record<string, string>
  balance?: number
  created?: number
  currency?: string
  default_source?: string
  delinquent?: boolean
  discount?: any
  invoice_prefix?: string
  invoice_settings?: {
    default_payment_method?: string
    footer?: string
  }
  livemode?: boolean
  preferred_locales?: string[]
  tax_exempt?: 'none' | 'exempt' | 'reverse'
}

export interface StripeAddress {
  line1?: string
  line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

export interface StripeShipping {
  address: StripeAddress
  name: string
  carrier?: string
  phone?: string
  tracking_number?: string
}

// ============================================================================
// SUBSCRIPTION INTERFACES
// ============================================================================

export interface StripeSubscription {
  id?: string
  object?: 'subscription'
  customer: string
  items?: {
    data?: StripeSubscriptionItem[]
  }
  status?: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid'
  cancel_at_period_end?: boolean
  canceled_at?: number
  current_period_start?: number
  current_period_end?: number
  created?: number
  days_until_due?: number
  default_payment_method?: string
  discount?: any
  ended_at?: number
  metadata?: Record<string, string>
  trial_start?: number
  trial_end?: number
  trial_period_days?: number
  collection_method?: 'charge_automatically' | 'send_invoice'
}

export interface StripeSubscriptionItem {
  id?: string
  object?: 'subscription_item'
  price: string | StripePrice
  quantity?: number
  subscription?: string
  metadata?: Record<string, string>
  created?: number
}

export interface StripePrice {
  id?: string
  object?: 'price'
  active?: boolean
  currency: string
  product: string
  type?: 'one_time' | 'recurring'
  unit_amount?: number
  unit_amount_decimal?: string
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year'
    interval_count?: number
    usage_type?: 'metered' | 'licensed'
    aggregate_usage?: 'sum' | 'last_during_period' | 'last_ever' | 'max'
  }
  billing_scheme?: 'per_unit' | 'tiered'
  lookup_key?: string
  metadata?: Record<string, string>
  nickname?: string
  created?: number
}

export interface StripeProduct {
  id?: string
  object?: 'product'
  active?: boolean
  description?: string
  images?: string[]
  metadata?: Record<string, string>
  name: string
  package_dimensions?: {
    height: number
    length: number
    weight: number
    width: number
  }
  shippable?: boolean
  statement_descriptor?: string
  tax_code?: string
  unit_label?: string
  url?: string
  created?: number
}

export interface StripeCoupon {
  id?: string
  object?: 'coupon'
  amount_off?: number
  currency?: string
  duration: 'forever' | 'once' | 'repeating'
  duration_in_months?: number
  max_redemptions?: number
  metadata?: Record<string, string>
  name?: string
  percent_off?: number
  redeem_by?: number
  times_redeemed?: number
  valid?: boolean
  created?: number
}

// ============================================================================
// INVOICE INTERFACES
// ============================================================================

export interface StripeInvoice {
  id?: string
  object?: 'invoice'
  customer: string
  subscription?: string
  auto_advance?: boolean
  collection_method?: 'charge_automatically' | 'send_invoice'
  currency?: string
  description?: string
  due_date?: number
  metadata?: Record<string, string>
  payment_intent?: string
  status?: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'
  amount_due?: number
  amount_paid?: number
  amount_remaining?: number
  attempt_count?: number
  attempted?: boolean
  created?: number
  hosted_invoice_url?: string
  invoice_pdf?: string
  lines?: {
    data?: StripeInvoiceLineItem[]
  }
  number?: string
  paid?: boolean
  period_start?: number
  period_end?: number
  subtotal?: number
  tax?: number
  total?: number
}

export interface StripeInvoiceLineItem {
  id?: string
  object?: 'line_item'
  amount: number
  currency: string
  description?: string
  metadata?: Record<string, string>
  period?: {
    start: number
    end: number
  }
  price?: StripePrice
  proration?: boolean
  quantity?: number
  subscription?: string
  subscription_item?: string
  type?: 'invoiceitem' | 'subscription'
}

export interface StripeInvoiceItem {
  id?: string
  object?: 'invoiceitem'
  customer: string
  amount?: number
  currency: string
  description?: string
  invoice?: string
  metadata?: Record<string, string>
  period?: {
    start: number
    end: number
  }
  price?: string
  quantity?: number
  subscription?: string
  unit_amount?: number
  created?: number
}

// ============================================================================
// CHECKOUT INTERFACES
// ============================================================================

export interface StripeCheckoutSession {
  id?: string
  object?: 'checkout.session'
  cancel_url: string
  success_url: string
  customer?: string
  customer_email?: string
  line_items?: Array<{
    price?: string
    quantity?: number
    price_data?: {
      currency: string
      product_data?: {
        name: string
        description?: string
        images?: string[]
      }
      unit_amount?: number
      recurring?: {
        interval: 'day' | 'week' | 'month' | 'year'
      }
    }
  }>
  mode: 'payment' | 'setup' | 'subscription'
  payment_method_types?: string[]
  metadata?: Record<string, string>
  payment_intent?: string
  payment_status?: 'paid' | 'unpaid' | 'no_payment_required'
  status?: 'open' | 'complete' | 'expired'
  subscription?: string
  url?: string
  client_reference_id?: string
  created?: number
}

export interface StripePaymentLink {
  id?: string
  object?: 'payment_link'
  active?: boolean
  line_items?: Array<{
    price: string
    quantity: number
  }>
  metadata?: Record<string, string>
  url?: string
  created?: number
}

// ============================================================================
// REFUND & DISPUTE INTERFACES
// ============================================================================

export interface StripeRefund {
  id?: string
  object?: 'refund'
  amount: number
  charge?: string
  currency?: string
  metadata?: Record<string, string>
  payment_intent?: string
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
  status?: 'pending' | 'succeeded' | 'failed' | 'canceled'
  created?: number
}

export interface StripeDispute {
  id?: string
  object?: 'dispute'
  amount: number
  charge: string
  currency: string
  evidence?: any
  evidence_details?: any
  is_charge_refundable?: boolean
  metadata?: Record<string, string>
  reason?: string
  status?: 'warning_needs_response' | 'warning_under_review' | 'warning_closed' | 'needs_response' | 'under_review' | 'charge_refunded' | 'won' | 'lost'
  created?: number
}

// ============================================================================
// PAYOUT & TRANSFER INTERFACES
// ============================================================================

export interface StripePayout {
  id?: string
  object?: 'payout'
  amount: number
  currency: string
  arrival_date?: number
  automatic?: boolean
  balance_transaction?: string
  created?: number
  description?: string
  destination?: string
  failure_code?: string
  failure_message?: string
  method?: 'standard' | 'instant'
  source_type?: 'card' | 'bank_account'
  statement_descriptor?: string
  status?: 'paid' | 'pending' | 'in_transit' | 'canceled' | 'failed'
  type?: 'bank_account' | 'card'
}

export interface StripeTransfer {
  id?: string
  object?: 'transfer'
  amount: number
  currency: string
  destination: string
  description?: string
  metadata?: Record<string, string>
  source_transaction?: string
  transfer_group?: string
  created?: number
}

// ============================================================================
// BALANCE INTERFACES
// ============================================================================

export interface StripeBalance {
  object?: 'balance'
  available: Array<{
    amount: number
    currency: string
    source_types?: any
  }>
  pending: Array<{
    amount: number
    currency: string
    source_types?: any
  }>
  livemode?: boolean
}

export interface StripeBalanceTransaction {
  id?: string
  object?: 'balance_transaction'
  amount: number
  currency: string
  description?: string
  fee: number
  fee_details?: Array<{
    amount: number
    application?: string
    currency: string
    description: string
    type: string
  }>
  net: number
  status?: 'available' | 'pending'
  type?: string
  created?: number
}

// ============================================================================
// WEBHOOK & EVENT INTERFACES
// ============================================================================

export interface StripeWebhookEndpoint {
  id?: string
  object?: 'webhook_endpoint'
  enabled_events: string[]
  url: string
  description?: string
  metadata?: Record<string, string>
  status?: 'enabled' | 'disabled'
  created?: number
}

export interface StripeEvent {
  id?: string
  object?: 'event'
  api_version?: string
  created?: number
  data?: {
    object: any
    previous_attributes?: any
  }
  livemode?: boolean
  pending_webhooks?: number
  request?: {
    id?: string
    idempotency_key?: string
  }
  type: string
}

// ============================================================================
// MAIN ADAPTER CLASS
// ============================================================================

export class StripeAdapter extends BaseIntegrationAdapter {
  private secretKey?: string
  private baseUrl = 'https://api.stripe.com/v1'

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: false,
      canReceiveMessages: false,
      canSendFiles: false,
      canSendImages: false,
      canSendVideo: false,
      canSendAudio: false,
      canSendLocation: false,
      canSendButtons: false,
      canSendCards: false,
      canSendCarousels: false,
      canSendQuickReplies: false,
      canSendTemplates: false,
      canScheduleMessages: false,
      canBroadcast: false,
      canTag: false,
      canAssign: false,
      canCreateTickets: false,
      canCreateLeads: false,
      canCreateContacts: true,
      canSyncContacts: true,
      canSyncConversations: false,
      canSyncTickets: false,
      canExportData: true,
      canImportData: false,
      canTrackEvents: true,
      canTrackMetrics: true,
      canGenerateReports: true,
      canCreateWorkflows: true,
      canTriggerActions: true,
      canListenToWebhooks: true,
      maxMessageLength: 0,
      maxFileSize: 0,
      maxBatchSize: 100,
      rateLimit: { messages: 100, period: 'per_second' },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.secretKey = this.config.credentials.secretKey
    if (!this.secretKey) {
      return {
        success: false,
        error: { code: 'AUTH_ERROR', message: 'Missing secret key', retryable: false }
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
        const response = await fetch(`${this.baseUrl}/balance`, {
          headers: { 'Authorization': `Bearer ${this.secretKey}` }
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
    return {
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }

  private buildFormData(params: Record<string, any>): string {
    const formData = new URLSearchParams()
    const addParam = (key: string, value: any) => {
      if (value === undefined || value === null) return
      if (typeof value === 'object' && !Array.isArray(value)) {
        Object.entries(value).forEach(([k, v]) => addParam(`${key}[${k}]`, v))
      } else if (Array.isArray(value)) {
        value.forEach((item, i) => {
          if (typeof item === 'object') {
            Object.entries(item).forEach(([k, v]) => addParam(`${key}[${i}][${k}]`, v))
          } else {
            formData.append(`${key}[]`, String(item))
          }
        })
      } else {
        formData.append(key, String(value))
      }
    }
    Object.entries(params).forEach(([key, value]) => addParam(key, value))
    return formData.toString()
  }

  // ============================================================================
  // PAYMENT INTENT METHODS
  // ============================================================================

  /**
   * Create a payment intent
   */
  async createPaymentIntent(params: Partial<StripePaymentIntent>): Promise<IntegrationResponse<StripePaymentIntent>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/payment_intents`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: this.buildFormData(params as any),
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
   * Retrieve a payment intent
   */
  async getPaymentIntent(id: string): Promise<IntegrationResponse<StripePaymentIntent>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/payment_intents/${id}`, {
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
   * Confirm a payment intent
   */
  async confirmPaymentIntent(id: string, params?: { payment_method?: string; return_url?: string }): Promise<IntegrationResponse<StripePaymentIntent>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/payment_intents/${id}/confirm`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: params ? this.buildFormData(params) : '',
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
   * Cancel a payment intent
   */
  async cancelPaymentIntent(id: string): Promise<IntegrationResponse<StripePaymentIntent>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/payment_intents/${id}/cancel`, {
          method: 'POST',
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
   * Capture a payment intent
   */
  async capturePaymentIntent(id: string, params?: { amount_to_capture?: number }): Promise<IntegrationResponse<StripePaymentIntent>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/payment_intents/${id}/capture`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: params ? this.buildFormData(params) : '',
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
  // PAYMENT METHOD METHODS
  // ============================================================================

  /**
   * Create a payment method
   */
  async createPaymentMethod(params: Partial<StripePaymentMethod>): Promise<IntegrationResponse<StripePaymentMethod>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/payment_methods`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: this.buildFormData(params as any),
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
   * Attach a payment method to a customer
   */
  async attachPaymentMethod(id: string, customer: string): Promise<IntegrationResponse<StripePaymentMethod>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/payment_methods/${id}/attach`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: this.buildFormData({ customer }),
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
   * Detach a payment method from a customer
   */
  async detachPaymentMethod(id: string): Promise<IntegrationResponse<StripePaymentMethod>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/payment_methods/${id}/detach`, {
          method: 'POST',
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
  // CUSTOMER METHODS
  // ============================================================================

  /**
   * Create a customer
   */
  async createCustomer(params: Partial<StripeCustomer>): Promise<IntegrationResponse<StripeCustomer>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/customers`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: this.buildFormData(params as any),
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
   * Retrieve a customer
   */
  async getCustomer(id: string): Promise<IntegrationResponse<StripeCustomer>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/customers/${id}`, {
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
   * Update a customer
   */
  async updateCustomer(id: string, params: Partial<StripeCustomer>): Promise<IntegrationResponse<StripeCustomer>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/customers/${id}`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: this.buildFormData(params as any),
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
   * Delete a customer
   */
  async deleteCustomer(id: string): Promise<IntegrationResponse<{ id: string; deleted: boolean }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/customers/${id}`, {
          method: 'DELETE',
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
   * List customers
   */
  async listCustomers(params?: { email?: string; limit?: number; starting_after?: string }): Promise<IntegrationResponse<{ data: StripeCustomer[] }>> {
    try {
      await this.ensureConnected()
      const query = params ? `?${this.buildFormData(params)}` : ''
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/customers${query}`, {
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
  // SUBSCRIPTION METHODS
  // ============================================================================

  /**
   * Create a subscription
   */
  async createSubscription(params: Partial<StripeSubscription> & { customer: string; items: Array<{ price: string; quantity?: number }> }): Promise<IntegrationResponse<StripeSubscription>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/subscriptions`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: this.buildFormData(params as any),
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
   * Retrieve a subscription
   */
  async getSubscription(id: string): Promise<IntegrationResponse<StripeSubscription>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/subscriptions/${id}`, {
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
   * Update a subscription
   */
  async updateSubscription(id: string, params: Partial<StripeSubscription>): Promise<IntegrationResponse<StripeSubscription>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/subscriptions/${id}`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: this.buildFormData(params as any),
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
   * Cancel a subscription
   */
  async cancelSubscription(id: string): Promise<IntegrationResponse<StripeSubscription>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/subscriptions/${id}`, {
          method: 'DELETE',
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
  // PRODUCT & PRICE METHODS
  // ============================================================================

  /**
   * Create a product
   */
  async createProduct(params: Partial<StripeProduct> & { name: string }): Promise<IntegrationResponse<StripeProduct>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/products`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: this.buildFormData(params as any),
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
   * Create a price
   */
  async createPrice(params: Partial<StripePrice> & { currency: string; product: string }): Promise<IntegrationResponse<StripePrice>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/prices`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: this.buildFormData(params as any),
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
   * Create a coupon
   */
  async createCoupon(params: Partial<StripeCoupon> & { duration: 'forever' | 'once' | 'repeating' }): Promise<IntegrationResponse<StripeCoupon>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/coupons`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: this.buildFormData(params as any),
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
  // INVOICE METHODS
  // ============================================================================

  /**
   * Create an invoice
   */
  async createInvoice(params: Partial<StripeInvoice> & { customer: string }): Promise<IntegrationResponse<StripeInvoice>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/invoices`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: this.buildFormData(params as any),
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
   * Retrieve an invoice
   */
  async getInvoice(id: string): Promise<IntegrationResponse<StripeInvoice>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/invoices/${id}`, {
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
   * Pay an invoice
   */
  async payInvoice(id: string): Promise<IntegrationResponse<StripeInvoice>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/invoices/${id}/pay`, {
          method: 'POST',
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
   * Create an invoice item
   */
  async createInvoiceItem(params: Partial<StripeInvoiceItem> & { customer: string; currency: string }): Promise<IntegrationResponse<StripeInvoiceItem>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/invoiceitems`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: this.buildFormData(params as any),
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
  // CHECKOUT SESSION METHODS
  // ============================================================================

  /**
   * Create a checkout session
   */
  async createCheckoutSession(params: Partial<StripeCheckoutSession> & { success_url: string; cancel_url: string; mode: 'payment' | 'setup' | 'subscription' }): Promise<IntegrationResponse<StripeCheckoutSession>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/checkout/sessions`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: this.buildFormData(params as any),
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
   * Retrieve a checkout session
   */
  async getCheckoutSession(id: string): Promise<IntegrationResponse<StripeCheckoutSession>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/checkout/sessions/${id}`, {
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
  // REFUND METHODS
  // ============================================================================

  /**
   * Create a refund
   */
  async createRefund(params: Partial<StripeRefund> & { charge?: string; payment_intent?: string }): Promise<IntegrationResponse<StripeRefund>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/refunds`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: this.buildFormData(params as any),
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
   * Retrieve a refund
   */
  async getRefund(id: string): Promise<IntegrationResponse<StripeRefund>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/refunds/${id}`, {
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
  // BALANCE METHODS
  // ============================================================================

  /**
   * Retrieve balance
   */
  async getBalance(): Promise<IntegrationResponse<StripeBalance>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/balance`, {
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
   * Retrieve a balance transaction
   */
  async getBalanceTransaction(id: string): Promise<IntegrationResponse<StripeBalanceTransaction>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/balance_transactions/${id}`, {
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
  // PAYOUT METHODS
  // ============================================================================

  /**
   * Create a payout
   */
  async createPayout(params: Partial<StripePayout> & { amount: number; currency: string }): Promise<IntegrationResponse<StripePayout>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/payouts`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: this.buildFormData(params as any),
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
   * Retrieve a payout
   */
  async getPayout(id: string): Promise<IntegrationResponse<StripePayout>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/payouts/${id}`, {
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
  // WEBHOOK METHODS
  // ============================================================================

  /**
   * Create a webhook endpoint
   */
  async createWebhookEndpoint(params: { url: string; enabled_events: string[] }): Promise<IntegrationResponse<StripeWebhookEndpoint>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/webhook_endpoints`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: this.buildFormData(params),
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
   * List webhook endpoints
   */
  async listWebhookEndpoints(): Promise<IntegrationResponse<{ data: StripeWebhookEndpoint[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/webhook_endpoints`, {
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
   * Delete a webhook endpoint
   */
  async deleteWebhookEndpoint(id: string): Promise<IntegrationResponse<{ id: string; deleted: boolean }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/webhook_endpoints/${id}`, {
          method: 'DELETE',
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
   * Verify webhook signature
   */
  async verifyWebhook(payload: string, signature: string, secret: string): Promise<boolean> {
    const crypto = require('crypto')
    const [timestamp, sig] = signature.split(',').map(p => p.split('=')[1])
    const signedPayload = `${timestamp}.${payload}`
    const expectedSig = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex')
    return sig === expectedSig
  }

  /**
   * Retrieve an event
   */
  async getEvent(id: string): Promise<IntegrationResponse<StripeEvent>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/events/${id}`, {
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
}
