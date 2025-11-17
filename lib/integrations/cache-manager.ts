/**
 * Caching Layer
 *
 * Multi-tier caching with Redis-like interface, TTL, LRU eviction, and cache warming
 */

import { EventEmitter } from 'events'

// ============================================================================
// TYPES
// ============================================================================

export interface CacheEntry<T = any> {
  key: string
  value: T
  ttl?: number
  expiresAt?: number
  tags?: string[]
  metadata?: Record<string, any>
  createdAt: number
  accessCount: number
  lastAccessedAt: number
}

export interface CacheOptions {
  ttl?: number
  tags?: string[]
  metadata?: Record<string, any>
}

export interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  evictions: number
  hitRate: number
  size: number
  memoryUsage: number
}

export interface CacheConfig {
  maxSize?: number
  defaultTtl?: number
  checkPeriod?: number
  evictionPolicy?: 'lru' | 'lfu' | 'fifo'
  enableStats?: boolean
}

export type CacheKey = string
export type CachePattern = string

// ============================================================================
// CACHE MANAGER
// ============================================================================

export class CacheManager extends EventEmitter {
  private cache = new Map<CacheKey, CacheEntry>()
  private tags = new Map<string, Set<CacheKey>>()
  private config: Required<CacheConfig>
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    evictions: 0,
    hitRate: 0,
    size: 0,
    memoryUsage: 0,
  }
  private cleanupInterval?: NodeJS.Timeout

  constructor(config: CacheConfig = {}) {
    super()

    this.config = {
      maxSize: config.maxSize || 10000,
      defaultTtl: config.defaultTtl || 3600000, // 1 hour
      checkPeriod: config.checkPeriod || 60000, // 1 minute
      evictionPolicy: config.evictionPolicy || 'lru',
      enableStats: config.enableStats ?? true,
    }

    // Start cleanup interval
    this.startCleanup()
  }

  // ============================================================================
  // BASIC OPERATIONS
  // ============================================================================

  /**
   * Get value from cache
   */
  get<T = any>(key: CacheKey): T | undefined {
    const entry = this.cache.get(key)

    if (!entry) {
      this.recordMiss()
      return undefined
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.delete(key)
      this.recordMiss()
      return undefined
    }

    // Update access stats
    entry.accessCount++
    entry.lastAccessedAt = Date.now()

    this.recordHit()
    this.emit('cache:hit', { key })

    return entry.value as T
  }

  /**
   * Set value in cache
   */
  set<T = any>(key: CacheKey, value: T, options: CacheOptions = {}): void {
    // Check size limit
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evict()
    }

    const ttl = options.ttl || this.config.defaultTtl
    const now = Date.now()

    const entry: CacheEntry<T> = {
      key,
      value,
      ttl,
      expiresAt: ttl ? now + ttl : undefined,
      tags: options.tags,
      metadata: options.metadata,
      createdAt: now,
      accessCount: 0,
      lastAccessedAt: now,
    }

    this.cache.set(key, entry)

    // Update tag index
    if (options.tags) {
      for (const tag of options.tags) {
        if (!this.tags.has(tag)) {
          this.tags.set(tag, new Set())
        }
        this.tags.get(tag)!.add(key)
      }
    }

    this.recordSet()
    this.emit('cache:set', { key, ttl })
  }

  /**
   * Check if key exists
   */
  has(key: CacheKey): boolean {
    const entry = this.cache.get(key)

    if (!entry) {
      return false
    }

    if (this.isExpired(entry)) {
      this.delete(key)
      return false
    }

    return true
  }

  /**
   * Delete key from cache
   */
  delete(key: CacheKey): boolean {
    const entry = this.cache.get(key)

    if (!entry) {
      return false
    }

    // Remove from tag index
    if (entry.tags) {
      for (const tag of entry.tags) {
        this.tags.get(tag)?.delete(key)
        if (this.tags.get(tag)?.size === 0) {
          this.tags.delete(tag)
        }
      }
    }

    this.cache.delete(key)
    this.recordDelete()
    this.emit('cache:delete', { key })

    return true
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const size = this.cache.size
    this.cache.clear()
    this.tags.clear()
    this.emit('cache:clear', { size })
  }

  /**
   * Get multiple values
   */
  mget<T = any>(keys: CacheKey[]): Array<T | undefined> {
    return keys.map(key => this.get<T>(key))
  }

  /**
   * Set multiple values
   */
  mset(entries: Array<{ key: CacheKey; value: any; options?: CacheOptions }>): void {
    for (const { key, value, options } of entries) {
      this.set(key, value, options)
    }
  }

  /**
   * Delete multiple keys
   */
  mdel(keys: CacheKey[]): number {
    let count = 0
    for (const key of keys) {
      if (this.delete(key)) {
        count++
      }
    }
    return count
  }

  // ============================================================================
  // ADVANCED OPERATIONS
  // ============================================================================

  /**
   * Get or set (fetch if missing)
   */
  async getOrSet<T = any>(
    key: CacheKey,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache
    const cached = this.get<T>(key)
    if (cached !== undefined) {
      return cached
    }

    // Fetch and cache
    const value = await fetcher()
    this.set(key, value, options)
    return value
  }

  /**
   * Increment numeric value
   */
  incr(key: CacheKey, delta: number = 1): number {
    const current = this.get<number>(key) || 0
    const newValue = current + delta
    this.set(key, newValue)
    return newValue
  }

  /**
   * Decrement numeric value
   */
  decr(key: CacheKey, delta: number = 1): number {
    return this.incr(key, -delta)
  }

  /**
   * Update TTL for existing key
   */
  expire(key: CacheKey, ttl: number): boolean {
    const entry = this.cache.get(key)

    if (!entry) {
      return false
    }

    entry.ttl = ttl
    entry.expiresAt = ttl ? Date.now() + ttl : undefined

    this.emit('cache:expire', { key, ttl })

    return true
  }

  /**
   * Get TTL for key
   */
  ttl(key: CacheKey): number | undefined {
    const entry = this.cache.get(key)

    if (!entry || !entry.expiresAt) {
      return undefined
    }

    const remaining = entry.expiresAt - Date.now()
    return remaining > 0 ? remaining : undefined
  }

  /**
   * Persist key (remove expiration)
   */
  persist(key: CacheKey): boolean {
    const entry = this.cache.get(key)

    if (!entry) {
      return false
    }

    entry.ttl = undefined
    entry.expiresAt = undefined

    return true
  }

  // ============================================================================
  // TAG-BASED OPERATIONS
  // ============================================================================

  /**
   * Get all keys with tag
   */
  getByTag(tag: string): CacheKey[] {
    const keys = this.tags.get(tag)
    return keys ? Array.from(keys) : []
  }

  /**
   * Delete all entries with tag
   */
  deleteByTag(tag: string): number {
    const keys = this.getByTag(tag)
    return this.mdel(keys)
  }

  /**
   * Get all tags for key
   */
  getTags(key: CacheKey): string[] | undefined {
    return this.cache.get(key)?.tags
  }

  /**
   * Add tags to existing key
   */
  addTags(key: CacheKey, tags: string[]): boolean {
    const entry = this.cache.get(key)

    if (!entry) {
      return false
    }

    entry.tags = entry.tags ? [...entry.tags, ...tags] : tags

    // Update tag index
    for (const tag of tags) {
      if (!this.tags.has(tag)) {
        this.tags.set(tag, new Set())
      }
      this.tags.get(tag)!.add(key)
    }

    return true
  }

  /**
   * Remove tags from key
   */
  removeTags(key: CacheKey, tags: string[]): boolean {
    const entry = this.cache.get(key)

    if (!entry || !entry.tags) {
      return false
    }

    entry.tags = entry.tags.filter(t => !tags.includes(t))

    // Update tag index
    for (const tag of tags) {
      this.tags.get(tag)?.delete(key)
      if (this.tags.get(tag)?.size === 0) {
        this.tags.delete(tag)
      }
    }

    return true
  }

  // ============================================================================
  // PATTERN MATCHING
  // ============================================================================

  /**
   * Get keys matching pattern (supports wildcards)
   */
  keys(pattern: CachePattern = '*'): CacheKey[] {
    if (pattern === '*') {
      return Array.from(this.cache.keys())
    }

    const regex = this.patternToRegex(pattern)
    return Array.from(this.cache.keys()).filter(key => regex.test(key))
  }

  /**
   * Delete keys matching pattern
   */
  deleteByPattern(pattern: CachePattern): number {
    const keys = this.keys(pattern)
    return this.mdel(keys)
  }

  /**
   * Convert glob pattern to regex
   */
  private patternToRegex(pattern: string): RegExp {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
    return new RegExp(`^${escaped}$`)
  }

  // ============================================================================
  // EVICTION
  // ============================================================================

  /**
   * Evict entries based on policy
   */
  private evict(): void {
    if (this.cache.size === 0) {
      return
    }

    let keyToEvict: CacheKey | undefined

    switch (this.config.evictionPolicy) {
      case 'lru':
        keyToEvict = this.findLruKey()
        break
      case 'lfu':
        keyToEvict = this.findLfuKey()
        break
      case 'fifo':
        keyToEvict = this.findFifoKey()
        break
    }

    if (keyToEvict) {
      this.delete(keyToEvict)
      this.stats.evictions++
      this.emit('cache:eviction', { key: keyToEvict, policy: this.config.evictionPolicy })
    }
  }

  /**
   * Find least recently used key
   */
  private findLruKey(): CacheKey | undefined {
    let lruKey: CacheKey | undefined
    let lruTime = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessedAt < lruTime) {
        lruTime = entry.lastAccessedAt
        lruKey = key
      }
    }

    return lruKey
  }

  /**
   * Find least frequently used key
   */
  private findLfuKey(): CacheKey | undefined {
    let lfuKey: CacheKey | undefined
    let lfuCount = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < lfuCount) {
        lfuCount = entry.accessCount
        lfuKey = key
      }
    }

    return lfuKey
  }

  /**
   * Find first in first out key
   */
  private findFifoKey(): CacheKey | undefined {
    let fifoKey: CacheKey | undefined
    let fifoTime = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < fifoTime) {
        fifoTime = entry.createdAt
        fifoKey = key
      }
    }

    return fifoKey
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  /**
   * Start automatic cleanup
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, this.config.checkPeriod)
  }

  /**
   * Stop automatic cleanup
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = undefined
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now()
    let count = 0

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.delete(key)
        count++
      }
    }

    if (count > 0) {
      this.emit('cache:cleanup', { count })
    }

    return count
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    if (!entry.expiresAt) {
      return false
    }
    return Date.now() > entry.expiresAt
  }

  // ============================================================================
  // STATS
  // ============================================================================

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses
    this.stats.hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0
    this.stats.size = this.cache.size
    this.stats.memoryUsage = this.estimateMemoryUsage()

    return { ...this.stats }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      hitRate: 0,
      size: this.cache.size,
      memoryUsage: this.estimateMemoryUsage(),
    }
  }

  /**
   * Record cache hit
   */
  private recordHit(): void {
    if (this.config.enableStats) {
      this.stats.hits++
    }
  }

  /**
   * Record cache miss
   */
  private recordMiss(): void {
    if (this.config.enableStats) {
      this.stats.misses++
    }
  }

  /**
   * Record cache set
   */
  private recordSet(): void {
    if (this.config.enableStats) {
      this.stats.sets++
    }
  }

  /**
   * Record cache delete
   */
  private recordDelete(): void {
    if (this.config.enableStats) {
      this.stats.deletes++
    }
  }

  /**
   * Estimate memory usage (rough approximation)
   */
  private estimateMemoryUsage(): number {
    let bytes = 0

    for (const entry of this.cache.values()) {
      // Rough estimation
      bytes += JSON.stringify(entry).length * 2 // UTF-16 encoding
    }

    return bytes
  }

  // ============================================================================
  // CACHE WARMING
  // ============================================================================

  /**
   * Warm cache with data
   */
  async warm(entries: Array<{ key: CacheKey; fetcher: () => Promise<any>; options?: CacheOptions }>): Promise<void> {
    const promises = entries.map(async ({ key, fetcher, options }) => {
      try {
        const value = await fetcher()
        this.set(key, value, options)
      } catch (error) {
        console.error(`Failed to warm cache for ${key}:`, error)
      }
    })

    await Promise.all(promises)
    this.emit('cache:warmed', { count: entries.length })
  }

  /**
   * Refresh cache entry
   */
  async refresh<T = any>(key: CacheKey, fetcher: () => Promise<T>, options: CacheOptions = {}): Promise<T> {
    const value = await fetcher()
    this.set(key, value, options)
    return value
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Get cache entry info
   */
  info(key: CacheKey): Omit<CacheEntry, 'value'> | undefined {
    const entry = this.cache.get(key)

    if (!entry) {
      return undefined
    }

    const { value, ...info } = entry
    return info
  }

  /**
   * Export cache data
   */
  export(): Array<[CacheKey, CacheEntry]> {
    return Array.from(this.cache.entries())
  }

  /**
   * Import cache data
   */
  import(entries: Array<[CacheKey, CacheEntry]>): void {
    for (const [key, entry] of entries) {
      this.cache.set(key, entry)

      // Rebuild tag index
      if (entry.tags) {
        for (const tag of entry.tags) {
          if (!this.tags.has(tag)) {
            this.tags.set(tag, new Set())
          }
          this.tags.get(tag)!.add(key)
        }
      }
    }
  }

  /**
   * Destroy cache manager
   */
  destroy(): void {
    this.stopCleanup()
    this.clear()
    this.removeAllListeners()
  }
}

