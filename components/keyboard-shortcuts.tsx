'use client'

import { useState, useEffect } from 'react'
import { Command, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Shortcut {
  keys: string[]
  description: string
  category: string
}

const shortcuts: Shortcut[] = [
  // Navigation
  { keys: ['G', 'D'], description: 'Go to Dashboard', category: 'Navigation' },
  { keys: ['G', 'B'], description: 'Go to Bots', category: 'Navigation' },
  { keys: ['G', 'A'], description: 'Go to Analytics', category: 'Navigation' },
  { keys: ['G', 'C'], description: 'Go to Conversations', category: 'Navigation' },
  { keys: ['G', 'T'], description: 'Go to Templates', category: 'Navigation' },
  { keys: ['G', 'Q'], description: 'Go to Quick Replies', category: 'Navigation' },
  { keys: ['G', 'S'], description: 'Go to Settings', category: 'Navigation' },

  // Actions
  { keys: ['C'], description: 'Create new bot', category: 'Actions' },
  { keys: ['N'], description: 'Create quick reply', category: 'Actions' },
  { keys: ['⌘', 'K'], description: 'Open command palette', category: 'Actions' },
  { keys: ['⌘', '/'], description: 'Toggle shortcuts help', category: 'Actions' },
  { keys: ['Esc'], description: 'Close modal/dialog', category: 'Actions' },
  { keys: ['⌘', 'S'], description: 'Save current form', category: 'Actions' },

  // Search & Filter
  { keys: ['/'], description: 'Focus search', category: 'Search' },
  { keys: ['⌘', 'F'], description: 'Find in page', category: 'Search' },
  { keys: ['F'], description: 'Toggle filters', category: 'Search' },

  // Theme
  { keys: ['⌘', 'D'], description: 'Toggle dark mode', category: 'Theme' },

  // List Navigation
  { keys: ['↓'], description: 'Next item', category: 'Navigation' },
  { keys: ['↑'], description: 'Previous item', category: 'Navigation' },
  { keys: ['Enter'], description: 'Select item', category: 'Navigation' },
  { keys: ['⌘', 'Enter'], description: 'Open in new tab', category: 'Navigation' },
]

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const categories = Array.from(new Set(shortcuts.map(s => s.category)))

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-3xl max-h-[80vh] overflow-y-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Command className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Keyboard Shortcuts</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Press <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">⌘</kbd>+
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">/</kbd> to toggle
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-6">
              {categories.map((category) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-3">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {shortcuts
                      .filter((s) => s.category === category)
                      .map((shortcut, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {shortcut.description}
                          </span>
                          <div className="flex items-center gap-1">
                            {shortcut.keys.map((key, idx) => (
                              <span key={idx} className="flex items-center">
                                <kbd className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-mono shadow-sm">
                                  {key}
                                </kbd>
                                {idx < shortcut.keys.length - 1 && (
                                  <span className="mx-1 text-gray-400">+</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>💡 Tip:</strong> On Mac, use <kbd className="px-2 py-1 bg-white dark:bg-blue-950 rounded text-xs">⌘</kbd>.
                On Windows/Linux, use <kbd className="px-2 py-1 bg-white dark:bg-blue-950 rounded text-xs">Ctrl</kbd>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

// Hook to use keyboard shortcuts
export function useKeyboardShortcut(key: string, callback: () => void, options?: {
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
}) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === key.toLowerCase() &&
        (options?.ctrlKey === undefined || e.ctrlKey === options.ctrlKey) &&
        (options?.shiftKey === undefined || e.shiftKey === options.shiftKey) &&
        (options?.altKey === undefined || e.altKey === options.altKey) &&
        (options?.metaKey === undefined || e.metaKey === options.metaKey)
      ) {
        e.preventDefault()
        callback()
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [key, callback, options])
}

// Keyboard shortcut badge component
export function KbdBadge({ keys }: { keys: string[] }) {
  return (
    <span className="inline-flex items-center gap-1">
      {keys.map((key, idx) => (
        <span key={idx} className="inline-flex items-center">
          <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-xs font-mono">
            {key}
          </kbd>
          {idx < keys.length - 1 && <span className="mx-0.5 text-gray-400 text-xs">+</span>}
        </span>
      ))}
    </span>
  )
}
