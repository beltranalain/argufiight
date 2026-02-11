'use client'

import { useEffect } from 'react'

export default function AdvertiserError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Advertiser error:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-4">
          <svg className="w-16 h-16 mx-auto text-neon-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Something went wrong</h2>
        <p className="text-text-secondary mb-6">
          We hit an error loading this page. Please try again.
        </p>
        {process.env.NODE_ENV === 'development' && error.message && (
          <pre className="text-xs text-red-400 bg-bg-tertiary p-3 rounded mb-4 text-left overflow-auto max-h-32">
            {error.message}
          </pre>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2 bg-electric-blue text-black font-semibold rounded-lg hover:opacity-90 transition"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/advertiser/dashboard'}
            className="px-6 py-2 bg-bg-tertiary text-text-primary rounded-lg hover:opacity-90 transition"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
