'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MessageSquare, Calendar, Bot, User, ChevronDown, ChevronUp, Filter, Download, FileJson, FileSpreadsheet, Tag, StickyNote, Clock, ThumbsUp, BarChart3, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { formatRelativeTime } from '@/lib/utils'
import { exportToCSV, exportToJSON, downloadFile, generateExportFilename } from '@/lib/export-utils'
import { ConversationsListSkeleton, StatCardSkeleton } from '@/components/skeletons'
import { NoConversationsEmpty } from '@/components/empty-states'

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
  tags?: string[]
  notes?: string
}

interface BotOption {
  id: string
  name: string
}

interface Analytics {
  averageResponseTime: number
  averageResponseTimeSeconds: number
  totalConversations: number
  totalMessages: number
  satisfactionScore: number
  totalRatings: number
  positiveRatings: number
  negativeRatings: number
}

const PREDEFINED_TAGS = [
  'Support',
  'Sales',
  'Feedback',
  'Bug Report',
  'Feature Request',
  'Question',
  'Complaint',
  'Positive',
  'Resolved',
  'Follow-up Needed',
]

export default function AdminConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [bots, setBots] = useState<BotOption[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [expandedConversations, setExpandedConversations] = useState<Set<string>>(new Set())
  const [showAnalytics, setShowAnalytics] = useState(true)

  // Editing state
  const [editingTags, setEditingTags] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [tempTags, setTempTags] = useState<string[]>([])
  const [tempNotes, setTempNotes] = useState('')

  // Filters
  const [selectedBot, setSelectedBot] = useState<string>('all')
  const [days, setDays] = useState<string>('30')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchConversations()
    fetchAnalytics()
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

      // Fetch metadata for conversations
      if (data.conversations?.length > 0) {
        await fetchMetadata(data.conversations.map((c: Conversation) => c.sessionId))
      }
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

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams({ days })
      if (selectedBot !== 'all') {
        params.append('botId', selectedBot)
      }

      const response = await fetch(`/api/admin/conversations/analytics?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }

  const fetchMetadata = async (sessionIds: string[]) => {
    try {
      const response = await fetch(`/api/admin/conversations/metadata?sessionIds=${sessionIds.join(',')}`)
      const data = await response.json()

      if (response.ok && data.metadata) {
        // Update conversations with metadata
        setConversations((prevConversations) =>
          prevConversations.map((conv) => {
            const metadata = data.metadata.find((m: any) => m.session_id === conv.sessionId)
            return metadata
              ? { ...conv, tags: metadata.tags, notes: metadata.notes }
              : conv
          })
        )
      }
    } catch (error) {
      console.error('Failed to fetch metadata:', error)
    }
  }

  const saveMetadata = async (sessionId: string, botId: string, tags: string[], notes: string) => {
    try {
      const response = await fetch('/api/admin/conversations/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, botId, tags, notes }),
      })

      if (!response.ok) {
        throw new Error('Failed to save metadata')
      }

      // Update local state
      setConversations((prev) =>
        prev.map((conv) =>
          conv.sessionId === sessionId ? { ...conv, tags, notes } : conv
        )
      )

      toast({
        title: 'Success',
        description: 'Conversation updated successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update conversation',
        variant: 'destructive',
      })
    }
  }

  const handleExportCSV = () => {
    try {
      const csv = exportToCSV(conversations)
      const filename = generateExportFilename('csv', 'conversations')
      downloadFile(csv, filename, 'text/csv')
      toast({
        title: 'Success',
        description: `Exported ${conversations.length} conversations to CSV`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export conversations',
        variant: 'destructive',
      })
    }
  }

  const handleExportJSON = () => {
    try {
      const json = exportToJSON(conversations)
      const filename = generateExportFilename('json', 'conversations')
      downloadFile(json, filename, 'application/json')
      toast({
        title: 'Success',
        description: `Exported ${conversations.length} conversations to JSON`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export conversations',
        variant: 'destructive',
      })
    }
  }

  const handleExportSingleCSV = (conversation: Conversation) => {
    try {
      const csv = exportToCSV([conversation])
      const filename = generateExportFilename('csv', `conversation_${conversation.sessionId.substring(0, 8)}`)
      downloadFile(csv, filename, 'text/csv')
      toast({
        title: 'Success',
        description: 'Conversation exported to CSV',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export conversation',
        variant: 'destructive',
      })
    }
  }

  const handleExportSingleJSON = (conversation: Conversation) => {
    try {
      const json = exportToJSON([conversation])
      const filename = generateExportFilename('json', `conversation_${conversation.sessionId.substring(0, 8)}`)
      downloadFile(json, filename, 'application/json')
      toast({
        title: 'Success',
        description: 'Conversation exported to JSON',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export conversation',
        variant: 'destructive',
      })
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
    setExpandedConversations(new Set(filteredConversations.map(c => c.sessionId)))
  }

  const collapseAll = () => {
    setExpandedConversations(new Set())
  }

  const startEditingTags = (conv: Conversation) => {
    setEditingTags(conv.sessionId)
    setTempTags(conv.tags || [])
  }

  const startEditingNotes = (conv: Conversation) => {
    setEditingNotes(conv.sessionId)
    setTempNotes(conv.notes || '')
  }

  const saveTags = async (conv: Conversation) => {
    await saveMetadata(conv.sessionId, conv.botId, tempTags, conv.notes || '')
    setEditingTags(null)
  }

  const saveNotes = async (conv: Conversation) => {
    await saveMetadata(conv.sessionId, conv.botId, conv.tags || [], tempNotes)
    setEditingNotes(null)
  }

  const addTag = (tag: string) => {
    if (!tempTags.includes(tag)) {
      setTempTags([...tempTags, tag])
    }
  }

  const removeTag = (tag: string) => {
    setTempTags(tempTags.filter(t => t !== tag))
  }

  const toggleTagFilter = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const clearTagFilters = () => {
    setSelectedTags([])
  }

  // Filter conversations by selected tags
  const filteredConversations = selectedTags.length > 0
    ? conversations.filter((conv) =>
        selectedTags.every((tag) => conv.tags?.includes(tag))
      )
    : conversations

  const formatResponseTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  if (loading && conversations.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">All Conversations</h1>
              <p className="text-gray-600">Monitor and review all conversations across all your bots</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <ConversationsListSkeleton />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">All Conversations</h1>
            <p className="text-gray-600">
              Monitor and review all conversations across all your bots
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV} disabled={conversations.length === 0}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={handleExportJSON} disabled={conversations.length === 0}>
              <FileJson className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>
      </div>

      {/* Analytics Toggle */}
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => setShowAnalytics(!showAnalytics)}>
          <BarChart3 className="h-4 w-4 mr-2" />
          {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
        </Button>
      </div>

      {/* Analytics Cards */}
      {showAnalytics && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatResponseTime(analytics.averageResponseTime)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{analytics.averageResponseTimeSeconds}s average</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Satisfaction</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{analytics.satisfactionScore}%</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.positiveRatings} 👍 / {analytics.negativeRatings} 👎
                  </p>
                </div>
                <ThumbsUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Conversations</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{conversations.length}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-purple-500" />
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
                <MessageSquare className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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

          {/* Tag Filters */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-4 w-4 text-gray-500" />
              <Label className="text-sm font-medium">Filter by Tags</Label>
              {selectedTags.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearTagFilters} className="h-6 px-2 text-xs">
                  Clear all
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag)
                const tagCount = conversations.filter((conv) => conv.tags?.includes(tag)).length
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTagFilter(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    disabled={tagCount === 0}
                  >
                    {tag} ({tagCount})
                  </button>
                )
              })}
            </div>
            {selectedTags.length > 0 && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-900">
                  Filtering by: {selectedTags.map((tag, idx) => (
                    <span key={tag}>
                      <strong>{tag}</strong>
                      {idx < selectedTags.length - 1 && ' AND '}
                    </span>
                  ))}
                  {' '}({filteredConversations.length} conversations)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {filteredConversations.length > 0 && (
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-600">
            {expandedConversations.size} of {filteredConversations.length} conversations expanded
            {selectedTags.length > 0 && ` (${conversations.length} total)`}
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
      {filteredConversations.length === 0 ? (
        <NoConversationsEmpty
          hasFilters={!!(searchQuery || selectedTags.length > 0)}
          onClearFilters={() => {
            setSearchQuery('')
            setSearchInput('')
            clearTagFilters()
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredConversations.map((conversation) => {
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

                      {/* Tags */}
                      {conversation.tags && conversation.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {conversation.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

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
                    {/* Tag Management */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-semibold">Tags</Label>
                        {editingTags !== conversation.sessionId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              startEditingTags(conversation)
                            }}
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {conversation.tags?.length ? 'Edit' : 'Add Tags'}
                          </Button>
                        )}
                      </div>

                      {editingTags === conversation.sessionId ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {PREDEFINED_TAGS.map((tag) => (
                              <button
                                key={tag}
                                onClick={() => tempTags.includes(tag) ? removeTag(tag) : addTag(tag)}
                                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                  tempTags.includes(tag)
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveTags(conversation)}>
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingTags(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {conversation.tags?.length ? (
                            conversation.tags.map((tag) => (
                              <span key={tag} className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {tag}
                              </span>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">No tags added</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Notes Management */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-semibold">Notes</Label>
                        {editingNotes !== conversation.sessionId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              startEditingNotes(conversation)
                            }}
                          >
                            <StickyNote className="h-3 w-3 mr-1" />
                            {conversation.notes ? 'Edit' : 'Add Notes'}
                          </Button>
                        )}
                      </div>

                      {editingNotes === conversation.sessionId ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          <Textarea
                            value={tempNotes}
                            onChange={(e) => setTempNotes(e.target.value)}
                            placeholder="Add notes about this conversation..."
                            className="mb-2"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveNotes(conversation)}>
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingNotes(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {conversation.notes || <span className="text-gray-500">No notes added</span>}
                        </p>
                      )}
                    </div>

                    {/* Messages */}
                    <div className="space-y-4">
                      {conversation.messages.map((message) => (
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

                    {/* Export Options */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-gray-500">
                          Session ID: <code className="bg-gray-100 px-1 py-0.5 rounded">{conversation.sessionId}</code>
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleExportSingleCSV(conversation)
                            }}
                          >
                            <FileSpreadsheet className="h-3 w-3 mr-1" />
                            Export CSV
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleExportSingleJSON(conversation)
                            }}
                          >
                            <FileJson className="h-3 w-3 mr-1" />
                            Export JSON
                          </Button>
                        </div>
                      </div>
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
