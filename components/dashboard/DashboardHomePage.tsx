'use client'

import { useState } from 'react'
import { TopNav } from '@/components/layout/TopNav'
import { ArenaPanel } from '@/components/panels/ArenaPanel'
import { LiveBattlePanel } from '@/components/panels/LiveBattlePanel'
import { ChallengesPanel } from '@/components/panels/ChallengesPanel'
import { ProfilePanel } from '@/components/panels/ProfilePanel'
import { LeaderboardPanel } from '@/components/panels/LeaderboardPanel'
import { CreateDebateModal } from '@/components/debate/CreateDebateModal'

export function DashboardHomePage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="THE ARENA" />
      
      <div className="pt-16 md:pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-[1600px] mx-auto">
          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column - Arena (8 columns) */}
            <div className="lg:col-span-8 space-y-6">
              <ArenaPanel />
            </div>

            {/* Right Column - Sidebar (4 columns) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Live Battle */}
              <div className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary mt-8">
                <h2 className="text-2xl font-bold text-text-primary mb-2">Live Battle</h2>
                <p className="text-text-secondary text-sm mb-6">Your active debate will appear here</p>
                <LiveBattlePanel />
              </div>

              {/* Open Challenges */}
              <div className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary">
                <h2 className="text-2xl font-bold text-text-primary mb-2">Open Challenges</h2>
                <p className="text-text-secondary text-sm mb-4">Debates waiting for opponents</p>
                <ChallengesPanel />
              </div>

              {/* Your Profile */}
              <div className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary">
                <h2 className="text-2xl font-bold text-text-primary mb-2">Your Profile</h2>
                <ProfilePanel />
              </div>

              {/* Leaderboard */}
              <div className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary">
                <LeaderboardPanel />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAB Button */}
      <button 
        className="fixed bottom-4 right-4 md:bottom-8 md:right-8 w-14 h-14 md:w-16 md:h-16 rounded-full bg-electric-blue flex items-center justify-center text-black shadow-lg hover:scale-110 active:scale-95 transition-transform z-40 hover:bg-[#00B8E6] touch-manipulation"
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

