/**
 * Caching Strategy
 *
 * Saves OpenAI API costs by caching:
 * - Embeddings (same text = same embedding)
 * - Common responses
 * - Bot configurations
 */

import { generateEmbedding as originalGenerateEmbedding } from './openai'

// In-memory cache (in production, use Redis)
const embeddingCache = new Map<string, number[]>()
const responseCache = new Map<string, { response: string; timestamp: number }>()
const botConfigCache = new Map<string, { config: any; timestamp: number }>()

// Cache TTLs
const EMBEDDING_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days (embeddings don't change)
const RESPONSE_TTL = 60 * 60 * 1000 // 1 hour
const BOT_CONFIG_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Generate embedding with caching
 * Saves OpenAI costs for duplicate content
 */
export async function generateEmbeddingCached(text: string): Promise<number[]> {
  // Normalize text
  const normalizedText = text.trim().toLowerCase()

  // Check cache
  if (embeddingCache.has(normalizedText)) {
    const cached = embeddingCache.get(normalizedText)!
    return cached
  }

  // Generate new embedding
  const embedding = await originalGenerateEmbedding(text)

  // Store in cache
  embeddingCache.set(normalizedText, embedding)

  // Limit cache size (prevent memory leaks)
  if (embeddingCache.size > 10000) {
    // Remove oldest entries
    const entries = Array.from(embeddingCache.entries())
    entries.slice(0, 1000).forEach(([key]) => embeddingCache.delete(key))
  }

  return embedding
}

/**
 * Cache common responses
 */
export function cacheResponse(key: string, response: string) {
  responseCache.set(key, {
    response,
    timestamp: Date.now(),
  })

  // Clean old cache entries
  cleanCache(responseCache, RESPONSE_TTL)
}

export function getCachedResponse(key: string): string | null {
  const cached = responseCache.get(key)

  if (!cached) return null

  // Check if expired
  if (Date.now() - cached.timestamp > RESPONSE_TTL) {
    responseCache.delete(key)
    return null
  }

  return cached.response
}

/**
 * Cache bot configurations
 */
export function cacheBotConfig(botId: string, config: any) {
  botConfigCache.set(botId, {
    config,
    timestamp: Date.now(),
  })

  cleanCache(botConfigCache, BOT_CONFIG_TTL)
}

export function getCachedBotConfig(botId: string): any | null {
  const cached = botConfigCache.get(botId)

  if (!cached) return null

  if (Date.now() - cached.timestamp > BOT_CONFIG_TTL) {
    botConfigCache.delete(botId)
    return null
  }

  return cached.config
}

export function invalidateBotConfig(botId: string) {
  botConfigCache.delete(botId)
}

/**
 * Clean expired cache entries
 */
function cleanCache(cache: Map<string, { timestamp: number; [key: string]: any }>, ttl: number) {
  const now = Date.now()

  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > ttl) {
      cache.delete(key)
    }
  }
}

/**
 * Clear all caches (for testing)
 */
export function clearAllCaches() {
  embeddingCache.clear()
  responseCache.clear()
  botConfigCache.clear()
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    embeddings: {
      size: embeddingCache.size,
      maxSize: 10000,
    },
    responses: {
      size: responseCache.size,
    },
    botConfigs: {
      size: botConfigCache.size,
    },
  }
}
