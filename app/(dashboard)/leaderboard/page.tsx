'use client'

import { useState, useEffect } from 'react'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
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
}

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/leaderboard?limit=100')
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
      return <Badge variant="default" className="bg-electric-blue text-black text-lg px-3 py-1">1</Badge>
    } else if (rank === 2) {
      return <Badge variant="default" className="bg-text-muted text-text-primary text-lg px-3 py-1">2</Badge>
    } else if (rank === 3) {
      return <Badge variant="default" className="bg-neon-orange/80 text-black text-lg px-3 py-1">3</Badge>
    }
    return <span className="text-text-muted font-bold text-lg">#{rank}</span>
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="LEADERBOARD" />
      
      <div className="pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-text-primary mb-2">ELO Leaderboard</h1>
            <p className="text-text-secondary">Top debaters ranked by ELO rating</p>
          </div>

          {isLoading ? (
            <Card>
              <CardBody>
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              </CardBody>
            </Card>
          ) : leaderboard.length === 0 ? (
            <Card>
              <CardBody>
                <EmptyState
                  icon={
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  }
                  title="No Rankings Yet"
                  description="Complete debates to appear on the leaderboard"
                />
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody>
                <div className="space-y-3">
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
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-16 text-center">
                            {getRankBadge(entry.rank)}
                          </div>
                          <Avatar
                            src={entry.avatarUrl}
                            username={entry.username}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`font-semibold text-lg truncate ${isCurrentUser ? 'text-electric-blue' : 'text-text-primary'}`}>
                                {entry.username}
                              </p>
                              {isCurrentUser && (
                                <Badge variant="default" size="sm" className="bg-electric-blue text-black">
                                  You
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-text-secondary">
                              <span className="text-electric-blue font-semibold">ELO: {entry.eloRating}</span>
                              <span>•</span>
                              <span>{entry.winRate}% win rate</span>
                              <span>•</span>
                              <span>{entry.totalDebates} debates</span>
                              <span>•</span>
                              <span className="text-cyber-green">{entry.debatesWon}W</span>
                              <span className="text-neon-orange">{entry.debatesLost}L</span>
                              {entry.debatesTied > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-text-muted">{entry.debatesTied}T</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

