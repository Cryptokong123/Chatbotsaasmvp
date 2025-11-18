/**
 * Analytics & Monitoring System
 *
 * Metrics collection, performance tracking, health monitoring, dashboards
 */

import { EventEmitter } from 'events'
import { createClient } from '@supabase/supabase-js'

// ============================================================================
// TYPES
// ============================================================================

export interface Metric {
  id: string
  tenantId?: string
  instanceId?: string
  integrationType?: string
  name: string
  value: number
  unit?: string
  type: 'counter' | 'gauge' | 'histogram' | 'summary'
  tags: Record<string, string>
  timestamp: Date
  createdAt: Date
}

export interface MetricQuery {
  tenantId?: string
  instanceId?: string
  integrationType?: string
  name?: string | string[]
  startDate?: Date
  endDate?: Date
  tags?: Record<string, string>
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count'
  interval?: 'minute' | 'hour' | 'day' | 'week' | 'month'
  limit?: number
}

export interface HealthCheck {
  instanceId: string
  integrationType: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  latency: number
  lastCheck: Date
  consecutiveFailures: number
  details?: Record<string, any>
  errors?: string[]
}

export interface PerformanceMetrics {
  instanceId: string
  integrationType: string
  metrics: {
    requestRate: number // requests per second
    errorRate: number // errors per second
    averageLatency: number // milliseconds
    p50Latency: number
    p95Latency: number
    p99Latency: number
    uptime: number // percentage
    successRate: number // percentage
  }
  period: {
    start: Date
    end: Date
  }
}

export interface UsageStats {
  tenantId: string
  period: {
    start: Date
    end: Date
  }
  integrations: {
    total: number
    active: number
    connected: number
    disconnected: number
    byType: Record<string, number>
  }
  messages: {
    total: number
    sent: number
    received: number
    failed: number
    byIntegration: Record<string, number>
  }
  sync: {
    totalOperations: number
    contacts: number
    conversations: number
    messages: number
    errors: number
  }
  api: {
    totalRequests: number
    successRate: number
    errorRate: number
    averageLatency: number
  }
}

export interface Alert {
  id: string
  tenantId: string
  instanceId?: string
  name: string
  condition: string
  severity: 'info' | 'warning' | 'critical'
  status: 'active' | 'resolved' | 'acknowledged'
  message: string
  details?: Record<string, any>
  triggeredAt: Date
  resolvedAt?: Date
  acknowledgedAt?: Date
  acknowledgedBy?: string
  createdAt: Date
}

// ============================================================================
// ANALYTICS MANAGER
// ============================================================================

export class AnalyticsManager extends EventEmitter {
  private supabase: ReturnType<typeof createClient>
  private metricsBuffer: Metric[] = []
  private bufferSize = 1000
  private flushInterval = 10000 // 10 seconds
  private flushTimer?: NodeJS.Timeout

  constructor(supabaseUrl: string, supabaseKey: string) {
    super()
    this.supabase = createClient(supabaseUrl, supabaseKey)
    this.startAutoFlush()
  }

  // ============================================================================
  // METRICS COLLECTION
  // ============================================================================

  /**
   * Record metric
   */
  recordMetric(
    name: string,
    value: number,
    options: {
      tenantId?: string
      instanceId?: string
      integrationType?: string
      unit?: string
      type?: Metric['type']
      tags?: Record<string, string>
      timestamp?: Date
    } = {}
  ): void {
    const metric: Metric = {
      id: this.generateId(),
      tenantId: options.tenantId,
      instanceId: options.instanceId,
      integrationType: options.integrationType,
      name,
      value,
      unit: options.unit,
      type: options.type || 'gauge',
      tags: options.tags || {},
      timestamp: options.timestamp || new Date(),
      createdAt: new Date(),
    }

    this.metricsBuffer.push(metric)

    this.emit('metric:recorded', metric)

    if (this.metricsBuffer.length >= this.bufferSize) {
      this.flush().catch(console.error)
    }
  }

  /**
   * Increment counter
   */
  increment(
    name: string,
    delta: number = 1,
    options?: Parameters<typeof this.recordMetric>[2]
  ): void {
    this.recordMetric(name, delta, {
      ...options,
      type: 'counter',
    })
  }

  /**
   * Record gauge value
   */
  gauge(
    name: string,
    value: number,
    options?: Parameters<typeof this.recordMetric>[2]
  ): void {
    this.recordMetric(name, value, {
      ...options,
      type: 'gauge',
    })
  }

  /**
   * Record histogram value (for latency, sizes, etc.)
   */
  histogram(
    name: string,
    value: number,
    options?: Parameters<typeof this.recordMetric>[2]
  ): void {
    this.recordMetric(name, value, {
      ...options,
      type: 'histogram',
    })
  }