// ============================================================================
// SPECIALIZED CACHE MANAGERS
// ============================================================================

/**
 * Integration-specific cache manager
 */
export class IntegrationCacheManager {
  private cache: CacheManager

  constructor(config?: CacheConfig) {
    this.cache = new CacheManager({
      maxSize: 50000,
      defaultTtl: 300000, // 5 minutes
      ...config,
    })
  }

  /**
   * Cache API response
   */
  cacheApiResponse(instanceId: string, endpoint: string, response: any, ttl?: number): void {
    const key = this.getApiCacheKey(instanceId, endpoint)
    this.cache.set(key, response, { ttl, tags: ['api', instanceId] })
  }

  /**
   * Get cached API response
   */
  getCachedApiResponse<T = any>(instanceId: string, endpoint: string): T | undefined {
    const key = this.getApiCacheKey(instanceId, endpoint)
    return this.cache.get<T>(key)
  }

  /**
   * Cache contact data
   */
  cacheContact(instanceId: string, contactId: string, contact: any, ttl?: number): void {
    const key = this.getContactCacheKey(instanceId, contactId)
    this.cache.set(key, contact, { ttl, tags: ['contact', instanceId] })
  }

  /**
   * Get cached contact
   */
  getCachedContact<T = any>(instanceId: string, contactId: string): T | undefined {
    const key = this.getContactCacheKey(instanceId, contactId)
    return this.cache.get<T>(key)
  }

