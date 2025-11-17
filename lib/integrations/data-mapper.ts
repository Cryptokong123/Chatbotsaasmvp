/**
 * Data Mapping Layer
 *
 * Field mapping, data transformation, schema translation between platforms
 */

import { EventEmitter } from 'events'

// ============================================================================
// TYPES
// ============================================================================

export type IntegrationType =
  | 'hubspot'
  | 'salesforce'
  | 'zendesk'
  | 'intercom'
  | 'slack'
  | 'whatsapp'
  | 'messenger'
  | 'instagram'
  | 'twitter'
  | 'telegram'
  | 'discord'
  | 'teams'
  | 'gmail'
  | 'outlook'
  | 'mailchimp'
  | 'sendgrid'
  | 'twilio'
  | 'shopify'
  | 'stripe'
  | 'paypal'
  | 'square'
  | 'calendly'
  | 'zoom'
  | 'jira'
  | 'asana'
  | 'trello'
  | 'notion'
  | 'airtable'
  | 'pipedrive'
  | 'freshdesk'
  | 'drift'
  | 'zendesk-sunshine'

export interface FieldMapping {
  sourceField: string
  targetField: string
  transform?: (value: any, context?: any) => any
  defaultValue?: any
  required?: boolean
  validation?: (value: any) => boolean
}

export interface MappingSchema {
  integrationType: IntegrationType
  entityType: 'contact' | 'conversation' | 'message' | 'ticket' | 'task' | 'event'
  fields: FieldMapping[]
  customMappings?: Record<string, FieldMapping>
  metadata?: Record<string, any>
}

export interface TransformResult<T = any> {
  success: boolean
  data?: T
  errors?: Array<{ field: string; message: string }>
  warnings?: Array<{ field: string; message: string }>
}

export interface MappingContext {
  direction: 'inbound' | 'outbound'
  integrationType: IntegrationType
  entityType: string
  sourceData: any
  metadata?: Record<string, any>
}

// ============================================================================
// DATA MAPPER
// ============================================================================

export class DataMapper extends EventEmitter {
  private schemas = new Map<string, MappingSchema>()
  private transformers = new Map<string, (value: any, context?: any) => any>()

  constructor() {
    super()
    this.registerBuiltInSchemas()
    this.registerBuiltInTransformers()
  }

  // ============================================================================
  // SCHEMA REGISTRATION
  // ============================================================================

  /**
   * Register mapping schema
   */
  registerSchema(schema: MappingSchema): void {
    const key = this.getSchemaKey(schema.integrationType, schema.entityType)
    this.schemas.set(key, schema)
    this.emit('schema:registered', { integrationType: schema.integrationType, entityType: schema.entityType })
  }

  /**
   * Get mapping schema
   */
  getSchema(integrationType: IntegrationType, entityType: string): MappingSchema | undefined {
    return this.schemas.get(this.getSchemaKey(integrationType, entityType))
  }

  /**
   * Register custom transformer
   */
  registerTransformer(name: string, transformer: (value: any, context?: any) => any): void {
    this.transformers.set(name, transformer)
  }

  // ============================================================================
  // MAPPING & TRANSFORMATION
  // ============================================================================

  /**
   * Map data from integration platform to internal schema
   */
  mapFromIntegration<T = any>(
    integrationType: IntegrationType,
    entityType: string,
    sourceData: any,
    customMappings?: FieldMapping[]
  ): TransformResult<T> {
    const context: MappingContext = {
      direction: 'inbound',
      integrationType,
      entityType,
      sourceData,
    }

    return this.transform(integrationType, entityType, sourceData, customMappings, context)
  }

  /**
   * Map data from internal schema to integration platform
   */
  mapToIntegration<T = any>(
    integrationType: IntegrationType,
    entityType: string,
    internalData: any,
    customMappings?: FieldMapping[]
  ): TransformResult<T> {
    const context: MappingContext = {
      direction: 'outbound',
      integrationType,
      entityType,
      sourceData: internalData,
    }

    return this.transform(integrationType, entityType, internalData, customMappings, context)
  }

