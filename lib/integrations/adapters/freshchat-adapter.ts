/**
 * Freshchat Adapter - Modern messaging for customer engagement
 */
import { BaseIntegrationAdapter } from '../base-adapter'
import { IntegrationConfig, IntegrationCapabilities, IntegrationResponse } from '../types'

export interface FreshchatUser {
  id?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  phone_country_code?: string
  properties?: Record<string, any>
  created_time?: string
  updated_time?: string
  avatar?: { url?: string }
  org_contact_id?: string
  social_profiles?: any[]
  restore_id?: string
}

export interface FreshchatConversation {
  conversation_id?: string
  app_id?: string
  status?: 'new' | 'assigned' | 'resolved' | 'reopened'
  channel_id?: string
  messages?: FreshchatMessage[]
  assigned_agent_id?: string
  assigned_group_id?: string
  created_time?: string
  updated_time?: string
  users?: string[]
  properties?: Record<string, any>
}

export interface FreshchatMessage {
  id?: string
  message_type: 'normal' | 'private' | 'system'
  message_parts?: Array<{
    text?: { content: string }
    image?: { url: string; name?: string }
    file?: { url: string; name?: string; size?: number }
  }>
  actor_type: 'agent' | 'user' | 'system'
  actor_id?: string
  created_time?: string
  app_id?: string
  conversation_id?: string
}

export interface FreshchatAgent {
  id?: string
  first_name?: string
  last_name?: string
  email?: string
  available?: boolean
  avatar?: { url?: string }
  biography?: string
  status?: 'active' | 'inactive'
  is_account_admin?: boolean
  social_profiles?: any[]
  created_time?: string
  updated_time?: string
}

export interface FreshchatGroup {
  id?: string
  name: string
  description?: string
  agents?: string[]
  routing_logic?: 'round_robin' | 'load_balancing' | 'intelligent'
  created_time?: string
  updated_time?: string
}

export interface FreshchatChannel {
  id?: string
  name: string
  public?: boolean
  icon?: string
  enabled?: boolean
  tags?: string[]
  welcome_message?: {
    message_parts?: Array<{ text?: { content: string } }>
  }
  custom_response_time?: {
    enabled?: boolean
    time?: string
  }
}

export interface FreshchatTopic {
  id?: string
  name: string
  description?: string
  articles?: Array<{
    id?: string
    title: string
    description?: string
  }>
  created_time?: string
  updated_time?: string
}

export interface FreshchatCannedResponse {
  id?: string
  title: string
  message: string
  tag_ids?: string[]
  folder_id?: string
  created_time?: string
  updated_time?: string
}

export interface FreshchatInboxSettings {
  conversation_assignment?: {
    enabled?: boolean
    type?: 'round_robin' | 'load_balancing'
    limit_per_agent?: number
  }
  business_hours?: {
    enabled?: boolean
    timezone?: string
    days?: Array<{
      day: string
      enabled: boolean
      from?: string
      to?: string
    }>
  }
  away_message?: {
    enabled?: boolean
    message?: string
  }
}

export interface FreshchatTag {
  id?: string
  name: string
  created_time?: string
}

export interface FreshchatFilterRule {
  name: string
  enabled?: boolean
  conditions?: Array<{
    field: string
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than'
    value: any
  }>
  actions?: Array<{
    type: 'assign_agent' | 'assign_group' | 'add_tag' | 'set_status' | 'send_message'
    value: any
  }>
}

export class FreshchatAdapter extends BaseIntegrationAdapter {
  private apiToken?: string
  private baseUrl = 'https://api.freshchat.com/v2'

  getCapabilities(): IntegrationCapabilities {
    return {
      canSendMessages: true, canReceiveMessages: true, canSendFiles: true, canSendImages: true,
      canSendVideo: false, canSendAudio: false, canSendLocation: false, canSendButtons: false,
      canSendCards: false, canSendCarousels: false, canSendQuickReplies: false, canSendTemplates: false,
      canScheduleMessages: false, canBroadcast: true, canTag: true, canAssign: true,
      canCreateTickets: false, canCreateLeads: false, canCreateContacts: true, canSyncContacts: true,
      canSyncConversations: true, canSyncTickets: false, canExportData: true, canImportData: false,
      canTrackEvents: true, canTrackMetrics: true, canGenerateReports: false, canCreateWorkflows: false,
      canTriggerActions: true, canListenToWebhooks: true, maxMessageLength: 10000,
      maxFileSize: 25 * 1024 * 1024, maxBatchSize: 50, rateLimit: { messages: 60, period: 'per_minute' as const },
    }
  }

