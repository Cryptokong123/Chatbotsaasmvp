/**
 * OpenAI Adapter - Comprehensive Integration
 *
 * Complete OpenAI Platform implementation covering:
 * - Chat Completions (GPT-4, GPT-3.5, Vision, Function Calling)
 * - Embeddings (text-embedding-3-small, text-embedding-3-large, ada-002)
 * - Images (DALL-E 2/3: Generate, Edit, Variations)
 * - Audio (Whisper: Transcriptions, Translations, TTS)
 * - Fine-tuning (Create, Monitor, Deploy custom models)
 * - Assistants API (Create assistants, threads, messages, runs)
 * - Files, Moderations, Models, Batches
 */

import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

// ============================================================================
// CHAT COMPLETION INTERFACES
// ============================================================================

export interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool' | 'function'
  content: string | Array<{
    type: 'text' | 'image_url'
    text?: string
    image_url?: {
      url: string
      detail?: 'auto' | 'low' | 'high'
    }
  }>
  name?: string
  tool_calls?: OpenAIToolCall[]
  tool_call_id?: string
  function_call?: {
    name: string
    arguments: string
  }
}

export interface OpenAIToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface OpenAIFunction {
  name: string
  description?: string
  parameters: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
}

export interface OpenAIChatCompletionRequest {
  model: string
  messages: OpenAIChatMessage[]
  temperature?: number
  top_p?: number
  n?: number
  stream?: boolean
  stop?: string | string[]
  max_tokens?: number
  presence_penalty?: number
  frequency_penalty?: number
  logit_bias?: Record<string, number>
  user?: string
  response_format?: { type: 'text' | 'json_object' }
  seed?: number
  tools?: Array<{
    type: 'function'
    function: OpenAIFunction
  }>
  tool_choice?: 'none' | 'auto' | { type: 'function'; function: { name: string } }
  function_call?: 'none' | 'auto' | { name: string }
  functions?: OpenAIFunction[]
}

