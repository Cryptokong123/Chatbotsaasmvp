/**
 * Logging & Audit Trails
 *
 * Comprehensive event logging, activity tracking, audit trails, log aggregation
 */

import { EventEmitter } from 'events'
import { createClient } from '@supabase/supabase-js'

// ============================================================================
// TYPES
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export type EventCategory =
  | 'integration'
  | 'authentication'
  | 'authorization'
  | 'data'
  | 'system'
  | 'user'
  | 'api'
  | 'security'
  | 'compliance'

export type EventAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'connect'
  | 'disconnect'
  | 'sync'
  | 'send'
  | 'receive'
  | 'login'
  | 'logout'
  | 'access'
  | 'modify'
  | 'export'
  | 'import'

export interface AuditLog {
  id: string
  tenantId?: string
  instanceId?: string
  userId?: string
  category: EventCategory
  action: EventAction
  resource: string
  resourceId?: string
  status: 'success' | 'failure' | 'pending'
  level: LogLevel
  message: string
  details?: Record<string, any>
  changes?: {
    before?: any
    after?: any
    fields?: string[]
  }
  metadata?: {
    ip?: string
    userAgent?: string
    location?: string
    duration?: number
    [key: string]: any
  }
  tags: string[]
  timestamp: Date
  createdAt: Date
}

export interface LogQuery {
  tenantId?: string
  instanceId?: string
  userId?: string
  category?: EventCategory | EventCategory[]
  action?: EventAction | EventAction[]
  resource?: string
  status?: 'success' | 'failure' | 'pending'
  level?: LogLevel | LogLevel[]
  startDate?: Date
  endDate?: Date
  search?: string
  tags?: string[]
  limit?: number
  offset?: number
  sortBy?: 'timestamp' | 'created_at'
  sortOrder?: 'asc' | 'desc'
}

export interface LogStats {
  totalLogs: number
  byCategory: Record<EventCategory, number>
  byAction: Record<EventAction, number>
  byStatus: Record<string, number>
  byLevel: Record<LogLevel, number>
  topResources: Array<{ resource: string; count: number }>
  timeline: Array<{ date: string; count: number }>
}

export interface LogRetentionPolicy {
  level: LogLevel
  retentionDays: number
  autoDelete: boolean
}

// ============================================================================
// AUDIT LOGGER
// ============================================================================

export class AuditLogger extends EventEmitter {
  private supabase: ReturnType<typeof createClient>
  private buffer: AuditLog[] = []
  private bufferSize = 100
  private flushInterval = 5000 // 5 seconds
  private flushTimer?: NodeJS.Timeout
  private retentionPolicies: LogRetentionPolicy[] = [
    { level: 'debug', retentionDays: 7, autoDelete: true },
    { level: 'info', retentionDays: 30, autoDelete: true },
    { level: 'warn', retentionDays: 90, autoDelete: true },
    { level: 'error', retentionDays: 365, autoDelete: false },
    { level: 'fatal', retentionDays: 365, autoDelete: false },
  ]

  constructor(supabaseUrl: string, supabaseKey: string) {
    super()
    this.supabase = createClient(supabaseUrl, supabaseKey)
    this.startAutoFlush()
  }

  // ============================================================================
  // LOGGING
  // ============================================================================

  /**
   * Log event
   */
  async log(
    category: EventCategory,
    action: EventAction,
    resource: string,
    options: {
      tenantId?: string
      instanceId?: string
      userId?: string
      resourceId?: string
      status?: 'success' | 'failure' | 'pending'
      level?: LogLevel
      message?: string
      details?: Record<string, any>
      changes?: AuditLog['changes']
      metadata?: AuditLog['metadata']
      tags?: string[]
    } = {}
  ): Promise<string> {
    const log: AuditLog = {
      id: this.generateId(),
      tenantId: options.tenantId,
      instanceId: options.instanceId,
      userId: options.userId,
      category,
      action,
      resource,
      resourceId: options.resourceId,
      status: options.status || 'success',
      level: options.level || 'info',
      message: options.message || `${action} ${resource}`,
      details: options.details,
      changes: options.changes,
      metadata: options.metadata,
      tags: options.tags || [],
      timestamp: new Date(),
      createdAt: new Date(),
    }

    // Add to buffer
    this.buffer.push(log)

    // Emit event
    this.emit('log:created', log)

    // Flush if buffer is full
    if (this.buffer.length >= this.bufferSize) {
      await this.flush()
    }

    return log.id
  }

