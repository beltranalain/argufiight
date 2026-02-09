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
        const [viewRes, likeRes, saveRes] = await Promise.all([
          fetch(`/api/debates/${debateId}/view`),
          user ? fetch(`/api/debates/${debateId}/like`) : Promise.resolve(null),
          user ? fetch(`/api/debates/${debateId}/save`) : Promise.resolve(null),
        ])

        if (viewRes?.ok) {
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
      // Try to get slug from debate data if available
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
        <>
          <Button
            variant="ghost"
            onClick={handleShare}
            disabled={isToggling}
            className="text-sm"
            title="Share debate"
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
          {/* Social Share Buttons */}
          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={async () => {
                const shareUrl = `${window.location.origin}/debate/${debateId}`
                const text = encodeURIComponent(`Check out this debate on Argu Fight!`)
                window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank', 'width=550,height=420')
                await fetch(`/api/debates/${debateId}/share`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ method: 'twitter' }),
                })
              }}
              className="p-1.5 hover:bg-bg-secondary rounded transition-colors"
              title="Share on Twitter/X"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </button>
            <button
              onClick={async () => {
                const shareUrl = `${window.location.origin}/debate/${debateId}`
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank', 'width=550,height=420')
                await fetch(`/api/debates/${debateId}/share`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ method: 'linkedin' }),
                })
              }}
              className="p-1.5 hover:bg-bg-secondary rounded transition-colors"
              title="Share on LinkedIn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </button>
            <button
              onClick={async () => {
                const shareUrl = `${window.location.origin}/debate/${debateId}`
                const title = encodeURIComponent(document.title || 'Debate on Argu Fight')
                window.open(`https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${title}`, '_blank', 'width=550,height=420')
                await fetch(`/api/debates/${debateId}/share`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ method: 'reddit' }),
                })
              }}
              className="p-1.5 hover:bg-bg-secondary rounded transition-colors"
              title="Share on Reddit"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

