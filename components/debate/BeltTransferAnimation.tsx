'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardBody } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'

interface BeltTransferAnimationProps {
  beltName: string
  beltImageUrl?: string | null
  fromUser: {
    id: string
    username: string
    avatarUrl?: string | null
  }
  toUser: {
    id: string
    username: string
    avatarUrl?: string | null
  }
  onComplete?: () => void
}

export function BeltTransferAnimation({
  beltName,
  beltImageUrl,
  fromUser,
  toUser,
  onComplete,
}: BeltTransferAnimationProps) {
  const [showAnimation, setShowAnimation] = useState(true)
  const [phase, setPhase] = useState<'initial' | 'transferring' | 'complete'>('initial')

  useEffect(() => {
    // Start animation sequence
    const timer1 = setTimeout(() => setPhase('transferring'), 500)
    const timer2 = setTimeout(() => setPhase('complete'), 2000)
    const timer3 = setTimeout(() => {
      setShowAnimation(false)
      onComplete?.()
    }, 3500)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [onComplete])

  if (!showAnimation) return null

  return (
    <AnimatePresence>
      {showAnimation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => {
            setShowAnimation(false)
            onComplete?.()
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative w-full max-w-2xl mx-4"
          >
            <Card className="bg-bg-secondary border-2 border-neon-orange/50 shadow-2xl">
              <CardBody className="p-8 overflow-hidden relative">
                {/* Title */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-center mb-8"
                >
                  <h2 className="text-3xl font-bold text-neon-orange mb-2">
                    🏆 Belt Transfer! 🏆
                  </h2>
                  <p className="text-text-secondary text-lg">{beltName}</p>
                </motion.div>

                {/* Transfer Animation */}
                <div className="relative flex items-center justify-between px-8 py-6 overflow-hidden min-h-[200px]">
                  {/* From User */}
                  <motion.div
                    initial={{ x: 0, opacity: 1 }}
                    animate={
                      phase === 'transferring' || phase === 'complete'
                        ? { x: -30, opacity: 0.3, scale: 0.9 }
                        : { x: 0, opacity: 1, scale: 1 }
                    }
                    transition={{ duration: 1, ease: 'easeInOut' }}
                    className="flex flex-col items-center z-10 flex-1"
                    ref={(el) => {
                      if (el && phase === 'initial') {
                        // Store initial position for belt animation
                      }
                    }}
                  >
                    <Avatar
                      src={fromUser.avatarUrl || undefined}
                      username={fromUser.username}
                      size="lg"
                    />
                    <p className="mt-2 text-sm font-semibold text-text-primary">
                      {fromUser.username}
                    </p>
                    <p className="text-xs text-text-secondary">Previous Holder</p>
                  </motion.div>

                  {/* Belt Image - Moving from left to right */}
                  <motion.div
                    initial={{ 
                      left: '12.5%', // Start at left user position
                      top: '50%',
                      scale: 1,
                      rotate: 0,
                      opacity: 1
                    }}
                    animate={
                      phase === 'initial'
                        ? { 
                            left: '12.5%',
                            scale: 1,
                            rotate: 0,
                            opacity: 1
                          }
                        : phase === 'transferring'
                        ? { 
                            left: '87.5%', // Move to right user position
                            scale: 1.1,
                            rotate: 360,
                            opacity: 1
                          }
                        : { 
                            left: '87.5%', // End at right user position
                            scale: 1.2,
                            rotate: 360,
                            opacity: 1
                          }
                    }
                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                    className="absolute z-20 pointer-events-none"
                    style={{ 
                      transform: 'translate(-50%, -50%)',
                      top: '50%'
                    }}
                  >
                    {beltImageUrl ? (
                      <motion.img
                        src={beltImageUrl}
                        alt={beltName}
                        className="w-20 h-20 object-contain drop-shadow-lg"
                        style={{ display: 'block' }}
                      />
                    ) : (
                      <motion.div
                        className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-orange to-electric-blue flex items-center justify-center text-4xl shadow-lg"
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      >
                        🏆
                      </motion.div>
                    )}
                    {/* Glow effect */}
                    <motion.div
                      className="absolute inset-0 rounded-full bg-neon-orange/30 blur-xl -z-10"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 0.8, 0.5],
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </motion.div>

                  {/* Arrow - Only show during transfer */}
                  {phase === 'transferring' || phase === 'complete' ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl text-neon-orange z-15 pointer-events-none"
                    >
                      →
                    </motion.div>
                  ) : null}

                  {/* To User */}
                  <motion.div
                    initial={{ x: 0, opacity: 0.3, scale: 0.9 }}
                    animate={
                      phase === 'transferring' || phase === 'complete'
                        ? { x: 30, opacity: 1, scale: 1.1 }
                        : { x: 0, opacity: 0.3, scale: 0.9 }
                    }
                    transition={{ duration: 1, ease: 'easeInOut' }}
                    className="flex flex-col items-center z-10 flex-1"
                  >
                    <motion.div
                      animate={
                        phase === 'complete'
                          ? {
                              scale: [1, 1.2, 1],
                              boxShadow: [
                                '0 0 0px rgba(255, 165, 0, 0)',
                                '0 0 30px rgba(255, 165, 0, 0.8)',
                                '0 0 0px rgba(255, 165, 0, 0)',
                              ],
                            }
                          : {}
                      }
                      transition={{ duration: 0.5, repeat: 2 }}
                    >
                      <Avatar
                        src={toUser.avatarUrl || undefined}
                        username={toUser.username}
                        size="lg"
                      />
                    </motion.div>
                    <p className="mt-2 text-sm font-semibold text-neon-orange">
                      {toUser.username}
                    </p>
                    <p className="text-xs text-text-secondary">New Champion!</p>
                  </motion.div>
                </div>

                {/* Success Message */}
                <AnimatePresence>
                  {phase === 'complete' && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="text-center mt-6"
                    >
                      <motion.p
                        className="text-xl font-bold text-neon-orange"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.5, repeat: 2 }}
                      >
                        ✨ Transfer Complete! ✨
                      </motion.p>
                      <p className="text-sm text-text-secondary mt-2">
                        Click anywhere to continue
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Particle Effects */}
                {phase === 'complete' && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-neon-orange rounded-full"
                        initial={{
                          x: '50%',
                          y: '50%',
                          opacity: 1,
                        }}
                        animate={{
                          x: `${50 + (Math.random() - 0.5) * 100}%`,
                          y: `${50 + (Math.random() - 0.5) * 100}%`,
                          opacity: 0,
                          scale: 0,
                        }}
                        transition={{
                          duration: 1.5,
                          delay: Math.random() * 0.5,
                          ease: 'easeOut',
                        }}
                      />
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
