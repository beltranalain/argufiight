'use client'

import { useState, useEffect, memo } from 'react'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { CreateDebateModal } from '@/components/debate/CreateDebateModal'

interface Belt {
  id: string
  name: string
  type: string
  category: string | null
  status: string
  coinValue: number
  designImageUrl?: string | null
  isStaked?: boolean
  currentHolder?: {
    id: string
    username: string
    avatarUrl: string | null
    eloRating?: number
  } | null
}

interface BeltChallenge {
  id: string
  belt: Belt
  challenger?: {
    id: string
    username: string
    avatarUrl: string | null
    eloRating: number
  }
  beltHolder?: {
    id: string
    username: string
    avatarUrl: string | null
  }
  entryFee: number
  coinReward: number
  expiresAt: string
  createdAt: string
}

export const BeltsPanel = memo(function BeltsPanel({ initialData }: { initialData?: any }) {
  const { user } = useAuth()
  const router = useRouter()
  const { showToast } = useToast()
  const [currentBelts, setCurrentBelts] = useState<Belt[]>([])
  const [allBelts, setAllBelts] = useState<Belt[]>([])
  const [challengesToMyBelts, setChallengesToMyBelts] = useState<BeltChallenge[]>([])
  const [challengesMade, setChallengesMade] = useState<BeltChallenge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingAllBelts, setIsLoadingAllBelts] = useState(false)
  const [beltSystemEnabled, setBeltSystemEnabled] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isCreatingChallenge, setIsCreatingChallenge] = useState<string | null>(null)
  const [challengeModalOpen, setChallengeModalOpen] = useState(false)
  const [selectedBeltForChallenge, setSelectedBeltForChallenge] = useState<Belt | null>(null)

  // Use initial data from consolidated endpoint when available
  useEffect(() => {
    if (initialData) {
      const newBelts = initialData.currentBelts || []
      setCurrentBelts(newBelts)
      const newChallengesToMyBelts = (initialData.challengesToMyBelts || [])
        .filter((c: any) => c.status !== 'COMPLETED' && c.status !== 'DECLINED')
      const newChallengesMade = (initialData.challengesMade || [])
        .filter((c: any) => c.status !== 'COMPLETED' && c.status !== 'DECLINED')
      setChallengesToMyBelts(newChallengesToMyBelts)
      setChallengesMade(newChallengesMade)
      setIsLoading(false)
      setIsInitialLoad(false)
      // If no belts or challenges, fetch all belts for display
      if (newBelts.length === 0 && newChallengesToMyBelts.length === 0 && newChallengesMade.length === 0) {
        fetchAllBelts()
      }
    }
  }, [initialData])

  // Fallback: fetch independently when no initial data
  useEffect(() => {
    if (initialData) return
    if (user) {
      fetchBeltsData(true)
      const interval = setInterval(() => fetchBeltsData(false), 60000)
      return () => clearInterval(interval)
    } else {
      setIsLoading(false)
      setIsInitialLoad(false)
    }
  }, [user])

  // Listen for belt challenge events (only when self-fetching)
  useEffect(() => {
    if (!user || initialData) return // Parent handles refresh when initialData provided

    let isMounted = true

    const handleRefresh = () => {
      if (isMounted && document.visibilityState === 'visible') {
        fetchBeltsData(false)
      }
    }

    const timeoutId = setTimeout(() => {
      window.addEventListener('belt-challenge-accepted', handleRefresh)
      window.addEventListener('belt-challenge-declined', handleRefresh)
    }, 100)

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      window.removeEventListener('belt-challenge-accepted', handleRefresh)
      window.removeEventListener('belt-challenge-declined', handleRefresh)
    }
  }, [user])


  // Fetch all belts when user has no belts or challenges (only when self-fetching)
  useEffect(() => {
    if (initialData) return // Already handled in initialData useEffect
    if (user && !isLoading && isInitialLoad === false) {
      const hasBelts = currentBelts.length > 0
      const hasChallenges = challengesToMyBelts.length > 0 || challengesMade.length > 0
      if (!hasBelts && !hasChallenges) {
        fetchAllBelts()
      }
    }
  }, [user, isLoading, isInitialLoad, currentBelts.length, challengesToMyBelts.length, challengesMade.length])

  const fetchBeltsData = async (isInitial: boolean = false) => {
    if (!user) {
      setIsLoading(false)
      setIsInitialLoad(false)
      return
    }

    try {
      // Only show loading spinner on initial load
      if (isInitial) {
        setIsLoading(true)
      }
      
      // Fetch belt room (current belts) with cache busting
      const roomResponse = await fetch('/api/belts/room', {
        credentials: 'include',
        cache: 'no-store',
      })
      
      let hasCurrentBelts = false
      if (roomResponse.ok) {
        const roomData = await roomResponse.json()
        // Only update state if data actually changed to prevent unnecessary re-renders
        const newBelts = roomData.currentBelts || []
        hasCurrentBelts = newBelts.length > 0
        setCurrentBelts((prevBelts) => {
          if (prevBelts.length === newBelts.length && prevBelts.every((b: Belt, i: number) => b.id === newBelts[i]?.id && b.status === newBelts[i]?.status)) {
            return prevBelts
          }
          return newBelts
        })
      } else if (roomResponse.status === 403) {
        setBeltSystemEnabled(false)
      }

      // Fetch pending challenges with cache busting
      const challengesResponse = await fetch('/api/belts/challenges', {
        credentials: 'include',
        cache: 'no-store',
      })
      
      let hasChallenges = false
      if (challengesResponse.ok) {
        const challengesData = await challengesResponse.json()
        // Filter out COMPLETED challenges
        const newChallengesToMyBelts = (challengesData.challengesToMyBelts || [])
          .filter((challenge: any) => challenge.status !== 'COMPLETED' && challenge.status !== 'DECLINED')
        const newChallengesMade = (challengesData.challengesMade || [])
          .filter((challenge: any) => challenge.status !== 'COMPLETED' && challenge.status !== 'DECLINED')
        hasChallenges = newChallengesToMyBelts.length > 0 || newChallengesMade.length > 0
        
        // Only update state if data actually changed to prevent unnecessary re-renders
        setChallengesToMyBelts((prev) => {
          if (prev.length === newChallengesToMyBelts.length && prev.every((c: any, i: number) => c.id === newChallengesToMyBelts[i]?.id && c.status === newChallengesToMyBelts[i]?.status)) {
            return prev
          }
          return newChallengesToMyBelts
        })
        setChallengesMade((prev) => {
          if (prev.length === newChallengesMade.length && prev.every((c: any, i: number) => c.id === newChallengesMade[i]?.id && c.status === newChallengesMade[i]?.status)) {
            return prev
          }
          return newChallengesMade
        })
      } else if (challengesResponse.status === 403) {
        setBeltSystemEnabled(false)
      }
      
      // After fetching, if user has no belts or challenges, fetch all belts
      if (isInitial && !hasCurrentBelts && !hasChallenges) {
        fetchAllBelts()
      }
    } catch (error) {
      console.error('Failed to fetch belts data:', error)
    } finally {
      // Only set loading to false on initial load
      if (isInitial) {
        setIsLoading(false)
        setIsInitialLoad(false)
      }
    }
  }

  const fetchAllBelts = async () => {
    try {
      setIsLoadingAllBelts(true)
      // Fetch all belts (not just ACTIVE) to show all available belts
      const response = await fetch('/api/belts', {
        credentials: 'include',
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        // Show all belts (with and without holders)
        setAllBelts(data.belts || [])
      } else {
        console.error('[BeltsPanel] Failed to fetch belts, status:', response.status)
      }
    } catch (error) {
      console.error('[BeltsPanel] Failed to fetch all belts:', error)
    } finally {
      setIsLoadingAllBelts(false)
    }
  }

  const handleCreateChallenge = (belt: Belt) => {
    if (!user || !belt.currentHolder) {
      showToast({
        type: 'error',
        title: 'Cannot Challenge',
        description: belt.currentHolder ? 'You must be logged in to challenge a belt' : 'This belt has no current holder',
      })
      return
    }
    
    // Set state to open modal
    setSelectedBeltForChallenge(belt)
    setChallengeModalOpen(true)
  }

  const handleChallengeModalSuccess = () => {
    // Refresh data after successful challenge creation
    fetchBeltsData(false)
    fetchAllBelts()
  }

  const formatBeltStatus = (status: string) => {
    return status.replace(/_/g, ' ')
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500 text-white'
      case 'INACTIVE':
        return 'bg-yellow-500 text-white'
      case 'STAKED':
        return 'bg-blue-500 text-white'
      case 'MANDATORY':
        return 'bg-red-500 text-white'
      case 'GRACE_PERIOD':
      case 'GRACEPERIOD':
        return 'bg-purple-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  // Helper to render modal (always render if state is set, regardless of return path)
  const renderModal = () => {
    if (challengeModalOpen && selectedBeltForChallenge && selectedBeltForChallenge.currentHolder) {
      return (
        <CreateDebateModal
          isOpen={challengeModalOpen}
          onClose={() => {
            setChallengeModalOpen(false)
            setSelectedBeltForChallenge(null)
          }}
          onSuccess={handleChallengeModalSuccess}
          beltChallengeMode={true}
          beltId={selectedBeltForChallenge.id}
          opponentId={selectedBeltForChallenge.currentHolder.id}
          opponentUsername={selectedBeltForChallenge.currentHolder.username}
          beltName={selectedBeltForChallenge.name}
        />
      )
    }
    return null
  }

  if (!beltSystemEnabled) {
    return (
      <>
        {renderModal()}
      </>
    )
  }

  if (isLoading) {
    return (
      <>
        <div className="space-y-4">
          <div className="h-20 bg-bg-tertiary rounded-lg animate-pulse" />
          <div className="h-20 bg-bg-tertiary rounded-lg animate-pulse" />
        </div>
        {renderModal()}
      </>
    )
  }

  const hasBelts = currentBelts.length > 0
  const hasChallenges = challengesToMyBelts.length > 0 || challengesMade.length > 0

  if (!hasBelts && !hasChallenges) {
    return (
      <>
        <div className="space-y-4">
        {isLoadingAllBelts ? (
            <div className="space-y-2">
              <div className="h-20 bg-bg-tertiary rounded-lg animate-pulse" />
              <div className="h-20 bg-bg-tertiary rounded-lg animate-pulse" />
            </div>
          ) : allBelts.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-electric-blue/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-electric-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <p className="text-text-secondary text-sm mb-4">
                No belts available to challenge
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {allBelts.slice(0, 3).map((belt) => (
                <div
                  key={belt.id}
                  className="bg-bg-tertiary p-3 rounded-lg border border-border hover:border-electric-blue/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Belt Image */}
                    {belt.designImageUrl ? (
                      <div className="flex-shrink-0 w-16 h-16 bg-bg-secondary border border-bg-tertiary rounded-lg overflow-hidden flex items-center justify-center relative">
                        <img
                          src={belt.designImageUrl}
                          alt={belt.name}
                          className="w-[140%] h-[140%] object-contain"
                          style={{ imageRendering: 'auto' as const }}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-16 h-16 bg-bg-secondary border border-bg-tertiary border-dashed rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Belt Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate mb-1">
                        {belt.name}
                      </p>
                      <div className="flex items-center gap-2">
                        {belt.currentHolder && (
                          <div className="flex items-center gap-1.5">
                            <Avatar
                              src={belt.currentHolder.avatarUrl}
                              username={belt.currentHolder.username}
                              size="xs"
                            />
                            <span className="text-xs text-text-secondary">
                              Held by {belt.currentHolder.username}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Challenge Button */}
                    {belt.currentHolder && belt.currentHolder.id !== user?.id && (belt.status === 'ACTIVE' || belt.status === 'MANDATORY') && !belt.isStaked && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleCreateChallenge(belt)}
                      >
                        Challenge
                      </Button>
                    )}
                    {belt.isStaked && (
                      <span className="text-xs text-text-secondary">Staked</span>
                    )}
                    {!belt.currentHolder && (
                      <span className="text-xs text-text-secondary">Vacant</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {renderModal()}
      </>
    )
  }

  return (
    <>
      <div className="space-y-4">
      {/* Current Belts */}
      {hasBelts && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Your Belts ({currentBelts.length})</h3>
            <Link href="/belts/room" className="text-xs text-electric-blue hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-2">
            {currentBelts.slice(0, 3).map((belt) => {
              return (
                <Link
                  key={belt.id}
                  href={`/belts/${belt.id}`}
                  className="block bg-bg-tertiary p-3 rounded-lg border border-border hover:border-electric-blue/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Belt Image on Left - Larger */}
                    {belt.designImageUrl ? (
                      <div className="flex-shrink-0 w-20 h-20 bg-bg-secondary border border-bg-tertiary rounded overflow-hidden flex items-center justify-center relative">
                        <img
                          src={belt.designImageUrl}
                          alt={belt.name}
                          className="w-[140%] h-[140%] object-contain"
                          style={{ imageRendering: 'auto' as const }}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-20 h-20 bg-bg-secondary border border-bg-tertiary border-dashed rounded flex items-center justify-center">
                        <svg className="w-8 h-8 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Belt Info on Right */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate mb-1">
                        {belt.name}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${getStatusBadgeColor(belt.status)} !text-white`}>
                          {formatBeltStatus(belt.status)}
                        </Badge>
                        {belt.category && (
                          <span className="inline-flex items-center font-bold rounded-full transition-colors px-2 py-0.5 text-xs bg-gray-600 !text-white">
                            {belt.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
            {currentBelts.length > 3 && (
              <Link href="/belts/room" className="text-xs text-electric-blue hover:underline text-center block">
                +{currentBelts.length - 3} more
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Challenges to My Belts */}
      {challengesToMyBelts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">
              Challenges to Your Belts ({challengesToMyBelts.length})
            </h3>
          </div>
          <div className="space-y-2">
            {challengesToMyBelts.slice(0, 2).map((challenge) => (
              <Link
                key={challenge.id}
                href={`/belts/${challenge.belt.id}`}
                className="block bg-bg-tertiary p-3 rounded-lg border border-electric-blue/30 hover:border-electric-blue transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  {/* Belt Image - Larger */}
                  {challenge.belt.designImageUrl ? (
                    <div className="flex-shrink-0 w-16 h-16 bg-bg-secondary border border-bg-tertiary rounded-lg overflow-hidden flex items-center justify-center relative">
                      <img
                        src={challenge.belt.designImageUrl}
                        alt={challenge.belt.name}
                        className="w-[140%] h-[140%] object-contain"
                        style={{ imageRendering: 'auto' as const }}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          const parent = e.currentTarget.parentElement
                          if (parent) {
                            parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-text-secondary"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg></div>'
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-16 h-16 bg-bg-secondary border border-bg-tertiary border-dashed rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar
                        src={challenge.challenger?.avatarUrl}
                        username={challenge.challenger?.username || 'Unknown'}
                        size="xs"
                      />
                      <p className="text-xs text-white font-medium truncate">
                        {challenge.challenger?.username} challenges
                      </p>
                    </div>
                    <p className="text-xs text-text-secondary truncate">
                      {challenge.belt.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <span>Entry: {challenge.entryFee} coins</span>
                  <span>•</span>
                  <span>Reward: {challenge.coinReward} coins</span>
                </div>
              </Link>
            ))}
            {challengesToMyBelts.length > 2 && (
              <Link href="/belts/room" className="text-xs text-electric-blue hover:underline text-center block">
                +{challengesToMyBelts.length - 2} more challenges
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Challenges I Made */}
      {challengesMade.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">
              Your Challenges ({challengesMade.length})
            </h3>
          </div>
          <div className="space-y-2">
            {challengesMade.slice(0, 2).map((challenge) => (
              <Link
                key={challenge.id}
                href={`/belts/${challenge.belt.id}`}
                className="block bg-bg-tertiary p-3 rounded-lg border border-border hover:border-electric-blue/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Belt Image */}
                  {challenge.belt.designImageUrl ? (
                    <div className="flex-shrink-0 w-12 h-12 bg-bg-secondary border border-bg-tertiary rounded-lg overflow-hidden">
                      <img
                        src={challenge.belt.designImageUrl}
                        alt={challenge.belt.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-12 h-12 bg-bg-secondary border border-bg-tertiary border-dashed rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-medium mb-1 truncate">
                      {challenge.belt.name}
                    </p>
                    <p className="text-xs text-text-secondary">
                      Waiting for {challenge.beltHolder?.username || 'holder'} to respond
                    </p>
                  </div>
                </div>
              </Link>
            ))}
            {challengesMade.length > 2 && (
              <Link href="/belts/room" className="text-xs text-electric-blue hover:underline text-center block">
                +{challengesMade.length - 2} more
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Quick Rules */}
      <div className="pt-2 border-t border-bg-tertiary">
        <p className="text-xs text-text-secondary mb-2 font-semibold">Quick Rules:</p>
        <ul className="text-xs text-text-secondary space-y-1">
          <li>• Challenge belts with coins (50-500) or use your free weekly challenge</li>
          <li>• Win debates to claim belts</li>
          <li>• Defend your belts from challengers</li>
          <li>• First 30 days are protected</li>
        </ul>
      </div>

      </div>
      {renderModal()}
    </>
  )
})
