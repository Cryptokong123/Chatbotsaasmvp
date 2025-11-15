'use client'

/**
 * Global Error Boundary
 * Catches errors in the root layout
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h1>Application Error</h1>
          <p>Something went wrong. Please try refreshing the page.</p>
          <button onClick={reset} style={{ marginTop: '20px', padding: '10px 20px' }}>
            Try Again
          </button>
        </div>
      </body>
    </html>
  )
}
