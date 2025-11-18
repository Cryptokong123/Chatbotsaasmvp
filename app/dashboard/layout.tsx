'use client'

// Force dynamic rendering for all dashboard pages
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Bot, LogOut, Settings, Database, MessageSquare, Users, Key, Sparkles, BarChart3, Zap, BookTemplate } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { ErrorBoundary } from '@/components/error-boundary'
import { ThemeToggle } from '@/components/theme-toggle'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

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
    { href: '/dashboard/my-templates', label: 'My Templates', icon: BookTemplate },
    { href: '/dashboard/admin/conversations', label: 'All Conversations', icon: MessageSquare },
    { href: '/dashboard/quick-replies', label: 'Quick Replies', icon: Zap },
    { href: '/dashboard/team', label: 'Team', icon: Users },
    { href: '/dashboard/api-keys', label: 'API Keys', icon: Key },
    { href: '/dashboard/training', label: 'Training Data', icon: Database },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-black dark:to-gray-950">
      {/* Sidebar - Transparent with border */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white/50 dark:bg-transparent backdrop-blur-md border-r border-gray-200 dark:border-white/10 shadow-sm dark:shadow-white/5 flex flex-col z-50">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 dark:border-white/10">
          <Link href="/dashboard" className="flex items-center space-x-2 group">
            <div className="relative">
              <Bot className="h-8 w-8 text-gray-900 dark:text-white transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-primary/20 dark:bg-white/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">ChatForge AI</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-white/20">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary/10 to-primary/5 dark:from-white/15 dark:to-white/5 text-primary dark:text-white shadow-sm dark:shadow-white/10 border border-primary/20 dark:border-white/20'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:translate-x-1 border border-transparent'
                }`}
              >
                <Icon className={`h-5 w-5 transition-all ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-white/30 dark:bg-white/5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 dark:from-white dark:to-gray-300 text-white dark:text-black rounded-full flex items-center justify-center font-semibold shadow-md">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.user_metadata?.full_name || user?.email}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Theme</div>
            <div className="flex gap-1">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="Sign out"
                className="dark:hover:bg-white/10 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content - Centered with max width */}
      <main className="ml-64 min-h-screen flex justify-center">
        <div className="w-full max-w-[1600px] p-8 md:p-12">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}
