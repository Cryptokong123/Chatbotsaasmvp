'use client'

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { logger } from '@/lib/error-logger'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the entire app
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error using centralized logger
    logger.error('React Error Boundary caught error', error, {
      component: 'ErrorBoundary',
      action: 'component_error',
      metadata: {
        componentStack: errorInfo.componentStack,
      },
    })

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Store error info in state
    this.setState({
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <div>
                  <CardTitle>Something went wrong</CardTitle>
                  <CardDescription>
                    We encountered an unexpected error. Please try again.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
                  <summary className="cursor-pointer font-medium text-gray-900 dark:text-white mb-2">
                    Error Details (Development Only)
                  </summary>
                  <div className="text-sm space-y-3 mt-3">
                    <div>
                      <p className="font-mono text-red-600 dark:text-red-400 mb-2">
                        {this.state.error.name}: {this.state.error.message}
                      </p>
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong className="text-gray-900 dark:text-white">Stack Trace:</strong>
                        <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-48 mt-1 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <strong className="text-gray-900 dark:text-white">Component Stack:</strong>
                        <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-48 mt-1 bg-gray-50 dark:bg-gray-800 p-2 rounded">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col gap-2">
                <Button onClick={this.handleReset} variant="default" className="w-full">
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={this.handleReload} variant="outline" className="w-full">
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-4">
                If this problem persists, please contact support.
              </p>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Simplified Error Fallback Component
 * Can be used as a custom fallback prop
 */
export function ErrorFallback({
  error,
  resetError,
}: {
  error?: Error
  resetError?: () => void
}) {
  return (
    <div className="min-h-[300px] flex items-center justify-center p-4">
      <div className="text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Oops! Something went wrong</h3>
        <p className="text-gray-600 mb-4">
          {error?.message || 'An unexpected error occurred'}
        </p>
        {resetError && (
          <Button onClick={resetError} variant="outline">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  )
}
