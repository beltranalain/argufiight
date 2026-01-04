'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { TopNav } from '@/components/layout/TopNav'

interface BeltDetails {
  id: string
  name: string
  type: string
  category: string | null
  status: string
  currentHolderId: string | null
  currentHolder: {
    id: string
    username: string
    avatarUrl: string | null
    eloRating: number
  } | null
  tournament: {
    id: string
    name: string
  } | null
  coinValue: number
  timesDefended: number
  successfulDefenses: number
  lastDefendedAt: string | null
  acquiredAt: string | null
  isStaked: boolean
  challenges: Array<{
    id: string
    challenger: {
      id: string
      username: string
      avatarUrl: string | null
      eloRating: number
    }
    status: string
    entryFee: number
    coinReward: number
    expiresAt: string
    createdAt: string
    debateTopic: string | null
    debateDescription: string | null
    debateCategory: string | null
    debateChallengerPosition: string | null
    debateTotalRounds: number | null
    debateRoundDuration: number | null
    debateSpeedMode: boolean | null
    debateAllowCopyPaste: boolean | null
  }>
}

export default function BeltDetailsPage() {
  const params = useParams()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [belt, setBelt] = useState<BeltDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false)
  const [tournaments, setTournaments] = useState<Array<{ id: string; name: string; status: string }>>([])
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(false)
  const [isStaking, setIsStaking] = useState<string | null>(null)

  // Define formatBeltStatus at the top to ensure it's always available
  const formatBeltStatus = (status: string) => {
    return status.replace(/_/g, ' ')
  }

  useEffect(() => {
    if (params.id) {
      fetchBeltDetails()
    }
  }, [params.id])

  const fetchTournaments = async () => {
    try {
      setIsLoadingTournaments(true)
      const response = await fetch('/api/tournaments?status=IN_PROGRESS&limit=20')
      if (response.ok) {
        const data = await response.json()
        setTournaments(data.tournaments || [])
      }
    } catch (error) {
      console.error('Failed to fetch tournaments:', error)
    } finally {
      setIsLoadingTournaments(false)
    }
  }

  // Fetch tournaments for staking - must be before early returns to maintain hook order
  useEffect(() => {
    const isHolder = user && belt?.currentHolderId === user.id
    const canStake = isHolder && belt && (belt.status === 'ACTIVE' || belt.status === 'MANDATORY') && !belt.isStaked
    
    if (canStake) {
      fetchTournaments()
    }
  }, [user, belt])

  const fetchBeltDetails = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/belts/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setBelt(data.belt)
      } else {
        const error = await response.json()
        showToast({
          type: 'error',
          title: 'Error',
          description: error.error || 'Failed to load belt details',
        })
      }
    } catch (error) {
      console.error('Failed to fetch belt details:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load belt details',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateChallenge = async () => {
    if (!user || !belt) return

    if (belt.currentHolderId === user.id) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'You cannot challenge your own belt',
      })
      return
    }

    try {
      setIsCreatingChallenge(true)
      const response = await fetch('/api/belts/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beltId: belt.id,
        }),
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Challenge Created',
          description: 'Your challenge has been sent!',
        })
        fetchBeltDetails()
      } else {
        const error = await response.json()
        showToast({
          type: 'error',
          title: 'Error',
          description: error.error || 'Failed to create challenge',
        })
      }
    } catch (error) {
      console.error('Failed to create challenge:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to create challenge',
      })
    } finally {
      setIsCreatingChallenge(false)
    }
  }

  const handleAcceptChallenge = async (challengeId: string) => {
    try {
      const response = await fetch(`/api/belts/challenge/${challengeId}/accept`, {
        method: 'POST',
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Challenge Accepted',
          description: 'The debate will be created shortly',
        })
        fetchBeltDetails()
      } else {
        const error = await response.json()
        showToast({
          type: 'error',
          title: 'Error',
          description: error.error || 'Failed to accept challenge',
        })
      }
    } catch (error) {
      console.error('Failed to accept challenge:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to accept challenge',
      })
    }
  }

  const handleDeclineChallenge = async (challengeId: string) => {
    try {
      const response = await fetch(`/api/belts/challenge/${challengeId}/decline`, {
        method: 'POST',
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Challenge Declined',
          description: 'The challenge has been declined',
        })
        fetchBeltDetails()
      } else {
        const error = await response.json()
        showToast({
          type: 'error',
          title: 'Error',
          description: error.error || 'Failed to decline challenge',
        })
      }
    } catch (error) {
      console.error('Failed to decline challenge:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to decline challenge',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="THE ARENA" />
        <div className="flex justify-center items-center min-h-screen pt-20">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (!belt) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="THE ARENA" />
        <div className="container mx-auto px-4 py-8 text-center pt-20">
          <p className="text-text-secondary mb-4">Belt not found</p>
          <Link href="/belts/room">
            <Button>Back to Belt Room</Button>
          </Link>
        </div>
      </div>
    )
  }

  const canChallenge =
    user &&
    belt.currentHolderId &&
    belt.currentHolderId !== user.id &&
    (belt.status === 'ACTIVE' || belt.status === 'MANDATORY') &&
    !belt.isStaked

  const canChallengeInactive =
    user &&
    belt.status === 'INACTIVE' &&
    belt.currentHolderId &&
    belt.currentHolderId !== user.id

  const isHolder = user && belt.currentHolderId === user.id
  const canStake = isHolder && (belt.status === 'ACTIVE' || belt.status === 'MANDATORY') && !belt.isStaked

  const handleStakeBelt = async (tournamentId: string) => {
    if (!belt) return

    try {
      setIsStaking(tournamentId)
      const response = await fetch(`/api/belts/${belt.id}/stake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId }),
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Belt Staked',
          description: 'Your belt has been staked in the tournament',
        })
        fetchBeltDetails()
      } else {
        const error = await response.json()
        showToast({
          type: 'error',
          title: 'Error',
          description: error.error || 'Failed to stake belt',
        })
      }
    } catch (error) {
      console.error('Failed to stake belt:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to stake belt',
      })
    } finally {
      setIsStaking(null)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="THE ARENA" />
      <div className="container mx-auto px-4 py-8 max-w-4xl pt-20">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{belt.name}</h1>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-500 text-white" style={{ color: '#ffffff' }}>{belt.type}</Badge>
          <Badge className="bg-green-500 text-white" style={{ color: '#ffffff' }}>{formatBeltStatus(belt.status)}</Badge>
          {belt.category && (
            <span 
              className="inline-flex items-center font-bold rounded-full transition-colors px-3 py-1 text-xs bg-gray-600 text-white" 
              style={{ color: '#ffffff' }}
            >
              {belt.category}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Current Holder</h2>
          </CardHeader>
          <CardBody>
            {belt.currentHolder ? (
              <div>
                <Link
                  href={`/profile/${belt.currentHolder.username}`}
                  className="text-primary hover:underline font-medium text-lg"
                >
                  {belt.currentHolder.username}
                </Link>
                <p className="text-text-secondary mt-2">
                  ELO: {belt.currentHolder.eloRating}
                </p>
              </div>
            ) : (
              <p className="text-text-secondary">Vacant</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Statistics</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              <p>
                <span className="text-text-secondary">Defenses: </span>
                <span className="text-white">
                  {belt.successfulDefenses} / {belt.timesDefended}
                </span>
              </p>
              <p>
                <span className="text-text-secondary">Coin Value: </span>
                <span className="text-white">{belt.coinValue}</span>
              </p>
              <p>
                <span className="text-text-secondary">Last Defended: </span>
                <span className="text-white">
                  {belt.lastDefendedAt
                    ? new Date(belt.lastDefendedAt).toLocaleDateString()
                    : 'Never'}
                </span>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Challenge Actions */}
      {canChallenge && (
        <Card className="mb-6">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Challenge for this Belt
                </h3>
                <p className="text-text-secondary">
                  Create a challenge to compete for this belt. Entry fee will be calculated
                  based on belt value.
                </p>
              </div>
              <Button onClick={handleCreateChallenge} disabled={isCreatingChallenge}>
                {isCreatingChallenge ? 'Creating...' : 'Create Challenge'}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Pending Challenges (for holder) */}
      {isHolder && belt.challenges && Array.isArray(belt.challenges) && belt.challenges.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-xl font-bold text-white">
              Pending Challenges ({belt.challenges.length})
            </h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {belt.challenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="bg-bg-tertiary p-4 rounded-lg border border-border"
                >
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-white font-medium">
                          Challenger:{' '}
                          <Link
                            href={`/profile/${challenge.challenger.username}`}
                            className="text-primary hover:underline"
                          >
                            {challenge.challenger.username}
                          </Link>
                        </p>
                        <p className="text-text-secondary text-sm">
                          ELO: {challenge.challenger.eloRating} | Entry Fee: {challenge.entryFee}{' '}
                          coins | Reward: {challenge.coinReward} coins
                        </p>
                        <p className="text-text-secondary text-sm">
                          Expires: {new Date(challenge.expiresAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    {/* Debate Details */}
                    {challenge.debateTopic && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <h4 className="text-white font-semibold mb-2">Debate Details</h4>
                        <p className="text-white mb-2">
                          <span className="font-medium">Topic:</span> {challenge.debateTopic}
                        </p>
                        {challenge.debateDescription && (
                          <p className="text-text-secondary text-sm mb-2">
                            {challenge.debateDescription}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 text-sm">
                          {challenge.debateCategory && (
                            <span className="text-text-secondary">
                              <span className="font-medium">Category:</span> {challenge.debateCategory}
                            </span>
                          )}
                          {challenge.debateChallengerPosition && (
                            <span className="text-text-secondary">
                              <span className="font-medium">Challenger Position:</span>{' '}
                              {challenge.debateChallengerPosition}
                            </span>
                          )}
                          {challenge.debateTotalRounds && (
                            <span className="text-text-secondary">
                              <span className="font-medium">Rounds:</span> {challenge.debateTotalRounds}
                            </span>
                          )}
                          {challenge.debateSpeedMode && (
                            <span className="text-text-secondary">
                              <span className="font-medium">Speed Mode:</span> Yes
                            </span>
                          )}
                          {challenge.debateRoundDuration && (
                            <span className="text-text-secondary">
                              <span className="font-medium">Round Duration:</span>{' '}
                              {challenge.debateRoundDuration === 300000
                                ? '5 minutes'
                                : challenge.debateRoundDuration === 86400000
                                ? '24 hours'
                                : `${Math.round(challenge.debateRoundDuration / 60000)} minutes`}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAcceptChallenge(challenge.id)}
                      variant="primary"
                      size="sm"
                    >
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleDeclineChallenge(challenge.id)}
                      variant="secondary"
                      size="sm"
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Inactive Belt Challenge */}
      {canChallengeInactive && (
        <Card className="mb-6 border-yellow-500/50">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Challenge Inactive Belt
                </h3>
                <p className="text-text-secondary">
                  This belt is inactive. You can challenge for it now!
                </p>
              </div>
              <Button onClick={handleCreateChallenge} disabled={isCreatingChallenge}>
                {isCreatingChallenge ? 'Creating...' : 'Challenge for Belt'}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tournament Staking (for belt holder) */}
      {canStake && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Stake Belt in Tournament</h2>
          </CardHeader>
          <CardBody>
            {isLoadingTournaments ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner />
              </div>
            ) : tournaments.length === 0 ? (
              <p className="text-text-secondary">
                No active tournaments available. Create or join a tournament to stake your belt.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-text-secondary mb-4">
                  Stake this belt in a tournament. If you win, you keep it. If you lose, the winner gets it.
                </p>
                {tournaments.map((tournament) => (
                  <div
                    key={tournament.id}
                    className="bg-bg-tertiary p-4 rounded-lg border border-border flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white font-medium">{tournament.name}</p>
                      <p className="text-text-secondary text-sm">Status: {tournament.status}</p>
                    </div>
                    <Button
                      onClick={() => handleStakeBelt(tournament.id)}
                      variant="primary"
                      size="sm"
                      isLoading={isStaking === tournament.id}
                    >
                      Stake Belt
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {belt.tournament && (
        <Card>
          <CardBody>
            <p className="text-text-secondary">
              Tournament:{' '}
              <Link
                href={`/tournaments/${belt.tournament.id}`}
                className="text-primary hover:underline"
              >
                {belt.tournament.name}
              </Link>
            </p>
          </CardBody>
        </Card>
      )}
      </div>
    </div>
  )
}
