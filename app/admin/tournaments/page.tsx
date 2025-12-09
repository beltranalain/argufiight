'use client'

import { useState, useEffect } from 'react'
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

export default function TournamentsPage() {
  const { showToast } = useToast()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFeatureEnabled, setIsFeatureEnabled] = useState(false)
  const [freeTournamentLimit, setFreeTournamentLimit] = useState('1')
  const [isSavingLimit, setIsSavingLimit] = useState(false)

  useEffect(() => {
    fetchFeatureStatus()
    fetchTournaments()
  }, [])

  const fetchFeatureStatus = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setIsFeatureEnabled(data.TOURNAMENTS_ENABLED === 'true')
        setFreeTournamentLimit(data.FREE_TOURNAMENT_LIMIT || '1')
      }
    } catch (error) {
      console.error('Failed to fetch feature status:', error)
    }
  }

  const fetchTournaments = async () => {
    try {
      setIsLoading(true)
      console.log('[Admin Tournaments] Fetching tournaments...')
      const response = await fetch('/api/admin/tournaments')
      console.log('[Admin Tournaments] Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('[Admin Tournaments] Response data:', data)
        console.log('[Admin Tournaments] Is array?', Array.isArray(data))
        console.log('[Admin Tournaments] Data length:', Array.isArray(data) ? data.length : 'not an array')
        
        const tournamentsList = Array.isArray(data) ? data : (data?.tournaments || [])
        console.log('[Admin Tournaments] Setting tournaments:', tournamentsList.length)
        setTournaments(tournamentsList)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('[Admin Tournaments] API error:', response.status, errorData)
        showToast({
          type: 'error',
          title: 'Error',
          description: errorData.error || `Failed to load tournaments (${response.status})`,
        })
      }
    } catch (error) {
      console.error('[Admin Tournaments] Failed to fetch tournaments:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load tournaments',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFeature = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          TOURNAMENTS_ENABLED: (!isFeatureEnabled).toString(),
        }),
      })

      if (response.ok) {
        setIsFeatureEnabled(!isFeatureEnabled)
        showToast({
          type: 'success',
          title: 'Feature Updated',
          description: `Tournaments ${!isFeatureEnabled ? 'enabled' : 'disabled'}`,
        })
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to update feature status',
      })
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
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
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
              onClick={toggleFeature}
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
                      onClick={async () => {
                        setIsSavingLimit(true)
                        try {
                          const response = await fetch('/api/admin/settings', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              FREE_TOURNAMENT_LIMIT: freeTournamentLimit,
                            }),
                          })
                          if (response.ok) {
                            showToast({
                              type: 'success',
                              title: 'Limit Updated',
                              description: `Free tournament limit set to ${freeTournamentLimit} per month`,
                            })
                          } else {
                            throw new Error('Failed to save')
                          }
                        } catch (error) {
                          showToast({
                            type: 'error',
                            title: 'Error',
                            description: 'Failed to update free tournament limit',
                          })
                        } finally {
                          setIsSavingLimit(false)
                        }
                      }}
                      variant="secondary"
                      size="sm"
                      disabled={isSavingLimit}
                    >
                      {isSavingLimit ? 'Saving...' : 'Save'}
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
            <Button onClick={fetchTournaments} variant="secondary" size="sm">
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



