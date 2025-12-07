'use client'

import { useState, useEffect } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tabs } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'

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

export function ChallengesPanel() {
  const [challenges, setChallenges] = useState<any[]>([])
  const [myChallenges, setMyChallenges] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const { showToast } = useToast()

  useEffect(() => {
    if (user) {
      fetchChallenges()
      fetchPendingRematches()
    }
  }, [user])

  // Listen for custom events to refresh challenges
  // Only listen if this component is mounted (not during page refresh)
  useEffect(() => {
    if (!user) return
    
    let isMounted = true
    
    const handleRefresh = () => {
      // Only refresh if component is still mounted and page is visible
      if (isMounted && document.visibilityState === 'visible') {
        fetchChallenges()
        fetchPendingRematches()
      }
    }
    
    // Small delay to avoid catching events from page refresh
    const timeoutId = setTimeout(() => {
      window.addEventListener('debate-created', handleRefresh)
      window.addEventListener('rematch-requested', handleRefresh)
      window.addEventListener('rematch-accepted', handleRefresh)
    }, 100)
    
    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      window.removeEventListener('debate-created', handleRefresh)
      window.removeEventListener('rematch-requested', handleRefresh)
      window.removeEventListener('rematch-accepted', handleRefresh)
    }
  }, [user])

  const fetchChallenges = async () => {
    if (!user) {
      setIsLoading(false)
      return
    }
    
    try {
      setIsLoading(true)
      
      // Fetch all waiting challenges
      const allResponse = await fetch('/api/debates?status=WAITING')
      if (allResponse.ok) {
        const responseData = await allResponse.json()
        // Handle paginated response format: { debates: [...], pagination: {...} }
        // or array format for backwards compatibility
        const allData = responseData.debates || (Array.isArray(responseData) ? responseData : [])
        
        // Debug: Log images for ED Reed debate
        const edReedDebate = allData.find((d: any) => d.id === 'e59863ee-9213-4c16-86a9-bd4c25621048')
        if (edReedDebate) {
          console.log('ED Reed debate in API response:', {
            id: edReedDebate.id,
            topic: edReedDebate.topic,
            hasImages: edReedDebate.images !== null && edReedDebate.images !== undefined,
            imagesCount: edReedDebate.images?.length || 0,
            images: edReedDebate.images
          })
        }
        // Filter challenges based on type and user
        if (user) {
          const filtered = allData.filter((d: any) => {
            // Show open challenges to everyone
            if (d.challengeType === 'OPEN' || !d.challengeType) {
              return true
            }
            // Show direct/group challenges only if user is invited
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
          // For non-logged-in users, only show open challenges
          setChallenges(allData.filter((d: any) => d.challengeType === 'OPEN' || !d.challengeType))
        }
      }

      // Fetch user's challenges
      if (user) {
        const myResponse = await fetch(`/api/debates?userId=${user.id}&status=WAITING`)
        let myData: any[] = []
        if (myResponse.ok) {
          const responseData = await myResponse.json()
          // Handle paginated response format: { debates: [...], pagination: {...} }
          // or array format for backwards compatibility
          const debates = responseData.debates || (Array.isArray(responseData) ? responseData : [])
          // Filter to only show debates where user is the challenger (debates they created)
          myData = debates.filter((d: any) => d.challengerId === user.id)
        }
        
        // Don't show rematch requests in "My Challenges" for the requester
        // They already see it on the debate page
        // Only show regular waiting challenges
        setMyChallenges(myData)
      }
    } catch (error) {
      console.error('Failed to fetch challenges:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptChallenge = async (debateId: string) => {
    try {
      const response = await fetch(`/api/debates/${debateId}/accept`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to accept challenge')
      }

      const debate = await response.json()
      
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
        window.dispatchEvent(new CustomEvent('debate-accepted', { detail: { debateId: debate.id } }))
      }
      
      // Redirect to debate page with cache-busting
      window.location.href = `/debate/${debate.id}?accepted=true&t=${Date.now()}`
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error.message || 'Failed to accept challenge',
        type: 'error',
      })
    }
  }

  const [pendingRematches, setPendingRematches] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      fetchPendingRematches()
    }
  }, [user])

  const fetchPendingRematches = async () => {
    if (!user) {
      setPendingRematches([])
      return
    }
    
    try {
      console.log('Fetching pending rematches for winner:', user.id, user.username)
      const response = await fetch('/api/debates/rematch-pending')
      if (response.ok) {
        const data = await response.json()
        console.log('Pending rematches fetched:', data.length, data)
        setPendingRematches(data || [])
      } else {
        const errorText = await response.text()
        console.error('Failed to fetch pending rematches:', response.status, errorText)
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
                .filter((c) => c.challengerId !== user?.id) // Don't show user's own challenges
                .map((challenge: any) => {
                  const isDirect = challenge.challengeType === 'DIRECT'
                  const isGroup = challenge.challengeType === 'GROUP'
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
                        isDirect ? 'bg-cyber-green/5 border-cyber-green/30 hover:border-cyber-green/50' :
                        isGroup ? 'bg-neon-orange/5 border-neon-orange/30 hover:border-neon-orange/50' :
                        'bg-bg-tertiary border-bg-tertiary hover:border-electric-blue'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={challenge.category.toLowerCase() as any} size="sm">
                            {challenge.category}
                          </Badge>
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
                      <p className="text-text-primary font-semibold mb-2" title={challenge.topic}>
                        {extractTopicFromUrl(challenge.topic)}
                      </p>
                      
                      {/* Display images if available */}
                      {(() => {
                        // Debug logging for ED Reed debate
                        if (challenge.id === 'e59863ee-9213-4c16-86a9-bd4c25621048') {
                          console.log('Rendering ED Reed challenge card:', {
                            id: challenge.id,
                            topic: challenge.topic,
                            images: challenge.images,
                            imagesType: typeof challenge.images,
                            isArray: Array.isArray(challenge.images),
                            length: challenge.images?.length || 0
                          })
                        }
                        return challenge.images && Array.isArray(challenge.images) && challenge.images.length > 0
                      })() && (
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
                                    console.error('Failed to load debate image:', image.url)
                                    e.currentTarget.style.display = 'none'
                                  }}
                                  onLoad={() => {
                                    if (challenge.id === 'e59863ee-9213-4c16-86a9-bd4c25621048') {
                                      console.log('Image loaded successfully:', image.url)
                                    }
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
                      <Button 
                        variant="primary" 
                        className="w-full text-sm py-1.5"
                        onClick={() => handleAcceptChallenge(challenge.id)}
                      >
                        Accept Challenge
                      </Button>
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
                  {myChallenges.map((challenge) => (
                    <div key={challenge.id} className="p-4 bg-bg-tertiary rounded-lg border border-bg-tertiary">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={challenge.category.toLowerCase() as any} size="sm">
                          {challenge.category}
                        </Badge>
                      </div>
                      <p className="text-text-primary font-semibold mb-2" title={challenge.topic}>
                        {extractTopicFromUrl(challenge.topic)}
                      </p>
                      
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
                                    console.error('Failed to load debate image:', image.url)
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <p className="text-text-secondary text-xs">
                        Waiting for opponent...
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      )
    },
  ]

  return <Tabs tabs={tabs} />
}
