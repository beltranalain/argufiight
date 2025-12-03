import React from 'react'
import { motion } from 'framer-motion'
import { fadeIn, pulse } from '@/lib/animations'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className={cn(
        'inline-block rounded-full border-electric-blue border-t-transparent',
        sizes[size],
        className
      )}
    />
  )
}

interface LoadingOverlayProps {
  message?: string
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        variants={pulse}
        initial="hidden"
        animate="visible"
        className="text-center"
      >
        <LoadingSpinner size="lg" />
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-white font-medium"
        >
          {message}
        </motion.p>
      </motion.div>
    </motion.div>
  )
}

interface LoadingCardProps {
  lines?: number
}

export function LoadingCard({ lines = 3 }: LoadingCardProps) {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-6 animate-pulse">
      <div className="h-4 bg-bg-tertiary rounded w-3/4 mb-4" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-bg-tertiary rounded w-full mb-3" />
      ))}
    </div>
  )
}

