'use client'

import { motion } from 'framer-motion'
import { staggerContainer } from '@/lib/animations'
import { ReactNode } from 'react'

interface StaggerContainerProps {
  children: ReactNode
  className?: string
}

export function StaggerContainer({ children, className }: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  )
}


