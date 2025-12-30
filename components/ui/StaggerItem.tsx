'use client'

import { motion } from 'framer-motion'
import { staggerItem } from '@/lib/animations'
import { ReactNode } from 'react'

interface StaggerItemProps {
  children: ReactNode
  className?: string
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div
      variants={staggerItem}
      className={className}
    >
      {children}
    </motion.div>
  )
}










