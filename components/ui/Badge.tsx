import React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'sports' | 'politics' | 'tech' | 'entertainment' | 'science' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
}

export function Badge({ 
  children, 
  variant = 'default',
  size = 'md',
  className,
  ...props 
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-bold rounded-full transition-colors'
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  }
  
  const variants = {
    default: 'bg-bg-tertiary text-text-secondary',
    sports: 'bg-electric-blue text-black',
    politics: 'bg-hot-pink text-white',
    tech: 'bg-cyber-green text-black',
    entertainment: 'bg-neon-orange text-black',
    science: 'bg-electric-blue text-black',
    success: 'bg-cyber-green/20 text-cyber-green border border-cyber-green/30',
    warning: 'bg-neon-orange/20 text-neon-orange border border-neon-orange/30',
    error: 'bg-red-500/20 text-red-500 border border-red-500/30',
  }

  return (
    <span
      className={cn(
        baseStyles,
        sizes[size],
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

