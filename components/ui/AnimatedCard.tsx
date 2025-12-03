'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cardHover, cardTap, fadeInUp } from '@/lib/animations'
import { cn } from '@/lib/utils'

interface AnimatedCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onAnimationStart' | 'onAnimationEnd' | 'onDragStart' | 'onDrag' | 'onDragEnd'> {
  hoverable?: boolean
  delay?: number
}

export function AnimatedCard({ 
  children, 
  className,
  hoverable = true,
  delay = 0,
  ...props 
}: AnimatedCardProps) {
  const { onAnimationStart, onAnimationEnd, onDragStart, onDrag, onDragEnd, ...motionProps } = props as any
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      transition={{ duration: 0.3, delay }}
      whileHover={hoverable ? cardHover : undefined}
      whileTap={hoverable ? cardTap : undefined}
      className={cn('rounded-xl', className)}
      {...motionProps}
    >
      {children}
    </motion.div>
  )
}

