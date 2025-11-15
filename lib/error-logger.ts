/**
 * Global Error Logger
 *
 * Centralized error logging for both client and server
 */

export type ErrorLevel = 'info' | 'warning' | 'error' | 'fatal'

export interface ErrorContext {
  userId?: string
  botId?: string
  conversationId?: string
  route?: string
  component?: string
  action?: string
  metadata?: Record<string, any>
}

export interface LoggedError {
  level: ErrorLevel
  message: string
  error?: Error
  context?: ErrorContext
  timestamp: string
  stack?: string
  userAgent?: string
  url?: string
}

/**
 * Log error to console and external services
 */
export async function logError(
  level: ErrorLevel,
  message: string,
  error?: Error,
  context?: ErrorContext
): Promise<void> {
  const loggedError: LoggedError = {
    level,
    message,
    error,
    context,
    timestamp: new Date().toISOString(),
    stack: error?.stack,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  }

  // Console logging with color coding
  const consoleMethod = level === 'fatal' || level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log'
  console[consoleMethod](`[${level.toUpperCase()}] ${message}`, {
    error,
    context,
    stack: error?.stack,
  })

  // Send to Sentry if configured
  if (process.env.NEXT_PUBLIC_SENTRY_DSN && typeof window !== 'undefined') {
    try {
      // @ts-ignore - Sentry will be loaded globally if configured
      if (window.Sentry) {
        // @ts-ignore
        window.Sentry.captureException(error || new Error(message), {
          level: level === 'fatal' ? 'fatal' : level,
          tags: {
            component: context?.component,
            action: context?.action,
          },
          extra: {
            ...context,
            ...context?.metadata,
          },
        })
      }
    } catch (e) {
      console.error('Failed to send error to Sentry:', e)
    }
  }

  // Send to server-side logging endpoint (for client-side errors)
  if (typeof window !== 'undefined' && (level === 'error' || level === 'fatal')) {
    try {
      await fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level,
          message,
          error: error ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          } : undefined,
          context,
          timestamp: loggedError.timestamp,
          userAgent: loggedError.userAgent,
          url: loggedError.url,
        }),
      }).catch(() => {
        // Silently fail - don't let logging errors break the app
      })
    } catch (e) {
      // Silently fail
    }
  }

  // Store in local storage for debugging (last 50 errors)
  if (typeof window !== 'undefined') {
    try {
      const storedErrors = JSON.parse(localStorage.getItem('chatforge_errors') || '[]')
      storedErrors.unshift({
        level,
        message,
        timestamp: loggedError.timestamp,
        error: error ? {
          name: error.name,
          message: error.message,
        } : undefined,
        context,
      })
      // Keep only last 50 errors
      localStorage.setItem('chatforge_errors', JSON.stringify(storedErrors.slice(0, 50)))
    } catch (e) {
      // LocalStorage might be full or unavailable
    }
  }
}

/**
 * Convenience functions for different error levels
 */
export const logger = {
  info: (message: string, context?: ErrorContext) =>
    logError('info', message, undefined, context),

  warning: (message: string, error?: Error, context?: ErrorContext) =>
    logError('warning', message, error, context),

  error: (message: string, error?: Error, context?: ErrorContext) =>
    logError('error', message, error, context),

  fatal: (message: string, error?: Error, context?: ErrorContext) =>
    logError('fatal', message, error, context),
}

/**
 * Wrap an async function with error logging
 */
export function withErrorLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: ErrorContext
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      await logError('error', `Error in ${context.action || 'operation'}`, error as Error, context)
      throw error
    }
  }) as T
}

/**
 * Get stored errors from localStorage
 */
export function getStoredErrors(): LoggedError[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('chatforge_errors') || '[]')
  } catch {
    return []
  }
}

/**
 * Clear stored errors
 */
export function clearStoredErrors(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem('chatforge_errors')
  } catch {
    // Ignore
  }
}

/**
 * Performance monitoring
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T,
  context?: ErrorContext
): T {
  const start = performance.now()
  try {
    const result = fn()
    const duration = performance.now() - start

    if (duration > 1000) {
      logger.warning(`Slow operation: ${name} took ${duration.toFixed(2)}ms`, undefined, {
        ...context,
        metadata: { duration, operation: name },
      })
    }

    return result
  } catch (error) {
    const duration = performance.now() - start
    logError('error', `Error in ${name} after ${duration.toFixed(2)}ms`, error as Error, {
      ...context,
      metadata: { duration, operation: name },
    })
    throw error
  }
}

/**
 * Async performance monitoring
 */
export async function measurePerformanceAsync<T>(
  name: string,
  fn: () => Promise<T>,
  context?: ErrorContext
): Promise<T> {
  const start = performance.now()
  try {
    const result = await fn()
    const duration = performance.now() - start

    if (duration > 2000) {
      logger.warning(`Slow async operation: ${name} took ${duration.toFixed(2)}ms`, undefined, {
        ...context,
        metadata: { duration, operation: name },
      })
    }

    return result
  } catch (error) {
    const duration = performance.now() - start
    logError('error', `Error in ${name} after ${duration.toFixed(2)}ms`, error as Error, {
      ...context,
      metadata: { duration, operation: name },
    })
    throw error
  }
}

/**
 * Handle unhandled promise rejections
 */
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    logError(
      'error',
      'Unhandled Promise Rejection',
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      { component: 'global', action: 'unhandled_rejection' }
    )
  })
}
