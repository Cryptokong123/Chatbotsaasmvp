/**
 * Base Integration Adapter
 *
 * Production-grade base class for all integrations with:
 * - Automatic retry logic with exponential backoff
 * - Rate limiting with token bucket algorithm
 * - Circuit breaker pattern
 * - Comprehensive error handling
 * - Request/response logging
 * - Metrics collection
 * - Health checking
 */

import {
  IntegrationType,
  IntegrationConfig,
  IntegrationCapabilities,
  IntegrationResponse,
  IntegrationError,
  AuthenticationError,
  RateLimitError,
  NetworkError,
} from './types'

// ============================================================================
// RATE LIMITER
// ============================================================================

class RateLimiter {
  private tokens: number
  private lastRefill: number

  constructor(
    private maxTokens: number,
    private refillRate: number // tokens per second
  ) {
    this.tokens = maxTokens
    this.lastRefill = Date.now()
  }

  async acquire(tokens: number = 1): Promise<boolean> {
    this.refill()

    if (this.tokens >= tokens) {
      this.tokens -= tokens
      return true
    }

    // Wait for tokens to be available
    const waitTime = ((tokens - this.tokens) / this.refillRate) * 1000
    await this.sleep(waitTime)
    this.refill()

    if (this.tokens >= tokens) {
      this.tokens -= tokens
      return true
    }

    return false
  }

  private refill(): void {
    const now = Date.now()
    const timePassed = (now - this.lastRefill) / 1000
    const tokensToAdd = timePassed * this.refillRate

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd)
    this.lastRefill = now
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

class CircuitBreaker {
  private failures = 0
  private successCount = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half_open' = 'closed'

  constructor(
    private threshold: number = 5, // failures before opening
    private timeout: number = 60000, // time to wait before trying again (ms)
    private successThreshold: number = 2 // successes needed to close
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime >= this.timeout) {
        this.state = 'half_open'
        this.successCount = 0
      } else {
        throw new Error('Circuit breaker is open')
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failures = 0

    if (this.state === 'half_open') {
      this.successCount++
      if (this.successCount >= this.successThreshold) {
        this.state = 'closed'
        this.successCount = 0
      }
    }
  }

  private onFailure(): void {
    this.failures++
    this.lastFailureTime = Date.now()

    if (this.failures >= this.threshold) {
      this.state = 'open'
    }
  }

  getState(): 'closed' | 'open' | 'half_open' {
    return this.state
  }

  reset(): void {
    this.failures = 0
    this.successCount = 0
    this.state = 'closed'
  }
}

// ============================================================================
// BASE ADAPTER
// ============================================================================

export class BaseIntegrationAdapter {
  protected config: IntegrationConfig
  protected rateLimiter?: RateLimiter
  protected circuitBreaker: CircuitBreaker
  protected isConnected = false
  protected lastHealthCheck?: Date
  protected metrics = {
    requestsTotal: 0,
    requestsSuccessful: 0,
    requestsFailed: 0,
    totalLatency: 0,
    lastRequest?: Date,
  }

  constructor(config: IntegrationConfig) {
    this.config = config

    // Initialize rate limiter if configured
    if (config.rateLimit) {
      this.rateLimiter = new RateLimiter(
        config.rateLimit.maxRequests,
        config.rateLimit.maxRequests / (config.rateLimit.windowMs / 1000)
      )
    }

    // Initialize circuit breaker
    this.circuitBreaker = new CircuitBreaker()
  }

  // ============================================================================
  // METHODS (must be implemented/overridden by subclasses)
  // ============================================================================

  getCapabilities(): IntegrationCapabilities {
    throw new Error('getCapabilities() must be implemented by subclass')
  }

  connect(): Promise<IntegrationResponse<void>> {
    throw new Error('connect() must be implemented by subclass')
  }

  disconnect(): Promise<IntegrationResponse<void>> {
    throw new Error('disconnect() must be implemented by subclass')
  }

