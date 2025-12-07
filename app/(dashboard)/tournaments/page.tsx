'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
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
  participantCount: number
  startDate: string
  minElo: number | null
  creator: {
    id: string
    username: string
    avatarUrl: string | null
  }
  isParticipant: boolean
  createdAt: string
}

export default function TournamentsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')
  const [canCreate, setCanCreate] = useState<{ allowed: boolean; currentUsage?: number; limit?: number } | null>(null)

  useEffect(() => {
    fetchTournaments()
    checkCanCreate()
  }, [filter, user])

  const fetchTournaments = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'ALL') {
        params.append('status', filter)
      }

      const response = await fetch(`/api/tournaments?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTournaments(data.tournaments || [])
      } else if (response.status === 403) {
        const error = await response.json()
        if (error.error === 'Tournaments feature is disabled') {
          showToast({
            type: 'error',
            title: 'Feature Disabled',
            description: 'Tournaments are currently disabled',
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch tournaments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkCanCreate = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/subscriptions/usage')
      if (response.ok) {
        const data = await response.json()
        // Check both formats: array and object
        const tournamentUsage = Array.isArray(data.usage)
          ? data.usage.find((u: any) => u.featureType === 'tournaments')
          : data.usage?.tournaments
        const limit = data.limits?.TOURNAMENTS || 1
        const currentUsage = tournamentUsage?.count || tournamentUsage?.current || 0

        setCanCreate({
          allowed: limit === -1 || currentUsage < limit,
          currentUsage,
          limit,
        })
      }
    } catch (error) {
      console.error('Failed to check create limit:', error)
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

  const handleCreateClick = () => {
    if (!user) {
      router.push('/auth/signin')
      return
    }

    if (!canCreate?.allowed) {
      // Redirect to upgrade page
      const limit = canCreate?.limit || 1
      router.push('/upgrade')
      showToast({
        type: 'warning',
        title: 'Upgrade Required',
        description: `You've used your ${limit} tournament${limit === 1 ? '' : 's'} this month. Upgrade to Pro for unlimited tournaments!`,
      })
      return
    }

    router.push('/tournaments/create')
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

  // Extract values with defaults for safe access
  const limit = canCreate?.limit ?? 1
  const currentUsage = canCreate?.currentUsage ?? 0

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="TOURNAMENTS" />
      
      <div className="pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-text-primary mb-2">Tournaments</h1>
              <p className="text-text-secondary">Compete in structured debate competitions</p>
            </div>
            <Button onClick={handleCreateClick} variant="primary">
              Create Tournament
            </Button>
          </div>

          {/* Usage Info */}
          {user && canCreate && (
            <Card className="mb-6">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-text-primary font-medium">Your Tournament Usage</p>
                    <p className="text-text-secondary text-sm">
                      {limit === -1
                        ? 'Unlimited tournaments (Pro member)'
                        : `${currentUsage} / ${limit} tournament${limit === 1 ? '' : 's'} this month`}
                    </p>
                  </div>
                  {limit !== -1 && currentUsage >= limit && (
                    <Button onClick={() => router.push('/upgrade')} variant="primary" size="sm">
                      Upgrade to Pro
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Filters */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {['ALL', 'UPCOMING', 'REGISTRATION_OPEN', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                  filter === status
                    ? 'border-electric-blue bg-electric-blue/10 text-electric-blue'
                    : 'border-bg-tertiary text-text-secondary hover:border-text-secondary'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Tournaments List */}
          {tournaments.length === 0 ? (
            <Card>
              <CardBody>
                <EmptyState
                  icon={
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  }
                  title="No Tournaments Found"
                  description={
                    filter === 'ALL'
                      ? 'Be the first to create a tournament!'
                      : `No tournaments with status "${filter}" found`
                  }
                  action={
                    user
                      ? {
                          label: 'Create Tournament',
                          onClick: handleCreateClick,
                        }
                      : undefined
                  }
                />
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map((tournament) => (
                <Card key={tournament.id} className="hover:border-electric-blue transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-text-primary mb-2 line-clamp-2">
                          {tournament.name}
                        </h3>
                        <Badge variant="default" className={getStatusColor(tournament.status)}>
                          {tournament.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    {tournament.description && (
                      <p className="text-text-secondary text-sm line-clamp-2 mb-3">
                        {tournament.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Participants</span>
                        <span className="text-text-primary font-semibold">
                          {tournament.participantCount} / {tournament.maxParticipants}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Rounds</span>
                        <span className="text-text-primary font-semibold">
                          {tournament.currentRound} / {tournament.totalRounds}
                        </span>
                      </div>
                      {tournament.minElo && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-secondary">Min ELO</span>
                          <span className="text-text-primary font-semibold">{tournament.minElo}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Creator</span>
                        <span className="text-text-primary font-semibold">
                          @{tournament.creator.username}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Starts</span>
                        <span className="text-text-primary font-semibold">
                          {new Date(tournament.startDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/tournaments/${tournament.id}`} className="flex-1">
                        <Button variant="primary" className="w-full" size="sm">
                          {tournament.isParticipant ? 'View' : 'View Details'}
                        </Button>
                      </Link>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

