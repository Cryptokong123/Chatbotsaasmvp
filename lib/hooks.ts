/**
 * Custom React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createBrowserSupabaseClient } from './supabase'
import { Bot, TrainingData, Message } from '@/types/database'
import { useToast } from '@/components/ui/use-toast'

const supabase = createBrowserSupabaseClient()

// ============================================================================
// Bot Hooks
// ============================================================================

export function useBots() {
  return useQuery({
    queryKey: ['bots'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('bots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Bot[]
    },
  })
}

export function useBot(botId: string) {
  return useQuery({
    queryKey: ['bot', botId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bots')
        .select('*')
        .eq('id', botId)
        .single()

      if (error) throw error
      return data as Bot
    },
    enabled: !!botId,
  })
}

export function useCreateBot() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (botData: Partial<Bot>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('bots')
        .insert({ ...botData, user_id: user.id })
        .select()
        .single()

      if (error) throw error
      return data as Bot
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] })
      toast({ title: 'Bot created successfully' })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateBot(botId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (updates: Partial<Bot>) => {
      const { data, error } = await supabase
        .from('bots')
        .update(updates)
        .eq('id', botId)
        .select()
        .single()

      if (error) throw error
      return data as Bot
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot', botId] })
      queryClient.invalidateQueries({ queryKey: ['bots'] })
      toast({ title: 'Bot updated successfully' })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteBot() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (botId: string) => {
      const { error } = await supabase.from('bots').delete().eq('id', botId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] })
      toast({ title: 'Bot deleted successfully' })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

// ============================================================================
// Training Data Hooks
// ============================================================================

export function useTrainingData(botId: string) {
  return useQuery({
    queryKey: ['trainingData', botId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_data')
        .select('*')
        .eq('bot_id', botId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as TrainingData[]
    },
    enabled: !!botId,
  })
}

// ============================================================================
// Usage Hooks
// ============================================================================

export function useUsageStats() {
  return useQuery({
    queryKey: ['usageStats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('usage_stats')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

      if (error) throw error
      return data
    },
  })
}
