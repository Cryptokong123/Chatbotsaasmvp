/**
 * Conversation Sync Engine
 *
 * Bidirectional sync for messages, conversations, tickets across platforms
 */

import { createClient } from '@supabase/supabase-js'
import { EventEmitter } from 'events'
import { ContactSyncEngine, Contact } from './contact-sync'

// ============================================================================
// TYPES
// ============================================================================

export interface Conversation {
  id: string
  instanceId: string
  integrationType: string
  externalId: string
  externalIds: Record<string, string>
  subject?: string
  status: 'open' | 'pending' | 'closed' | 'resolved' | 'archived' | 'spam'
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  type?: 'chat' | 'email' | 'ticket' | 'call' | 'sms' | 'social' | 'other'
  channel?: string
  assigneeId?: string
  assigneeExternalId?: string
  teamId?: string
  tags: string[]
  customFields?: Record<string, any>
  participants: ConversationParticipant[]
  messageCount: number
  unreadCount: number
  firstMessageAt?: Date
  lastMessageAt?: Date
  closedAt?: Date
  resolvedAt?: Date
  responseTimeMs?: number
  resolutionTimeMs?: number
  satisfactionScore?: number
  isActive: boolean
  isSynced: boolean
  syncVersion: number
  lastSyncedAt?: Date
  syncError?: string
  rawData?: any
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface ConversationParticipant {
  contactId?: string
  externalContactId: string
  role: 'customer' | 'agent' | 'bot' | 'system'
  name?: string
  email?: string
  phone?: string
  avatarUrl?: string
  joinedAt: Date
  leftAt?: Date
}

export interface Message {
  id: string
  conversationId: string
  instanceId: string
  integrationType: string
  externalId: string
  externalIds: Record<string, string>
  direction: 'inbound' | 'outbound'
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'template' | 'system'
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  senderId?: string
  senderExternalId: string
  senderName?: string
  senderEmail?: string
  recipientId?: string
  recipientExternalId: string
  recipientName?: string
  recipientEmail?: string
  subject?: string
  body?: string
  bodyHtml?: string
  bodyPlain?: string
  attachments: MessageAttachment[]
  mentions: string[]
  reactions: MessageReaction[]
  isRead: boolean
  readAt?: Date
  deliveredAt?: Date
  sentAt?: Date
  failedAt?: Date
  failureReason?: string
  retryCount: number
  maxRetries: number
  nextRetryAt?: Date
  inReplyToId?: string
  threadId?: string
  metadata?: Record<string, any>
  rawData?: any
  createdAt: Date
  updatedAt: Date
}

export interface MessageAttachment {
  id?: string
  type: 'image' | 'video' | 'audio' | 'file' | 'document'
  url: string
  name?: string
  size?: number
  mimeType?: string
  thumbnailUrl?: string
  externalId?: string
}

export interface MessageReaction {
  emoji: string
  userId?: string
  userExternalId: string
  userName?: string
  createdAt: Date
}

export interface SyncResult {
  success: boolean
  action: 'created' | 'updated' | 'skipped' | 'failed'
  conversationId?: string
  messageId?: string
  error?: string
}

export interface SyncStats {
  conversationsCreated: number
  conversationsUpdated: number
  conversationsSkipped: number
  conversationsFailed: number
  messagesCreated: number
  messagesUpdated: number
  messagesSkipped: number
  messagesFailed: number
  totalProcessed: number
  duration: number
}

export interface ConversationFilter {
  status?: Conversation['status'][]
  priority?: Conversation['priority'][]
  type?: Conversation['type'][]
  assigneeId?: string
  teamId?: string
  tags?: string[]
  createdAfter?: Date
  createdBefore?: Date
  updatedAfter?: Date
  updatedBefore?: Date
  hasUnread?: boolean
}

// ============================================================================
// CONVERSATION SYNC ENGINE
// ============================================================================

export class ConversationSyncEngine extends EventEmitter {
  private supabase: ReturnType<typeof createClient>
  private contactSync: ContactSyncEngine
  private syncInProgress = new Set<string>()

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    contactSync: ContactSyncEngine
  ) {
    super()
    this.supabase = createClient(supabaseUrl, supabaseKey)
    this.contactSync = contactSync
  }

  // ============================================================================
  // CONVERSATION SYNC
  // ============================================================================

