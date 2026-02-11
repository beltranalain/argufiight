'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'

interface DailyChallenge {
  id: string
  topic: string
  category: string
  forLabel: string
  againstLabel: string
}

export function DailyChallengeNav() {
  const router = useRouter()
  const { user } = useAuth()
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null)
  const [isJoining, setIsJoining] = useState(false)

  useEffect(() => {
    fetch('/api/daily-challenge')
      .then(r => r.json())
      .then(data => {
        if (data.challenge) {
          setChallenge(data.challenge)
        }
      })
      .catch(() => {})
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

  return (
    <div className="hidden lg:flex items-center gap-2.5 ml-6 px-3 py-1.5 bg-bg-secondary/60 border border-electric-blue/20 rounded-lg max-w-[480px]">
      <span className="text-electric-blue text-xs font-bold tracking-wide uppercase shrink-0">Daily</span>
      <span className="text-white text-xs font-medium truncate">{challenge.topic}</span>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => handleJoin('FOR')}
          disabled={isJoining || !user}
          className="px-2 py-0.5 text-[11px] font-semibold border border-cyber-green/40 text-cyber-green rounded hover:bg-cyber-green/10 hover:border-cyber-green transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {challenge.forLabel}
        </button>
        <button
          onClick={() => handleJoin('AGAINST')}
          disabled={isJoining || !user}
          className="px-2 py-0.5 text-[11px] font-semibold border border-neon-orange/40 text-neon-orange rounded hover:bg-neon-orange/10 hover:border-neon-orange transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {challenge.againstLabel}
        </button>
      </div>
    </div>
  )
}
