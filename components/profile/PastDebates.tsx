'use client'

import { useState, useEffect } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cardHover, cardTap } from '@/lib/animations'

interface PastDebate {
  id: string
  topic: string
  category: string
  status: string
  challenger: {
    id: string
    username: string
    avatarUrl: string | null
  }
  opponent: {
    id: string
    username: string
    avatarUrl: string | null
  } | null
  winnerId: string | null
  endedAt: string | null
  createdAt: string
  challengeType?: string
  participants?: Array<{
    id: string
    userId: string
    user: {
      id: string
      username: string
      avatarUrl: string | null
    }
  }>
  tournamentMatch?: {
    tournament: {
      name: string
      format?: string
    }
  } | null
}

interface PastDebatesProps {
  userId: string
  currentUserId?: string | null
}

export function PastDebates({ userId, currentUserId }: PastDebatesProps) {
  const [debates, setDebates] = useState<PastDebate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchDebates()
  }, [userId])

  const fetchDebates = async () => {
    try {
      setIsLoading(true)
      // Fetch completed debates (COMPLETED and VERDICT_READY)
      const response = await fetch(`/api/debates?userId=${userId}&status=COMPLETED,VERDICT_READY&limit=20&page=${page}`)
      if (response.ok) {
        const data = await response.json()
        const fetchedDebates = data.debates || []
        setDebates(fetchedDebates)
        setHasMore(data.pagination?.totalPages > page)
      }
    } catch (error) {
      console.error('Failed to fetch past debates:', error)
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

  if (debates.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        }
        title="No Past Debates"
        description="This user hasn't completed any debates yet"
      />
    )
  }

  return (
    <div className="space-y-3">
      {debates.map((debate) => {
        const isGroupDebate = debate.challengeType === 'GROUP' || (debate.participants && debate.participants.length > 2)
        const isWinner = debate.winnerId === userId
        const isLoser = debate.winnerId && debate.winnerId !== userId
        const isTie = debate.status === 'VERDICT_READY' && !debate.winnerId

        // Get active participants for GROUP debates
        const activeParticipants = isGroupDebate && debate.participants
          ? debate.participants
          : []

        return (
          <motion.div
            key={debate.id}
            whileHover={cardHover}
            whileTap={cardTap}
          >
            <Link
              href={`/debate/${debate.id}`}
              className="block p-4 bg-bg-secondary border border-bg-tertiary rounded-lg hover:border-electric-blue/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Category and Tournament Badge */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant={debate.category.toLowerCase() as any} size="sm">
                      {debate.category}
                    </Badge>
                    {debate.tournamentMatch && (
                      <Badge variant="default" size="sm" className="bg-purple-600 text-white">
                        Tournament
                      </Badge>
                    )}
                    {isGroupDebate && (
                      <Badge variant="default" size="sm" className="bg-electric-blue/20 text-electric-blue">
                        Group
                      </Badge>
                    )}
                  </div>

                  {/* Topic */}
                  <h4 className="text-base font-semibold text-text-primary mb-2 line-clamp-2">
                    {debate.topic}
                  </h4>

                  {/* Participants */}
                  {isGroupDebate && activeParticipants.length > 0 ? (
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {activeParticipants.slice(0, 5).map((participant) => (
                        <div key={participant.id} className="flex items-center gap-1">
                          <Avatar
                            src={participant.user.avatarUrl}
                            username={participant.user.username}
                            size="xs"
                          />
                          <span className="text-xs text-text-secondary">
                            {participant.user.username}
                          </span>
                        </div>
                      ))}
                      {activeParticipants.length > 5 && (
                        <span className="text-xs text-text-secondary">
                          +{activeParticipants.length - 5} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={debate.challenger.avatarUrl}
                          username={debate.challenger.username}
                          size="sm"
                        />
                        <span className="text-sm text-text-primary font-medium">
                          {debate.challenger.username}
                        </span>
                      </div>
                      {debate.opponent && (
                        <>
                          <span className="text-text-muted">vs</span>
                          <div className="flex items-center gap-2">
                            <Avatar
                              src={debate.opponent.avatarUrl}
                              username={debate.opponent.username}
                              size="sm"
                            />
                            <span className="text-sm text-text-primary font-medium">
                              {debate.opponent.username}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Result Badge */}
                  <div className="flex items-center gap-2">
                    {isWinner && (
                      <Badge variant="default" size="sm" className="bg-cyber-green text-black">
                        ✓ Won
                      </Badge>
                    )}
                    {isLoser && (
                      <Badge variant="default" size="sm" className="bg-neon-orange text-black">
                        ✗ Lost
                      </Badge>
                    )}
                    {isTie && (
                      <Badge variant="default" size="sm" className="bg-yellow-500 text-black">
                        = Tie
                      </Badge>
                    )}
                    <span className="text-xs text-text-secondary">
                      {debate.endedAt
                        ? new Date(debate.endedAt).toLocaleDateString()
                        : new Date(debate.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* View Button */}
                <div className="flex-shrink-0">
                  <span className="text-electric-blue text-sm font-medium">
                    View →
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}
