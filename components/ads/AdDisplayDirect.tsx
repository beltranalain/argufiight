'use client'

import { useState, useEffect } from 'react'

interface AdDisplayDirectProps {
  placement: 'PROFILE_BANNER' | 'POST_DEBATE' | 'DEBATE_WIDGET' | 'IN_FEED' | 'LEADERBOARD_SPONSORED'
  userId?: string
  debateId?: string
  context?: string
}

interface Ad {
  id: string
  bannerUrl: string
  destinationUrl: string
  ctaText: string
}

// DIRECT VERSION: Fetches ad directly via API route (simpler, no complex logic)
export function AdDisplayDirect({ placement, userId, debateId, context }: AdDisplayDirectProps) {
  const [ad, setAd] = useState<Ad | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAd()
  }, [placement, userId, debateId])

  const fetchAd = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      params.append('placement', placement)
      if (userId) params.append('userId', userId)
      if (debateId) params.append('debateId', debateId)
      if (context) params.append('context', context)

      console.log(`[AdDisplayDirect] Fetching ad for ${placement}...`)
      const response = await fetch(`/api/ads/select?${params.toString()}`)
      
      console.log(`[AdDisplayDirect] Response status: ${response.status}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[AdDisplayDirect] API error: ${response.status} - ${errorText}`)
        setError(`API error: ${response.status}`)
        return
      }

      const data = await response.json()
      console.log(`[AdDisplayDirect] API response:`, data)
      
      if (data.ad) {
        console.log(`[AdDisplayDirect] ✅ Ad found: ${data.ad.id}`)
        setAd(data.ad)
      } else {
        console.log(`[AdDisplayDirect] ⚠️ No ad returned`)
        setAd(null)
      }
    } catch (error: any) {
      console.error('[AdDisplayDirect] Fetch error:', error)
      setError(error.message || 'Failed to fetch ad')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClick = async () => {
    if (!ad) return

    // Track click
    try {
      await fetch('/api/ads/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CLICK',
          adId: ad.id,
        }),
      })
    } catch (error) {
      console.error('Failed to track click:', error)
    }

    window.open(ad.destinationUrl, '_blank', 'noopener,noreferrer')
  }

  const handleImpression = async () => {
    if (!ad) return

    try {
      await fetch('/api/ads/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'IMPRESSION',
          adId: ad.id,
        }),
      })
    } catch (error) {
      console.error('Failed to track impression:', error)
    }
  }

  useEffect(() => {
    if (ad) {
      handleImpression()
    }
  }, [ad])

  if (isLoading) {
    return null // Don't show loading state
  }

  if (error) {
    console.error(`[AdDisplayDirect] Error for ${placement}:`, error)
    return null // Don't show error to user
  }

  if (!ad) {
    return null // No ad available
  }

  // Render based on placement
  switch (placement) {
    case 'PROFILE_BANNER':
      return (
        <div className="w-full mb-6">
          <a
            href={ad.destinationUrl}
            onClick={handleClick}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-lg overflow-hidden border border-bg-tertiary hover:border-electric-blue/50 transition-colors"
          >
            <img
              src={ad.bannerUrl}
              alt="Advertisement"
              className="w-full h-auto object-cover max-h-[200px]"
              style={{ minHeight: '100px' }}
              onLoad={handleImpression}
              onError={(e) => {
                console.error('[AdDisplayDirect] Image failed to load:', ad.bannerUrl)
              }}
            />
          </a>
        </div>
      )

    default:
      return null
  }
}
