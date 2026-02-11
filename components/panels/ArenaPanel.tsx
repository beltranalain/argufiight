'use client'

import { useState, useEffect, memo } from 'react'
import Link from 'next/link'
import { DebateCard } from '@/components/debate/DebateCard'
import { LoadingCard } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CreateDebateModal } from '@/components/debate/CreateDebateModal'
import { StaggerContainer } from '@/components/ui/StaggerContainer'
import { StaggerItem } from '@/components/ui/StaggerItem'
import { ChallengesPanel } from '@/components/panels/ChallengesPanel'
import { DailyChallengeCard } from '@/components/dashboard/DailyChallengeCard'
import { useAuth } from '@/lib/hooks/useAuth'

interface ArenaPanelProps {
  initialCategories?: any
  initialActiveDebates?: any
  initialUserActiveDebates?: any
  initialWaitingDebates?: any
  initialUserWaitingDebates?: any
  initialBeltChallenges?: any
  initialPendingRematches?: any[]
}

export const ArenaPanel = memo(function ArenaPanel({
  initialCategories,
  initialActiveDebates,
  initialUserActiveDebates,
  initialWaitingDebates,
  initialUserWaitingDebates,
  initialBeltChallenges,
  initialPendingRematches,
}: ArenaPanelProps) {
  const { user } = useAuth()
  const [debates, setDebates] = useState<any[]>([])
  const [myActiveDebate, setMyActiveDebate] = useState<any | null>(null)
  const [isLoadingMyDebate, setIsLoadingMyDebate] = useState(!initialUserActiveDebates)
  const [isLoading, setIsLoading] = useState(!initialActiveDebates)
  const [filter, setFilter] = useState('ALL')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [initialDebateData, setInitialDebateData] = useState<{ topic?: string; category?: string } | null>(null)
  const [categories, setCategories] = useState<string[]>(['ALL', 'SPORTS', 'TECH', 'POLITICS'])

  // Process initial data from consolidated endpoint
  useEffect(() => {
    if (initialCategories?.categories) {
      const categoryNames = ['ALL', ...initialCategories.categories.map((cat: any) => cat.name)]
      setCategories(categoryNames)
    }
  }, [initialCategories])

  useEffect(() => {
    if (initialActiveDebates?.debates) {
      const allDebates = initialActiveDebates.debates.filter((d: any) => {
        if (d.status !== 'ACTIVE' || d.winnerId || d.verdictReached) return false
        if (myActiveDebate && d.id === myActiveDebate.id) return false
        return true
      })
      setDebates(allDebates)
      setIsLoading(false)
    }
  }, [initialActiveDebates])

  useEffect(() => {
    if (initialUserActiveDebates?.debates) {
      const debates = initialUserActiveDebates.debates
      const active = debates.find((d: any) =>
        d.status === 'ACTIVE' && !d.winnerId && !d.verdictReached
      )
      setMyActiveDebate(active || null)
      setIsLoadingMyDebate(false)
    }
  }, [initialUserActiveDebates])

  // Fallback: fetch independently when no initial data
  useEffect(() => {
    if (!initialCategories) fetchCategories()
    if (!initialActiveDebates) fetchDebates()

    // Refresh when user returns to tab (only when self-fetching)
    if (initialActiveDebates) return
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchDebates()
        if (user) fetchMyActiveDebate()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  useEffect(() => {
    if (user && !initialUserActiveDebates) {
      fetchMyActiveDebate()
    }
  }, [user])

  useEffect(() => {
    if (!initialActiveDebates) {
      fetchDebates()
    }
  }, [filter])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        const categoryNames = ['ALL', ...(data.categories || []).map((cat: any) => cat.name)]
        setCategories(categoryNames)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      // Fallback to default categories
      setCategories(['ALL', 'SPORTS', 'TECH', 'POLITICS', 'ENTERTAINMENT', 'SCIENCE', 'OTHER'])
    }
  }

  // Listen for custom event to refresh debates (only when self-fetching)
  useEffect(() => {
    if (initialActiveDebates) return // Parent handles refresh

    let isMounted = true

    const handleRefresh = () => {
      if (isMounted && document.visibilityState === 'visible') {
        fetchDebates()
      }
    }

    const handleMyDebateRefresh = () => {
      if (isMounted && document.visibilityState === 'visible') {
        fetchMyActiveDebate()
      }
    }

    const timeoutId = setTimeout(() => {
      window.addEventListener('debate-created', handleRefresh)
      window.addEventListener('belt-challenge-accepted', handleRefresh)
      window.addEventListener('debate-updated', handleMyDebateRefresh)
      window.addEventListener('statement-submitted', handleMyDebateRefresh)
      window.addEventListener('verdict-ready', handleMyDebateRefresh)
    }, 100)

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      window.removeEventListener('debate-created', handleRefresh)
      window.removeEventListener('belt-challenge-accepted', handleRefresh)
      window.removeEventListener('debate-updated', handleMyDebateRefresh)
      window.removeEventListener('statement-submitted', handleMyDebateRefresh)
      window.removeEventListener('verdict-ready', handleMyDebateRefresh)
    }
  }, [])

  // Listen for custom event to open create debate modal
  useEffect(() => {
    const handleOpenModal = (event: any) => {
      const data = event.detail || {}
      setInitialDebateData(data)
      setIsCreateModalOpen(true)
    }
    
    window.addEventListener('open-create-debate-modal', handleOpenModal as EventListener)
    return () => {
      window.removeEventListener('open-create-debate-modal', handleOpenModal as EventListener)
    }
  }, [])

  const fetchMyActiveDebate = async () => {
    if (!user) return
    
    try {
      setIsLoadingMyDebate(true)
      const response = await fetch(`/api/debates?userId=${user.id}&status=ACTIVE`, {
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
          const debates = Array.isArray(data) ? data : (Array.isArray(data.debates) ? data.debates : [])
          const active = debates.find((d: any) =>
            d.status === 'ACTIVE' && !d.winnerId && !d.verdictReached
          )
        
        if (active) {
          const detailResponse = await fetch(`/api/debates/${active.id}`, {
            cache: 'no-store',
          })
          if (detailResponse.ok) {
            const fullDebate = await detailResponse.json()
            setMyActiveDebate({
              ...active,
              challengeType: fullDebate.challengeType || active.challengeType,
              tournamentMatch: fullDebate.tournamentMatch || active.tournamentMatch,
              images: fullDebate.images || [],
              statements: fullDebate.statements?.map((s: any) => ({
                id: s.id,
                round: s.round,
                authorId: s.author.id,
              })) || [],
            })
          } else {
            setMyActiveDebate(active)
          }
        } else {
          setMyActiveDebate(null)
        }
      }
    } catch (error) {
      console.error('[ArenaPanel] Failed to fetch my active debate:', error)
    } finally {
      setIsLoadingMyDebate(false)
    }
  }

  const fetchDebates = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'ALL') {
        params.append('category', filter)
      }
      // Only include ACTIVE debates (exclude WAITING, COMPLETED, VERDICT_READY)
      params.append('status', 'ACTIVE')
      
      const response = await fetch(`/api/debates?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch debates: ${response.statusText}`)
      }
      const data = await response.json()
      // Ensure data is an array before setting
      let allDebates: any[] = []
      if (Array.isArray(data)) {
        allDebates = data
      } else if (Array.isArray(data.debates)) {
        allDebates = data.debates
      }
      
      // Filter out completed debates and user's personal debate
      allDebates = allDebates.filter((d: any) => {
        // Exclude completed debates (double-check) - be very explicit
        if (d.status === 'VERDICT_READY' ||
            d.status === 'COMPLETED' ||
            d.status === 'WAITING' ||
            d.status === 'CANCELLED' ||
            d.winnerId ||
            d.verdictReached) {
          return false
        }
        // Only show ACTIVE debates - strict check
        if (d.status !== 'ACTIVE') {
          return false
        }
        // Exclude user's personal debate (if they have one)
        if (myActiveDebate && d.id === myActiveDebate.id) {
          return false
        }
        return true
      })
      
      setDebates(allDebates)
    } catch (error) {
      console.error('Failed to fetch debates:', error)
      // Error is logged but we don't show toast to avoid spam
      // The empty state will show if no debates are found
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Open Challenges - Moved from right column */}
      <div className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary mt-8">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Open Challenges</h2>
        <p className="text-text-secondary text-sm mb-4">Debates waiting for opponents</p>
        <div className="max-h-[60vh] overflow-y-auto pr-2 scroll-smooth" role="region" aria-label="Open challenges list" style={{ scrollBehavior: 'smooth' }}>
          <ChallengesPanel
            initialWaitingDebates={initialWaitingDebates}
            initialUserWaitingDebates={initialUserWaitingDebates}
            initialBeltChallenges={initialBeltChallenges}
            initialPendingRematches={initialPendingRematches}
          />
        </div>
      </div>

      {/* Daily Challenge */}
      <DailyChallengeCard />

      {/* Live Battles - Combined */}
      <div className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h3 className="text-2xl font-bold text-text-primary mb-1">Live Battles</h3>
            <p className="text-text-secondary text-sm">Your active debate and all ongoing debates</p>
          </div>

          {/* Category Filter Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="category-filter" className="text-sm font-medium text-text-secondary whitespace-nowrap">
              Category:
            </label>
            <select
              id="category-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-text-primary text-sm font-medium cursor-pointer hover:border-electric-blue/50 focus:outline-none focus:ring-2 focus:ring-electric-blue/50 focus:border-electric-blue transition-colors min-w-[150px]"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'ALL' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* My Active Debate - Shown at top if user has one */}
        {user && (
          <div className="mb-6">
            {isLoadingMyDebate ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-electric-blue border-t-transparent rounded-full animate-spin" />
              </div>
            ) : myActiveDebate ? (
              (() => {
                // Calculate if it's user's turn (once, to avoid duplication)
                const currentRoundStatements = myActiveDebate.statements?.filter(
                  (s: any) => s.round === myActiveDebate.currentRound
                ) || []
                const userSubmitted = currentRoundStatements.some((s: any) => s.authorId === user.id)
                const isGroupDebate = !myActiveDebate.opponent || myActiveDebate.challengeType === 'GROUP'
                let isMyTurn = false
                
                if (isGroupDebate) {
                  isMyTurn = !userSubmitted
                } else {
                  const challengerSubmitted = currentRoundStatements.some(
                    (s: any) => s.authorId === myActiveDebate.challenger.id
                  )
                  const opponentSubmitted = myActiveDebate.opponent && currentRoundStatements.some(
                    (s: any) => s.authorId === myActiveDebate.opponent!.id
                  )
                  const isChallenger = user.id === myActiveDebate.challenger.id
                  const isOpponent = myActiveDebate.opponent && user.id === myActiveDebate.opponent.id
                  
                  if (currentRoundStatements.length === 0 && isChallenger) {
                    isMyTurn = true
                  } else if (isChallenger && opponentSubmitted && !challengerSubmitted) {
                    isMyTurn = true
                  } else if (isOpponent && challengerSubmitted && !opponentSubmitted) {
                    isMyTurn = true
                  }
                }
                
                return (
                  <div className={`bg-bg-tertiary rounded-lg p-4 border-2 mb-4 ${
                    isMyTurn ? 'border-neon-orange blink-orange-border blink-orange-bg' : 'border-electric-blue/50'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" size="sm" className="bg-neon-orange text-black">
                          My Battle
                        </Badge>
                        <Badge variant={myActiveDebate.category.toLowerCase() as any} size="sm">
                          {myActiveDebate.category}
                        </Badge>
                      </div>
                      {isMyTurn ? (
                        <Badge variant="default" size="sm" className="bg-neon-orange text-black animate-pulse">
                          Your Turn
                        </Badge>
                      ) : null}
                    </div>
                    <h4 className="text-lg font-bold text-text-primary mb-2 line-clamp-2">
                      {myActiveDebate.topic}
                    </h4>
                
                {/* Images */}
                {myActiveDebate.images && myActiveDebate.images.length > 0 && (
                  <div className="mb-3">
                    <div className={`grid gap-2 ${
                      myActiveDebate.images.length === 1 ? 'grid-cols-1' :
                      myActiveDebate.images.length === 2 ? 'grid-cols-2' :
                      myActiveDebate.images.length === 3 ? 'grid-cols-3' :
                      myActiveDebate.images.length === 4 ? 'grid-cols-2' :
                      'grid-cols-2'
                    }`}>
                      {myActiveDebate.images.slice(0, 4).map((image: any) => (
                        <div key={image.id} className="relative aspect-square rounded overflow-hidden border border-bg-secondary bg-bg-secondary">
                          <img
                            src={image.url}
                            alt={image.alt || myActiveDebate.topic}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
                  <span>
                    Round {myActiveDebate.tournamentMatch 
                      ? myActiveDebate.tournamentMatch.round.roundNumber 
                      : myActiveDebate.currentRound}/{myActiveDebate.tournamentMatch 
                      ? myActiveDebate.tournamentMatch.tournament.totalRounds 
                      : myActiveDebate.totalRounds}
                  </span>
                </div>
                
                {/* Progress Bar */}
                {(() => {
                  const displayRound = myActiveDebate.tournamentMatch 
                    ? myActiveDebate.tournamentMatch.round.roundNumber 
                    : myActiveDebate.currentRound
                  const displayTotalRounds = myActiveDebate.tournamentMatch 
                    ? myActiveDebate.tournamentMatch.tournament.totalRounds 
                    : myActiveDebate.totalRounds
                  const progress = (displayRound / displayTotalRounds) * 100
                  
                  return (
                    <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden mb-4">
                      <div 
                        className="h-full bg-electric-blue transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )
                })()}
                
                <Link href={`/debate/${myActiveDebate.id}`}>
                  <Button variant="primary" className="w-full">
                    {isMyTurn ? 'Continue Debate' : 'View Debate'}
                  </Button>
                </Link>
                  </div>
                )
              })()
            ) : null}
          </div>
        )}

        {/* Divider if user has active debate */}
        {myActiveDebate && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-bg-tertiary"></div>
              <span className="text-sm text-text-secondary">All Active Debates</span>
              <div className="flex-1 h-px bg-bg-tertiary"></div>
            </div>
          </div>
        )}

        {/* All Active Debates Grid */}
        {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <LoadingCard key={i} lines={4} />
          ))}
        </div>
      ) : debates.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
            title="No Active Debates"
            description="Be the first to start a debate!"
              action={{
                label: 'Create Debate',
                onClick: () => setIsCreateModalOpen(true),
              }}
          />
        </div>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto pr-2 scroll-smooth" role="region" aria-label="Active debates list" style={{ scrollBehavior: 'smooth' }}>
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {debates.map((debate: any) => (
              <StaggerItem key={debate.id}>
                <DebateCard debate={debate} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      )}
      </div>

      {/* Create Debate Modal */}
      <CreateDebateModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setInitialDebateData(null)
        }}
        onSuccess={() => {
          fetchDebates()
          setInitialDebateData(null)
        }}
        initialTopic={initialDebateData?.topic}
        initialCategory={initialDebateData?.category as any}
      />
    </div>
  )
})

