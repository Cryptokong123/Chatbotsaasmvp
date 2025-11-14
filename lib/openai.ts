import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Generate embeddings for text using OpenAI's text-embedding-3-small model
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
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
    const response = await openai.embeddings.create({
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
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1000,
      stream: options?.stream ?? false,
    })

    return response.choices[0]?.message?.content || ''
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
    const stream = await openai.chat.completions.create({
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