  testConnection(): Promise<IntegrationResponse<boolean>> {
    throw new Error('testConnection() must be implemented by subclass')
  }

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  protected async ensureConnected(): Promise<void> {
    if (!this.isConnected) {
      const result = await this.connect()
      if (!result.success) {
        throw new IntegrationError(
          `Failed to connect to ${this.config.type}`,
          'CONNECTION_ERROR',
          this.config.type,
          true,
          result.error
        )
      }
    }
  }

  async healthCheck(): Promise<IntegrationResponse<{
    healthy: boolean
    latency: number
    circuitBreakerState: string
    lastChecked: Date
  }>> {
    const startTime = Date.now()

    try {
      const testResult = await this.testConnection()
      const latency = Date.now() - startTime

      this.lastHealthCheck = new Date()

      return {
        success: true,
        data: {
          healthy: testResult.success,
          latency,
          circuitBreakerState: this.circuitBreaker.getState(),
          lastChecked: this.lastHealthCheck,
        },
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: error.message,
          retryable: true,
        },
        data: {
          healthy: false,
          latency: Date.now() - startTime,
          circuitBreakerState: this.circuitBreaker.getState(),
          lastChecked: new Date(),
        },
      }
    }
  }

  // ============================================================================
  // REQUEST HANDLING
  // ============================================================================

  protected async makeRequest<T>(
    fn: () => Promise<T>,
    options: {
      retries?: number
      retryDelay?: number
      timeout?: number
      skipRateLimit?: boolean
    } = {}
  ): Promise<IntegrationResponse<T>> {
    const {
      retries = this.config.retryAttempts || 3,
      retryDelay = this.config.retryDelay || 1000,
      timeout = this.config.timeout || 30000,
      skipRateLimit = false,
    } = options

    const startTime = Date.now()
    this.metrics.requestsTotal++

    try {
      // Check rate limit
      if (this.rateLimiter && !skipRateLimit) {
        await this.rateLimiter.acquire()
      }

      // Execute with circuit breaker and retry logic
      const result = await this.circuitBreaker.execute(async () => {
        return await this.retryWithBackoff(fn, retries, retryDelay, timeout)
      })

      const duration = Date.now() - startTime
      this.metrics.requestsSuccessful++
      this.metrics.totalLatency += duration
      this.metrics.lastRequest = new Date()

      return {
        success: true,
        data: result,
        metadata: {
          timestamp: new Date(),
          duration,
        },
      }
    } catch (error: any) {
      const duration = Date.now() - startTime
      this.metrics.requestsFailed++
      this.metrics.lastRequest = new Date()

      return {
        success: false,
        error: this.formatError(error),
        metadata: {
          timestamp: new Date(),
          duration,
        },
      }
    }
  }

  // ============================================================================
  // RETRY LOGIC
  // ============================================================================

