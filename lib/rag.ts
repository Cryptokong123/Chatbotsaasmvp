import { createServerSupabaseClient } from './supabase'
import { generateEmbedding, generateChatCompletion } from './openai'

/**
 * RAG Pipeline: Retrieval Augmented Generation
 *
 * This module handles the core AI functionality:
 * 1. Query embedding
 * 2. Vector similarity search
 * 3. Context retrieval
 * 4. Prompt construction
 * 5. LLM response generation
 */

export interface RAGContext {
  content: string
  similarity: number
  source_name: string | null
}

/**
 * Perform RAG query: embed question, retrieve context, generate response
 */
export async function performRAGQuery(
  botId: string,
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<{ response: string; context: RAGContext[] }> {
  const supabase = createServerSupabaseClient()

  // Step 1: Get bot configuration
  const { data: bot, error: botError } = await supabase
    .from('bots')
    .select('*')
    .eq('id', botId)
    .single()

  if (botError || !bot) {
    throw new Error('Bot not found')
  }

  // Step 2: Generate embedding for user query
  const queryEmbedding = await generateEmbedding(userMessage)

  // Step 3: Perform vector similarity search
  const { data: matchedDocs, error: matchError } = await supabase.rpc(
    'match_training_data',
    {
      query_embedding: queryEmbedding,
      match_bot_id: botId,
      match_threshold: 0.7,
      match_count: 5,
    }
  )

  if (matchError) {
    console.error('Error matching training data:', matchError)
    throw new Error('Failed to retrieve context')
  }

  const context: RAGContext[] = matchedDocs || []

  // Step 4: Build system prompt with context and personality
  let systemPrompt = bot.instructions || 'You are a helpful assistant.'

  // Add personality traits to system prompt
  const personalityTraits: string[] = []

  if (bot.tone) {
    const toneDescriptions = {
      professional: 'professional and businesslike',
      friendly: 'warm and friendly',
      casual: 'casual and conversational',
      formal: 'formal and polished',
      enthusiastic: 'enthusiastic and energetic'
    }
    personalityTraits.push(`Use a ${toneDescriptions[bot.tone as keyof typeof toneDescriptions] || bot.tone} tone`)
  }

  if (bot.formality) {
    const formalityDescriptions = {
      very_formal: 'extremely formal language, address users with utmost respect',
      formal: 'formal language and proper grammar',
      balanced: 'balanced mix of professional and approachable language',
      casual: 'casual language that\'s still respectful',
      very_casual: 'very casual and relaxed language'
    }
    personalityTraits.push(formalityDescriptions[bot.formality as keyof typeof formalityDescriptions] || 'balanced language')
  }

  if (bot.use_emojis) {
    personalityTraits.push('use relevant emojis to make responses more engaging')
  } else {
    personalityTraits.push('avoid using emojis in responses')
  }

  if (bot.response_length) {
    const lengthDescriptions = {
      concise: 'Keep responses brief and to the point, typically 1-2 sentences unless more detail is explicitly requested',
      balanced: 'Provide balanced responses with enough detail to be helpful',
      detailed: 'Provide detailed, comprehensive responses with thorough explanations'
    }
    personalityTraits.push(lengthDescriptions[bot.response_length as keyof typeof lengthDescriptions] || lengthDescriptions.balanced)
  }

  if (personalityTraits.length > 0) {
    systemPrompt += `\n\nPersonality guidelines:\n- ${personalityTraits.join('\n- ')}`
  }

  if (context.length > 0) {
    const contextText = context
      .map((doc, idx) => `[${idx + 1}] ${doc.content}`)
      .join('\n\n')

    systemPrompt += `\n\nContext information:\n${contextText}\n\nUse the above context to answer the user's question. If the context doesn't contain relevant information, use your general knowledge but mention that the specific information wasn't in your knowledge base.`
  } else {
    systemPrompt += '\n\nNote: No specific context was found in the knowledge base. Answer based on general knowledge and suggest that the user might want to add relevant information to the bot\'s training data.'
  }

  // Step 5: Build conversation messages
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ]

  // Add conversation history (last 5 exchanges)
  const recentHistory = conversationHistory.slice(-10)
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content })
  }

  // Add current user message
  messages.push({ role: 'user', content: userMessage })

  // Step 6: Determine generation parameters based on personality
  const temperature = bot.creativity_level !== undefined ? bot.creativity_level : 0.7

  const maxTokensMap = {
    concise: 300,
    balanced: 800,
    detailed: 1500
  }
  const maxTokens = maxTokensMap[bot.response_length as keyof typeof maxTokensMap] || 800

  // Step 7: Generate response using LLM
  const response = await generateChatCompletion(messages, {
    temperature,
    maxTokens,
  })

  return {
    response,
    context,
  }
}

/**
 * Process and store training data with embeddings
 */
export async function processTrainingData(
  botId: string,
  content: string,
  sourceType: 'text' | 'pdf' | 'faq' | 'url',
  sourceName?: string
): Promise<void> {
  const supabase = createServerSupabaseClient()

  // Chunk the content
  const chunks = chunkText(content)

  // Generate embeddings for all chunks
  const embeddings = await Promise.all(
    chunks.map((chunk) => generateEmbedding(chunk))
  )

  // Store chunks with embeddings
  const trainingDataRecords = chunks.map((chunk, index) => ({
    bot_id: botId,
    content: chunk,
    source_type: sourceType,
    source_name: sourceName || null,
    chunk_index: index,
    embedding: embeddings[index],
  }))

  const { error } = await supabase
    .from('training_data')
    .insert(trainingDataRecords)

  if (error) {
    console.error('Error storing training data:', error)
    throw new Error('Failed to store training data')
  }
}

/**
 * Simple text chunking function
 */
function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/)
  const chunks: string[] = []
  let currentChunk = ''

  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = paragraph
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim())
  }

  // Handle case where a single paragraph is too long
  const finalChunks: string[] = []
  for (const chunk of chunks) {
    if (chunk.length <= maxChunkSize) {
      finalChunks.push(chunk)
    } else {
      // Split long chunks by sentences
      const sentences = chunk.match(/[^.!?]+[.!?]+/g) || [chunk]
      let sentenceChunk = ''
      for (const sentence of sentences) {
        if ((sentenceChunk + sentence).length > maxChunkSize && sentenceChunk.length > 0) {
          finalChunks.push(sentenceChunk.trim())
          sentenceChunk = sentence
        } else {
          sentenceChunk += sentence
        }
      }
      if (sentenceChunk.length > 0) {
        finalChunks.push(sentenceChunk.trim())
      }
    }
  }

  return finalChunks
}
