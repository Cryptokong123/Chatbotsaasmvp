/**
 * Rate Limiting
 *
 * CRITICAL for preventing API abuse and runaway costs!
 *
 * Without rate limiting, a malicious user could:
 * - Spam your OpenAI API and cost you thousands
 * - DDOS your app
 * - Scrape all your data
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Create Redis client
// Note: For development without Upstash, we'll use an in-memory fallback
let redis: Redis | null = null
let ratelimit: Ratelimit | null = null

// Initialize Redis if credentials are available
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
    analytics: true,
  })
}

// In-memory fallback for development
const memoryStore = new Map<string, { count: number; resetAt: number }>()

async function checkMemoryRateLimit(identifier: string, limit: number, window: number): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
}> {
  const now = Date.now()
  const key = identifier
  const data = memoryStore.get(key)

  if (!data || now > data.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + window })
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: now + window,
    }
  }

  if (data.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: data.resetAt,
    }
  }

  data.count++
  return {
    success: true,
    limit,
    remaining: limit - data.count,
    reset: data.resetAt,
  }
}

/**
 * Rate limit by IP address
 */
export async function rateLimitByIP(
  ip: string,
  limit: number = 10,
  window: number = 60000 // 1 minute in ms
) {
  if (ratelimit) {
    const { success, limit: maxLimit, remaining, reset } = await ratelimit.limit(ip)
    return { success, limit: maxLimit, remaining, reset }
  }

  // Fallback to in-memory
  return checkMemoryRateLimit(ip, limit, window)
}

/**
 * Rate limit by user ID
 */
export async function rateLimitByUser(
  userId: string,
  limit: number = 100,
  window: number = 3600000 // 1 hour in ms
) {
  if (ratelimit) {
    const { success, limit: maxLimit, remaining, reset } = await ratelimit.limit(`user:${userId}`)
    return { success, limit: maxLimit, remaining, reset }
  }

  // Fallback to in-memory
  return checkMemoryRateLimit(`user:${userId}`, limit, window)
}

/**
 * Rate limit by bot ID (for embedded widgets)
 */
export async function rateLimitByBot(
  botId: string,
  limit: number = 1000,
  window: number = 3600000 // 1 hour in ms
) {
  if (ratelimit) {
    const { success, limit: maxLimit, remaining, reset } = await ratelimit.limit(`bot:${botId}`)
    return { success, limit: maxLimit, remaining, reset }
  }

  // Fallback to in-memory
  return checkMemoryRateLimit(`bot:${botId}`, limit, window)
}

/**
 * Get IP from request headers
 */
export function getIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const real = request.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (real) {
    return real.trim()
  }

  return 'unknown'
}

/**
 * Rate limit middleware helper
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 10,
  window: number = 60000
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const result = await rateLimitByIP(identifier, limit, window)

  return {
    allowed: result.success,
    remaining: result.remaining,
    reset: result.reset,
  }
}
