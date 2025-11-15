'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Circle, MessageSquare, User, Clock, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'

interface ActiveSession {
  session_id: string
  last_message: string
  last_message_time: string
  message_count: number
  user_messages: number
  bot_messages: number
  first_message: string
  status: 'active' | 'idle' | 'ended'
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  metadata?: any
}

export default function MonitorPage() {
  const params = useParams()
  const router = useRouter()
  const botId = params.id as string
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const { toast } = useToast()
  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    fetchActiveSessions()

    // Auto-refresh every 5 seconds if enabled
    const interval = autoRefresh ? setInterval(() => {
      fetchActiveSessions(true)
      if (selectedSession) {
        fetchSessionMessages(selectedSession, true)
      }
    }, 5000) : null

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [botId, autoRefresh, selectedSession])

  const fetchActiveSessions = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)

    try {
      // Get sessions with activity in the last 30 minutes
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

      const { data: recentMessages, error } = await supabase
        .from('messages')
        .select('session_id, role, content, created_at')
        .eq('bot_id', botId)
        .gte('created_at', thirtyMinutesAgo)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group by session
      const sessionMap = new Map<string, ActiveSession>()

      recentMessages?.forEach((msg) => {
        const existing = sessionMap.get(msg.session_id)

        if (!existing) {
          sessionMap.set(msg.session_id, {
            session_id: msg.session_id,
            last_message: msg.content,
            last_message_time: msg.created_at,
            first_message: msg.content,
            message_count: 1,
            user_messages: msg.role === 'user' ? 1 : 0,
            bot_messages: msg.role === 'assistant' ? 1 : 0,
            status: 'active',
          })
        } else {
          existing.message_count++
          if (msg.role === 'user') existing.user_messages++
          else existing.bot_messages++
          existing.first_message = msg.content // Will be the oldest due to reverse order
        }
      })

      // Determine status based on last activity
      const sessions = Array.from(sessionMap.values()).map((session) => {
        const lastActivityTime = new Date(session.last_message_time).getTime()
        const now = Date.now()
        const minutesSinceActivity = (now - lastActivityTime) / 1000 / 60

        return {
          ...session,
          status: minutesSinceActivity < 5 ? 'active' : minutesSinceActivity < 15 ? 'idle' : 'ended',
        } as ActiveSession
      })

      // Sort by most recent first
      sessions.sort((a, b) =>
        new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      )

      setSessions(sessions)
    } catch (error: any) {
      if (!silent) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch sessions',
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchSessionMessages = async (sessionId: string, silent = false) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('bot_id', botId)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setMessages(data || [])
      setSelectedSession(sessionId)
    } catch (error: any) {
      if (!silent) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch messages',
          variant: 'destructive',
        })
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500'
      case 'idle':
        return 'text-yellow-500'
      case 'ended':
        return 'text-gray-400'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'idle':
        return 'Idle'
      case 'ended':
        return 'Ended'
      default:
        return 'Unknown'
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 1000 / 60)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.push(`/dashboard/bots/${botId}`)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Bot
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Live Chat Monitor</h1>
            <p className="text-gray-600 mt-1">Monitor active conversations in real-time</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'Disable' : 'Enable'} Auto-Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchActiveSessions()}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Active Sessions ({sessions.length})
              </CardTitle>
              <CardDescription>
                Conversations in the last 30 minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No active sessions</p>
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.session_id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedSession === session.session_id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => fetchSessionMessages(session.session_id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Circle className={`h-3 w-3 fill-current ${getStatusColor(session.status)}`} />
                        <span className="text-sm font-medium">
                          Session {session.session_id.slice(0, 8)}...
                        </span>
                      </div>
                      <span className={`text-xs ${getStatusColor(session.status)}`}>
                        {getStatusLabel(session.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {session.first_message}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        <span>{session.message_count} messages</span>
                      </div>
                      <span>{formatTime(session.last_message_time)}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Conversation View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedSession ? `Session ${selectedSession.slice(0, 16)}...` : 'Select a Session'}
              </CardTitle>
              <CardDescription>
                {selectedSession
                  ? `${messages.length} messages in this conversation`
                  : 'Click on a session to view the conversation'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedSession ? (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Select a session from the list to view messages</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 ${
                        message.role === 'user' ? '' : 'flex-row-reverse'
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === 'user'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-purple-100 text-purple-600'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <MessageSquare className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={`flex-1 ${
                          message.role === 'user' ? 'text-left' : 'text-right'
                        }`}
                      >
                        <div
                          className={`inline-block max-w-[80%] p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-blue-50 text-blue-900'
                              : 'bg-purple-50 text-purple-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          {message.metadata && (
                            <div className="mt-2 pt-2 border-t border-current/10">
                              <div className="text-xs opacity-70">
                                {message.metadata.preset_used && (
                                  <span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-700 mr-2">
                                    Preset
                                  </span>
                                )}
                                {message.metadata.action_executed && (
                                  <span className="inline-block px-2 py-0.5 rounded bg-orange-100 text-orange-700">
                                    Action
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(message.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
