/**
 * Analytics Engine
 *
 * Comprehensive analytics system with:
 * - Real-time metrics
 * - Conversation analytics
 * - Agent performance metrics
 * - Customer journey tracking
 * - Custom reports & dashboards
 * - Data export
 * - Predictive analytics
 */

export interface MetricValue {
  timestamp: Date
  value: number
  dimensions?: Record<string, string>
}

export interface ConversationMetrics {
  totalConversations: number
  activeConversations: number
  averageResponseTime: number // seconds
  averageResolutionTime: number // seconds
  firstContactResolution: number // percentage
  customerSatisfaction: number // 0-5 scale
  netPromoterScore: number // -100 to 100
  sentimentScore: number // -1 to 1
  messageVolume: number
  conversationsByPlatform: Record<string, number>
  conversationsByHour: number[]
  topTopics: Array<{ topic: string; count: number }>
}

export interface AgentMetrics {
  agentId: string
  agentName: string
  conversationsHandled: number
  averageHandleTime: number
  averageResponseTime: number
  utilization: number // percentage
  customerSatisfaction: number
  resolutionRate: number
  messagesProcessed: number
  activeTime: number // minutes
}

export interface CustomerJourney {
  customerId: string
  touchpoints: Array<{
    timestamp: Date
    type: 'conversation' | 'email' | 'purchase' | 'visit' | 'support'
    platform?: string
    data: any
  }>
  conversions: Array<{
    timestamp: Date
    type: string
    value?: number
  }>
  lifetime_value: number
  sentiment_trend: number[]
}

export interface ReportConfig {
  id: string
  name: string
  type: 'conversation' | 'agent' | 'customer' | 'custom'
  metrics: string[]
  dimensions: string[]
  filters: ReportFilter[]
  dateRange: { start: Date; end: Date }
  aggregation?: 'hour' | 'day' | 'week' | 'month'
}

export interface ReportFilter {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'between'
  value: any
}

export class AnalyticsEngine {
  private metrics: Map<string, MetricValue[]> = new Map()
  private conversations: Map<string, any> = new Map()
  private agents: Map<string, any> = new Map()
  private customers: Map<string, CustomerJourney> = new Map()

  // ============================================================================
  // REAL-TIME METRICS
  // ============================================================================

