/**
 * PayPal Adapter - Comprehensive payment processing platform
 * Supports orders, payments, subscriptions, invoicing, payouts, and disputes
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

// Order interfaces
export interface PayPalOrder {
  intent: 'CAPTURE' | 'AUTHORIZE'
  purchase_units: Array<{
    reference_id?: string
    amount: {
      currency_code: string
      value: string
      breakdown?: {
        item_total?: { currency_code: string; value: string }
        shipping?: { currency_code: string; value: string }
        handling?: { currency_code: string; value: string }
        tax_total?: { currency_code: string; value: string }
        insurance?: { currency_code: string; value: string }
        shipping_discount?: { currency_code: string; value: string }
        discount?: { currency_code: string; value: string }
      }
    }
    payee?: {
      email_address?: string
      merchant_id?: string
    }
    payment_instruction?: {
      platform_fees?: Array<{ amount: { currency_code: string; value: string } }>
      disbursement_mode?: 'INSTANT' | 'DELAYED'
    }
    description?: string
    custom_id?: string
    invoice_id?: string
    soft_descriptor?: string
    items?: Array<{
      name: string
      unit_amount: { currency_code: string; value: string }
      tax?: { currency_code: string; value: string }
      quantity: string
      description?: string
      sku?: string
      category?: 'DIGITAL_GOODS' | 'PHYSICAL_GOODS' | 'DONATION'
    }>
    shipping?: {
      method?: string
      name?: { full_name: string }
      address?: {
        address_line_1?: string
        address_line_2?: string
        admin_area_2?: string
        admin_area_1?: string
        postal_code?: string
        country_code: string
      }
    }
  }>
  payer?: {
    name?: { given_name?: string; surname?: string }
    email_address?: string
    payer_id?: string
    phone?: { phone_type?: 'FAX' | 'HOME' | 'MOBILE' | 'OTHER' | 'PAGER'; phone_number?: { national_number: string } }
    birth_date?: string
    tax_info?: { tax_id: string; tax_id_type: string }
    address?: {
      address_line_1?: string
      address_line_2?: string
      admin_area_2?: string
      admin_area_1?: string
      postal_code?: string
      country_code: string
    }
  }
  application_context?: {
    brand_name?: string
    locale?: string
    landing_page?: 'LOGIN' | 'BILLING' | 'NO_PREFERENCE'
    shipping_preference?: 'GET_FROM_FILE' | 'NO_SHIPPING' | 'SET_PROVIDED_ADDRESS'
    user_action?: 'CONTINUE' | 'PAY_NOW'
    payment_method?: {
      payer_selected?: string
      payee_preferred?: 'UNRESTRICTED' | 'IMMEDIATE_PAYMENT_REQUIRED'
    }
    return_url?: string
    cancel_url?: string
  }
}

// Subscription interfaces
export interface PayPalProduct {
  id?: string
  name: string
  description?: string
  type: 'PHYSICAL' | 'DIGITAL' | 'SERVICE'
  category?: string
  image_url?: string
  home_url?: string
}

export interface PayPalBillingPlan {
  id?: string
  product_id: string
  name: string
  description?: string
  status?: 'CREATED' | 'INACTIVE' | 'ACTIVE'
  billing_cycles: Array<{
    frequency: {
      interval_unit: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'
      interval_count: number
    }
    tenure_type: 'REGULAR' | 'TRIAL'
    sequence: number
    total_cycles: number
    pricing_scheme: {
      fixed_price: { currency_code: string; value: string }
    }
  }>
  payment_preferences?: {
    auto_bill_outstanding?: boolean
    setup_fee?: { currency_code: string; value: string }
    setup_fee_failure_action?: 'CONTINUE' | 'CANCEL'
    payment_failure_threshold?: number
  }
  taxes?: {
    percentage: string
    inclusive: boolean
  }
}

export interface PayPalSubscription {
  id?: string
  plan_id: string
  start_time?: string
  quantity?: string
  shipping_amount?: { currency_code: string; value: string }
  subscriber?: {
    name?: { given_name?: string; surname?: string }
    email_address?: string
    shipping_address?: {
      name?: { full_name?: string }
      address?: {
        address_line_1?: string
        address_line_2?: string
        admin_area_2?: string
        admin_area_1?: string
        postal_code?: string
        country_code: string
      }
    }
  }
  application_context?: {
    brand_name?: string
    locale?: string
    shipping_preference?: 'GET_FROM_FILE' | 'NO_SHIPPING' | 'SET_PROVIDED_ADDRESS'
    user_action?: 'SUBSCRIBE_NOW' | 'CONTINUE'
    payment_method?: {
      payer_selected?: string
      payee_preferred?: 'UNRESTRICTED' | 'IMMEDIATE_PAYMENT_REQUIRED'
    }
    return_url?: string
    cancel_url?: string
  }
  custom_id?: string
  plan?: PayPalBillingPlan
}

// Invoice interfaces
export interface PayPalInvoice {
  id?: string
  detail: {
    invoice_number?: string
    reference?: string
    invoice_date?: string
    currency_code: string
    note?: string
    term?: string
    memo?: string
    payment_term?: {
      term_type?: 'DUE_ON_RECEIPT' | 'DUE_ON_DATE_SPECIFIED' | 'NET_10' | 'NET_15' | 'NET_30' | 'NET_45' | 'NET_60' | 'NET_90' | 'NO_DUE_DATE'
      due_date?: string
    }
  }
  invoicer: {
    name?: { given_name?: string; surname?: string }
    email_address?: string
    phones?: Array<{ country_code: string; national_number: string; phone_type?: 'FAX' | 'HOME' | 'MOBILE' | 'OTHER' | 'PAGER' }>
    website?: string
    tax_id?: string
    logo_url?: string
  }
  primary_recipients: Array<{
    billing_info: {
      name?: { given_name?: string; surname?: string }
      email_address?: string
      phones?: Array<{ country_code: string; national_number: string }>
      additional_info?: string
    }
    shipping_info?: {
      name?: { given_name?: string; surname?: string }
      address?: {
        address_line_1?: string
        address_line_2?: string
        admin_area_2?: string
        admin_area_1?: string
        postal_code?: string
        country_code: string
      }
    }
  }>
  items: Array<{
    name: string
    description?: string
    quantity: string
    unit_amount: { currency_code: string; value: string }
    tax?: {
      name?: string
      percent?: string
      amount?: { currency_code: string; value: string }
    }
    discount?: {
      percent?: string
      amount?: { currency_code: string; value: string }
    }
    unit_of_measure?: 'QUANTITY' | 'HOURS' | 'AMOUNT'
  }>
  configuration?: {
    partial_payment?: {
      allow_partial_payment?: boolean
      minimum_amount_due?: { currency_code: string; value: string }
    }
    allow_tip?: boolean
    tax_calculated_after_discount?: boolean
    tax_inclusive?: boolean
  }
  amount?: {
    breakdown?: {
      custom?: { label: string; amount: { currency_code: string; value: string } }
      shipping?: { amount: { currency_code: string; value: string }; tax?: { name: string; percent: string } }
      discount?: { invoice_discount?: { percent?: string; amount?: { currency_code: string; value: string } } }
    }
  }
}

// Payout interfaces
export interface PayPalPayout {
  sender_batch_header: {
    sender_batch_id?: string
    email_subject?: string
    email_message?: string
    recipient_type?: 'EMAIL' | 'PHONE' | 'PAYPAL_ID'
  }
  items: Array<{
    recipient_type?: 'EMAIL' | 'PHONE' | 'PAYPAL_ID'
    amount: { currency: string; value: string }
    note?: string
    sender_item_id?: string
    receiver: string
    notification_language?: string
    recipient_wallet?: 'PAYPAL' | 'VENMO'
  }>
}

// Dispute interfaces
export interface PayPalDispute {
  dispute_id?: string
  reason?: string
  status?: string
  dispute_amount?: { currency_code: string; value: string }
  dispute_life_cycle_stage?: string
  dispute_channel?: string
  messages?: Array<{
    posted_by?: string
    time_posted?: string
    content?: string
  }>
  evidence?: Array<{
    evidence_type?: string
    evidence_info?: any
  }>
}

// Webhook interfaces
export interface PayPalWebhookEvent {
  id?: string
  event_version?: string
  create_time?: string
  resource_type?: string
  event_type?: string
  summary?: string
  resource?: any
  links?: Array<{ href: string; rel: string; method: string }>
}

export class PayPalAdapter extends BaseIntegrationAdapter {
  private clientId?: string
  private clientSecret?: string
  private mode?: 'sandbox' | 'live'
  private baseUrl?: string
  private accessToken?: string
  private tokenExpiry?: number

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: false, canReceiveMessages: false, canSendFiles: false, canSendImages: false,
      canSendVideo: false, canSendAudio: false, canSendLocation: false, canSendButtons: false,
      canSendCards: false, canSendCarousels: false, canSendQuickReplies: false, canSendTemplates: false,
      canScheduleMessages: false, canBroadcast: false, canTag: false, canAssign: false,
      canCreateTickets: false, canCreateLeads: false, canCreateContacts: false, canSyncContacts: false,
      canSyncConversations: false, canSyncTickets: false, canExportData: true, canImportData: false,
      canTrackEvents: true, canTrackMetrics: true, canGenerateReports: true, canCreateWorkflows: false,
      canTriggerActions: true, canListenToWebhooks: true, maxMessageLength: 0,
      maxFileSize: 0, maxBatchSize: 15000, rateLimit: { messages: 50, period: 'per_second' as const },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.clientId = this.config.credentials.clientId
    this.clientSecret = this.config.credentials.clientSecret
    this.mode = (this.config.credentials.mode as 'sandbox' | 'live') || 'sandbox'
    if (!this.clientId || !this.clientSecret) {
      return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing credentials', retryable: false } }
    }
    this.baseUrl = this.mode === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'
    this.isConnected = true
    return { success: true, data: undefined }
  }

  async disconnect(): Promise<IntegrationResponse<void>> {
    this.isConnected = false
    this.accessToken = undefined
    this.tokenExpiry = undefined
    return { success: true, data: undefined }
  }

  async testConnection(): Promise<IntegrationResponse<boolean>> {
    try {
      await this.ensureConnected()
      const token = await this.getAccessToken()
      return { success: token.success, data: token.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  private async getAccessToken(): Promise<IntegrationResponse<{ access_token: string; expires_in: number }>> {
    try {
      // Return cached token if still valid
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return { success: true, data: { access_token: this.accessToken, expires_in: Math.floor((this.tokenExpiry - Date.now()) / 1000) } }
      }

      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
          method: 'POST',
          headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'grant_type=client_credentials',
        })
        if (!response.ok) throw new Error(`PayPal API error: ${response.status}`)
        return await response.json()
      })

      if (result.success && result.data) {
        this.accessToken = result.data.access_token
        this.tokenExpiry = Date.now() + (result.data.expires_in * 1000) - 60000 // Refresh 1 min before expiry
      }

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  private async makeAuthorizedRequest(url: string, options: RequestInit = {}): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const tokenResult = await this.getAccessToken()
      if (!tokenResult.success) return { success: false, error: tokenResult.error }

      const result = await this.makeRequest(async () => {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${tokenResult.data!.access_token}`,
            'Content-Type': 'application/json',
            ...options.headers,
          },
        })
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`PayPal API error: ${response.status} - ${errorText}`)
        }
        const text = await response.text()
        return text ? JSON.parse(text) : {}
      })

      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============ Order Management ============

  async createOrder(order: PayPalOrder): Promise<IntegrationResponse<any>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      body: JSON.stringify(order),
    })
  }

  async updateOrder(orderId: string, updates: Array<{ op: string; path: string; value: any }>): Promise<IntegrationResponse<void>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v2/checkout/orders/${orderId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async getOrder(orderId: string): Promise<IntegrationResponse<any>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v2/checkout/orders/${orderId}`)
  }

  async authorizeOrder(orderId: string): Promise<IntegrationResponse<any>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v2/checkout/orders/${orderId}/authorize`, {
      method: 'POST',
    })
  }

  async captureOrder(orderId: string): Promise<IntegrationResponse<any>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
    })
  }

  // ============ Payment Management ============

  async captureAuthorizedPayment(authorizationId: string, params?: {
    amount?: { currency_code: string; value: string }
    invoice_id?: string
    note_to_payer?: string
    final_capture?: boolean
  }): Promise<IntegrationResponse<any>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v2/payments/authorizations/${authorizationId}/capture`, {
      method: 'POST',
      body: JSON.stringify(params || {}),
    })
  }

  async refundCapturedPayment(captureId: string, params?: {
    amount?: { currency_code: string; value: string }
    invoice_id?: string
    note_to_payer?: string
  }): Promise<IntegrationResponse<any>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v2/payments/captures/${captureId}/refund`, {
      method: 'POST',
      body: JSON.stringify(params || {}),
    })
  }

  async getRefund(refundId: string): Promise<IntegrationResponse<any>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v2/payments/refunds/${refundId}`)
  }

  async voidAuthorizedPayment(authorizationId: string): Promise<IntegrationResponse<any>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v2/payments/authorizations/${authorizationId}/void`, {
      method: 'POST',
    })
  }

  async reauthorizePayment(authorizationId: string, amount: { currency_code: string; value: string }): Promise<IntegrationResponse<any>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v2/payments/authorizations/${authorizationId}/reauthorize`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    })
  }

  // ============ Product Management ============

  async createProduct(product: PayPalProduct): Promise<IntegrationResponse<PayPalProduct>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/catalogs/products`, {
      method: 'POST',
      body: JSON.stringify(product),
    })
  }

  async updateProduct(productId: string, updates: Array<{ op: string; path: string; value: any }>): Promise<IntegrationResponse<void>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/catalogs/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async getProduct(productId: string): Promise<IntegrationResponse<PayPalProduct>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/catalogs/products/${productId}`)
  }

  async listProducts(params?: { page?: number; page_size?: number; total_required?: boolean }): Promise<IntegrationResponse<{ products: PayPalProduct[] }>> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', params.page.toString())
    if (params?.page_size) query.set('page_size', params.page_size.toString())
    if (params?.total_required !== undefined) query.set('total_required', params.total_required.toString())

    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/catalogs/products${query.toString() ? `?${query}` : ''}`)
  }

  // ============ Subscription Plan Management ============

  async createBillingPlan(plan: PayPalBillingPlan): Promise<IntegrationResponse<PayPalBillingPlan>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/billing/plans`, {
      method: 'POST',
      body: JSON.stringify(plan),
    })
  }

  async updateBillingPlan(planId: string, updates: Array<{ op: string; path: string; value: any }>): Promise<IntegrationResponse<void>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/billing/plans/${planId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async getBillingPlan(planId: string): Promise<IntegrationResponse<PayPalBillingPlan>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/billing/plans/${planId}`)
  }

  async listBillingPlans(params?: { product_id?: string; page?: number; page_size?: number }): Promise<IntegrationResponse<{ plans: PayPalBillingPlan[] }>> {
    const query = new URLSearchParams()
    if (params?.product_id) query.set('product_id', params.product_id)
    if (params?.page) query.set('page', params.page.toString())
    if (params?.page_size) query.set('page_size', params.page_size.toString())

    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/billing/plans${query.toString() ? `?${query}` : ''}`)
  }

  async activateBillingPlan(planId: string): Promise<IntegrationResponse<void>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/billing/plans/${planId}/activate`, {
      method: 'POST',
    })
  }

  async deactivateBillingPlan(planId: string): Promise<IntegrationResponse<void>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/billing/plans/${planId}/deactivate`, {
      method: 'POST',
    })
  }

  // ============ Subscription Management ============

  async createSubscription(subscription: PayPalSubscription): Promise<IntegrationResponse<PayPalSubscription>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/billing/subscriptions`, {
      method: 'POST',
      body: JSON.stringify(subscription),
    })
  }

  async updateSubscription(subscriptionId: string, updates: Array<{ op: string; path: string; value: any }>): Promise<IntegrationResponse<void>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async getSubscription(subscriptionId: string): Promise<IntegrationResponse<PayPalSubscription>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}`)
  }

  async suspendSubscription(subscriptionId: string, reason: string): Promise<IntegrationResponse<void>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }

  async activateSubscription(subscriptionId: string, reason: string): Promise<IntegrationResponse<void>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}/activate`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }

  async cancelSubscription(subscriptionId: string, reason: string): Promise<IntegrationResponse<void>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  }

  async captureSubscriptionPayment(subscriptionId: string, params: {
    note: string
    capture_type: 'OUTSTANDING_BALANCE'
    amount: { currency_code: string; value: string }
  }): Promise<IntegrationResponse<any>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}/capture`, {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async reviseSubscription(subscriptionId: string, plan_id: string): Promise<IntegrationResponse<any>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}/revise`, {
      method: 'POST',
      body: JSON.stringify({ plan_id }),
    })
  }

  async getSubscriptionTransactions(subscriptionId: string, params: { start_time: string; end_time: string }): Promise<IntegrationResponse<any>> {
    const query = new URLSearchParams()
    query.set('start_time', params.start_time)
    query.set('end_time', params.end_time)

    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}/transactions?${query}`)
  }

  // ============ Invoice Management ============

  async createDraftInvoice(invoice: PayPalInvoice): Promise<IntegrationResponse<PayPalInvoice>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v2/invoicing/invoices`, {
      method: 'POST',
      body: JSON.stringify(invoice),
    })
  }

  async updateInvoice(invoiceId: string, invoice: PayPalInvoice): Promise<IntegrationResponse<PayPalInvoice>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v2/invoicing/invoices/${invoiceId}`, {
      method: 'PUT',
      body: JSON.stringify(invoice),
    })
  }

  async getInvoice(invoiceId: string): Promise<IntegrationResponse<PayPalInvoice>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v2/invoicing/invoices/${invoiceId}`)
  }

  async listInvoices(params?: { page?: number; page_size?: number; total_required?: boolean }): Promise<IntegrationResponse<{ invoices: PayPalInvoice[] }>> {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', params.page.toString())
    if (params?.page_size) query.set('page_size', params.page_size.toString())
    if (params?.total_required !== undefined) query.set('total_required', params.total_required.toString())

    return this.makeAuthorizedRequest(`${this.baseUrl}/v2/invoicing/invoices${query.toString() ? `?${query}` : ''}`)
  }

  async deleteInvoice(invoiceId: string): Promise<IntegrationResponse<void>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v2/invoicing/invoices/${invoiceId}`, {
      method: 'DELETE',
    })
  }

  async sendInvoice(invoiceId: string, params?: {
    subject?: string
    note?: string
    send_to_recipient?: boolean
    send_to_invoicer?: boolean
  }): Promise<IntegrationResponse<void>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v2/invoicing/invoices/${invoiceId}/send`, {
      method: 'POST',
      body: JSON.stringify(params || {}),
    })
  }

  async sendInvoiceReminder(invoiceId: string, params?: {
    subject?: string
    note?: string
    send_to_recipient?: boolean
    send_to_invoicer?: boolean
  }): Promise<IntegrationResponse<void>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v2/invoicing/invoices/${invoiceId}/remind`, {
      method: 'POST',
      body: JSON.stringify(params || {}),
    })
  }

  async cancelInvoice(invoiceId: string, params?: {
    subject?: string
    note?: string
    send_to_recipient?: boolean
    send_to_invoicer?: boolean
  }): Promise<IntegrationResponse<void>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v2/invoicing/invoices/${invoiceId}/cancel`, {
      method: 'POST',
      body: JSON.stringify(params || {}),
    })
  }

  async recordInvoicePayment(invoiceId: string, params: {
    payment_id?: string
    payment_date?: string
    method: 'BANK_TRANSFER' | 'CASH' | 'CHECK' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'WIRE_TRANSFER' | 'OTHER'
    amount: { currency_code: string; value: string }
    note?: string
  }): Promise<IntegrationResponse<string>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v2/invoicing/invoices/${invoiceId}/payments`, {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async recordInvoiceRefund(invoiceId: string, params: {
    refund_id?: string
    refund_date?: string
    method: 'BANK_TRANSFER' | 'CASH' | 'CHECK' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'WIRE_TRANSFER' | 'OTHER'
    amount: { currency_code: string; value: string }
    note?: string
  }): Promise<IntegrationResponse<string>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v2/invoicing/invoices/${invoiceId}/refunds`, {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async generateInvoiceQRCode(invoiceId: string, params?: { width?: number; height?: number; action?: string }): Promise<IntegrationResponse<string>> {
    const query = new URLSearchParams()
    if (params?.width) query.set('width', params.width.toString())
    if (params?.height) query.set('height', params.height.toString())
    if (params?.action) query.set('action', params.action)

    return this.makeAuthorizedRequest(`${this.baseUrl}/v2/invoicing/invoices/${invoiceId}/generate-qr-code${query.toString() ? `?${query}` : ''}`, {
      method: 'POST',
    })
  }

  // ============ Payout Management ============

  async createPayout(payout: PayPalPayout): Promise<IntegrationResponse<{ batch_header: any; links: any[] }>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/payments/payouts`, {
      method: 'POST',
      body: JSON.stringify(payout),
    })
  }

  async getPayoutBatch(payoutBatchId: string): Promise<IntegrationResponse<any>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/payments/payouts/${payoutBatchId}`)
  }

  async getPayoutItem(payoutItemId: string): Promise<IntegrationResponse<any>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/payments/payouts-item/${payoutItemId}`)
  }

  async cancelPayoutItem(payoutItemId: string): Promise<IntegrationResponse<any>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/payments/payouts-item/${payoutItemId}/cancel`, {
      method: 'POST',
    })
  }

  // ============ Dispute Management ============

  async listDisputes(params?: {
    start_time?: string
    dispute_state?: string
    page_size?: number
    next_page_token?: string
  }): Promise<IntegrationResponse<{ items: PayPalDispute[] }>> {
    const query = new URLSearchParams()
    if (params?.start_time) query.set('start_time', params.start_time)
    if (params?.dispute_state) query.set('dispute_state', params.dispute_state)
    if (params?.page_size) query.set('page_size', params.page_size.toString())
    if (params?.next_page_token) query.set('next_page_token', params.next_page_token)

    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/customer/disputes${query.toString() ? `?${query}` : ''}`)
  }

  async getDispute(disputeId: string): Promise<IntegrationResponse<PayPalDispute>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/customer/disputes/${disputeId}`)
  }

  async acceptDisputeClaim(disputeId: string, params?: {
    note?: string
    accept_claim_type?: 'REFUND' | 'REFUND_WITH_RETURN'
  }): Promise<IntegrationResponse<void>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/customer/disputes/${disputeId}/accept-claim`, {
      method: 'POST',
      body: JSON.stringify(params || {}),
    })
  }

  async sendDisputeMessage(disputeId: string, message: string): Promise<IntegrationResponse<void>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/customer/disputes/${disputeId}/send-message`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    })
  }

  async provideDisputeEvidence(disputeId: string, evidence: any): Promise<IntegrationResponse<void>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/customer/disputes/${disputeId}/provide-evidence`, {
      method: 'POST',
      body: JSON.stringify(evidence),
    })
  }

  async makeDisputeOffer(disputeId: string, offer: {
    note?: string
    offer_type: 'REFUND' | 'REFUND_WITH_REPLACEMENT' | 'REFUND_WITH_RETURN' | 'REPLACEMENT_WITHOUT_RETURN'
    offer_amount?: { currency_code: string; value: string }
  }): Promise<IntegrationResponse<void>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/customer/disputes/${disputeId}/make-offer`, {
      method: 'POST',
      body: JSON.stringify(offer),
    })
  }

  async escalateDisputeToClaim(disputeId: string, params: { note: string; evidence_type?: string }): Promise<IntegrationResponse<void>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/customer/disputes/${disputeId}/escalate`, {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async appealDispute(disputeId: string, evidence: any): Promise<IntegrationResponse<void>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/customer/disputes/${disputeId}/appeal`, {
      method: 'POST',
      body: JSON.stringify(evidence),
    })
  }

  // ============ Webhook Management ============

  async listWebhooks(anchorType?: string): Promise<IntegrationResponse<{ webhooks: any[] }>> {
    const query = anchorType ? `?anchor_type=${anchorType}` : ''
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/notifications/webhooks${query}`)
  }

  async createWebhook(params: {
    url: string
    event_types: Array<{ name: string }>
  }): Promise<IntegrationResponse<any>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/notifications/webhooks`, {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async deleteWebhook(webhookId: string): Promise<IntegrationResponse<void>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/notifications/webhooks/${webhookId}`, {
      method: 'DELETE',
    })
  }

  async updateWebhook(webhookId: string, updates: Array<{ op: string; path: string; value: any }>): Promise<IntegrationResponse<any>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/notifications/webhooks/${webhookId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async getWebhook(webhookId: string): Promise<IntegrationResponse<any>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/notifications/webhooks/${webhookId}`)
  }

  async listWebhookEventTypes(webhookId?: string): Promise<IntegrationResponse<{ event_types: any[] }>> {
    const url = webhookId
      ? `${this.baseUrl}/v1/notifications/webhooks/${webhookId}/event-types`
      : `${this.baseUrl}/v1/notifications/webhooks-event-types`
    return this.makeAuthorizedRequest(url)
  }

  async verifyWebhookSignature(params: {
    transmission_id: string
    transmission_time: string
    cert_url: string
    auth_algo: string
    transmission_sig: string
    webhook_id: string
    webhook_event: PayPalWebhookEvent
  }): Promise<IntegrationResponse<{ verification_status: string }>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async simulateWebhookEvent(params: {
    url: string
    event_type: string
    resource_version?: string
  }): Promise<IntegrationResponse<any>> {
    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/notifications/simulate-event`, {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  // ============ Transaction Search ============

  async searchTransactions(params: {
    transaction_id?: string
    transaction_type?: string
    transaction_status?: string
    transaction_amount?: string
    transaction_currency?: string
    start_date: string
    end_date: string
    payment_instrument_type?: string
    page?: number
    page_size?: number
  }): Promise<IntegrationResponse<{ transaction_details: any[] }>> {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) query.set(key, value.toString())
    })

    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/reporting/transactions?${query}`)
  }

  async listBalances(params?: { as_of_time?: string; currency_code?: string }): Promise<IntegrationResponse<{ balances: any[] }>> {
    const query = new URLSearchParams()
    if (params?.as_of_time) query.set('as_of_time', params.as_of_time)
    if (params?.currency_code) query.set('currency_code', params.currency_code)

    return this.makeAuthorizedRequest(`${this.baseUrl}/v1/reporting/balances${query.toString() ? `?${query}` : ''}`)
  }
}
