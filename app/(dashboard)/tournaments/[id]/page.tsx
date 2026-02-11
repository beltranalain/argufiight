'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/Loading'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import { useTournament } from '@/lib/hooks/queries/useTournaments'
import type { TournamentDetail, TournamentParticipant } from '@/lib/hooks/queries/useTournaments'
import { PositionSelector } from '@/components/tournaments/PositionSelector'
import { ChampionshipRulesModal } from '@/components/tournaments/ChampionshipRulesModal'
import { fetchClient } from '@/lib/api/fetchClient'
import { formatStatus } from '@/lib/utils/format-status'

const TournamentBracket = dynamic(
  () => import('@/components/tournaments/TournamentBracket').then(mod => ({ default: mod.TournamentBracket })),
  { loading: () => <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div> }
)

function getChampionUserId(tournament: TournamentDetail): string | null {
  if (tournament.status !== 'COMPLETED') return null
  const finalMatch = tournament.matches.find(m => m.round === tournament.totalRounds && m.winnerId)
  if (finalMatch?.winnerId) {
    return tournament.participants.find(p => p.id === finalMatch.winnerId)?.userId || null
  }
  return tournament.participants.find(p => p.status === 'ACTIVE')?.userId || null
}

function ParticipantCard({ participant, tournament, isChampion }: {
  participant: TournamentParticipant
  tournament: TournamentDetail
  isChampion: boolean
}) {
  const matchCount = tournament.matches.filter(m =>
    (m.participant1Id === participant.id && m.participant1Score !== null) ||
    (m.participant2Id === participant.id && m.participant2Score !== null)
  ).length
  const totalScore = tournament.matches.reduce((sum, m) => {
    if (m.participant1Id === participant.id && m.participant1Score !== null) return sum + m.participant1Score
    if (m.participant2Id === participant.id && m.participant2Score !== null) return sum + m.participant2Score
    return sum
  }, 0)
  const averageScore = matchCount > 0 ? Math.round(totalScore / matchCount) : null

  return (
    <div className={`p-4 rounded-lg border-2 transition-all ${
      isChampion ? 'bg-cyber-green/20 border-cyber-green winner-animation' : 'bg-bg-secondary border-bg-tertiary'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-text-secondary text-sm">Seed #{participant.seed}</span>
        <Badge variant="default" size="sm">{formatStatus(participant.status)}</Badge>
      </div>
      <div className="flex items-center gap-2">
        {participant.user.avatarUrl ? (
          <img src={participant.user.avatarUrl} alt={participant.user.username} className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center">
            <span className="text-text-secondary text-xs">{participant.user.username[0].toUpperCase()}</span>
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-text-primary font-semibold">@{participant.user.username}</p>
            {isChampion && <Badge variant="default" className="bg-cyber-green text-black text-xs">Champion</Badge>}
          </div>
          <p className="text-text-secondary text-xs">ELO: {participant.user.eloRating}</p>
          {(participant.wins > 0 || participant.losses > 0) && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-cyber-green text-xs font-semibold">{participant.wins}W</span>
              <span className="text-neon-orange text-xs font-semibold">{participant.losses}L</span>
            </div>
          )}
          {averageScore !== null && tournament.format !== 'KING_OF_THE_HILL' && (
            <p className="text-electric-blue text-xs font-semibold mt-0.5">Avg Score: {averageScore}/100</p>
          )}
          {tournament.format === 'KING_OF_THE_HILL' && participant.cumulativeScore !== null && (
            <p className="text-electric-blue text-xs font-semibold mt-0.5">Cumulative Score: {participant.cumulativeScore}/300</p>
          )}
          {tournament.format === 'KING_OF_THE_HILL' && participant.status === 'ELIMINATED' && participant.eliminationRound && (
            <div className="mt-1">
              <Badge variant="default" className="bg-red-500 text-white text-xs">
                Eliminated Round {participant.eliminationRound}
              </Badge>
              {participant.eliminationReason && (
                <p className="text-text-secondary text-xs mt-1 italic">
                  {participant.eliminationReason.substring(0, 100)}{participant.eliminationReason.length > 100 ? '...' : ''}
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
}

function FinalsExplanation({ tournament }: { tournament: TournamentDetail }) {
  if (tournament.currentRound < tournament.totalRounds) {
    return (
      <div className="p-4 bg-bg-secondary rounded-lg border border-bg-tertiary text-center">
        <p className="text-text-secondary text-sm">
          Finals explanation will appear once the tournament reaches the final round.
        </p>
      </div>
    )
  }

  if (tournament.format === 'CHAMPIONSHIP') {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-bg-secondary rounded-lg border border-bg-tertiary">
          <p className="text-text-primary font-semibold mb-2">Championship Format</p>
          <p className="text-text-secondary text-sm">
            Advancement is based on individual performance scores, not just match wins.
          </p>
        </div>
        <div className="space-y-3">
          <p className="text-text-primary font-semibold text-sm">Round 1 Scores:</p>
          {tournament.matches.filter(m => m.round === 1).map((match) => {
            const p1 = tournament.participants.find(p => p.id === match.participant1Id)
            const p2 = tournament.participants.find(p => p.id === match.participant2Id)
            return (
              <div key={match.id} className="p-4 bg-bg-secondary rounded-lg border border-bg-tertiary space-y-2">
                {[{ p: p1, score: match.participant1Score }, { p: p2, score: match.participant2Score }].map(({ p, score }, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-bg-tertiary rounded">
                    <div className="flex items-center gap-2">
                      {p?.user.avatarUrl ? (
                        <img src={p.user.avatarUrl} alt={p.user.username} className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-bg-secondary flex items-center justify-center">
                          <span className="text-text-secondary text-xs">{p?.user.username[0].toUpperCase()}</span>
                        </div>
                      )}
                      <span className="text-text-primary text-sm">@{p?.user.username}</span>
                    </div>
                    <span className="text-electric-blue font-semibold text-sm">
                      {score !== null ? `${score}/100` : 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
        <div className="p-4 bg-cyber-green/10 rounded-lg border border-cyber-green/30">
          <p className="text-text-primary text-sm">
            <strong>Result:</strong> The two highest-scoring participants from Round 1 advanced to the finals.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-bg-secondary rounded-lg border border-bg-tertiary">
        <p className="text-text-primary font-semibold mb-2">Bracket Format</p>
        <p className="text-text-secondary text-sm">
          Only the winners of each match advance. The two Round 1 winners face off in the finals.
        </p>
      </div>
      <div className="space-y-3">
        <p className="text-text-primary font-semibold text-sm">Round 1 Winners:</p>
        {tournament.matches.filter(m => m.round === 1 && m.winnerId).map((match) => {
          const winner = tournament.participants.find(p => p.id === match.winnerId)
          return (
            <div key={match.id} className="p-4 bg-bg-secondary rounded-lg border border-bg-tertiary">
              <div className="flex items-center gap-3">
                {winner?.user.avatarUrl ? (
                  <img src={winner.user.avatarUrl} alt={winner.user.username} className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center">
                    <span className="text-text-secondary text-xs">{winner?.user.username[0].toUpperCase()}</span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-text-primary font-semibold">@{winner?.user.username}</p>
                  <p className="text-text-secondary text-xs">ELO: {winner?.user.eloRating}</p>
                </div>
                <span className="text-cyber-green font-semibold">Winner</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function TournamentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const tournamentId = params.id as string
  const [showPositionSelector, setShowPositionSelector] = useState(false)
  const [showRulesModal, setShowRulesModal] = useState(false)

  const { data: tournament, isLoading, isError, refetch } = useTournament(tournamentId)

  const joinMutation = useMutation({
    mutationFn: (selectedPosition: 'PRO' | 'CON' | null) =>
      fetchClient(`/api/tournaments/${tournamentId}/join`, {
        method: 'POST',
        body: JSON.stringify({ selectedPosition: selectedPosition || undefined }),
      }),
    onSuccess: () => {
      showToast({ type: 'success', title: 'Joined Tournament!', description: 'You have successfully joined the tournament' })
      setShowPositionSelector(false)
      queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] })
    },
    onError: (error: any) => {
      showToast({ type: 'error', title: 'Failed to Join', description: error.message || 'Failed to join tournament' })
    },
  })

  const handleJoin = () => {
    if (!user) { router.push('/login'); return }
    if (!tournament) return
    if (tournament.isParticipant) {
      showToast({ type: 'warning', title: 'Already Participating', description: 'You are already registered for this tournament' })
      return
    }
    if (tournament.isCreator) {
      showToast({ type: 'warning', title: 'Cannot Join', description: 'You cannot join a tournament you created' })
      return
    }
    if (tournament.status !== 'UPCOMING' && tournament.status !== 'REGISTRATION_OPEN') {
      showToast({ type: 'error', title: 'Registration Closed', description: 'This tournament is not accepting new participants' })
      return
    }
    if (tournament.participants.length >= tournament.maxParticipants) {
      showToast({ type: 'error', title: 'Tournament Full', description: 'Maximum participants reached' })
      return
    }
    if (tournament.format === 'CHAMPIONSHIP') {
      setShowPositionSelector(true)
      return
    }
    joinMutation.mutate(null)
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

  if (isError || !tournament) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="TOURNAMENTS" />
        <div className="pt-20">
          <ErrorDisplay title="Failed to load tournament" onRetry={() => refetch()} />
        </div>
      </div>
    )
  }

  const canJoin = user && !tournament.isParticipant && !tournament.isCreator
    && (tournament.status === 'UPCOMING' || tournament.status === 'REGISTRATION_OPEN')
    && tournament.participants.length < tournament.maxParticipants

  const championUserId = getChampionUserId(tournament)

  const proCount = tournament.format === 'CHAMPIONSHIP'
    ? tournament.participants.filter(p => p.selectedPosition === 'PRO').length : 0
  const conCount = tournament.format === 'CHAMPIONSHIP'
    ? tournament.participants.filter(p => p.selectedPosition === 'CON').length : 0
  const maxPerPosition = tournament.format === 'CHAMPIONSHIP' ? tournament.maxParticipants / 2 : 0

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="TOURNAMENTS" />

      <div className="pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.push('/tournaments')} className="mb-4">
              &larr; Back to Tournaments
            </Button>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-text-primary">{tournament.name}</h1>
              {tournament.description && (
                <p className="text-text-secondary text-lg">{tournament.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm">
                <div><span className="text-text-secondary">Created by: </span><span className="text-text-primary font-semibold">@{tournament.creator.username}</span></div>
                <div><span className="text-text-secondary">Participants: </span><span className="text-text-primary font-semibold">{tournament.participants.length} / {tournament.maxParticipants}</span></div>
                <div><span className="text-text-secondary">Rounds: </span><span className="text-text-primary font-semibold">{tournament.currentRound} / {tournament.totalRounds}</span></div>
                <div><span className="text-text-secondary">Status: </span><span className="text-text-primary font-semibold">{formatStatus(tournament.status)}</span></div>
                <div><span className="text-text-secondary">Privacy: </span><span className="text-text-primary font-semibold">{tournament.isPrivate ? 'Private' : 'Public'}</span></div>
                {tournament.format && (
                  <div><span className="text-text-secondary">Format: </span><span className="text-text-primary font-semibold">{tournament.format === 'CHAMPIONSHIP' ? 'Championship' : tournament.format === 'KING_OF_THE_HILL' ? 'KOH' : 'Bracket'}</span></div>
                )}
                {tournament.minElo && (
                  <div><span className="text-text-secondary">Min ELO: </span><span className="text-text-primary font-semibold">{tournament.minElo}</span></div>
                )}
              </div>
              <div className="flex justify-center items-center gap-3 pt-2">
                {canJoin && (
                  <Button onClick={handleJoin} variant="primary" isLoading={joinMutation.isPending} className="min-w-[150px]">
                    Join Tournament
                  </Button>
                )}
                {tournament.isParticipant && (
                  <Badge variant="default" className="bg-electric-blue text-black">You&apos;re Participating</Badge>
                )}
                {tournament.isCreator && (
                  <Badge variant="default" className="bg-neon-orange text-black">You&apos;re the Creator</Badge>
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
                <p className="text-text-secondary text-center py-8">No participants yet. Be the first to join!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {tournament.participants.map((participant) => (
                    <ParticipantCard
                      key={participant.id}
                      participant={participant}
                      tournament={tournament}
                      isChampion={tournament.status === 'COMPLETED' && participant.user.id === championUserId}
                    />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Bracket and Finals */}
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
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <h2 className="text-xl font-bold text-text-primary">Finals Explanation</h2>
                  </CardHeader>
                  <CardBody>
                    <FinalsExplanation tournament={tournament} />
                  </CardBody>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Position Selector Modal */}
      {tournament.format === 'CHAMPIONSHIP' && (
        <PositionSelector
          isOpen={showPositionSelector}
          onClose={() => setShowPositionSelector(false)}
          onSelect={(pos) => joinMutation.mutate(pos)}
          proCount={proCount}
          conCount={conCount}
          maxPerPosition={maxPerPosition}
          isLoading={joinMutation.isPending}
        />
      )}

      <ChampionshipRulesModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)} />
    </div>
  )
}
