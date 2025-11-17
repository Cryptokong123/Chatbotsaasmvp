/**
 * Template System
 *
 * Message templates, dynamic variable substitution, conditional logic, template versioning
 */

import { EventEmitter } from 'events'
import { createClient } from '@supabase/supabase-js'

// ============================================================================
// TYPES
// ============================================================================

export interface Template {
  id: string
  tenantId?: string
  instanceId?: string
  integrationType?: string
  name: string
  slug: string
  description?: string
  category?: string
  language: string
  type: 'text' | 'html' | 'markdown' | 'whatsapp' | 'email' | 'card' | 'button'
  status: 'draft' | 'active' | 'archived'
  content: string
  subject?: string
  variables: TemplateVariable[]
  conditionals?: TemplateConditional[]
  buttons?: TemplateButton[]
  attachments?: TemplateAttachment[]
  metadata?: Record<string, any>
  tags: string[]
  version: number
  isDefault: boolean
  usageCount: number
  lastUsedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface TemplateVariable {
  name: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'
  required: boolean
  defaultValue?: any
  description?: string
  example?: any
  validation?: {
    pattern?: string
    min?: number
    max?: number
    enum?: any[]
  }
}

export interface TemplateConditional {
  condition: string // e.g., "user.isPremium === true"
  content: string
  fallback?: string
}

export interface TemplateButton {
  text: string
  type: 'url' | 'phone' | 'quick_reply' | 'postback'
  value: string
  url?: string
}

export interface TemplateAttachment {
  type: 'image' | 'video' | 'audio' | 'file'
  url: string
  name?: string
}

export interface RenderOptions {
  stripUndefined?: boolean
  escapeHtml?: boolean
  failOnMissing?: boolean
}

export interface RenderResult {
  success: boolean
  content?: string
  subject?: string
  buttons?: TemplateButton[]
  attachments?: TemplateAttachment[]
  variables?: Record<string, any>
  errors?: Array<{ field: string; message: string }>
}

// ============================================================================
// TEMPLATE ENGINE
// ============================================================================

export class TemplateEngine extends EventEmitter {
  private supabase: ReturnType<typeof createClient>
  private templateCache = new Map<string, Template>()
  private customFilters = new Map<string, (value: any, ...args: any[]) => any>()

  constructor(supabaseUrl: string, supabaseKey: string) {
    super()
    this.supabase = createClient(supabaseUrl, supabaseKey)
    this.registerBuiltInFilters()
  }

  // ============================================================================
  // TEMPLATE MANAGEMENT
  // ============================================================================

  /**
   * Create template
   */
  async createTemplate(template: Omit<Template, 'id' | 'version' | 'usageCount' | 'createdAt' | 'updatedAt'>): Promise<Template> {
    // Validate template
    const validation = this.validateTemplate(template as Template)
    if (!validation.valid) {
      throw new Error(`Invalid template: ${validation.errors?.join(', ')}`)
    }

    const { data, error } = await this.supabase
      .from('integration_templates')
      .insert({
        tenant_id: template.tenantId,
        instance_id: template.instanceId,
        integration_type: template.integrationType,
        name: template.name,
        slug: template.slug,
        description: template.description,
        category: template.category,
        language: template.language || 'en',
        type: template.type,
        status: template.status || 'draft',
        content: template.content,
        subject: template.subject,
        variables: template.variables || [],
        conditionals: template.conditionals,
        buttons: template.buttons,
        attachments: template.attachments,
        metadata: template.metadata,
        tags: template.tags || [],
        version: 1,
        is_default: template.isDefault ?? false,
        usage_count: 0,
      })
      .select()
      .single()

    if (error) throw error

    this.cacheTemplate(data as Template)
    this.emit('template:created', data)

    return data as Template
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<Template | null> {
    // Check cache
    const cached = this.templateCache.get(templateId)
    if (cached) {
      return cached
    }

    const { data, error } = await this.supabase
      .from('integration_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (error || !data) {
      return null
    }

    this.cacheTemplate(data as Template)
    return data as Template
  }

  /**
   * Get template by slug
   */
  async getTemplateBySlug(slug: string, tenantId?: string): Promise<Template | null> {
    let query = this.supabase
      .from('integration_templates')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')

    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }

    const { data, error } = await query.single()

    if (error || !data) {
      return null
    }

    this.cacheTemplate(data as Template)
    return data as Template
  }

