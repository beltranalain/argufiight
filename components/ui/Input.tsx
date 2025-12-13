import React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helpText?: string
}

export function Input({ 
  label, 
  error, 
  helpText,
  className,
  ...props 
}: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <input
        className={cn(
          'bg-bg-secondary border border-bg-tertiary rounded-lg px-4 py-3.5 text-text-primary',
          'transition-all duration-300 outline-none',
          'focus:border-electric-blue focus:shadow-[0_0_0_3px_rgba(0,217,255,0.1)]',
          'placeholder:text-text-muted',
          error && 'border-neon-orange',
          className
        )}
        value={props.value ?? ''}
        {...props}
      />
      {error && (
        <span className="text-sm text-neon-orange">{error}</span>
      )}
      {helpText && !error && (
        <span className="text-sm text-text-muted">{helpText}</span>
      )}
    </div>
  )
}

