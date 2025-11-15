'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Clock, TrendingUp, X, Filter, Calendar, Bot as BotIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

interface SearchSuggestion {
  type: 'recent' | 'popular' | 'bot' | 'tag' | 'date'
  text: string
  icon: React.ReactNode
  count?: number
}

interface ConversationSearchProps {
  onSearch: (query: string, filters?: SearchFilters) => void
  bots?: Array<{ id: string; name: string }>
  tags?: string[]
  placeholder?: string
}

interface SearchFilters {
  botId?: string
  tag?: string
  dateRange?: string
}

export function ConversationSearch({ onSearch, bots = [], tags = [], placeholder = 'Search conversations...' }: ConversationSearchProps) {
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent_searches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load recent searches')
      }
    }
  }, [])

  // Generate suggestions based on query
  const getSuggestions = (): SearchSuggestion[] => {
    const suggestions: SearchSuggestion[] = []

    // Recent searches
    if (query === '' && recentSearches.length > 0) {
      recentSearches.slice(0, 5).forEach(search => {
        suggestions.push({
          type: 'recent',
          text: search,
          icon: <Clock className="h-4 w-4 text-gray-400" />,
        })
      })
    }

    // Bot suggestions
    if (query.length > 0) {
      const matchingBots = bots.filter(bot =>
        bot.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 3)

      matchingBots.forEach(bot => {
        suggestions.push({
          type: 'bot',
          text: `in:${bot.name}`,
          icon: <BotIcon className="h-4 w-4 text-blue-500" />,
        })
      })

      // Tag suggestions
      const matchingTags = tags.filter(tag =>
        tag.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 3)

      matchingTags.forEach(tag => {
        suggestions.push({
          type: 'tag',
          text: `tag:${tag}`,
          icon: <Filter className="h-4 w-4 text-purple-500" />,
        })
      })

      // Date range suggestions
      const dateRanges = [
        { text: 'date:today', label: 'Today' },
        { text: 'date:yesterday', label: 'Yesterday' },
        { text: 'date:week', label: 'This week' },
        { text: 'date:month', label: 'This month' },
      ]

      if (query.toLowerCase().includes('date') || query.toLowerCase().includes('today') || query.toLowerCase().includes('yesterday')) {
        dateRanges.forEach(range => {
          suggestions.push({
            type: 'date',
            text: range.text,
            icon: <Calendar className="h-4 w-4 text-green-500" />,
          })
        })
      }
    }

    return suggestions
  }

  const suggestions = getSuggestions()

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      onSearch('')
      return
    }

    // Parse search filters
    const filters: SearchFilters = {}
    let cleanQuery = searchQuery

    // Parse bot filter: in:BotName
    const botMatch = searchQuery.match(/in:([^\s]+)/i)
    if (botMatch) {
      const botName = botMatch[1]
      const bot = bots.find(b => b.name.toLowerCase() === botName.toLowerCase())
      if (bot) {
        filters.botId = bot.id
        cleanQuery = cleanQuery.replace(botMatch[0], '').trim()
      }
    }

    // Parse tag filter: tag:TagName
    const tagMatch = searchQuery.match(/tag:([^\s]+)/i)
    if (tagMatch) {
      filters.tag = tagMatch[1]
      cleanQuery = cleanQuery.replace(tagMatch[0], '').trim()
    }

    // Parse date filter: date:range
    const dateMatch = searchQuery.match(/date:([^\s]+)/i)
    if (dateMatch) {
      filters.dateRange = dateMatch[1]
      cleanQuery = cleanQuery.replace(dateMatch[0], '').trim()
    }

    // Save to recent searches
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10)
    setRecentSearches(updated)
    localStorage.setItem('recent_searches', JSON.stringify(updated))

    onSearch(cleanQuery, filters)
    setShowSuggestions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (suggestions.length > 0 && selectedIndex >= 0) {
        setQuery(suggestions[selectedIndex].text)
        handleSearch(suggestions[selectedIndex].text)
      } else {
        handleSearch(query)
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const clearSearch = () => {
    setQuery('')
    onSearch('')
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('recent_searches')
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setShowSuggestions(true)
            setSelectedIndex(0)
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute z-50 w-full mt-2 shadow-lg">
          <CardContent className="p-0">
            <div className="py-2">
              {/* Header for recent searches */}
              {query === '' && recentSearches.length > 0 && (
                <div className="flex items-center justify-between px-4 py-2 border-b">
                  <span className="text-xs font-medium text-gray-500 uppercase">Recent Searches</span>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${suggestion.text}`}
                  onClick={() => {
                    setQuery(suggestion.text)
                    handleSearch(suggestion.text)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors ${
                    index === selectedIndex ? 'bg-gray-50' : ''
                  }`}
                >
                  {suggestion.icon}
                  <span className="flex-1 text-left text-sm text-gray-700">
                    {suggestion.text}
                  </span>
                  {suggestion.count !== undefined && (
                    <span className="text-xs text-gray-400">{suggestion.count} results</span>
                  )}
                </button>
              ))}

              {/* Search tips */}
              {query.length > 0 && (
                <div className="border-t mt-2 pt-2 px-4 pb-2">
                  <p className="text-xs text-gray-500 mb-1">💡 Search tips:</p>
                  <div className="space-y-1 text-xs text-gray-500">
                    <p><code className="bg-gray-100 px-1 rounded">in:BotName</code> - Filter by bot</p>
                    <p><code className="bg-gray-100 px-1 rounded">tag:Support</code> - Filter by tag</p>
                    <p><code className="bg-gray-100 px-1 rounded">date:today</code> - Filter by date</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Click outside to close */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  )
}

// Helper component for displaying active filters
export function ActiveFilters({
  filters,
  onRemove
}: {
  filters: SearchFilters
  onRemove: (filterType: keyof SearchFilters) => void
}) {
  const hasFilters = Object.keys(filters).length > 0

  if (!hasFilters) return null

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {filters.botId && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm">
          <BotIcon className="h-4 w-4" />
          <span>Bot filter</span>
          <button onClick={() => onRemove('botId')} className="hover:text-blue-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {filters.tag && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm">
          <Filter className="h-4 w-4" />
          <span>{filters.tag}</span>
          <button onClick={() => onRemove('tag')} className="hover:text-purple-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {filters.dateRange && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm">
          <Calendar className="h-4 w-4" />
          <span>{filters.dateRange}</span>
          <button onClick={() => onRemove('dateRange')} className="hover:text-green-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