  /**
   * Update template
   */
  async updateTemplate(templateId: string, updates: Partial<Template>): Promise<Template> {
    const { data, error } = await this.supabase
      .from('integration_templates')
      .update({
        name: updates.name,
        description: updates.description,
        category: updates.category,
        language: updates.language,
        type: updates.type,
        status: updates.status,
        content: updates.content,
        subject: updates.subject,
        variables: updates.variables,
        conditionals: updates.conditionals,
        buttons: updates.buttons,
        attachments: updates.attachments,
        metadata: updates.metadata,
        tags: updates.tags,
        is_default: updates.isDefault,
      })
      .eq('id', templateId)
      .select()
      .single()

    if (error) throw error

    // Clear cache
    this.templateCache.delete(templateId)

    this.emit('template:updated', data)
    return data as Template
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('integration_templates')
      .delete()
      .eq('id', templateId)

    if (error) throw error

    this.templateCache.delete(templateId)
    this.emit('template:deleted', { templateId })

    return true
  }

  /**
   * List templates
   */
  async listTemplates(filter: {
    tenantId?: string
    instanceId?: string
    integrationType?: string
    category?: string
    type?: Template['type']
    status?: Template['status']
    language?: string
    tags?: string[]
  } = {}, options: {
    limit?: number
    offset?: number
    sortBy?: 'name' | 'created_at' | 'usage_count'
    sortOrder?: 'asc' | 'desc'
  } = {}): Promise<Template[]> {
    let query = this.supabase.from('integration_templates').select('*')

    if (filter.tenantId) query = query.eq('tenant_id', filter.tenantId)
    if (filter.instanceId) query = query.eq('instance_id', filter.instanceId)
    if (filter.integrationType) query = query.eq('integration_type', filter.integrationType)
    if (filter.category) query = query.eq('category', filter.category)
    if (filter.type) query = query.eq('type', filter.type)
    if (filter.status) query = query.eq('status', filter.status)
    if (filter.language) query = query.eq('language', filter.language)
    if (filter.tags && filter.tags.length > 0) query = query.contains('tags', filter.tags)

    const sortBy = options.sortBy || 'created_at'
    const sortOrder = options.sortOrder || 'desc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    if (options.limit) query = query.limit(options.limit)
    if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1)

    const { data, error } = await query

    if (error) throw error

    return data as Template[]
  }

  // ============================================================================
  // TEMPLATE RENDERING
  // ============================================================================

  /**
   * Render template
   */
  async render(
    templateId: string,
    variables: Record<string, any> = {},
    options: RenderOptions = {}
  ): Promise<RenderResult> {
    const template = await this.getTemplate(templateId)

    if (!template) {
      return {
        success: false,
        errors: [{ field: 'template', message: 'Template not found' }],
      }
    }

    return this.renderTemplate(template, variables, options)
  }

  /**
   * Render template by slug
   */
  async renderBySlug(
    slug: string,
    variables: Record<string, any> = {},
    tenantId?: string,
    options: RenderOptions = {}
  ): Promise<RenderResult> {
    const template = await this.getTemplateBySlug(slug, tenantId)

    if (!template) {
      return {
        success: false,
        errors: [{ field: 'template', message: 'Template not found' }],
      }
    }

    return this.renderTemplate(template, variables, options)
  }

