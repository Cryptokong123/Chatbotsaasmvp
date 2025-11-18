/**
 * Integration Registry System
 *
 * Centralized registry for managing all integration adapters with:
 * - Adapter registration and discovery
 * - Connection status tracking
 * - Health monitoring
 * - Metadata and capabilities management
 * - Lifecycle management (initialize, connect, disconnect)
 * - Multi-tenant support
 * - Event emission for integration events
 */

import { EventEmitter } from 'events'
import {
  IntegrationType,
  IntegrationCategory,
  IntegrationConfig,
  IntegrationCapabilities,
  IntegrationResponse,
  IntegrationEvent,
  IntegrationEventType,
} from './types'
import { BaseIntegrationAdapter } from './base-adapter'

// ============================================================================
// REGISTRY TYPES
// ============================================================================

export interface IntegrationMetadata {
  type: IntegrationType
  category: IntegrationCategory
  name: string
  displayName: string
  description: string
  version: string
  iconUrl?: string
  documentationUrl?: string
  setupGuideUrl?: string

  // Capabilities
  capabilities: IntegrationCapabilities

  // Features
  features: {
    supportsWebhooks: boolean
    supportsOAuth: boolean
    supportsApiKey: boolean
    supportsBasicAuth: boolean
    supportsBatch: boolean
    supportsStreaming: boolean
    supportsFileUpload: boolean
    supportsRichMedia: boolean
    supportsTemplates: boolean
    supportsScheduling: boolean
  }

  // Requirements
  requirements: {
    requiredCredentials: string[]
    optionalCredentials?: string[]
    requiredScopes?: string[]
    minimumApiVersion?: string
  }

  // Limits
  limits?: {
    maxRequestsPerSecond?: number
    maxRequestsPerMinute?: number
    maxRequestsPerHour?: number
    maxRequestsPerDay?: number
    maxMessageLength?: number
    maxFileSize?: number
    maxBatchSize?: number
  }

  // OAuth Configuration (if supported)
  oauth?: {
    authorizationUrl?: string
    tokenUrl?: string
    revokeUrl?: string
    defaultScopes?: string[]
    scopesDescription?: Record<string, string>
  }

  // Webhook Configuration (if supported)
  webhook?: {
    supportedEvents: string[]
    requiresSignatureVerification: boolean
    signatureHeader?: string
  }

  // Additional metadata
  tags?: string[]
  popularity?: number
  isVerified?: boolean
  isBeta?: boolean
  isDeprecated?: boolean
  deprecationMessage?: string
  migrationGuide?: string
}

export interface RegisteredIntegration {
  metadata: IntegrationMetadata
  adapterClass: new (config: IntegrationConfig) => BaseIntegrationAdapter
  instances: Map<string, IntegrationInstance>
}

export interface IntegrationInstance {
  id: string
  tenantId: string
  adapter: BaseIntegrationAdapter
  config: IntegrationConfig
  status: 'initializing' | 'connected' | 'disconnected' | 'error' | 'reconnecting'
  health: {
    isHealthy: boolean
    lastCheck: Date
    latency?: number
    circuitBreakerState?: string
    consecutiveFailures: number
    lastError?: string
  }
  metrics: {
    requestsTotal: number
    requestsSuccessful: number
    requestsFailed: number
    averageLatency: number
    successRate: number
    lastRequest?: Date
  }
  createdAt: Date
  connectedAt?: Date
  lastActivityAt?: Date
}

export interface RegistryConfig {
  enableHealthChecks?: boolean
  healthCheckInterval?: number // ms
  enableMetrics?: boolean
  metricsInterval?: number // ms
  enableAutoReconnect?: boolean
  autoReconnectDelay?: number // ms
  maxReconnectAttempts?: number
  enableEventEmission?: boolean
}

export interface QueryOptions {
  category?: IntegrationCategory
  categories?: IntegrationCategory[]
  capabilities?: Partial<IntegrationCapabilities>
  features?: Partial<IntegrationMetadata['features']>
  tags?: string[]
  isVerified?: boolean
  isBeta?: boolean
  excludeDeprecated?: boolean
  search?: string
  limit?: number
  offset?: number
  sortBy?: 'name' | 'popularity' | 'category'
  sortOrder?: 'asc' | 'desc'
}

