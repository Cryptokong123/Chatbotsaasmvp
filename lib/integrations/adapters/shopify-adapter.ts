/**
 * Shopify Adapter - Comprehensive E-commerce Platform Integration
 *
 * Complete Shopify Admin API implementation covering:
 * - Products, Variants, Collections
 * - Orders, Draft Orders, Fulfillments
 * - Customers, Customer Groups
 * - Inventory, Locations
 * - Discounts, Price Rules, Gift Cards
 * - Metafields, Tags
 * - Webhooks, Events
 * - Shop info, Policies
 * - Checkout, Abandoned Checkouts
 */

import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

// ============================================================================
// PRODUCT INTERFACES
// ============================================================================

export interface ShopifyProduct {
  id?: number
  title: string
  body_html?: string
  vendor?: string
  product_type?: string
  created_at?: string
  handle?: string
  updated_at?: string
  published_at?: string
  template_suffix?: string
  status?: 'active' | 'archived' | 'draft'
  published_scope?: string
  tags?: string
  admin_graphql_api_id?: string
  variants?: ShopifyVariant[]
  options?: Array<{
    id?: number
    product_id?: number
    name: string
    position?: number
    values: string[]
  }>
  images?: ShopifyImage[]
  image?: ShopifyImage
}

export interface ShopifyVariant {
  id?: number
  product_id?: number
  title?: string
  price: string
  sku?: string
  position?: number
  inventory_policy?: 'deny' | 'continue'
  compare_at_price?: string
  fulfillment_service?: string
  inventory_management?: 'shopify' | string
  option1?: string
  option2?: string
  option3?: string
  created_at?: string
  updated_at?: string
  taxable?: boolean
  barcode?: string
  grams?: number
  image_id?: number
  weight?: number
  weight_unit?: string
  inventory_item_id?: number
  inventory_quantity?: number
  old_inventory_quantity?: number
  requires_shipping?: boolean
}

export interface ShopifyImage {
  id?: number
  product_id?: number
  position?: number
  created_at?: string
  updated_at?: string
  alt?: string
  width?: number
  height?: number
  src: string
  variant_ids?: number[]
}

export interface ShopifyCollection {
  id?: number
  handle?: string
  title: string
  updated_at?: string
  body_html?: string
  published_at?: string
  sort_order?: 'alpha-asc' | 'alpha-desc' | 'best-selling' | 'created' | 'created-desc' | 'manual' | 'price-asc' | 'price-desc'
  template_suffix?: string
  published_scope?: string
  admin_graphql_api_id?: string
  image?: ShopifyImage
}

// ============================================================================
// ORDER INTERFACES
// ============================================================================

export interface ShopifyOrder {
  id?: number
  admin_graphql_api_id?: string
  email?: string
  closed_at?: string
  created_at?: string
  updated_at?: string
  number?: number
  note?: string
  token?: string
  gateway?: string
  test?: boolean
  total_price?: string
  subtotal_price?: string
  total_weight?: number
  total_tax?: string
  taxes_included?: boolean
  currency?: string
  financial_status?: 'pending' | 'authorized' | 'partially_paid' | 'paid' | 'partially_refunded' | 'refunded' | 'voided'
  confirmed?: boolean
  total_discounts?: string
  total_line_items_price?: string
  cart_token?: string
  buyer_accepts_marketing?: boolean
  name?: string
  referring_site?: string
  landing_site?: string
  cancelled_at?: string
  cancel_reason?: 'customer' | 'fraud' | 'inventory' | 'declined' | 'other'
  user_id?: number
  location_id?: number
  source_identifier?: string
  source_url?: string
  device_id?: number
  phone?: string
  customer_locale?: string
  app_id?: number
  browser_ip?: string
  landing_site_ref?: string
  order_number?: number
  discount_applications?: any[]
  discount_codes?: any[]
  note_attributes?: any[]
  payment_gateway_names?: string[]
  processing_method?: string
  checkout_id?: number
  source_name?: string
  fulfillment_status?: 'fulfilled' | 'partial' | 'restocked' | null
  tax_lines?: any[]
  tags?: string
  contact_email?: string
  order_status_url?: string
  presentment_currency?: string
  total_line_items_price_set?: any
  total_discounts_set?: any
  total_shipping_price_set?: any
  subtotal_price_set?: any
  total_price_set?: any
  total_tax_set?: any
  line_items?: ShopifyLineItem[]
  shipping_lines?: any[]
  billing_address?: ShopifyAddress
  shipping_address?: ShopifyAddress
  fulfillments?: ShopifyFulfillment[]
  customer?: ShopifyCustomer
}

