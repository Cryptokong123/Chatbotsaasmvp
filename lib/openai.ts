import OpenAI from 'openai'

/**
 * Multi-key rotation for avoiding rate limits
 * Set OPENAI_API_KEYS in .env (comma-separated) or fall back to single key
 */
const apiKeys = process.env.OPENAI_API_KEYS
  ? process.env.OPENAI_API_KEYS.split(',').map((k) => k.trim())
  : [process.env.OPENAI_API_KEY || '']

let currentKeyIndex = 0

/**
 * Get next API key in rotation
 */
function getNextApiKey(): string {
  const key = apiKeys[currentKeyIndex]
  currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length
  return key
}

/**
 * Create OpenAI client with current key
 */
function createOpenAIClient(): OpenAI {
  return new OpenAI({
    apiKey: getNextApiKey(),
  })
}

// Initialize OpenAI client with rotation
const openai = createOpenAIClient()

/**
 * Generate embeddings for text using OpenAI's text-embedding-3-small model
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Use new client for key rotation
    const client = createOpenAIClient()
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw new Error('Failed to generate embedding')
  }
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    // Use new client for key rotation
    const client = createOpenAIClient()
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
      encoding_format: 'float',
    })

    return response.data.map((item) => item.embedding)
  } catch (error) {
    console.error('Error generating embeddings:', error)
    throw new Error('Failed to generate embeddings')
  }
}

/**
 * Generate chat completion using GPT-4 Turbo
 */
export async function generateChatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: {
    temperature?: number
    maxTokens?: number
    stream?: boolean
  }
): Promise<string> {
  try {
    // Use new client for key rotation
    const client = createOpenAIClient()
    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1000,
      stream: options?.stream ?? false,
    })

    return (response as any).choices[0]?.message?.content || ''
  } catch (error) {
    console.error('Error generating chat completion:', error)
    throw new Error('Failed to generate response')
  }
}

/**
 * Stream chat completion for real-time responses
 */
export async function streamChatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: {
    temperature?: number
    maxTokens?: number
  }
) {
  try {
    // Use new client for key rotation
    const client = createOpenAIClient()
    const stream = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1000,
      stream: true,
    })

    return stream
  } catch (error) {
    console.error('Error streaming chat completion:', error)
    throw new Error('Failed to stream response')
  }
}

export { openai }
