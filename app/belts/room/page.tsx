'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { TopNav } from '@/components/layout/TopNav'
import { Avatar } from '@/components/ui/Avatar'
import { CreateDebateModal } from '@/components/debate/CreateDebateModal'

interface Belt {
  id: string
  name: string
  type: string
  category: string | null
  status: string
  coinValue: number
  designImageUrl?: string | null
  acquiredAt: string | null
  lastDefendedAt: string | null
  timesDefended: number
  successfulDefenses: number
  currentHolder: {
    id: string
    username: string
    avatarUrl: string | null
    eloRating: number
  } | null
  tournament: {
    id: string
    name: string
  } | null
}

interface BeltHistory {
  id: string
  belt: {
    id: string
    name: string
    type: string
    designImageUrl?: string | null
  }
  fromUser: {
    id: string
    username: string
    avatarUrl: string | null
  } | null
  toUser: {
    id: string
    username: string
    avatarUrl: string | null
  } | null
  reason: string
  debate: {
    id: string
    topic: string
  } | null
  tournament: {
    id: string
    name: string
  } | null
  daysHeld: number
  defensesWon: number
  defensesLost: number
  transferredAt: string
}

interface BeltWithHolder extends Belt {
  currentHolder: {
    id: string
    username: string
    avatarUrl: string | null
    eloRating: number
  } | null
}