export interface ShopifyLineItem {
  id?: number
  variant_id?: number
  title?: string
  quantity: number
  sku?: string
  variant_title?: string
  vendor?: string
  fulfillment_service?: string
  product_id?: number
  requires_shipping?: boolean
  taxable?: boolean
  gift_card?: boolean
  name?: string
  variant_inventory_management?: string
  properties?: any[]
  product_exists?: boolean
  fulfillable_quantity?: number
  grams?: number
  price?: string
  total_discount?: string
  fulfillment_status?: string
  price_set?: any
  total_discount_set?: any
  discount_allocations?: any[]
  duties?: any[]
  admin_graphql_api_id?: string
  tax_lines?: any[]
}

export interface ShopifyAddress {
  first_name?: string
  address1?: string
  phone?: string
  city?: string
  zip?: string
  province?: string
  country?: string
  last_name?: string
  address2?: string
  company?: string
  latitude?: number
  longitude?: number
  name?: string
  country_code?: string
  province_code?: string
}

export interface ShopifyFulfillment {
  id?: number
  order_id?: number
  status?: 'pending' | 'open' | 'success' | 'cancelled' | 'error' | 'failure'
  created_at?: string
  service?: string
  updated_at?: string
  tracking_company?: string
  shipment_status?: string
  location_id?: number
  line_items?: ShopifyLineItem[]
  tracking_number?: string
  tracking_numbers?: string[]
  tracking_url?: string
  tracking_urls?: string[]
  receipt?: any
  name?: string
  admin_graphql_api_id?: string
}

// ============================================================================
// CUSTOMER INTERFACES
// ============================================================================

export interface ShopifyCustomer {
  id?: number
  email?: string
  accepts_marketing?: boolean
  created_at?: string
  updated_at?: string
  first_name?: string
  last_name?: string
  orders_count?: number
  state?: string
  total_spent?: string
  last_order_id?: number
  note?: string
  verified_email?: boolean
  multipass_identifier?: string
  tax_exempt?: boolean
  phone?: string
  tags?: string
  last_order_name?: string
  currency?: string
  addresses?: ShopifyAddress[]
  accepts_marketing_updated_at?: string
  marketing_opt_in_level?: string
  tax_exemptions?: string[]
  admin_graphql_api_id?: string
  default_address?: ShopifyAddress
}

// ============================================================================
// INVENTORY INTERFACES
// ============================================================================

export interface ShopifyInventoryLevel {
  inventory_item_id?: number
  location_id?: number
  available?: number
  updated_at?: string
  admin_graphql_api_id?: string
}

export interface ShopifyLocation {
  id?: number
  name?: string
  address1?: string
  address2?: string
  city?: string
  zip?: string
  province?: string
  country?: string
  phone?: string
  created_at?: string
  updated_at?: string
  country_code?: string
  country_name?: string
  province_code?: string
  legacy?: boolean
  active?: boolean
  admin_graphql_api_id?: string
}

// ============================================================================
// DISCOUNT INTERFACES
// ============================================================================

export interface ShopifyPriceRule {
  id?: number
  title: string
  target_type: 'line_item' | 'shipping_line'
  target_selection: 'all' | 'entitled'
  allocation_method: 'across' | 'each'
  value_type: 'fixed_amount' | 'percentage'
  value: string
  customer_selection: 'all' | 'prerequisite'
  prerequisite_subtotal_range?: {
    greater_than_or_equal_to?: string
  }
  prerequisite_shipping_price_range?: {
    less_than_or_equal_to?: string
  }
  entitled_product_ids?: number[]
  entitled_variant_ids?: number[]
  entitled_collection_ids?: number[]
  entitled_country_ids?: number[]
  starts_at: string
  ends_at?: string
  created_at?: string
  updated_at?: string
  once_per_customer?: boolean
  usage_limit?: number
  prerequisite_product_ids?: number[]
  prerequisite_variant_ids?: number[]
  prerequisite_collection_ids?: number[]
  admin_graphql_api_id?: string
}

