'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Bot, MessageSquare, Users, Key, Settings, Database, FileText, TrendingUp, Plus } from 'lucide-react'
import { createBrowserSupabaseClient } from '@/lib/supabase'

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  action: () => void
  category: string
  keywords?: string[]
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [commands, setCommands] = useState<CommandItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  // Load dynamic commands (bots, conversations)
  useEffect(() => {
    loadCommands()
  }, [])

  const loadCommands = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Fetch user's bots
    const { data: bots } = await supabase
      .from('bots')
      .select('id, name, description')
      .eq('user_id', user.id)
      .limit(10)

    const botCommands: CommandItem[] = (bots || []).map(bot => ({
      id: `bot-${bot.id}`,
      label: bot.name,
      description: bot.description || 'Open bot settings',
      icon: <Bot className="h-4 w-4" />,
      action: () => {
        router.push(`/dashboard/bots/${bot.id}`)
        setOpen(false)
      },
      category: 'Bots',
      keywords: [bot.name.toLowerCase(), bot.description?.toLowerCase() || ''],
    }))

    const staticCommands: CommandItem[] = [
      {
        id: 'create-bot',
        label: 'Create New Bot',
        description: 'Start building a new AI chatbot',
        icon: <Plus className="h-4 w-4" />,
        action: () => {
          router.push('/dashboard/bots/new')
          setOpen(false)
        },
        category: 'Actions',
        keywords: ['create', 'new', 'bot', 'add'],
      },
      {
        id: 'conversations',
        label: 'All Conversations',
        description: 'View all conversations across your bots',
        icon: <MessageSquare className="h-4 w-4" />,
        action: () => {
          router.push('/dashboard/admin/conversations')
          setOpen(false)
        },
        category: 'Navigation',
        keywords: ['conversations', 'messages', 'chat'],
      },
      {
        id: 'team',
        label: 'Team Management',
        description: 'Manage team members and permissions',
        icon: <Users className="h-4 w-4" />,
        action: () => {
          router.push('/dashboard/team')
          setOpen(false)
        },
        category: 'Navigation',
        keywords: ['team', 'members', 'collaborate'],
      },
      {
        id: 'api-keys',
        label: 'API Keys',
        description: 'Manage your API keys and integrations',
        icon: <Key className="h-4 w-4" />,
        action: () => {
          router.push('/dashboard/api-keys')
          setOpen(false)
        },
        category: 'Navigation',
        keywords: ['api', 'keys', 'integration'],
      },
      {
        id: 'training',
        label: 'Training Data',
        description: 'Manage bot training data and knowledge base',
        icon: <Database className="h-4 w-4" />,
        action: () => {
          router.push('/dashboard/training')
          setOpen(false)
        },
        category: 'Navigation',
        keywords: ['training', 'data', 'knowledge'],
      },
      {
        id: 'settings',
        label: 'Settings',
        description: 'Account and app settings',
        icon: <Settings className="h-4 w-4" />,
        action: () => {
          router.push('/dashboard/settings')
          setOpen(false)
        },
        category: 'Navigation',
        keywords: ['settings', 'preferences', 'account'],
      },
      {
        id: 'notifications',
        label: 'Notification Settings',
        description: 'Manage email notifications',
        icon: <Settings className="h-4 w-4" />,
        action: () => {
          router.push('/dashboard/settings/notifications')
          setOpen(false)
        },
        category: 'Settings',
        keywords: ['notifications', 'email', 'alerts'],
      },
    ]

    setCommands([...staticCommands, ...botCommands])
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
      }

      if (!open) return

      if (e.key === 'Escape') {
        setOpen(false)
        setSearch('')
        setSelectedIndex(0)
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1))
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        filteredCommands[selectedIndex]?.action()
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, selectedIndex])

  // Filter commands based on search
  const filteredCommands = commands.filter((command) => {
    const searchLower = search.toLowerCase()
    return (
      command.label.toLowerCase().includes(searchLower) ||
      command.description?.toLowerCase().includes(searchLower) ||
      command.keywords?.some((keyword) => keyword.includes(searchLower))
    )
  })

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = []
    }
    acc[command.category].push(command)
    return acc
  }, {} as Record<string, CommandItem[]>)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Command Palette */}
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for commands, bots, or navigate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-400"
            autoFocus
          />
          <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-300 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-12 text-center text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No results found for "{search}"</p>
              <p className="text-sm mt-1">Try searching for bots, conversations, or settings</p>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, items]) => (
              <div key={category} className="py-2">
                <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {category}
                </div>
                {items.map((command, index) => {
                  const globalIndex = filteredCommands.indexOf(command)
                  const isSelected = globalIndex === selectedIndex

                  return (
                    <button
                      key={command.id}
                      onClick={command.action}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                        isSelected ? 'bg-primary text-white' : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className={isSelected ? 'text-white' : 'text-gray-400'}>
                        {command.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium truncate ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                          {command.label}
                        </div>
                        {command.description && (
                          <div className={`text-sm truncate ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                            {command.description}
                          </div>
                        )}
                      </div>
                      <kbd className={`hidden sm:inline-block px-2 py-1 text-xs font-semibold rounded ${
                        isSelected
                          ? 'bg-white/20 text-white border border-white/30'
                          : 'bg-gray-100 text-gray-500 border border-gray-300'
                      }`}>
                        ↵
                      </kbd>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded">ESC</kbd>
              Close
            </span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded">⌘K</kbd>
            to open
          </div>
        </div>
      </div>
    </div>
  )
}