  /**
   * Log debug event
   */
  async debug(
    resource: string,
    message: string,
    details?: Record<string, any>,
    options: Partial<Parameters<typeof this.log>[3]> = {}
  ): Promise<string> {
    return this.log('system', 'read', resource, {
      ...options,
      level: 'debug',
      message,
      details,
    })
  }

  /**
   * Log info event
   */
  async info(
    resource: string,
    message: string,
    details?: Record<string, any>,
    options: Partial<Parameters<typeof this.log>[3]> = {}
  ): Promise<string> {
    return this.log('system', 'read', resource, {
      ...options,
      level: 'info',
      message,
      details,
    })
  }

  /**
   * Log warning event
   */
  async warn(
    resource: string,
    message: string,
    details?: Record<string, any>,
    options: Partial<Parameters<typeof this.log>[3]> = {}
  ): Promise<string> {
    return this.log('system', 'read', resource, {
      ...options,
      level: 'warn',
      message,
      details,
    })
  }

  /**
   * Log error event
   */
  async error(
    resource: string,
    message: string,
    error?: Error,
    options: Partial<Parameters<typeof this.log>[3]> = {}
  ): Promise<string> {
    return this.log('system', 'read', resource, {
      ...options,
      level: 'error',
      status: 'failure',
      message,
      details: {
        error: error?.message,
        stack: error?.stack,
        ...options.details,
      },
    })
  }

  /**
   * Log fatal event
   */
  async fatal(
    resource: string,
    message: string,
    error?: Error,
    options: Partial<Parameters<typeof this.log>[3]> = {}
  ): Promise<string> {
    return this.log('system', 'read', resource, {
      ...options,
      level: 'fatal',
      status: 'failure',
      message,
      details: {
        error: error?.message,
        stack: error?.stack,
        ...options.details,
      },
    })
  }

  // ============================================================================
  // INTEGRATION-SPECIFIC LOGGING
  // ============================================================================

  /**
   * Log integration connection
   */
  async logConnection(
    instanceId: string,
    integrationType: string,
    status: 'success' | 'failure',
    options: {
      tenantId?: string
      userId?: string
      message?: string
      details?: Record<string, any>
      metadata?: AuditLog['metadata']
    } = {}
  ): Promise<string> {
    return this.log('integration', 'connect', `integration:${integrationType}`, {
      instanceId,
      resourceId: instanceId,
      status,
      level: status === 'success' ? 'info' : 'error',
      message: options.message || `${status === 'success' ? 'Connected' : 'Failed to connect'} to ${integrationType}`,
      ...options,
    })
  }

  /**
   * Log integration sync
   */
  async logSync(
    instanceId: string,
    resource: string,
    count: number,
    options: {
      tenantId?: string
      userId?: string
      duration?: number
      errors?: number
      details?: Record<string, any>
    } = {}
  ): Promise<string> {
    return this.log('integration', 'sync', resource, {
      instanceId,
      resourceId: instanceId,
      status: (options.errors || 0) === 0 ? 'success' : 'failure',
      level: 'info',
      message: `Synced ${count} ${resource}${options.errors ? ` with ${options.errors} errors` : ''}`,
      details: {
        count,
        errors: options.errors,
        ...options.details,
      },
      metadata: {
        duration: options.duration,
      },
      ...options,
    })
  }

  /**
   * Log message sent
   */
  async logMessageSent(
    instanceId: string,
    messageId: string,
    status: 'success' | 'failure',
    options: {
      tenantId?: string
      userId?: string
      conversationId?: string
      details?: Record<string, any>
      metadata?: AuditLog['metadata']
    } = {}
  ): Promise<string> {
    return this.log('integration', 'send', 'message', {
      instanceId,
      resourceId: messageId,
      status,
      level: status === 'success' ? 'info' : 'error',
      message: `Message ${status === 'success' ? 'sent' : 'failed'}`,
      ...options,
    })
  }