  /**
   * Sync conversation from integration platform
   */
  async syncConversation(
    instanceId: string,
    integrationType: string,
    conversationData: Partial<Conversation>
  ): Promise<SyncResult> {
    try {
      // Check if already syncing
      const syncKey = `${instanceId}:${conversationData.externalId}`
      if (this.syncInProgress.has(syncKey)) {
        return { success: false, action: 'skipped', error: 'Sync already in progress' }
      }

      this.syncInProgress.add(syncKey)

      try {
        // Check if conversation exists
        const existing = await this.findExistingConversation(instanceId, conversationData.externalId!)

        if (existing) {
          // Update existing conversation
          return await this.updateConversation(existing.id, conversationData)
        } else {
          // Create new conversation
          return await this.createConversation(instanceId, integrationType, conversationData)
        }
      } finally {
        this.syncInProgress.delete(syncKey)
      }
    } catch (error: any) {
      return {
        success: false,
        action: 'failed',
        error: error.message,
      }
    }
  }

  /**
   * Create new conversation
   */
  private async createConversation(
    instanceId: string,
    integrationType: string,
    conversationData: Partial<Conversation>
  ): Promise<SyncResult> {
    try {
      // Sync participants as contacts
      if (conversationData.participants) {
        for (const participant of conversationData.participants) {
          if (participant.role === 'customer') {
            await this.contactSync.syncContact(instanceId, integrationType, {
              externalId: participant.externalContactId,
              email: participant.email,
              phone: participant.phone,
              fullName: participant.name,
              avatarUrl: participant.avatarUrl,
            })
          }
        }
      }

      const { data, error } = await this.supabase
        .from('integration_conversations')
        .insert({
          instance_id: instanceId,
          integration_type: integrationType,
          external_id: conversationData.externalId,
          external_ids: conversationData.externalIds || {},
          subject: conversationData.subject,
          status: conversationData.status || 'open',
          priority: conversationData.priority,
          type: conversationData.type,
          channel: conversationData.channel,
          assignee_id: conversationData.assigneeId,
          assignee_external_id: conversationData.assigneeExternalId,
          team_id: conversationData.teamId,
          tags: conversationData.tags || [],
          custom_fields: conversationData.customFields,
          participants: conversationData.participants || [],
          message_count: conversationData.messageCount || 0,
          unread_count: conversationData.unreadCount || 0,
          first_message_at: conversationData.firstMessageAt?.toISOString(),
          last_message_at: conversationData.lastMessageAt?.toISOString(),
          closed_at: conversationData.closedAt?.toISOString(),
          resolved_at: conversationData.resolvedAt?.toISOString(),
          response_time_ms: conversationData.responseTimeMs,
          resolution_time_ms: conversationData.resolutionTimeMs,
          satisfaction_score: conversationData.satisfactionScore,
          is_active: conversationData.isActive ?? true,
          is_synced: true,
          sync_version: 1,
          last_synced_at: new Date().toISOString(),
          raw_data: conversationData.rawData,
          metadata: conversationData.metadata,
        })
        .select()
        .single()

      if (error) throw error

      this.emit('conversation:created', data)

      return {
        success: true,
        conversationId: data.id,
        action: 'created',
      }
    } catch (error: any) {
      return {
        success: false,
        action: 'failed',
        error: error.message,
      }
    }
  }

  /**
   * Update existing conversation
   */
  private async updateConversation(
    conversationId: string,
    conversationData: Partial<Conversation>
  ): Promise<SyncResult> {
    try {
      const { data, error } = await this.supabase
        .from('integration_conversations')
        .update({
          subject: conversationData.subject,
          status: conversationData.status,
          priority: conversationData.priority,
          type: conversationData.type,
          channel: conversationData.channel,
          assignee_id: conversationData.assigneeId,
          assignee_external_id: conversationData.assigneeExternalId,
          team_id: conversationData.teamId,
          tags: conversationData.tags,
          custom_fields: conversationData.customFields,
          participants: conversationData.participants,
          message_count: conversationData.messageCount,
          unread_count: conversationData.unreadCount,
          last_message_at: conversationData.lastMessageAt?.toISOString(),
          closed_at: conversationData.closedAt?.toISOString(),
          resolved_at: conversationData.resolvedAt?.toISOString(),
          response_time_ms: conversationData.responseTimeMs,
          resolution_time_ms: conversationData.resolutionTimeMs,
          satisfaction_score: conversationData.satisfactionScore,
          is_active: conversationData.isActive,
          last_synced_at: new Date().toISOString(),
          sync_version: this.supabase.rpc('increment', { row_id: conversationId }),
          raw_data: conversationData.rawData,
        })
        .eq('id', conversationId)
        .select()
        .single()

      if (error) throw error

      this.emit('conversation:updated', data)

      return {
        success: true,
        conversationId: data.id,
        action: 'updated',
      }
    } catch (error: any) {
      return {
        success: false,
        action: 'failed',
        error: error.message,
      }
    }
  }