  trackMetric(name: string, value: number, dimensions?: Record<string, string>): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }

    this.metrics.get(name)!.push({
      timestamp: new Date(),
      value,
      dimensions,
    })
  }

  getRealtimeMetrics(names: string[], timeWindow: number = 300000): Record<string, number> {
    const now = Date.now()
    const cutoff = new Date(now - timeWindow)
    const results: Record<string, number> = {}

    for (const name of names) {
      const values = this.metrics.get(name) || []
      const recentValues = values.filter(v => v.timestamp >= cutoff)
      results[name] = recentValues.reduce((sum, v) => sum + v.value, 0)
    }

    return results
  }

  // ============================================================================
  // CONVERSATION ANALYTICS
  // ============================================================================

  async getConversationMetrics(startDate: Date, endDate: Date): Promise<ConversationMetrics> {
    const conversations = Array.from(this.conversations.values()).filter(
      c => c.createdAt >= startDate && c.createdAt <= endDate
    )

    const totalConversations = conversations.length
    const activeConversations = conversations.filter(c => c.status === 'active').length

    // Calculate averages
    const responseTimes = conversations.map(c => c.averageResponseTime || 0).filter(t => t > 0)
    const resolutionTimes = conversations.map(c => c.resolutionTime || 0).filter(t => t > 0)

    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
      : 0

    const averageResolutionTime = resolutionTimes.length > 0
      ? resolutionTimes.reduce((sum, t) => sum + t, 0) / resolutionTimes.length
      : 0

    // FCR calculation
    const resolvedFirstContact = conversations.filter(c => c.resolvedFirstContact).length
    const firstContactResolution = totalConversations > 0
      ? (resolvedFirstContact / totalConversations) * 100
      : 0

    // CSAT calculation
    const csatScores = conversations.map(c => c.customerSatisfaction).filter(s => s !== undefined)
    const customerSatisfaction = csatScores.length > 0
      ? csatScores.reduce((sum, s) => sum + s, 0) / csatScores.length
      : 0

    // NPS calculation
    const npsScores = conversations.map(c => c.nps).filter(s => s !== undefined)
    const netPromoterScore = this.calculateNPS(npsScores)

    // Sentiment
    const sentiments = conversations.map(c => c.sentimentScore).filter(s => s !== undefined)
    const sentimentScore = sentiments.length > 0
      ? sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length
      : 0

    // Message volume
    const messageVolume = conversations.reduce((sum, c) => sum + (c.messageCount || 0), 0)

    // Conversations by platform
    const conversationsByPlatform: Record<string, number> = {}
    conversations.forEach(c => {
      conversationsByPlatform[c.platform] = (conversationsByPlatform[c.platform] || 0) + 1
    })

    // Conversations by hour
    const conversationsByHour = new Array(24).fill(0)
    conversations.forEach(c => {
      const hour = new Date(c.createdAt).getHours()
      conversationsByHour[hour]++
    })

    // Top topics
    const topicCounts: Record<string, number> = {}
    conversations.forEach(c => {
      (c.topics || []).forEach((topic: string) => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1
      })
    })

    const topTopics = Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }))

    return {
      totalConversations,
      activeConversations,
      averageResponseTime,
      averageResolutionTime,
      firstContactResolution,
      customerSatisfaction,
      netPromoterScore,
      sentimentScore,
      messageVolume,
      conversationsByPlatform,
      conversationsByHour,
      topTopics,
    }
  }

  // ============================================================================
  // AGENT ANALYTICS
  // ============================================================================

  async getAgentMetrics(agentId: string, startDate: Date, endDate: Date): Promise<AgentMetrics> {
    const conversations = Array.from(this.conversations.values()).filter(
      c => c.agentId === agentId && c.createdAt >= startDate && c.createdAt <= endDate
    )

    const conversationsHandled = conversations.length

    const handleTimes = conversations.map(c => c.handleTime || 0).filter(t => t > 0)
    const averageHandleTime = handleTimes.length > 0
      ? handleTimes.reduce((sum, t) => sum + t, 0) / handleTimes.length
      : 0

    const responseTimes = conversations.map(c => c.averageResponseTime || 0).filter(t => t > 0)
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
      : 0

    const csatScores = conversations.map(c => c.customerSatisfaction).filter(s => s !== undefined)
    const customerSatisfaction = csatScores.length > 0
      ? csatScores.reduce((sum, s) => sum + s, 0) / csatScores.length
      : 0

    const resolvedCount = conversations.filter(c => c.status === 'resolved').length
    const resolutionRate = conversationsHandled > 0
      ? (resolvedCount / conversationsHandled) * 100
      : 0

    const messagesProcessed = conversations.reduce((sum, c) => sum + (c.messageCount || 0), 0)

    const agent = this.agents.get(agentId)
    const activeTime = agent?.activeTime || 0
    const totalTime = (endDate.getTime() - startDate.getTime()) / (1000 * 60) // minutes
    const utilization = (activeTime / totalTime) * 100

    return {
      agentId,
      agentName: agent?.name || 'Unknown',
      conversationsHandled,
      averageHandleTime,
      averageResponseTime,
      utilization,
      customerSatisfaction,
      resolutionRate,
      messagesProcessed,
      activeTime,
    }
  }

  // ============================================================================
  // CUSTOMER JOURNEY TRACKING
  // ============================================================================

  trackCustomerTouchpoint(customerId: string, touchpoint: {
    type: 'conversation' | 'email' | 'purchase' | 'visit' | 'support'
    platform?: string
    data: any
  }): void {
    if (!this.customers.has(customerId)) {
      this.customers.set(customerId, {
        customerId,
        touchpoints: [],
        conversions: [],
        lifetime_value: 0,
        sentiment_trend: [],
      })
    }

    const journey = this.customers.get(customerId)!
    journey.touchpoints.push({
      timestamp: new Date(),
      ...touchpoint,
    })
  }

  trackConversion(customerId: string, conversion: { type: string; value?: number }): void {
    const journey = this.customers.get(customerId)
    if (journey) {
      journey.conversions.push({
        timestamp: new Date(),
        ...conversion,
      })

      if (conversion.value) {
        journey.lifetime_value += conversion.value
      }
    }
  }

  getCustomerJourney(customerId: string): CustomerJourney | undefined {
    return this.customers.get(customerId)
  }

  // ============================================================================
  // CUSTOM REPORTS
  // ============================================================================

  async generateReport(config: ReportConfig): Promise<any> {
    // Filter data based on config
    const conversations = Array.from(this.conversations.values()).filter(c => {
      if (c.createdAt < config.dateRange.start || c.createdAt > config.dateRange.end) {
        return false
      }

      return config.filters.every(filter => this.applyFilter(c, filter))
    })

    // Aggregate data
    const aggregated = this.aggregateData(conversations, config)

    return {
      reportId: config.id,
      generatedAt: new Date(),
      data: aggregated,
      totalRecords: conversations.length,
    }
  }

  private applyFilter(record: any, filter: ReportFilter): boolean {
    const value = this.getNestedValue(record, filter.field)

    switch (filter.operator) {
      case 'equals':
        return value === filter.value
      case 'not_equals':
        return value !== filter.value
      case 'contains':
        return String(value).includes(String(filter.value))
      case 'greater_than':
        return Number(value) > Number(filter.value)
      case 'less_than':
        return Number(value) < Number(filter.value)
      case 'in':
        return Array.isArray(filter.value) && filter.value.includes(value)
      case 'between':
        return Array.isArray(filter.value) && value >= filter.value[0] && value <= filter.value[1]
      default:
        return true
    }
  }

  private aggregateData(records: any[], config: ReportConfig): any {
    const grouped: Record<string, any[]> = {}

    records.forEach(record => {
      const key = config.dimensions
        .map(dim => this.getNestedValue(record, dim))
        .join('|')

      if (!grouped[key]) {
        grouped[key] = []
      }

      grouped[key].push(record)
    })

    const result: any[] = []

    for (const [key, group] of Object.entries(grouped)) {
      const dimensions = key.split('|')
      const metrics: Record<string, any> = {}

      config.metrics.forEach((metric, i) => {
        metrics[metric] = this.calculateMetric(metric, group)
      })

      result.push({
        ...config.dimensions.reduce((acc, dim, i) => {
          acc[dim] = dimensions[i]
          return acc
        }, {} as Record<string, any>),
        ...metrics,
      })
    }

    return result
  }

  private calculateMetric(metric: string, records: any[]): number {
    if (metric.startsWith('count')) {
      return records.length
    }

    if (metric.startsWith('sum')) {
      const field = metric.split('.')[1]
      return records.reduce((sum, r) => sum + (this.getNestedValue(r, field) || 0), 0)
    }

    if (metric.startsWith('avg')) {
      const field = metric.split('.')[1]
      const values = records.map(r => this.getNestedValue(r, field)).filter(v => v !== undefined)
      return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0
    }

    if (metric.startsWith('min')) {
      const field = metric.split('.')[1]
      const values = records.map(r => this.getNestedValue(r, field)).filter(v => v !== undefined)
      return values.length > 0 ? Math.min(...values) : 0
    }

    if (metric.startsWith('max')) {
      const field = metric.split('.')[1]
      const values = records.map(r => this.getNestedValue(r, field)).filter(v => v !== undefined)
      return values.length > 0 ? Math.max(...values) : 0
    }

    return 0
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj)
  }

  private calculateNPS(scores: number[]): number {
    if (scores.length === 0) return 0

    const promoters = scores.filter(s => s >= 9).length
    const detractors = scores.filter(s => s <= 6).length

    return ((promoters - detractors) / scores.length) * 100
  }

  // ============================================================================
  // DATA EXPORT
  // ============================================================================

  async exportData(format: 'json' | 'csv' | 'excel', config: ReportConfig): Promise<string | Buffer> {
    const report = await this.generateReport(config)

    if (format === 'json') {
      return JSON.stringify(report, null, 2)
    }

    if (format === 'csv') {
      return this.convertToCSV(report.data)
    }

    // Excel export would require additional library
    throw new Error('Excel export not yet implemented')
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return ''

    const headers = Object.keys(data[0])
    const rows = data.map(row => headers.map(h => row[h]).join(','))

    return [headers.join(','), ...rows].join('\n')
  }
}