  /**
   * Render template content
   */
  private renderTemplate(
    template: Template,
    variables: Record<string, any>,
    options: RenderOptions = {}
  ): RenderResult {
    const errors: Array<{ field: string; message: string }> = []

    // Validate required variables
    for (const variable of template.variables) {
      if (variable.required && !(variable.name in variables)) {
        if (variable.defaultValue !== undefined) {
          variables[variable.name] = variable.defaultValue
        } else if (options.failOnMissing) {
          errors.push({
            field: variable.name,
            message: `Required variable ${variable.name} is missing`,
          })
        }
      }

      // Apply default values
      if (!(variable.name in variables) && variable.defaultValue !== undefined) {
        variables[variable.name] = variable.defaultValue
      }

      // Validate variable
      if (variable.name in variables && variable.validation) {
        const value = variables[variable.name]
        const validation = variable.validation

        if (validation.pattern) {
          const regex = new RegExp(validation.pattern)
          if (!regex.test(String(value))) {
            errors.push({
              field: variable.name,
              message: `Variable ${variable.name} does not match pattern ${validation.pattern}`,
            })
          }
        }

        if (validation.min !== undefined && value < validation.min) {
          errors.push({
            field: variable.name,
            message: `Variable ${variable.name} must be >= ${validation.min}`,
          })
        }

        if (validation.max !== undefined && value > validation.max) {
          errors.push({
            field: variable.name,
            message: `Variable ${variable.name} must be <= ${validation.max}`,
          })
        }

        if (validation.enum && !validation.enum.includes(value)) {
          errors.push({
            field: variable.name,
            message: `Variable ${variable.name} must be one of: ${validation.enum.join(', ')}`,
          })
        }
      }
    }

    if (errors.length > 0 && options.failOnMissing) {
      return { success: false, errors }
    }

    // Render content
    try {
      let content = template.content
      let subject = template.subject

      // Process conditionals
      if (template.conditionals) {
        for (const conditional of template.conditionals) {
          const result = this.evaluateCondition(conditional.condition, variables)
          const replacement = result ? conditional.content : (conditional.fallback || '')
          content = content.replace(`{#if ${conditional.condition}}`, replacement)
        }
      }

      // Replace variables
      content = this.replaceVariables(content, variables, options)
      if (subject) {
        subject = this.replaceVariables(subject, variables, options)
      }

      // Render buttons with variables
      const buttons = template.buttons?.map(button => ({
        ...button,
        text: this.replaceVariables(button.text, variables, options),
        value: this.replaceVariables(button.value, variables, options),
        url: button.url ? this.replaceVariables(button.url, variables, options) : undefined,
      }))

      // Render attachments with variables
      const attachments = template.attachments?.map(attachment => ({
        ...attachment,
        url: this.replaceVariables(attachment.url, variables, options),
      }))

      // Track usage
      this.trackUsage(template.id).catch(console.error)

      this.emit('template:rendered', { templateId: template.id, slug: template.slug })

      return {
        success: true,
        content: options.escapeHtml ? this.escapeHtml(content) : content,
        subject,
        buttons,
        attachments,
        variables,
        errors: errors.length > 0 ? errors : undefined,
      }
    } catch (error: any) {
      return {
        success: false,
        errors: [{ field: 'render', message: error.message }],
      }
    }
  }

