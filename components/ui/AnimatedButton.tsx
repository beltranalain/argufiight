'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { buttonHover, buttonTap } from '@/lib/animations'
import { cn } from '@/lib/utils'

interface AnimatedButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onAnimationEnd'> {
  variant?: 'primary' | 'secondary' | 'ghost'
  isLoading?: boolean
}

export function AnimatedButton({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className,
  disabled,
  ...props 
}: AnimatedButtonProps) {
  const baseStyles = 'font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2'
  
  const variants = {
    primary: 'bg-electric-blue text-black hover:bg-[#00B8E6] hover:shadow-[0_8px_24px_rgba(0,217,255,0.4)]',
    secondary: 'bg-transparent border-2 border-electric-blue text-electric-blue hover:bg-electric-blue hover:text-black',
    ghost: 'bg-transparent text-text-secondary hover:text-white hover:bg-bg-tertiary'
  }

  return (
    <motion.button
      whileHover={!disabled && !isLoading ? buttonHover : undefined}
      whileTap={!disabled && !isLoading ? buttonTap : undefined}
      className={cn(baseStyles, variants[variant], className)}
      disabled={disabled || isLoading}
      type={props.type || 'button'}
      onClick={props.onClick}
      onFocus={props.onFocus}
      onBlur={props.onBlur}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
      aria-label={props['aria-label']}
      aria-disabled={props['aria-disabled']}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          {children}
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          />
        </span>
      ) : (
        children
      )}
    </motion.button>
  )
}