  // ============================================================================
  // MESSAGE SYNC
  // ============================================================================

  /**
   * Sync message from integration platform
   */
  async syncMessage(
    instanceId: string,
    integrationType: string,
    conversationExternalId: string,
    messageData: Partial<Message>
  ): Promise<SyncResult> {
    try {
      // Get or create conversation
      let conversation = await this.findExistingConversation(instanceId, conversationExternalId)

      if (!conversation) {
        // Create minimal conversation
        const convResult = await this.createConversation(instanceId, integrationType, {
          externalId: conversationExternalId,
          status: 'open',
          type: 'chat',
          messageCount: 0,
          unreadCount: 0,
        })

        if (!convResult.success) {
          return convResult
        }

        conversation = await this.findExistingConversation(instanceId, conversationExternalId)
      }

      // Check if message exists
      const existing = await this.findExistingMessage(
        conversation!.id,
        messageData.externalId!
      )

      if (existing) {
        // Update existing message
        return await this.updateMessage(existing.id, messageData)
      } else {
        // Create new message
        return await this.createMessage(
          conversation!.id,
          instanceId,
          integrationType,
          messageData
        )
      }
    } catch (error: any) {
      return {
        success: false,
        action: 'failed',
        error: error.message,
      }
    }
  }

  /**
   * Create new message
   */
  private async createMessage(
    conversationId: string,
    instanceId: string,
    integrationType: string,
    messageData: Partial<Message>
  ): Promise<SyncResult> {
    try {
      const { data, error } = await this.supabase
        .from('integration_messages')
        .insert({
          conversation_id: conversationId,
          instance_id: instanceId,
          integration_type: integrationType,
          external_id: messageData.externalId,
          external_ids: messageData.externalIds || {},
          direction: messageData.direction,
          type: messageData.type || 'text',
          status: messageData.status || 'sent',
          sender_id: messageData.senderId,
          sender_external_id: messageData.senderExternalId,
          sender_name: messageData.senderName,
          sender_email: messageData.senderEmail,
          recipient_id: messageData.recipientId,
          recipient_external_id: messageData.recipientExternalId,
          recipient_name: messageData.recipientName,
          recipient_email: messageData.recipientEmail,
          subject: messageData.subject,
          body: messageData.body,
          body_html: messageData.bodyHtml,
          body_plain: messageData.bodyPlain,
          attachments: messageData.attachments || [],
          mentions: messageData.mentions || [],
          reactions: messageData.reactions || [],
          is_read: messageData.isRead ?? false,
          read_at: messageData.readAt?.toISOString(),
          delivered_at: messageData.deliveredAt?.toISOString(),
          sent_at: messageData.sentAt?.toISOString(),
          failed_at: messageData.failedAt?.toISOString(),
          failure_reason: messageData.failureReason,
          retry_count: messageData.retryCount || 0,
          max_retries: messageData.maxRetries || 3,
          next_retry_at: messageData.nextRetryAt?.toISOString(),
          in_reply_to_id: messageData.inReplyToId,
          thread_id: messageData.threadId,
          metadata: messageData.metadata,
          raw_data: messageData.rawData,
        })
        .select()
        .single()

      if (error) throw error

      // Update conversation message count
      await this.supabase
        .from('integration_conversations')
        .update({
          message_count: this.supabase.raw('message_count + 1'),
          last_message_at: messageData.sentAt?.toISOString() || new Date().toISOString(),
        })
        .eq('id', conversationId)

      this.emit('message:created', data)

      return {
        success: true,
        messageId: data.id,
        action: 'created',
      }
    } catch (error: any) {
      return {
        success: false,
        action: 'failed',
        error: error.message,
      }
    }
  }

  /**
   * Update existing message
   */
  private async updateMessage(
    messageId: string,
    messageData: Partial<Message>
  ): Promise<SyncResult> {
    try {
      const { data, error } = await this.supabase
        .from('integration_messages')
        .update({
          status: messageData.status,
          body: messageData.body,
          body_html: messageData.bodyHtml,
          body_plain: messageData.bodyPlain,
          attachments: messageData.attachments,
          mentions: messageData.mentions,
          reactions: messageData.reactions,
          is_read: messageData.isRead,
          read_at: messageData.readAt?.toISOString(),
          delivered_at: messageData.deliveredAt?.toISOString(),
          failed_at: messageData.failedAt?.toISOString(),
          failure_reason: messageData.failureReason,
          retry_count: messageData.retryCount,
          next_retry_at: messageData.nextRetryAt?.toISOString(),
          raw_data: messageData.rawData,
        })
        .eq('id', messageId)
        .select()
        .single()

      if (error) throw error

      this.emit('message:updated', data)

      return {
        success: true,
        messageId: data.id,
        action: 'updated',
      }
    } catch (error: any) {
      return {
        success: false,
        action: 'failed',
        error: error.message,
      }
    }
  }

