'use client'

import { useState, useEffect } from 'react'
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

export function DashboardHomePage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [showBlink, setShowBlink] = useState(false)
  const [hasBeltChallenge, setHasBeltChallenge] = useState(false)
  const { user } = useAuth()

  // Check for belt challenges and your turn
  useEffect(() => {
    if (!user) {
      setIsMyTurn(false)
      setShowBlink(false)
      setHasBeltChallenge(false)
      return
    }

    let blinkTimeout: NodeJS.Timeout | null = null

    const checkBeltChallenges = async () => {
      try {
        const response = await fetch('/api/belts/challenges', {
          cache: 'no-store',
        })
        if (response.ok) {
          const data = await response.json()
          const challengesToMyBelts = data.challengesToMyBelts || []
          // Only count PENDING challenges (exclude DECLINED, COMPLETED, ACCEPTED)
          const pendingChallenges = challengesToMyBelts.filter(
            (challenge: any) => challenge.status === 'PENDING'
          )
          if (pendingChallenges.length > 0) {
            setHasBeltChallenge(true)
            setShowBlink(true)
            // Stop blinking after 10 seconds for belt challenges
            if (blinkTimeout) {
              clearTimeout(blinkTimeout)
            }
            blinkTimeout = setTimeout(() => {
              setShowBlink(false)
            }, 10000)
          } else {
            setHasBeltChallenge(false)
            setShowBlink(false)
            if (blinkTimeout) {
              clearTimeout(blinkTimeout)
            }
          }
        } else {
          setHasBeltChallenge(false)
          setShowBlink(false)
          if (blinkTimeout) {
            clearTimeout(blinkTimeout)
          }
        }
      } catch (error) {
        console.error('Failed to check belt challenges:', error)
        setHasBeltChallenge(false)
        setShowBlink(false)
        if (blinkTimeout) {
          clearTimeout(blinkTimeout)
        }
      }
    }

    const checkMyTurn = async () => {
      try {
        const response = await fetch(`/api/debates?userId=${user.id}&status=ACTIVE`)
        if (response.ok) {
          const data = await response.json()
          const debates = Array.isArray(data) ? data : (Array.isArray(data.debates) ? data.debates : [])
          const activeDebate = debates.find((d: any) => d.status === 'ACTIVE')
          
          if (activeDebate) {
            // Fetch full debate details to check statements
            const detailResponse = await fetch(`/api/debates/${activeDebate.id}`)
            if (detailResponse.ok) {
              const fullDebate = await detailResponse.json()
              
              // Check if it's user's turn
              const currentRoundStatements = (fullDebate.statements || []).filter(
                (s: any) => s.round === fullDebate.currentRound
              )
              const challengerSubmitted = currentRoundStatements.some(
                (s: any) => s.author.id === fullDebate.challenger.id
              )
              const opponentSubmitted = fullDebate.opponent && currentRoundStatements.some(
                (s: any) => s.author.id === fullDebate.opponent.id
              )
              const userSubmitted = currentRoundStatements.some(
                (s: any) => s.author.id === user.id
              )
              const isChallenger = user.id === fullDebate.challenger.id
              const isOpponent = fullDebate.opponent && user.id === fullDebate.opponent.id
              
              // Determine if it's user's turn
              let turnStatus = false
              if (currentRoundStatements.length === 0 && isChallenger) {
                turnStatus = true
              } else if (isChallenger && opponentSubmitted && !challengerSubmitted) {
                turnStatus = true
              } else if (isOpponent && challengerSubmitted && !opponentSubmitted) {
                turnStatus = true
              }
              
              // Only show blink if it's their turn AND they haven't submitted
              if (turnStatus && !userSubmitted) {
                setIsMyTurn(true)
                // Start blinking
                setShowBlink(true)
                // Clear any existing timeout
                if (blinkTimeout) {
                  clearTimeout(blinkTimeout)
                }
                // Stop blinking after 5 seconds
                blinkTimeout = setTimeout(() => {
                  setShowBlink(false)
                }, 5000)
              } else {
                setIsMyTurn(false)
                setShowBlink(false)
                if (blinkTimeout) {
                  clearTimeout(blinkTimeout)
                }
              }
            }
          } else {
            setIsMyTurn(false)
            setShowBlink(false)
            if (blinkTimeout) {
              clearTimeout(blinkTimeout)
            }
          }
        }
      } catch (error) {
        console.error('Failed to check turn status:', error)
        setIsMyTurn(false)
        setShowBlink(false)
        if (blinkTimeout) {
          clearTimeout(blinkTimeout)
        }
      }
    }

    // Delay initial check to avoid competing with ArenaPanel's initial fetches
    const initialTimeout = setTimeout(() => {
      checkMyTurn()
      checkBeltChallenges()
    }, 2000)

    // Listen for debate updates (e.g., when user submits)
    const handleDebateUpdate = () => {
      checkMyTurn()
    }

    window.addEventListener('debate-updated', handleDebateUpdate)
    window.addEventListener('statement-submitted', handleDebateUpdate)

    // Check every 60 seconds (reduced from 30s)
    const interval = setInterval(() => {
      checkMyTurn()
      checkBeltChallenges()
    }, 60000)
    
    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
      window.removeEventListener('debate-updated', handleDebateUpdate)
      window.removeEventListener('statement-submitted', handleDebateUpdate)
      if (blinkTimeout) {
        clearTimeout(blinkTimeout)
      }
    }
  }, [user])

  return (
    <div className={`min-h-screen bg-bg-primary relative ${showBlink ? 'slow-blink-orange' : ''}`}>
      <TopNav currentPanel="THE ARENA" />
      
      <div className="pt-16 md:pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-[1600px] mx-auto">
          {/* Main Grid Layout - 3 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1 - Left */}
            <div className="space-y-6">
              <ArenaPanel />
            </div>

            {/* Column 2 - Middle */}
            <div className="space-y-6">
              {/* Your Profile */}
              <div className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary mt-8">
                <h2 className="text-2xl font-bold text-text-primary mb-2">Your Profile</h2>
                <ProfilePanel />
              </div>

              {/* ELO Leaderboard */}
              <div className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary">
                <LeaderboardPanel />
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
                <BeltsPanel />
              </div>

              {/* Tournaments */}
              <div className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary">
                <TournamentsPanel />
              </div>
            </div>
          </div>
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