  /**
   * Transform data using schema
   */
  private transform<T = any>(
    integrationType: IntegrationType,
    entityType: string,
    sourceData: any,
    customMappings: FieldMapping[] = [],
    context: MappingContext
  ): TransformResult<T> {
    const schema = this.getSchema(integrationType, entityType)

    if (!schema) {
      return {
        success: false,
        errors: [{ field: '_schema', message: `No schema found for ${integrationType}:${entityType}` }],
      }
    }

    const result: any = {}
    const errors: Array<{ field: string; message: string }> = []
    const warnings: Array<{ field: string; message: string }> = []

    // Merge schema mappings with custom mappings
    const allMappings = [...schema.fields, ...customMappings]

    for (const mapping of allMappings) {
      try {
        // Get source value
        let value = this.getNestedValue(sourceData, mapping.sourceField)

        // Check required fields
        if (mapping.required && (value === undefined || value === null)) {
          if (mapping.defaultValue !== undefined) {
            value = mapping.defaultValue
          } else {
            errors.push({
              field: mapping.targetField,
              message: `Required field ${mapping.sourceField} is missing`,
            })
            continue
          }
        }

        // Skip if no value and not required
        if (value === undefined || value === null) {
          if (mapping.defaultValue !== undefined) {
            value = mapping.defaultValue
          } else {
            continue
          }
        }

        // Apply transformation
        if (mapping.transform) {
          try {
            value = mapping.transform(value, context)
          } catch (error: any) {
            errors.push({
              field: mapping.targetField,
              message: `Transformation failed for ${mapping.sourceField}: ${error.message}`,
            })
            continue
          }
        }

        // Validate
        if (mapping.validation && !mapping.validation(value)) {
          warnings.push({
            field: mapping.targetField,
            message: `Validation failed for ${mapping.sourceField}`,
          })
        }

        // Set target value
        this.setNestedValue(result, mapping.targetField, value)
      } catch (error: any) {
        errors.push({
          field: mapping.targetField,
          message: `Error mapping ${mapping.sourceField}: ${error.message}`,
        })
      }
    }

    return {
      success: errors.length === 0,
      data: result as T,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  }

  // ============================================================================
  // BUILT-IN SCHEMAS
  // ============================================================================

  private registerBuiltInSchemas(): void {
    // HubSpot Contact Mapping
    this.registerSchema({
      integrationType: 'hubspot',
      entityType: 'contact',
      fields: [
        { sourceField: 'id', targetField: 'externalId', required: true },
        { sourceField: 'properties.email', targetField: 'email' },
        { sourceField: 'properties.phone', targetField: 'phone' },
        { sourceField: 'properties.firstname', targetField: 'firstName' },
        { sourceField: 'properties.lastname', targetField: 'lastName' },
        {
          sourceField: 'properties',
          targetField: 'fullName',
          transform: (props: any) => {
            const first = props.firstname || ''
            const last = props.lastname || ''
            return `${first} ${last}`.trim() || undefined
          },
        },
        { sourceField: 'properties.company', targetField: 'company' },
        { sourceField: 'properties.jobtitle', targetField: 'jobTitle' },
        { sourceField: 'properties.hs_avatar_filemanager_key', targetField: 'avatarUrl' },
        { sourceField: 'archived', targetField: 'isActive', transform: (v: boolean) => !v },
        {
          sourceField: 'createdAt',
          targetField: 'createdAt',
          transform: (v: string) => new Date(v),
        },
        {
          sourceField: 'updatedAt',
          targetField: 'updatedAt',
          transform: (v: string) => new Date(v),
        },
      ],
    })

    // Salesforce Contact Mapping
    this.registerSchema({
      integrationType: 'salesforce',
      entityType: 'contact',
      fields: [
        { sourceField: 'Id', targetField: 'externalId', required: true },
        { sourceField: 'Email', targetField: 'email' },
        { sourceField: 'Phone', targetField: 'phone' },
        { sourceField: 'FirstName', targetField: 'firstName' },
        { sourceField: 'LastName', targetField: 'lastName' },
        { sourceField: 'Name', targetField: 'fullName' },
        { sourceField: 'AccountId', targetField: 'company' },
        { sourceField: 'Title', targetField: 'jobTitle' },
        { sourceField: 'PhotoUrl', targetField: 'avatarUrl' },
        { sourceField: 'IsDeleted', targetField: 'isActive', transform: (v: boolean) => !v },
        {
          sourceField: 'CreatedDate',
          targetField: 'createdAt',
          transform: (v: string) => new Date(v),
        },
        {
          sourceField: 'LastModifiedDate',
          targetField: 'updatedAt',
          transform: (v: string) => new Date(v),
        },
      ],
    })

    // Zendesk Ticket Mapping
    this.registerSchema({
      integrationType: 'zendesk',
      entityType: 'conversation',
      fields: [
        { sourceField: 'id', targetField: 'externalId', required: true },
        { sourceField: 'subject', targetField: 'subject' },
        {
          sourceField: 'status',
          targetField: 'status',
          transform: (v: string) => {
            const statusMap: Record<string, string> = {
              new: 'open',
              open: 'open',
              pending: 'pending',
              solved: 'resolved',
              closed: 'closed',
            }
            return statusMap[v] || v
          },
        },
        {
          sourceField: 'priority',
          targetField: 'priority',
          transform: (v: string) => v?.toLowerCase(),
        },
        { sourceField: 'type', targetField: 'type', defaultValue: 'ticket' },
        { sourceField: 'assignee_id', targetField: 'assigneeExternalId' },
        { sourceField: 'group_id', targetField: 'teamId' },
        { sourceField: 'tags', targetField: 'tags', defaultValue: [] },
        {
          sourceField: 'created_at',
          targetField: 'createdAt',
          transform: (v: string) => new Date(v),
        },
        {
          sourceField: 'updated_at',
          targetField: 'updatedAt',
          transform: (v: string) => new Date(v),
        },
      ],
    })

    // Intercom Conversation Mapping
    this.registerSchema({
      integrationType: 'intercom',
      entityType: 'conversation',
      fields: [
        { sourceField: 'id', targetField: 'externalId', required: true },
        {
          sourceField: 'state',
          targetField: 'status',
          transform: (v: string) => {
            const statusMap: Record<string, string> = {
              open: 'open',
              closed: 'closed',
              snoozed: 'pending',
            }
            return statusMap[v] || v
          },
        },
        { sourceField: 'priority', targetField: 'priority' },
        { sourceField: 'source.type', targetField: 'type', defaultValue: 'chat' },
        { sourceField: 'assignee.id', targetField: 'assigneeExternalId' },
        { sourceField: 'team.id', targetField: 'teamId' },
        { sourceField: 'tags.tags', targetField: 'tags', transform: (v: any[]) => v?.map(t => t.name) || [] },
        { sourceField: 'conversation_message.total_count', targetField: 'messageCount', defaultValue: 0 },
        { sourceField: 'read', targetField: 'unreadCount', transform: (v: boolean) => (v ? 0 : 1) },
        {
          sourceField: 'created_at',
          targetField: 'createdAt',
          transform: (v: number) => new Date(v * 1000),
        },
        {
          sourceField: 'updated_at',
          targetField: 'updatedAt',
          transform: (v: number) => new Date(v * 1000),
        },
      ],
    })

    // Slack Message Mapping
    this.registerSchema({
      integrationType: 'slack',
      entityType: 'message',
      fields: [
        { sourceField: 'ts', targetField: 'externalId', required: true },
        { sourceField: 'channel', targetField: 'threadId' },
        {
          sourceField: 'type',
          targetField: 'direction',
          transform: (v: string, context?: any) => {
            // Determine direction based on user/bot
            return context?.sourceData?.bot_id ? 'outbound' : 'inbound'
          },
        },
        { sourceField: 'subtype', targetField: 'type', defaultValue: 'text' },
        { sourceField: 'user', targetField: 'senderExternalId' },
        { sourceField: 'text', targetField: 'body' },
        { sourceField: 'files', targetField: 'attachments', transform: this.mapSlackAttachments },
        { sourceField: 'reactions', targetField: 'reactions', transform: this.mapSlackReactions },
        {
          sourceField: 'ts',
          targetField: 'sentAt',
          transform: (v: string) => new Date(parseFloat(v) * 1000),
        },
      ],
    })

    // WhatsApp Message Mapping
    this.registerSchema({
      integrationType: 'whatsapp',
      entityType: 'message',
      fields: [
        { sourceField: 'id', targetField: 'externalId', required: true },
        { sourceField: 'from', targetField: 'senderExternalId' },
        { sourceField: 'to', targetField: 'recipientExternalId' },
        {
          sourceField: 'type',
          targetField: 'type',
          transform: (v: string) => {
            const typeMap: Record<string, string> = {
              text: 'text',
              image: 'image',
              video: 'video',
              audio: 'audio',
              document: 'file',
              location: 'location',
              template: 'template',
            }
            return typeMap[v] || v
          },
        },
        {
          sourceField: 'text.body',
          targetField: 'body',
        },
        {
          sourceField: 'image',
          targetField: 'attachments',
          transform: (v: any) => (v ? [{ type: 'image', url: v.link, id: v.id }] : []),
        },
        {
          sourceField: 'status',
          targetField: 'status',
          transform: (v: string) => {
            const statusMap: Record<string, string> = {
              sent: 'sent',
              delivered: 'delivered',
              read: 'read',
              failed: 'failed',
            }
            return statusMap[v] || v
          },
        },
        {
          sourceField: 'timestamp',
          targetField: 'sentAt',
          transform: (v: number) => new Date(v * 1000),
        },
      ],
    })

    // Messenger Message Mapping
    this.registerSchema({
      integrationType: 'messenger',
      entityType: 'message',
      fields: [
        { sourceField: 'mid', targetField: 'externalId', required: true },
        { sourceField: 'sender.id', targetField: 'senderExternalId' },
        { sourceField: 'recipient.id', targetField: 'recipientExternalId' },
        { sourceField: 'message.text', targetField: 'body' },
        {
          sourceField: 'message.attachments',
          targetField: 'attachments',
          transform: (v: any[]) =>
            v?.map(a => ({
              type: a.type,
              url: a.payload?.url,
            })) || [],
        },
        {
          sourceField: 'timestamp',
          targetField: 'sentAt',
          transform: (v: number) => new Date(v),
        },
      ],
    })

    // Gmail Message Mapping
    this.registerSchema({
      integrationType: 'gmail',
      entityType: 'message',
      fields: [
        { sourceField: 'id', targetField: 'externalId', required: true },
        { sourceField: 'threadId', targetField: 'threadId' },
        {
          sourceField: 'labelIds',
          targetField: 'direction',
          transform: (v: string[]) => (v?.includes('SENT') ? 'outbound' : 'inbound'),
        },
        { sourceField: 'payload.headers', targetField: 'subject', transform: this.extractGmailHeader('Subject') },
        { sourceField: 'payload.headers', targetField: 'senderEmail', transform: this.extractGmailHeader('From') },
        { sourceField: 'payload.headers', targetField: 'recipientEmail', transform: this.extractGmailHeader('To') },
        { sourceField: 'snippet', targetField: 'body' },
        {
          sourceField: 'internalDate',
          targetField: 'sentAt',
          transform: (v: string) => new Date(parseInt(v)),
        },
      ],
    })

    // Shopify Customer Mapping
    this.registerSchema({
      integrationType: 'shopify',
      entityType: 'contact',
      fields: [
        { sourceField: 'id', targetField: 'externalId', required: true },
        { sourceField: 'email', targetField: 'email' },
        { sourceField: 'phone', targetField: 'phone' },
        { sourceField: 'first_name', targetField: 'firstName' },
        { sourceField: 'last_name', targetField: 'lastName' },
        {
          sourceField: 'first_name',
          targetField: 'fullName',
          transform: (v: string, context?: any) => {
            const first = v || ''
            const last = context?.sourceData?.last_name || ''
            return `${first} ${last}`.trim() || undefined
          },
        },
        {
          sourceField: 'created_at',
          targetField: 'createdAt',
          transform: (v: string) => new Date(v),
        },
        {
          sourceField: 'updated_at',
          targetField: 'updatedAt',
          transform: (v: string) => new Date(v),
        },
      ],
    })

    // Stripe Customer Mapping
    this.registerSchema({
      integrationType: 'stripe',
      entityType: 'contact',
      fields: [
        { sourceField: 'id', targetField: 'externalId', required: true },
        { sourceField: 'email', targetField: 'email' },
        { sourceField: 'phone', targetField: 'phone' },
        { sourceField: 'name', targetField: 'fullName' },
        { sourceField: 'description', targetField: 'company' },
        {
          sourceField: 'created',
          targetField: 'createdAt',
          transform: (v: number) => new Date(v * 1000),
        },
      ],
    })

    // Twilio Message Mapping
    this.registerSchema({
      integrationType: 'twilio',
      entityType: 'message',
      fields: [
        { sourceField: 'sid', targetField: 'externalId', required: true },
        {
          sourceField: 'direction',
          targetField: 'direction',
          transform: (v: string) => (v === 'outbound-api' ? 'outbound' : 'inbound'),
        },
        { sourceField: 'from', targetField: 'senderExternalId' },
        { sourceField: 'to', targetField: 'recipientExternalId' },
        { sourceField: 'body', targetField: 'body' },
        {
          sourceField: 'status',
          targetField: 'status',
          transform: (v: string) => {
            const statusMap: Record<string, string> = {
              queued: 'pending',
              sending: 'pending',
              sent: 'sent',
              delivered: 'delivered',
              failed: 'failed',
              undelivered: 'failed',
            }
            return statusMap[v] || v
          },
        },
        {
          sourceField: 'date_sent',
          targetField: 'sentAt',
          transform: (v: string) => (v ? new Date(v) : undefined),
        },
      ],
    })
  }

  // ============================================================================
  // BUILT-IN TRANSFORMERS
  // ============================================================================

  private registerBuiltInTransformers(): void {
    // Date transformers
    this.registerTransformer('toDate', (value: any) => {
      if (!value) return undefined
      if (value instanceof Date) return value
      if (typeof value === 'number') return new Date(value)
      if (typeof value === 'string') return new Date(value)
      return undefined
    })

    this.registerTransformer('toUnixTimestamp', (value: any) => {
      if (!value) return undefined
      const date = value instanceof Date ? value : new Date(value)
      return Math.floor(date.getTime() / 1000)
    })

    // String transformers
    this.registerTransformer('toLowerCase', (value: string) => value?.toLowerCase())
    this.registerTransformer('toUpperCase', (value: string) => value?.toUpperCase())
    this.registerTransformer('trim', (value: string) => value?.trim())

    // Array transformers
    this.registerTransformer('toArray', (value: any) => {
      if (!value) return []
      if (Array.isArray(value)) return value
      return [value]
    })

    this.registerTransformer('joinArray', (value: any[], separator = ', ') => {
      if (!Array.isArray(value)) return value
      return value.join(separator)
    })

    // Boolean transformers
    this.registerTransformer('toBoolean', (value: any) => {
      if (typeof value === 'boolean') return value
      if (typeof value === 'string') return value.toLowerCase() === 'true'
      return Boolean(value)
    })

    this.registerTransformer('invertBoolean', (value: boolean) => !value)

    // Number transformers
    this.registerTransformer('toNumber', (value: any) => {
      if (typeof value === 'number') return value
      const parsed = parseFloat(value)
      return isNaN(parsed) ? undefined : parsed
    })

    this.registerTransformer('toInteger', (value: any) => {
      if (typeof value === 'number') return Math.floor(value)
      const parsed = parseInt(value)
      return isNaN(parsed) ? undefined : parsed
    })
  }

  // ============================================================================
  // HELPER TRANSFORMERS
  // ============================================================================

  private mapSlackAttachments(files: any[]): any[] {
    if (!files) return []
    return files.map(f => ({
      type: f.mimetype?.startsWith('image/') ? 'image' : 'file',
      url: f.url_private || f.permalink,
      name: f.name,
      size: f.size,
      mimeType: f.mimetype,
      thumbnailUrl: f.thumb_360,
    }))
  }

  private mapSlackReactions(reactions: any[]): any[] {
    if (!reactions) return []
    return reactions.flatMap(r =>
      r.users.map((userId: string) => ({
        emoji: r.name,
        userExternalId: userId,
        createdAt: new Date(),
      }))
    )
  }

  private extractGmailHeader(headerName: string): (headers: any[]) => string | undefined {
    return (headers: any[]) => {
      if (!headers) return undefined
      const header = headers.find(h => h.name === headerName)
      return header?.value
    }
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * Set nested value in object using dot notation
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {}
      return current[key]
    }, obj)
    target[lastKey] = value
  }

  /**
   * Get schema key
   */
  private getSchemaKey(integrationType: IntegrationType, entityType: string): string {
    return `${integrationType}:${entityType}`
  }

  /**
   * Validate mapped data
   */
  validateMappedData(data: any, requiredFields: string[]): {
    valid: boolean
    missingFields: string[]
  } {
    const missingFields: string[] = []

    for (const field of requiredFields) {
      if (this.getNestedValue(data, field) === undefined) {
        missingFields.push(field)
      }
    }

    return {
      valid: missingFields.length === 0,
      missingFields,
    }
  }

  /**
   * Merge custom fields
   */
  mergeCustomFields(
    baseData: Record<string, any>,
    customFields: Record<string, any>
  ): Record<string, any> {
    return {
      ...baseData,
      customFields: {
        ...(baseData.customFields || {}),
        ...customFields,
      },
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default DataMapper