  // ============================================================================
  // BULK SYNC
  // ============================================================================

  /**
   * Bulk sync conversations
   */
  async bulkSyncConversations(
    instanceId: string,
    integrationType: string,
    conversations: Partial<Conversation>[]
  ): Promise<SyncStats> {
    const startTime = Date.now()
    const stats: SyncStats = {
      conversationsCreated: 0,
      conversationsUpdated: 0,
      conversationsSkipped: 0,
      conversationsFailed: 0,
      messagesCreated: 0,
      messagesUpdated: 0,
      messagesSkipped: 0,
      messagesFailed: 0,
      totalProcessed: 0,
      duration: 0,
    }

    for (const conversation of conversations) {
      const result = await this.syncConversation(instanceId, integrationType, conversation)

      if (result.success) {
        if (result.action === 'created') {
          stats.conversationsCreated++
        } else if (result.action === 'updated') {
          stats.conversationsUpdated++
        } else if (result.action === 'skipped') {
          stats.conversationsSkipped++
        }
      } else {
        stats.conversationsFailed++
      }

      stats.totalProcessed++
    }

    stats.duration = Date.now() - startTime

    this.emit('bulk_sync:completed', stats)

    return stats
  }

  /**
   * Bulk sync messages
   */
  async bulkSyncMessages(
    instanceId: string,
    integrationType: string,
    conversationExternalId: string,
    messages: Partial<Message>[]
  ): Promise<SyncStats> {
    const startTime = Date.now()
    const stats: SyncStats = {
      conversationsCreated: 0,
      conversationsUpdated: 0,
      conversationsSkipped: 0,
      conversationsFailed: 0,
      messagesCreated: 0,
      messagesUpdated: 0,
      messagesSkipped: 0,
      messagesFailed: 0,
      totalProcessed: 0,
      duration: 0,
    }

    for (const message of messages) {
      const result = await this.syncMessage(
        instanceId,
        integrationType,
        conversationExternalId,
        message
      )

      if (result.success) {
        if (result.action === 'created') {
          stats.messagesCreated++
        } else if (result.action === 'updated') {
          stats.messagesUpdated++
        } else if (result.action === 'skipped') {
          stats.messagesSkipped++
        }
      } else {
        stats.messagesFailed++
      }

      stats.totalProcessed++
    }

    stats.duration = Date.now() - startTime

    this.emit('bulk_message_sync:completed', stats)

    return stats
  }

  // ============================================================================
  // QUERIES
  // ============================================================================

