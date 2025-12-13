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
  format: 'BRACKET' | 'CHAMPIONSHIP' | 'KING_OF_THE_HILL'
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
    eliminationRound: number | null
    eliminationReason: string | null
    cumulativeScore: number | null
    wins: number
    losses: number
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
    // King of the Hill doesn't require position selection
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

  // Find the tournament champion (winner of final match or active participant when completed)
  const getTournamentChampion = () => {
    if (tournament.status !== 'COMPLETED') return null
    
    // Find the winner of the final round match
    const finalRound = tournament.totalRounds
    const finalMatch = tournament.matches.find(m => m.round === finalRound && m.winnerId)
    if (finalMatch?.winnerId) {
      return tournament.participants.find(p => p.id === finalMatch.winnerId)?.userId || null
    }
    
    // Fallback: find active participant
    const activeParticipant = tournament.participants.find(p => p.status === 'ACTIVE')
    return activeParticipant?.userId || null
  }

  const championUserId = getTournamentChampion()

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
                <div>
                  <span className="text-text-secondary">Status: </span>
                  <span className="text-text-primary font-semibold">
                    {formatStatus(tournament.status)}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary">Privacy: </span>
                  <span className="text-text-primary font-semibold">
                    {tournament.isPrivate ? 'Private' : 'Public'}
                  </span>
                </div>
                {tournament.format && (
                  <div>
                    <span className="text-text-secondary">Format: </span>
                    <span className="text-text-primary font-semibold">
                      {tournament.format === 'CHAMPIONSHIP' 
                        ? 'Championship' 
                        : tournament.format === 'KING_OF_THE_HILL'
                        ? 'KOH'
                        : 'Bracket'}
                    </span>
                  </div>
                )}
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
                  {tournament.participants.map((participant) => {
                    // Calculate total score for this participant
                    const totalScore = tournament.matches.reduce((sum, match) => {
                      if (match.participant1Id === participant.id && match.participant1Score !== null) {
                        return sum + match.participant1Score
                      }
                      if (match.participant2Id === participant.id && match.participant2Score !== null) {
                        return sum + match.participant2Score
                      }
                      return sum
                    }, 0)
                    const matchCount = tournament.matches.filter(m => 
                      (m.participant1Id === participant.id && m.participant1Score !== null) ||
                      (m.participant2Id === participant.id && m.participant2Score !== null)
                    ).length
                    const averageScore = matchCount > 0 ? Math.round(totalScore / matchCount) : null

                    const isChampion = tournament.status === 'COMPLETED' && participant.user.id === championUserId

                    return (
                      <div
                        key={participant.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isChampion
                            ? 'bg-cyber-green/20 border-cyber-green winner-animation'
                            : 'bg-bg-secondary border-bg-tertiary'
                        }`}
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
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-text-primary font-semibold">
                                @{participant.user.username}
                              </p>
                              {isChampion && (
                                <Badge variant="default" className="bg-cyber-green text-black text-xs">
                                  Champion
                                </Badge>
                              )}
                            </div>
                            <p className="text-text-secondary text-xs">ELO: {participant.user.eloRating}</p>
                            {(participant.wins > 0 || participant.losses > 0) && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-cyber-green text-xs font-semibold">
                                  {participant.wins}W
                                </span>
                                <span className="text-neon-orange text-xs font-semibold">
                                  {participant.losses}L
                                </span>
                              </div>
                            )}
                            {averageScore !== null && tournament.format !== 'KING_OF_THE_HILL' && (
                              <p className="text-electric-blue text-xs font-semibold mt-0.5">
                                Avg Score: {averageScore}/100
                              </p>
                            )}
                            {tournament.format === 'KING_OF_THE_HILL' && participant.cumulativeScore !== null && (
                              <p className="text-electric-blue text-xs font-semibold mt-0.5">
                                Cumulative Score: {participant.cumulativeScore}/300
                              </p>
                            )}
                            {tournament.format === 'KING_OF_THE_HILL' && participant.status === 'ELIMINATED' && participant.eliminationRound && (
                              <div className="mt-1">
                                <Badge variant="default" className="bg-red-500 text-white text-xs">
                                  ✗ Eliminated Round {participant.eliminationRound}
                                </Badge>
                                {participant.eliminationReason && (
                                  <p className="text-text-secondary text-xs mt-1 italic">
                                    {participant.eliminationReason.substring(0, 100)}
                                    {participant.eliminationReason.length > 100 ? '...' : ''}
                                  </p>
                                )}
                              </div>
                            )}
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
                    )
                  })}
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
                      format={tournament.format}
                      tournamentStatus={tournament.status}
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
                            <div className="p-4 bg-bg-secondary rounded-lg border border-bg-tertiary">
                              <p className="text-text-primary font-semibold mb-2">Championship Format</p>
                              <p className="text-text-secondary text-sm">
                                Advancement is based on individual performance scores, not just match wins. The top scorers from each position advance.
                              </p>
                            </div>
                            
                            <div className="space-y-3">
                              <p className="text-text-primary font-semibold text-sm">Round 1 Scores:</p>
                              {tournament.matches
                                .filter(m => m.round === 1)
                                .map((match) => {
                                  const p1 = tournament.participants.find(p => p.id === match.participant1Id)
                                  const p2 = tournament.participants.find(p => p.id === match.participant2Id)
                                  return (
                                    <div key={match.id} className="p-4 bg-bg-secondary rounded-lg border border-bg-tertiary space-y-2">
                                      <div className="flex items-center justify-between p-2 bg-bg-tertiary rounded">
                                        <div className="flex items-center gap-2">
                                          {p1?.user.avatarUrl ? (
                                            <img
                                              src={p1.user.avatarUrl}
                                              alt={p1.user.username}
                                              className="w-6 h-6 rounded-full"
                                            />
                                          ) : (
                                            <div className="w-6 h-6 rounded-full bg-bg-secondary flex items-center justify-center">
                                              <span className="text-text-secondary text-xs">
                                                {p1?.user.username[0].toUpperCase()}
                                              </span>
                                            </div>
                                          )}
                                          <span className="text-text-primary text-sm">@{p1?.user.username}</span>
                                        </div>
                                        <span className="text-electric-blue font-semibold text-sm">
                                          {match.participant1Score !== null ? `${match.participant1Score}/100` : 'N/A'}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between p-2 bg-bg-tertiary rounded">
                                        <div className="flex items-center gap-2">
                                          {p2?.user.avatarUrl ? (
                                            <img
                                              src={p2.user.avatarUrl}
                                              alt={p2.user.username}
                                              className="w-6 h-6 rounded-full"
                                            />
                                          ) : (
                                            <div className="w-6 h-6 rounded-full bg-bg-secondary flex items-center justify-center">
                                              <span className="text-text-secondary text-xs">
                                                {p2?.user.username[0].toUpperCase()}
                                              </span>
                                            </div>
                                          )}
                                          <span className="text-text-primary text-sm">@{p2?.user.username}</span>
                                        </div>
                                        <span className="text-electric-blue font-semibold text-sm">
                                          {match.participant2Score !== null ? `${match.participant2Score}/100` : 'N/A'}
                                        </span>
                                      </div>
                                    </div>
                                  )
                                })}
                            </div>
                            
                            <div className="p-4 bg-cyber-green/10 rounded-lg border border-cyber-green/30">
                              <p className="text-text-primary text-sm">
                                <strong>Result:</strong> The two highest-scoring participants from Round 1 advanced to the finals, regardless of match wins.
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="p-4 bg-bg-secondary rounded-lg border border-bg-tertiary">
                              <p className="text-text-primary font-semibold mb-2">Bracket Format</p>
                              <p className="text-text-secondary text-sm">
                                Only the winners of each match advance to the next round. The two Round 1 winners face off in the finals.
                              </p>
                            </div>
                            
                            <div className="space-y-3">
                              <p className="text-text-primary font-semibold text-sm">Round 1 Winners:</p>
                              {tournament.matches
                                .filter(m => m.round === 1 && m.winnerId)
                                .map((match) => {
                                  const winner = tournament.participants.find(p => p.id === match.winnerId)
                                  return (
                                    <div key={match.id} className="p-4 bg-bg-secondary rounded-lg border border-bg-tertiary">
                                      <div className="flex items-center gap-3">
                                        {winner?.user.avatarUrl ? (
                                          <img
                                            src={winner.user.avatarUrl}
                                            alt={winner.user.username}
                                            className="w-8 h-8 rounded-full"
                                          />
                                        ) : (
                                          <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center">
                                            <span className="text-text-secondary text-xs">
                                              {winner?.user.username[0].toUpperCase()}
                                            </span>
                                          </div>
                                        )}
                                        <div className="flex-1">
                                          <p className="text-text-primary font-semibold">@{winner?.user.username}</p>
                                          <p className="text-text-secondary text-xs">ELO: {winner?.user.eloRating}</p>
                                        </div>
                                        <span className="text-cyber-green font-semibold">✓ Winner</span>
                                      </div>
                                    </div>
                                  )
                                })}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-bg-secondary rounded-lg border border-bg-tertiary text-center">
                        <p className="text-text-secondary text-sm">
                          Finals explanation will appear once the tournament reaches the final round.
                        </p>
                      </div>
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

