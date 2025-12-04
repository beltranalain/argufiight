'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/lib/hooks/useAuth'

interface DebateInteractionsProps {
  debateId: string
}

interface FeatureFlags {
  FEATURE_LIKES_ENABLED: boolean
  FEATURE_SAVES_ENABLED: boolean
  FEATURE_SHARES_ENABLED: boolean
  FEATURE_COMMENTS_ENABLED: boolean
  FEATURE_FOLLOWS_ENABLED: boolean
}

export function DebateInteractions({ debateId }: DebateInteractionsProps) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [viewCount, setViewCount] = useState(0)
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isToggling, setIsToggling] = useState(false)
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>({
    FEATURE_LIKES_ENABLED: true,
    FEATURE_SAVES_ENABLED: true,
    FEATURE_SHARES_ENABLED: true,
    FEATURE_COMMENTS_ENABLED: true,
    FEATURE_FOLLOWS_ENABLED: true,
  })

  // Fetch feature flags
  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const response = await fetch('/api/features')
        if (response.ok) {
          const flags = await response.json()
          setFeatureFlags(flags)
        }
      } catch (error) {
        console.error('Failed to fetch feature flags:', error)
      }
    }
    fetchFeatures()
  }, [])

  // Track view and fetch initial state
  useEffect(() => {
    // Track view (fire and forget - don't wait for it)
    fetch(`/api/debates/${debateId}/view`, { method: 'POST' }).catch(() => {
      // Silently fail if view tracking fails
    })

    const fetchState = async () => {
      try {
        const [debateRes, likeRes, saveRes, viewRes] = await Promise.all([
          fetch(`/api/debates/${debateId}`),
          user ? fetch(`/api/debates/${debateId}/like`) : Promise.resolve(null),
          user ? fetch(`/api/debates/${debateId}/save`) : Promise.resolve(null),
          fetch(`/api/debates/${debateId}/view`),
        ])

        // Get view count from debate data
        if (debateRes?.ok) {
          const debateData = await debateRes.json()
          setViewCount(debateData.viewCount || 0)
        } else if (viewRes?.ok) {
          const viewData = await viewRes.json()
          setViewCount(viewData.viewCount || 0)
        }

        if (likeRes?.ok) {
          const likeData = await likeRes.json()
          setIsLiked(likeData.liked)
          setLikeCount(likeData.count)
        }

        if (saveRes?.ok) {
          const saveData = await saveRes.json()
          setIsSaved(saveData.saved)
        }
      } catch (error) {
        console.error('Failed to fetch interaction state:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchState()
  }, [debateId, user])

  const handleLike = async () => {
    if (!user) {
      showToast({
        type: 'error',
        title: 'Login Required',
        description: 'Please log in to like debates',
      })
      return
    }

    setIsToggling(true)
    try {
      const response = await fetch(`/api/debates/${debateId}/like`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to toggle like')
      }

      const data = await response.json()
      setIsLiked(data.liked)
      setLikeCount((prev) => (data.liked ? prev + 1 : prev - 1))
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to like debate',
      })
    } finally {
      setIsToggling(false)
    }
  }

  const handleSave = async () => {
    if (!user) {
      showToast({
        type: 'error',
        title: 'Login Required',
        description: 'Please log in to save debates',
      })
      return
    }

    setIsToggling(true)
    try {
      const response = await fetch(`/api/debates/${debateId}/save`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to toggle save')
      }

      const data = await response.json()
      setIsSaved(data.saved)
      
      showToast({
        type: 'success',
        title: data.saved ? 'Debate Saved' : 'Debate Unsaved',
        description: data.saved 
          ? 'You can find this debate in your saved debates'
          : 'Debate removed from saved',
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to save debate',
      })
    } finally {
      setIsToggling(false)
    }
  }

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/debate/${debateId}`
      
      // Try Web Share API first (mobile)
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this debate on Argu Fight',
          url: shareUrl,
        })
        
        // Track share
        await fetch(`/api/debates/${debateId}/share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method: 'native_share' }),
        })
      } else {
        // Fallback to copy to clipboard
        await navigator.clipboard.writeText(shareUrl)
        showToast({
          type: 'success',
          title: 'Link Copied',
          description: 'Debate link copied to clipboard',
        })
        
        // Track share
        await fetch(`/api/debates/${debateId}/share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method: 'copy_link' }),
        })
      }
    } catch (error: any) {
      // User cancelled share - that's okay
      if (error.name !== 'AbortError') {
        console.error('Share error:', error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-9 w-20 bg-bg-tertiary rounded animate-pulse" />
        <div className="h-9 w-20 bg-bg-tertiary rounded animate-pulse" />
        <div className="h-9 w-20 bg-bg-tertiary rounded animate-pulse" />
      </div>
    )
  }

  // Don't render if all features are disabled
  if (!featureFlags.FEATURE_LIKES_ENABLED && 
      !featureFlags.FEATURE_SAVES_ENABLED && 
      !featureFlags.FEATURE_SHARES_ENABLED) {
    return null
  }

  return (
    <div className="flex items-center gap-3">
      {/* View Count - Always visible */}
      <div className="flex items-center gap-1.5 text-sm text-text-secondary">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span>{viewCount}</span>
      </div>

      {featureFlags.FEATURE_LIKES_ENABLED && (
        <Button
          variant="ghost"
          onClick={handleLike}
          disabled={isToggling || !user}
          className={`text-sm ${isLiked ? 'text-neon-orange' : ''}`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={isLiked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {likeCount > 0 && <span className="ml-1">{likeCount}</span>}
        </Button>
      )}

      {featureFlags.FEATURE_SAVES_ENABLED && (
        <Button
          variant="ghost"
          onClick={handleSave}
          disabled={isToggling || !user}
          className={`text-sm ${isSaved ? 'text-electric-blue' : ''}`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={isSaved ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </Button>
      )}

      {featureFlags.FEATURE_SHARES_ENABLED && (
        <Button
          variant="ghost"
          onClick={handleShare}
          disabled={isToggling}
          className="text-sm"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </Button>
      )}
    </div>
  )
}

