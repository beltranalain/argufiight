'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/fetchClient'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Badge } from '@/components/ui/Badge'
import { formatStatus } from '@/lib/utils/format-status'

interface Tournament {
  id: string
  name: string
  description: string | null
  status: string
  maxParticipants: number
  currentRound: number
  totalRounds: number
  participantCount: number
  createdAt: string
  creator: {
    username: string
    email: string
  }
}

interface AdminSettings {
  TOURNAMENTS_ENABLED?: string
  FREE_TOURNAMENT_LIMIT?: string
  [key: string]: string | undefined
}

export default function TournamentsPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [freeTournamentLimit, setFreeTournamentLimit] = useState('1')

  // Fetch admin settings (feature status + limit)
  const {
    data: settings,
    isLoading: isLoadingSettings,
  } = useQuery<AdminSettings>({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const data = await fetchClient<AdminSettings>('/api/admin/settings')
      // Sync local state for the editable input
      if (data.FREE_TOURNAMENT_LIMIT) {
        setFreeTournamentLimit(data.FREE_TOURNAMENT_LIMIT)
      }
      return data
    },
    staleTime: 60_000,
  })

  const isFeatureEnabled = settings?.TOURNAMENTS_ENABLED === 'true'

  // Fetch tournaments
  const {
    data: tournaments = [],
    isLoading: isLoadingTournaments,
    isError,
    refetch: refetchTournaments,
  } = useQuery<Tournament[]>({
    queryKey: ['admin-tournaments'],
    queryFn: async () => {
      const data = await fetchClient<Tournament[] | { tournaments: Tournament[] }>('/api/admin/tournaments')
      return Array.isArray(data) ? data : (data?.tournaments || [])
    },
    staleTime: 60_000,
  })

  const isLoading = isLoadingSettings || isLoadingTournaments

  // Toggle feature mutation
  const toggleFeatureMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      fetchClient('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({ TOURNAMENTS_ENABLED: enabled.toString() }),
      }),
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Feature Updated',
        description: `Tournaments ${!isFeatureEnabled ? 'enabled' : 'disabled'}`,
      })
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to update feature status',
      })
    },
  })

  // Save free tournament limit mutation
  const saveLimitMutation = useMutation({
    mutationFn: (limit: string) =>
      fetchClient('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({ FREE_TOURNAMENT_LIMIT: limit }),
      }),
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Limit Updated',
        description: `Free tournament limit set to ${freeTournamentLimit} per month`,
      })
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to update free tournament limit',
      })
    },
  })

  // Delete tournament mutation
  const deleteMutation = useMutation({
    mutationFn: (tournamentId: string) =>
      fetchClient(`/api/admin/tournaments/${tournamentId}`, { method: 'DELETE' }),
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Deleted',
        description: 'Tournament deleted successfully',
      })
      queryClient.invalidateQueries({ queryKey: ['admin-tournaments'] })
    },
    onError: (error: any) => {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        description: error.message || 'Failed to delete tournament',
      })
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-blue-500 text-white'
      case 'REGISTRATION_OPEN':
        return 'bg-green-500 text-white'
      case 'IN_PROGRESS':
        return 'bg-yellow-500 text-black font-semibold'
      case 'COMPLETED':
        return 'bg-cyber-green text-black font-semibold'
      case 'CANCELLED':
        return 'bg-red-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const handleDelete = (tournamentId: string, tournamentName: string) => {
    if (!confirm(`Are you sure you want to delete "${tournamentName}"? This action cannot be undone and will delete all associated data (matches, rounds, participants, etc.).`)) {
      return
    }
    deleteMutation.mutate(tournamentId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorDisplay
        title="Failed to load tournaments"
        message="Something went wrong while loading tournaments. Please try again."
        onRetry={() => refetchTournaments()}
      />
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Tournaments</h1>
          <p className="text-text-primary">Manage tournament feature and view all tournaments</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-white font-medium">Tournaments Feature:</span>
            <button
              onClick={() => toggleFeatureMutation.mutate(!isFeatureEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isFeatureEnabled ? 'bg-electric-blue' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isFeatureEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isFeatureEnabled ? 'text-electric-blue' : 'text-text-primary'}`}>
              {isFeatureEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>

      {/* Feature Status Card */}
      <Card className="mb-8">
        <CardHeader>
          <h2 className="text-xl font-bold text-white">Feature Status</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Tournaments Feature</p>
                <p className="text-text-primary text-sm">
                  {isFeatureEnabled
                    ? 'Users can create and participate in tournaments'
                    : 'Tournament feature is currently disabled for all users'}
                </p>
              </div>
              <Badge
                variant="default"
                className={isFeatureEnabled ? 'bg-cyber-green text-black' : 'bg-gray-600 text-white'}
              >
                {isFeatureEnabled ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            {isFeatureEnabled && (
              <div className="pt-4 border-t border-bg-tertiary">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-white font-medium mb-1">Free Tournament Limit</p>
                    <p className="text-text-primary text-sm">
                      Number of tournaments free users can create per month
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={freeTournamentLimit}
                      onChange={(e) => setFreeTournamentLimit(e.target.value)}
                      className="w-20 px-3 py-2 bg-bg-secondary border border-bg-tertiary rounded text-white focus:outline-none focus:border-electric-blue"
                    />
                    <Button
                      onClick={() => saveLimitMutation.mutate(freeTournamentLimit)}
                      variant="secondary"
                      size="sm"
                      disabled={saveLimitMutation.isPending}
                    >
                      {saveLimitMutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Tournaments List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">All Tournaments</h2>
            <Button onClick={() => refetchTournaments()} variant="secondary" size="sm">
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {tournaments.length === 0 ? (
            <div className="text-center py-12 text-text-primary">
              <p className="text-lg mb-2">No tournaments yet</p>
              <p className="text-sm">
                {isFeatureEnabled
                  ? 'Tournaments will appear here once users start creating them'
                  : 'Enable the tournaments feature to allow users to create tournaments'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className="p-6 bg-bg-tertiary rounded-lg border border-bg-tertiary hover:border-electric-blue transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-white">{tournament.name}</h3>
                        <Badge variant="default" className={getStatusColor(tournament.status)}>
                          {formatStatus(tournament.status)}
                        </Badge>
                      </div>
                      {tournament.description && (
                        <p className="text-text-primary mb-4">{tournament.description}</p>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-text-primary">Participants</p>
                          <p className="text-white font-semibold">
                            {tournament.participantCount} / {tournament.maxParticipants}
                          </p>
                        </div>
                        <div>
                          <p className="text-text-primary">Round</p>
                          <p className="text-white font-semibold">
                            {tournament.currentRound} / {tournament.totalRounds}
                          </p>
                        </div>
                        <div>
                          <p className="text-text-primary">Creator</p>
                          <p className="text-white font-semibold">{tournament.creator.username}</p>
                        </div>
                        <div>
                          <p className="text-text-primary">Created</p>
                          <p className="text-white font-semibold">
                            {new Date(tournament.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="secondary"
                        onClick={() => handleDelete(tournament.id, tournament.name)}
                        className="text-sm px-3 py-1.5 text-red-400 hover:text-red-300 border-red-400/30 hover:border-red-400/50"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
