'use client'

import { useState, useEffect, memo } from 'react'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tabs } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import { useRouter } from 'next/navigation'

// Modal component for decline confirmation

// Helper function to extract topic from URL or return topic as-is
function extractTopicFromUrl(topic: string): string {
  if (!topic) return ''
  
  // If topic is a URL, try to extract the actual topic
  if (/^https?:\/\//.test(topic)) {
    // Try to extract from ChatGPT URL
    const chatgptMatch = topic.match(/[#&]text=([^&]+)/i)
    if (chatgptMatch) {
      try {
        const decoded = decodeURIComponent(chatgptMatch[1])
        return decoded.replace(/\+/g, ' ')
      } catch {
        // If decoding fails, show truncated URL
        return topic.substring(0, 60) + '...'
      }
    }
    // Regular URL - truncate it
    return topic.substring(0, 60) + '...'
  }
  
  // Normal topic - return as is
  return topic
}

interface ChallengesPanelProps {
  initialWaitingDebates?: any
  initialUserWaitingDebates?: any
  initialBeltChallenges?: any
  initialPendingRematches?: any[]
}

export const ChallengesPanel = memo(function ChallengesPanel({
  initialWaitingDebates,
  initialUserWaitingDebates,
  initialBeltChallenges,
  initialPendingRematches,
}: ChallengesPanelProps) {
  const [challenges, setChallenges] = useState<any[]>([])
  const [myChallenges, setMyChallenges] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(!initialWaitingDebates)
  const [declineConfirmId, setDeclineConfirmId] = useState<string | null>(null)
  const [isDeclining, setIsDeclining] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [declineDebateConfirmId, setDeclineDebateConfirmId] = useState<string | null>(null)
  const { user } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()

  // Process initial data from consolidated endpoint
  useEffect(() => {
    if (initialWaitingDebates?.debates && user) {
      const allData = initialWaitingDebates.debates || []
      const challengesToMyBelts = initialBeltChallenges?.challengesToMyBelts || []

      // Build belt challenges for display
      const beltChallenges = challengesToMyBelts
        .filter((bc: any) => bc.status === 'PENDING')
        .map((bc: any) => ({
          id: `belt-${bc.id}`,
          topic: bc.debateTopic || `Challenge for ${bc.belt.name}`,
          description: bc.debateDescription,
          category: bc.belt.category || bc.debateCategory,
          challengerId: bc.challengerId,
          challenger: bc.challenger,
          challengeType: 'BELT',
          isBeltChallenge: true,
          beltChallengeId: bc.id,
          belt: bc.belt,
          entryFee: bc.entryFee,
          coinReward: bc.coinReward,
          createdAt: bc.createdAt,
          expiresAt: bc.expiresAt,
          status: bc.status,
        }))

      const combinedChallenges = [...allData, ...beltChallenges]
      const filtered = combinedChallenges.filter((d: any) => {
        if (d.isBeltChallenge) return true
        if (d.challengeType === 'OPEN' || !d.challengeType) return true
        if (d.challengeType === 'DIRECT' || d.challengeType === 'GROUP') {
          if (d.invitedUserIds) {
            try {
              const invitedIds = JSON.parse(d.invitedUserIds)
              return invitedIds.includes(user.id)
            } catch { return false }
          }
          return false
        }
        return true
      })
      setChallenges(filtered)

      // Process user's waiting debates
      if (initialUserWaitingDebates?.debates) {
        let myData = initialUserWaitingDebates.debates.filter((d: any) => d.challengerId === user.id)
        const acceptedBeltChallenges = challengesToMyBelts
          .filter((bc: any) => bc.status === 'ACCEPTED')
          .map((bc: any) => ({
            id: `belt-accepted-${bc.id}`,
            topic: bc.debateTopic || `Challenge for ${bc.belt.name}`,
            description: bc.debateDescription,
            category: bc.belt.category || bc.debateCategory,
            challengerId: bc.challengerId,
            challenger: bc.challenger,
            challengeType: 'BELT',
            isBeltChallenge: true,
            beltChallengeId: bc.id,
            belt: bc.belt,
            status: bc.status,
            debateId: bc.debateId,
            createdAt: bc.createdAt,
          }))
        myData = [...myData, ...acceptedBeltChallenges]
        setMyChallenges(myData)
      }

      setIsLoading(false)
    }
  }, [initialWaitingDebates, initialUserWaitingDebates, initialBeltChallenges])

  // Fallback: fetch independently when no initial data
  useEffect(() => {
    if (initialWaitingDebates) return
    if (user) {
      fetchChallenges()
      fetchPendingRematches()
    }
  }, [user])

  // Listen for custom events to refresh challenges (only when self-fetching)
  useEffect(() => {
    if (!user || initialWaitingDebates) return // Parent handles refresh

    let isMounted = true

    const handleRefresh = () => {
      if (isMounted && document.visibilityState === 'visible') {
        fetchChallenges()
        fetchPendingRematches()
      }
    }

    const timeoutId = setTimeout(() => {
      window.addEventListener('debate-created', handleRefresh)
      window.addEventListener('rematch-requested', handleRefresh)
      window.addEventListener('rematch-accepted', handleRefresh)
      window.addEventListener('belt-challenge-accepted', handleRefresh)
    }, 100)

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      window.removeEventListener('debate-created', handleRefresh)
      window.removeEventListener('rematch-requested', handleRefresh)
      window.removeEventListener('rematch-accepted', handleRefresh)
      window.removeEventListener('belt-challenge-accepted', handleRefresh)
    }
  }, [user])

  const fetchChallenges = async () => {
    if (!user) {
      setIsLoading(false)
      return
    }
    
    try {
      setIsLoading(true)

      // Fetch all data in parallel: waiting debates, belt challenges, and user's waiting debates
      const [allResponse, beltResponse, myResponse] = await Promise.all([
        fetch('/api/debates?status=WAITING', { cache: 'no-store' }),
        fetch('/api/belts/challenges', { cache: 'no-store' }),
        user ? fetch(`/api/debates?userId=${user.id}&status=WAITING`, { cache: 'no-store' }) : Promise.resolve(null),
      ])

      // Process waiting debates
      let allData: any[] = []
      if (allResponse.ok) {
        const responseData = await allResponse.json()
        allData = responseData.debates || (Array.isArray(responseData) ? responseData : [])
      }

      // Process belt challenges (single fetch, reused for both tabs)
      let challengesToMyBelts: any[] = []
      if (beltResponse.ok) {
        const beltData = await beltResponse.json()
        challengesToMyBelts = beltData.challengesToMyBelts || []
      }

      // PENDING belt challenges for "All Challenges" tab
      const beltChallenges = challengesToMyBelts
        .filter((bc: any) => bc.status === 'PENDING')
        .map((bc: any) => ({
          id: `belt-${bc.id}`,
          topic: bc.debateTopic || `Challenge for ${bc.belt.name}`,
          description: bc.debateDescription,
          category: bc.belt.category || bc.debateCategory,
          challengerId: bc.challengerId,
          challenger: bc.challenger,
          challengeType: 'BELT',
          isBeltChallenge: true,
          beltChallengeId: bc.id,
          belt: bc.belt,
          entryFee: bc.entryFee,
          coinReward: bc.coinReward,
          createdAt: bc.createdAt,
          expiresAt: bc.expiresAt,
          status: bc.status,
        }))

      // Combine debate challenges and belt challenges
      const combinedChallenges = [...allData, ...beltChallenges]

      // Filter challenges based on type and user
      if (user) {
        const filtered = combinedChallenges.filter((d: any) => {
          if (d.isBeltChallenge) return true
          if (d.challengeType === 'OPEN' || !d.challengeType) return true
          if (d.challengeType === 'DIRECT' || d.challengeType === 'GROUP') {
            if (d.invitedUserIds) {
              try {
                const invitedIds = JSON.parse(d.invitedUserIds)
                return invitedIds.includes(user.id)
              } catch {
                return false
              }
            }
            return false
          }
          return true
        })
        setChallenges(filtered)
      } else {
        setChallenges(allData.filter((d: any) => d.challengeType === 'OPEN' || !d.challengeType))
      }

      // Process user's challenges
      if (user && myResponse && myResponse.ok) {
        const responseData = await myResponse.json()
        const debates = responseData.debates || (Array.isArray(responseData) ? responseData : [])
        let myData = debates.filter((d: any) => d.challengerId === user.id)

        // Add ACCEPTED belt challenges to "My Challenges" (reuse same belt data)
        const acceptedBeltChallenges = challengesToMyBelts
          .filter((bc: any) => bc.status === 'ACCEPTED')
          .map((bc: any) => ({
            id: `belt-accepted-${bc.id}`,
            topic: bc.debateTopic || `Challenge for ${bc.belt.name}`,
            description: bc.debateDescription,
            category: bc.belt.category || bc.debateCategory,
            challengerId: bc.challengerId,
            challenger: bc.challenger,
            challengeType: 'BELT',
            isBeltChallenge: true,
            beltChallengeId: bc.id,
            belt: bc.belt,
            status: bc.status,
            debateId: bc.debateId,
            createdAt: bc.createdAt,
          }))
        myData = [...myData, ...acceptedBeltChallenges]

        setMyChallenges(myData)
      }
    } catch (error) {
      console.error('Failed to fetch challenges:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeclineBeltChallenge = async (beltChallengeId: string) => {
    setDeclineConfirmId(beltChallengeId)
  }

  const confirmDeclineBeltChallenge = async () => {
    if (!declineConfirmId) return

    setIsDeclining(true)
    try {
      const response = await fetch(`/api/belts/challenge/${declineConfirmId}/decline`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        
        // Check if challenge was already declined (idempotent response)
        if (data.challenge?.status === 'DECLINED') {
          showToast({
            title: 'Challenge Already Declined',
            description: 'This challenge has already been declined',
            type: 'info',
          })
        } else {
          showToast({
            title: 'Challenge Declined',
            description: 'The belt challenge has been declined',
            type: 'success',
          })
        }
        
        // Immediately remove the declined challenge from state
        setChallenges((prev) => prev.filter((c: any) => {
          if (c.isBeltChallenge && c.beltChallengeId === declineConfirmId) {
            return false // Remove this challenge
          }
          return true
        }))
        
        // Always refresh challenges to ensure consistency
        await fetchChallenges()
        
        // Dispatch event to refresh other components
        window.dispatchEvent(new CustomEvent('belt-challenge-declined', { 
          detail: { challengeId: declineConfirmId } 
        }))
        
        setDeclineConfirmId(null)
      } else {
        const error = await response.json()
        // If error is about already declined, treat it as success and refresh
        if (error.error && (error.error.includes('already declined') || error.error.includes('not pending'))) {
          showToast({
            title: 'Challenge Already Declined',
            description: 'This challenge has already been declined',
            type: 'info',
          })
          // Immediately remove the declined challenge from state
          setChallenges((prev) => prev.filter((c: any) => {
            if (c.isBeltChallenge && c.beltChallengeId === declineConfirmId) {
              return false // Remove this challenge
            }
            return true
          }))
          
          // Refresh to ensure consistency
          await fetchChallenges()
          window.dispatchEvent(new CustomEvent('belt-challenge-declined', { 
            detail: { challengeId: declineConfirmId } 
          }))
          setDeclineConfirmId(null)
        } else {
          showToast({
            title: 'Error',
            description: error.error || 'Failed to decline challenge',
            type: 'error',
          })
        }
      }
    } catch (error) {
      console.error('Failed to decline belt challenge:', error)
      showToast({
        title: 'Error',
        description: 'Failed to decline challenge',
        type: 'error',
      })
    } finally {
      setIsDeclining(false)
    }
  }

  const handleAcceptChallenge = async (challengeId: string, isBeltChallenge: boolean = false, beltChallengeId?: string) => {
    try {
      let response: Response
      let data: any

      if (isBeltChallenge && beltChallengeId) {
        // Accept belt challenge
        response = await fetch(`/api/belts/challenge/${beltChallengeId}/accept`, {
          method: 'POST',
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to accept belt challenge')
        }

        data = await response.json()
        
        showToast({
          title: 'Belt Challenge Accepted!',
          description: 'The debate has been created and started',
          type: 'success',
        })

        // Dispatch event to refresh other components BEFORE redirect
        window.dispatchEvent(new CustomEvent('belt-challenge-accepted', { 
          detail: { challengeId: beltChallengeId, debateId: data.debate?.id } 
        }))
        
        // Refresh challenges immediately
        await fetchChallenges()
        
        // Redirect to debate page if created
        if (data.debate?.id) {
          router.push(`/debate/${data.debate.id}?accepted=true`)
        } else {
          router.refresh()
        }
      } else {
        // Accept regular debate challenge
        response = await fetch(`/api/debates/${challengeId}/accept`, {
          method: 'POST',
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to accept challenge')
        }

        data = await response.json()
        
        showToast({
          title: 'Challenge Accepted!',
          description: 'The debate has started',
          type: 'success',
        })

        // Refresh challenges
        fetchChallenges()
        
        // Dispatch event to refresh debate pages
        // Only dispatch if page is fully loaded (not during refresh)
        if (document.readyState === 'complete') {
          window.dispatchEvent(new CustomEvent('debate-accepted', { detail: { debateId: data.id } }))
        }
        
        // Redirect to debate page
        router.push(`/debate/${data.id}?accepted=true`)
      }
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error.message || 'Failed to accept challenge',
        type: 'error',
      })
    }
  }

  const handleDeclineChallenge = async (debateId: string) => {
    setDeclineDebateConfirmId(debateId)
  }

  const confirmDeclineChallenge = async () => {
    const debateId = declineDebateConfirmId
    if (!debateId) return
    setDeclineDebateConfirmId(null)

    try {
      const response = await fetch(`/api/debates/${debateId}/decline`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to decline challenge')
      }

      showToast({
        title: 'Challenge Declined',
        description: 'You have declined this challenge',
        type: 'success',
      })

      // Refresh challenges
      fetchChallenges()
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error.message || 'Failed to decline challenge',
        type: 'error',
      })
    }
  }

  const handleDeleteChallenge = async (debateId: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/debates/${debateId}/delete`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete challenge')
      }

      showToast({
        title: 'Challenge Deleted',
        description: 'Your challenge has been deleted',
        type: 'success',
      })

      setDeleteConfirmId(null)
      fetchChallenges()

      if (document.readyState === 'complete') {
        window.dispatchEvent(new CustomEvent('debate-created'))
      }
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error.message || 'Failed to delete challenge',
        type: 'error',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const [pendingRematches, setPendingRematches] = useState<any[]>(initialPendingRematches || [])

  // Use consolidated data when available, fetch independently only as fallback
  useEffect(() => {
    if (initialPendingRematches) {
      setPendingRematches(initialPendingRematches)
    } else if (user) {
      fetchPendingRematches()
    }
  }, [initialPendingRematches, user])

  const fetchPendingRematches = async () => {
    if (!user) {
      setPendingRematches([])
      return
    }
    
    try {
      const response = await fetch('/api/debates/rematch-pending')
      if (response.ok) {
        const data = await response.json()
        setPendingRematches(data || [])
      } else {
        setPendingRematches([])
      }
    } catch (error) {
      console.error('Failed to fetch pending rematches:', error)
      setPendingRematches([])
    }
  }

  const tabs = [
    { 
      id: 'all', 
      label: 'All Challenges', 
      content: (
        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 bg-bg-tertiary rounded-lg border border-bg-tertiary animate-pulse">
                  <div className="h-4 bg-bg-secondary rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-bg-secondary rounded w-1/2 mb-3"></div>
                  <div className="h-8 bg-bg-secondary rounded"></div>
                </div>
              ))}
            </div>
          ) : challenges.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              title="No Open Challenges"
              description="There are no debates waiting for opponents right now"
            />
          ) : (
            <div className="space-y-3">
              {challenges
                .filter((c) => {
                  // For belt challenges, show them (they're challenges TO the user's belts)
                  if (c.isBeltChallenge) {
                    return true
                  }
                  // Don't show user's own regular challenges
                  return c.challengerId !== user?.id
                })
                .map((challenge: any) => {
                  const isDirect = challenge.challengeType === 'DIRECT'
                  const isGroup = challenge.challengeType === 'GROUP'
                  const isBeltChallenge = challenge.isBeltChallenge
                  const invitedIds = challenge.invitedUserIds 
                    ? (() => {
                        try {
                          return JSON.parse(challenge.invitedUserIds)
                        } catch {
                          return []
                        }
                      })()
                    : []

                  return (
                    <div
                      key={challenge.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        isBeltChallenge ? 'bg-neon-orange/10 border-neon-orange/50 hover:border-neon-orange animate-pulse' :
                        isDirect ? 'bg-cyber-green/5 border-cyber-green/30 hover:border-cyber-green/50' :
                        isGroup ? 'bg-neon-orange/5 border-neon-orange/30 hover:border-neon-orange/50' :
                        'bg-bg-tertiary border-bg-tertiary hover:border-electric-blue'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {challenge.category && (
                            <Badge variant={challenge.category.toLowerCase() as any} size="sm">
                              {challenge.category}
                            </Badge>
                          )}
                          {isBeltChallenge && (
                            <Badge variant="default" size="sm" className="bg-neon-orange/30 text-neon-orange border-neon-orange/50 font-bold">
                              Belt Challenge
                            </Badge>
                          )}
                          {isDirect && (
                            <Badge variant="default" size="sm" className="bg-cyber-green/20 text-cyber-green border-cyber-green/30">
                              Direct
                            </Badge>
                          )}
                          {isGroup && (
                            <Badge variant="default" size="sm" className="bg-neon-orange/20 text-neon-orange border-neon-orange/30">
                              Group ({invitedIds.length})
                            </Badge>
                          )}
                          {user && (isDirect || isGroup) && invitedIds.includes(user.id) && (
                            <Badge variant="default" size="sm" className="bg-electric-blue/20 text-electric-blue border-electric-blue/30">
                              Invited
                            </Badge>
                          )}
                        </div>
                      </div>
                      {isBeltChallenge && challenge.belt && (
                        <div className="mb-2">
                          <p className="text-sm text-text-secondary">Belt:</p>
                          <p className="text-electric-blue font-semibold">{challenge.belt.name}</p>
                        </div>
                      )}
                      <p className="text-text-primary font-semibold mb-2" title={challenge.topic}>
                        {extractTopicFromUrl(challenge.topic)}
                      </p>
                      {/* Show challenge description for belt challenges */}
                      {isBeltChallenge && challenge.description && (
                        <p className="text-text-secondary text-sm mb-2 line-clamp-3">
                          {challenge.description}
                        </p>
                      )}
                      
                      {/* Display images if available */}
                      {challenge.images && Array.isArray(challenge.images) && challenge.images.length > 0 && (
                        <div className="mb-3">
                          <div className={`grid gap-2 ${
                            challenge.images.length === 1 ? 'grid-cols-1' :
                            challenge.images.length === 2 ? 'grid-cols-2' :
                            challenge.images.length === 3 ? 'grid-cols-3' :
                            challenge.images.length === 4 ? 'grid-cols-2' :
                            'grid-cols-2'
                          }`}>
                            {challenge.images.slice(0, 4).map((image: any) => (
                              <div key={image.id || image.url} className="relative aspect-square rounded overflow-hidden border border-bg-secondary bg-bg-secondary">
                                <img
                                  src={image.url}
                                  alt={image.alt || challenge.topic}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mb-3">
                        <Avatar 
                          src={challenge.challenger?.avatarUrl} 
                          username={challenge.challenger?.username} 
                          size="sm" 
                        />
                        <span className="text-text-secondary text-sm">{challenge.challenger?.username}</span>
                        <span className="text-text-muted text-xs">•</span>
                        <span className="text-text-secondary text-xs">ELO: {challenge.challenger?.eloRating}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          className="flex-1 text-sm py-1.5"
                          onClick={() => handleAcceptChallenge(
                            challenge.id,
                            challenge.isBeltChallenge,
                            challenge.beltChallengeId
                          )}
                        >
                          {isBeltChallenge ? 'Accept Belt Challenge' : 'Accept Challenge'}
                        </Button>
                        {(user && (isDirect || isGroup) && invitedIds.includes(user.id)) || (isBeltChallenge && user) ? (
                          <Button
                            variant="secondary"
                            className="text-sm py-1.5 px-3"
                            onClick={() => {
                              if (isBeltChallenge && challenge.beltChallengeId) {
                                handleDeclineBeltChallenge(challenge.beltChallengeId)
                              } else {
                                handleDeclineChallenge(challenge.id)
                              }
                            }}
                          >
                            Decline
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )
    },
    { 
      id: 'my-challenges', 
      label: 'My Challenges', 
      content: (
        <div className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 bg-bg-tertiary rounded-lg border border-bg-tertiary animate-pulse">
                  <div className="h-4 bg-bg-secondary rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-bg-secondary rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Show pending rematch requests for winners at the top */}
              {pendingRematches.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-text-primary mb-3">Pending Rematch Requests</h4>
                  <div className="space-y-3">
                    {pendingRematches.map((rematch) => (
                      <div key={rematch.id} className="p-4 bg-electric-blue/10 rounded-lg border border-electric-blue/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={rematch.category.toLowerCase() as any} size="sm">
                            {rematch.category}
                          </Badge>
                          <Badge variant="default" size="sm" className="bg-electric-blue/20 text-electric-blue border border-electric-blue/30">
                            Rematch Request
                          </Badge>
                        </div>
                        <p className="text-text-primary font-semibold mb-1">{rematch.topic}</p>
                        <p className="text-text-secondary text-xs mb-3">
                          {rematch.requester?.username || 'Someone'} wants a rematch
                        </p>
                        <a 
                          href={`/debate/${rematch.id}`}
                          className="text-xs text-electric-blue hover:text-neon-orange inline-block font-semibold"
                        >
                          View Debate & Respond →
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Show regular challenges */}
              {myChallenges.length === 0 && pendingRematches.length === 0 ? (
                <EmptyState
                  icon={
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  title="No Challenges Created"
                  description="You haven't created any challenges yet"
                />
              ) : myChallenges.length > 0 ? (
                <div className="space-y-3">
                  {pendingRematches.length > 0 && (
                    <h4 className="text-sm font-semibold text-text-primary mb-2">Your Challenges</h4>
                  )}
                  {myChallenges.map((challenge) => {
                const isAcceptedBeltChallenge = challenge.isBeltChallenge && challenge.status === 'ACCEPTED'
                return (
                    <div key={challenge.id} className={`p-4 rounded-lg border ${
                      isAcceptedBeltChallenge 
                        ? 'bg-cyber-green/10 border-cyber-green/30' 
                        : 'bg-bg-tertiary border-bg-tertiary'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={challenge.category?.toLowerCase() as any} size="sm">
                          {challenge.category}
                        </Badge>
                        {isAcceptedBeltChallenge && (
                          <Badge variant="default" size="sm" className="bg-cyber-green/20 text-cyber-green border-cyber-green/30">
                            Accepted
                          </Badge>
                        )}
                        {challenge.isBeltChallenge && (
                          <Badge variant="default" size="sm" className="bg-neon-orange/30 text-neon-orange border-neon-orange/50 font-bold">
                            Belt Challenge
                          </Badge>
                        )}
                      </div>
                      <p className="text-text-primary font-semibold mb-2" title={challenge.topic}>
                        {extractTopicFromUrl(challenge.topic)}
                      </p>
                      {isAcceptedBeltChallenge && challenge.debateId && (
                        <div className="mt-3">
                          <Link href={`/debate/${challenge.debateId}`}>
                            <Button variant="primary" size="sm" className="w-full">
                              View Debate
                            </Button>
                          </Link>
                        </div>
                      )}
                      
                      {/* Display images if available */}
                      {challenge.images && Array.isArray(challenge.images) && challenge.images.length > 0 && (
                        <div className="mb-3">
                          <div className={`grid gap-2 ${
                            challenge.images.length === 1 ? 'grid-cols-1' :
                            challenge.images.length === 2 ? 'grid-cols-2' :
                            challenge.images.length === 3 ? 'grid-cols-3' :
                            challenge.images.length === 4 ? 'grid-cols-2' :
                            'grid-cols-2'
                          }`}>
                            {challenge.images.slice(0, 4).map((image: any) => (
                              <div key={image.id || image.url} className="relative aspect-square rounded overflow-hidden border border-bg-secondary bg-bg-secondary">
                                <img
                                  src={image.url}
                                  alt={image.alt || challenge.topic}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {!isAcceptedBeltChallenge && (
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-text-secondary text-xs">
                            Waiting for opponent...
                          </p>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-xs py-1 px-3"
                            onClick={() => setDeleteConfirmId(challenge.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
                </div>
              ) : null}
            </div>
          )}
        </div>
      )
    },
  ]

  return (
    <>
      <Tabs tabs={tabs} />
      
      {/* Decline Confirmation Modal */}
      <Modal
        isOpen={!!declineConfirmId}
        onClose={() => {
          if (!isDeclining) {
            setDeclineConfirmId(null)
          }
        }}
        title="Decline Belt Challenge"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to decline this belt challenge? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                if (!isDeclining) {
                  setDeclineConfirmId(null)
                }
              }}
              disabled={isDeclining}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeclineBeltChallenge}
              isLoading={isDeclining}
            >
              Decline Challenge
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => {
          if (!isDeleting) {
            setDeleteConfirmId(null)
          }
        }}
        title="Delete Challenge"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to delete this challenge? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                if (!isDeleting) {
                  setDeleteConfirmId(null)
                }
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteConfirmId) {
                  handleDeleteChallenge(deleteConfirmId)
                }
              }}
              isLoading={isDeleting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Decline Debate Challenge Modal */}
      <Modal
        isOpen={!!declineDebateConfirmId}
        onClose={() => setDeclineDebateConfirmId(null)}
        title="Decline Challenge"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to decline this challenge?
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => setDeclineDebateConfirmId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeclineChallenge}
            >
              Decline
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
})
