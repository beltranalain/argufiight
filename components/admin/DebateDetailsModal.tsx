'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { LoadingSpinner } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import Link from 'next/link'

interface DebateDetailsModalProps {
  debateId: string | null
  isOpen: boolean
  onClose: () => void
}

interface DebateDetails {
  id: string
  topic: string
  description: string | null
  category: string
  status: string
  currentRound: number
  totalRounds: number
  challenger: {
    id: string
    username: string
    avatarUrl: string | null
    eloRating: number
  }
  opponent: {
    id: string
    username: string
    avatarUrl: string | null
    eloRating: number
  } | null
  challengerPosition: string
  opponentPosition: string
  winnerId: string | null
  createdAt: string
  startedAt: string | null
  endedAt: string | null
  statements: Array<{
    id: string
    round: number
    content: string
    author: {
      id: string
      username: string
      avatarUrl: string | null
    }
    createdAt: string
  }>
  verdicts: Array<{
    id: string
    decision: string
    reasoning: string
    challengerScore: number | null
    opponentScore: number | null
    judge: {
      id: string
      name: string
      personality: string
    }
  }>
}

export function DebateDetailsModal({ debateId, isOpen, onClose }: DebateDetailsModalProps) {
  const [debate, setDebate] = useState<DebateDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && debateId) {
      fetchDebateDetails()
    } else {
      setDebate(null)
      setError(null)
    }
  }, [isOpen, debateId])

  const fetchDebateDetails = async () => {
    if (!debateId) return

    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(`/api/debates/${debateId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch debate details')
      }

      const data = await response.json()
      setDebate(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load debate details')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      WAITING: 'bg-text-muted text-white',
      ACTIVE: 'bg-cyber-green text-black',
      COMPLETED: 'bg-electric-blue text-black',
      VERDICT_READY: 'bg-hot-pink text-black',
      APPEALED: 'bg-neon-orange text-black',
      CANCELLED: 'bg-text-muted text-white',
    }
    return statusColors[status] || 'bg-text-muted text-white'
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Debate Details" size="xl">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="py-12">
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Error Loading Debate"
            description={error}
          />
        </div>
      ) : debate ? (
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Header Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant={debate.category.toLowerCase() as any} size="sm">
                {debate.category}
              </Badge>
              <Badge variant="default" size="sm" className={getStatusBadge(debate.status)}>
                {formatStatus(debate.status)}
              </Badge>
            </div>
            <h2 className="text-2xl font-bold text-white">{debate.topic}</h2>
            {debate.description && (
              <p className="text-text-secondary">{debate.description}</p>
            )}
          </div>

          {/* Participants */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-bold text-white">Participants</h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Avatar
                    username={debate.challenger.username}
                    src={debate.challenger.avatarUrl}
                    size="md"
                  />
                  <div>
                    <p className="font-semibold text-white">{debate.challenger.username}</p>
                    <p className="text-sm text-text-secondary">ELO: {debate.challenger.eloRating}</p>
                    <p className="text-sm text-electric-blue">{debate.challengerPosition}</p>
                  </div>
                </div>
                {debate.opponent ? (
                  <div className="flex items-center gap-3">
                    <Avatar
                      username={debate.opponent.username}
                      src={debate.opponent.avatarUrl}
                      size="md"
                    />
                    <div>
                      <p className="font-semibold text-white">{debate.opponent.username}</p>
                      <p className="text-sm text-text-secondary">ELO: {debate.opponent.eloRating}</p>
                      <p className="text-sm text-neon-orange">{debate.opponentPosition}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-bg-tertiary flex items-center justify-center">
                      <span className="text-text-muted">?</span>
                    </div>
                    <div>
                      <p className="font-semibold text-text-muted">Waiting for opponent</p>
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Debate Progress */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-bold text-white">Progress</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Round</span>
                  <span className="text-white font-semibold">
                    {debate.currentRound} / {debate.totalRounds}
                  </span>
                </div>
                <div className="w-full h-2 bg-bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-electric-blue transition-all"
                    style={{ width: `${(debate.currentRound / debate.totalRounds) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-text-secondary mt-2">
                  <span>Started: {new Date(debate.createdAt).toLocaleString()}</span>
                  {debate.startedAt && (
                    <span>Active: {new Date(debate.startedAt).toLocaleString()}</span>
                  )}
                  {debate.endedAt && (
                    <span>Ended: {new Date(debate.endedAt).toLocaleString()}</span>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Statements */}
          {debate.statements.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-bold text-white">Arguments</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {debate.statements.map((statement) => (
                    <div
                      key={statement.id}
                      className="p-4 bg-bg-tertiary rounded-lg border border-bg-tertiary"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar
                          username={statement.author.username}
                          src={statement.author.avatarUrl}
                          size="sm"
                        />
                        <div>
                          <p className="font-semibold text-white">{statement.author.username}</p>
                          <p className="text-xs text-text-secondary">Round {statement.round}</p>
                        </div>
                      </div>
                      <p className="text-text-secondary whitespace-pre-wrap">{statement.content}</p>
                      <p className="text-xs text-text-muted mt-2">
                        {new Date(statement.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Verdicts */}
          {debate.verdicts.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-bold text-white">AI Judge Verdicts</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {debate.verdicts.map((verdict) => (
                    <div
                      key={verdict.id}
                      className="p-4 bg-bg-tertiary rounded-lg border border-bg-tertiary"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-white">{verdict.judge.name}</p>
                          <p className="text-sm text-text-secondary">{verdict.judge.personality}</p>
                        </div>
                        <Badge variant="default" size="sm">
                          {verdict.decision.replace('_', ' ')}
                        </Badge>
                      </div>
                      {verdict.challengerScore !== null && verdict.opponentScore !== null && (
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-text-secondary mb-1">
                              {debate.challenger.username}
                            </p>
                            <div className="w-full h-2 bg-bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-cyber-green"
                                style={{ width: `${verdict.challengerScore}%` }}
                              />
                            </div>
                            <p className="text-xs text-text-secondary mt-1">
                              {verdict.challengerScore}/100
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-text-secondary mb-1">
                              {debate.opponent?.username || 'N/A'}
                            </p>
                            <div className="w-full h-2 bg-bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-neon-orange"
                                style={{ width: `${verdict.opponentScore}%` }}
                              />
                            </div>
                            <p className="text-xs text-text-secondary mt-1">
                              {verdict.opponentScore}/100
                            </p>
                          </div>
                        </div>
                      )}
                      <p className="text-sm text-text-secondary whitespace-pre-wrap">
                        {verdict.reasoning}
                      </p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

            {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-bg-tertiary">
            <Link
              href={`/debate/${debate.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-electric-blue text-black font-semibold rounded-lg hover:bg-[#00B8E6] transition-colors"
            >
              View Full Page
            </Link>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-bg-tertiary text-white font-semibold rounded-lg hover:bg-bg-secondary transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}