export default function BeltRoomPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()
  const [currentBelts, setCurrentBelts] = useState<Belt[]>([])
  const [allBelts, setAllBelts] = useState<BeltWithHolder[]>([])
  const [history, setHistory] = useState<BeltHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingAllBelts, setIsLoadingAllBelts] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('room')
  const [challengeModalOpen, setChallengeModalOpen] = useState(false)
  const [selectedBeltForChallenge, setSelectedBeltForChallenge] = useState<BeltWithHolder | null>(null)
  const [isCreatingChallenge, setIsCreatingChallenge] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (user && isMounted) {
      fetchBeltRoom()
      if (activeTab === 'holders') {
        fetchAllBelts()
      }
    }
  }, [user, isMounted, activeTab])

  const fetchBeltRoom = async () => {
    try {
      setIsLoading(true)
      // Add cache busting to ensure fresh data
      const response = await fetch(`/api/belts/room?t=${Date.now()}`, {
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        console.log('[BeltRoomPage] Fetched belt room data:', data)
        if (data.currentBelts) {
          data.currentBelts.forEach((belt: any) => {
            console.log(`[BeltRoomPage] Belt ${belt.id} (${belt.name}): designImageUrl =`, belt.designImageUrl)
            // Specifically check for SPORTS belt
            if (belt.name?.includes('SPORTS') || belt.category === 'SPORTS') {
              console.log(`[BeltRoomPage] *** SPORTS BELT FOUND ***`)
              console.log(`[BeltRoomPage] SPORTS Belt designImageUrl:`, belt.designImageUrl)
            }
          })
        }
        setCurrentBelts(data.currentBelts || [])
        setHistory(data.history || [])
      } else {
        const error = await response.json()
        if (error.error !== 'Belt system is not enabled') {
          showToast({
            type: 'error',
            title: 'Error',
            description: error.error || 'Failed to load belt room',
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch belt room:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAllBelts = async () => {
    try {
      setIsLoadingAllBelts(true)
      const response = await fetch(`/api/belts?t=${Date.now()}`, {
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        setAllBelts(data.belts || [])
      }
    } catch (error) {
      console.error('Failed to fetch all belts:', error)
    } finally {
      setIsLoadingAllBelts(false)
    }
  }

  const handleCreateChallenge = (belt: Belt | BeltWithHolder) => {
    console.log('[BeltRoomPage] handleCreateChallenge called with belt:', belt)
    console.log('[BeltRoomPage] User:', user)
    console.log('[BeltRoomPage] Belt currentHolder:', belt.currentHolder)
    
    if (!user) {
      console.log('[BeltRoomPage] Cannot challenge - no user')
      showToast({
        type: 'error',
        title: 'Cannot Challenge',
        description: 'You must be logged in to challenge a belt',
      })
      return
    }
    
    if (!belt.currentHolder) {
      console.log('[BeltRoomPage] Cannot challenge - no current holder')
      showToast({
        type: 'error',
        title: 'Cannot Challenge',
        description: 'This belt has no current holder',
      })
      return
    }
    
    // Ensure we have a BeltWithHolder
    const beltWithHolder: BeltWithHolder = 'currentHolder' in belt && belt.currentHolder 
      ? (belt as BeltWithHolder)
      : {
          ...belt,
          currentHolder: belt.currentHolder,
        } as BeltWithHolder
    
    console.log('[BeltRoomPage] Opening challenge modal for belt:', beltWithHolder.id, beltWithHolder.name)
    console.log('[BeltRoomPage] Opponent:', beltWithHolder.currentHolder?.username)
    console.log('[BeltRoomPage] BeltWithHolder type check:', beltWithHolder.currentHolder ? 'has holder' : 'no holder')
    
    // Set state to open modal
    setIsCreatingChallenge(belt.id)
    setSelectedBeltForChallenge(beltWithHolder)
    setChallengeModalOpen(true)
    
    console.log('[BeltRoomPage] Modal state set - challengeModalOpen:', true, 'selectedBeltForChallenge:', beltWithHolder.id)
    console.log('[BeltRoomPage] Will modal render?', beltWithHolder.currentHolder ? 'YES' : 'NO')
  }

  const handleChallengeModalSuccess = () => {
    // Refresh data after successful challenge creation
    fetchBeltRoom()
    fetchAllBelts()
    setIsCreatingChallenge(null)
    setChallengeModalOpen(false)
    setSelectedBeltForChallenge(null)
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

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'ROOKIE':
        return 'bg-blue-500 text-white'
      case 'CATEGORY':
        return 'bg-green-500 text-white'
      case 'CHAMPIONSHIP':
        return 'bg-yellow-500 text-white'
      case 'UNDEFEATED':
        return 'bg-purple-500 text-white'
      case 'TOURNAMENT':
        return 'bg-orange-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const formatBeltStatus = (status: string) => {
    return status.replace(/_/g, ' ')
  }

  const formatBeltReason = (reason: string) => {
    return reason.replace(/_/g, ' ')
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="BELT ROOM" />
      {!isMounted || isLoading ? (
        <div className="flex justify-center items-center min-h-screen pt-20">
          <LoadingSpinner />
        </div>
      ) : (
      <div className="container mx-auto px-4 py-8 max-w-6xl pt-20">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">My Belt Room</h1>
        <p className="text-text-secondary">
          View your current belts and belt history
        </p>
      </div>

      {/* Tabs */}
      <Card>
        <Tabs
          tabs={[
            {
              id: 'room',
              label: 'Room',
              content: (
                <div className="space-y-8">
                  {/* Current Belts */}
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-4">
                      Current Belts ({currentBelts.length})
                    </h2>
                    {currentBelts.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-text-secondary text-lg mb-4">
                          You don't have any belts yet
                        </p>
                        <p className="text-text-secondary">
                          Win debates or tournaments to earn belts!
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {currentBelts.map((belt) => (
                          <div
                            key={belt.id}
                            className="bg-bg-tertiary p-6 rounded-lg border border-border hover:border-primary transition-colors"
                          >
                            <div className="flex items-start gap-4 mb-4">
                              {/* Belt Image on Left */}
                              {belt.designImageUrl ? (
                                <div className="flex-shrink-0 w-32 h-32 bg-bg-secondary border border-bg-tertiary rounded-lg overflow-hidden flex items-center justify-center relative">
                                  <img
                                    src={belt.designImageUrl}
                                    alt={belt.name}
                                    className="w-[140%] h-[140%] object-contain"
                                    style={{ imageRendering: 'auto' }}
                                    loading="lazy"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                      const parent = e.currentTarget.parentElement
                                      if (parent) {
                                        parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-text-secondary"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg></div>'
                                      }
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="flex-shrink-0 w-32 h-32 bg-bg-secondary border border-bg-tertiary border-dashed rounded-lg flex items-center justify-center">
                                  <svg className="w-12 h-12 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                  </svg>
                                </div>
                              )}
                              
                              {/* Belt Info on Right */}
                              <div className="flex-1">
                                <h3 className="text-xl font-semibold text-white mb-2">
                                  {belt.name}
                                </h3>
                                <div className="flex items-center gap-2 mb-4">
                                  <Badge className={getTypeBadgeColor(belt.type)} style={{ color: '#ffffff' }}>
                                    {belt.type}
                                  </Badge>
                                  <Badge className={getStatusBadgeColor(belt.status)} style={{ color: '#ffffff' }}>
                                    {formatBeltStatus(belt.status)}
                                  </Badge>
                                  {belt.category && (
                                    <span 
                                      className="inline-flex items-center font-bold rounded-full transition-colors px-3 py-1 text-xs bg-gray-600 text-white"
                                      style={{ color: '#ffffff' }}
                                    >
                                      {belt.category}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                              <div>
                                <p className="text-text-secondary">Defenses</p>
                                <p className="text-white font-medium">
                                  {belt.successfulDefenses} / {belt.timesDefended}
                                </p>
                              </div>
                              <div>
                                <p className="text-text-secondary">Coin Value</p>
                                <p className="text-white font-medium">{belt.coinValue}</p>
                              </div>
                              <div>
                                <p className="text-text-secondary">Acquired</p>
                                <p className="text-white font-medium">
                                  {belt.acquiredAt
                                    ? new Date(belt.acquiredAt).toLocaleDateString()
                                    : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-text-secondary">Last Defended</p>
                                <p className="text-white font-medium">
                                  {belt.lastDefendedAt
                                    ? new Date(belt.lastDefendedAt).toLocaleDateString()
                                    : 'Never'}
                                </p>
                              </div>
                            </div>

                            {belt.tournament && (
                              <p className="text-sm text-text-secondary mb-4">
                                From:{' '}
                                <Link
                                  href={`/tournaments/${belt.tournament.id}`}
                                  className="text-primary hover:underline"
                                >
                                  {belt.tournament.name}
                                </Link>
                              </p>
                            )}

                            <Button 
                              variant="secondary" 
                              className="w-full"
                              onClick={() => router.push(`/belts/${belt.id}`)}
                            >
                              View Details
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Belt History */}
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-4">Belt History</h2>
                    {history.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-text-secondary">No belt history yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {history.map((entry) => {
                          const isGain = entry.toUser?.id === user?.id
                          const isLoss = entry.fromUser?.id === user?.id

                          return (
                            <div
                              key={entry.id}
                              className={`bg-bg-tertiary p-4 rounded-lg border ${
                                isGain
                                  ? 'border-green-500'
                                  : isLoss
                                  ? 'border-red-500'
                                  : 'border-border'
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                {/* Belt Image on Left */}
                                {entry.belt.designImageUrl ? (
                                  <div className="flex-shrink-0 w-24 h-24 bg-bg-secondary border border-bg-tertiary rounded-lg overflow-hidden flex items-center justify-center relative">
                                    <img
                                      src={entry.belt.designImageUrl}
                                      alt={entry.belt.name}
                                      className="w-[140%] h-[140%] object-contain"
                                      style={{ imageRendering: 'auto' }}
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
                                  <div className="flex-shrink-0 w-24 h-24 bg-bg-secondary border border-bg-tertiary border-dashed rounded-lg flex items-center justify-center">
                                    <svg className="w-8 h-8 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                  </div>
                                )}
                                
                                {/* Belt Info on Right */}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="text-lg font-semibold text-white">
                                      {entry.belt.name}
                                    </h4>
                                    <Badge className={getTypeBadgeColor(entry.belt.type)}>
                                      {entry.belt.type}
                                    </Badge>
                                    <Badge className="bg-gray-600">{formatBeltReason(entry.reason)}</Badge>
                                    {isGain && (
                                      <Badge className="bg-green-500">Gained</Badge>
                                    )}
                                    {isLoss && <Badge className="bg-red-500">Lost</Badge>}
                                  </div>

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-2">
                                    <div>
                                      <p className="text-text-secondary">From</p>
                                      <p className="text-white">
                                        {entry.fromUser ? (
                                          <Link
                                            href={`/profile/${entry.fromUser.username}`}
                                            className="text-primary hover:underline"
                                          >
                                            {entry.fromUser.username}
                                          </Link>
                                        ) : (
                                          'N/A'
                                        )}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-text-secondary">To</p>
                                      <p className="text-white">
                                        {entry.toUser ? (
                                          <Link
                                            href={`/profile/${entry.toUser.username}`}
                                            className="text-primary hover:underline"
                                          >
                                            {entry.toUser.username}
                                          </Link>
                                        ) : (
                                          'N/A'
                                        )}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-text-secondary">Days Held</p>
                                      <p className="text-white">{entry.daysHeld}</p>
                                    </div>
                                    <div>
                                      <p className="text-text-secondary">Defenses</p>
                                      <p className="text-white">
                                        {entry.defensesWon}W / {entry.defensesLost}L
                                      </p>
                                    </div>
                                  </div>

                                  {entry.debate && (
                                    <p className="text-sm text-text-secondary">
                                      Debate:{' '}
                                      <Link
                                        href={`/debates/${entry.debate.id}`}
                                        className="text-primary hover:underline"
                                      >
                                        {entry.debate.topic}
                                      </Link>
                                    </p>
                                  )}
                                  {entry.tournament && (
                                    <p className="text-sm text-text-secondary">
                                      Tournament:{' '}
                                      <Link
                                        href={`/tournaments/${entry.tournament.id}`}
                                        className="text-primary hover:underline"
                                      >
                                        {entry.tournament.name}
                                      </Link>
                                    </p>
                                  )}

                                  <p className="text-xs text-text-secondary mt-2">
                                    {new Date(entry.transferredAt).toLocaleString()}
                                  </p>
                                </div>
      </div>

      {/* MODAL BYPASSED - Using direct API call instead */}
      
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ display: 'none' }}>
          <p>Modal Open: {challengeModalOpen ? 'true' : 'false'}</p>
          <p>Selected Belt: {selectedBeltForChallenge?.id || 'none'}</p>
          <p>Has Holder: {selectedBeltForChallenge?.currentHolder ? 'yes' : 'no'}</p>
        </div>
      )}
    </div>
  )
})}
                      </div>
                    )}
                  </div>
                </div>
              ),
            },
            {
              id: 'holders',
              label: 'Belt Holders',
              content: (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-4">
                      All Belts & Holders
                    </h2>
                    <p className="text-text-secondary mb-6">
                      View all belts and challenge their holders
                    </p>
                    {isLoadingAllBelts ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="bg-bg-tertiary p-6 rounded-lg border border-border animate-pulse">
                            <div className="h-32 bg-bg-secondary rounded-lg mb-4" />
                            <div className="h-4 bg-bg-secondary rounded mb-2" />
                            <div className="h-4 bg-bg-secondary rounded w-2/3" />
                          </div>
                        ))}
                      </div>
                    ) : allBelts.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-text-secondary text-lg mb-4">
                          No belts found
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {allBelts.map((belt) => (
                          <div
                            key={belt.id}
                            className="bg-bg-tertiary p-6 rounded-lg border border-border hover:border-primary transition-colors"
                          >
                            <div className="flex items-start gap-4 mb-4">
                              {/* Belt Image */}
                              {belt.designImageUrl ? (
                                <div className="flex-shrink-0 w-32 h-32 bg-bg-secondary border border-bg-tertiary rounded-lg overflow-hidden flex items-center justify-center relative">
                                  <img
                                    src={belt.designImageUrl}
                                    alt={belt.name}
                                    className="w-[140%] h-[140%] object-contain"
                                    style={{ imageRendering: 'auto' }}
                                    loading="lazy"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                      const parent = e.currentTarget.parentElement
                                      if (parent) {
                                        parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-text-secondary"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg></div>'
                                      }
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="flex-shrink-0 w-32 h-32 bg-bg-secondary border border-bg-tertiary border-dashed rounded-lg flex items-center justify-center">
                                  <svg className="w-12 h-12 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                  </svg>
                                </div>
                              )}
                              
                              {/* Belt Info */}
                              <div className="flex-1">
                                <h3 className="text-xl font-semibold text-white mb-2">
                                  {belt.name}
                                </h3>
                                <div className="flex items-center gap-2 mb-4">
                                  <Badge className={getTypeBadgeColor(belt.type)} style={{ color: '#ffffff' }}>
                                    {belt.type}
                                  </Badge>
                                  <Badge className={getStatusBadgeColor(belt.status)} style={{ color: '#ffffff' }}>
                                    {formatBeltStatus(belt.status)}
                                  </Badge>
                                  {belt.category && (
                                    <span 
                                      className="inline-flex items-center font-bold rounded-full transition-colors px-3 py-1 text-xs bg-gray-600 text-white"
                                      style={{ color: '#ffffff' }}
                                    >
                                      {belt.category}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Holder Info */}
                                {belt.currentHolder ? (
                                  <div className="mb-4">
                                    <p className="text-sm text-text-secondary mb-2">Current Holder:</p>
                                    <div className="flex items-center gap-2">
                                      <Avatar
                                        src={belt.currentHolder.avatarUrl}
                                        username={belt.currentHolder.username}
                                        size="sm"
                                      />
                                      <div>
                                        <Link
                                          href={`/profile/${belt.currentHolder.username}`}
                                          className="text-white font-medium hover:text-primary"
                                        >
                                          {belt.currentHolder.username}
                                        </Link>
                                        <p className="text-xs text-text-secondary">
                                          ELO: {belt.currentHolder.eloRating}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mb-4">
                                    <p className="text-sm text-text-secondary">No current holder</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                              <div>
                                <p className="text-text-secondary">Coin Value</p>
                                <p className="text-white font-medium">{belt.coinValue}</p>
                              </div>
                              <div>
                                <p className="text-text-secondary">Defenses</p>
                                <p className="text-white font-medium">
                                  {belt.successfulDefenses} / {belt.timesDefended}
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button 
                                variant="secondary" 
                                className="flex-1"
                                onClick={() => router.push(`/belts/${belt.id}`)}
                              >
                                View Details
                              </Button>
                              {belt.currentHolder && belt.currentHolder.id !== user?.id && (belt.status === 'ACTIVE' || belt.status === 'MANDATORY') && (
                                <Button
                                  variant="primary"
                                  className="flex-1"
                                  onClick={() => handleCreateChallenge(belt)}
                                  disabled={isCreatingChallenge === belt.id}
                                >
                                  {isCreatingChallenge === belt.id ? 'Challenging...' : 'Challenge'}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ),
            },
            {
              id: 'how-it-works',
              label: 'How it Works',
              content: (
                <div className="space-y-6 text-text-secondary">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">What Are Belts?</h3>
                    <p>
                      Belts are championship titles that represent your dominance in specific debate categories or overall skill. 
                      There are different types of belts: Rookie, Category, Championship, Undefeated, and Tournament belts.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">How to Get a Belt</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li><strong>Challenge for a Belt:</strong> Find an active belt, pay the entry fee (coins), and challenge the current holder. If they accept, you'll debate for the belt.</li>
                      <li><strong>Win a Tournament:</strong> Tournament belts are awarded to tournament winners.</li>
                      <li><strong>Claim a Vacant Belt:</strong> If a belt has no holder, you can claim it by winning a special debate.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">How to Challenge for a Belt</h3>
                    <ol className="list-decimal list-inside space-y-1 ml-4">
                      <li>Browse available belts (visit any belt's detail page)</li>
                      <li>Click "Challenge for Belt" button</li>
                      <li>Pay the entry fee (50-500 coins, varies by belt value)</li>
                      <li>Wait for the belt holder to accept your challenge</li>
                      <li>If accepted, a debate is automatically created</li>
                      <li>Win the debate to claim the belt!</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Belt Statuses</h3>
                    <ul className="space-y-2">
                      <li><Badge className="bg-green-500 text-white">ACTIVE</Badge> - Currently held, can be challenged</li>
                      <li><Badge className="bg-yellow-500 text-white">INACTIVE</Badge> - Not defended recently, top competitors can compete</li>
                      <li><Badge className="bg-blue-500 text-white">STAKED</Badge> - Currently at risk in a debate/tournament</li>
                      <li><Badge className="bg-red-500 text-white">MANDATORY</Badge> - Must be defended soon</li>
                      <li><Badge className="bg-purple-500 text-white">GRACE PERIOD</Badge> - First 30 days, protected from loss</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Defending Your Belt</h3>
                    <p>
                      When you hold a belt, other users can challenge you. You'll receive notifications when challenges are made. 
                      You can accept or decline challenges. If you decline too many, the belt may become inactive.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Belt Types</h3>
                    <ul className="space-y-2">
                      <li><Badge className="bg-blue-500 text-white">ROOKIE</Badge> - Your first belt, earned by winning your first belt challenge</li>
                      <li><Badge className="bg-green-500 text-white">CATEGORY</Badge> - Category-specific belts (Sports, Politics, Science, etc.)</li>
                      <li><Badge className="bg-yellow-500 text-white">CHAMPIONSHIP</Badge> - Cross-category, highest tier belts</li>
                      <li><Badge className="bg-purple-500 text-white">UNDEFEATED</Badge> - Earned by maintaining winning streaks</li>
                      <li><Badge className="bg-orange-500 text-white">TOURNAMENT</Badge> - Tournament-specific belts</li>
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-bg-tertiary">
                    <p className="text-sm">
                      <strong>Need coins?</strong> Purchase coins from the <Link href="/coins/purchase" className="text-electric-blue hover:underline">Buy Coins</Link> page. 
                      Entry fees typically range from 50-500 coins depending on the belt's value.
                    </p>
                  </div>
                </div>
              ),
            },
          ]}
          defaultTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId)}
        />
      </Card>
      </div>
      )}
    </div>
  )
}
