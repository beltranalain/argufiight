import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'large'
  isLoading?: boolean
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  isLoading, 
  className,
  disabled,
  ...props 
}: ButtonProps) {
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
    large: 'px-8 py-4 text-lg'
  }
  
  const baseStyles = `font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${sizeStyles[size === 'large' ? 'xl' : size]}`
  
  const variants = {
    primary: 'bg-electric-blue text-black hover:bg-[#00B8E6] hover:shadow-[0_8px_24px_rgba(0,217,255,0.4)] hover:-translate-y-0.5',
    secondary: 'bg-transparent border-2 border-electric-blue text-electric-blue hover:bg-electric-blue hover:text-black',
    ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-tertiary',
    danger: 'bg-neon-orange text-black hover:bg-[#E55A2B] hover:shadow-[0_8px_24px_rgba(255,107,53,0.4)] hover:-translate-y-0.5',
    success: 'bg-green-500 text-white hover:bg-green-600 hover:shadow-[0_8px_24px_rgba(34,197,94,0.4)] hover:-translate-y-0.5'
  }

  return (
    <button
      className={cn(baseStyles, variants[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          {children}
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </span>
      ) : (
        children
      )}
    </button>
  )
}