  /**
   * Get conversations by instance
   */
  async getConversations(
    instanceId: string,
    filter?: ConversationFilter,
    options: {
      limit?: number
      offset?: number
      orderBy?: 'created_at' | 'updated_at' | 'last_message_at'
      orderDirection?: 'asc' | 'desc'
    } = {}
  ): Promise<Conversation[]> {
    let query = this.supabase
      .from('integration_conversations')
      .select('*')
      .eq('instance_id', instanceId)

    // Apply filters
    if (filter) {
      if (filter.status) {
        query = query.in('status', filter.status)
      }
      if (filter.priority) {
        query = query.in('priority', filter.priority)
      }
      if (filter.type) {
        query = query.in('type', filter.type)
      }
      if (filter.assigneeId) {
        query = query.eq('assignee_id', filter.assigneeId)
      }
      if (filter.teamId) {
        query = query.eq('team_id', filter.teamId)
      }
      if (filter.tags && filter.tags.length > 0) {
        query = query.contains('tags', filter.tags)
      }
      if (filter.createdAfter) {
        query = query.gte('created_at', filter.createdAfter.toISOString())
      }
      if (filter.createdBefore) {
        query = query.lte('created_at', filter.createdBefore.toISOString())
      }
      if (filter.updatedAfter) {
        query = query.gte('updated_at', filter.updatedAfter.toISOString())
      }
      if (filter.updatedBefore) {
        query = query.lte('updated_at', filter.updatedBefore.toISOString())
      }
      if (filter.hasUnread !== undefined) {
        if (filter.hasUnread) {
          query = query.gt('unread_count', 0)
        } else {
          query = query.eq('unread_count', 0)
        }
      }
    }

    // Apply ordering
    const orderBy = options.orderBy || 'updated_at'
    const orderDirection = options.orderDirection || 'desc'
    query = query.order(orderBy, { ascending: orderDirection === 'asc' })

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit)
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) throw error

    return data as Conversation[]
  }

  /**
   * Get messages for conversation
   */
  async getMessages(
    conversationId: string,
    options: {
      limit?: number
      offset?: number
      orderBy?: 'created_at' | 'sent_at'
      orderDirection?: 'asc' | 'desc'
    } = {}
  ): Promise<Message[]> {
    let query = this.supabase
      .from('integration_messages')
      .select('*')
      .eq('conversation_id', conversationId)

    // Apply ordering
    const orderBy = options.orderBy || 'sent_at'
    const orderDirection = options.orderDirection || 'asc'
    query = query.order(orderBy, { ascending: orderDirection === 'asc' })

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit)
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }

    const { data, error } = await query

    if (error) throw error

    return data as Message[]
  }

  /**
   * Search conversations
   */
  async searchConversations(
    instanceId: string,
    searchQuery: string,
    options: {
      limit?: number
      offset?: number
    } = {}
  ): Promise<Conversation[]> {
    const { data, error } = await this.supabase
      .from('integration_conversations')
      .select('*')
      .eq('instance_id', instanceId)
      .or(`subject.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`)
      .limit(options.limit || 50)
      .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1)

    if (error) throw error

    return data as Conversation[]
  }

  /**
   * Mark conversation as read
   */
  async markAsRead(conversationId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('integration_conversations')
        .update({ unread_count: 0 })
        .eq('id', conversationId)

      if (error) throw error

      // Mark all messages as read
      await this.supabase
        .from('integration_messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('is_read', false)

      this.emit('conversation:read', { conversationId })

      return true
    } catch (error: any) {
      console.error('Failed to mark conversation as read:', error)
      return false
    }
  }

  /**
   * Archive conversation
   */
  async archiveConversation(conversationId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('integration_conversations')
        .update({ status: 'archived', is_active: false })
        .eq('id', conversationId)

      if (error) throw error

      this.emit('conversation:archived', { conversationId })

      return true
    } catch (error: any) {
      console.error('Failed to archive conversation:', error)
      return false
    }
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Find existing conversation
   */
  private async findExistingConversation(
    instanceId: string,
    externalId: string
  ): Promise<any> {
    const { data } = await this.supabase
      .from('integration_conversations')
      .select('*')
      .eq('instance_id', instanceId)
      .eq('external_id', externalId)
      .single()

    return data
  }

  /**
   * Find existing message
   */
  private async findExistingMessage(
    conversationId: string,
    externalId: string
  ): Promise<any> {
    const { data } = await this.supabase
      .from('integration_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('external_id', externalId)
      .single()

    return data
  }

  /**
   * Get conversation stats
   */
  async getStats(instanceId: string): Promise<{
    totalConversations: number
    openConversations: number
    closedConversations: number
    totalMessages: number
    unreadMessages: number
    averageResponseTime: number
    averageResolutionTime: number
  }> {
    const { data: conversations } = await this.supabase
      .from('integration_conversations')
      .select('*')
      .eq('instance_id', instanceId)

    const { count: totalMessages } = await this.supabase
      .from('integration_messages')
      .select('*', { count: 'exact', head: true })
      .eq('instance_id', instanceId)

    const { data: unreadConvs } = await this.supabase
      .from('integration_conversations')
      .select('unread_count')
      .eq('instance_id', instanceId)
      .gt('unread_count', 0)

    const totalConversations = conversations?.length || 0
    const openConversations =
      conversations?.filter(c => c.status === 'open' || c.status === 'pending').length || 0
    const closedConversations =
      conversations?.filter(c => c.status === 'closed' || c.status === 'resolved').length || 0

    const unreadMessages =
      unreadConvs?.reduce((sum, c) => sum + (c.unread_count || 0), 0) || 0

    const responseTimes = conversations
      ?.map(c => c.response_time_ms)
      .filter(t => t != null) as number[]
    const averageResponseTime =
      responseTimes?.length > 0
        ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
        : 0

    const resolutionTimes = conversations
      ?.map(c => c.resolution_time_ms)
      .filter(t => t != null) as number[]
    const averageResolutionTime =
      resolutionTimes?.length > 0
        ? resolutionTimes.reduce((sum, t) => sum + t, 0) / resolutionTimes.length
        : 0

    return {
      totalConversations,
      openConversations,
      closedConversations,
      totalMessages: totalMessages || 0,
      unreadMessages,
      averageResponseTime,
      averageResolutionTime,
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ConversationSyncEngine