export interface HealthCheckResult {
  instanceId: string
  tenantId: string
  integrationType: IntegrationType
  status: IntegrationInstance['status']
  health: IntegrationInstance['health']
  metrics: IntegrationInstance['metrics']
  timestamp: Date
}

// ============================================================================
// INTEGRATION REGISTRY
// ============================================================================

export class IntegrationRegistry extends EventEmitter {
  private static instance: IntegrationRegistry

  private registeredIntegrations: Map<IntegrationType, RegisteredIntegration> = new Map()
  private config: RegistryConfig
  private healthCheckTimer?: NodeJS.Timeout
  private metricsTimer?: NodeJS.Timeout

  private constructor(config: RegistryConfig = {}) {
    super()
    this.config = {
      enableHealthChecks: config.enableHealthChecks ?? true,
      healthCheckInterval: config.healthCheckInterval ?? 60000, // 1 minute
      enableMetrics: config.enableMetrics ?? true,
      metricsInterval: config.metricsInterval ?? 30000, // 30 seconds
      enableAutoReconnect: config.enableAutoReconnect ?? true,
      autoReconnectDelay: config.autoReconnectDelay ?? 5000, // 5 seconds
      maxReconnectAttempts: config.maxReconnectAttempts ?? 3,
      enableEventEmission: config.enableEventEmission ?? true,
    }

    this.startBackgroundTasks()
  }

  // Singleton pattern
  static getInstance(config?: RegistryConfig): IntegrationRegistry {
    if (!IntegrationRegistry.instance) {
      IntegrationRegistry.instance = new IntegrationRegistry(config)
    }
    return IntegrationRegistry.instance
  }

  // ============================================================================
  // REGISTRATION
  // ============================================================================

  /**
   * Register an integration adapter
   */
  register(
    metadata: IntegrationMetadata,
    adapterClass: new (config: IntegrationConfig) => BaseIntegrationAdapter
  ): void {
    // Skip if already registered (idempotent operation for build-time safety)
    if (this.registeredIntegrations.has(metadata.type)) {
      return
    }

    this.registeredIntegrations.set(metadata.type, {
      metadata,
      adapterClass,
      instances: new Map(),
    })

    this.emit('integration:registered', metadata)
    console.log(`✓ Registered integration: ${metadata.displayName} (${metadata.type})`)
  }

  /**
   * Unregister an integration adapter
   */
  async unregister(integrationType: IntegrationType): Promise<void> {
    const registration = this.registeredIntegrations.get(integrationType)
    if (!registration) {
      throw new Error(`Integration ${integrationType} is not registered`)
    }

    // Disconnect all instances
    for (const [instanceId, instance] of registration.instances.entries()) {
      await this.disconnectInstance(instanceId)
    }

    this.registeredIntegrations.delete(integrationType)
    this.emit('integration:unregistered', integrationType)
    console.log(`✓ Unregistered integration: ${integrationType}`)
  }

  /**
   * Check if an integration is registered
   */
  isRegistered(integrationType: IntegrationType): boolean {
    return this.registeredIntegrations.has(integrationType)
  }

  // ============================================================================
  // INSTANCE MANAGEMENT
  // ============================================================================

  /**
   * Create and connect an integration instance
   */
  async createInstance(
    tenantId: string,
    integrationType: IntegrationType,
    config: IntegrationConfig
  ): Promise<IntegrationInstance> {
    const registration = this.registeredIntegrations.get(integrationType)
    if (!registration) {
      throw new Error(`Integration ${integrationType} is not registered`)
    }

    // Generate unique instance ID
    const instanceId = `${tenantId}-${integrationType}-${Date.now()}`

    // Create adapter instance
    const adapter = new registration.adapterClass(config)

    // Create instance record
    const instance: IntegrationInstance = {
      id: instanceId,
      tenantId,
      adapter,
      config,
      status: 'initializing',
      health: {
        isHealthy: false,
        lastCheck: new Date(),
        consecutiveFailures: 0,
      },
      metrics: {
        requestsTotal: 0,
        requestsSuccessful: 0,
        requestsFailed: 0,
        averageLatency: 0,
        successRate: 0,
      },
      createdAt: new Date(),
    }

    // Store instance
    registration.instances.set(instanceId, instance)

    // Attempt to connect
    try {
      const result = await adapter.connect()
      if (result.success) {
        instance.status = 'connected'
        instance.connectedAt = new Date()
        instance.lastActivityAt = new Date()
        instance.health.isHealthy = true
        instance.health.consecutiveFailures = 0

        this.emitEvent('connection.established', integrationType, {
          instanceId,
          tenantId,
        })
      } else {
        instance.status = 'error'
        instance.health.isHealthy = false
        instance.health.lastError = result.error?.message

        this.emitEvent('error.occurred', integrationType, {
          instanceId,
          tenantId,
          error: result.error,
        })
      }
    } catch (error: any) {
      instance.status = 'error'
      instance.health.isHealthy = false
      instance.health.lastError = error.message

      this.emitEvent('error.occurred', integrationType, {
        instanceId,
        tenantId,
        error: error.message,
      })
    }

    return instance
  }

