/**
 * TypeScript Types for Database Models
 *
 * Replaces all 'any' types with proper typing
 */

export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  company_name: string | null
  created_at: string
  updated_at: string
}

export interface Bot {
  id: string
  user_id: string
  name: string
  description: string | null
  instructions: string
  avatar_url: string | null
  primary_color: string
  welcome_message: string
  placeholder_text: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TrainingData {
  id: string
  bot_id: string
  content: string
  source_type: 'text' | 'pdf' | 'faq' | 'url'
  source_name: string | null
  chunk_index: number
  embedding: number[] | null
  metadata: Record<string, any>
  created_at: string
}

export interface Message {
  id: string
  bot_id: string
  session_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata: Record<string, any>
  created_at: string
}

export interface AllowedDomain {
  id: string
  bot_id: string
  domain: string
  is_active: boolean
  created_at: string
}

export interface UsageStats {
  id: string
  user_id: string
  bot_id: string | null
  stat_type: 'message' | 'training_upload' | 'embedding'
  count: number
  date: string
  metadata: Record<string, any>
  created_at: string
}

export interface Webhook {
  id: string
  bot_id: string
  url: string
  events: string[]
  secret: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  resource_type: string | null
  resource_id: string | null
  metadata: Record<string, any>
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  errors?: Record<string, string>
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

export interface RAGContext {
  id: string
  content: string
  similarity: number
  source_name: string | null
}

export interface ChatCompletionResponse {
  response: string
  context: RAGContext[]
}

// ============================================================================
// Usage & Analytics Types
// ============================================================================

export interface UsageSummary {
  messages: number
  embeddings: number
  trainingUploads: number
  period: 'day' | 'week' | 'month'
  limit: number
  remaining: number
}

export interface ConversationAnalytics {
  totalConversations: number
  totalMessages: number
  avgMessagesPerConversation: number
  avgResponseTime: number
  topQuestions: Array<{ question: string; count: number }>
  conversationsOverTime: Array<{ date: string; count: number }>
}

export interface BotAnalytics {
  bot_id: string
  bot_name: string
  messageCount: number
  conversationCount: number
  avgSatisfaction: number | null
  topKeywords: string[]
}

// ============================================================================
// Supabase Database Type
// ============================================================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'email' | 'created_at'>>
      }
      bots: {
        Row: Bot
        Insert: Omit<Bot, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Bot, 'id' | 'user_id' | 'created_at'>>
      }
      training_data: {
        Row: TrainingData
        Insert: Omit<TrainingData, 'id' | 'created_at'>
        Update: Partial<Omit<TrainingData, 'id' | 'bot_id' | 'created_at'>>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at'>
        Update: never
      }
      allowed_domains: {
        Row: AllowedDomain
        Insert: Omit<AllowedDomain, 'id' | 'created_at'>
        Update: Partial<Omit<AllowedDomain, 'id' | 'bot_id' | 'created_at'>>
      }
      usage_stats: {
        Row: UsageStats
        Insert: Omit<UsageStats, 'id' | 'created_at'>
        Update: never
      }
      webhooks: {
        Row: Webhook
        Insert: Omit<Webhook, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Webhook, 'id' | 'bot_id' | 'created_at'>>
      }
      audit_logs: {
        Row: AuditLog
        Insert: Omit<AuditLog, 'id' | 'created_at'>
        Update: never
      }
    }
    Functions: {
      match_training_data: {
        Args: {
          query_embedding: number[]
          match_bot_id: string
          match_threshold?: number
          match_count?: number
        }
        Returns: Array<RAGContext>
      }
    }
  }
}