  /**
   * Replace variables in text
   */
  private replaceVariables(
    text: string,
    variables: Record<string, any>,
    options: RenderOptions
  ): string {
    // Replace {{variable}} and {{variable|filter:arg}}
    return text.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      const parts = expression.trim().split('|')
      const variablePath = parts[0].trim()
      let value = this.getNestedValue(variables, variablePath)

      // Apply filters
      for (let i = 1; i < parts.length; i++) {
        const filterParts = parts[i].trim().split(':')
        const filterName = filterParts[0]
        const filterArgs = filterParts.slice(1)

        const filter = this.customFilters.get(filterName)
        if (filter) {
          value = filter(value, ...filterArgs)
        }
      }

      // Handle undefined values
      if (value === undefined || value === null) {
        if (options.stripUndefined) {
          return ''
        }
        return match
      }

      return String(value)
    })
  }

  /**
   * Evaluate conditional expression
   */
  private evaluateCondition(condition: string, variables: Record<string, any>): boolean {
    try {
      // Replace variable references
      const expression = condition.replace(/([a-zA-Z_][a-zA-Z0-9_.]*)/g, (match) => {
        const value = this.getNestedValue(variables, match)
        if (typeof value === 'string') {
          return `"${value}"`
        }
        return String(value)
      })

      // Safely evaluate (limited to simple comparisons)
      const allowed = /^[\d\s"'<>=!&|()+-/*%.]+$/
      if (!allowed.test(expression)) {
        console.warn('Unsafe conditional expression:', condition)
        return false
      }

      // eslint-disable-next-line no-eval
      return eval(expression)
    } catch (error) {
      console.error('Error evaluating condition:', error)
      return false
    }
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * Escape HTML
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }
    return text.replace(/[&<>"']/g, m => map[m])
  }

  // ============================================================================
  // FILTERS
  // ============================================================================

  /**
   * Register custom filter
   */
  registerFilter(name: string, filter: (value: any, ...args: any[]) => any): void {
    this.customFilters.set(name, filter)
  }

  /**
   * Register built-in filters
   */
  private registerBuiltInFilters(): void {
    // String filters
    this.registerFilter('upper', (value: string) => value?.toUpperCase())
    this.registerFilter('lower', (value: string) => value?.toLowerCase())
    this.registerFilter('capitalize', (value: string) =>
      value?.charAt(0).toUpperCase() + value?.slice(1).toLowerCase()
    )
    this.registerFilter('trim', (value: string) => value?.trim())

    // Number filters
    this.registerFilter('round', (value: number, decimals: string = '0') =>
      Number(value).toFixed(parseInt(decimals))
    )
    this.registerFilter('currency', (value: number, currency: string = 'USD') =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value)
    )

    // Date filters
    this.registerFilter('date', (value: Date | string, format: string = 'short') => {
      const date = new Date(value)
      if (format === 'short') return date.toLocaleDateString()
      if (format === 'long') return date.toLocaleDateString('en-US', { dateStyle: 'full' })
      if (format === 'iso') return date.toISOString()
      return date.toDateString()
    })

    this.registerFilter('time', (value: Date | string) => {
      const date = new Date(value)
      return date.toLocaleTimeString()
    })

    this.registerFilter('relative', (value: Date | string) => {
      const date = new Date(value)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'just now'
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
      if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
      return date.toLocaleDateString()
    })

    // Array filters
    this.registerFilter('join', (value: any[], separator: string = ', ') =>
      Array.isArray(value) ? value.join(separator) : value
    )
    this.registerFilter('first', (value: any[]) => (Array.isArray(value) ? value[0] : value))
    this.registerFilter('last', (value: any[]) =>
      Array.isArray(value) ? value[value.length - 1] : value
    )
    this.registerFilter('length', (value: any[] | string) => value?.length || 0)

    // Default value filter
    this.registerFilter('default', (value: any, defaultValue: string) =>
      value !== undefined && value !== null && value !== '' ? value : defaultValue
    )
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  /**
   * Validate template
   */
  validateTemplate(template: Partial<Template>): {
    valid: boolean
    errors?: string[]
  } {
    const errors: string[] = []

    if (!template.name) {
      errors.push('Template name is required')
    }

    if (!template.slug) {
      errors.push('Template slug is required')
    }

    if (!template.content) {
      errors.push('Template content is required')
    }

    if (!template.type) {
      errors.push('Template type is required')
    }

    if (!template.language) {
      errors.push('Template language is required')
    }

    // Validate variables in content match declared variables
    if (template.content && template.variables) {
      const declaredVars = new Set(template.variables.map(v => v.name))
      const usedVars = this.extractVariables(template.content)

      for (const usedVar of usedVars) {
        if (!declaredVars.has(usedVar)) {
          errors.push(`Variable {{${usedVar}}} used but not declared`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  /**
   * Extract variables from template content
   */
  private extractVariables(content: string): string[] {
    const matches = content.matchAll(/\{\{([^}|]+)/g)
    const variables = new Set<string>()

    for (const match of matches) {
      const variable = match[1].trim()
      variables.add(variable)
    }

    return Array.from(variables)
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Track template usage
   */
  private async trackUsage(templateId: string): Promise<void> {
    await this.supabase
      .from('integration_templates')
      .update({
        usage_count: this.supabase.raw('usage_count + 1'),
        last_used_at: new Date().toISOString(),
      })
      .eq('id', templateId)
  }

  /**
   * Cache template
   */
  private cacheTemplate(template: Template): void {
    this.templateCache.set(template.id, template)

    // Limit cache size
    if (this.templateCache.size > 1000) {
      const firstKey = this.templateCache.keys().next().value
      this.templateCache.delete(firstKey)
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.templateCache.clear()
  }

  /**
   * Clone template
   */
  async cloneTemplate(templateId: string, newName: string, newSlug: string): Promise<Template> {
    const template = await this.getTemplate(templateId)

    if (!template) {
      throw new Error('Template not found')
    }

    return this.createTemplate({
      ...template,
      name: newName,
      slug: newSlug,
      status: 'draft',
      isDefault: false,
    })
  }

  /**
   * Preview template
   */
  async preview(templateId: string, sampleVariables: Record<string, any>): Promise<RenderResult> {
    return this.render(templateId, sampleVariables, { stripUndefined: false })
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default TemplateEngine
