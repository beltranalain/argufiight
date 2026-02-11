'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface OnboardingCongratsProps {
  result: 'won' | 'lost' | 'tie'
  topic: string
  challengerScore: number
  opponentScore: number
  aiOpponentName: string
  onClose: () => void
}

export function OnboardingCongrats({
  result,
  topic,
  challengerScore,
  opponentScore,
  aiOpponentName,
  onClose,
}: OnboardingCongratsProps) {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  const handleStartDebating = () => {
    setIsNavigating(true)
    window.location.href = '/'
  }

  const resultConfig = {
    won: {
      title: 'You Won!',
      subtitle: 'Great arguments! You beat the AI.',
      color: 'text-cyber-green',
      borderColor: 'border-cyber-green',
      glowColor: 'shadow-[0_0_40px_rgba(0,255,136,0.2)]',
    },
    lost: {
      title: 'Nice Try!',
      subtitle: 'The AI had the edge this time. Ready for a rematch?',
      color: 'text-neon-orange',
      borderColor: 'border-neon-orange',
      glowColor: 'shadow-[0_0_40px_rgba(255,110,0,0.2)]',
    },
    tie: {
      title: "It's a Tie!",
      subtitle: 'Evenly matched! Both sides made strong arguments.',
      color: 'text-electric-blue',
      borderColor: 'border-electric-blue',
      glowColor: 'shadow-[0_0_40px_rgba(0,212,255,0.2)]',
    },
  }

  const config = resultConfig[result]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className={`bg-bg-secondary border-2 ${config.borderColor} ${config.glowColor} rounded-2xl p-8 max-w-md w-full mx-4 text-center`}>
        {/* Result */}
        <h1 className={`text-4xl font-bold ${config.color} mb-2`}>
          {config.title}
        </h1>
        <p className="text-text-secondary mb-6">
          {config.subtitle}
        </p>

        {/* Score */}
        <div className="bg-bg-primary rounded-xl p-4 mb-6">
          <div className="text-text-secondary text-xs uppercase tracking-wider mb-3">Final Score</div>
          <div className="flex items-center justify-center gap-6">
            <div>
              <div className="text-white font-bold text-2xl">{challengerScore}</div>
              <div className="text-text-secondary text-xs">You</div>
            </div>
            <div className="text-text-secondary text-lg">vs</div>
            <div>
              <div className="text-white font-bold text-2xl">{opponentScore}</div>
              <div className="text-text-secondary text-xs">{aiOpponentName}</div>
            </div>
          </div>
        </div>

        {/* Coins reward */}
        <div className="bg-bg-primary rounded-xl p-4 mb-8 border border-yellow-500/20">
          <div className="text-yellow-400 font-bold text-lg mb-1">+50 Coins Earned!</div>
          <div className="text-text-secondary text-xs">Welcome bonus for your first debate</div>
        </div>

        {/* CTA */}
        <button
          onClick={handleStartDebating}
          disabled={isNavigating}
          className="w-full bg-electric-blue hover:bg-electric-blue/80 text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 mb-3"
        >
          {isNavigating ? 'Loading...' : 'Now Debate a Real Person!'}
        </button>
        <button
          onClick={onClose}
          className="text-text-secondary hover:text-white text-sm transition-colors"
        >
          View full verdict
        </button>
      </div>
    </div>
  )
}
