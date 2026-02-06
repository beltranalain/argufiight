'use client'

import { useState, useEffect, memo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/lib/hooks/useAuth'

interface Tournament {
  id: string
  name: string
  status: string
  participantCount: number
  maxParticipants: number
  currentRound: number
  totalRounds: number
  isParticipant: boolean
}

export const TournamentsPanel = memo(function TournamentsPanel({ initialData }: { initialData?: any }) {
  const { user } = useAuth()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFeatureEnabled, setIsFeatureEnabled] = useState(false)

  // Use initial data from consolidated endpoint when available
  useEffect(() => {
    if (initialData?.tournaments !== undefined) {
      const activeTournaments = (initialData.tournaments || []).filter(
        (t: Tournament) =>
          t.status === 'UPCOMING' ||
          t.status === 'REGISTRATION_OPEN' ||
          t.status === 'IN_PROGRESS'
      )
      setTournaments(activeTournaments.slice(0, 3))
      setIsFeatureEnabled(true)
      setIsLoading(false)
    }
  }, [initialData])

  // Fallback: fetch independently when no initial data
  useEffect(() => {
    if (initialData) return
    if (user) {
      checkFeatureStatus().then(() => {
        if (isFeatureEnabled) {
          fetchTournaments()
        } else {
          setIsLoading(false)
        }
      })
    } else {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (isFeatureEnabled && user && !initialData) {
      fetchTournaments()
    }
  }, [isFeatureEnabled])

  // Refresh tournaments when page becomes visible (only when self-fetching)
  useEffect(() => {
    if (initialData) return // Parent handles refresh
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isFeatureEnabled && user) {
        fetchTournaments()
      }
    }

    const handleFocus = () => {
      if (isFeatureEnabled && user) {
        fetchTournaments()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [isFeatureEnabled, user])

  const checkFeatureStatus = async () => {
    try {
      // Try to fetch tournaments - if feature is disabled, API will return 403
      const response = await fetch('/api/tournaments?limit=1')
      if (response.ok || response.status === 200) {
        setIsFeatureEnabled(true)
      } else if (response.status === 403) {
        setIsFeatureEnabled(false)
      }
    } catch (error) {
      // Silently fail
      setIsFeatureEnabled(false)
    }
  }

  const fetchTournaments = async () => {
    if (!isFeatureEnabled) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/tournaments?limit=3')

      if (response.ok) {
        const data = await response.json()

        const activeTournaments = (data.tournaments || []).filter(
          (t: Tournament) =>
            t.status === 'UPCOMING' ||
            t.status === 'REGISTRATION_OPEN' ||
            t.status === 'IN_PROGRESS'
        )

        setTournaments(activeTournaments.slice(0, 3))
      } else if (response.status === 403) {
        setIsFeatureEnabled(false)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('[TournamentsPanel] API error:', response.status, errorData)
      }
    } catch (error) {
      console.error('[TournamentsPanel] Failed to fetch tournaments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isFeatureEnabled) {
    return null // Don't show panel if feature is disabled
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-2 border-electric-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-text-primary">Tournaments</h2>
        <Link href="/tournaments">
          <Button variant="secondary" size="sm">View All</Button>
        </Link>
      </div>

      {tournaments.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
          title="No Active Tournaments"
          description="Check back soon for new tournaments"
          action={{
            label: 'Create Tournament',
            onClick: () => window.location.href = '/tournaments/create',
          }}
        />
      ) : (
        <div className="space-y-3">
          {tournaments.map((tournament) => (
            <Link
              key={tournament.id}
              href={`/tournaments/${tournament.id}`}
              className="block p-4 bg-bg-tertiary rounded-lg border border-bg-tertiary hover:border-electric-blue transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold text-text-primary line-clamp-1 flex-1">
                  {tournament.name}
                </h3>
                {tournament.isParticipant && (
                  <Badge variant="default" size="sm" className="bg-electric-blue text-black ml-2">
                    Joined
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-text-secondary">
                <span>
                  {tournament.participantCount}/{tournament.maxParticipants} participants
                </span>
                <span>Round {tournament.currentRound}/{tournament.totalRounds}</span>
              </div>
            </Link>
          ))}
          <Link href="/tournaments">
            <Button variant="primary" className="w-full mt-4">
              View All Tournaments
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
})

