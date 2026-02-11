'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'

interface DailyChallenge {
  id: string
  topic: string
  description: string | null
  category: string
  forLabel: string
  againstLabel: string
}

export function DailyChallengeCard() {
  const router = useRouter()
  const { user } = useAuth()
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null)
  const [participationCount, setParticipationCount] = useState(0)
  const [isJoining, setIsJoining] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    fetch('/api/daily-challenge')
      .then(r => r.json())
      .then(data => {
        if (data.challenge) {
          setChallenge(data.challenge)
          setParticipationCount(data.participationCount || 0)
        }
      })
      .catch(() => {})
  }, [])

  // Countdown to midnight UTC
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
      tomorrow.setUTCHours(0, 0, 0, 0)
      const diff = tomorrow.getTime() - now.getTime()

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      setTimeLeft(`${hours}h ${minutes}m`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  const handleJoin = async (position: 'FOR' | 'AGAINST') => {
    if (!user || isJoining) return
    setIsJoining(true)

    try {
      const res = await fetch('/api/daily-challenge/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      router.push(`/debate/${data.debateId}`)
    } catch {
      setIsJoining(false)
    }
  }

  if (!challenge) return null

  const categoryColors: Record<string, string> = {
    SPORTS: '#FF6B35',
    POLITICS: '#4ECDC4',
    TECH: '#00D4FF',
    ENTERTAINMENT: '#FF6ECB',
    SCIENCE: '#7B68EE',
    MUSIC: '#FFD700',
    OTHER: '#FF4444',
  }

  const color = categoryColors[challenge.category] || '#00D4FF'

  return (
    <div
      className="bg-bg-secondary rounded-xl p-6 border border-yellow-500/30 relative overflow-hidden"
      style={{ boxShadow: `0 0 30px ${color}10` }}
    >
      {/* Accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-neon-orange to-yellow-500" />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 text-lg">&#9733;</span>
          <h3 className="text-lg font-bold text-white">Daily Challenge</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-text-secondary text-xs">{timeLeft} left</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {challenge.category}
          </span>
        </div>
      </div>

      <p className="text-white font-medium mb-1">{challenge.topic}</p>
      {challenge.description && (
        <p className="text-text-secondary text-sm mb-4">{challenge.description}</p>
      )}

      <div className="flex gap-3 mb-3">
        <button
          onClick={() => handleJoin('FOR')}
          disabled={isJoining || !user}
          className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all border-2 border-cyber-green/30 text-cyber-green hover:border-cyber-green hover:bg-cyber-green/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {challenge.forLabel}
        </button>
        <button
          onClick={() => handleJoin('AGAINST')}
          disabled={isJoining || !user}
          className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all border-2 border-neon-orange/30 text-neon-orange hover:border-neon-orange hover:bg-neon-orange/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {challenge.againstLabel}
        </button>
      </div>

      <div className="text-text-secondary text-xs text-center">
        {participationCount > 0
          ? `${participationCount} debater${participationCount === 1 ? '' : 's'} today`
          : 'Be the first to debate today!'}
      </div>
    </div>
  )
}
