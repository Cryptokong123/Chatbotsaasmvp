import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { createApiError } from '@/lib/api-errors'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      const { response, status } = createApiError('UNAUTHORIZED')
      return NextResponse.json(response, { status })
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const botId = searchParams.get('botId')
    const days = parseInt(searchParams.get('days') || '30', 10)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get all bots owned by the user
    const { data: bots, error: botsError } = await supabase
      .from('bots')
      .select('id, name')
      .eq('user_id', user.id)

    if (botsError) throw botsError

    const botIds = bots?.map(b => b.id) || []

    if (botIds.length === 0) {
      return NextResponse.json({
        conversations: [],
        total: 0,
        bots: [],
      })
    }

    // Build query for messages
    let query = supabase
      .from('messages')
      .select('id, bot_id, session_id, role, content, created_at', { count: 'exact' })
      .in('bot_id', botIds)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    // Filter by specific bot if requested
    if (botId && botIds.includes(botId)) {
      query = query.eq('bot_id', botId)
    }

    // Search in message content if requested
    if (search && search.trim()) {
      query = query.ilike('content', `%${search.trim()}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: messages, error: messagesError, count } = await query

    if (messagesError) throw messagesError

    // Group messages by session
    const conversationsMap = new Map<string, {
      sessionId: string
      botId: string
      botName: string
      messages: Array<{
        id: string
        role: string
        content: string
        createdAt: string
      }>
      startedAt: string
      lastMessageAt: string
      messageCount: number
    }>()

    messages?.forEach(msg => {
      const key = `${msg.bot_id}_${msg.session_id}`

      if (!conversationsMap.has(key)) {
        const bot = bots?.find(b => b.id === msg.bot_id)
        conversationsMap.set(key, {
          sessionId: msg.session_id,
          botId: msg.bot_id,
          botName: bot?.name || 'Unknown Bot',
          messages: [],
          startedAt: msg.created_at,
          lastMessageAt: msg.created_at,
          messageCount: 0,
        })
      }

      const conversation = conversationsMap.get(key)!
      conversation.messages.push({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.created_at,
      })
      conversation.messageCount++

      // Update timestamps
      if (new Date(msg.created_at) < new Date(conversation.startedAt)) {
        conversation.startedAt = msg.created_at
      }
      if (new Date(msg.created_at) > new Date(conversation.lastMessageAt)) {
        conversation.lastMessageAt = msg.created_at
      }
    })

    // Convert map to array and sort by last message
    const conversations = Array.from(conversationsMap.values())
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
      .map(conv => ({
        ...conv,
        messages: conv.messages.sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
      }))

    return NextResponse.json({
      conversations,
      total: count || 0,
      bots: bots?.map(b => ({ id: b.id, name: b.name })) || [],
      filters: {
        botId: botId || null,
        days,
        search: search || null,
        limit,
        offset,
      },
    })
  } catch (error: any) {
    console.error('Error fetching admin conversations:', error)
    const { response, status } = createApiError('INTERNAL_ERROR', {
      errorMessage: error.message,
    })
    return NextResponse.json(response, { status })
  }
}
