'use client'

// Force dynamic rendering for all dashboard pages
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Bot, LogOut, Settings, Database, MessageSquare, Users, Key, Sparkles, BarChart3, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { ErrorBoundary } from '@/components/error-boundary'
import { CommandPalette } from '@/components/command-palette'
import { ThemeToggle } from '@/components/theme-toggle'
import { KeyboardShortcutsHelp, useKeyboardShortcut } from '@/components/keyboard-shortcuts'
import { useTheme } from 'next-themes'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const { theme, setTheme } = useTheme()

  // Keyboard shortcuts
  useKeyboardShortcut('d', () => router.push('/dashboard'), { shiftKey: false, metaKey: false })
  useKeyboardShortcut('b', () => router.push('/dashboard'), { shiftKey: false, metaKey: false })
  useKeyboardShortcut('a', () => router.push('/dashboard/analytics'), { shiftKey: false, metaKey: false })
  useKeyboardShortcut('c', () => router.push('/dashboard/admin/conversations'), { shiftKey: false, metaKey: false })
  useKeyboardShortcut('t', () => router.push('/dashboard/templates'), { shiftKey: false, metaKey: false })
  useKeyboardShortcut('q', () => router.push('/dashboard/quick-replies'), { shiftKey: false, metaKey: false })
  useKeyboardShortcut('s', () => router.push('/dashboard/settings'), { shiftKey: false, metaKey: false })
  useKeyboardShortcut('d', () => setTheme(theme === 'dark' ? 'light' : 'dark'), { metaKey: true })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const supabase = createBrowserSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      setUser(session.user)
    } catch (error) {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const navItems = [
    { href: '/dashboard', label: 'My Bots', icon: Bot },
    { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/dashboard/templates', label: 'Templates', icon: Sparkles },
    { href: '/dashboard/admin/conversations', label: 'All Conversations', icon: MessageSquare },
    { href: '/dashboard/quick-replies', label: 'Quick Replies', icon: Zap },
    { href: '/dashboard/team', label: 'Team', icon: Users },
    { href: '/dashboard/api-keys', label: 'API Keys', icon: Key },
    { href: '/dashboard/training', label: 'Training Data', icon: Database },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Bot className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">ChatForge AI</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user?.user_metadata?.full_name || user?.email}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">Theme</div>
            <div className="flex gap-1">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64">
        <div className="p-8">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </main>

      {/* Global Command Palette */}
      <CommandPalette />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp />
    </div>
  )
}