  /**
   * Log data access
   */
  async logDataAccess(
    resource: string,
    resourceId: string,
    action: 'read' | 'export',
    options: {
      tenantId?: string
      userId?: string
      details?: Record<string, any>
      metadata?: AuditLog['metadata']
    } = {}
  ): Promise<string> {
    return this.log('data', action, resource, {
      resourceId,
      status: 'success',
      level: 'info',
      message: `${action === 'read' ? 'Accessed' : 'Exported'} ${resource}`,
      ...options,
    })
  }

  /**
   * Log data modification
   */
  async logDataChange(
    resource: string,
    resourceId: string,
    action: 'create' | 'update' | 'delete',
    changes: {
      before?: any
      after?: any
      fields?: string[]
    },
    options: {
      tenantId?: string
      userId?: string
      details?: Record<string, any>
      metadata?: AuditLog['metadata']
    } = {}
  ): Promise<string> {
    return this.log('data', action, resource, {
      resourceId,
      status: 'success',
      level: 'info',
      message: `${action.charAt(0).toUpperCase() + action.slice(1)}d ${resource}`,
      changes,
      ...options,
    })
  }

  /**
   * Log security event
   */
  async logSecurity(
    action: string,
    status: 'success' | 'failure',
    options: {
      tenantId?: string
      userId?: string
      resource?: string
      details?: Record<string, any>
      metadata?: AuditLog['metadata']
    } = {}
  ): Promise<string> {
    return this.log('security', 'access', options.resource || 'security', {
      status,
      level: status === 'success' ? 'info' : 'warn',
      message: `Security event: ${action}`,
      ...options,
    })
  }

  // ============================================================================
  // QUERYING
  // ============================================================================

  /**
   * Query logs
   */
  async query(filter: LogQuery): Promise<AuditLog[]> {
    let query = this.supabase.from('integration_events').select('*')

    if (filter.tenantId) query = query.eq('tenant_id', filter.tenantId)
    if (filter.instanceId) query = query.eq('instance_id', filter.instanceId)
    if (filter.userId) query = query.eq('user_id', filter.userId)

    if (filter.category) {
      if (Array.isArray(filter.category)) {
        query = query.in('category', filter.category)
      } else {
        query = query.eq('category', filter.category)
      }
    }

    if (filter.action) {
      if (Array.isArray(filter.action)) {
        query = query.in('action', filter.action)
      } else {
        query = query.eq('action', filter.action)
      }
    }

    if (filter.resource) query = query.eq('resource_type', filter.resource)
    if (filter.status) query = query.eq('status', filter.status)

    if (filter.level) {
      if (Array.isArray(filter.level)) {
        query = query.in('level', filter.level)
      } else {
        query = query.eq('level', filter.level)
      }
    }

    if (filter.startDate) query = query.gte('timestamp', filter.startDate.toISOString())
    if (filter.endDate) query = query.lte('timestamp', filter.endDate.toISOString())

    if (filter.search) {
      query = query.or(`message.ilike.%${filter.search}%,details->>'error'.ilike.%${filter.search}%`)
    }

    if (filter.tags && filter.tags.length > 0) {
      query = query.contains('tags', filter.tags)
    }

    const sortBy = filter.sortBy || 'timestamp'
    const sortOrder = filter.sortOrder || 'desc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    if (filter.limit) query = query.limit(filter.limit)
    if (filter.offset) {
      query = query.range(filter.offset, filter.offset + (filter.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) throw error

    return data as AuditLog[]
  }

  /**
   * Get log by ID
   */
  async getLog(logId: string): Promise<AuditLog | null> {
    const { data, error } = await this.supabase
      .from('integration_events')
      .select('*')
      .eq('id', logId)
      .single()

    if (error || !data) {
      return null
    }

    return data as AuditLog
  }

  /**
   * Get log statistics
   */
  async getStats(filter: Omit<LogQuery, 'limit' | 'offset' | 'sortBy' | 'sortOrder'>): Promise<LogStats> {
    const logs = await this.query({ ...filter, limit: 10000 })

    const stats: LogStats = {
      totalLogs: logs.length,
      byCategory: {} as Record<EventCategory, number>,
      byAction: {} as Record<EventAction, number>,
      byStatus: {},
      byLevel: {} as Record<LogLevel, number>,
      topResources: [],
      timeline: [],
    }

    // Count by category
    for (const log of logs) {
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1
      stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1
    }

    // Top resources
    const resourceCounts = new Map<string, number>()
    for (const log of logs) {
      resourceCounts.set(log.resource, (resourceCounts.get(log.resource) || 0) + 1)
    }
    stats.topResources = Array.from(resourceCounts.entries())
      .map(([resource, count]) => ({ resource, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Timeline (by day)
    const timeline = new Map<string, number>()
    for (const log of logs) {
      const date = log.timestamp.toISOString().split('T')[0]
      timeline.set(date, (timeline.get(date) || 0) + 1)
    }
    stats.timeline = Array.from(timeline.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return stats
  }

  // ============================================================================
  // BUFFER MANAGEMENT
  // ============================================================================

  /**
   * Flush buffer to database
   */
  async flush(): Promise<number> {
    if (this.buffer.length === 0) {
      return 0
    }

    const logs = [...this.buffer]
    this.buffer = []

    try {
      const { error } = await (this.supabase.from('integration_events') as any).insert(
        logs.map(log => ({
          id: log.id,
          tenant_id: log.tenantId,
          instance_id: log.instanceId,
          user_id: log.userId,
          category: log.category,
          action: log.action,
          resource_type: log.resource,
          resource_id: log.resourceId,
          status: log.status,
          level: log.level,
          message: log.message,
          details: log.details,
          changes: log.changes,
          metadata: log.metadata,
          tags: log.tags,
          timestamp: log.timestamp.toISOString(),
        }))
      )

      if (error) throw error

      this.emit('logs:flushed', { count: logs.length })

      return logs.length
    } catch (error: any) {
      console.error('Failed to flush logs:', error)
      // Re-add logs to buffer
      this.buffer.unshift(...logs)
      throw error
    }
  }

  /**
   * Start auto-flush
   */
  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error)
    }, this.flushInterval)
  }

  /**
   * Stop auto-flush
   */
  stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = undefined
    }
  }

