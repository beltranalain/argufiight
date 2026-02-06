'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface AdDisplayProps {
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
  contractId?: string
  campaignId?: string
  adId?: string // For Basic Ads tracking
}

export function AdDisplay({ placement, userId, debateId, context }: AdDisplayProps) {
  const [ad, setAd] = useState<Ad | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAd()
  }, [placement, userId, debateId])

  const fetchAd = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      params.append('placement', placement)
      if (userId) params.append('userId', userId)
      if (debateId) params.append('debateId', debateId)
      if (context) params.append('context', context)

      // Try new simple banner API first for PROFILE_BANNER
      const apiUrl = placement === 'PROFILE_BANNER' 
        ? '/api/ads/banner' 
        : `/api/ads/select?${params.toString()}`
      
      const response = await fetch(apiUrl, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setAd(data.ad)
      } else {
        if (placement === 'PROFILE_BANNER') {
          const errorText = await response.text()
          console.error('[AdDisplay] API error for PROFILE_BANNER:', response.status, errorText)
        }
      }
    } catch (error) {
      console.error('Failed to fetch ad:', error)
      if (placement === 'PROFILE_BANNER') {
        console.error('[AdDisplay] Fetch error for PROFILE_BANNER:', error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleClick = async () => {
    if (!ad) return

    // Track click
    try {
      const trackData: any = {
        type: 'CLICK',
      }
      
      // For Basic Ads, use adId; for others use contractId/campaignId
      if (ad.contractId || ad.campaignId) {
        if (ad.contractId) trackData.contractId = ad.contractId
        if (ad.campaignId) trackData.campaignId = ad.campaignId
      } else {
        // Basic Ad - use the ad ID
        trackData.adId = ad.id
      }

      await fetch('/api/ads/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackData),
      })
    } catch (error) {
      console.error('Failed to track click:', error)
    }

    // Open destination URL
    window.open(ad.destinationUrl, '_blank', 'noopener,noreferrer')
  }

  const handleImpression = async () => {
    if (!ad) return

    // Track impression (only once per view)
    try {
      const trackData: any = {
        type: 'IMPRESSION',
      }
      
      // For Basic Ads, use adId; for others use contractId/campaignId
      if (ad.contractId || ad.campaignId) {
        if (ad.contractId) trackData.contractId = ad.contractId
        if (ad.campaignId) trackData.campaignId = ad.campaignId
      } else {
        // Basic Ad - use the ad ID
        trackData.adId = ad.id
      }

      await fetch('/api/ads/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackData),
      })
    } catch (error) {
      console.error('Failed to track impression:', error)
    }
  }

  // Track impression on mount
  useEffect(() => {
    if (ad) {
      handleImpression()
    }
  }, [ad])

  // For PROFILE_BANNER, show loading state or ad, but don't hide completely
  if (placement === 'PROFILE_BANNER') {
    if (isLoading) {
      return null // Still return null while loading
    }
    if (!ad) {
      return null
    }
  }

  if (isLoading || !ad) {
    return null // Don't show anything if no ad
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
            />
          </a>
        </div>
      )

    case 'POST_DEBATE':
      return (
        <Card className="mt-6">
          <div className="p-4">
            <a
              href={ad.destinationUrl}
              onClick={handleClick}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src={ad.bannerUrl}
                alt="Advertisement"
                className="w-full h-auto rounded-lg object-contain max-h-[300px]"
                onLoad={handleImpression}
              />
            </a>
          </div>
        </Card>
      )

    case 'DEBATE_WIDGET':
      return (
        <Card className="mb-6">
          <div className="p-4">
            <p className="text-xs text-text-secondary mb-2 uppercase tracking-wide">Sponsored</p>
            <a
              href={ad.destinationUrl}
              onClick={handleClick}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src={ad.bannerUrl}
                alt="Advertisement"
                className="w-full h-auto rounded-lg object-contain"
                onLoad={handleImpression}
              />
            </a>
          </div>
        </Card>
      )

    case 'IN_FEED':
      return (
        <div className="my-6">
          <a
            href={ad.destinationUrl}
            onClick={handleClick}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg overflow-hidden border border-bg-tertiary hover:border-electric-blue/50 transition-colors"
          >
            <img
              src={ad.bannerUrl}
              alt="Advertisement"
              className="w-full h-auto object-contain max-h-[300px]"
              onLoad={handleImpression}
            />
          </a>
        </div>
      )

    case 'LEADERBOARD_SPONSORED':
      return (
        <div className="p-3 bg-electric-blue/10 border border-electric-blue/30 rounded-lg mb-2">
          <p className="text-xs text-electric-blue mb-2 uppercase tracking-wide">Sponsored</p>
          <a
            href={ad.destinationUrl}
            onClick={handleClick}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <img
              src={ad.bannerUrl}
              alt="Advertisement"
              className="w-full h-auto rounded"
              onLoad={handleImpression}
            />
          </a>
        </div>
      )

    default:
      return null
  }
}

