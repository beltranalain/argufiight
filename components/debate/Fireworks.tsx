'use client'

import { motion } from 'framer-motion'

interface FireworksProps {
  className?: string
}

export function Fireworks({ className = '' }: FireworksProps) {
  // Generate multiple firework particles
  const particles = Array.from({ length: 20 }, (_, i) => i)

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {particles.map((i) => {
        const angle = (360 / 20) * i
        const distance = 100 + Math.random() * 50
        const delay = Math.random() * 0.5
        const duration = 1 + Math.random() * 0.5

        return (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
            style={{
              originX: 0.5,
              originY: 0.5,
            }}
            initial={{ 
              x: 0, 
              y: 0, 
              opacity: 1,
              scale: 1,
            }}
            animate={{
              x: Math.cos((angle * Math.PI) / 180) * distance,
              y: Math.sin((angle * Math.PI) / 180) * distance,
              opacity: [1, 1, 0],
              scale: [1, 1.5, 0],
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              repeatDelay: 2,
              ease: "easeOut",
            }}
          >
            <div 
              className="w-full h-full rounded-full"
              style={{
                background: i % 3 === 0 
                  ? '#00FF94' // cyber-green
                  : i % 3 === 1 
                  ? '#FF6B35' // neon-orange
                  : '#00D9FF', // electric-blue
                boxShadow: `0 0 8px ${i % 3 === 0 ? '#00FF94' : i % 3 === 1 ? '#FF6B35' : '#00D9FF'}`,
              }}
            />
          </motion.div>
        )
      })}
      
      {/* Additional sparkle effects */}
      {Array.from({ length: 10 }, (_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full bg-white"
          style={{
            originX: 0.5,
            originY: 0.5,
          }}
          initial={{ 
            x: 0, 
            y: 0, 
            opacity: 0,
            scale: 0,
          }}
          animate={{
            x: (Math.random() - 0.5) * 200,
            y: (Math.random() - 0.5) * 200,
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0],
          }}
          transition={{
            duration: 1.5,
            delay: Math.random() * 1,
            repeat: Infinity,
            repeatDelay: 1.5,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  )
}


