/**
 * OpenAI Adapter - GPT-4, Embeddings, Whisper, DALL-E
 */

import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export class OpenAIAdapter extends BaseIntegrationAdapter {
  private apiKey?: string
  private baseUrl = 'https://api.openai.com/v1'

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: true, canReceiveMessages: true, canSendFiles: false, canSendImages: true,
      canSendVideo: false, canSendAudio: true, canSendLocation: false, canSendButtons: false,
      canSendCards: false, canSendCarousels: false, canSendQuickReplies: false, canSendTemplates: false,
      canScheduleMessages: false, canBroadcast: false, canTag: false, canAssign: false,
      canCreateTickets: false, canCreateLeads: false, canCreateContacts: false, canSyncContacts: false,
      canSyncConversations: false, canSyncTickets: false, canExportData: false, canImportData: false,
      canTrackEvents: false, canTrackMetrics: false, canGenerateReports: false, canCreateWorkflows: false,
      canTriggerActions: false, canListenToWebhooks: false, maxMessageLength: 128000,
      maxFileSize: 25 * 1024 * 1024, maxBatchSize: 1, rateLimit: { messages: 3500, period: 'per_minute' },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.apiKey = this.config.credentials.apiKey
    if (!this.apiKey) return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing API key', retryable: false } }
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
        const response = await fetch(`${this.baseUrl}/models`, { headers: { 'Authorization': `Bearer ${this.apiKey}` } })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return await response.json()
      })
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  async createChatCompletion(params: {
    model: string
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
    temperature?: number
    max_tokens?: number
    stream?: boolean
  }): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createEmbedding(params: { input: string | string[]; model?: string }): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/embeddings`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: params.model || 'text-embedding-ada-002', input: params.input }),
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createTranscription(params: { file: Blob; model?: string; language?: string }): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const formData = new FormData()
      formData.append('file', params.file)
      formData.append('model', params.model || 'whisper-1')
      if (params.language) formData.append('language', params.language)

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${this.apiKey}` },
          body: formData,
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
