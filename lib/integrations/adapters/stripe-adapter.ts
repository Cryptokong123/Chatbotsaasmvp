/**
 * Stripe Adapter - Payments, Billing, Connect
 */

import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export class StripeAdapter extends BaseIntegrationAdapter {
  private secretKey?: string
  private baseUrl = 'https://api.stripe.com/v1'

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: false, canReceiveMessages: false, canSendFiles: false, canSendImages: false,
      canSendVideo: false, canSendAudio: false, canSendLocation: false, canSendButtons: false,
      canSendCards: false, canSendCarousels: false, canSendQuickReplies: false, canSendTemplates: false,
      canScheduleMessages: false, canBroadcast: false, canTag: false, canAssign: false,
      canCreateTickets: false, canCreateLeads: false, canCreateContacts: true, canSyncContacts: true,
      canSyncConversations: false, canSyncTickets: false, canExportData: true, canImportData: false,
      canTrackEvents: true, canTrackMetrics: true, canGenerateReports: true, canCreateWorkflows: true,
      canTriggerActions: true, canListenToWebhooks: true, maxMessageLength: 0,
      maxFileSize: 0, maxBatchSize: 100, rateLimit: { messages: 100, period: 'per_second' },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.secretKey = this.config.credentials.secretKey
    if (!this.secretKey) return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing secret key', retryable: false } }
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
        const response = await fetch(`${this.baseUrl}/balance`, { headers: { 'Authorization': `Bearer ${this.secretKey}` } })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return await response.json()
      })
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  async createPaymentIntent(params: { amount: number; currency: string; customer?: string; metadata?: Record<string, string> }): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const formData = new URLSearchParams({ amount: params.amount.toString(), currency: params.currency })
      if (params.customer) formData.append('customer', params.customer)
      if (params.metadata) Object.entries(params.metadata).forEach(([k, v]) => formData.append(`metadata[${k}]`, v))

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/payment_intents`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString(),
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createCustomer(params: { email: string; name?: string; phone?: string; metadata?: Record<string, string> }): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const formData = new URLSearchParams({ email: params.email })
      if (params.name) formData.append('name', params.name)
      if (params.phone) formData.append('phone', params.phone)
      if (params.metadata) Object.entries(params.metadata).forEach(([k, v]) => formData.append(`metadata[${k}]`, v))

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/customers`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString(),
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createSubscription(params: { customer: string; items: Array<{ price: string; quantity?: number }>; trial_period_days?: number }): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const formData = new URLSearchParams({ customer: params.customer })
      params.items.forEach((item, i) => {
        formData.append(`items[${i}][price]`, item.price)
        if (item.quantity) formData.append(`items[${i}][quantity]`, item.quantity.toString())
      })
      if (params.trial_period_days) formData.append('trial_period_days', params.trial_period_days.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/subscriptions`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.secretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString(),
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async verifyWebhook(payload: string, signature: string, secret: string): Promise<boolean> {
    const crypto = require('crypto')
    const [timestamp, sig] = signature.split(',').map(p => p.split('=')[1])
    const signedPayload = `${timestamp}.${payload}`
    const expectedSig = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex')
    return sig === expectedSig
  }
}
