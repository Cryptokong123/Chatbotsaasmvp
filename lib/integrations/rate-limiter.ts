/**
 * Rate Limiting & Throttling System
 *
 * Respects platform-specific rate limits with backoff strategies and quota management
 */

import { EventEmitter } from 'events'

// ============================================================================
// TYPES
// ============================================================================

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  strategy: 'fixed' | 'sliding' | 'token_bucket'
  burstSize?: number
  refillRate?: number
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: Date
  retryAfter?: number
}

export interface ThrottleConfig {
  maxConcurrent: number
  minTime?: number
  reservoir?: number
  reservoirRefreshAmount?: number
  reservoirRefreshInterval?: number
}

// ============================================================================
// RATE LIMITER
// ============================================================================

export class RateLimiter extends EventEmitter {
  private limits: Map<string, RateLimitConfig> = new Map()
  private counters: Map<string, number> = new Map()
  private windows: Map<string, number> = new Map()
  private tokens: Map<string, number> = new Map()
  private lastRefill: Map<string, number> = new Map()
  private queue: Map<string, Array<() => void>> = new Map()

  /**
   * Register rate limit for a key
   */
  register(key: string, config: RateLimitConfig): void {
    this.limits.set(key, config)

    // Initialize based on strategy
    if (config.strategy === 'token_bucket') {
      this.tokens.set(key, config.burstSize || config.maxRequests)
      this.lastRefill.set(key, Date.now())
    } else {
      this.counters.set(key, 0)
      this.windows.set(key, Date.now())
    }

    this.queue.set(key, [])
  }

  /**
   * Check if request is allowed
   */
  async checkLimit(key: string): Promise<RateLimitInfo> {
    const config = this.limits.get(key)

    if (!config) {
      throw new Error(`Rate limit not configured for key: ${key}`)
    }

    switch (config.strategy) {
      case 'fixed':
        return this.checkFixedWindow(key, config)

      case 'sliding':
        return this.checkSlidingWindow(key, config)

      case 'token_bucket':
        return this.checkTokenBucket(key, config)

      default:
        throw new Error(`Unknown rate limit strategy: ${config.strategy}`)
    }
  }

  /**
   * Acquire permission to make request (waits if needed)
   */
  async acquire(key: string): Promise<void> {
    while (true) {
      const info = await this.checkLimit(key)

      if (info.remaining > 0) {
        await this.consumeToken(key)
        return
      }

      // Wait until reset or retry after
      const waitTime = info.retryAfter || (info.reset.getTime() - Date.now())
      this.emit('rate_limit:waiting', { key, waitTime })

      await this.sleep(waitTime)
    }
  }

  /**
   * Try to acquire without waiting
   */
  async tryAcquire(key: string): Promise<boolean> {
    const info = await this.checkLimit(key)

    if (info.remaining > 0) {
      await this.consumeToken(key)
      return true
    }

    return false
  }

  // ============================================================================
  // RATE LIMIT STRATEGIES
  // ============================================================================

  /**
   * Fixed window rate limiting
   */
  private checkFixedWindow(key: string, config: RateLimitConfig): RateLimitInfo {
    const now = Date.now()
    const windowStart = this.windows.get(key)!
    const count = this.counters.get(key)!

    // Reset window if expired
    if (now - windowStart >= config.windowMs) {
      this.counters.set(key, 0)
      this.windows.set(key, now)

      return {
        limit: config.maxRequests,
        remaining: config.maxRequests,
        reset: new Date(now + config.windowMs),
      }
    }

    const remaining = Math.max(0, config.maxRequests - count)
    const resetTime = windowStart + config.windowMs

    return {
      limit: config.maxRequests,
      remaining,
      reset: new Date(resetTime),
      retryAfter: remaining === 0 ? resetTime - now : undefined,
    }
  }

  /**
   * Sliding window rate limiting
   */
  private checkSlidingWindow(key: string, config: RateLimitConfig): RateLimitInfo {
    const now = Date.now()
    const windowStart = this.windows.get(key)!
    const currentCount = this.counters.get(key)!

    // Calculate how much of the previous window overlaps
    const timeSinceWindowStart = now - windowStart
    const percentOfWindowPassed = timeSinceWindowStart / config.windowMs

    // Decay old requests based on time passed
    const effectiveCount = Math.ceil(currentCount * (1 - percentOfWindowPassed))

    const remaining = Math.max(0, config.maxRequests - effectiveCount)

    return {
      limit: config.maxRequests,
      remaining,
      reset: new Date(now + config.windowMs),
      retryAfter: remaining === 0 ? config.windowMs : undefined,
    }
  }

  /**
   * Token bucket rate limiting
   */
  private checkTokenBucket(key: string, config: RateLimitConfig): RateLimitInfo {
    const now = Date.now()
    const lastRefill = this.lastRefill.get(key)!
    let tokens = this.tokens.get(key)!

    // Refill tokens based on time passed
    const timePassed = now - lastRefill
    const refillRate = config.refillRate || config.maxRequests / (config.windowMs / 1000)
    const tokensToAdd = (timePassed / 1000) * refillRate

    const maxTokens = config.burstSize || config.maxRequests
    tokens = Math.min(maxTokens, tokens + tokensToAdd)

    // Update state
    this.tokens.set(key, tokens)
    this.lastRefill.set(key, now)

    const remaining = Math.floor(tokens)
    const resetTime = tokens >= 1 ? now : now + ((1 - tokens) / refillRate) * 1000

    return {
      limit: maxTokens,
      remaining,
      reset: new Date(resetTime),
      retryAfter: remaining === 0 ? resetTime - now : undefined,
    }
  }