  /**
   * Get an integration instance
   */
  getInstance(instanceId: string): IntegrationInstance | undefined {
    for (const registration of this.registeredIntegrations.values()) {
      const instance = registration.instances.get(instanceId)
      if (instance) {
        return instance
      }
    }
    return undefined
  }

  /**
   * Get all instances for a tenant
   */
  getTenantInstances(tenantId: string): IntegrationInstance[] {
    const instances: IntegrationInstance[] = []

    for (const registration of this.registeredIntegrations.values()) {
      for (const instance of registration.instances.values()) {
        if (instance.tenantId === tenantId) {
          instances.push(instance)
        }
      }
    }

    return instances
  }

  /**
   * Get all instances of a specific integration type
   */
  getTypeInstances(integrationType: IntegrationType): IntegrationInstance[] {
    const registration = this.registeredIntegrations.get(integrationType)
    if (!registration) {
      return []
    }

    return Array.from(registration.instances.values())
  }

  /**
   * Get tenant instance of specific type
   */
  getTenantInstance(
    tenantId: string,
    integrationType: IntegrationType
  ): IntegrationInstance | undefined {
    const registration = this.registeredIntegrations.get(integrationType)
    if (!registration) {
      return undefined
    }

    for (const instance of registration.instances.values()) {
      if (instance.tenantId === tenantId) {
        return instance
      }
    }

    return undefined
  }

