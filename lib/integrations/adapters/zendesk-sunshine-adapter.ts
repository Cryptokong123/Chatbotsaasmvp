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
}
