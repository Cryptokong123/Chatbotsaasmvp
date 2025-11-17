/**
 * Agent Workspace System
 *
 * Comprehensive agent workspace with:
 * - Unified inbox across all platforms
 * - Real-time conversation handling
 * - Saved replies & canned responses
 * - Customer context panel
 * - Collaboration tools
 * - Performance metrics
 * - Queue management
 */

export interface Conversation {
  id: string
  customerId: string
  customerName?: string
  customerEmail?: string
  platform: string
  status: 'open' | 'pending' | 'closed'
  assignedTo?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  tags: string[]
  messages: ConversationMessage[]
  notes: Note[]
  createdAt: Date
  updatedAt: Date
  firstResponseTime?: number
  resolutionTime?: number
  satisfaction?: number
  sentiment?: number
}

export interface ConversationMessage {
  id: string
  conversationId: string
  text: string
  from: 'customer' | 'agent' | 'bot' | 'system'
  fromId?: string
  fromName?: string
  attachments?: Attachment[]
  timestamp: Date
  status?: 'sent' | 'delivered' | 'read' | 'failed'
}

export interface Attachment {
  id: string
  type: 'image' | 'video' | 'audio' | 'file' | 'document'
  url: string
  filename: string
  size: number
  mimeType: string
}

export interface Note {
  id: string
  conversationId: string
  agentId: string
  agentName: string
  text: string
  private: boolean
  timestamp: Date
}

export interface SavedReply {
  id: string
  title: string
  shortcut: string
  content: string
  category?: string
  variables?: string[]
  usage: number
  createdBy: string
  createdAt: Date
}

export interface AgentStatus {
  agentId: string
  status: 'available' | 'busy' | 'away' | 'offline'
  currentLoad: number
  maxCapacity: number
  activeConversations: string[]
}

export interface QueuedConversation {
  conversationId: string
  queuedAt: Date
  priority: number
  estimatedWaitTime?: number
}

export class AgentWorkspace {
  private conversations: Map<string, Conversation> = new Map()
  private savedReplies: Map<string, SavedReply> = new Map()
  private agents: Map<string, AgentStatus> = new Map()
  private queue: QueuedConversation[] = []

  // ============================================================================
  // CONVERSATION MANAGEMENT
  // ============================================================================