export interface OpenAIChatCompletionResponse {
  id: string
  object: 'chat.completion'
  created: number
  model: string
  choices: Array<{
    index: number
    message: OpenAIChatMessage
    finish_reason: 'stop' | 'length' | 'function_call' | 'tool_calls' | 'content_filter'
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// ============================================================================
// EMBEDDING INTERFACES
// ============================================================================

export interface OpenAIEmbeddingRequest {
  input: string | string[]
  model: 'text-embedding-3-small' | 'text-embedding-3-large' | 'text-embedding-ada-002'
  encoding_format?: 'float' | 'base64'
  dimensions?: number
  user?: string
}

export interface OpenAIEmbeddingResponse {
  object: 'list'
  data: Array<{
    object: 'embedding'
    embedding: number[]
    index: number
  }>
  model: string
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}

// ============================================================================
// IMAGE GENERATION INTERFACES
// ============================================================================

export interface OpenAIImageGenerateRequest {
  prompt: string
  model?: 'dall-e-2' | 'dall-e-3'
  n?: number
  quality?: 'standard' | 'hd'
  response_format?: 'url' | 'b64_json'
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792'
  style?: 'vivid' | 'natural'
  user?: string
}

export interface OpenAIImageEditRequest {
  image: Blob
  prompt: string
  mask?: Blob
  model?: 'dall-e-2'
  n?: number
  size?: '256x256' | '512x512' | '1024x1024'
  response_format?: 'url' | 'b64_json'
  user?: string
}

export interface OpenAIImageVariationRequest {
  image: Blob
  model?: 'dall-e-2'
  n?: number
  response_format?: 'url' | 'b64_json'
  size?: '256x256' | '512x512' | '1024x1024'
  user?: string
}

export interface OpenAIImageResponse {
  created: number
  data: Array<{
    url?: string
    b64_json?: string
    revised_prompt?: string
  }>
}

// ============================================================================
// AUDIO INTERFACES
// ============================================================================

export interface OpenAITranscriptionRequest {
  file: Blob
  model: 'whisper-1'
  language?: string
  prompt?: string
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt'
  temperature?: number
}

export interface OpenAITranslationRequest {
  file: Blob
  model: 'whisper-1'
  prompt?: string
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt'
  temperature?: number
}

export interface OpenAISpeechRequest {
  model: 'tts-1' | 'tts-1-hd'
  input: string
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  response_format?: 'mp3' | 'opus' | 'aac' | 'flac'
  speed?: number
}

// ============================================================================
// FILE INTERFACES
// ============================================================================

export interface OpenAIFile {
  id: string
  object: 'file'
  bytes: number
  created_at: number
  filename: string
  purpose: 'fine-tune' | 'fine-tune-results' | 'assistants' | 'assistants_output'
  status?: 'uploaded' | 'processed' | 'error'
  status_details?: string
}

// ============================================================================
// FINE-TUNING INTERFACES
// ============================================================================

export interface OpenAIFineTuningJob {
  id: string
  object: 'fine_tuning.job'
  created_at: number
  error?: {
    code: string
    message: string
    param?: string
  }
  fine_tuned_model?: string
  finished_at?: number
  hyperparameters: {
    n_epochs: number | 'auto'
    batch_size?: number | 'auto'
    learning_rate_multiplier?: number | 'auto'
  }
  model: string
  organization_id: string
  result_files: string[]
  status: 'validating_files' | 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled'
  trained_tokens?: number
  training_file: string
  validation_file?: string
}

export interface OpenAIFineTuningRequest {
  training_file: string
  validation_file?: string
  model: string
  hyperparameters?: {
    n_epochs?: number | 'auto'
    batch_size?: number | 'auto'
    learning_rate_multiplier?: number | 'auto'
  }
  suffix?: string
}

// ============================================================================
// MODERATION INTERFACES
// ============================================================================

export interface OpenAIModerationRequest {
  input: string | string[]
  model?: 'text-moderation-latest' | 'text-moderation-stable'
}

export interface OpenAIModerationResponse {
  id: string
  model: string
  results: Array<{
    flagged: boolean
    categories: {
      hate: boolean
      'hate/threatening': boolean
      harassment: boolean
      'harassment/threatening': boolean
      'self-harm': boolean
      'self-harm/intent': boolean
      'self-harm/instructions': boolean
      sexual: boolean
      'sexual/minors': boolean
      violence: boolean
      'violence/graphic': boolean
    }
    category_scores: {
      hate: number
      'hate/threatening': number
      harassment: number
      'harassment/threatening': number
      'self-harm': number
      'self-harm/intent': number
      'self-harm/instructions': number
      sexual: number
      'sexual/minors': number
      violence: number
      'violence/graphic': number
    }
  }>
}

// ============================================================================
// ASSISTANT INTERFACES
// ============================================================================

export interface OpenAIAssistant {
  id: string
  object: 'assistant'
  created_at: number
  name?: string
  description?: string
  model: string
  instructions?: string
  tools: Array<{
    type: 'code_interpreter' | 'retrieval' | 'function'
    function?: OpenAIFunction
  }>
  file_ids: string[]
  metadata?: Record<string, string>
}

export interface OpenAIThread {
  id: string
  object: 'thread'
  created_at: number
  metadata?: Record<string, string>
}

export interface OpenAIMessage {
  id: string
  object: 'thread.message'
  created_at: number
  thread_id: string
  role: 'user' | 'assistant'
  content: Array<{
    type: 'text' | 'image_file'
    text?: {
      value: string
      annotations: any[]
    }
    image_file?: {
      file_id: string
    }
  }>
  file_ids: string[]
  assistant_id?: string
  run_id?: string
  metadata?: Record<string, string>
}

export interface OpenAIRun {
  id: string
  object: 'thread.run'
  created_at: number
  thread_id: string
  assistant_id: string
  status: 'queued' | 'in_progress' | 'requires_action' | 'cancelling' | 'cancelled' | 'failed' | 'completed' | 'expired'
  required_action?: {
    type: 'submit_tool_outputs'
    submit_tool_outputs: {
      tool_calls: OpenAIToolCall[]
    }
  }
  last_error?: {
    code: string
    message: string
  }
  expires_at: number
  started_at?: number
  cancelled_at?: number
  failed_at?: number
  completed_at?: number
  model: string
  instructions: string
  tools: any[]
  file_ids: string[]
  metadata?: Record<string, string>
}

// ============================================================================
// BATCH INTERFACES
// ============================================================================

export interface OpenAIBatch {
  id: string
  object: 'batch'
  endpoint: string
  errors?: {
    object: 'list'
    data: any[]
  }
  input_file_id: string
  completion_window: string
  status: 'validating' | 'failed' | 'in_progress' | 'finalizing' | 'completed' | 'expired' | 'cancelling' | 'cancelled'
  output_file_id?: string
  error_file_id?: string
  created_at: number
  in_progress_at?: number
  expires_at?: number
  finalizing_at?: number
  completed_at?: number
  failed_at?: number
  expired_at?: number
  cancelling_at?: number
  cancelled_at?: number
  request_counts?: {
    total: number
    completed: number
    failed: number
  }
  metadata?: Record<string, string>
}

// ============================================================================
// MODEL INTERFACES
// ============================================================================

export interface OpenAIModel {
  id: string
  object: 'model'
  created: number
  owned_by: string
}

// ============================================================================
// MAIN ADAPTER CLASS
// ============================================================================

export class OpenAIAdapter extends BaseIntegrationAdapter {
  private apiKey?: string
  private organization?: string
  private baseUrl = 'https://api.openai.com/v1'

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: true,
      canReceiveMessages: true,
      canSendFiles: false,
      canSendImages: true,
      canSendVideo: false,
      canSendAudio: true,
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
      canCreateContacts: false,
      canSyncContacts: false,
      canSyncConversations: false,
      canSyncTickets: false,
      canExportData: false,
      canImportData: false,
      canTrackEvents: false,
      canTrackMetrics: false,
      canGenerateReports: false,
      canCreateWorkflows: false,
      canTriggerActions: false,
      canListenToWebhooks: false,
      maxMessageLength: 128000,
      maxFileSize: 25 * 1024 * 1024,
      maxBatchSize: 1,
      rateLimit: { messages: 3500, period: 'per_minute' },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.apiKey = this.config.credentials.apiKey
    this.organization = this.config.credentials.organization
    if (!this.apiKey) {
      return {
        success: false,
        error: { code: 'AUTH_ERROR', message: 'Missing API key', retryable: false }
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
        const response = await fetch(`${this.baseUrl}/models`, {
          headers: this.getHeaders()
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
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    }
    if (this.organization) {
      headers['OpenAI-Organization'] = this.organization
    }
    return headers
  }

  // ============================================================================
  // CHAT COMPLETION METHODS
  // ============================================================================

  /**
   * Create a chat completion
   */
  async createChatCompletion(request: OpenAIChatCompletionRequest): Promise<IntegrationResponse<OpenAIChatCompletionResponse>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(request),
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
   * Create a simple chat completion
   */
  async chat(message: string, systemPrompt?: string, model: string = 'gpt-4'): Promise<IntegrationResponse<string>> {
    const messages: OpenAIChatMessage[] = []
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }
    messages.push({ role: 'user', content: message })

    const result = await this.createChatCompletion({ model, messages })
    if (result.success && result.data) {
      return {
        success: true,
        data: result.data.choices[0]?.message.content as string
      }
    }
    return { success: false, error: result.error }
  }

  /**
   * Create chat completion with vision (image analysis)
   */
  async chatWithVision(
    message: string,
    imageUrl: string,
    model: string = 'gpt-4-vision-preview'
  ): Promise<IntegrationResponse<string>> {
    const result = await this.createChatCompletion({
      model,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: message },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }]
    })
    if (result.success && result.data) {
      return {
        success: true,
        data: result.data.choices[0]?.message.content as string
      }
    }
    return { success: false, error: result.error }
  }

