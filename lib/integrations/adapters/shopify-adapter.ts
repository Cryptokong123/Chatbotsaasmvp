/**
 * Shopify Adapter - E-commerce platform integration
 */

import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export class ShopifyAdapter extends BaseIntegrationAdapter {
  private accessToken?: string
  private shopDomain?: string
  private apiVersion = '2024-01'

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: false, canReceiveMessages: false, canSendFiles: false, canSendImages: false,
      canSendVideo: false, canSendAudio: false, canSendLocation: false, canSendButtons: false,
      canSendCards: false, canSendCarousels: false, canSendQuickReplies: false, canSendTemplates: false,
      canScheduleMessages: false, canBroadcast: false, canTag: true, canAssign: false,
      canCreateTickets: false, canCreateLeads: false, canCreateContacts: true, canSyncContacts: true,
      canSyncConversations: false, canSyncTickets: false, canExportData: true, canImportData: true,
      canTrackEvents: true, canTrackMetrics: true, canGenerateReports: true, canCreateWorkflows: true,
      canTriggerActions: true, canListenToWebhooks: true, maxMessageLength: 0,
      maxFileSize: 0, maxBatchSize: 250, rateLimit: { messages: 40, period: 'per_second' },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.accessToken = this.config.credentials.accessToken
    this.shopDomain = this.config.credentials.domain
    if (!this.accessToken || !this.shopDomain) return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing credentials', retryable: false } }
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
        const response = await fetch(`https://${this.shopDomain}/admin/api/${this.apiVersion}/shop.json`, {
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

  async getOrders(params?: { status?: string; limit?: number }): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.status) query.append('status', params.status)
      if (params?.limit) query.append('limit', params.limit.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`https://${this.shopDomain}/admin/api/${this.apiVersion}/orders.json?${query}`, {
          headers: { 'X-Shopify-Access-Token': this.accessToken! },
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getCustomer(customerId: string): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`https://${this.shopDomain}/admin/api/${this.apiVersion}/customers/${customerId}.json`, {
          headers: { 'X-Shopify-Access-Token': this.accessToken! },
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createCustomer(customer: { email: string; first_name?: string; last_name?: string; phone?: string }): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`https://${this.shopDomain}/admin/api/${this.apiVersion}/customers.json`, {
          method: 'POST',
          headers: { 'X-Shopify-Access-Token': this.accessToken!, 'Content-Type': 'application/json' },
          body: JSON.stringify({ customer }),
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async verifyWebhook(data: string, hmacHeader: string): Promise<boolean> {
    const crypto = require('crypto')
    const secret = this.config.credentials.webhookSecret
    if (!secret) return false
    const hash = crypto.createHmac('sha256', secret).update(data, 'utf8').digest('base64')
    return hash === hmacHeader
  }
}
