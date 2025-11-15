'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MessageSquare, Calendar, Bot, User, ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { formatRelativeTime } from '@/lib/utils'

interface Message {
  id: string
  role: string
  content: string
  createdAt: string
}

interface Conversation {
  sessionId: string
  botId: string
  botName: string
  messages: Message[]
  startedAt: string
  lastMessageAt: string
  messageCount: number
}

interface BotOption {
  id: string
  name: string
}

export default function AdminConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [bots, setBots] = useState<BotOption[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [expandedConversations, setExpandedConversations] = useState<Set<string>>(new Set())

  // Filters
  const [selectedBot, setSelectedBot] = useState<string>('all')
  const [days, setDays] = useState<string>('30')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchConversations()
  }, [selectedBot, days, searchQuery])

  const fetchConversations = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        days,
        limit: '100',
        offset: '0',
      })

      if (selectedBot !== 'all') {
        params.append('botId', selectedBot)
      }

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }

      const response = await fetch(`/api/admin/conversations?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch conversations')
      }

      setConversations(data.conversations || [])
      setBots(data.bots || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch conversations',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearching(true)
    setSearchQuery(searchInput)
    setTimeout(() => setSearching(false), 500)
  }

  const toggleConversation = (sessionId: string) => {
    const newExpanded = new Set(expandedConversations)
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId)
    } else {
      newExpanded.add(sessionId)
    }
    setExpandedConversations(newExpanded)
  }

  const expandAll = () => {
    setExpandedConversations(new Set(conversations.map(c => c.sessionId)))
  }

  const collapseAll = () => {
    setExpandedConversations(new Set())
  }

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">All Conversations</h1>
        <p className="text-gray-600">
          Monitor and review all conversations across all your bots
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <CardTitle>Filters</CardTitle>
          </div>
          <CardDescription>Filter conversations by bot, date range, or search content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="bot-filter">Bot</Label>
              <Select value={selectedBot} onValueChange={setSelectedBot}>
                <SelectTrigger id="bot-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bots ({bots.length})</SelectItem>
                  {bots.map(bot => (
                    <SelectItem key={bot.id} value={bot.id}>
                      {bot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="days-filter">Time Range</Label>
              <Select value={days} onValueChange={setDays}>
                <SelectTrigger id="days-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 hours</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Search Messages</Label>
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Search conversation content..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  disabled={searching}
                />
                <Button type="submit" disabled={searching} size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>

          {searchQuery && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
              <p className="text-sm text-blue-900">
                Showing results for: <strong>&quot;{searchQuery}&quot;</strong>
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setSearchInput('')
                }}
              >
                Clear search
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Conversations</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{conversations.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {conversations.reduce((sum, c) => sum + c.messageCount, 0)}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Bots</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{bots.length}</p>
              </div>
              <Bot className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {conversations.length > 0 && (
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-600">
            {expandedConversations.size} of {conversations.length} conversations expanded
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        </div>
      )}

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No conversations found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Conversations will appear here once users start chatting with your bots'}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setSearchInput('')
                }}
              >
                Clear search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {conversations.map((conversation) => {
            const isExpanded = expandedConversations.has(conversation.sessionId)
            const preview = conversation.messages[0]?.content || 'No messages'

            return (
              <Card key={conversation.sessionId} className="hover:shadow-md transition-shadow">
                <CardHeader className="cursor-pointer" onClick={() => toggleConversation(conversation.sessionId)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="h-4 w-4 text-gray-500 shrink-0" />
                        <span className="font-semibold text-gray-900">{conversation.botName}</span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">
                          {conversation.messageCount} messages
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-3 w-3" />
                        <span>Started {formatRelativeTime(conversation.startedAt)}</span>
                        <span>•</span>
                        <span>Last message {formatRelativeTime(conversation.lastMessageAt)}</span>
                      </div>
                      {!isExpanded && (
                        <p className="text-sm text-gray-600 mt-2 truncate">
                          {preview}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent>
                    <div className="space-y-4">
                      {conversation.messages.map((message, idx) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${
                            message.role === 'user' ? 'justify-start' : 'justify-end'
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-3 ${
                              message.role === 'user'
                                ? 'bg-gray-100 text-gray-900'
                                : 'bg-primary text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {message.role === 'user' ? (
                                <User className="h-3 w-3" />
                              ) : (
                                <Bot className="h-3 w-3" />
                              )}
                              <span className="text-xs font-semibold">
                                {message.role === 'user' ? 'User' : 'Bot'}
                              </span>
                              <span className="text-xs opacity-70">
                                {formatRelativeTime(message.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Session ID: <code className="bg-gray-100 px-1 py-0.5 rounded">{conversation.sessionId}</code>
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