  /**
   * Consume a token
   */
  private async consumeToken(key: string): Promise<void> {
    const config = this.limits.get(key)!

    if (config.strategy === 'token_bucket') {
      const tokens = this.tokens.get(key)!
      this.tokens.set(key, Math.max(0, tokens - 1))
    } else {
      const count = this.counters.get(key)!
      this.counters.set(key, count + 1)
    }

    this.emit('rate_limit:consumed', { key })
  }

  // ============================================================================
  // QUOTA MANAGEMENT
  // ============================================================================

  /**
   * Get current rate limit status
   */
  getStatus(key: string): RateLimitInfo | null {
    const config = this.limits.get(key)

    if (!config) {
      return null
    }

    // Use checkLimit without consuming
    switch (config.strategy) {
      case 'fixed':
        return this.checkFixedWindow(key, config)

      case 'sliding':
        return this.checkSlidingWindow(key, config)

      case 'token_bucket':
        return this.checkTokenBucket(key, config)

      default:
        return null
    }
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    const config = this.limits.get(key)

    if (!config) {
      return
    }

    if (config.strategy === 'token_bucket') {
      this.tokens.set(key, config.burstSize || config.maxRequests)
      this.lastRefill.set(key, Date.now())
    } else {
      this.counters.set(key, 0)
      this.windows.set(key, Date.now())
    }

    this.emit('rate_limit:reset', { key })
  }

  /**
   * Remove rate limit for a key
   */
  remove(key: string): void {
    this.limits.delete(key)
    this.counters.delete(key)
    this.windows.delete(key)
    this.tokens.delete(key)
    this.lastRefill.delete(key)
    this.queue.delete(key)
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get all registered keys
   */
  getKeys(): string[] {
    return Array.from(this.limits.keys())
  }

  /**
   * Get configuration for a key
   */
  getConfig(key: string): RateLimitConfig | undefined {
    return this.limits.get(key)
  }
}

// ============================================================================
// THROTTLER (for concurrent request limiting)
// ============================================================================

export class Throttler {
  private config: ThrottleConfig
  private currentlyRunning = 0
  private queue: Array<{ fn: () => Promise<any>; resolve: (value: any) => void; reject: (error: any) => void }> = []
  private reservoir: number
  private lastReservoirRefresh: number

  constructor(config: ThrottleConfig) {
    this.config = config
    this.reservoir = config.reservoir || Infinity
    this.lastReservoirRefresh = Date.now()

    // Start reservoir refill interval if configured
    if (config.reservoirRefreshAmount && config.reservoirRefreshInterval) {
      setInterval(() => {
        this.refillReservoir()
      }, config.reservoirRefreshInterval)
    }
  }

  /**
   * Execute function with throttling
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Wait if reservoir is empty
    while (this.reservoir <= 0) {
      await this.sleep(100)
    }

    // Wait if max concurrent reached
    if (this.currentlyRunning >= this.config.maxConcurrent) {
      return new Promise((resolve, reject) => {
        this.queue.push({ fn, resolve, reject })
      })
    }

    return this.run(fn)
  }

  /**
   * Run function
   */
  private async run<T>(fn: () => Promise<T>): Promise<T> {
    this.currentlyRunning++
    this.reservoir--

    const startTime = Date.now()

    try {
      const result = await fn()

      // Enforce minimum time if configured
      if (this.config.minTime) {
        const elapsed = Date.now() - startTime
        if (elapsed < this.config.minTime) {
          await this.sleep(this.config.minTime - elapsed)
        }
      }

      return result
    } finally {
      this.currentlyRunning--
      this.processQueue()
    }
  }

  /**
   * Process queued functions
   */
  private processQueue(): void {
    if (this.queue.length === 0) {
      return
    }

    if (this.currentlyRunning >= this.config.maxConcurrent) {
      return
    }

    if (this.reservoir <= 0) {
      return
    }

    const item = this.queue.shift()
    if (item) {
      this.run(item.fn)
        .then(item.resolve)
        .catch(item.reject)
    }
  }

  /**
   * Refill reservoir
   */
  private refillReservoir(): void {
    if (this.config.reservoirRefreshAmount) {
      this.reservoir = Math.min(
        this.config.reservoir || Infinity,
        this.reservoir + this.config.reservoirRefreshAmount
      )
      this.lastReservoirRefresh = Date.now()
    }
  }

  /**
   * Get current status
   */
  getStatus(): {
    currentlyRunning: number
    queued: number
    reservoir: number
  } {
    return {
      currentlyRunning: this.currentlyRunning,
      queued: this.queue.length,
      reservoir: this.reservoir,
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default RateLimiter
