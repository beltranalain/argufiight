'use client'

import { useState, useEffect } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/lib/hooks/useAuth'
import Link from 'next/link'

interface LeaderboardEntry {
  rank: number
  id: string
  username: string
  avatarUrl: string | null
  eloRating: number
  debatesWon: number
  debatesLost: number
  debatesTied: number
  totalDebates: number
  winRate: number
  overallScore: string
  overallScorePercent: number
}

export function LeaderboardPanel() {
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/leaderboard?limit=15')
      if (response.ok) {
        const data = await response.json()
        // Ensure leaderboard is an array before setting
        if (Array.isArray(data.leaderboard)) {
          setLeaderboard(data.leaderboard)
        } else if (Array.isArray(data)) {
          setLeaderboard(data)
        } else {
          setLeaderboard([])
        }
      } else {
        setLeaderboard([])
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
      setLeaderboard([])
    } finally {
      setIsLoading(false)
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return <Badge variant="default" className="bg-electric-blue text-black">1</Badge>
    } else if (rank === 2) {
      return <Badge variant="default" className="bg-text-muted text-text-primary">2</Badge>
    } else if (rank === 3) {
      return <Badge variant="default" className="bg-neon-orange/80 text-black">3</Badge>
    }
    return <span className="text-text-muted font-semibold">#{rank}</span>
  }

  if (isLoading) {
    return (
      <div className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-text-primary mb-1">ELO Leaderboard</h3>
            <p className="text-text-secondary text-sm">Top debaters ranked by ELO rating</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="md" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-text-primary mb-1">ELO Leaderboard</h3>
          <p className="text-text-secondary text-sm">Top debaters ranked by ELO rating</p>
        </div>
        <Link href="/leaderboard" className="text-sm text-electric-blue hover:text-neon-orange font-medium">
          View All →
        </Link>
      </div>
        {leaderboard.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            }
            title="No Rankings Yet"
            description="Complete debates to appear on the leaderboard"
          />
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaderboard.map((entry) => {
              const isCurrentUser = user?.id === entry.id
              return (
                <Link
                  key={entry.id}
                  href={`/profile/${entry.id}`}
                className={`block p-4 rounded-lg border transition-colors ${
                    isCurrentUser
                      ? 'bg-electric-blue/10 border-electric-blue/30 hover:border-electric-blue'
                      : 'bg-bg-tertiary border-bg-tertiary hover:border-bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 text-center">
                      {getRankBadge(entry.rank)}
                    </div>
                    <Avatar
                      src={entry.avatarUrl}
                      username={entry.username}
                    size="md"
                    />
                    <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <p className={`font-semibold truncate ${isCurrentUser ? 'text-electric-blue' : 'text-text-primary'}`}>
                          {entry.username}
                        </p>
                        {isCurrentUser && (
                          <Badge variant="default" size="sm" className="bg-electric-blue text-black text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                    <div className="flex flex-col gap-1 text-xs text-text-secondary">
                        <span className="text-electric-blue font-semibold">ELO: {entry.eloRating}</span>
                        <span className="text-cyber-green font-semibold">Score: {entry.overallScore}</span>
                      <div className="flex items-center gap-2">
                        <span>{entry.totalDebates} debates</span>
                        <span>•</span>
                        <span className="text-cyber-green">{entry.debatesWon}W</span>
                        <span className="text-neon-orange">{entry.debatesLost}L</span>
                        <span className="text-text-muted">{entry.debatesTied}T</span>
                        <span>•</span>
                        <span>{entry.winRate}% win rate</span>
                      </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
    </div>
  )
}