  protected async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number,
    baseDelay: number,
    timeout: number
  ): Promise<T> {
    let lastError: any

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Add timeout to the request
        const result = await this.withTimeout(fn(), timeout)
        return result
      } catch (error: any) {
        lastError = error

        // Don't retry if not retryable
        if (error.retryable === false) {
          throw error
        }

        // Don't retry if it's the last attempt
        if (attempt === maxRetries) {
          throw error
        }

        // Calculate exponential backoff delay
        const delay = this.calculateBackoff(attempt, baseDelay, error)
        await this.sleep(delay)

        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`)
      }
    }

    throw lastError
  }

  private calculateBackoff(attempt: number, baseDelay: number, error: any): number {
    // If rate limit error, use the retry-after value
    if (error instanceof RateLimitError && error.retryAfterMs) {
      return error.retryAfterMs
    }

    // Exponential backoff with jitter
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), 30000)
    const jitter = Math.random() * 1000
    return exponentialDelay + jitter
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  protected async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      ),
    ])
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  protected formatError(error: any): {
    code: string
    message: string
    details?: any
    retryable: boolean
  } {
    if (error instanceof IntegrationError) {
      return {
        code: error.code,
        message: error.message,
        details: error.originalError,
        retryable: error.retryable,
      }
    }

    // Network errors are retryable
    if (
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      error.message?.includes('timeout') ||
      error.message?.includes('network')
    ) {
      return {
        code: 'NETWORK_ERROR',
        message: error.message || 'Network error occurred',
        retryable: true,
      }
    }

    // 5xx errors are retryable
    if (error.status >= 500 && error.status < 600) {
      return {
        code: 'SERVER_ERROR',
        message: error.message || 'Server error occurred',
        retryable: true,
      }
    }

    // Rate limit errors
    if (error.status === 429) {
      const retryAfter = error.headers?.['retry-after']
      const retryAfterMs = retryAfter ? parseInt(retryAfter) * 1000 : 60000

      return {
        code: 'RATE_LIMIT',
        message: 'Rate limit exceeded',
        retryable: true,
        details: { retryAfterMs },
      }
    }

    // Authentication errors
    if (error.status === 401 || error.status === 403) {
      return {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
        retryable: false,
      }
    }

    // Validation errors
    if (error.status === 400 || error.status === 422) {
      return {
        code: 'VALIDATION_ERROR',
        message: error.message || 'Validation failed',
        retryable: false,
        details: error.details,
      }
    }

    // Default error
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      retryable: false,
      details: error,
    }
  }

  // ============================================================================
  // METRICS & MONITORING
  // ============================================================================

  getMetrics() {
    const avgLatency =
      this.metrics.requestsSuccessful > 0
        ? this.metrics.totalLatency / this.metrics.requestsSuccessful
        : 0

    return {
      ...this.metrics,
      averageLatency: avgLatency,
      successRate:
        this.metrics.requestsTotal > 0
          ? (this.metrics.requestsSuccessful / this.metrics.requestsTotal) * 100
          : 0,
      circuitBreakerState: this.circuitBreaker.getState(),
      isConnected: this.isConnected,
      lastHealthCheck: this.lastHealthCheck,
    }
  }

  resetMetrics(): void {
    this.metrics = {
      requestsTotal: 0,
      requestsSuccessful: 0,
      requestsFailed: 0,
      totalLatency: 0,
      lastRequest: undefined,
    }
  }

  // ============================================================================
  // WEBHOOK HANDLING
  // ============================================================================

  async verifyWebhook(
    payload: string | Buffer,
    signature: string,
    secret?: string
  ): Promise<boolean> {
    // Override this method in subclasses for platform-specific verification
    throw new Error(`Webhook verification not implemented for ${this.config.type}`)
  }

  async parseWebhook(payload: any): Promise<any> {
    // Override this method in subclasses for platform-specific parsing
    throw new Error(`Webhook parsing not implemented for ${this.config.type}`)
  }

  // ============================================================================
  // OAUTH
  // ============================================================================

  async refreshAccessToken(): Promise<IntegrationResponse<{
    accessToken: string
    refreshToken?: string
    expiresIn?: number
  }>> {
    throw new Error(`OAuth refresh not implemented for ${this.config.type}`)
  }

  protected async checkAndRefreshToken(): Promise<void> {
    if (this.config.oauth?.expiresAt) {
      const now = new Date()
      const expiresAt = new Date(this.config.oauth.expiresAt)

      // Refresh if expires in less than 5 minutes
      if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
        const result = await this.refreshAccessToken()
        if (result.success && result.data) {
          this.config.oauth.accessToken = result.data.accessToken
          if (result.data.refreshToken) {
            this.config.oauth.refreshToken = result.data.refreshToken
          }
          if (result.data.expiresIn) {
            this.config.oauth.expiresAt = new Date(
              Date.now() + result.data.expiresIn * 1000
            )
          }
        }
      }
    }
  }

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  getConfig(): IntegrationConfig {
    return { ...this.config }
  }

  updateConfig(updates: Partial<IntegrationConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
    }
  }

  // ============================================================================
  // LOGGING
  // ============================================================================

  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      integration: this.config.type,
      message,
      data,
    }

    console.log(JSON.stringify(logEntry))
  }
}
