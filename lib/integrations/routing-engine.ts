/**
 * Routing Rules Engine
 *
 * Intelligent message routing, conditional logic, priority-based routing, load balancing
 */

import { EventEmitter } from 'events'
import { createClient } from '@supabase/supabase-js'

// ============================================================================
// TYPES
// ============================================================================

export interface RoutingRule {
  id: string
  tenantId: string
  instanceId?: string
  name: string
  description?: string
  priority: number
  enabled: boolean
  conditions: RoutingCondition[]
  actions: RoutingAction[]
  fallbackActions?: RoutingAction[]
  metadata?: Record<string, any>
  tags: string[]
  matchCount: number
  lastMatchedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface RoutingCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'matches' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'exists' | 'not_exists'
  value?: any
  logicalOperator?: 'and' | 'or'
}

export interface RoutingAction {
  type: 'assign' | 'tag' | 'forward' | 'notify' | 'escalate' | 'autorespond' | 'webhook' | 'close' | 'archive'
  target?: string // User ID, team ID, webhook URL, etc.
  parameters?: Record<string, any>
  priority?: 'low' | 'normal' | 'high' | 'urgent'
}

export interface RoutingContext {
  message?: any
  conversation?: any
  contact?: any
  integration?: {
    type: string
    instanceId: string
  }
  metadata?: Record<string, any>
}

export interface RoutingResult {
  matched: boolean
  rules: RoutingRule[]
  actions: RoutingAction[]
  executedActions: Array<{
    action: RoutingAction
    success: boolean
    error?: string
  }>
}

export interface LoadBalancingStrategy {
  type: 'round_robin' | 'least_active' | 'random' | 'weighted'
  targets: LoadBalancingTarget[]
}

export interface LoadBalancingTarget {
  id: string
  name: string
  weight?: number
  maxCapacity?: number
  currentLoad?: number
  isAvailable?: boolean
}

// ============================================================================
// ROUTING ENGINE
// ============================================================================

export class RoutingEngine extends EventEmitter {
  private supabase: ReturnType<typeof createClient>
  private rulesCache = new Map<string, RoutingRule[]>()
  private loadBalancingState = new Map<string, { currentIndex: number; loads: Map<string, number> }>()

