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
      router.push('/auth/signin')
      return
    }

    setIsJoining(true)
    try {
      const response = await fetch(`/api/tournaments/${params.id}/join`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Joined Tournament!',
          description: 'You have successfully joined the tournament',
        })
        fetchTournament() // Refresh to update participant status
      } else {
        showToast({
          type: 'error',
          title: 'Error',
          description: data.error || 'Failed to join tournament',
        })
      }
    } catch (error) {
      console.error('Failed to join tournament:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to join tournament',
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
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-4xl font-bold text-text-primary">{tournament.name}</h1>
                  <Badge variant="default" className={getStatusColor(tournament.status)}>
                    {tournament.status.replace('_', ' ')}
                  </Badge>
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
              </div>
              {canJoin && (
                <Button onClick={handleJoin} variant="primary" isLoading={isJoining}>
                  Join Tournament
                </Button>
              )}
              {tournament.isParticipant && (
                <Badge variant="default" className="bg-electric-blue text-black">
                  You're Participating
                </Badge>
              )}
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
                          {participant.status}
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
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Matches/Bracket */}
          {tournament.matches.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-text-primary">Matches</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-6">
                  {Array.from({ length: tournament.totalRounds }).map((_, roundIndex) => {
                    const round = roundIndex + 1
                    const roundMatches = tournament.matches.filter((m) => m.round === round)

                    if (roundMatches.length === 0) return null

                    return (
                      <div key={round}>
                        <h3 className="text-lg font-semibold text-text-primary mb-4">
                          Round {round}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {roundMatches.map((match) => {
                            const participant1 = tournament.participants.find(
                              (p) => p.id === match.participant1Id
                            )
                            const participant2 = tournament.participants.find(
                              (p) => p.id === match.participant2Id
                            )

                            return (
                              <div
                                key={match.id}
                                className="p-4 bg-bg-secondary rounded-lg border border-bg-tertiary"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-text-secondary text-sm">
                                    Match {match.matchNumber}
                                  </span>
                                  <Badge variant="default" size="sm">
                                    {match.status}
                                  </Badge>
                                </div>
                                <div className="space-y-2">
                                  <div
                                    className={`p-2 rounded ${
                                      match.winnerId === participant1?.userId
                                        ? 'bg-cyber-green/20 border border-cyber-green'
                                        : 'bg-bg-tertiary'
                                    }`}
                                  >
                                    <p className="text-text-primary text-sm font-semibold">
                                      {participant1
                                        ? `@${participant1.user.username}`
                                        : 'TBD'}
                                    </p>
                                  </div>
                                  <div className="text-center text-text-secondary text-xs">VS</div>
                                  <div
                                    className={`p-2 rounded ${
                                      match.winnerId === participant2?.userId
                                        ? 'bg-cyber-green/20 border border-cyber-green'
                                        : 'bg-bg-tertiary'
                                    }`}
                                  >
                                    <p className="text-text-primary text-sm font-semibold">
                                      {participant2
                                        ? `@${participant2.user.username}`
                                        : 'TBD'}
                                    </p>
                                  </div>
                                </div>
                                {match.debate && (
                                  <Link href={`/debate/${match.debate.id}`} className="mt-3 block">
                                    <Button variant="secondary" size="sm" className="w-full">
                                      View Debate
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
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

