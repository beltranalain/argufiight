'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import { TournamentBracket } from '@/components/tournaments/TournamentBracket'
import { PositionSelector } from '@/components/tournaments/PositionSelector'
import { ChampionshipRulesModal } from '@/components/tournaments/ChampionshipRulesModal'
import { formatStatus } from '@/lib/utils/format-status'
import Link from 'next/link'

interface Tournament {
  id: string
  name: string
  description: string | null
  status: string
  maxParticipants: number
  currentRound: number
  totalRounds: number
  startDate: string
  endDate: string | null
  minElo: number | null
  roundDuration: number
  reseedAfterRound: boolean
  reseedMethod: string
  format: 'BRACKET' | 'CHAMPIONSHIP'
  assignedJudges: string[] | null
  creator: {
    id: string
    username: string
    avatarUrl: string | null
    eloRating: number
  }
  judge: {
    id: string
    name: string
    emoji: string
    personality: string
  } | null
  participants: Array<{
    id: string
    userId: string
    seed: number
    status: string
    selectedPosition: string | null
    user: {
      id: string
      username: string
      avatarUrl: string | null
      eloRating: number
    }
  }>
  matches: Array<{
    id: string
    round: number
    matchNumber: number
    participant1Id: string | null
    participant2Id: string | null
    winnerId: string | null
    status: string
    participant1Score: number | null
    participant2Score: number | null
    participant1ScoreBreakdown: Record<string, number> | null
    participant2ScoreBreakdown: Record<string, number> | null
    debate: {
      id: string
      topic: string
      status: string
      winnerId: string | null
      challenger: {
        id: string
        username: string
      }
      opponent: {
        id: string
        username: string
      } | null
    } | null
  }>
  isParticipant: boolean
  isCreator: boolean
  isPrivate: boolean
  createdAt: string
}

