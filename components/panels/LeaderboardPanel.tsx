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
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [user])

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/leaderboard?limit=3' + (user?.id ? `&userId=${user.id}` : ''))
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
        
        // Set user rank if provided and user is not in top 3
        if (data.userRank && user?.id) {
          const isInTop3 = data.leaderboard.some((entry: LeaderboardEntry) => entry.id === user.id)
          if (!isInTop3) {
            setUserRank(data.userRank)
          } else {
            setUserRank(null)
          }
        } else {
          setUserRank(null)
        }
      } else {
        setLeaderboard([])
        setUserRank(null)
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
      setLeaderboard([])
      setUserRank(null)
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
                  className={`block p-5 rounded-xl border-2 transition-all hover:shadow-lg ${
                    isCurrentUser
                      ? 'bg-gradient-to-br from-electric-blue/20 to-electric-blue/5 border-electric-blue/50 hover:border-electric-blue shadow-electric-blue/20'
                      : 'bg-bg-tertiary border-bg-secondary hover:border-bg-primary'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getRankBadge(entry.rank)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar
                          src={entry.avatarUrl}
                          username={entry.username}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`font-bold text-base truncate ${isCurrentUser ? 'text-electric-blue' : 'text-text-primary'}`}>
                              {entry.username}
                            </p>
                            {isCurrentUser && (
                              <Badge variant="default" size="sm" className="bg-electric-blue text-black text-xs px-2 py-0.5">
                                You
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 mt-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-secondary">ELO</span>
                          <span className="text-electric-blue font-bold">{entry.eloRating}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-secondary">Score</span>
                          <span className="text-cyber-green font-bold">{entry.overallScore} ({entry.overallScorePercent}%)</span>
                        </div>
                        <div className="pt-2 border-t border-bg-secondary">
                          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                            <span>Record</span>
                            <div className="flex items-center gap-2">
                              <span className="text-cyber-green font-semibold">{entry.debatesWon}W</span>
                              <span className="text-neon-orange font-semibold">{entry.debatesLost}L</span>
                              <span className="text-yellow-500 font-semibold">{entry.debatesTied || 0}T</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-text-secondary">
                            <span>{entry.totalDebates} debates</span>
                            <span className="text-electric-blue font-semibold">{entry.winRate}% win rate</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
            
            {/* 4th Card: User's Rank (if not in top 3) */}
            {userRank && (
              <Link
                href={`/profile/${userRank.id}`}
                className="block p-5 rounded-xl border-2 transition-all hover:shadow-lg bg-gradient-to-br from-electric-blue/20 to-electric-blue/5 border-electric-blue/50 hover:border-electric-blue shadow-electric-blue/20"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <span className="text-text-muted font-semibold">#{userRank.rank}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar
                        src={userRank.avatarUrl}
                        username={userRank.username}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-base truncate text-electric-blue">
                            {userRank.username}
                          </p>
                          <Badge variant="default" size="sm" className="bg-electric-blue text-black text-xs px-2 py-0.5">
                            You
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 mt-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">ELO</span>
                        <span className="text-electric-blue font-bold">{userRank.eloRating}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Score</span>
                        <span className="text-cyber-green font-bold">{userRank.overallScore} ({userRank.overallScorePercent}%)</span>
                      </div>
                      <div className="pt-2 border-t border-bg-secondary">
                        <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                          <span>Record</span>
                          <div className="flex items-center gap-2">
                            <span className="text-cyber-green font-semibold">{userRank.debatesWon}W</span>
                            <span className="text-neon-orange font-semibold">{userRank.debatesLost}L</span>
                            <span className="text-yellow-500 font-semibold">{userRank.debatesTied || 0}T</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-text-secondary">
                          <span>{userRank.totalDebates} debates</span>
                          <span className="text-electric-blue font-semibold">{userRank.winRate}% win rate</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </div>
        )}
    </div>
  )
}