  constructor(supabaseUrl: string, supabaseKey: string) {
    super()
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  // ============================================================================
  // RULE MANAGEMENT
  // ============================================================================

  /**
   * Create routing rule
   */
  async createRule(rule: Omit<RoutingRule, 'id' | 'matchCount' | 'createdAt' | 'updatedAt'>): Promise<RoutingRule> {
    const { data, error } = await (this.supabase
      .from('routing_rules') as any)
      .insert({
        tenant_id: rule.tenantId,
        instance_id: rule.instanceId,
        name: rule.name,
        description: rule.description,
        priority: rule.priority,
        enabled: rule.enabled ?? true,
        conditions: rule.conditions,
        actions: rule.actions,
        fallback_actions: rule.fallbackActions,
        metadata: rule.metadata,
        tags: rule.tags || [],
        match_count: 0,
      })
      .select()
      .single()

    if (error) throw error

    this.clearRulesCache(rule.tenantId)
    this.emit('rule:created', data)

    return data as RoutingRule
  }

  /**
   * Update routing rule
   */
  async updateRule(ruleId: string, updates: Partial<RoutingRule>): Promise<RoutingRule> {
    const { data, error } = await (this.supabase
      .from('routing_rules') as any)
      .update({
        name: updates.name,
        description: updates.description,
        priority: updates.priority,
        enabled: updates.enabled,
        conditions: updates.conditions,
        actions: updates.actions,
        fallback_actions: updates.fallbackActions,
        metadata: updates.metadata,
        tags: updates.tags,
      })
      .eq('id', ruleId)
      .select()
      .single()

    if (error) throw error

    const rule = data as RoutingRule
    this.clearRulesCache(rule.tenantId)
    this.emit('rule:updated', data)

    return rule
  }

  /**
   * Delete routing rule
   */
  async deleteRule(ruleId: string): Promise<boolean> {
    const { data: rule } = await (this.supabase
      .from('routing_rules') as any)
      .select('tenant_id')
      .eq('id', ruleId)
      .single()

    const { error } = await (this.supabase
      .from('routing_rules') as any)
      .delete()
      .eq('id', ruleId)

    if (error) throw error

    if (rule) {
      this.clearRulesCache(rule.tenant_id)
    }

    this.emit('rule:deleted', { ruleId })
    return true
  }

  /**
   * Get rules for tenant
   */
  async getRules(tenantId: string, options: {
    instanceId?: string
    enabled?: boolean
  } = {}): Promise<RoutingRule[]> {
    // Check cache
    const cacheKey = `${tenantId}:${options.instanceId || 'all'}`
    const cached = this.rulesCache.get(cacheKey)
    if (cached) {
      return cached
    }

    let query = (this.supabase
      .from('routing_rules') as any)
      .select('*')
      .eq('tenant_id', tenantId)

    if (options.instanceId) {
      query = query.eq('instance_id', options.instanceId)
    }

    if (options.enabled !== undefined) {
      query = query.eq('enabled', options.enabled)
    }

    const { data, error } = await query.order('priority', { ascending: false })

    if (error) throw error

    const rules = data as RoutingRule[]
    this.rulesCache.set(cacheKey, rules)

    return rules
  }

  // ============================================================================
  // ROUTING EXECUTION
  // ============================================================================

  /**
   * Route message or conversation
   */
  async route(
    tenantId: string,
    context: RoutingContext,
    options: {
      instanceId?: string
      executeActions?: boolean
    } = {}
  ): Promise<RoutingResult> {
    const executeActions = options.executeActions ?? true

    // Get applicable rules
    const rules = await this.getRules(tenantId, {
      instanceId: options.instanceId,
      enabled: true,
    })

    // Find matching rules
    const matchedRules: RoutingRule[] = []
    const actions: RoutingAction[] = []

    for (const rule of rules) {
      if (this.evaluateConditions(rule.conditions, context)) {
        matchedRules.push(rule)
        actions.push(...rule.actions)

        // Track match
        this.trackMatch(rule.id).catch(console.error)

        this.emit('rule:matched', { ruleId: rule.id, context })

        // Break if we have a match (highest priority wins)
        break
      }
    }

    // Execute actions
    const executedActions: Array<{
      action: RoutingAction
      success: boolean
      error?: string
    }> = []

    if (executeActions && actions.length > 0) {
      for (const action of actions) {
        try {
          await this.executeAction(action, context)
          executedActions.push({ action, success: true })
          this.emit('action:executed', { action, context })
        } catch (error: any) {
          executedActions.push({ action, success: false, error: error.message })
          this.emit('action:failed', { action, context, error: error.message })
        }
      }
    }

    // Execute fallback actions if no rules matched
    if (matchedRules.length === 0 && rules.length > 0) {
      const fallbackActions = rules[0].fallbackActions || []
      for (const action of fallbackActions) {
        try {
          await this.executeAction(action, context)
          executedActions.push({ action, success: true })
        } catch (error: any) {
          executedActions.push({ action, success: false, error: error.message })
        }
      }
    }

    return {
      matched: matchedRules.length > 0,
      rules: matchedRules,
      actions,
      executedActions,
    }
  }

  /**
   * Evaluate routing conditions
   */
  private evaluateConditions(conditions: RoutingCondition[], context: RoutingContext): boolean {
    if (conditions.length === 0) {
      return true
    }

    let result = true
    let currentLogicalOp: 'and' | 'or' = 'and'

    for (const condition of conditions) {
      const conditionResult = this.evaluateCondition(condition, context)

      if (currentLogicalOp === 'and') {
        result = result && conditionResult
      } else {
        result = result || conditionResult
      }

      currentLogicalOp = condition.logicalOperator || 'and'
    }

    return result
  }

  /**
   * Evaluate single condition
   */
  private evaluateCondition(condition: RoutingCondition, context: RoutingContext): boolean {
    const fieldValue = this.getFieldValue(condition.field, context)

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value

      case 'not_equals':
        return fieldValue !== condition.value

      case 'contains':
        return String(fieldValue).includes(String(condition.value))

      case 'not_contains':
        return !String(fieldValue).includes(String(condition.value))

      case 'starts_with':
        return String(fieldValue).startsWith(String(condition.value))

      case 'ends_with':
        return String(fieldValue).endsWith(String(condition.value))

      case 'matches':
        const regex = new RegExp(String(condition.value))
        return regex.test(String(fieldValue))

      case 'gt':
        return Number(fieldValue) > Number(condition.value)

      case 'gte':
        return Number(fieldValue) >= Number(condition.value)

      case 'lt':
        return Number(fieldValue) < Number(condition.value)

      case 'lte':
        return Number(fieldValue) <= Number(condition.value)

      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue)

      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue)