  // ============================================================================
  // RETENTION & CLEANUP
  // ============================================================================

  /**
   * Set retention policy
   */
  setRetentionPolicy(policy: LogRetentionPolicy): void {
    const index = this.retentionPolicies.findIndex(p => p.level === policy.level)
    if (index !== -1) {
      this.retentionPolicies[index] = policy
    } else {
      this.retentionPolicies.push(policy)
    }
  }

  /**
   * Clean up old logs based on retention policy
   */
  async cleanup(): Promise<number> {
    let totalDeleted = 0

    for (const policy of this.retentionPolicies) {
      if (!policy.autoDelete) {
        continue
      }

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays)

      const { data, error } = await this.supabase
        .from('integration_events')
        .delete()
        .eq('level', policy.level)
        .lt('timestamp', cutoffDate.toISOString())
        .select('id')

      if (error) {
        console.error(`Failed to cleanup ${policy.level} logs:`, error)
        continue
      }

      const count = data?.length || 0
      totalDeleted += count

      if (count > 0) {
        this.emit('logs:cleaned', { level: policy.level, count })
      }
    }

    return totalDeleted
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Generate unique log ID
   */
  private generateId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Export logs
   */
  async export(filter: LogQuery, format: 'json' | 'csv' = 'json'): Promise<string> {
    const logs = await this.query(filter)

    if (format === 'json') {
      return JSON.stringify(logs, null, 2)
    }

    // CSV export
    const headers = [
      'timestamp',
      'level',
      'category',
      'action',
      'resource',
      'status',
      'message',
      'userId',
      'instanceId',
    ]

    const rows = logs.map(log => [
      log.timestamp.toISOString(),
      log.level,
      log.category,
      log.action,
      log.resource,
      log.status,
      log.message,
      log.userId || '',
      log.instanceId || '',
    ])

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  /**
   * Destroy logger
   */
  async destroy(): Promise<void> {
    this.stopAutoFlush()
    await this.flush()
    this.removeAllListeners()
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default AuditLogger
