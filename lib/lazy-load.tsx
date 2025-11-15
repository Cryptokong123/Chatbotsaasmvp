/**
 * Lazy Loading Utilities
 *
 * Utilities for code splitting and lazy loading components
 */

import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

interface LoadingProps {
  className?: string
}

/**
 * Default loading component
 */
export function DefaultLoader({ className }: LoadingProps) {
  return (
    <div className={`flex items-center justify-center p-8 ${className || ''}`}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

/**
 * Skeleton loader for content
 */
export function SkeletonLoader({ className }: LoadingProps) {
  return (
    <div className={`animate-pulse space-y-4 ${className || ''}`}>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
    </div>
  )
}

/**
 * Create a lazy-loaded component with custom loading state
 */
export function lazyLoad<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    loading?: ComponentType<LoadingProps>
    ssr?: boolean
  }
) {
  return dynamic(importFunc, {
    loading: options?.loading || DefaultLoader,
    ssr: options?.ssr ?? true,
  })
}

/**
 * Lazy load with skeleton
 */
export function lazyLoadWithSkeleton<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>
) {
  return lazyLoad(importFunc, { loading: SkeletonLoader })
}

/**
 * Lazy load client-side only (no SSR)
 */
export function lazyLoadClientOnly<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  loading?: ComponentType<LoadingProps>
) {
  return lazyLoad(importFunc, { loading, ssr: false })
}

/**
 * Prefetch a component
 */
export async function prefetchComponent<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>
): Promise<void> {
  try {
    await importFunc()
  } catch (error) {
    console.error('Failed to prefetch component:', error)
  }
}

/**
 * Hook to lazy load a component on interaction
 */
export function useLazyLoadOnInteraction<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>
) {
  const [Component, setComponent] = useState<ComponentType<P> | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadComponent = useCallback(async () => {
    if (Component || isLoading) return

    setIsLoading(true)
    try {
      const module = await importFunc()
      setComponent(() => module.default)
    } catch (error) {
      console.error('Failed to load component:', error)
    } finally {
      setIsLoading(false)
    }
  }, [Component, isLoading, importFunc])

  return {
    Component,
    isLoading,
    loadComponent,
  }
}

/**
 * Lazy load routes/pages
 */
export const LazyRoutes = {
  // Dashboard routes
  Analytics: lazyLoadWithSkeleton(() => import('@/components/analytics-dashboard')),
  BotBuilder: lazyLoadWithSkeleton(() => import('@/components/bot-builder')),
  ConversationView: lazyLoadWithSkeleton(() => import('@/components/conversation-view')),

  // Admin routes
  AdminPanel: lazyLoadClientOnly(() => import('@/components/admin-panel')),

  // Heavy components
  RichTextEditor: lazyLoadClientOnly(() => import('@/components/rich-text-editor')),
  MarkdownEditor: lazyLoadClientOnly(() => import('@/components/markdown-editor')),
  CodeEditor: lazyLoadClientOnly(() => import('@/components/code-editor')),

  // Charts (can be large)
  AnalyticsCharts: lazyLoadClientOnly(() => import('@/components/analytics-charts')),
}

// Re-export for convenience
import { useState, useCallback } from 'react'