      case 'exists':
        return fieldValue !== undefined && fieldValue !== null

      case 'not_exists':
        return fieldValue === undefined || fieldValue === null

      default:
        return false
    }
  }

  /**
   * Get field value from context
   */
  private getFieldValue(field: string, context: RoutingContext): any {
    const parts = field.split('.')
    let value: any = context

    for (const part of parts) {
      value = value?.[part]
    }

    return value
  }

  /**
   * Execute routing action
   */
  private async executeAction(action: RoutingAction, context: RoutingContext): Promise<void> {
    switch (action.type) {
      case 'assign':
        await this.executeAssignAction(action, context)
        break

      case 'tag':
        await this.executeTagAction(action, context)
        break

      case 'forward':
        await this.executeForwardAction(action, context)
        break

      case 'notify':
        await this.executeNotifyAction(action, context)
        break

      case 'escalate':
        await this.executeEscalateAction(action, context)
        break

      case 'autorespond':
        await this.executeAutoRespondAction(action, context)
        break

      case 'webhook':
        await this.executeWebhookAction(action, context)
        break

      case 'close':
        await this.executeCloseAction(action, context)
        break

      case 'archive':
        await this.executeArchiveAction(action, context)
        break

      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }
  }

  private async executeAssignAction(action: RoutingAction, context: RoutingContext): Promise<void> {
    if (!context.conversation?.id) {
      throw new Error('No conversation to assign')
    }

    await (this.supabase
      .from('integration_conversations') as any)
      .update({
        assignee_id: action.target,
        priority: action.priority,
      })
      .eq('id', context.conversation.id)

    this.emit('action:assign', { conversationId: context.conversation.id, assigneeId: action.target })
  }

  private async executeTagAction(action: RoutingAction, context: RoutingContext): Promise<void> {
    if (!context.conversation?.id) {
      throw new Error('No conversation to tag')
    }

    const tags = action.parameters?.tags || []

    // Note: Tags update removed due to Supabase raw() limitation
    this.emit('action:tag', { conversationId: context.conversation.id, tags })
  }

  private async executeForwardAction(action: RoutingAction, context: RoutingContext): Promise<void> {
    // Forward to another integration instance
    this.emit('action:forward', { target: action.target, context })
  }

  private async executeNotifyAction(action: RoutingAction, context: RoutingContext): Promise<void> {
    // Send notification
    this.emit('action:notify', { target: action.target, context, parameters: action.parameters })
  }

  private async executeEscalateAction(action: RoutingAction, context: RoutingContext): Promise<void> {
    if (!context.conversation?.id) {
      throw new Error('No conversation to escalate')
    }

    await (this.supabase
      .from('integration_conversations') as any)
      .update({
        priority: 'urgent',
        assignee_id: action.target,
      })
      .eq('id', context.conversation.id)

    this.emit('action:escalate', { conversationId: context.conversation.id, target: action.target })
  }

  private async executeAutoRespondAction(action: RoutingAction, context: RoutingContext): Promise<void> {
    const templateId = action.parameters?.templateId
    const variables = action.parameters?.variables || {}

    this.emit('action:autorespond', { templateId, variables, context })
  }

  private async executeWebhookAction(action: RoutingAction, context: RoutingContext): Promise<void> {
    const url = action.target
    if (!url) {
      throw new Error('Webhook URL not specified')
    }

    // Trigger webhook (would integrate with webhook system)
    this.emit('action:webhook', { url, context, parameters: action.parameters })
  }

  private async executeCloseAction(action: RoutingAction, context: RoutingContext): Promise<void> {
    if (!context.conversation?.id) {
      throw new Error('No conversation to close')
    }

    await (this.supabase
      .from('integration_conversations') as any)
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
      })
      .eq('id', context.conversation.id)

    this.emit('action:close', { conversationId: context.conversation.id })
  }

  private async executeArchiveAction(action: RoutingAction, context: RoutingContext): Promise<void> {
    if (!context.conversation?.id) {
      throw new Error('No conversation to archive')
    }

    await (this.supabase
      .from('integration_conversations') as any)
      .update({
        status: 'archived',
        is_active: false,
      })
      .eq('id', context.conversation.id)

    this.emit('action:archive', { conversationId: context.conversation.id })
  }

  // ============================================================================
  // LOAD BALANCING
  // ============================================================================

  /**
   * Select target using load balancing
   */
  selectTarget(strategy: LoadBalancingStrategy, key: string = 'default'): LoadBalancingTarget | null {
    const availableTargets = strategy.targets.filter(t => t.isAvailable !== false)

    if (availableTargets.length === 0) {
      return null
    }

    let state = this.loadBalancingState.get(key)
    if (!state) {
      state = { currentIndex: 0, loads: new Map() }
      this.loadBalancingState.set(key, state)
    }

    switch (strategy.type) {
      case 'round_robin':
        return this.selectRoundRobin(availableTargets, state)

      case 'least_active':
        return this.selectLeastActive(availableTargets, state)

      case 'random':
        return this.selectRandom(availableTargets)

      case 'weighted':
        return this.selectWeighted(availableTargets)

      default:
        return availableTargets[0]
    }
  }

  private selectRoundRobin(
    targets: LoadBalancingTarget[],
    state: { currentIndex: number; loads: Map<string, number> }
  ): LoadBalancingTarget {
    const target = targets[state.currentIndex % targets.length]
    state.currentIndex = (state.currentIndex + 1) % targets.length
    return target
  }

  private selectLeastActive(
    targets: LoadBalancingTarget[],
    state: { currentIndex: number; loads: Map<string, number> }
  ): LoadBalancingTarget {
    let leastActive = targets[0]
    let minLoad = state.loads.get(targets[0].id) || 0

    for (const target of targets) {
      const load = state.loads.get(target.id) || 0
      if (load < minLoad && (!target.maxCapacity || load < target.maxCapacity)) {
        minLoad = load
        leastActive = target
      }
    }

    // Increment load
    state.loads.set(leastActive.id, minLoad + 1)

    return leastActive
  }

  private selectRandom(targets: LoadBalancingTarget[]): LoadBalancingTarget {
    const index = Math.floor(Math.random() * targets.length)
    return targets[index]
  }

  private selectWeighted(targets: LoadBalancingTarget[]): LoadBalancingTarget {
    const totalWeight = targets.reduce((sum, t) => sum + (t.weight || 1), 0)
    let random = Math.random() * totalWeight

    for (const target of targets) {
      const weight = target.weight || 1
      if (random < weight) {
        return target
      }
      random -= weight
    }

    return targets[targets.length - 1]
  }

  /**
   * Release load for target
   */
  releaseTarget(targetId: string, key: string = 'default'): void {
    const state = this.loadBalancingState.get(key)
    if (state) {
      const currentLoad = state.loads.get(targetId) || 0
      state.loads.set(targetId, Math.max(0, currentLoad - 1))
    }
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Track rule match
   */
  private async trackMatch(ruleId: string): Promise<void> {
    await (this.supabase
      .from('routing_rules') as any)
      .update({
        last_matched_at: new Date().toISOString(),
      })
      .eq('id', ruleId)
  }

  /**
   * Clear rules cache
   */
  private clearRulesCache(tenantId: string): void {
    for (const key of this.rulesCache.keys()) {
      if (key.startsWith(tenantId)) {
        this.rulesCache.delete(key)
      }
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.rulesCache.clear()
    this.loadBalancingState.clear()
  }

  /**
   * Test rule against context
   */
  testRule(rule: RoutingRule, context: RoutingContext): boolean {
    return this.evaluateConditions(rule.conditions, context)
  }

  /**
   * Get rule statistics
   */
  async getRuleStats(ruleId: string): Promise<{
    matchCount: number
    lastMatchedAt?: Date
    enabled: boolean
  } | null> {
    const { data, error } = await (this.supabase
      .from('routing_rules') as any)
      .select('match_count, last_matched_at, enabled')
      .eq('id', ruleId)
      .single()

    if (error || !data) {
      return null
    }

    return {
      matchCount: data.match_count,
      lastMatchedAt: data.last_matched_at ? new Date(data.last_matched_at) : undefined,
      enabled: data.enabled,
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default RoutingEngine