  /**
   * Create chat completion with function calling
   */
  async chatWithFunctions(
    messages: OpenAIChatMessage[],
    functions: OpenAIFunction[],
    model: string = 'gpt-4'
  ): Promise<IntegrationResponse<OpenAIChatCompletionResponse>> {
    return this.createChatCompletion({
      model,
      messages,
      tools: functions.map(f => ({ type: 'function', function: f })),
      tool_choice: 'auto'
    })
  }

  // ============================================================================
  // EMBEDDING METHODS
  // ============================================================================

  /**
   * Create embeddings
   */
  async createEmbedding(request: OpenAIEmbeddingRequest): Promise<IntegrationResponse<OpenAIEmbeddingResponse>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/embeddings`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(request),
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
   * Create embedding for a single text
   */
  async embed(
    text: string,
    model: 'text-embedding-3-small' | 'text-embedding-3-large' | 'text-embedding-ada-002' = 'text-embedding-3-small'
  ): Promise<IntegrationResponse<number[]>> {
    const result = await this.createEmbedding({ input: text, model })
    if (result.success && result.data) {
      return {
        success: true,
        data: result.data.data[0]?.embedding
      }
    }
    return { success: false, error: result.error }
  }

  // ============================================================================
  // IMAGE GENERATION METHODS (DALL-E)
  // ============================================================================

  /**
   * Generate an image
   */
  async generateImage(request: OpenAIImageGenerateRequest): Promise<IntegrationResponse<OpenAIImageResponse>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/images/generations`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(request),
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
   * Edit an image
   */
  async editImage(request: OpenAIImageEditRequest): Promise<IntegrationResponse<OpenAIImageResponse>> {
    try {
      await this.ensureConnected()
      const formData = new FormData()
      formData.append('image', request.image)
      formData.append('prompt', request.prompt)
      if (request.mask) formData.append('mask', request.mask)
      if (request.model) formData.append('model', request.model)
      if (request.n) formData.append('n', request.n.toString())
      if (request.size) formData.append('size', request.size)
      if (request.response_format) formData.append('response_format', request.response_format)
      if (request.user) formData.append('user', request.user)

      const result = await this.makeRequest(async () => {
        const headers = this.getHeaders()
        delete headers['Content-Type'] // Let browser set multipart boundary
        const response = await fetch(`${this.baseUrl}/images/edits`, {
          method: 'POST',
          headers,
          body: formData,
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
   * Create image variation
   */
  async createImageVariation(request: OpenAIImageVariationRequest): Promise<IntegrationResponse<OpenAIImageResponse>> {
    try {
      await this.ensureConnected()
      const formData = new FormData()
      formData.append('image', request.image)
      if (request.model) formData.append('model', request.model)
      if (request.n) formData.append('n', request.n.toString())
      if (request.response_format) formData.append('response_format', request.response_format)
      if (request.size) formData.append('size', request.size)
      if (request.user) formData.append('user', request.user)

      const result = await this.makeRequest(async () => {
        const headers = this.getHeaders()
        delete headers['Content-Type']
        const response = await fetch(`${this.baseUrl}/images/variations`, {
          method: 'POST',
          headers,
          body: formData,
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
  // AUDIO METHODS
  // ============================================================================

  /**
   * Create transcription (Whisper)
   */
  async createTranscription(request: OpenAITranscriptionRequest): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const formData = new FormData()
      formData.append('file', request.file)
      formData.append('model', request.model)
      if (request.language) formData.append('language', request.language)
      if (request.prompt) formData.append('prompt', request.prompt)
      if (request.response_format) formData.append('response_format', request.response_format)
      if (request.temperature !== undefined) formData.append('temperature', request.temperature.toString())

      const result = await this.makeRequest(async () => {
        const headers = this.getHeaders()
        delete headers['Content-Type']
        const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
          method: 'POST',
          headers,
          body: formData,
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
   * Create translation (Whisper)
   */
  async createTranslation(request: OpenAITranslationRequest): Promise<IntegrationResponse<any>> {
    try {
      await this.ensureConnected()
      const formData = new FormData()
      formData.append('file', request.file)
      formData.append('model', request.model)
      if (request.prompt) formData.append('prompt', request.prompt)
      if (request.response_format) formData.append('response_format', request.response_format)
      if (request.temperature !== undefined) formData.append('temperature', request.temperature.toString())

      const result = await this.makeRequest(async () => {
        const headers = this.getHeaders()
        delete headers['Content-Type']
        const response = await fetch(`${this.baseUrl}/audio/translations`, {
          method: 'POST',
          headers,
          body: formData,
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
   * Create speech (TTS)
   */
  async createSpeech(request: OpenAISpeechRequest): Promise<IntegrationResponse<ArrayBuffer>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/audio/speech`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(request),
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.arrayBuffer()
      })
      return result.success
        ? { success: true, data: result.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // FILE METHODS
  // ============================================================================

  /**
   * Upload a file
   */
  async uploadFile(file: Blob, purpose: OpenAIFile['purpose']): Promise<IntegrationResponse<OpenAIFile>> {
    try {
      await this.ensureConnected()
      const formData = new FormData()
      formData.append('file', file)
      formData.append('purpose', purpose)

      const result = await this.makeRequest(async () => {
        const headers = this.getHeaders()
        delete headers['Content-Type']
        const response = await fetch(`${this.baseUrl}/files`, {
          method: 'POST',
          headers,
          body: formData,
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
   * List files
   */
  async listFiles(purpose?: string): Promise<IntegrationResponse<{ data: OpenAIFile[] }>> {
    try {
      await this.ensureConnected()
      const url = purpose ? `${this.baseUrl}/files?purpose=${purpose}` : `${this.baseUrl}/files`
      const result = await this.makeRequest(async () => {
        const response = await fetch(url, {
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
   * Retrieve a file
   */
  async retrieveFile(fileId: string): Promise<IntegrationResponse<OpenAIFile>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/files/${fileId}`, {
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
   * Delete a file
   */
  async deleteFile(fileId: string): Promise<IntegrationResponse<{ id: string; deleted: boolean }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/files/${fileId}`, {
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
   * Retrieve file content
   */
  async retrieveFileContent(fileId: string): Promise<IntegrationResponse<string>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/files/${fileId}/content`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(await response.text())
        return await response.text()
      })
      return result.success
        ? { success: true, data: result.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ============================================================================
  // FINE-TUNING METHODS
  // ============================================================================

  /**
   * Create fine-tuning job
   */
  async createFineTuningJob(request: OpenAIFineTuningRequest): Promise<IntegrationResponse<OpenAIFineTuningJob>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/fine_tuning/jobs`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(request),
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
   * List fine-tuning jobs
   */
  async listFineTuningJobs(limit?: number, after?: string): Promise<IntegrationResponse<{ data: OpenAIFineTuningJob[] }>> {
    try {
      await this.ensureConnected()
      const params = new URLSearchParams()
      if (limit) params.append('limit', limit.toString())
      if (after) params.append('after', after)
      const url = `${this.baseUrl}/fine_tuning/jobs${params.toString() ? `?${params}` : ''}`

      const result = await this.makeRequest(async () => {
        const response = await fetch(url, {
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
   * Retrieve fine-tuning job
   */
  async retrieveFineTuningJob(jobId: string): Promise<IntegrationResponse<OpenAIFineTuningJob>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/fine_tuning/jobs/${jobId}`, {
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
   * Cancel fine-tuning job
   */
  async cancelFineTuningJob(jobId: string): Promise<IntegrationResponse<OpenAIFineTuningJob>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/fine_tuning/jobs/${jobId}/cancel`, {
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
  // MODERATION METHODS
  // ============================================================================

  /**
   * Create moderation
   */
  async createModeration(request: OpenAIModerationRequest): Promise<IntegrationResponse<OpenAIModerationResponse>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/moderations`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(request),
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
  // MODEL METHODS
  // ============================================================================

  /**
   * List models
   */
  async listModels(): Promise<IntegrationResponse<{ data: OpenAIModel[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/models`, {
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
   * Retrieve model
   */
  async retrieveModel(modelId: string): Promise<IntegrationResponse<OpenAIModel>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/models/${modelId}`, {
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
  // ASSISTANTS API METHODS
  // ============================================================================

  /**
   * Create assistant
   */
  async createAssistant(assistant: Partial<OpenAIAssistant>): Promise<IntegrationResponse<OpenAIAssistant>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/assistants`, {
          method: 'POST',
          headers: { ...this.getHeaders(), 'OpenAI-Beta': 'assistants=v1' },
          body: JSON.stringify(assistant),
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
   * Retrieve assistant
   */
  async retrieveAssistant(assistantId: string): Promise<IntegrationResponse<OpenAIAssistant>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/assistants/${assistantId}`, {
          headers: { ...this.getHeaders(), 'OpenAI-Beta': 'assistants=v1' },
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
   * List assistants
   */
  async listAssistants(): Promise<IntegrationResponse<{ data: OpenAIAssistant[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/assistants`, {
          headers: { ...this.getHeaders(), 'OpenAI-Beta': 'assistants=v1' },
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
   * Delete assistant
   */
  async deleteAssistant(assistantId: string): Promise<IntegrationResponse<{ id: string; deleted: boolean }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/assistants/${assistantId}`, {
          method: 'DELETE',
          headers: { ...this.getHeaders(), 'OpenAI-Beta': 'assistants=v1' },
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
   * Create thread
   */
  async createThread(messages?: Array<{ role: 'user'; content: string }>): Promise<IntegrationResponse<OpenAIThread>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/threads`, {
          method: 'POST',
          headers: { ...this.getHeaders(), 'OpenAI-Beta': 'assistants=v1' },
          body: JSON.stringify({ messages }),
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
   * Create message in thread
   */
  async createMessage(threadId: string, content: string, role: 'user' = 'user'): Promise<IntegrationResponse<OpenAIMessage>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/threads/${threadId}/messages`, {
          method: 'POST',
          headers: { ...this.getHeaders(), 'OpenAI-Beta': 'assistants=v1' },
          body: JSON.stringify({ role, content }),
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
   * List messages in thread
   */
  async listMessages(threadId: string): Promise<IntegrationResponse<{ data: OpenAIMessage[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/threads/${threadId}/messages`, {
          headers: { ...this.getHeaders(), 'OpenAI-Beta': 'assistants=v1' },
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
   * Create run
   */
  async createRun(threadId: string, assistantId: string, instructions?: string): Promise<IntegrationResponse<OpenAIRun>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/threads/${threadId}/runs`, {
          method: 'POST',
          headers: { ...this.getHeaders(), 'OpenAI-Beta': 'assistants=v1' },
          body: JSON.stringify({ assistant_id: assistantId, instructions }),
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
   * Retrieve run
   */
  async retrieveRun(threadId: string, runId: string): Promise<IntegrationResponse<OpenAIRun>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/threads/${threadId}/runs/${runId}`, {
          headers: { ...this.getHeaders(), 'OpenAI-Beta': 'assistants=v1' },
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
   * Submit tool outputs to run
   */
  async submitToolOutputs(
    threadId: string,
    runId: string,
    toolOutputs: Array<{ tool_call_id: string; output: string }>
  ): Promise<IntegrationResponse<OpenAIRun>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/threads/${threadId}/runs/${runId}/submit_tool_outputs`, {
          method: 'POST',
          headers: { ...this.getHeaders(), 'OpenAI-Beta': 'assistants=v1' },
          body: JSON.stringify({ tool_outputs: toolOutputs }),
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
   * Cancel run
   */
  async cancelRun(threadId: string, runId: string): Promise<IntegrationResponse<OpenAIRun>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/threads/${threadId}/runs/${runId}/cancel`, {
          method: 'POST',
          headers: { ...this.getHeaders(), 'OpenAI-Beta': 'assistants=v1' },
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
  // BATCH METHODS
  // ============================================================================

  /**
   * Create batch
   */
  async createBatch(inputFileId: string, endpoint: string, completionWindow: '24h' = '24h'): Promise<IntegrationResponse<OpenAIBatch>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/batches`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            input_file_id: inputFileId,
            endpoint,
            completion_window: completionWindow
          }),
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
   * Retrieve batch
   */
  async retrieveBatch(batchId: string): Promise<IntegrationResponse<OpenAIBatch>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/batches/${batchId}`, {
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
   * Cancel batch
   */
  async cancelBatch(batchId: string): Promise<IntegrationResponse<OpenAIBatch>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/batches/${batchId}/cancel`, {
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
   * List batches
   */
  async listBatches(limit?: number, after?: string): Promise<IntegrationResponse<{ data: OpenAIBatch[] }>> {
    try {
      await this.ensureConnected()
      const params = new URLSearchParams()
      if (limit) params.append('limit', limit.toString())
      if (after) params.append('after', after)
      const url = `${this.baseUrl}/batches${params.toString() ? `?${params}` : ''}`

      const result = await this.makeRequest(async () => {
        const response = await fetch(url, {
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
