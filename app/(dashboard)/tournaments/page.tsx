'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import { useTournaments } from '@/lib/hooks/queries/useTournaments'
import { useUsage } from '@/lib/hooks/queries/useSubscription'
import { fetchClient } from '@/lib/api/fetchClient'
import { formatStatus } from '@/lib/utils/format-status'
import Link from 'next/link'

const FILTER_OPTIONS = ['ALL', 'UPCOMING', 'REGISTRATION_OPEN', 'IN_PROGRESS', 'COMPLETED'] as const

export default function TournamentsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState('ALL')
  const [deleteConfirm, setDeleteConfirm] = useState<{ tournamentId: string; tournamentName: string } | null>(null)

  const { data: tournaments = [], isLoading, isError, refetch } = useTournaments(filter)
  const { data: usageData } = useUsage()

  const tournamentUsage = usageData?.usage?.tournaments
  const limit = usageData?.limits?.TOURNAMENTS ?? 1
  const currentUsage = tournamentUsage?.current ?? 0
  const canCreate = limit === -1 || currentUsage < limit

  const deleteMutation = useMutation({
    mutationFn: (tournamentId: string) =>
      fetchClient(`/api/tournaments/${tournamentId}`, { method: 'DELETE' }),
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Tournament Deleted',
        description: `"${deleteConfirm?.tournamentName}" has been deleted`,
      })
      setDeleteConfirm(null)
      queryClient.invalidateQueries({ queryKey: ['tournaments'] })
    },
    onError: (error: any) => {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        description: error.message || 'Failed to delete tournament',
      })
    },
  })

  const handleCreateClick = () => {
    if (!user) {
      router.push('/login')
      return
    }
    if (!canCreate) {
      showToast({
        type: 'warning',
        title: 'Tournament Limit Reached',
        description: `You've used your ${limit} tournament${limit === 1 ? '' : 's'} this month. Upgrade to Pro for unlimited tournaments!`,
      })
      return
    }
    router.push('/tournaments/create')
  }

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
          {user && usageData && (
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
          <div className="flex gap-2 flex-wrap mb-6">
            {FILTER_OPTIONS.map((status) => (
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

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : isError ? (
            <ErrorDisplay title="Failed to load tournaments" onRetry={() => refetch()} />
          ) : tournaments.length === 0 ? (
            <Card>
              <CardBody>
                <EmptyState
                  title="No Tournaments Found"
                  description={
                    filter === 'ALL'
                      ? 'Be the first to create a tournament!'
                      : `No tournaments with status "${formatStatus(filter)}" found`
                  }
                  action={user ? { label: 'Create Tournament', onClick: handleCreateClick } : undefined}
                />
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map((tournament) => (
                <Card key={tournament.id} className="hover:border-electric-blue transition-all">
                  <CardHeader>
                    <h3 className="text-xl font-bold text-text-primary mb-2 line-clamp-2">
                      {tournament.name}
                    </h3>
                    {tournament.description && (
                      <p className="text-text-secondary text-sm line-clamp-2">{tournament.description}</p>
                    )}
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Status</span>
                        <span className="text-text-primary font-semibold">{formatStatus(tournament.status)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Privacy</span>
                        <span className="text-text-primary font-semibold">{tournament.isPrivate ? 'Private' : 'Public'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Participants</span>
                        <span className="text-text-primary font-semibold">{tournament.participantCount} / {tournament.maxParticipants}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">Rounds</span>
                        <span className="text-text-primary font-semibold">{tournament.currentRound} / {tournament.totalRounds}</span>
                      </div>
                      {tournament.format && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-secondary">Format</span>
                          <span className="text-text-primary font-semibold">
                            {tournament.format === 'CHAMPIONSHIP' ? 'Championship' : tournament.format === 'KING_OF_THE_HILL' ? 'KOH' : 'Bracket'}
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
                        <span className="text-text-primary font-semibold">@{tournament.creator.username}</span>
                      </div>
                      {tournament.status === 'COMPLETED' && tournament.winner ? (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-secondary">Winner</span>
                          <div className="flex items-center gap-2">
                            {tournament.winner.avatarUrl && (
                              <img src={tournament.winner.avatarUrl} alt={tournament.winner.username} className="w-5 h-5 rounded-full" />
                            )}
                            <span className="text-cyber-green font-semibold">@{tournament.winner.username}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-secondary">Starts</span>
                          <span className="text-text-primary font-semibold">{new Date(tournament.startDate).toLocaleDateString()}</span>
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
            Are you sure you want to delete <strong className="text-text-primary">&quot;{deleteConfirm?.tournamentName}&quot;</strong>?
          </p>
          <p className="text-sm text-neon-orange">
            This action cannot be undone. All tournament data will be permanently deleted.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.tournamentId)}
              isLoading={deleteMutation.isPending}
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