  /**
   * Disconnect an integration instance
   */
  async disconnectInstance(instanceId: string): Promise<void> {
    const instance = this.getInstance(instanceId)
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`)
    }

    try {
      await instance.adapter.disconnect()
      instance.status = 'disconnected'
      instance.health.isHealthy = false

      this.emitEvent('connection.lost', instance.config.type, {
        instanceId,
        tenantId: instance.tenantId,
      })
    } catch (error: any) {
      throw new Error(`Failed to disconnect instance ${instanceId}: ${error.message}`)
    }
  }

  /**
   * Remove an integration instance
   */
  async removeInstance(instanceId: string): Promise<void> {
    const instance = this.getInstance(instanceId)
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`)
    }

    // Disconnect first if connected
    if (instance.status === 'connected') {
      await this.disconnectInstance(instanceId)
    }

    // Remove from registry
    const registration = this.registeredIntegrations.get(instance.config.type)
    if (registration) {
      registration.instances.delete(instanceId)
    }
  }

  /**
   * Reconnect an integration instance
   */
  async reconnectInstance(instanceId: string): Promise<void> {
    const instance = this.getInstance(instanceId)
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`)
    }

    instance.status = 'reconnecting'

    try {
      const result = await instance.adapter.connect()
      if (result.success) {
        instance.status = 'connected'
        instance.connectedAt = new Date()
        instance.lastActivityAt = new Date()
        instance.health.isHealthy = true
        instance.health.consecutiveFailures = 0
        instance.health.lastError = undefined

        this.emitEvent('connection.established', instance.config.type, {
          instanceId,
          tenantId: instance.tenantId,
        })
      } else {
        instance.status = 'error'
        instance.health.isHealthy = false
        instance.health.lastError = result.error?.message
        instance.health.consecutiveFailures++

        // Auto-reconnect if enabled
        if (
          this.config.enableAutoReconnect &&
          instance.health.consecutiveFailures < (this.config.maxReconnectAttempts || 3)
        ) {
          setTimeout(() => {
            this.reconnectInstance(instanceId).catch(console.error)
          }, this.config.autoReconnectDelay || 5000)
        }
      }
    } catch (error: any) {
      instance.status = 'error'
      instance.health.isHealthy = false
      instance.health.lastError = error.message
      instance.health.consecutiveFailures++
    }
  }

  // ============================================================================
  // QUERY & DISCOVERY
  // ============================================================================

  /**
   * Get integration metadata
   */
  getMetadata(integrationType: IntegrationType): IntegrationMetadata | undefined {
    const registration = this.registeredIntegrations.get(integrationType)
    return registration?.metadata
  }

  /**
   * List all registered integrations
   */
  listIntegrations(): IntegrationMetadata[] {
    return Array.from(this.registeredIntegrations.values()).map(reg => reg.metadata)
  }

  /**
   * Query integrations with filters
   */
  queryIntegrations(options: QueryOptions = {}): IntegrationMetadata[] {
    let results = this.listIntegrations()

    // Filter by category
    if (options.category) {
      results = results.filter(meta => meta.category === options.category)
    }

    // Filter by categories
    if (options.categories && options.categories.length > 0) {
      results = results.filter(meta => options.categories!.includes(meta.category))
    }

    // Filter by capabilities
    if (options.capabilities) {
      results = results.filter(meta => {
        return Object.entries(options.capabilities!).every(([key, value]) => {
          return meta.capabilities[key as keyof IntegrationCapabilities] === value
        })
      })
    }

    // Filter by features
    if (options.features) {
      results = results.filter(meta => {
        return Object.entries(options.features!).every(([key, value]) => {
          return meta.features[key as keyof IntegrationMetadata['features']] === value
        })
      })
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      results = results.filter(meta => {
        return options.tags!.some(tag => meta.tags?.includes(tag))
      })
    }

    // Filter by verified status
    if (options.isVerified !== undefined) {
      results = results.filter(meta => meta.isVerified === options.isVerified)
    }

    // Filter by beta status
    if (options.isBeta !== undefined) {
      results = results.filter(meta => meta.isBeta === options.isBeta)
    }

    // Exclude deprecated
    if (options.excludeDeprecated) {
      results = results.filter(meta => !meta.isDeprecated)
    }

    // Search by name/description
    if (options.search) {
      const searchLower = options.search.toLowerCase()
      results = results.filter(meta => {
        return (
          meta.name.toLowerCase().includes(searchLower) ||
          meta.displayName.toLowerCase().includes(searchLower) ||
          meta.description.toLowerCase().includes(searchLower)
        )
      })
    }

    // Sort
    if (options.sortBy) {
      results.sort((a, b) => {
        let aVal: any
        let bVal: any

        switch (options.sortBy) {
          case 'name':
            aVal = a.displayName
            bVal = b.displayName
            break
          case 'popularity':
            aVal = a.popularity || 0
            bVal = b.popularity || 0
            break
          case 'category':
            aVal = a.category
            bVal = b.category
            break
          default:
            return 0
        }

        const order = options.sortOrder === 'desc' ? -1 : 1
        return aVal < bVal ? -order : aVal > bVal ? order : 0
      })
    }

    // Pagination
    if (options.offset !== undefined || options.limit !== undefined) {
      const offset = options.offset || 0
      const limit = options.limit || results.length
      results = results.slice(offset, offset + limit)
    }

    return results
  }

  /**
   * Get integrations by category
   */
  getByCategory(category: IntegrationCategory): IntegrationMetadata[] {
    return this.queryIntegrations({ category })
  }

  /**
   * Search integrations
   */
  search(query: string): IntegrationMetadata[] {
    return this.queryIntegrations({ search: query })
  }

  // ============================================================================
  // HEALTH & MONITORING
  // ============================================================================

  /**
   * Perform health check on an instance
   */
  async healthCheckInstance(instanceId: string): Promise<HealthCheckResult> {
    const instance = this.getInstance(instanceId)
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`)
    }

    const startTime = Date.now()

    try {
      const healthResult = await instance.adapter.healthCheck()
      const latency = Date.now() - startTime

      instance.health.lastCheck = new Date()
      instance.health.latency = latency

      if (healthResult.success && healthResult.data) {
        instance.health.isHealthy = healthResult.data.healthy
        instance.health.circuitBreakerState = healthResult.data.circuitBreakerState

        if (healthResult.data.healthy) {
          instance.health.consecutiveFailures = 0
        } else {
          instance.health.consecutiveFailures++
        }
      } else {
        instance.health.isHealthy = false
        instance.health.consecutiveFailures++
        instance.health.lastError = healthResult.error?.message
      }

      // Update metrics
      const adapterMetrics = instance.adapter.getMetrics()
      instance.metrics = {
        requestsTotal: adapterMetrics.requestsTotal,
        requestsSuccessful: adapterMetrics.requestsSuccessful,
        requestsFailed: adapterMetrics.requestsFailed,
        averageLatency: adapterMetrics.averageLatency,
        successRate: adapterMetrics.successRate,
        lastRequest: adapterMetrics.lastRequest,
      }

      return {
        instanceId: instance.id,
        tenantId: instance.tenantId,
        integrationType: instance.config.type,
        status: instance.status,
        health: instance.health,
        metrics: instance.metrics,
        timestamp: new Date(),
      }
    } catch (error: any) {
      instance.health.isHealthy = false
      instance.health.consecutiveFailures++
      instance.health.lastError = error.message
      instance.health.lastCheck = new Date()

      return {
        instanceId: instance.id,
        tenantId: instance.tenantId,
        integrationType: instance.config.type,
        status: instance.status,
        health: instance.health,
        metrics: instance.metrics,
        timestamp: new Date(),
      }
    }
  }

  /**
   * Perform health check on all instances
   */
  async healthCheckAll(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = []

    for (const registration of this.registeredIntegrations.values()) {
      for (const instanceId of registration.instances.keys()) {
        try {
          const result = await this.healthCheckInstance(instanceId)
          results.push(result)
        } catch (error) {
          console.error(`Health check failed for instance ${instanceId}:`, error)
        }
      }
    }

    return results
  }

  /**
   * Get health status summary
   */
  getHealthSummary(): {
    total: number
    healthy: number
    unhealthy: number
    disconnected: number
    error: number
    byType: Record<IntegrationType, { total: number; healthy: number }>
  } {
    const summary = {
      total: 0,
      healthy: 0,
      unhealthy: 0,
      disconnected: 0,
      error: 0,
      byType: {} as Record<IntegrationType, { total: number; healthy: number }>,
    }

    for (const registration of this.registeredIntegrations.values()) {
      const typeStats = { total: 0, healthy: 0 }

      for (const instance of registration.instances.values()) {
        summary.total++
        typeStats.total++

        if (instance.health.isHealthy) {
          summary.healthy++
          typeStats.healthy++
        } else {
          summary.unhealthy++
        }

        if (instance.status === 'disconnected') {
          summary.disconnected++
        } else if (instance.status === 'error') {
          summary.error++
        }
      }

      if (typeStats.total > 0) {
        summary.byType[registration.metadata.type] = typeStats
      }
    }

    return summary
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary(): {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    averageLatency: number
    overallSuccessRate: number
    byType: Record<
      IntegrationType,
      {
        requests: number
        successful: number
        failed: number
        avgLatency: number
        successRate: number
      }
    >
  } {
    const summary = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      overallSuccessRate: 0,
      byType: {} as Record<
        IntegrationType,
        {
          requests: number
          successful: number
          failed: number
          avgLatency: number
          successRate: number
        }
      >,
    }

    let totalLatency = 0
    let instanceCount = 0

    for (const registration of this.registeredIntegrations.values()) {
      const typeStats = {
        requests: 0,
        successful: 0,
        failed: 0,
        avgLatency: 0,
        successRate: 0,
      }

      let typeLatencySum = 0
      let typeInstanceCount = 0

      for (const instance of registration.instances.values()) {
        summary.totalRequests += instance.metrics.requestsTotal
        summary.successfulRequests += instance.metrics.requestsSuccessful
        summary.failedRequests += instance.metrics.requestsFailed

        typeStats.requests += instance.metrics.requestsTotal
        typeStats.successful += instance.metrics.requestsSuccessful
        typeStats.failed += instance.metrics.requestsFailed

        if (instance.metrics.averageLatency > 0) {
          totalLatency += instance.metrics.averageLatency
          typeLatencySum += instance.metrics.averageLatency
          instanceCount++
          typeInstanceCount++
        }
      }

      if (typeInstanceCount > 0) {
        typeStats.avgLatency = typeLatencySum / typeInstanceCount
      }

      if (typeStats.requests > 0) {
        typeStats.successRate = (typeStats.successful / typeStats.requests) * 100
      }

      if (typeStats.requests > 0) {
        summary.byType[registration.metadata.type] = typeStats
      }
    }

    if (instanceCount > 0) {
      summary.averageLatency = totalLatency / instanceCount
    }

    if (summary.totalRequests > 0) {
      summary.overallSuccessRate = (summary.successfulRequests / summary.totalRequests) * 100
    }

    return summary
  }

  // ============================================================================
  // BACKGROUND TASKS
  // ============================================================================

  private startBackgroundTasks(): void {
    // Health check task
    if (this.config.enableHealthChecks) {
      this.healthCheckTimer = setInterval(() => {
        this.healthCheckAll().catch(error => {
          console.error('Background health check failed:', error)
        })
      }, this.config.healthCheckInterval)
    }

    // Metrics collection task
    if (this.config.enableMetrics) {
      this.metricsTimer = setInterval(() => {
        this.collectMetrics()
      }, this.config.metricsInterval)
    }
  }

  private collectMetrics(): void {
    const summary = this.getMetricsSummary()
    this.emit('metrics:collected', summary)
  }

  /**
   * Stop background tasks
   */
  stop(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer)
      this.healthCheckTimer = undefined
    }

    if (this.metricsTimer) {
      clearInterval(this.metricsTimer)
      this.metricsTimer = undefined
    }
  }

  // ============================================================================
  // EVENTS
  // ============================================================================

  private emitEvent(
    type: IntegrationEventType,
    integration: IntegrationType,
    data: any
  ): void {
    if (!this.config.enableEventEmission) {
      return
    }

    const event: IntegrationEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      integration,
      timestamp: new Date(),
      data,
    }

    this.emit('integration:event', event)
    this.emit(`integration:${type}`, event)
  }

  // ============================================================================
  // UTILITY
  // ============================================================================

  /**
   * Get registry statistics
   */
  getStats(): {
    registeredIntegrations: number
    totalInstances: number
    activeInstances: number
    healthSummary: ReturnType<typeof this.getHealthSummary>
    metricsSummary: ReturnType<typeof this.getMetricsSummary>
  } {
    let totalInstances = 0
    let activeInstances = 0

    for (const registration of this.registeredIntegrations.values()) {
      totalInstances += registration.instances.size
      for (const instance of registration.instances.values()) {
        if (instance.status === 'connected') {
          activeInstances++
        }
      }
    }

    return {
      registeredIntegrations: this.registeredIntegrations.size,
      totalInstances,
      activeInstances,
      healthSummary: this.getHealthSummary(),
      metricsSummary: this.getMetricsSummary(),
    }
  }

  /**
   * Export registry state
   */
  exportState(): {
    config: RegistryConfig
    registeredIntegrations: Array<{
      type: IntegrationType
      metadata: IntegrationMetadata
      instanceCount: number
    }>
    instances: Array<{
      id: string
      tenantId: string
      type: IntegrationType
      status: IntegrationInstance['status']
      health: IntegrationInstance['health']
      metrics: IntegrationInstance['metrics']
      createdAt: Date
      connectedAt?: Date
    }>
  } {
    const registeredIntegrations = Array.from(this.registeredIntegrations.values()).map(
      reg => ({
        type: reg.metadata.type,
        metadata: reg.metadata,
        instanceCount: reg.instances.size,
      })
    )

    const instances: any[] = []
    for (const registration of this.registeredIntegrations.values()) {
      for (const instance of registration.instances.values()) {
        instances.push({
          id: instance.id,
          tenantId: instance.tenantId,
          type: instance.config.type,
          status: instance.status,
          health: instance.health,
          metrics: instance.metrics,
          createdAt: instance.createdAt,
          connectedAt: instance.connectedAt,
        })
      }
    }

    return {
      config: this.config,
      registeredIntegrations,
      instances,
    }
  }

  /**
   * Reset registry (for testing)
   */
  async reset(): Promise<void> {
    // Disconnect all instances
    for (const registration of this.registeredIntegrations.values()) {
      for (const instanceId of registration.instances.keys()) {
        await this.disconnectInstance(instanceId)
      }
    }

    // Clear registry
    this.registeredIntegrations.clear()

    // Stop background tasks
    this.stop()

    this.emit('registry:reset')
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default IntegrationRegistry
