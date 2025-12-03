'use client'

import { motion } from 'framer-motion'
import { cardHover, cardTap } from '@/lib/animations'

interface StatCardProps {
  title: string
  value: string
  icon: React.ReactNode
  color?: 'blue' | 'orange' | 'green' | 'pink'
  delay?: number
}

export function StatCard({ title, value, icon, color = 'blue', delay = 0 }: StatCardProps) {
  const colorClasses = {
    blue: {
      gradient: 'from-electric-blue/20 to-electric-blue/5',
      border: 'border-electric-blue/30',
      hoverBorder: 'hover:border-electric-blue',
      text: 'text-electric-blue',
    },
    orange: {
      gradient: 'from-neon-orange/20 to-neon-orange/5',
      border: 'border-neon-orange/30',
      hoverBorder: 'hover:border-neon-orange',
      text: 'text-neon-orange',
    },
    green: {
      gradient: 'from-cyber-green/20 to-cyber-green/5',
      border: 'border-cyber-green/30',
      hoverBorder: 'hover:border-cyber-green',
      text: 'text-cyber-green',
    },
    pink: {
      gradient: 'from-hot-pink/20 to-hot-pink/5',
      border: 'border-hot-pink/30',
      hoverBorder: 'hover:border-hot-pink',
      text: 'text-hot-pink',
    },
  }

  const colors = colorClasses[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={cardHover}
      whileTap={cardTap}
      className={`bg-bg-secondary border border-bg-tertiary rounded-xl p-6 relative overflow-hidden group ${colors.hoverBorder} transition-all w-full`}
    >
      {/* Gradient Background */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors.gradient} rounded-full blur-2xl group-hover:opacity-30 transition-opacity`} />
      
      {/* Content */}
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <p className="text-text-secondary text-sm font-medium">{title}</p>
          <div className={colors.text}>
            {icon}
          </div>
        </div>
        <p className="text-3xl font-bold text-white leading-tight">{value}</p>
      </div>
    </motion.div>
  )
}

