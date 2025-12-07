'use client'

import { useState, useEffect } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/Loading'
import Link from 'next/link'

interface BattleHistoryUser {
  id: string
  username: string
  avatarUrl: string | null
  eloRating: number
  debatesCount: number
  wins: number
  losses: number
  lastDebateDate: Date
}

interface BattleHistoryProps {
  userId: string
}

export function BattleHistory({ userId }: BattleHistoryProps) {
  const [battleHistory, setBattleHistory] = useState<BattleHistoryUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchBattleHistory()
  }, [userId])

  const fetchBattleHistory = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/users/${userId}/analytics`)
      if (response.ok) {
        const data = await response.json()
        setBattleHistory(data.battleHistory || [])
      }
    } catch (error) {
      console.error('Failed to fetch battle history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="sm" />
      </div>
    )
  }

  if (battleHistory.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
        <p>No battle history yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {battleHistory.map((opponent) => {
        const winRate = opponent.debatesCount > 0
          ? Math.round((opponent.wins / opponent.debatesCount) * 100)
          : 0

        return (
          <Link
            key={opponent.id}
            href={`/profile/${opponent.id}`}
            className="flex items-center gap-3 p-3 bg-bg-secondary border border-bg-tertiary rounded-lg hover:border-electric-blue/50 transition-colors"
          >
            <Avatar
              src={opponent.avatarUrl}
              username={opponent.username}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-text-primary truncate">
                  {opponent.username}
                </p>
                <Badge variant="default" size="sm">
                  ELO: {opponent.eloRating}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-text-secondary">
                <span>{opponent.debatesCount} debate{opponent.debatesCount !== 1 ? 's' : ''}</span>
                <span className="text-cyber-green">{opponent.wins}W</span>
                <span className="text-neon-orange">{opponent.losses}L</span>
                <span>{winRate}% win rate</span>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}



