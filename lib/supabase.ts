import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Server-side Supabase client (with service role key)
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  })
}

// Client-side Supabase client
export function createBrowserSupabaseClient() {
  return createClientComponentClient()
}

// Type definitions for our database
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          company_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          company_name?: string | null
        }
        Update: {
          full_name?: string | null
          avatar_url?: string | null
          company_name?: string | null
        }
      }
      bots: {
        Row: {
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
        Insert: {
          user_id: string
          name: string
          description?: string | null
          instructions?: string
          avatar_url?: string | null
          primary_color?: string
          welcome_message?: string
          placeholder_text?: string
          is_active?: boolean
        }
        Update: {
          name?: string
          description?: string | null
          instructions?: string
          avatar_url?: string | null
          primary_color?: string
          welcome_message?: string
          placeholder_text?: string
          is_active?: boolean
        }
      }
      training_data: {
        Row: {
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
        Insert: {
          bot_id: string
          content: string
          source_type: 'text' | 'pdf' | 'faq' | 'url'
          source_name?: string | null
          chunk_index?: number
          embedding?: number[] | null
          metadata?: Record<string, any>
        }
      }
      messages: {
        Row: {
          id: string
          bot_id: string
          session_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata: Record<string, any>
          created_at: string
        }
        Insert: {
          bot_id: string
          session_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          metadata?: Record<string, any>
        }
      }
      allowed_domains: {
        Row: {
          id: string
          bot_id: string
          domain: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          bot_id: string
          domain: string
          is_active?: boolean
        }
      }
    }
  }
}
