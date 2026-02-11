'use client'

import { Button } from './Button'

interface ErrorDisplayProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorDisplay({
  title = 'Failed to load',
  message = 'Something went wrong. Please try again.',
  onRetry,
  className = '',
}: ErrorDisplayProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="mb-4">
        <svg className="w-12 h-12 mx-auto text-neon-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-text-primary mb-1">{title}</h3>
      <p className="text-text-secondary text-sm max-w-sm mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary" size="sm">
          Try Again
        </Button>
      )}
    </div>
  )
}