  /**
   * Record timing
   */
  timing(
    name: string,
    durationMs: number,
    options?: Parameters<typeof this.recordMetric>[2]
  ): void {
    this.histogram(name, durationMs, {
      ...options,
      unit: 'ms',
    })
  }

  /**
   * Time a function execution
   */
  async time<T>(
    name: string,
    fn: () => Promise<T>,
    options?: Parameters<typeof this.recordMetric>[2]
  ): Promise<T> {
    const start = Date.now()
    try {
      const result = await fn()
      const duration = Date.now() - start
      this.timing(name, duration, options)
      return result
    } catch (error) {
      const duration = Date.now() - start
      this.timing(name, duration, {
        ...options,
        tags: { ...options?.tags, error: 'true' },
      })
      throw error
    }
  }

  /**
   * Query metrics
   */
  async queryMetrics(query: MetricQuery): Promise<Metric[]> {
    let dbQuery = this.supabase.from('integration_metrics').select('*')

    if (query.tenantId) dbQuery = dbQuery.eq('tenant_id', query.tenantId)
    if (query.instanceId) dbQuery = dbQuery.eq('instance_id', query.instanceId)
    if (query.integrationType) dbQuery = dbQuery.eq('integration_type', query.integrationType)

    if (query.name) {
      if (Array.isArray(query.name)) {
        dbQuery = dbQuery.in('name', query.name)
      } else {
        dbQuery = dbQuery.eq('name', query.name)
      }
    }

    if (query.startDate) dbQuery = dbQuery.gte('timestamp', query.startDate.toISOString())
    if (query.endDate) dbQuery = dbQuery.lte('timestamp', query.endDate.toISOString())

    if (query.tags) {
      for (const [key, value] of Object.entries(query.tags)) {
        dbQuery = dbQuery.contains('tags', { [key]: value })
      }
    }

    dbQuery = dbQuery.order('timestamp', { ascending: false })

    if (query.limit) dbQuery = dbQuery.limit(query.limit)

    const { data, error } = await dbQuery

    if (error) throw error

    return data as Metric[]
  }

