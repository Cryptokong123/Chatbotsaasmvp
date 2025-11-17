/**
 * PayPal Adapter - Payment processing
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export class PayPalAdapter extends BaseIntegrationAdapter {
  private clientId?: string
  private clientSecret?: string
  private mode?: 'sandbox' | 'live'
  private baseUrl?: string

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
      maxFileSize: 0, maxBatchSize: 1, rateLimit: { messages: 50, period: 'per_second' as const },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.clientId = this.config.credentials.clientId
    this.clientSecret = this.config.credentials.clientSecret
    this.mode = (this.config.credentials.mode as 'sandbox' | 'live') || 'sandbox'
    if (!this.clientId || !this.clientSecret) return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing credentials', retryable: false } }
    this.baseUrl = this.mode === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'
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
      const token = await this.getAccessToken()
      return { success: token.success, data: token.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  async getAccessToken(): Promise<IntegrationResponse<{ access_token: string }>> {
    try {
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
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createOrder(params: { intent: string; purchase_units: any[] }): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const tokenResult = await this.getAccessToken()
      if (!tokenResult.success) return { success: false, error: tokenResult.error }
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${tokenResult.data!.access_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        })
        if (!response.ok) throw new Error(`PayPal API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async captureOrder(orderId: string): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const tokenResult = await this.getAccessToken()
      if (!tokenResult.success) return { success: false, error: tokenResult.error }
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${orderId}/capture`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${tokenResult.data!.access_token}`, 'Content-Type': 'application/json' },
        })
        if (!response.ok) throw new Error(`PayPal API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
