'use client'

import { useState, useEffect } from 'react'
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
import { useAuth } from '@/lib/hooks/useAuth'

export function ArenaPanel() {
  const { user } = useAuth()
  const [debates, setDebates] = useState<any[]>([])
  const [myActiveDebate, setMyActiveDebate] = useState<any | null>(null)
  const [isLoadingMyDebate, setIsLoadingMyDebate] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [initialDebateData, setInitialDebateData] = useState<{ topic?: string; category?: string } | null>(null)
  const [categories, setCategories] = useState<string[]>(['ALL', 'SPORTS', 'TECH', 'POLITICS'])

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (user) {
      fetchMyActiveDebate()
    }
  }, [user])

  useEffect(() => {
    fetchDebates()
  }, [filter, myActiveDebate])

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

  // Listen for custom event to refresh debates
  // Only listen if this component is mounted (not during page refresh)
  useEffect(() => {
    let isMounted = true
    
    const handleRefresh = () => {
      // Only refresh if component is still mounted and not during initial load
      if (isMounted && document.visibilityState === 'visible') {
        fetchDebates()
      }
    }
    
    const handleMyDebateRefresh = () => {
      if (isMounted && document.visibilityState === 'visible') {
        fetchMyActiveDebate()
      }
    }
    
    // Small delay to avoid catching events from page refresh
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
      // Only fetch ACTIVE debates (exclude COMPLETED, VERDICT_READY, WAITING)
      // Add cache-busting to ensure fresh data
      const response = await fetch(`/api/debates?userId=${user.id}&status=ACTIVE&t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      if (response.ok) {
        const data = await response.json()
          const debates = Array.isArray(data) ? data : (Array.isArray(data.debates) ? data.debates : [])
          console.log('[ArenaPanel] fetchMyActiveDebate - debates found:', debates.length, debates.map((d: any) => ({ id: d.id, status: d.status, topic: d.topic?.substring(0, 40) })))
          // Only show ACTIVE debates (exclude COMPLETED, VERDICT_READY, WAITING)
          // Double-check status to ensure we don't show completed debates
          const active = debates.find((d: any) => 
            d.status === 'ACTIVE' && 
            !d.winnerId &&
            d.status !== 'COMPLETED' &&
            d.status !== 'VERDICT_READY' &&
            d.status !== 'WAITING'
          )
        
        if (active) {
          console.log('[ArenaPanel] fetchMyActiveDebate - active debate found:', active.id, active.topic?.substring(0, 40))
          // Fetch full details
          const detailResponse = await fetch(`/api/debates/${active.id}?t=${Date.now()}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
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
            console.log('[ArenaPanel] fetchMyActiveDebate - set myActiveDebate:', active.id)
          } else {
            console.log('[ArenaPanel] fetchMyActiveDebate - detail fetch failed:', detailResponse.status)
            setMyActiveDebate(active)
          }
        } else {
          console.log('[ArenaPanel] fetchMyActiveDebate - no active debate found')
          setMyActiveDebate(null)
        }
      } else {
        console.error('[ArenaPanel] fetchMyActiveDebate - API error:', response.status, response.statusText)
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
            d.winnerId) {
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
        <div className="max-h-[500px] overflow-y-auto pr-2">
          <ChallengesPanel />
        </div>
      </div>

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
        <div className="max-h-[500px] overflow-y-auto pr-2">
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
}

