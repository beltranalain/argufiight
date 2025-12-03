import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated'
  hover?: boolean
  glow?: boolean
}

export function Card({ 
  children, 
  variant = 'default',
  hover = false,
  glow = false,
  className,
  ...props 
}: CardProps) {
  const baseStyles = 'rounded-xl transition-all duration-300'
  
  const variants = {
    default: 'bg-bg-secondary border border-bg-tertiary',
    bordered: 'bg-transparent border-2 border-bg-tertiary',
    elevated: 'bg-bg-secondary shadow-lg',
  }
  
  const hoverStyles = hover ? 'hover:border-electric-blue hover:shadow-[0_8px_32px_rgba(0,217,255,0.3)] hover:-translate-y-1' : ''
  const glowStyles = glow ? 'border-electric-blue shadow-[0_0_20px_rgba(0,217,255,0.5)]' : ''

  return (
    <div
      className={cn(
        baseStyles,
        variants[variant],
        hoverStyles,
        glowStyles,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardHeader({ children, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn('p-6 border-b border-bg-tertiary', className)} {...props}>
      {children}
    </div>
  )
}

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardBody({ children, className, ...props }: CardBodyProps) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  )
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CardFooter({ children, className, ...props }: CardFooterProps) {
  return (
    <div className={cn('p-6 border-t border-bg-tertiary', className)} {...props}>
      {children}
    </div>
  )
}