  /**
   * Cache conversation data
   */
  cacheConversation(instanceId: string, conversationId: string, conversation: any, ttl?: number): void {
    const key = this.getConversationCacheKey(instanceId, conversationId)
    this.cache.set(key, conversation, { ttl, tags: ['conversation', instanceId] })
  }

  /**
   * Get cached conversation
   */
  getCachedConversation<T = any>(instanceId: string, conversationId: string): T | undefined {
    const key = this.getConversationCacheKey(instanceId, conversationId)
    return this.cache.get<T>(key)
  }

  /**
   * Invalidate instance cache
   */
  invalidateInstance(instanceId: string): number {
    return this.cache.deleteByTag(instanceId)
  }

  /**
   * Invalidate all API caches
   */
  invalidateApiCache(): number {
    return this.cache.deleteByTag('api')
  }

  /**
   * Get stats
   */
  getStats(): CacheStats {
    return this.cache.getStats()
  }

  private getApiCacheKey(instanceId: string, endpoint: string): string {
    return `api:${instanceId}:${endpoint}`
  }

  private getContactCacheKey(instanceId: string, contactId: string): string {
    return `contact:${instanceId}:${contactId}`
  }

  private getConversationCacheKey(instanceId: string, conversationId: string): string {
    return `conversation:${instanceId}:${conversationId}`
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default CacheManager