  /**
   * Get aggregated metrics
   */
  async getAggregatedMetrics(
    query: MetricQuery
  ): Promise<Array<{ timestamp: Date; value: number }>> {
    const metrics = await this.queryMetrics(query)

    if (!query.interval || !query.aggregation) {
      return metrics.map(m => ({ timestamp: m.timestamp, value: m.value }))
    }

    // Group by interval
    const grouped = new Map<string, number[]>()

    for (const metric of metrics) {
      const key = this.getIntervalKey(metric.timestamp, query.interval)
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(metric.value)
    }

    // Aggregate
    const result: Array<{ timestamp: Date; value: number }> = []

    for (const [key, values] of grouped.entries()) {
      let aggregated = 0

      switch (query.aggregation) {
        case 'sum':
          aggregated = values.reduce((sum, v) => sum + v, 0)
          break
        case 'avg':
          aggregated = values.reduce((sum, v) => sum + v, 0) / values.length
          break
        case 'min':
          aggregated = Math.min(...values)
          break
        case 'max':
          aggregated = Math.max(...values)
          break
        case 'count':
          aggregated = values.length
          break
      }

      result.push({
        timestamp: new Date(key),
        value: aggregated,
      })
    }

    return result.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  // ============================================================================
  // HEALTH MONITORING
  // ============================================================================

  /**
   * Perform health check
   */
  async healthCheck(instanceId: string, integrationType: string): Promise<HealthCheck> {
    const start = Date.now()
    const errors: string[] = []

    try {
      // Check instance exists and is connected
      const { data: instance, error } = await this.supabase
        .from('integration_instances')
        .select('status, last_error, consecutive_failures')
        .eq('id', instanceId)
        .single()

      if (error) {
        errors.push(error.message)
      }

      const latency = Date.now() - start

      let status: HealthCheck['status'] = 'unhealthy'
      if (instance && (instance as any).status === 'connected') {
        if ((instance as any).consecutive_failures === 0) {
          status = 'healthy'
        } else if ((instance as any).consecutive_failures < 3) {
          status = 'degraded'
        }
      }

      const healthCheck: HealthCheck = {
        instanceId,
        integrationType,
        status,
        latency,
        lastCheck: new Date(),
        consecutiveFailures: (instance as any)?.consecutive_failures || 0,
        details: {
          instanceStatus: (instance as any)?.status,
          lastError: (instance as any)?.last_error,
        },
        errors: errors.length > 0 ? errors : undefined,
      }

      // Record health metrics
      this.gauge('integration.health.status', status === 'healthy' ? 1 : 0, {
        instanceId,
        integrationType,
        tags: { status },
      })

      this.histogram('integration.health.latency', latency, {
        instanceId,
        integrationType,
      })

      this.emit('health:checked', healthCheck)

      return healthCheck
    } catch (error: any) {
      errors.push(error.message)

      return {
        instanceId,
        integrationType,
        status: 'unhealthy',
        latency: Date.now() - start,
        lastCheck: new Date(),
        consecutiveFailures: -1,
        errors,
      }
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(
    instanceId: string,
    integrationType: string,
    period: { start: Date; end: Date }
  ): Promise<PerformanceMetrics> {
    // Query metrics for the period
    const [
      requestMetrics,
      errorMetrics,
      latencyMetrics,
    ] = await Promise.all([
      this.queryMetrics({
        instanceId,
        name: 'integration.requests',
        startDate: period.start,
        endDate: period.end,
      }),
      this.queryMetrics({
        instanceId,
        name: 'integration.errors',
        startDate: period.start,
        endDate: period.end,
      }),
      this.queryMetrics({
        instanceId,
        name: 'integration.latency',
        startDate: period.start,
        endDate: period.end,
      }),
    ])

    const durationMs = period.end.getTime() - period.start.getTime()
    const durationSec = durationMs / 1000

    // Calculate metrics
    const totalRequests = requestMetrics.reduce((sum, m) => sum + m.value, 0)
    const totalErrors = errorMetrics.reduce((sum, m) => sum + m.value, 0)

    const requestRate = totalRequests / durationSec
    const errorRate = totalErrors / durationSec
    const successRate = totalRequests > 0 ? ((totalRequests - totalErrors) / totalRequests) * 100 : 100

    // Calculate latency percentiles
    const latencies = latencyMetrics.map(m => m.value).sort((a, b) => a - b)
    const p50Index = Math.floor(latencies.length * 0.5)
    const p95Index = Math.floor(latencies.length * 0.95)
    const p99Index = Math.floor(latencies.length * 0.99)

    const averageLatency = latencies.length > 0
      ? latencies.reduce((sum, l) => sum + l, 0) / latencies.length
      : 0

    const uptime = successRate // Simplified uptime calculation

    return {
      instanceId,
      integrationType,
      metrics: {
        requestRate,
        errorRate,
        averageLatency,
        p50Latency: latencies[p50Index] || 0,
        p95Latency: latencies[p95Index] || 0,
        p99Latency: latencies[p99Index] || 0,
        uptime,
        successRate,
      },
      period,
    }
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(
    tenantId: string,
    period: { start: Date; end: Date }
  ): Promise<UsageStats> {
    // Get integration stats
    const { data: instances } = await this.supabase
      .from('integration_instances')
      .select('*')
      .eq('tenant_id', tenantId)

    const integrationsByType: Record<string, number> = {}
    for (const instance of instances || []) {
      integrationsByType[instance.integration_type] =
        (integrationsByType[instance.integration_type] || 0) + 1
    }

    // Get message stats
    const { data: messages } = await this.supabase
      .from('integration_messages')
      .select('direction, status, instance_id')
      .in('instance_id', (instances || []).map(i => i.id))
      .gte('created_at', period.start.toISOString())
      .lte('created_at', period.end.toISOString())

    const messagesByIntegration: Record<string, number> = {}
    let sentMessages = 0
    let receivedMessages = 0
    let failedMessages = 0

    for (const message of (messages as any) || []) {
      const instance = (instances as any)?.find((i: any) => i.id === (message as any).instance_id)
      if (instance) {
        messagesByIntegration[(instance as any).integration_type] =
          (messagesByIntegration[(instance as any).integration_type] || 0) + 1
      }

      if ((message as any).direction === 'outbound') sentMessages++
      if ((message as any).direction === 'inbound') receivedMessages++
      if ((message as any).status === 'failed') failedMessages++
    }

    // Get sync stats
    const syncMetrics = await this.queryMetrics({
      tenantId,
      name: ['sync.contacts', 'sync.conversations', 'sync.messages', 'sync.errors'],
      startDate: period.start,
      endDate: period.end,
    })

    const syncStats = {
      contacts: syncMetrics.filter(m => m.name === 'sync.contacts').reduce((sum, m) => sum + m.value, 0),
      conversations: syncMetrics.filter(m => m.name === 'sync.conversations').reduce((sum, m) => sum + m.value, 0),
      messages: syncMetrics.filter(m => m.name === 'sync.messages').reduce((sum, m) => sum + m.value, 0),
      errors: syncMetrics.filter(m => m.name === 'sync.errors').reduce((sum, m) => sum + m.value, 0),
    }

    // Get API stats
    const apiMetrics = await this.queryMetrics({
      tenantId,
      name: ['api.requests', 'api.errors', 'api.latency'],
      startDate: period.start,
      endDate: period.end,
    })

    const totalApiRequests = apiMetrics.filter(m => m.name === 'api.requests').reduce((sum, m) => sum + m.value, 0)
    const totalApiErrors = apiMetrics.filter(m => m.name === 'api.errors').reduce((sum, m) => sum + m.value, 0)
    const avgApiLatency = apiMetrics.filter(m => m.name === 'api.latency').reduce((sum, m, _, arr) => sum + m.value / arr.length, 0)

    return {
      tenantId,
      period,
      integrations: {
        total: instances?.length || 0,
        active: (instances as any)?.filter((i: any) => i.enabled).length || 0,
        connected: (instances as any)?.filter((i: any) => i.status === 'connected').length || 0,
        disconnected: (instances as any)?.filter((i: any) => i.status === 'disconnected').length || 0,
        byType: integrationsByType,
      },
      messages: {
        total: messages?.length || 0,
        sent: sentMessages,
        received: receivedMessages,
        failed: failedMessages,
        byIntegration: messagesByIntegration,
      },
      sync: {
        totalOperations: syncStats.contacts + syncStats.conversations + syncStats.messages,
        ...syncStats,
      },
      api: {
        totalRequests: totalApiRequests,
        successRate: totalApiRequests > 0 ? ((totalApiRequests - totalApiErrors) / totalApiRequests) * 100 : 100,
        errorRate: totalApiRequests > 0 ? (totalApiErrors / totalApiRequests) * 100 : 0,
        averageLatency: avgApiLatency,
      },
    }
  }

  // ============================================================================
  // ALERTING
  // ============================================================================

  /**
   * Create alert
   */
  async createAlert(
    tenantId: string,
    name: string,
    condition: string,
    severity: Alert['severity'],
    message: string,
    options: {
      instanceId?: string
      details?: Record<string, any>
    } = {}
  ): Promise<Alert> {
    const alert: Alert = {
      id: this.generateId(),
      tenantId,
      instanceId: options.instanceId,
      name,
      condition,
      severity,
      status: 'active',
      message,
      details: options.details,
      triggeredAt: new Date(),
      createdAt: new Date(),
    }

    const { error } = await (this.supabase.from('integration_alerts') as any).insert({
      id: alert.id,
      tenant_id: alert.tenantId,
      instance_id: alert.instanceId,
      name: alert.name,
      condition: alert.condition,
      severity: alert.severity,
      status: alert.status,
      message: alert.message,
      details: alert.details,
      triggered_at: alert.triggeredAt.toISOString(),
    })

    if (error) throw error

    this.emit('alert:created', alert)

    return alert
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    await (this.supabase
      .from('integration_alerts') as any)
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', alertId)

    this.emit('alert:resolved', { alertId })
  }

  // ============================================================================
  // BUFFER MANAGEMENT
  // ============================================================================

  /**
   * Flush metrics buffer
   */
  async flush(): Promise<number> {
    if (this.metricsBuffer.length === 0) {
      return 0
    }

    const metrics = [...this.metricsBuffer]
    this.metricsBuffer = []

    try {
      const { error } = await (this.supabase.from('integration_metrics') as any).insert(
        metrics.map(m => ({
          id: m.id,
          tenant_id: m.tenantId,
          instance_id: m.instanceId,
          integration_type: m.integrationType,
          name: m.name,
          value: m.value,
          unit: m.unit,
          type: m.type,
          tags: m.tags,
          timestamp: m.timestamp.toISOString(),
        }))
      )

      if (error) throw error

      this.emit('metrics:flushed', { count: metrics.length })

      return metrics.length
    } catch (error: any) {
      console.error('Failed to flush metrics:', error)
      this.metricsBuffer.unshift(...metrics)
      throw error
    }
  }

  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error)
    }, this.flushInterval)
  }

  stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = undefined
    }
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  private generateId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getIntervalKey(date: Date, interval: NonNullable<MetricQuery['interval']>): string {
    const d = new Date(date)

    switch (interval) {
      case 'minute':
        d.setSeconds(0, 0)
        break
      case 'hour':
        d.setMinutes(0, 0, 0)
        break
      case 'day':
        d.setHours(0, 0, 0, 0)
        break
      case 'week':
        d.setDate(d.getDate() - d.getDay())
        d.setHours(0, 0, 0, 0)
        break
      case 'month':
        d.setDate(1)
        d.setHours(0, 0, 0, 0)
        break
    }

    return d.toISOString()
  }

  async destroy(): Promise<void> {
    this.stopAutoFlush()
    await this.flush()
    this.removeAllListeners()
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default AnalyticsManager