  async getInbox(agentId: string, filters?: {
    status?: string[]
    priority?: string[]
    platform?: string[]
    tags?: string[]
    assigned?: boolean
  }): Promise<Conversation[]> {
    let conversations = Array.from(this.conversations.values())

    // Filter by assignment
    if (filters?.assigned !== undefined) {
      conversations = conversations.filter(c =>
        filters.assigned ? c.assignedTo === agentId : !c.assignedTo
      )
    }

    // Apply other filters
    if (filters?.status) conversations = conversations.filter(c => filters.status!.includes(c.status))
    if (filters?.priority) conversations = conversations.filter(c => filters.priority!.includes(c.priority))
    if (filters?.platform) conversations = conversations.filter(c => filters.platform!.includes(c.platform))
    if (filters?.tags) conversations = conversations.filter(c => c.tags.some(t => filters.tags!.includes(t)))

    // Sort by priority and age
    return conversations.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      const aPriority = priorityOrder[a.priority]
      const bPriority = priorityOrder[b.priority]

      if (aPriority !== bPriority) return bPriority - aPriority
      return b.updatedAt.getTime() - a.updatedAt.getTime()
    })
  }

  async assignConversation(conversationId: string, agentId: string): Promise<boolean> {
    const conversation = this.conversations.get(conversationId)
    if (!conversation) return false

    conversation.assignedTo = agentId
    conversation.updatedAt = new Date()

    // Update agent status
    const agent = this.agents.get(agentId)
    if (agent) {
      agent.activeConversations.push(conversationId)
      agent.currentLoad = agent.activeConversations.length
    }

    return true
  }

  async sendMessage(params: {
    conversationId: string
    agentId: string
    text: string
    attachments?: Attachment[]
  }): Promise<ConversationMessage> {
    const conversation = this.conversations.get(params.conversationId)
    if (!conversation) throw new Error('Conversation not found')

    const message: ConversationMessage = {
      id: this.generateId(),
      conversationId: params.conversationId,
      text: params.text,
      from: 'agent',
      fromId: params.agentId,
      attachments: params.attachments,
      timestamp: new Date(),
      status: 'sent',
    }

    conversation.messages.push(message)
    conversation.updatedAt = new Date()

    // Calculate first response time if not set
    if (!conversation.firstResponseTime) {
      const firstCustomerMessage = conversation.messages.find(m => m.from === 'customer')
      if (firstCustomerMessage) {
        conversation.firstResponseTime = message.timestamp.getTime() - firstCustomerMessage.timestamp.getTime()
      }
    }

    return message
  }

  async addNote(params: {
    conversationId: string
    agentId: string
    agentName: string
    text: string
    private?: boolean
  }): Promise<Note> {
    const conversation = this.conversations.get(params.conversationId)
    if (!conversation) throw new Error('Conversation not found')

    const note: Note = {
      id: this.generateId(),
      conversationId: params.conversationId,
      agentId: params.agentId,
      agentName: params.agentName,
      text: params.text,
      private: params.private || false,
      timestamp: new Date(),
    }

    conversation.notes.push(note)
    return note
  }

  async closeConversation(conversationId: string, satisfaction?: number): Promise<boolean> {
    const conversation = this.conversations.get(conversationId)
    if (!conversation) return false

    conversation.status = 'closed'
    conversation.updatedAt = new Date()
    conversation.satisfaction = satisfaction

    // Calculate resolution time
    conversation.resolutionTime = conversation.updatedAt.getTime() - conversation.createdAt.getTime()

    // Remove from agent's active conversations
    if (conversation.assignedTo) {
      const agent = this.agents.get(conversation.assignedTo)
      if (agent) {
        agent.activeConversations = agent.activeConversations.filter(id => id !== conversationId)
        agent.currentLoad = agent.activeConversations.length
      }
    }

    return true
  }

  async addTag(conversationId: string, tag: string): Promise<boolean> {
    const conversation = this.conversations.get(conversationId)
    if (!conversation) return false

    if (!conversation.tags.includes(tag)) {
      conversation.tags.push(tag)
      conversation.updatedAt = new Date()
    }

    return true
  }

  async removeTag(conversationId: string, tag: string): Promise<boolean> {
    const conversation = this.conversations.get(conversationId)
    if (!conversation) return false

    conversation.tags = conversation.tags.filter(t => t !== tag)
    conversation.updatedAt = new Date()

    return true
  }

  // ============================================================================
  // SAVED REPLIES
  // ============================================================================

  async getSavedReplies(category?: string, search?: string): Promise<SavedReply[]> {
    let replies = Array.from(this.savedReplies.values())

    if (category) {
      replies = replies.filter(r => r.category === category)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      replies = replies.filter(r =>
        r.title.toLowerCase().includes(searchLower) ||
        r.content.toLowerCase().includes(searchLower) ||
        r.shortcut.toLowerCase().includes(searchLower)
      )
    }

    return replies.sort((a, b) => b.usage - a.usage)
  }

  async createSavedReply(reply: Omit<SavedReply, 'id' | 'usage' | 'createdAt'>): Promise<SavedReply> {
    const savedReply: SavedReply = {
      ...reply,
      id: this.generateId(),
      usage: 0,
      createdAt: new Date(),
    }

    this.savedReplies.set(savedReply.id, savedReply)
    return savedReply
  }

  async useSavedReply(replyId: string, variables?: Record<string, string>): Promise<string> {
    const reply = this.savedReplies.get(replyId)
    if (!reply) throw new Error('Saved reply not found')

    reply.usage++

    let content = reply.content

    // Replace variables
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), value)
      }
    }

    return content
  }

  // ============================================================================
  // AGENT STATUS
  // ============================================================================

  async setAgentStatus(agentId: string, status: AgentStatus['status']): Promise<void> {
    let agent = this.agents.get(agentId)

    if (!agent) {
      agent = {
        agentId,
        status,
        currentLoad: 0,
        maxCapacity: 10,
        activeConversations: [],
      }
      this.agents.set(agentId, agent)
    } else {
      agent.status = status
    }
  }

  async getAgentStatus(agentId: string): Promise<AgentStatus | undefined> {
    return this.agents.get(agentId)
  }

  async getAvailableAgents(): Promise<AgentStatus[]> {
    return Array.from(this.agents.values()).filter(
      a => a.status === 'available' && a.currentLoad < a.maxCapacity
    )
  }

  // ============================================================================
  // QUEUE MANAGEMENT
  // ============================================================================

  async addToQueue(conversationId: string, priority: number = 1): Promise<void> {
    this.queue.push({
      conversationId,
      queuedAt: new Date(),
      priority,
    })

    // Sort queue by priority
    this.queue.sort((a, b) => b.priority - a.priority || a.queuedAt.getTime() - b.queuedAt.getTime())
  }

  async getNextInQueue(): Promise<QueuedConversation | undefined> {
    return this.queue.shift()
  }

  async getQueueSize(): Promise<number> {
    return this.queue.length
  }

  async getQueuePosition(conversationId: string): Promise<number> {
    return this.queue.findIndex(q => q.conversationId === conversationId) + 1
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }
}
