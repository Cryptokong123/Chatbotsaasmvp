/**
 * Idempotency Layer
 *
 * Idempotency keys, duplicate request detection, state management for ensuring operations execute exactly once
 */

import crypto from 'crypto'
import { EventEmitter } from 'events'
import { createClient } from '@supabase/supabase-js'

// ============================================================================
// TYPES
// ============================================================================

export interface IdempotencyKey {
  id: string
  key: string
  tenantId?: string
  instanceId?: string
  operation: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  requestHash: string
  requestBody?: any
  responseStatus?: number
  responseBody?: any
  error?: string
  lockExpiresAt?: Date
  processingStartedAt?: Date
  completedAt?: Date
  retryCount: number
  maxRetries: number
  createdAt: Date
  updatedAt: Date
  expiresAt: Date
}

export interface IdempotencyOptions {
  ttl?: number
  maxRetries?: number
  lockTimeout?: number
  autoRelease?: boolean
}

export interface IdempotencyResult<T = any> {
  isNew: boolean
  isDuplicate: boolean
  idempotencyKeyId: string
  status: IdempotencyKey['status']
  response?: T
  error?: string
  shouldProcess: boolean
}

export interface LockResult {
  acquired: boolean
  idempotencyKey?: IdempotencyKey
  waitTime?: number
}

// ============================================================================
// IDEMPOTENCY MANAGER
// ============================================================================

