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
import { Modal } from '@/components/ui/Modal'
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
  participantCount: number
  startDate: string
  minElo: number | null
  format?: string // 'BRACKET', 'CHAMPIONSHIP', or 'KING_OF_THE_HILL'
  creator: {
    id: string
    username: string
    avatarUrl: string | null
  }
  isParticipant: boolean
  isPrivate: boolean
  createdAt: string
  winner: {
    id: string
    username: string
    avatarUrl: string | null
  } | null
}

export default function TournamentsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')
  const [canCreate, setCanCreate] = useState<{ allowed: boolean; currentUsage?: number; limit?: number } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ tournamentId: string; tournamentName: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchTournaments()
    checkCanCreate()
  }, [filter, user])

  // Refresh tournaments when page becomes visible (e.g., after creating a tournament)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchTournaments()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [filter])

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
        console.log('Fetched tournaments:', data) // Debug log
        setTournaments(data.tournaments || [])
        
        // Show message if no tournaments found
        if (!data.tournaments || data.tournaments.length === 0) {
          console.log('No tournaments found in response')
        }
      } else if (response.status === 403) {
        const error = await response.json()
        if (error.error === 'Tournaments feature is disabled') {
          showToast({
            type: 'error',
            title: 'Feature Disabled',
            description: 'Tournaments are currently disabled',
          })
        }
      } else if (response.status === 401) {
        showToast({
          type: 'error',
          title: 'Authentication Error',
          description: 'Please log in to view tournaments',
        })
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to fetch tournaments:', error)
        showToast({
          type: 'error',
          title: 'Error',
          description: error.error || 'Failed to load tournaments',
        })
      }
    } catch (error) {
      console.error('Failed to fetch tournaments:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load tournaments. Please try again.',
      })
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
        const tournamentUsage = data.usageArray
          ? data.usageArray.find((u: any) => u.featureType === 'tournaments')
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


  const handleCreateClick = () => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!canCreate?.allowed) {
      // Show message but don't redirect - let user click the button
      const limit = canCreate?.limit || 1
      showToast({
        type: 'warning',
        title: 'Tournament Limit Reached',
        description: `You've used your ${limit} tournament${limit === 1 ? '' : 's'} this month. Upgrade to Pro for unlimited tournaments!`,
      })
      return
    }

    router.push('/tournaments/create')
  }

  // Refresh tournaments list (can be called from other components)
  const refreshTournaments = () => {
    fetchTournaments()
  }

  const handleDeleteTournament = async () => {
    if (!deleteConfirm) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/tournaments/${deleteConfirm.tournamentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Tournament Deleted',
          description: `"${deleteConfirm.tournamentName}" has been deleted`,
        })
        setDeleteConfirm(null)
        fetchTournaments() // Refresh the list
      } else {
        const error = await response.json()
        showToast({
          type: 'error',
          title: 'Delete Failed',
          description: error.error || 'Failed to delete tournament',
        })
      }
    } catch (error: any) {
      console.error('Failed to delete tournament:', error)
      showToast({
        type: 'error',
        title: 'Delete Failed',
        description: 'An error occurred while deleting the tournament',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Expose refresh function to window for debugging and auto-refresh on focus
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).refreshTournaments = refreshTournaments
      
      // Refresh when window regains focus (e.g., user navigates back)
      const handleFocus = () => {
        fetchTournaments()
      }
      
      window.addEventListener('focus', handleFocus)
      return () => {
        window.removeEventListener('focus', handleFocus)
      }
    }
  }, [filter])

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

          {/* Filters and Refresh */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex gap-2 flex-wrap">
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
                  {formatStatus(status)}
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshTournaments}
              className="text-text-secondary hover:text-text-primary"
              title="Refresh tournaments list"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
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
                        <span className="text-text-secondary">Status</span>
                        <span className="text-text-primary font-semibold">
                          {formatStatus(tournament.status)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Privacy</span>
                        <span className="text-text-primary font-semibold">
                          {tournament.isPrivate ? 'Private' : 'Public'}
                        </span>
                      </div>
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
                      {tournament.format && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-secondary">Format</span>
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
                      {tournament.status === 'COMPLETED' && tournament.winner ? (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-secondary">Winner</span>
                          <div className="flex items-center gap-2">
                            {tournament.winner.avatarUrl && (
                              <img
                                src={tournament.winner.avatarUrl}
                                alt={tournament.winner.username}
                                className="w-5 h-5 rounded-full"
                              />
                            )}
                            <span className="text-cyber-green font-semibold">
                              @{tournament.winner.username}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-secondary">Starts</span>
                          <span className="text-text-primary font-semibold">
                            {new Date(tournament.startDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/tournaments/${tournament.id}`} className="flex-1">
                        <Button variant="primary" className="w-full" size="sm">
                          {tournament.isParticipant ? 'View' : 'View Details'}
                        </Button>
                      </Link>
                      {user && user.id === tournament.creator.id && tournament.status === 'UPCOMING' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setDeleteConfirm({ tournamentId: tournament.id, tournamentName: tournament.name })}
                          className="text-neon-orange hover:text-neon-orange hover:bg-neon-orange/10 border-neon-orange/30"
                          title="Delete tournament"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Tournament"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to delete <strong className="text-text-primary">"{deleteConfirm?.tournamentName}"</strong>?
          </p>
          <p className="text-sm text-neon-orange">
            This action cannot be undone. All tournament data will be permanently deleted.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => setDeleteConfirm(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteTournament}
              isLoading={isDeleting}
              className="bg-neon-orange hover:bg-neon-orange/90 text-black"
            >
              Delete Tournament
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

