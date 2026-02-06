'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { TopNav } from '@/components/layout/TopNav'
import { ArenaPanel } from '@/components/panels/ArenaPanel'
import { ChallengesPanel } from '@/components/panels/ChallengesPanel'
import { ProfilePanel } from '@/components/panels/ProfilePanel'
import { TournamentsPanel } from '@/components/panels/TournamentsPanel'
import { BeltsPanel } from '@/components/panels/BeltsPanel'
import { LeaderboardPanel } from '@/components/panels/LeaderboardPanel'
import { CreateDebateModal } from '@/components/debate/CreateDebateModal'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/lib/hooks/useAuth'
import { POLL_INTERVAL_MS, BLINK_DURATION_MS, BELT_BLINK_DURATION_MS } from '@/lib/constants'

export function DashboardHomePage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [showBlink, setShowBlink] = useState(false)
  const [dashData, setDashData] = useState<any>(null)
  const { user } = useAuth()

  // Single consolidated fetch for ALL dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard-data', { cache: 'no-store' })
      if (!response.ok) {
        setDashData((prev: any) => prev || {})
        return
      }
      const data = await response.json()
      setDashData(data)

      // Process your-turn and belt challenges from consolidated data
      if (data.yourTurn?.hasTurn) {
        setIsMyTurn(true)
        setShowBlink(true)
        setTimeout(() => setShowBlink(false), BLINK_DURATION_MS)
      } else {
        setIsMyTurn(false)
      }

      const pendingBeltChallenges = (data.belts?.challengesToMyBelts || []).filter(
        (c: any) => c.status === 'PENDING'
      )
      if (pendingBeltChallenges.length > 0) {
        setShowBlink(true)
        setTimeout(() => setShowBlink(false), BELT_BLINK_DURATION_MS)
      }
    } catch {
      setDashData((prev: any) => prev || {})
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setIsMyTurn(false)
      setShowBlink(false)
      setDashData({})
      return
    }

    fetchDashboardData()

    // Refresh on events
    const handleUpdate = () => fetchDashboardData()
    window.addEventListener('debate-updated', handleUpdate)
    window.addEventListener('statement-submitted', handleUpdate)
    window.addEventListener('debate-created', handleUpdate)
    window.addEventListener('belt-challenge-accepted', handleUpdate)

    // Poll for updates
    const interval = setInterval(fetchDashboardData, POLL_INTERVAL_MS)

    return () => {
      clearInterval(interval)
      window.removeEventListener('debate-updated', handleUpdate)
      window.removeEventListener('statement-submitted', handleUpdate)
      window.removeEventListener('debate-created', handleUpdate)
      window.removeEventListener('belt-challenge-accepted', handleUpdate)
    }
  }, [user, fetchDashboardData])

  return (
    <div className={`min-h-screen bg-bg-primary relative ${showBlink ? 'slow-blink-orange' : ''}`}>
      <TopNav currentPanel="THE ARENA" initialNavData={dashData?.nav} />

      <div className="pt-16 md:pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-[1600px] mx-auto">
          {/* Main Grid Layout - 3 Columns */}
          {dashData === null ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
              <div className="space-y-6">
                <div className="bg-bg-secondary rounded-xl border border-bg-tertiary mt-8 h-64" />
                <div className="bg-bg-secondary rounded-xl border border-bg-tertiary h-96" />
              </div>
              <div className="space-y-6">
                <div className="bg-bg-secondary rounded-xl border border-bg-tertiary mt-8 h-80" />
                <div className="bg-bg-secondary rounded-xl border border-bg-tertiary h-64" />
              </div>
              <div className="space-y-6">
                <div className="bg-bg-secondary rounded-xl border border-bg-tertiary mt-8 h-64" />
                <div className="bg-bg-secondary rounded-xl border border-bg-tertiary h-48" />
              </div>
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Column 1 - Left */}
            <div className="space-y-6">
              <ArenaPanel
                initialCategories={dashData?.categories}
                initialActiveDebates={dashData?.activeDebates}
                initialUserActiveDebates={dashData?.userActiveDebates}
                initialWaitingDebates={dashData?.waitingDebates}
                initialUserWaitingDebates={dashData?.userWaitingDebates}
                initialBeltChallenges={dashData?.belts}
              />
            </div>

            {/* Column 2 - Middle */}
            <div className="space-y-6">
              {/* Your Profile */}
              <div className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary mt-8">
                <h2 className="text-2xl font-bold text-text-primary mb-2">Your Profile</h2>
                <ProfilePanel initialDebates={dashData?.recentDebates} />
              </div>

              {/* ELO Leaderboard */}
              <div className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary">
                <LeaderboardPanel initialData={dashData?.leaderboard} />
              </div>
            </div>

            {/* Column 3 - Right */}
            <div className="space-y-6">
              {/* Belts */}
              <div className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary mt-8">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold text-text-primary">Belts</h2>
                  <Link href="/belts/room">
                    <Button variant="secondary" size="sm">View All</Button>
                  </Link>
                </div>
                <p className="text-text-secondary text-sm mb-4">Your championship belts and challenges</p>
                <BeltsPanel initialData={dashData?.belts} />
              </div>

              {/* Tournaments */}
              <div className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary">
                <TournamentsPanel initialData={dashData?.tournaments} />
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* FAB Button */}
      <button
        className="fixed bottom-20 right-4 md:bottom-24 md:right-8 w-14 h-14 md:w-16 md:h-16 rounded-full bg-electric-blue flex items-center justify-center text-black shadow-lg hover:scale-110 active:scale-95 transition-transform z-40 hover:bg-[#00B8E6] touch-manipulation"
        onClick={() => setIsCreateModalOpen(true)}
        aria-label="Create Debate"
      >
        <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Create Debate Modal */}
      <CreateDebateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          // Event will be dispatched by CreateDebateModal
          // No need to reload the page
        }}
      />
    </div>
  )
}