export class IdempotencyManager extends EventEmitter {
  private supabase: ReturnType<typeof createClient>
  private memoryCache = new Map<string, IdempotencyKey>()
  private locks = new Map<string, NodeJS.Timeout>()
  private config: Required<IdempotencyOptions>

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    options: IdempotencyOptions = {}
  ) {
    super()
    this.supabase = createClient(supabaseUrl, supabaseKey)

    this.config = {
      ttl: options.ttl || 86400000, // 24 hours
      maxRetries: options.maxRetries || 3,
      lockTimeout: options.lockTimeout || 30000, // 30 seconds
      autoRelease: options.autoRelease ?? true,
    }
  }

  // ============================================================================
  // IDEMPOTENCY KEY OPERATIONS
  // ============================================================================

  /**
   * Check idempotency and get result
   */
  async check<T = any>(
    key: string,
    operation: string,
    requestBody: any,
    options: {
      tenantId?: string
      instanceId?: string
    } = {}
  ): Promise<IdempotencyResult<T>> {
    const requestHash = this.hashRequest(requestBody)

    // Try memory cache first
    const cached = this.memoryCache.get(key)
    if (cached && !this.isExpired(cached)) {
      this.emit('idempotency:cache_hit', { key })

      return {
        isNew: false,
        isDuplicate: true,
        idempotencyKeyId: cached.id,
        status: cached.status,
        response: cached.responseBody,
        error: cached.error,
        shouldProcess: false,
      }
    }

    // Check database
    const { data: existing } = await ((this.supabase
      .from('idempotency_keys') as any) as any)
      .select('*')
      .eq('key', key)
      .eq('operation', operation)
      .single()

    if (existing) {
      // Verify request hash matches
      if (existing.request_hash !== requestHash) {
        throw new Error('Idempotency key reused with different request body')
      }

      // Check if expired
      if (this.isExpired(existing)) {
        await this.delete(existing.id)
        return this.createNew(key, operation, requestBody, requestHash, options)
      }

      // Cache result
      this.cacheKey(existing)

      this.emit('idempotency:duplicate_detected', { key, status: existing.status })

      return {
        isNew: false,
        isDuplicate: true,
        idempotencyKeyId: existing.id,
        status: existing.status,
        response: existing.response_body,
        error: existing.error,
        shouldProcess: existing.status === 'pending' || existing.status === 'failed',
      }
    }

    // Create new idempotency key
    return this.createNew(key, operation, requestBody, requestHash, options)
  }

  /**
   * Create new idempotency key
   */
  private async createNew(
    key: string,
    operation: string,
    requestBody: any,
    requestHash: string,
    options: {
      tenantId?: string
      instanceId?: string
    }
  ): Promise<IdempotencyResult> {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + this.config.ttl)

    const { data, error } = await ((this.supabase
      .from('idempotency_keys') as any) as any)
      .insert({
        key,
        tenant_id: options.tenantId,
        instance_id: options.instanceId,
        operation,
        status: 'pending',
        request_hash: requestHash,
        request_body: requestBody,
        retry_count: 0,
        max_retries: this.config.maxRetries,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    this.cacheKey(data)

    this.emit('idempotency:created', { key, idempotencyKeyId: data.id })

    return {
      isNew: true,
      isDuplicate: false,
      idempotencyKeyId: data.id,
      status: 'pending',
      shouldProcess: true,
    }
  }

  /**
   * Acquire lock for processing
   */
  async acquireLock(idempotencyKeyId: string): Promise<LockResult> {
    const lockExpiresAt = new Date(Date.now() + this.config.lockTimeout)

    try {
      const { data, error } = await (this.supabase
        .from('idempotency_keys') as any)
        .update({
          status: 'processing',
          processing_started_at: new Date().toISOString(),
          lock_expires_at: lockExpiresAt.toISOString(),
        })
        .eq('id', idempotencyKeyId)
        .eq('status', 'pending')
        .select()
        .single()

      if (error || !data) {
        // Lock already acquired or key not found
        const { data: existing } = await (this.supabase
          .from('idempotency_keys') as any)
          .select('*')
          .eq('id', idempotencyKeyId)
          .single()

        if (existing) {
          this.emit('idempotency:lock_failed', { idempotencyKeyId, status: existing.status })

          return {
            acquired: false,
            idempotencyKey: existing,
            waitTime: existing.lock_expires_at
              ? new Date(existing.lock_expires_at).getTime() - Date.now()
              : undefined,
          }
        }

        return { acquired: false }
      }

      // Set auto-release timer
      if (this.config.autoRelease) {
        const timer = setTimeout(() => {
          this.releaseLock(idempotencyKeyId).catch(console.error)
        }, this.config.lockTimeout)

        this.locks.set(idempotencyKeyId, timer)
      }

      this.emit('idempotency:lock_acquired', { idempotencyKeyId })

      return {
        acquired: true,
        idempotencyKey: data,
      }
    } catch (error: any) {
      this.emit('idempotency:lock_error', { idempotencyKeyId, error: error.message })
      return { acquired: false }
    }
  }

  /**
   * Release lock
   */
  async releaseLock(idempotencyKeyId: string): Promise<boolean> {
    // Clear auto-release timer
    const timer = this.locks.get(idempotencyKeyId)
    if (timer) {
      clearTimeout(timer)
      this.locks.delete(idempotencyKeyId)
    }

    try {
      const { error } = await (this.supabase
        .from('idempotency_keys') as any)
        .update({
          status: 'pending',
          lock_expires_at: null,
        })
        .eq('id', idempotencyKeyId)
        .eq('status', 'processing')

      if (error) throw error

      this.emit('idempotency:lock_released', { idempotencyKeyId })

      return true
    } catch (error: any) {
      console.error('Failed to release lock:', error)
      return false
    }
  }

  /**
   * Mark operation as completed
   */
  async complete(
    idempotencyKeyId: string,
    response: any,
    options: {
      status?: number
    } = {}
  ): Promise<void> {
    // Clear auto-release timer
    const timer = this.locks.get(idempotencyKeyId)
    if (timer) {
      clearTimeout(timer)
      this.locks.delete(idempotencyKeyId)
    }

    const { data, error } = await (this.supabase
      .from('idempotency_keys') as any)
      .update({
        status: 'completed',
        response_status: options.status || 200,
        response_body: response,
        completed_at: new Date().toISOString(),
        lock_expires_at: null,
      })
      .eq('id', idempotencyKeyId)
      .select()
      .single()

    if (error) throw error

    this.cacheKey(data)

    this.emit('idempotency:completed', { idempotencyKeyId })
  }

  /**
   * Mark operation as failed
   */
  async fail(
    idempotencyKeyId: string,
    error: string,
    options: {
      status?: number
      shouldRetry?: boolean
    } = {}
  ): Promise<void> {
    // Clear auto-release timer
    const timer = this.locks.get(idempotencyKeyId)
    if (timer) {
      clearTimeout(timer)
      this.locks.delete(idempotencyKeyId)
    }

    const { data: key } = await (this.supabase
      .from('idempotency_keys') as any)
      .select('*')
      .eq('id', idempotencyKeyId)
      .single()

    if (!key) {
      throw new Error('Idempotency key not found')
    }

    const shouldRetry =
      options.shouldRetry !== false && key.retry_count < key.max_retries

    const { data, error: updateError } = await (this.supabase
      .from('idempotency_keys') as any)
      .update({
        status: shouldRetry ? 'pending' : 'failed',
        response_status: options.status || 500,
        error,
        retry_count: key.retry_count + 1,
        lock_expires_at: null,
      })
      .eq('id', idempotencyKeyId)
      .select()
      .single()

    if (updateError) throw updateError

    this.cacheKey(data)

    this.emit('idempotency:failed', {
      idempotencyKeyId,
      error,
      willRetry: shouldRetry,
      retryCount: key.retry_count + 1,
    })
  }

  /**
   * Execute operation with idempotency
   */
  async execute<T = any>(
    key: string,
    operation: string,
    requestBody: any,
    handler: () => Promise<T>,
    options: {
      tenantId?: string
      instanceId?: string
    } = {}
  ): Promise<T> {
    // Check idempotency
    const result = await this.check<T>(key, operation, requestBody, options)

    // Return cached response if duplicate
    if (result.isDuplicate && result.status === 'completed') {
      this.emit('idempotency:returned_cached', { key })
      return result.response!
    }

    // If already processing, wait for completion
    if (result.isDuplicate && result.status === 'processing') {
      return this.waitForCompletion<T>(result.idempotencyKeyId)
    }

    // Acquire lock
    const lock = await this.acquireLock(result.idempotencyKeyId)

    if (!lock.acquired) {
      // Another process acquired the lock, wait for completion
      return this.waitForCompletion<T>(result.idempotencyKeyId)
    }

    // Execute operation
    try {
      const response = await handler()

      // Mark as completed
      await this.complete(result.idempotencyKeyId, response)

      return response
    } catch (error: any) {
      // Mark as failed
      await this.fail(result.idempotencyKeyId, error.message, {
        shouldRetry: true,
      })

      throw error
    }
  }

  /**
   * Wait for operation completion
   */
  private async waitForCompletion<T = any>(
    idempotencyKeyId: string,
    maxWaitTime: number = 30000,
    pollInterval: number = 500
  ): Promise<T> {
    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitTime) {
      const { data } = await (this.supabase
        .from('idempotency_keys') as any)
        .select('*')
        .eq('id', idempotencyKeyId)
        .single()

      if (!data) {
        throw new Error('Idempotency key not found')
      }

      if (data.status === 'completed') {
        return data.response_body as T
      }

      if (data.status === 'failed') {
        throw new Error(data.error || 'Operation failed')
      }

      // Check if lock expired
      if (data.lock_expires_at && new Date(data.lock_expires_at) < new Date()) {
        // Lock expired, try to acquire
        const lock = await this.acquireLock(idempotencyKeyId)
        if (lock.acquired) {
          throw new Error('Lock expired, retry operation')
        }
      }

      // Wait before polling again
      await this.sleep(pollInterval)
    }

    throw new Error('Timeout waiting for operation completion')
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  /**
   * Delete idempotency key
   */
  async delete(idempotencyKeyId: string): Promise<boolean> {
    const { error } = await (this.supabase
      .from('idempotency_keys') as any)
      .delete()
      .eq('id', idempotencyKeyId)

    if (error) {
      console.error('Failed to delete idempotency key:', error)
      return false
    }

    // Remove from cache
    for (const [key, cached] of this.memoryCache.entries()) {
      if (cached.id === idempotencyKeyId) {
        this.memoryCache.delete(key)
        break
      }
    }

    this.emit('idempotency:deleted', { idempotencyKeyId })

    return true
  }

  /**
   * Cleanup expired keys
   */
  async cleanup(): Promise<number> {
    const { data, error } = await (this.supabase
      .from('idempotency_keys') as any)
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id')

    if (error) {
      console.error('Failed to cleanup expired keys:', error)
      return 0
    }

    const count = data?.length || 0

    // Clear memory cache
    const now = new Date()
    for (const [key, cached] of this.memoryCache.entries()) {
      if (new Date(cached.expiresAt) < now) {
        this.memoryCache.delete(key)
      }
    }

    if (count > 0) {
      this.emit('idempotency:cleanup', { count })
    }

    return count
  }

  /**
   * Cleanup failed keys
   */
  async cleanupFailed(olderThan: Date = new Date(Date.now() - 86400000)): Promise<number> {
    const { data, error } = await (this.supabase
      .from('idempotency_keys') as any)
      .delete()
      .eq('status', 'failed')
      .lt('updated_at', olderThan.toISOString())
      .select('id')

    if (error) {
      console.error('Failed to cleanup failed keys:', error)
      return 0
    }

    return data?.length || 0
  }

  /**
   * Release stale locks
   */
  async releaseStale(): Promise<number> {
    const { data, error } = await (this.supabase
      .from('idempotency_keys') as any)
      .update({
        status: 'pending',
        lock_expires_at: null,
      })
      .eq('status', 'processing')
      .lt('lock_expires_at', new Date().toISOString())
      .select('id')

    if (error) {
      console.error('Failed to release stale locks:', error)
      return 0
    }

    const count = data?.length || 0

    if (count > 0) {
      this.emit('idempotency:stale_locks_released', { count })
    }

    return count
  }

  // ============================================================================
  // QUERIES
  // ============================================================================

  /**
   * Get idempotency key by key
   */
  async getByKey(key: string, operation: string): Promise<IdempotencyKey | null> {
    const { data, error } = await (this.supabase
      .from('idempotency_keys') as any)
      .select('*')
      .eq('key', key)
      .eq('operation', operation)
      .single()

    if (error || !data) {
      return null
    }

    return data as IdempotencyKey
  }

  /**
   * Get idempotency key by ID
   */
  async getById(idempotencyKeyId: string): Promise<IdempotencyKey | null> {
    const { data, error } = await (this.supabase
      .from('idempotency_keys') as any)
      .select('*')
      .eq('id', idempotencyKeyId)
      .single()

    if (error || !data) {
      return null
    }

    return data as IdempotencyKey
  }

  /**
   * List idempotency keys
   */
  async list(
    filter: {
      tenantId?: string
      instanceId?: string
      operation?: string
      status?: IdempotencyKey['status']
    } = {},
    options: {
      limit?: number
      offset?: number
    } = {}
  ): Promise<IdempotencyKey[]> {
    let query = (this.supabase.from('idempotency_keys') as any).select('*')

    if (filter.tenantId) {
      query = query.eq('tenant_id', filter.tenantId)
    }
    if (filter.instanceId) {
      query = query.eq('instance_id', filter.instanceId)
    }
    if (filter.operation) {
      query = query.eq('operation', filter.operation)
    }
    if (filter.status) {
      query = query.eq('status', filter.status)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return data as IdempotencyKey[]
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Generate idempotency key
   */
  static generateKey(data?: any): string {
    if (data) {
      return `idem_${crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').substring(0, 32)}`
    }
    return `idem_${crypto.randomBytes(16).toString('hex')}`
  }

  /**
   * Hash request body
   */
  private hashRequest(requestBody: any): string {
    return crypto.createHash('sha256').update(JSON.stringify(requestBody)).digest('hex')
  }

  /**
   * Check if key is expired
   */
  private isExpired(key: any): boolean {
    return new Date(key.expires_at) < new Date()
  }

  /**
   * Cache key in memory
   */
  private cacheKey(key: any): void {
    this.memoryCache.set(key.key, key)

    // Limit cache size
    if (this.memoryCache.size > 10000) {
      const firstKey = this.memoryCache.keys().next().value
      this.memoryCache.delete(firstKey)
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Destroy manager
   */
  destroy(): void {
    // Clear all timers
    for (const timer of this.locks.values()) {
      clearTimeout(timer)
    }
    this.locks.clear()
    this.memoryCache.clear()
    this.removeAllListeners()
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default IdempotencyManager