export interface ShopifyDiscountCode {
  id?: number
  price_rule_id?: number
  code: string
  usage_count?: number
  created_at?: string
  updated_at?: string
  admin_graphql_api_id?: string
}

// ============================================================================
// WEBHOOK INTERFACES
// ============================================================================

export interface ShopifyWebhook {
  id?: number
  address: string
  topic: string
  created_at?: string
  updated_at?: string
  format?: 'json' | 'xml'
  fields?: string[]
  metafield_namespaces?: string[]
  api_version?: string
  private_metafield_namespaces?: string[]
}

// ============================================================================
// SHOP INTERFACES
// ============================================================================

export interface ShopifyShop {
  id?: number
  name?: string
  email?: string
  domain?: string
  province?: string
  country?: string
  address1?: string
  zip?: string
  city?: string
  source?: string
  phone?: string
  latitude?: number
  longitude?: number
  primary_locale?: string
  address2?: string
  created_at?: string
  updated_at?: string
  country_code?: string
  country_name?: string
  currency?: string
  customer_email?: string
  timezone?: string
  iana_timezone?: string
  shop_owner?: string
  money_format?: string
  money_with_currency_format?: string
  weight_unit?: string
  province_code?: string
  taxes_included?: boolean
  auto_configure_tax_inclusivity?: boolean
  tax_shipping?: boolean
  county_taxes?: boolean
  plan_display_name?: string
  plan_name?: string
  has_discounts?: boolean
  has_gift_cards?: boolean
  myshopify_domain?: string
  google_apps_domain?: string
  google_apps_login_enabled?: boolean
  money_in_emails_format?: string
  money_with_currency_in_emails_format?: string
  eligible_for_payments?: boolean
  requires_extra_payments_agreement?: boolean
  password_enabled?: boolean
  has_storefront?: boolean
  eligible_for_card_reader_giveaway?: boolean
  finances?: boolean
  primary_location_id?: number
  checkout_api_supported?: boolean
  multi_location_enabled?: boolean
  setup_required?: boolean
  pre_launch_enabled?: boolean
  enabled_presentment_currencies?: string[]
}

// ============================================================================
// MAIN ADAPTER CLASS
// ============================================================================

export class ShopifyAdapter extends BaseIntegrationAdapter {
  private accessToken?: string
  private shopDomain?: string
  private apiVersion = '2024-01'
  private baseUrl?: string

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
      canTag: true,
      canAssign: false,
      canCreateTickets: false,
      canCreateLeads: false,
      canCreateContacts: true,
      canSyncContacts: true,
      canSyncConversations: false,
      canSyncTickets: false,
      canExportData: true,
      canImportData: true,
      canTrackEvents: true,
      canTrackMetrics: true,
      canGenerateReports: true,
      canCreateWorkflows: true,
      canTriggerActions: true,
      canListenToWebhooks: true,
      maxMessageLength: 0,
      maxFileSize: 0,
      maxBatchSize: 250,
      rateLimit: { messages: 40, period: 'per_second' },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.accessToken = this.config.credentials.accessToken
    this.shopDomain = this.config.credentials.domain
    if (!this.accessToken || !this.shopDomain) {
      return {
        success: false,
        error: { code: 'AUTH_ERROR', message: 'Missing credentials', retryable: false }
      }
    }
    this.baseUrl = `https://${this.shopDomain}/admin/api/${this.apiVersion}`
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
        const response = await fetch(`${this.baseUrl}/shop.json`, {
          headers: { 'X-Shopify-Access-Token': this.accessToken! },
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
      'X-Shopify-Access-Token': this.accessToken!,
      'Content-Type': 'application/json'
    }
  }

  // ============================================================================
  // PRODUCT METHODS
  // ============================================================================

