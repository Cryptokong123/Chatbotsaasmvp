/**
 * Zendesk Sunshine Adapter
 *
 * Custom CRM platform built on Zendesk:
 * - Customer profiles with custom data
 * - Custom objects and relationships
 * - Events and timelines
 * - Integration with Support/Sell
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export interface SunshineProfile {
  type: string
  identifier_type: string
  identifier_value: string
  attributes?: Record<string, any>
  created_at?: string
  updated_at?: string
}

export interface SunshineCustomObject {
  type: string
  external_id?: string
  attributes: Record<string, any>
  created_at?: string
  updated_at?: string
  id?: string
}

export interface SunshineEvent {
  profile: { type: string; identifier_type: string; identifier_value: string }
  type: string
  source: string
  description?: string
  properties?: Record<string, any>
  created_at?: string
  received_at?: string
}

export interface SunshineObjectType {
  key: string
  schema: {
    properties: Record<string, {
      type: 'string' | 'number' | 'boolean' | 'object' | 'array'
      description?: string
      items?: any
    }>
    required?: string[]
  }
  end_user_conditions?: {
    all?: Array<{ field: string; operator: string; value: any }>
    any?: Array<{ field: string; operator: string; value: any }>
  }
  created_at?: string
  updated_at?: string
}

export interface SunshineRelationshipType {
  key: string
  source: string
  target: string
  created_at?: string
  updated_at?: string
}

export interface SunshineRelationship {
  id?: string
  relationship_type: string
  source: string
  target: string
  created_at?: string
}

export interface SunshinePermission {
  id?: string
  type: 'user' | 'organization' | 'group'
  assignee_id: string
  object_type?: string
  object_id?: string
  action: 'read' | 'write' | 'delete'
}

export interface SunshineJob {
  id?: string
  status: 'queued' | 'working' | 'completed' | 'failed' | 'killed'
  action: string
  progress?: number
  message?: string
  results?: any
  errors?: any[]
  created_at?: string
  updated_at?: string
  completed_at?: string
}

export interface SunshineLimit {
  profile_types: number
  object_types: number
  relationship_types: number
  profiles_per_type: number
  objects_per_type: number
}

export interface SunshineProfileType {
  key: string
  name: string
  description?: string
  icon?: string
  created_at?: string
  updated_at?: string
}

export interface SunshineBulkOperation {
  id?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  operation: 'create' | 'update' | 'delete'
  resource_type: 'profile' | 'object' | 'relationship'
  total_count?: number
  processed_count?: number
  success_count?: number
  error_count?: number
  errors?: Array<{ index: number; message: string }>
  created_at?: string
  completed_at?: string
}

export interface SunshineSegment {
  id?: string
  name: string
  description?: string
  profile_type: string
  conditions: {
    all?: Array<{ field: string; operator: string; value: any }>
    any?: Array<{ field: string; operator: string; value: any }>
  }
  count?: number
  created_at?: string
  updated_at?: string
}

export interface SunshineTag {
  id?: string
  name: string
  category?: string
  color?: string
  created_at?: string
}

export interface SunshineNote {
  id?: string
  profile_type: string
  profile_identifier_type: string
  profile_identifier_value: string
  content: string
  author_id?: string
  created_at?: string
  updated_at?: string
}

export interface SunshineAttachment {
  id?: string
  filename: string
  content_type: string
  size: number
  url?: string
  inline?: boolean
  created_at?: string
}

export interface SunshineActivity {
  id?: string
  type: string
  actor_id?: string
  target_type: string
  target_id: string
  action: string
  description?: string
  metadata?: Record<string, any>
  created_at?: string
}

export interface SunshineProfileTimeline {
  profile: SunshineProfile
  events: SunshineEvent[]
  activities: SunshineActivity[]
  notes: SunshineNote[]
  relationships: SunshineRelationship[]
}

export interface SunshineQueryBuilder {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith'
  value: any
}

export interface SunshineMergeCandidate {
  profile1: SunshineProfile
  profile2: SunshineProfile
  confidence_score: number
  matching_fields: string[]
  suggested_master?: string
}

export interface SunshineDataExport {
  id?: string
  export_type: 'profiles' | 'objects' | 'events' | 'relationships'
  format: 'json' | 'csv'
  filters?: Record<string, any>
  status: 'pending' | 'processing' | 'completed' | 'failed'
  download_url?: string
  expires_at?: string
  created_at?: string
}

export interface SunshineDataImport {
  id?: string
  import_type: 'profiles' | 'objects'
  format: 'json' | 'csv'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  total_records?: number
  imported_records?: number
  failed_records?: number
  errors?: Array<{ line: number; message: string }>
  created_at?: string
}

export interface SunshineWebhook {
  id?: string
  url: string
  status: 'active' | 'inactive'
  event_types: string[]
  signing_secret?: string
  created_at?: string
  updated_at?: string
}

export class ZendeskSunshineAdapter extends BaseIntegrationAdapter {
  private subdomain?: string
  private email?: string
  private apiToken?: string
  private baseUrl?: string

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: false, canReceiveMessages: false, canSendFiles: false, canSendImages: false,
      canSendVideo: false, canSendAudio: false, canSendLocation: false, canSendButtons: false,
      canSendCards: false, canSendCarousels: false, canSendQuickReplies: false, canSendTemplates: false,
      canScheduleMessages: false, canBroadcast: false, canTag: true, canAssign: false,
      canCreateTickets: false, canCreateLeads: false, canCreateContacts: true, canSyncContacts: true,
      canSyncConversations: false, canSyncTickets: false, canExportData: true, canImportData: true,
      canTrackEvents: true, canTrackMetrics: true, canGenerateReports: false, canCreateWorkflows: false,
      canTriggerActions: true, canListenToWebhooks: true, maxMessageLength: 0,
      maxFileSize: 0, maxBatchSize: 100, rateLimit: { messages: 600, period: 'per_minute' as const },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.subdomain = this.config.credentials.subdomain
    this.email = this.config.credentials.email
    this.apiToken = this.config.credentials.apiToken
    if (!this.subdomain || !this.email || !this.apiToken) {
      return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing credentials', retryable: false } }
    }
    this.baseUrl = `https://${this.subdomain}.zendesk.com/api/sunshine`
    this.isConnected = true
    return { success: true, data: undefined }
  }

  async disconnect(): Promise<IntegrationResponse<void>> {
    this.isConnected = false
    return { success: true, data: undefined }
  }

  async testConnection(): Promise<IntegrationResponse<boolean>> {
    try {
      await this.ensureConnected()
      const result = await this.getLimits()
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  private getHeaders(): Record<string, string> {
    const credentials = Buffer.from(`${this.email}/token:${this.apiToken}`).toString('base64')
    return { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/json' }
  }

  // ===========================
  // Profiles
  // ===========================

  async createProfile(profile: SunshineProfile): Promise<IntegrationResponse<SunshineProfile>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/profiles`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ profile }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.profile
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getProfile(type: string, identifierType: string, identifierValue: string): Promise<IntegrationResponse<SunshineProfile>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/profiles/${type}/${identifierType}/${identifierValue}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.profile
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateProfile(type: string, identifierType: string, identifierValue: string, attributes: Record<string, any>): Promise<IntegrationResponse<SunshineProfile>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/profiles/${type}/${identifierType}/${identifierValue}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({ profile: { attributes } }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.profile
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteProfile(type: string, identifierType: string, identifierValue: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/profiles/${type}/${identifierType}/${identifierValue}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listProfiles(params: { type: string; page_size?: number; page?: string }): Promise<IntegrationResponse<{ data: SunshineProfile[]; links?: any; meta?: any }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams({ type: params.type })
      if (params.page_size) query.set('page_size', params.page_size.toString())
      if (params.page) query.set('page', params.page)

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/profiles?${query}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async mergeProfiles(sourceType: string, sourceIdentifierType: string, sourceIdentifierValue: string, targetType: string, targetIdentifierType: string, targetIdentifierValue: string): Promise<IntegrationResponse<SunshineJob>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/profiles/merge`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            source_profile_id: `${sourceType}:${sourceIdentifierType}:${sourceIdentifierValue}`,
            target_profile_id: `${targetType}:${targetIdentifierType}:${targetIdentifierValue}`,
          }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.job
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Object Types
  // ===========================

  async createObjectType(objectType: SunshineObjectType): Promise<IntegrationResponse<SunshineObjectType>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/objects/types`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: objectType }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getObjectType(key: string): Promise<IntegrationResponse<SunshineObjectType>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/objects/types/${key}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listObjectTypes(): Promise<IntegrationResponse<{ data: SunshineObjectType[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/objects/types`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateObjectType(key: string, schema: SunshineObjectType['schema']): Promise<IntegrationResponse<SunshineObjectType>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/objects/types/${key}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: { schema } }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteObjectType(key: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/objects/types/${key}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Custom Objects
  // ===========================

  async createCustomObject(objectType: string, object: Partial<SunshineCustomObject>): Promise<IntegrationResponse<SunshineCustomObject>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/objects/records`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: { type: objectType, ...object } }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getCustomObject(objectType: string, objectId: string): Promise<IntegrationResponse<SunshineCustomObject>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/objects/records/${objectType}/${objectId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateCustomObject(objectType: string, objectId: string, attributes: Record<string, any>): Promise<IntegrationResponse<SunshineCustomObject>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/objects/records/${objectType}/${objectId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: { attributes } }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteCustomObject(objectType: string, objectId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/objects/records/${objectType}/${objectId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listCustomObjects(objectType: string, params?: { page_size?: number; page?: string }): Promise<IntegrationResponse<{ data: SunshineCustomObject[]; links?: any; meta?: any }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page_size) query.set('page_size', params.page_size.toString())
      if (params?.page) query.set('page', params.page)

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/objects/records?type=${objectType}${query.toString() ? `&${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async queryCustomObjects(objectType: string, query: string): Promise<IntegrationResponse<{ data: SunshineCustomObject[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/objects/query`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ type: objectType, query }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Relationship Types
  // ===========================

  async createRelationshipType(relationshipType: Omit<SunshineRelationshipType, 'created_at' | 'updated_at'>): Promise<IntegrationResponse<SunshineRelationshipType>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/relationships/types`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: relationshipType }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getRelationshipType(key: string): Promise<IntegrationResponse<SunshineRelationshipType>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/relationships/types/${key}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listRelationshipTypes(): Promise<IntegrationResponse<{ data: SunshineRelationshipType[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/relationships/types`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteRelationshipType(key: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/relationships/types/${key}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Relationships
  // ===========================

  async createRelationship(relationship: Omit<SunshineRelationship, 'id' | 'created_at'>): Promise<IntegrationResponse<SunshineRelationship>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/relationships/records`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: relationship }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getRelationship(relationshipId: string): Promise<IntegrationResponse<SunshineRelationship>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/relationships/records/${relationshipId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listRelationships(params?: { type?: string; source?: string; target?: string }): Promise<IntegrationResponse<{ data: SunshineRelationship[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.type) query.set('type', params.type)
      if (params?.source) query.set('source', params.source)
      if (params?.target) query.set('target', params.target)

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/relationships/records${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteRelationship(relationshipId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/relationships/records/${relationshipId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Events
  // ===========================

  async createEvent(event: Omit<SunshineEvent, 'created_at' | 'received_at'>): Promise<IntegrationResponse<SunshineEvent>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/events`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ event }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.event
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listEvents(profileType: string, identifierType: string, identifierValue: string, params?: { type?: string; page_size?: number }): Promise<IntegrationResponse<{ data: SunshineEvent[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.type) query.set('type', params.type)
      if (params?.page_size) query.set('page_size', params.page_size.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/profiles/${profileType}/${identifierType}/${identifierValue}/events${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Permissions
  // ===========================

  async createPermission(permission: Omit<SunshinePermission, 'id'>): Promise<IntegrationResponse<SunshinePermission>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/permissions`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: permission }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listPermissions(params?: { type?: string; assignee_id?: string }): Promise<IntegrationResponse<{ data: SunshinePermission[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.type) query.set('type', params.type)
      if (params?.assignee_id) query.set('assignee_id', params.assignee_id)

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/permissions${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deletePermission(permissionId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/permissions/${permissionId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Jobs
  // ===========================

  async getJob(jobId: string): Promise<IntegrationResponse<SunshineJob>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/jobs/${jobId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.job
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listJobs(): Promise<IntegrationResponse<{ jobs: SunshineJob[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/jobs`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Limits
  // ===========================

  async getLimits(): Promise<IntegrationResponse<SunshineLimit>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/limits`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Profile Types
  // ===========================

  async createProfileType(profileType: Omit<SunshineProfileType, 'created_at' | 'updated_at'>): Promise<IntegrationResponse<SunshineProfileType>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/profile_types`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: profileType }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getProfileType(key: string): Promise<IntegrationResponse<SunshineProfileType>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/profile_types/${key}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listProfileTypes(): Promise<IntegrationResponse<{ data: SunshineProfileType[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/profile_types`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateProfileType(key: string, updates: Partial<Omit<SunshineProfileType, 'key' | 'created_at' | 'updated_at'>>): Promise<IntegrationResponse<SunshineProfileType>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/profile_types/${key}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: updates }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteProfileType(key: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/profile_types/${key}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Bulk Operations
  // ===========================

  async bulkCreateProfiles(profiles: SunshineProfile[]): Promise<IntegrationResponse<SunshineBulkOperation>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/profiles/bulk_create`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ profiles }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.operation
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async bulkUpdateProfiles(updates: Array<{ type: string; identifier_type: string; identifier_value: string; attributes: Record<string, any> }>): Promise<IntegrationResponse<SunshineBulkOperation>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/profiles/bulk_update`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ updates }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.operation
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async bulkDeleteProfiles(profileIds: Array<{ type: string; identifier_type: string; identifier_value: string }>): Promise<IntegrationResponse<SunshineBulkOperation>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/profiles/bulk_delete`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ profile_ids: profileIds }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.operation
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async bulkCreateObjects(objectType: string, objects: Array<Partial<SunshineCustomObject>>): Promise<IntegrationResponse<SunshineBulkOperation>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/objects/records/bulk_create`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ type: objectType, objects }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.operation
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getBulkOperation(operationId: string): Promise<IntegrationResponse<SunshineBulkOperation>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/bulk_operations/${operationId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.operation
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Segments
  // ===========================

  async createSegment(segment: Omit<SunshineSegment, 'id' | 'count' | 'created_at' | 'updated_at'>): Promise<IntegrationResponse<SunshineSegment>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/segments`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: segment }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getSegment(segmentId: string): Promise<IntegrationResponse<SunshineSegment>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/segments/${segmentId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listSegments(params?: { profile_type?: string }): Promise<IntegrationResponse<{ data: SunshineSegment[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.profile_type) query.set('profile_type', params.profile_type)

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/segments${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateSegment(segmentId: string, updates: Partial<Omit<SunshineSegment, 'id' | 'count' | 'created_at' | 'updated_at'>>): Promise<IntegrationResponse<SunshineSegment>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/segments/${segmentId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: updates }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteSegment(segmentId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/segments/${segmentId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getSegmentProfiles(segmentId: string, params?: { page_size?: number; page?: string }): Promise<IntegrationResponse<{ data: SunshineProfile[]; links?: any; meta?: any }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.page_size) query.set('page_size', params.page_size.toString())
      if (params?.page) query.set('page', params.page)

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/segments/${segmentId}/profiles${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Tags
  // ===========================

  async createTag(tag: Omit<SunshineTag, 'id' | 'created_at'>): Promise<IntegrationResponse<SunshineTag>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tags`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: tag }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listTags(params?: { category?: string }): Promise<IntegrationResponse<{ data: SunshineTag[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.category) query.set('category', params.category)

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tags${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async addTagsToProfile(profileType: string, identifierType: string, identifierValue: string, tagIds: string[]): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/profiles/${profileType}/${identifierType}/${identifierValue}/tags`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ tag_ids: tagIds }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async removeTagsFromProfile(profileType: string, identifierType: string, identifierValue: string, tagIds: string[]): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/profiles/${profileType}/${identifierType}/${identifierValue}/tags`, {
          method: 'DELETE',
          headers: this.getHeaders(),
          body: JSON.stringify({ tag_ids: tagIds }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getProfileTags(profileType: string, identifierType: string, identifierValue: string): Promise<IntegrationResponse<{ data: SunshineTag[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/profiles/${profileType}/${identifierType}/${identifierValue}/tags`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Notes
  // ===========================

  async createNote(note: Omit<SunshineNote, 'id' | 'created_at' | 'updated_at'>): Promise<IntegrationResponse<SunshineNote>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/notes`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: note }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getNote(noteId: string): Promise<IntegrationResponse<SunshineNote>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/notes/${noteId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listProfileNotes(profileType: string, identifierType: string, identifierValue: string): Promise<IntegrationResponse<{ data: SunshineNote[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/profiles/${profileType}/${identifierType}/${identifierValue}/notes`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateNote(noteId: string, content: string): Promise<IntegrationResponse<SunshineNote>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/notes/${noteId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: { content } }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteNote(noteId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/notes/${noteId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Attachments
  // ===========================

  async uploadAttachment(file: { filename: string; content_type: string; data: Buffer | Blob }): Promise<IntegrationResponse<SunshineAttachment>> {
    try {
      await this.ensureConnected()
      const formData = new FormData()
      const fileBlob = file.data instanceof Buffer ? new Blob([file.data as any], { type: file.content_type }) : file.data
      formData.append('file', fileBlob as Blob, file.filename)

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/attachments`, {
          method: 'POST',
          headers: {
            'Authorization': this.getHeaders()['Authorization'],
          },
          body: formData,
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getAttachment(attachmentId: string): Promise<IntegrationResponse<SunshineAttachment>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/attachments/${attachmentId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteAttachment(attachmentId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/attachments/${attachmentId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async attachToProfile(profileType: string, identifierType: string, identifierValue: string, attachmentIds: string[]): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/profiles/${profileType}/${identifierType}/${identifierValue}/attachments`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ attachment_ids: attachmentIds }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Activities
  // ===========================

  async createActivity(activity: Omit<SunshineActivity, 'id' | 'created_at'>): Promise<IntegrationResponse<SunshineActivity>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/activities`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: activity }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listActivities(params?: { target_type?: string; target_id?: string; type?: string; page_size?: number }): Promise<IntegrationResponse<{ data: SunshineActivity[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.target_type) query.set('target_type', params.target_type)
      if (params?.target_id) query.set('target_id', params.target_id)
      if (params?.type) query.set('type', params.type)
      if (params?.page_size) query.set('page_size', params.page_size.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/activities${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getActivity(activityId: string): Promise<IntegrationResponse<SunshineActivity>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/activities/${activityId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Profile Timeline
  // ===========================

  async getProfileTimeline(profileType: string, identifierType: string, identifierValue: string): Promise<IntegrationResponse<SunshineProfileTimeline>> {
    try {
      await this.ensureConnected()

      // Fetch profile, events, activities, notes, and relationships in parallel
      const [profileRes, eventsRes, activitiesRes, notesRes, relationshipsRes] = await Promise.all([
        this.getProfile(profileType, identifierType, identifierValue),
        this.listEvents(profileType, identifierType, identifierValue),
        this.listActivities({ target_type: 'profile', target_id: `${profileType}:${identifierType}:${identifierValue}` }),
        this.listProfileNotes(profileType, identifierType, identifierValue),
        this.listRelationships({ source: `${profileType}:${identifierType}:${identifierValue}` }),
      ])

      if (!profileRes.success) return { success: false, error: profileRes.error }

      const timeline: SunshineProfileTimeline = {
        profile: profileRes.data!,
        events: eventsRes.success ? eventsRes.data!.data : [],
        activities: activitiesRes.success ? activitiesRes.data!.data : [],
        notes: notesRes.success ? notesRes.data!.data : [],
        relationships: relationshipsRes.success ? relationshipsRes.data!.data : [],
      }

      return { success: true, data: timeline }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Advanced Querying
  // ===========================

  async advancedQuery(params: {
    resource_type: 'profile' | 'object'
    type: string
    filters: SunshineQueryBuilder[]
    sort?: { field: string; order: 'asc' | 'desc' }[]
    page_size?: number
    page?: string
  }): Promise<IntegrationResponse<{ data: any[]; links?: any; meta?: any }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/query/advanced`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(params),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async searchProfiles(params: { query: string; profile_type?: string; limit?: number }): Promise<IntegrationResponse<{ data: SunshineProfile[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/profiles/search`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(params),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Merge Suggestions
  // ===========================

  async findMergeCandidates(profileType: string, identifierType: string, identifierValue: string, params?: { min_confidence?: number; limit?: number }): Promise<IntegrationResponse<{ data: SunshineMergeCandidate[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.min_confidence) query.set('min_confidence', params.min_confidence.toString())
      if (params?.limit) query.set('limit', params.limit.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/profiles/${profileType}/${identifierType}/${identifierValue}/merge_candidates${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async detectDuplicates(profileType: string, params?: { min_confidence?: number; page_size?: number }): Promise<IntegrationResponse<{ data: SunshineMergeCandidate[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams({ profile_type: profileType })
      if (params?.min_confidence) query.set('min_confidence', params.min_confidence.toString())
      if (params?.page_size) query.set('page_size', params.page_size.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/profiles/duplicates?${query}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Data Import/Export
  // ===========================

  async createExport(params: { export_type: SunshineDataExport['export_type']; format: 'json' | 'csv'; filters?: Record<string, any> }): Promise<IntegrationResponse<SunshineDataExport>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/exports`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: params }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getExport(exportId: string): Promise<IntegrationResponse<SunshineDataExport>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/exports/${exportId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listExports(): Promise<IntegrationResponse<{ data: SunshineDataExport[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/exports`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async createImport(params: { import_type: SunshineDataImport['import_type']; format: 'json' | 'csv'; file_url: string }): Promise<IntegrationResponse<SunshineDataImport>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/imports`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: params }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getImport(importId: string): Promise<IntegrationResponse<SunshineDataImport>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/imports/${importId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listImports(): Promise<IntegrationResponse<{ data: SunshineDataImport[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/imports`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Webhooks
  // ===========================

  async createWebhook(webhook: Omit<SunshineWebhook, 'id' | 'signing_secret' | 'created_at' | 'updated_at'>): Promise<IntegrationResponse<SunshineWebhook>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/webhooks`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: webhook }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getWebhook(webhookId: string): Promise<IntegrationResponse<SunshineWebhook>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/webhooks/${webhookId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listWebhooks(): Promise<IntegrationResponse<{ data: SunshineWebhook[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/webhooks`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateWebhook(webhookId: string, updates: Partial<Omit<SunshineWebhook, 'id' | 'signing_secret' | 'created_at' | 'updated_at'>>): Promise<IntegrationResponse<SunshineWebhook>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/webhooks/${webhookId}`, {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({ data: updates }),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        const data = await response.json()
        return data.data
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteWebhook(webhookId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/webhooks/${webhookId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async testWebhook(webhookId: string): Promise<IntegrationResponse<{ success: boolean; response?: any }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/webhooks/${webhookId}/test`, {
          method: 'POST',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Sunshine API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