export default function TournamentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [showPositionSelector, setShowPositionSelector] = useState(false)
  const [showRulesModal, setShowRulesModal] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchTournament()
    }
  }, [params.id])

  const fetchTournament = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/tournaments/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setTournament(data.tournament)
      } else {
        showToast({
          type: 'error',
          title: 'Error',
          description: 'Tournament not found',
        })
        router.push('/tournaments')
      }
    } catch (error) {
      console.error('Failed to fetch tournament:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load tournament',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!tournament) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Tournament data not loaded',
      })
      return
    }

    // Double-check eligibility before attempting to join
    if (tournament.isParticipant) {
      showToast({
        type: 'warning',
        title: 'Already Participating',
        description: 'You are already registered for this tournament',
      })
      return
    }

    if (tournament.isCreator) {
      showToast({
        type: 'warning',
        title: 'Cannot Join',
        description: 'You cannot join a tournament you created',
      })
      return
    }

    if (tournament.status !== 'UPCOMING' && tournament.status !== 'REGISTRATION_OPEN') {
      showToast({
        type: 'error',
        title: 'Registration Closed',
        description: 'This tournament is not accepting new participants',
      })
      return
    }

    if (tournament.participants.length >= tournament.maxParticipants) {
      showToast({
        type: 'error',
        title: 'Tournament Full',
        description: 'This tournament has reached its maximum number of participants',
      })
      return
    }

    // If Championship format, show position selector first
    if (tournament.format === 'CHAMPIONSHIP') {
      setShowPositionSelector(true)
      return
    }

    // For Bracket format, join directly
    await handleJoinTournament(null)
  }

  const handleJoinTournament = async (selectedPosition: 'PRO' | 'CON' | null) => {
    if (!tournament) return

    setIsJoining(true)
    try {
      console.log(`[Frontend] Attempting to join tournament ${params.id} with position: ${selectedPosition}`)
      const response = await fetch(`/api/tournaments/${params.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedPosition: selectedPosition || undefined,
        }),
      })

      const data = await response.json()
      console.log(`[Frontend] Join response:`, { status: response.status, data })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Joined Tournament!',
          description: 'You have successfully joined the tournament',
        })
        setShowPositionSelector(false)
        // Refresh to update participant status
        await fetchTournament()
      } else {
        console.error(`[Frontend] Join failed:`, data.error)
        showToast({
          type: 'error',
          title: 'Failed to Join',
          description: data.error || 'Failed to join tournament. Please try again.',
        })
      }
    } catch (error: any) {
      console.error('[Frontend] Failed to join tournament:', error)
      showToast({
        type: 'error',
        title: 'Network Error',
        description: error.message || 'Failed to connect to server. Please check your connection and try again.',
      })
    } finally {
      setIsJoining(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-blue-500'
      case 'REGISTRATION_OPEN':
        return 'bg-green-500'
      case 'IN_PROGRESS':
        return 'bg-yellow-500'
      case 'COMPLETED':
        return 'bg-cyber-green'
      case 'CANCELLED':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="TOURNAMENTS" />
        <div className="pt-20 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!tournament) {
    return null
  }

  const canJoin =
    user &&
    !tournament.isParticipant &&
    !tournament.isCreator &&
    (tournament.status === 'UPCOMING' || tournament.status === 'REGISTRATION_OPEN') &&
    tournament.participants.length < tournament.maxParticipants

  // Calculate position counts for Championship format
  const proCount = tournament.format === 'CHAMPIONSHIP' 
    ? tournament.participants.filter((p) => p.selectedPosition === 'PRO').length 
    : 0
  const conCount = tournament.format === 'CHAMPIONSHIP' 
    ? tournament.participants.filter((p) => p.selectedPosition === 'CON').length 
    : 0
  const maxPerPosition = tournament.format === 'CHAMPIONSHIP' ? tournament.maxParticipants / 2 : 0

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="TOURNAMENTS" />
      
      <div className="pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.push('/tournaments')} className="mb-4">
              ← Back to Tournaments
            </Button>
            <div className="space-y-4">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-4xl font-bold text-text-primary">{tournament.name}</h1>
                  <Badge variant="default" className={getStatusColor(tournament.status)}>
                    {formatStatus(tournament.status)}
                  </Badge>
                <Badge 
                  variant="default" 
                  className={tournament.isPrivate ? 'bg-neon-orange text-black' : 'bg-electric-blue text-black'}
                >
                  {tournament.isPrivate ? 'Private' : 'Public'}
                </Badge>
                <Badge 
                  variant="default" 
                  className={tournament.format === 'CHAMPIONSHIP' ? 'bg-cyber-green text-black' : 'bg-bg-tertiary text-text-primary'}
                >
                  {tournament.format === 'CHAMPIONSHIP' ? 'Championship' : 'Bracket'}
                </Badge>
                {tournament.format === 'CHAMPIONSHIP' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRulesModal(true)}
                    className="text-text-secondary hover:text-text-primary text-xs"
                  >
                    How it works?
                  </Button>
                )}
              </div>
              {tournament.description && (
                <p className="text-text-secondary text-lg mb-4">{tournament.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-text-secondary">Created by: </span>
                  <span className="text-text-primary font-semibold">
                    @{tournament.creator.username}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary">Participants: </span>
                  <span className="text-text-primary font-semibold">
                    {tournament.participants.length} / {tournament.maxParticipants}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary">Rounds: </span>
                  <span className="text-text-primary font-semibold">
                    {tournament.currentRound} / {tournament.totalRounds}
                  </span>
                </div>
                {tournament.minElo && (
                  <div>
                    <span className="text-text-secondary">Min ELO: </span>
                    <span className="text-text-primary font-semibold">{tournament.minElo}</span>
                  </div>
                )}
              </div>
              {/* Join Button - Centered */}
              <div className="flex justify-center items-center gap-3 pt-2">
                {canJoin && (
                  <Button 
                    onClick={handleJoin} 
                    variant="primary" 
                    isLoading={isJoining}
                    disabled={isJoining}
                    className="min-w-[150px]"
                  >
                    {isJoining ? 'Joining...' : 'Join Tournament'}
                  </Button>
                )}
                {tournament.isParticipant && (
                  <Badge variant="default" className="bg-electric-blue text-black">
                    You're Participating
                  </Badge>
                )}
                {tournament.isCreator && (
                  <Badge variant="default" className="bg-neon-orange text-black">
                    You're the Creator
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Participants */}
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">Participants</h2>
            </CardHeader>
            <CardBody>
              {tournament.participants.length === 0 ? (
                <p className="text-text-secondary text-center py-8">
                  No participants yet. Be the first to join!
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {tournament.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="p-4 bg-bg-secondary rounded-lg border border-bg-tertiary"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-text-secondary text-sm">Seed #{participant.seed}</span>
                        <Badge variant="default" size="sm">
                          {formatStatus(participant.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {participant.user.avatarUrl ? (
                          <img
                            src={participant.user.avatarUrl}
                            alt={participant.user.username}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center">
                            <span className="text-text-secondary text-xs">
                              {participant.user.username[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-text-primary font-semibold">
                            @{participant.user.username}
                          </p>
                          <p className="text-text-secondary text-xs">ELO: {participant.user.eloRating}</p>
                          {tournament.format === 'CHAMPIONSHIP' && participant.selectedPosition && (
                            <Badge 
                              variant="default" 
                              className={participant.selectedPosition === 'PRO' ? 'bg-cyber-green text-black text-xs mt-1' : 'bg-neon-orange text-black text-xs mt-1'}
                            >
                              {participant.selectedPosition}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Bracket Visualization and Explanation */}
          {tournament.matches.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <h2 className="text-xl font-bold text-text-primary">Tournament Bracket</h2>
                  </CardHeader>
                  <CardBody>
                    <TournamentBracket
                      participants={tournament.participants}
                      matches={tournament.matches}
                      totalRounds={tournament.totalRounds}
                      currentRound={tournament.currentRound}
                    />
                  </CardBody>
                </Card>
              </div>
              
              {/* Finals Explanation Box */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <h2 className="text-xl font-bold text-text-primary">Finals Explanation</h2>
                  </CardHeader>
                  <CardBody>
                    {tournament.currentRound >= tournament.totalRounds ? (
                      <div className="space-y-4">
                        {tournament.format === 'CHAMPIONSHIP' ? (
                          <>
                            <p className="text-text-primary">
                              <strong>Championship Format:</strong> The two finalists advanced based on their individual scores from Round 1.
                            </p>
                            <p className="text-text-secondary text-sm">
                              In Championship format, advancement is determined by individual performance scores, not just match wins. The top scorers from each position (PRO and CON) advance to the finals.
                            </p>
                            <div className="mt-4 p-3 bg-bg-secondary rounded-lg border border-bg-tertiary">
                              <p className="text-text-primary font-semibold mb-2">Round 1 Scores:</p>
                              {tournament.matches
                                .filter(m => m.round === 1)
                                .map((match) => {
                                  const p1 = tournament.participants.find(p => p.id === match.participant1Id)
                                  const p2 = tournament.participants.find(p => p.id === match.participant2Id)
                                  return (
                                    <div key={match.id} className="text-sm space-y-1 mb-3 last:mb-0">
                                      <div className="flex justify-between">
                                        <span className="text-text-secondary">@{p1?.user.username}</span>
                                        <span className="text-electric-blue font-semibold">
                                          {match.participant1Score !== null ? `${match.participant1Score}/100` : 'N/A'}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-text-secondary">@{p2?.user.username}</span>
                                        <span className="text-electric-blue font-semibold">
                                          {match.participant2Score !== null ? `${match.participant2Score}/100` : 'N/A'}
                                        </span>
                                      </div>
                                    </div>
                                  )
                                })}
                            </div>
                            <p className="text-text-secondary text-sm mt-3">
                              The two highest-scoring participants from Round 1 advanced to the finals, regardless of whether they won their individual matches.
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-text-primary">
                              <strong>Bracket Format:</strong> The two finalists are the winners of the Round 1 matches.
                            </p>
                            <p className="text-text-secondary text-sm">
                              In Bracket format, only the winners of each match advance to the next round. The two Round 1 winners face off in the finals.
                            </p>
                            <div className="mt-4 p-3 bg-bg-secondary rounded-lg border border-bg-tertiary">
                              <p className="text-text-primary font-semibold mb-2">Round 1 Winners:</p>
                              {tournament.matches
                                .filter(m => m.round === 1 && m.winnerId)
                                .map((match) => {
                                  const winner = tournament.participants.find(p => p.id === match.winnerId)
                                  return (
                                    <div key={match.id} className="text-sm mb-2">
                                      <span className="text-cyber-green font-semibold">✓</span>{' '}
                                      <span className="text-text-primary">@{winner?.user.username}</span>
                                    </div>
                                  )
                                })}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <p className="text-text-secondary">
                        Finals explanation will appear once the tournament reaches the final round.
                      </p>
                    )}
                  </CardBody>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Position Selector Modal */}
      {tournament && tournament.format === 'CHAMPIONSHIP' && (
        <PositionSelector
          isOpen={showPositionSelector}
          onClose={() => setShowPositionSelector(false)}
          onSelect={handleJoinTournament}
          proCount={proCount}
          conCount={conCount}
          maxPerPosition={maxPerPosition}
          isLoading={isJoining}
        />
      )}

      {/* Championship Rules Modal */}
      <ChampionshipRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />
    </div>
  )
}