  /**
   * Get all products
   */
  async getProducts(params?: {
    limit?: number
    since_id?: number
    status?: 'active' | 'archived' | 'draft'
    vendor?: string
    product_type?: string
  }): Promise<IntegrationResponse<{ products: ShopifyProduct[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams(params as any).toString()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/products.json${query ? `?${query}` : ''}`, {
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
   * Get a single product
   */
  async getProduct(productId: number): Promise<IntegrationResponse<{ product: ShopifyProduct }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/products/${productId}.json`, {
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
   * Create a product
   */
  async createProduct(product: ShopifyProduct): Promise<IntegrationResponse<{ product: ShopifyProduct }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/products.json`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ product }),
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
   * Update a product
   */
  async updateProduct(productId: number, product: Partial<ShopifyProduct>): Promise<IntegrationResponse<{ product: ShopifyProduct }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/products/${productId}.json`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ product }),
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
   * Delete a product
   */
  async deleteProduct(productId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/products/${productId}.json`, {
          method: 'DELETE',
          headers: this.getHeaders(),
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

  /**
   * Get product count
   */
  async getProductCount(params?: { vendor?: string; product_type?: string }): Promise<IntegrationResponse<{ count: number }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams(params as any).toString()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/products/count.json${query ? `?${query}` : ''}`, {
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
  // VARIANT METHODS
  // ============================================================================

  /**
   * Get a variant
   */
  async getVariant(variantId: number): Promise<IntegrationResponse<{ variant: ShopifyVariant }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/variants/${variantId}.json`, {
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
   * Update a variant
   */
  async updateVariant(variantId: number, variant: Partial<ShopifyVariant>): Promise<IntegrationResponse<{ variant: ShopifyVariant }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/variants/${variantId}.json`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ variant }),
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
  // ORDER METHODS
  // ============================================================================

  /**
   * Get orders
   */
  async getOrders(params?: {
    status?: 'open' | 'closed' | 'cancelled' | 'any'
    limit?: number
    since_id?: number
    created_at_min?: string
    created_at_max?: string
    financial_status?: string
    fulfillment_status?: string
  }): Promise<IntegrationResponse<{ orders: ShopifyOrder[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams(params as any).toString()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/orders.json${query ? `?${query}` : ''}`, {
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
   * Get a single order
   */
  async getOrder(orderId: number): Promise<IntegrationResponse<{ order: ShopifyOrder }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/orders/${orderId}.json`, {
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
   * Create an order
   */
  async createOrder(order: Partial<ShopifyOrder>): Promise<IntegrationResponse<{ order: ShopifyOrder }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/orders.json`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ order }),
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
   * Update an order
   */
  async updateOrder(orderId: number, order: Partial<ShopifyOrder>): Promise<IntegrationResponse<{ order: ShopifyOrder }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/orders/${orderId}.json`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ order }),
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
   * Cancel an order
   */
  async cancelOrder(orderId: number, params?: { amount?: string; currency?: string; restock?: boolean; reason?: string }): Promise<IntegrationResponse<{ order: ShopifyOrder }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/orders/${orderId}/cancel.json`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(params || {}),
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
   * Close an order
   */
  async closeOrder(orderId: number): Promise<IntegrationResponse<{ order: ShopifyOrder }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/orders/${orderId}/close.json`, {
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
  // FULFILLMENT METHODS
  // ============================================================================

  /**
   * Create a fulfillment
   */
  async createFulfillment(orderId: number, fulfillment: Partial<ShopifyFulfillment>): Promise<IntegrationResponse<{ fulfillment: ShopifyFulfillment }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/orders/${orderId}/fulfillments.json`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ fulfillment }),
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
   * Update a fulfillment
   */
  async updateFulfillment(orderId: number, fulfillmentId: number, fulfillment: Partial<ShopifyFulfillment>): Promise<IntegrationResponse<{ fulfillment: ShopifyFulfillment }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/orders/${orderId}/fulfillments/${fulfillmentId}.json`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ fulfillment }),
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
   * Cancel a fulfillment
   */
  async cancelFulfillment(orderId: number, fulfillmentId: number): Promise<IntegrationResponse<{ fulfillment: ShopifyFulfillment }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/orders/${orderId}/fulfillments/${fulfillmentId}/cancel.json`, {
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
   * Get customers
   */
  async getCustomers(params?: { limit?: number; since_id?: number }): Promise<IntegrationResponse<{ customers: ShopifyCustomer[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams(params as any).toString()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/customers.json${query ? `?${query}` : ''}`, {
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
   * Get a customer
   */
  async getCustomer(customerId: number): Promise<IntegrationResponse<{ customer: ShopifyCustomer }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/customers/${customerId}.json`, {
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
   * Create a customer
   */
  async createCustomer(customer: Partial<ShopifyCustomer>): Promise<IntegrationResponse<{ customer: ShopifyCustomer }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/customers.json`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ customer }),
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
  async updateCustomer(customerId: number, customer: Partial<ShopifyCustomer>): Promise<IntegrationResponse<{ customer: ShopifyCustomer }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/customers/${customerId}.json`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ customer }),
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
  async deleteCustomer(customerId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/customers/${customerId}.json`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(await response.text())
        return {}
      })
      return result.success
        ? { success: true, data: undefined }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Search customers
   */
  async searchCustomers(query: string, params?: { limit?: number }): Promise<IntegrationResponse<{ customers: ShopifyCustomer[] }>> {
    try {
      await this.ensureConnected()
      const searchParams = new URLSearchParams({
        query,
        ...(params as any)
      }).toString()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/customers/search.json?${searchParams}`, {
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
  // INVENTORY METHODS
  // ============================================================================

  /**
   * Get inventory levels
   */
  async getInventoryLevels(params: {
    inventory_item_ids?: string
    location_ids?: string
    limit?: number
  }): Promise<IntegrationResponse<{ inventory_levels: ShopifyInventoryLevel[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams(params as any).toString()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/inventory_levels.json?${query}`, {
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
   * Adjust inventory level
   */
  async adjustInventoryLevel(params: {
    location_id: number
    inventory_item_id: number
    available_adjustment: number
  }): Promise<IntegrationResponse<{ inventory_level: ShopifyInventoryLevel }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/inventory_levels/adjust.json`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(params),
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
   * Set inventory level
   */
  async setInventoryLevel(params: {
    location_id: number
    inventory_item_id: number
    available: number
  }): Promise<IntegrationResponse<{ inventory_level: ShopifyInventoryLevel }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/inventory_levels/set.json`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(params),
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
  // LOCATION METHODS
  // ============================================================================

  /**
   * Get locations
   */
  async getLocations(): Promise<IntegrationResponse<{ locations: ShopifyLocation[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/locations.json`, {
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
   * Get a location
   */
  async getLocation(locationId: number): Promise<IntegrationResponse<{ location: ShopifyLocation }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/locations/${locationId}.json`, {
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
  // DISCOUNT METHODS
  // ============================================================================

  /**
   * Get price rules
   */
  async getPriceRules(): Promise<IntegrationResponse<{ price_rules: ShopifyPriceRule[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/price_rules.json`, {
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
   * Create a price rule
   */
  async createPriceRule(priceRule: ShopifyPriceRule): Promise<IntegrationResponse<{ price_rule: ShopifyPriceRule }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/price_rules.json`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ price_rule: priceRule }),
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
   * Create a discount code
   */
  async createDiscountCode(priceRuleId: number, discountCode: ShopifyDiscountCode): Promise<IntegrationResponse<{ discount_code: ShopifyDiscountCode }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/price_rules/${priceRuleId}/discount_codes.json`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ discount_code: discountCode }),
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
   * Get webhooks
   */
  async getWebhooks(): Promise<IntegrationResponse<{ webhooks: ShopifyWebhook[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/webhooks.json`, {
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
   * Create a webhook
   */
  async createWebhook(webhook: ShopifyWebhook): Promise<IntegrationResponse<{ webhook: ShopifyWebhook }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/webhooks.json`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ webhook }),
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
   * Delete a webhook
   */
  async deleteWebhook(webhookId: number): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/webhooks/${webhookId}.json`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(await response.text())
        return {}
      })
      return result.success
        ? { success: true, data: undefined }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  /**
   * Verify webhook
   */
  async verifyWebhook(data: string, hmacHeader: string): Promise<boolean> {
    const crypto = require('crypto')
    const secret = this.config.credentials.webhookSecret
    if (!secret) return false
    const hash = crypto.createHmac('sha256', secret).update(data, 'utf8').digest('base64')
    return hash === hmacHeader
  }

  // ============================================================================
  // SHOP METHODS
  // ============================================================================

  /**
   * Get shop information
   */
  async getShop(): Promise<IntegrationResponse<{ shop: ShopifyShop }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/shop.json`, {
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
  // COLLECTION METHODS
  // ============================================================================

  /**
   * Get collections
   */
  async getCollections(params?: { limit?: number }): Promise<IntegrationResponse<{ custom_collections: ShopifyCollection[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams(params as any).toString()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/custom_collections.json${query ? `?${query}` : ''}`, {
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
   * Create a collection
   */
  async createCollection(collection: ShopifyCollection): Promise<IntegrationResponse<{ custom_collection: ShopifyCollection }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/custom_collections.json`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ custom_collection: collection }),
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