  async connect(): Promise<IntegrationResponse<void>> {
    this.apiToken = this.config.credentials.apiToken
    if (!this.apiToken) {
      return { success: false, error: { code: 'AUTH_ERROR', message: 'Missing API token', retryable: false } }
    }
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
      const result = await this.listUsers({ page: 1 })
      return { success: result.success, data: result.success }
    } catch (error: any) {
      return { success: false, data: false, error: this.formatError(error) }
    }
  }

  private getHeaders(): Record<string, string> {
    return { 'Authorization': `Bearer ${this.apiToken}`, 'Content-Type': 'application/json' }
  }

  // ===========================
  // Users
  // ===========================

  async createUser(user: FreshchatUser): Promise<IntegrationResponse<FreshchatUser>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(user),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getUser(userId: string): Promise<IntegrationResponse<FreshchatUser>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users/${userId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateUser(userId: string, user: Partial<FreshchatUser>): Promise<IntegrationResponse<FreshchatUser>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users/${userId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(user),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listUsers(params: { page?: number; items_per_page?: number }): Promise<IntegrationResponse<{ users: FreshchatUser[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params.page) query.set('page', params.page.toString())
      if (params.items_per_page) query.set('items_per_page', params.items_per_page.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteUser(userId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users/${userId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async restoreUser(restoreId: string): Promise<IntegrationResponse<FreshchatUser>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/users/restore`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ restore_id: restoreId }),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Conversations
  // ===========================

  async getConversation(conversationId: string): Promise<IntegrationResponse<FreshchatConversation>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/${conversationId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listConversations(params?: {
    status?: 'new' | 'assigned' | 'resolved' | 'reopened'
    channel_id?: string
    assigned_agent_id?: string
    page?: number
  }): Promise<IntegrationResponse<{ conversations: FreshchatConversation[] }>> {
    try {
      await this.ensureConnected()
      const query = new URLSearchParams()
      if (params?.status) query.set('status', params.status)
      if (params?.channel_id) query.set('channel_id', params.channel_id)
      if (params?.assigned_agent_id) query.set('assigned_agent_id', params.assigned_agent_id)
      if (params?.page) query.set('page', params.page.toString())

      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations${query.toString() ? `?${query}` : ''}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async filterConversations(filters: {
    status?: string[]
    channel_id?: string[]
    assigned_agent_id?: string[]
  }): Promise<IntegrationResponse<{ conversations: FreshchatConversation[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/filter`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ filters }),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async assignConversation(conversationId: string, params: { agent_id?: string; group_id?: string }): Promise<IntegrationResponse<FreshchatConversation>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/${conversationId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({
            assigned_agent_id: params.agent_id,
            assigned_group_id: params.group_id,
          }),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async resolveConversation(conversationId: string): Promise<IntegrationResponse<FreshchatConversation>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/${conversationId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ status: 'resolved' }),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async reopenConversation(conversationId: string): Promise<IntegrationResponse<FreshchatConversation>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/${conversationId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ status: 'reopened' }),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Messages
  // ===========================

  async sendMessage(params: {
    conversation_id: string
    message_parts: Array<{ text: { content: string } }>
    actor_id: string
  }): Promise<IntegrationResponse<FreshchatMessage>> {
    try {
      await this.ensureConnected()
      const message: FreshchatMessage = {
        message_type: 'normal',
        message_parts: params.message_parts,
        actor_type: 'agent',
        actor_id: params.actor_id,
      }
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/${params.conversation_id}/messages`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(message),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async sendPrivateNote(params: {
    conversation_id: string
    message_parts: Array<{ text: { content: string } }>
    actor_id: string
  }): Promise<IntegrationResponse<FreshchatMessage>> {
    try {
      await this.ensureConnected()
      const message: FreshchatMessage = {
        message_type: 'private',
        message_parts: params.message_parts,
        actor_type: 'agent',
        actor_id: params.actor_id,
      }
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/${params.conversation_id}/messages`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(message),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getMessages(conversationId: string): Promise<IntegrationResponse<{ messages: FreshchatMessage[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/messages`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Agents
  // ===========================

  async getAgent(agentId: string): Promise<IntegrationResponse<FreshchatAgent>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/agents/${agentId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listAgents(): Promise<IntegrationResponse<{ agents: FreshchatAgent[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/agents`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateAgent(agentId: string, agent: Partial<FreshchatAgent>): Promise<IntegrationResponse<FreshchatAgent>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/agents/${agentId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(agent),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async setAgentAvailability(agentId: string, available: boolean): Promise<IntegrationResponse<FreshchatAgent>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/agents/${agentId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ available }),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Groups
  // ===========================

  async createGroup(group: Partial<FreshchatGroup>): Promise<IntegrationResponse<FreshchatGroup>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/groups`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(group),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getGroup(groupId: string): Promise<IntegrationResponse<FreshchatGroup>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/groups/${groupId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listGroups(): Promise<IntegrationResponse<{ groups: FreshchatGroup[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/groups`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateGroup(groupId: string, group: Partial<FreshchatGroup>): Promise<IntegrationResponse<FreshchatGroup>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/groups/${groupId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(group),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteGroup(groupId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/groups/${groupId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Channels
  // ===========================

  async createChannel(channel: Partial<FreshchatChannel>): Promise<IntegrationResponse<FreshchatChannel>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/channels`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(channel),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getChannel(channelId: string): Promise<IntegrationResponse<FreshchatChannel>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/channels/${channelId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listChannels(): Promise<IntegrationResponse<{ channels: FreshchatChannel[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/channels`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateChannel(channelId: string, channel: Partial<FreshchatChannel>): Promise<IntegrationResponse<FreshchatChannel>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/channels/${channelId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(channel),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Topics (Knowledge Base)
  // ===========================

  async createTopic(topic: Partial<FreshchatTopic>): Promise<IntegrationResponse<FreshchatTopic>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/topics`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(topic),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async getTopic(topicId: string): Promise<IntegrationResponse<FreshchatTopic>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/topics/${topicId}`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listTopics(): Promise<IntegrationResponse<{ topics: FreshchatTopic[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/topics`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateTopic(topicId: string, topic: Partial<FreshchatTopic>): Promise<IntegrationResponse<FreshchatTopic>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/topics/${topicId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(topic),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteTopic(topicId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/topics/${topicId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Canned Responses
  // ===========================

  async createCannedResponse(response: Partial<FreshchatCannedResponse>): Promise<IntegrationResponse<FreshchatCannedResponse>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const res = await fetch(`${this.baseUrl}/canned_responses`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(response),
        })
        if (!res.ok) throw new Error(`Freshchat API error: ${res.status}`)
        return await res.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listCannedResponses(): Promise<IntegrationResponse<{ canned_responses: FreshchatCannedResponse[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/canned_responses`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateCannedResponse(responseId: string, response: Partial<FreshchatCannedResponse>): Promise<IntegrationResponse<FreshchatCannedResponse>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const res = await fetch(`${this.baseUrl}/canned_responses/${responseId}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(response),
        })
        if (!res.ok) throw new Error(`Freshchat API error: ${res.status}`)
        return await res.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteCannedResponse(responseId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/canned_responses/${responseId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Tags
  // ===========================

  async createTag(tag: Partial<FreshchatTag>): Promise<IntegrationResponse<FreshchatTag>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tags`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(tag),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async listTags(): Promise<IntegrationResponse<{ tags: FreshchatTag[] }>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tags`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async deleteTag(tagId: string): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/tags/${tagId}`, {
          method: 'DELETE',
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async tagConversation(conversationId: string, tagIds: string[]): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/tags`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ tag_ids: tagIds }),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async untagConversation(conversationId: string, tagIds: string[]): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/tags`, {
          method: 'DELETE',
          headers: this.getHeaders(),
          body: JSON.stringify({ tag_ids: tagIds }),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Inbox Settings
  // ===========================

  async getInboxSettings(): Promise<IntegrationResponse<FreshchatInboxSettings>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/settings/inbox`, {
          headers: this.getHeaders(),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  async updateInboxSettings(settings: Partial<FreshchatInboxSettings>): Promise<IntegrationResponse<FreshchatInboxSettings>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/settings/inbox`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(settings),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return await response.json()
      })
      return result.success ? { success: true, data: result.data } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }

  // ===========================
  // Events
  // ===========================

  async trackEvent(params: {
    actor_id: string
    actor_type: 'user' | 'agent'
    event_name: string
    properties?: Record<string, any>
  }): Promise<IntegrationResponse<void>> {
    try {
      await this.ensureConnected()
      const result = await this.makeRequest(async () => {
        const response = await fetch(`${this.baseUrl}/events`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(params),
        })
        if (!response.ok) throw new Error(`Freshchat API error: ${response.status}`)
        return {}
      })
      return result.success ? { success: true, data: undefined } : { success: false, error: result.error }
    } catch (error: any) {
      return { success: false, error: this.formatError(error) }
    }
  }
}
