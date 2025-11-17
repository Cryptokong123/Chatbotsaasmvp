/**
 * Anthropic Claude Adapter
 *
 * Complete integration with Anthropic's Claude AI models:
 * - Claude 3.5 Sonnet (most intelligent, best for complex tasks)
 * - Claude 3 Opus (strong performance, balanced)
 * - Claude 3 Haiku (fastest, most affordable)
 * - Claude 3 Sonnet (previous generation)
 * - Streaming responses
 * - Vision (image understanding)
 * - Tool use (function calling)
 * - Prompt caching (cost optimization)
 * - System prompts
 * - Multi-turn conversations
 * - Batch processing
 * - Content moderation
 * - Structured output generation
 * - Usage tracking
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string | ClaudeContent[]
}

export interface ClaudeContent {
  type: 'text' | 'image' | 'tool_use' | 'tool_result'
  text?: string
  source?: {
    type: 'base64' | 'url'
    media_type: string
    data: string
  }
  id?: string
  name?: string
  input?: any
  tool_use_id?: string
  content?: string
  cache_control?: {
    type: 'ephemeral'
  }
}

export interface ClaudeTool {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
}

export interface ClaudeCompletionRequest {
  model: string
  messages: ClaudeMessage[]
  system?: string | Array<{ type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }>
  max_tokens: number
  temperature?: number
  top_p?: number
  top_k?: number
  stop_sequences?: string[]
  tools?: ClaudeTool[]
  stream?: boolean
  metadata?: {
    user_id?: string
  }
}

export interface ClaudeCompletionResponse {
  id: string
  type: 'message'
  role: 'assistant'
  content: ClaudeContent[]
  model: string
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use'
  stop_sequence?: string
  usage: {
    input_tokens: number
    output_tokens: number
    cache_creation_input_tokens?: number
    cache_read_input_tokens?: number
  }
}

export interface ClaudeStreamChunk {
  type: 'message_start' | 'content_block_start' | 'content_block_delta' | 'content_block_stop' | 'message_delta' | 'message_stop'
  message?: Partial<ClaudeCompletionResponse>
  index?: number
  content_block?: ClaudeContent
  delta?: {
    type: 'text_delta' | 'input_json_delta'
    text?: string
    partial_json?: string
    stop_reason?: string
    stop_sequence?: string
  }
  usage?: ClaudeCompletionResponse['usage']
}

export interface ClaudeBatchRequest {
  custom_id: string
  params: ClaudeCompletionRequest
}

export interface ClaudeBatchResponse {
  id: string
  type: 'message_batch'
  processing_status: 'in_progress' | 'completed' | 'failed'
  request_counts: {
    processing: number
    completed: number
    failed: number
    total: number
  }
  ended_at?: string
  created_at: string
  expires_at: string
  results_url?: string
}

export interface ClaudeConversation {
  id: string
  messages: ClaudeMessage[]
  systemPrompt?: string
  metadata?: Record<string, any>
  created_at: Date
  updated_at: Date
}

export interface ClaudeUsageStats {
  total_input_tokens: number
  total_output_tokens: number
  total_cache_creation_tokens: number
  total_cache_read_tokens: number
  total_requests: number
  estimated_cost: number
  by_model: Record<string, {
    input_tokens: number
    output_tokens: number
    requests: number
    cost: number
  }>
}

export class ClaudeAdapter extends BaseIntegrationAdapter {
  private apiKey?: string
  private baseUrl = 'https://api.anthropic.com/v1'
  private defaultModel = 'claude-3-5-sonnet-20241022'
  private apiVersion = '2023-06-01'
  private conversations: Map<string, ClaudeConversation> = new Map()
  private usageStats: ClaudeUsageStats = {
    total_input_tokens: 0,
    total_output_tokens: 0,
    total_cache_creation_tokens: 0,
    total_cache_read_tokens: 0,
    total_requests: 0,
    estimated_cost: 0,
    by_model: {},
  }

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: true,
      canReceiveMessages: false,
      canSendFiles: false,
      canSendImages: true,
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
      canCreateContacts: false,
      canSyncContacts: false,
      canSyncConversations: false,
      canSyncTickets: false,
      canExportData: true,
      canImportData: false,
      canTrackEvents: true,
      canTrackMetrics: true,
      canGenerateReports: false,
      canCreateWorkflows: false,
      canTriggerActions: true,
      canListenToWebhooks: false,
      maxMessageLength: 200000, // ~200k tokens context
      maxFileSize: 0,
      maxBatchSize: 1,
      rateLimit: {
        messages: 50,
        period: 'per_minute' as const,
      },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.apiKey = this.config.credentials.apiKey
    if (!this.apiKey) {
      return {
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Missing Anthropic API key',
          retryable: false,
        },
      }
    }
    this.isConnected = true
    return { success: true, data: undefined }
  }

  async disconnect(): Promise<IntegrationResponse<void>> {
    this.isConnected = false
    this.conversations.clear()
    return { success: true, data: undefined }
  }

  async testConnection(): Promise<IntegrationResponse<boolean>> {
    try {
      await this.ensureConnected()

      // Test with a simple completion
      const result = await this.createCompletion({
        model: this.defaultModel,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10,
      })

      return {
        success: result.success,
        data: result.success,
      }
    } catch (error: any) {
      return {
        success: false,
        data: false,
        error: this.formatError(error),
      }
    }
  }

  private trackUsage(model: string, usage: ClaudeCompletionResponse['usage']): void {
    this.usageStats.total_input_tokens += usage.input_tokens
    this.usageStats.total_output_tokens += usage.output_tokens
    this.usageStats.total_cache_creation_tokens += usage.cache_creation_input_tokens || 0
    this.usageStats.total_cache_read_tokens += usage.cache_read_input_tokens || 0
    this.usageStats.total_requests += 1

    if (!this.usageStats.by_model[model]) {
      this.usageStats.by_model[model] = {
        input_tokens: 0,
        output_tokens: 0,
        requests: 0,
        cost: 0,
      }
    }

    this.usageStats.by_model[model].input_tokens += usage.input_tokens
    this.usageStats.by_model[model].output_tokens += usage.output_tokens
    this.usageStats.by_model[model].requests += 1

    const cost = this.calculateCost({
      model,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      cacheCreationTokens: usage.cache_creation_input_tokens,
      cacheReadTokens: usage.cache_read_input_tokens,
    })

    this.usageStats.by_model[model].cost += cost.totalCost
    this.usageStats.estimated_cost += cost.totalCost
  }

  // ==================== Core Completion Methods ====================

  /**
   * Create a completion with Claude
   */
  async createCompletion(
    params: ClaudeCompletionRequest
  ): Promise<IntegrationResponse<ClaudeCompletionResponse>> {
    try {
      await this.ensureConnected()

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/messages`, {
          method: 'POST',
          headers: {
            'x-api-key': this.apiKey!,
            'anthropic-version': this.apiVersion,
            'content-type': 'application/json',
          },
          body: JSON.stringify(params),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(`Claude API error: ${error.error?.message || response.statusText}`)
        }

        return await response.json()
      })

      if (result.success && result.data) {
        this.trackUsage(params.model, result.data.usage)
      }

      return result.success
        ? { success: true, data: result.data }
        : { success: false, error: result.error }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  /**
   * Create a streaming completion with Claude
   */
  async createStreamingCompletion(
    params: ClaudeCompletionRequest,
    onChunk: (chunk: ClaudeStreamChunk) => void
  ): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey!,
          'anthropic-version': this.apiVersion,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ ...params, stream: true }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Claude API error: ${error.error?.message || response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''
      let finalUsage: ClaudeCompletionResponse['usage'] | undefined

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break

            try {
              const chunk = JSON.parse(data) as ClaudeStreamChunk
              if (chunk.usage) {
                finalUsage = chunk.usage
              }
              onChunk(chunk)
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      if (finalUsage) {
        this.trackUsage(params.model, finalUsage)
      }

      return { success: true, data: undefined }
    } catch (error: any) {
      return {
        success: false,
        error: this.formatError(error),
      }
    }
  }

  /**
   * Create a chatbot-friendly completion
   */
  async chat(params: {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
    systemPrompt?: string
    model?: string
    temperature?: number
    maxTokens?: number
    tools?: ClaudeTool[]
  }): Promise<IntegrationResponse<{
    response: string
    toolUses?: Array<{ id: string; name: string; input: any }>
    usage: ClaudeCompletionResponse['usage']
  }>> {
    const completion = await this.createCompletion({
      model: params.model || this.defaultModel,
      messages: params.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      system: params.systemPrompt,
      max_tokens: params.maxTokens || 4096,
      temperature: params.temperature,
      tools: params.tools,
    })

    if (!completion.success) {
      return { success: false, error: completion.error }
    }

    const response = completion.data!

    // Extract text content
    const textContent = response.content
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('')

    // Extract tool uses
    const toolUses = response.content
      .filter(c => c.type === 'tool_use')
      .map(c => ({
        id: c.id!,
        name: c.name!,
        input: c.input!,
      }))

    return {
      success: true,
      data: {
        response: textContent,
        toolUses: toolUses.length > 0 ? toolUses : undefined,
        usage: response.usage,
      },
    }
  }

  // ==================== Image Analysis ====================

  /**
   * Analyze an image with Claude
   */
  async analyzeImage(params: {
    imageUrl?: string
    imageBase64?: string
    mimeType?: string
    prompt: string
    model?: string
    maxTokens?: number
  }): Promise<IntegrationResponse<{ response: string; usage: ClaudeCompletionResponse['usage'] }>> {
    const imageContent: ClaudeContent = params.imageUrl
      ? {
          type: 'image',
          source: {
            type: 'url',
            media_type: params.mimeType || 'image/jpeg',
            data: params.imageUrl,
          },
        }
      : {
          type: 'image',
          source: {
            type: 'base64',
            media_type: params.mimeType || 'image/jpeg',
            data: params.imageBase64!,
          },
        }

    const completion = await this.createCompletion({
      model: params.model || this.defaultModel,
      messages: [
        {
          role: 'user',
          content: [
            imageContent,
            {
              type: 'text',
              text: params.prompt,
            },
          ],
        },
      ],
      max_tokens: params.maxTokens || 4096,
    })

    if (!completion.success) {
      return { success: false, error: completion.error }
    }

    const response = completion.data!
    const textContent = response.content
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('')

    return {
      success: true,
      data: {
        response: textContent,
        usage: response.usage,
      },
    }
  }

  /**
   * Analyze multiple images in one request
   */
  async analyzeMultipleImages(params: {
    images: Array<{ url?: string; base64?: string; mimeType?: string }>
    prompt: string
    model?: string
    maxTokens?: number
  }): Promise<IntegrationResponse<{ response: string; usage: ClaudeCompletionResponse['usage'] }>> {
    const content: ClaudeContent[] = []

    for (const image of params.images) {
      content.push(
        image.url
          ? {
              type: 'image',
              source: {
                type: 'url',
                media_type: image.mimeType || 'image/jpeg',
                data: image.url,
              },
            }
          : {
              type: 'image',
              source: {
                type: 'base64',
                media_type: image.mimeType || 'image/jpeg',
                data: image.base64!,
              },
            }
      )
    }

    content.push({ type: 'text', text: params.prompt })

    const completion = await this.createCompletion({
      model: params.model || this.defaultModel,
      messages: [{ role: 'user', content }],
      max_tokens: params.maxTokens || 4096,
    })

    if (!completion.success) {
      return { success: false, error: completion.error }
    }

    const response = completion.data!
    const textContent = response.content
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('')

    return {
      success: true,
      data: {
        response: textContent,
        usage: response.usage,
      },
    }
  }

  /**
   * Extract text from an image (OCR)
   */
  async extractTextFromImage(params: {
    imageUrl?: string
    imageBase64?: string
    mimeType?: string
    model?: string
  }): Promise<IntegrationResponse<{ text: string; usage: ClaudeCompletionResponse['usage'] }>> {
    const result = await this.analyzeImage({
      ...params,
      prompt: 'Extract and transcribe all text visible in this image. Return only the extracted text, preserving formatting where possible.',
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return {
      success: true,
      data: {
        text: result.data!.response,
        usage: result.data!.usage,
      },
    }
  }

  /**
   * Compare multiple images
   */
  async compareImages(params: {
    images: Array<{ url?: string; base64?: string; mimeType?: string }>
    comparisonPrompt?: string
    model?: string
  }): Promise<IntegrationResponse<{ comparison: string; usage: ClaudeCompletionResponse['usage'] }>> {
    const result = await this.analyzeMultipleImages({
      images: params.images,
      prompt: params.comparisonPrompt || 'Compare and contrast these images. Describe their similarities and differences in detail.',
      model: params.model,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return {
      success: true,
      data: {
        comparison: result.data!.response,
        usage: result.data!.usage,
      },
    }
  }

  // ==================== Conversation Management ====================

  /**
   * Create a new conversation
   */
  createConversation(params?: {
    systemPrompt?: string
    metadata?: Record<string, any>
  }): IntegrationResponse<{ conversationId: string }> {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.conversations.set(id, {
      id,
      messages: [],
      systemPrompt: params?.systemPrompt,
      metadata: params?.metadata,
      created_at: new Date(),
      updated_at: new Date(),
    })

    return {
      success: true,
      data: { conversationId: id },
    }
  }

  /**
   * Add a message to a conversation and get response
   */
  async addMessageToConversation(params: {
    conversationId: string
    message: string
    model?: string
    temperature?: number
    maxTokens?: number
  }): Promise<IntegrationResponse<{
    response: string
    usage: ClaudeCompletionResponse['usage']
  }>> {
    const conversation = this.conversations.get(params.conversationId)
    if (!conversation) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Conversation not found',
          retryable: false,
        },
      }
    }

    conversation.messages.push({
      role: 'user',
      content: params.message,
    })

    const completion = await this.createCompletion({
      model: params.model || this.defaultModel,
      messages: conversation.messages,
      system: conversation.systemPrompt,
      max_tokens: params.maxTokens || 4096,
      temperature: params.temperature,
    })

    if (!completion.success) {
      // Remove the user message if completion failed
      conversation.messages.pop()
      return { success: false, error: completion.error }
    }

    const response = completion.data!
    const textContent = response.content
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('')

    conversation.messages.push({
      role: 'assistant',
      content: textContent,
    })

    conversation.updated_at = new Date()

    return {
      success: true,
      data: {
        response: textContent,
        usage: response.usage,
      },
    }
  }

  /**
   * Get conversation history
   */
  getConversationHistory(conversationId: string): IntegrationResponse<ClaudeConversation> {
    const conversation = this.conversations.get(conversationId)
    if (!conversation) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Conversation not found',
          retryable: false,
        },
      }
    }

    return {
      success: true,
      data: conversation,
    }
  }

  /**
   * Clear conversation history
   */
  clearConversation(conversationId: string): IntegrationResponse<void> {
    const conversation = this.conversations.get(conversationId)
    if (!conversation) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Conversation not found',
          retryable: false,
        },
      }
    }

    conversation.messages = []
    conversation.updated_at = new Date()

    return {
      success: true,
      data: undefined,
    }
  }

  /**
   * Delete a conversation
   */
  deleteConversation(conversationId: string): IntegrationResponse<void> {
    const deleted = this.conversations.delete(conversationId)
    if (!deleted) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Conversation not found',
          retryable: false,
        },
      }
    }

    return {
      success: true,
      data: undefined,
    }
  }

  /**
   * Fork a conversation at a specific point
   */
  forkConversation(params: {
    conversationId: string
    atMessageIndex?: number
  }): IntegrationResponse<{ conversationId: string }> {
    const conversation = this.conversations.get(params.conversationId)
    if (!conversation) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Conversation not found',
          retryable: false,
        },
      }
    }

    const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const messagesToCopy = params.atMessageIndex !== undefined
      ? conversation.messages.slice(0, params.atMessageIndex + 1)
      : [...conversation.messages]

    this.conversations.set(id, {
      id,
      messages: messagesToCopy,
      systemPrompt: conversation.systemPrompt,
      metadata: { ...conversation.metadata, forked_from: params.conversationId },
      created_at: new Date(),
      updated_at: new Date(),
    })

    return {
      success: true,
      data: { conversationId: id },
    }
  }

  // ==================== Tool Use & Function Calling ====================

  /**
   * Execute a tool workflow
   */
  async executeToolWorkflow(params: {
    initialPrompt: string
    tools: ClaudeTool[]
    toolExecutor: (toolName: string, input: any) => Promise<any>
    maxIterations?: number
    model?: string
  }): Promise<IntegrationResponse<{
    finalResponse: string
    toolCalls: Array<{ name: string; input: any; output: any }>
    usage: ClaudeCompletionResponse['usage']
  }>> {
    const messages: ClaudeMessage[] = [
      { role: 'user', content: params.initialPrompt },
    ]

    const toolCalls: Array<{ name: string; input: any; output: any }> = []
    const maxIterations = params.maxIterations || 10
    let totalUsage: ClaudeCompletionResponse['usage'] = {
      input_tokens: 0,
      output_tokens: 0,
    }

    for (let i = 0; i < maxIterations; i++) {
      const completion = await this.createCompletion({
        model: params.model || this.defaultModel,
        messages,
        max_tokens: 4096,
        tools: params.tools,
      })

      if (!completion.success) {
        return { success: false, error: completion.error }
      }

      const response = completion.data!
      totalUsage.input_tokens += response.usage.input_tokens
      totalUsage.output_tokens += response.usage.output_tokens

      // If no tool use, we're done
      if (response.stop_reason !== 'tool_use') {
        const finalText = response.content
          .filter(c => c.type === 'text')
          .map(c => c.text)
          .join('')

        return {
          success: true,
          data: {
            finalResponse: finalText,
            toolCalls,
            usage: totalUsage,
          },
        }
      }

      // Add assistant's response to messages
      messages.push({
        role: 'assistant',
        content: response.content,
      })

      // Execute tools and prepare results
      const toolResults: ClaudeContent[] = []

      for (const content of response.content) {
        if (content.type === 'tool_use') {
          const output = await params.toolExecutor(content.name!, content.input)
          toolCalls.push({
            name: content.name!,
            input: content.input,
            output,
          })

          toolResults.push({
            type: 'tool_result',
            tool_use_id: content.id!,
            content: JSON.stringify(output),
          })
        }
      }

      // Add tool results to messages
      messages.push({
        role: 'user',
        content: toolResults,
      })
    }

    return {
      success: false,
      error: {
        code: 'MAX_ITERATIONS',
        message: 'Max tool iterations reached',
        retryable: false,
      },
    }
  }

  /**
   * Validate tool schema
   */
  validateToolSchema(tool: ClaudeTool): IntegrationResponse<{
    valid: boolean
    errors?: string[]
  }> {
    const errors: string[] = []

    if (!tool.name) errors.push('Tool name is required')
    if (!tool.description) errors.push('Tool description is required')
    if (!tool.input_schema) errors.push('Tool input_schema is required')
    if (tool.input_schema?.type !== 'object') {
      errors.push('Tool input_schema type must be "object"')
    }
    if (!tool.input_schema?.properties) {
      errors.push('Tool input_schema must have properties')
    }

    return {
      success: true,
      data: {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
      },
    }
  }

  // ==================== Structured Output ====================

  /**
   * Generate JSON with a specific schema
   */
  async generateJSON(params: {
    prompt: string
    schema: Record<string, any>
    model?: string
  }): Promise<IntegrationResponse<{
    data: any
    usage: ClaudeCompletionResponse['usage']
  }>> {
    const schemaString = JSON.stringify(params.schema, null, 2)
    const fullPrompt = `${params.prompt}\n\nPlease respond with valid JSON matching this schema:\n${schemaString}\n\nRespond only with the JSON, no additional text.`

    const completion = await this.createCompletion({
      model: params.model || this.defaultModel,
      messages: [{ role: 'user', content: fullPrompt }],
      max_tokens: 4096,
    })

    if (!completion.success) {
      return { success: false, error: completion.error }
    }

    const response = completion.data!
    const textContent = response.content
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('')

    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = textContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, textContent]
      const jsonString = jsonMatch[1].trim()
      const parsed = JSON.parse(jsonString)

      return {
        success: true,
        data: {
          data: parsed,
          usage: response.usage,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: 'Failed to parse JSON response',
          retryable: true,
        },
      }
    }
  }

  /**
   * Extract structured data from text
   */
  async extractStructuredData(params: {
    text: string
    fields: Array<{ name: string; description: string; type: string }>
    model?: string
  }): Promise<IntegrationResponse<{
    data: Record<string, any>
    usage: ClaudeCompletionResponse['usage']
  }>> {
    const schema = {
      type: 'object',
      properties: params.fields.reduce((acc, field) => {
        acc[field.name] = { type: field.type, description: field.description }
        return acc
      }, {} as Record<string, any>),
    }

    return this.generateJSON({
      prompt: `Extract the following information from this text:\n\n${params.text}`,
      schema,
      model: params.model,
    })
  }

  // ==================== Content Moderation ====================

  /**
   * Moderate content for safety
   */
  async moderateContent(params: {
    content: string
    model?: string
  }): Promise<IntegrationResponse<{
    safe: boolean
    categories: string[]
    explanation: string
    usage: ClaudeCompletionResponse['usage']
  }>> {
    const result = await this.generateJSON({
      prompt: `Analyze this content for safety concerns. Check for: hate speech, violence, sexual content, self-harm, illegal activities, personal information.

Content: ${params.content}`,
      schema: {
        type: 'object',
        properties: {
          safe: { type: 'boolean', description: 'Whether the content is safe' },
          categories: {
            type: 'array',
            items: { type: 'string' },
            description: 'Categories of concern found',
          },
          explanation: { type: 'string', description: 'Explanation of the assessment' },
        },
      },
      model: params.model || 'claude-3-haiku-20240307', // Use faster model for moderation
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return {
      success: true,
      data: {
        ...result.data!.data,
        usage: result.data!.usage,
      },
    }
  }

  /**
   * Detect and redact PII
   */
  async redactPII(params: {
    text: string
    model?: string
  }): Promise<IntegrationResponse<{
    redactedText: string
    foundPII: Array<{ type: string; value: string }>
    usage: ClaudeCompletionResponse['usage']
  }>> {
    const result = await this.generateJSON({
      prompt: `Identify and redact all personally identifiable information (PII) from this text. This includes: names, email addresses, phone numbers, addresses, SSN, credit card numbers, etc.

Text: ${params.text}`,
      schema: {
        type: 'object',
        properties: {
          redactedText: { type: 'string', description: 'The text with PII redacted (use [REDACTED])' },
          foundPII: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                value: { type: 'string' },
              },
            },
          },
        },
      },
      model: params.model || 'claude-3-haiku-20240307',
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return {
      success: true,
      data: {
        ...result.data!.data,
        usage: result.data!.usage,
      },
    }
  }

  // ==================== Text Processing ====================

  /**
   * Summarize text
   */
  async summarizeText(params: {
    text: string
    length?: 'short' | 'medium' | 'long'
    model?: string
  }): Promise<IntegrationResponse<{
    summary: string
    usage: ClaudeCompletionResponse['usage']
  }>> {
    const lengthInstructions = {
      short: 'in 2-3 sentences',
      medium: 'in 1-2 paragraphs',
      long: 'in 3-4 paragraphs',
    }

    const completion = await this.createCompletion({
      model: params.model || this.defaultModel,
      messages: [
        {
          role: 'user',
          content: `Please summarize the following text ${lengthInstructions[params.length || 'medium']}:\n\n${params.text}`,
        },
      ],
      max_tokens: 2048,
    })

    if (!completion.success) {
      return { success: false, error: completion.error }
    }

    const response = completion.data!
    const summary = response.content
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('')

    return {
      success: true,
      data: {
        summary,
        usage: response.usage,
      },
    }
  }

  /**
   * Extract key points from text
   */
  async extractKeyPoints(params: {
    text: string
    maxPoints?: number
    model?: string
  }): Promise<IntegrationResponse<{
    keyPoints: string[]
    usage: ClaudeCompletionResponse['usage']
  }>> {
    const result = await this.generateJSON({
      prompt: `Extract the ${params.maxPoints || 5} most important key points from this text:\n\n${params.text}`,
      schema: {
        type: 'object',
        properties: {
          keyPoints: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of key points',
          },
        },
      },
      model: params.model,
    })

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return {
      success: true,
      data: {
        keyPoints: result.data!.data.keyPoints,
        usage: result.data!.usage,
      },
    }
  }

  /**
   * Translate text
   */
  async translateText(params: {
    text: string
    targetLanguage: string
    sourceLanguage?: string
    model?: string
  }): Promise<IntegrationResponse<{
    translatedText: string
    usage: ClaudeCompletionResponse['usage']
  }>> {
    const sourceInfo = params.sourceLanguage ? ` from ${params.sourceLanguage}` : ''
    const completion = await this.createCompletion({
      model: params.model || this.defaultModel,
      messages: [
        {
          role: 'user',
          content: `Translate the following text${sourceInfo} to ${params.targetLanguage}:\n\n${params.text}`,
        },
      ],
      max_tokens: 4096,
    })

    if (!completion.success) {
      return { success: false, error: completion.error }
    }

    const response = completion.data!
    const translatedText = response.content
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('')

    return {
      success: true,
      data: {
        translatedText,
        usage: response.usage,
      },
    }
  }

  // ==================== Usage Tracking ====================

  /**
   * Get usage statistics
   */
  getUsageStats(): IntegrationResponse<ClaudeUsageStats> {
    return {
      success: true,
      data: { ...this.usageStats },
    }
  }

  /**
   * Reset usage statistics
   */
  resetUsageStats(): IntegrationResponse<void> {
    this.usageStats = {
      total_input_tokens: 0,
      total_output_tokens: 0,
      total_cache_creation_tokens: 0,
      total_cache_read_tokens: 0,
      total_requests: 0,
      estimated_cost: 0,
      by_model: {},
    }

    return {
      success: true,
      data: undefined,
    }
  }

  // ==================== Prompt Caching ====================

  /**
   * Enable prompt caching for long system prompts
   */
  enablePromptCaching(systemPrompt: string): Array<{
    type: 'text'
    text: string
    cache_control?: { type: 'ephemeral' }
  }> {
    // Split into blocks, cache the last block if it's long enough
    const blocks = systemPrompt.split('\n\n')
    const result: Array<{
      type: 'text'
      text: string
      cache_control?: { type: 'ephemeral' }
    }> = []

    for (let i = 0; i < blocks.length; i++) {
      const isLast = i === blocks.length - 1
      const text = blocks[i]

      result.push({
        type: 'text',
        text,
        // Cache the last block if it's substantial (>1000 chars)
        cache_control: isLast && text.length > 1000 ? { type: 'ephemeral' } : undefined,
      })
    }

    return result
  }

  // ==================== Model Information ====================

  /**
   * Get available models
   */
  getAvailableModels(): Array<{
    id: string
    name: string
    description: string
    contextWindow: number
    maxOutput: number
    strengths: string[]
  }> {
    return [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        description: 'Most intelligent model, best for complex tasks',
        contextWindow: 200000,
        maxOutput: 8192,
        strengths: [
          'Graduate-level reasoning',
          'Nuanced content creation',
          'Complex code generation',
          'Detailed instruction following',
          'Vision analysis',
          'Tool use',
        ],
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        description: 'Powerful model for highly complex tasks',
        contextWindow: 200000,
        maxOutput: 4096,
        strengths: [
          'Top-level performance on complex tasks',
          'Nuanced understanding',
          'Advanced reasoning',
          'Research analysis',
        ],
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        description: 'Balanced intelligence and speed',
        contextWindow: 200000,
        maxOutput: 4096,
        strengths: [
          'Balanced performance',
          'Enterprise workloads',
          'Data processing',
          'Multi-step workflows',
        ],
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        description: 'Fastest model, best for simple tasks',
        contextWindow: 200000,
        maxOutput: 4096,
        strengths: [
          'Near-instant responses',
          'High throughput',
          'Simple queries',
          'Cost-effective',
          'Lightweight actions',
        ],
      },
    ]
  }

  /**
   * Count tokens (approximate - actual tokenization requires tiktoken)
   */
  estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token for English
    return Math.ceil(text.length / 4)
  }

  /**
   * Calculate cost estimate
   */
  calculateCost(params: {
    model: string
    inputTokens: number
    outputTokens: number
    cacheCreationTokens?: number
    cacheReadTokens?: number
  }): {
    inputCost: number
    outputCost: number
    cacheCost: number
    totalCost: number
  } {
    // Pricing as of 2024 (per million tokens)
    const pricing: Record<string, { input: number; output: number; cacheWrite: number; cacheRead: number }> = {
      'claude-3-5-sonnet-20241022': {
        input: 3.0,
        output: 15.0,
        cacheWrite: 3.75,
        cacheRead: 0.3,
      },
      'claude-3-opus-20240229': {
        input: 15.0,
        output: 75.0,
        cacheWrite: 18.75,
        cacheRead: 1.5,
      },
      'claude-3-sonnet-20240229': {
        input: 3.0,
        output: 15.0,
        cacheWrite: 3.75,
        cacheRead: 0.3,
      },
      'claude-3-haiku-20240307': {
        input: 0.25,
        output: 1.25,
        cacheWrite: 0.3,
        cacheRead: 0.03,
      },
    }

    const prices = pricing[params.model] || pricing['claude-3-5-sonnet-20241022']

    const inputCost = (params.inputTokens / 1_000_000) * prices.input
    const outputCost = (params.outputTokens / 1_000_000) * prices.output
    const cacheCreationCost = ((params.cacheCreationTokens || 0) / 1_000_000) * prices.cacheWrite
    const cacheReadCost = ((params.cacheReadTokens || 0) / 1_000_000) * prices.cacheRead

    return {
      inputCost,
      outputCost,
      cacheCost: cacheCreationCost + cacheReadCost,
      totalCost: inputCost + outputCost + cacheCreationCost + cacheReadCost,
    }
  }
}
