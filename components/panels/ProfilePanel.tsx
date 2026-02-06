'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardBody } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Button } from '@/components/ui/Button'

export function ProfilePanel() {
  const { user, isLoading } = useAuth()
  const [recentDebates, setRecentDebates] = useState<any[]>([])
  const [isLoadingDebates, setIsLoadingDebates] = useState(true)

  useEffect(() => {
    if (user) {
      fetchRecentDebates()
    }
  }, [user])

  const fetchRecentDebates = async () => {
    try {
      setIsLoadingDebates(true)
      // Fetch user's recent debates (all statuses except WAITING)
      // This includes ACTIVE, COMPLETED, VERDICT_READY, APPEALED, etc.
      const response = await fetch(`/api/debates?userId=${user?.id}&t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      if (response.ok) {
        const data = await response.json()
        // Handle paginated response
        const debates = data.debates || []
        // Filter out WAITING debates and get most recent 3
        const filtered = debates
          .filter((d: any) => d.status !== 'WAITING')
          .sort((a: any, b: any) => {
            // Sort by createdAt descending (most recent first)
            const dateA = new Date(a.createdAt || 0).getTime()
            const dateB = new Date(b.createdAt || 0).getTime()
            return dateB - dateA
          })
          .slice(0, 3)
        setRecentDebates(filtered)
      } else {
        console.error('Failed to fetch recent debates:', response.status, await response.text())
        setRecentDebates([])
      }
    } catch (error) {
      console.error('Failed to fetch recent debates:', error)
      setRecentDebates([])
    } finally {
      setIsLoadingDebates(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-text-secondary mb-4">Please sign in to view your profile</p>
        <a href="/login" className="text-electric-blue hover:text-neon-orange">
          Sign In →
        </a>
      </div>
    )
  }

  const winRate = user.totalDebates > 0 
    ? Math.round((user.debatesWon / user.totalDebates) * 100)
    : 0

  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar 
          src={user.avatarUrl}
          username={user.username}
          size="lg"
        />
        <div>
          <h3 className="text-lg font-bold text-text-primary">{user.username}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="default" size="sm">
              ELO: {user.eloRating}
            </Badge>
            {user.totalMaxScore > 0 && (
              <Badge variant="default" size="sm" className="bg-electric-blue/20 text-electric-blue">
                Score: {user.totalScore}/{user.totalMaxScore}
              </Badge>
            )}
            {(user as any).coins !== undefined && (
              <Badge variant="default" size="sm" className="bg-cyan-500/20 text-cyan-400">
                Coins: {((user as any).coins || 0).toLocaleString()}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card hover className="border border-bg-tertiary">
          <CardBody className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-electric-blue mb-1">
                {user.totalDebates || 0}
              </div>
              <div className="text-xs text-text-secondary">Total</div>
            </div>
          </CardBody>
        </Card>

        <Card hover className="border border-bg-tertiary">
          <CardBody className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyber-green mb-1">
                {user.debatesWon || 0}
              </div>
              <div className="text-xs text-text-secondary">Wins</div>
            </div>
          </CardBody>
        </Card>

        <Card hover className="border border-bg-tertiary">
          <CardBody className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-neon-orange mb-1">
                {user.debatesLost || 0}
              </div>
              <div className="text-xs text-text-secondary">Losses</div>
            </div>
          </CardBody>
        </Card>

        <Card hover className="border border-bg-tertiary">
          <CardBody className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-hot-pink mb-1">
                {winRate}%
              </div>
              <div className="text-xs text-text-secondary">Win Rate</div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Debates */}
      <Card className="border border-bg-tertiary">
        <CardBody className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-text-primary">Recent Debates</h4>
            <div className="flex gap-2">
              {recentDebates.length > 0 && (
                <Link href="/debates/history">
                  <Button variant="ghost" className="text-xs py-1 px-2">
                    View All
                  </Button>
                </Link>
              )}
              <Link href="/debates/saved">
                <Button variant="ghost" className="text-xs py-1 px-2">
                  Saved
                </Button>
              </Link>
            </div>
          </div>
          {isLoadingDebates ? (
            <div className="flex items-center justify-center py-6">
              <LoadingSpinner size="sm" />
            </div>
          ) : recentDebates.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-bg-tertiary rounded-lg">
              <svg className="w-8 h-8 mx-auto mb-2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-text-secondary text-xs">
                Your recent debates will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentDebates.map((debate) => {
                const isWinner = debate.winnerId === user?.id
                const isTie = !debate.winnerId
                const opponent = debate.challengerId === user?.id ? debate.opponent : debate.challenger
                
                return (
                  <Link
                    key={debate.id}
                    href={`/debate/${debate.id}`}
                    className="block p-3 bg-bg-tertiary rounded-lg border border-bg-tertiary hover:border-electric-blue transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-text-primary truncate mb-1">
                          {debate.topic}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                          <span>vs {opponent?.username || 'Unknown'}</span>
                          <span>•</span>
                          <Badge variant={debate.category.toLowerCase() as any} size="sm" className="text-xs">
                            {debate.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {/* If debate has a winner (result), show Won/Lost/Tie regardless of status */}
                        {/* Check for winnerId first - if it exists, debate has a result */}
                        {debate.winnerId ? (
                          isWinner ? (
                            <Badge variant="default" size="sm" className="bg-cyber-green text-black text-xs">
                              Won
                            </Badge>
                          ) : (
                            <Badge variant="default" size="sm" className="bg-neon-orange text-black text-xs">
                              Lost
                            </Badge>
                          )
                        ) : debate.status === 'VERDICT_READY' ? (
                          // VERDICT_READY but no winnerId means it's a tie
                          <Badge variant="default" size="sm" className="bg-text-muted text-text-primary text-xs">
                            Tie
                          </Badge>
                        ) : debate.status === 'ACTIVE' ? (
                          <Badge variant="default" size="sm" className="bg-electric-blue text-white text-xs">
                            Ongoing
                          </Badge>
                        ) : debate.status === 'COMPLETED' ? (
                          // Check if debate has no statements - show "Ended" instead of "Awaiting Verdict"
                          (() => {
                            const hasNoStatements = debate.hasNoStatements === true || (debate.statements && debate.statements.length === 0)
                            const verdictReached = debate.verdictReached === true
                            
                            if (hasNoStatements) {
                              return (
                                <Badge variant="default" size="sm" className="bg-text-muted text-text-primary text-xs">
                                  Ended
                                </Badge>
                              )
                            } else if (verdictReached) {
                              return (
                                <Badge variant="default" size="sm" className="bg-neon-yellow text-black text-xs">
                                  Verdict Ready
                                </Badge>
                              )
                            } else {
                              return (
                                <Badge variant="default" size="sm" className="bg-neon-yellow text-black text-xs">
                                  Awaiting Verdict
                                </Badge>
                              )
                            }
                          })()
                        ) : debate.status === 'APPEALED' ? (
                          <Badge variant="default" size="sm" className="bg-neon-orange text-black text-xs">
                            Appealed
                          </Badge>
                        ) : (
                          <Badge variant="default" size="sm" className="bg-text-muted text-text-primary text-xs">
                            {debate.status}
                          </Badge>
                        )}
                        <span className="text-xs text-text-muted">
                          {new Date(debate.endedAt || debate.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
