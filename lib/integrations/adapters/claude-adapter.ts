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
  system?: string
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

export class ClaudeAdapter extends BaseIntegrationAdapter {
  private apiKey?: string
  private baseUrl = 'https://api.anthropic.com/v1'
  private defaultModel = 'claude-3-5-sonnet-20241022'
  private apiVersion = '2023-06-01'

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
              onChunk(chunk)
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
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
