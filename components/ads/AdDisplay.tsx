'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'

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
  contractId: string
  campaignId: string
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

      const response = await fetch(`/api/ads/select?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setAd(data.ad)
      }
    } catch (error) {
      console.error('Failed to fetch ad:', error)
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
          contractId: ad.contractId,
          campaignId: ad.campaignId,
          type: 'CLICK',
        }),
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
      await fetch('/api/ads/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: ad.contractId,
          campaignId: ad.campaignId,
          type: 'IMPRESSION',
        }),
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
              className="w-full h-auto object-contain"
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
                className="w-full h-auto rounded-lg"
                onLoad={handleImpression}
              />
              <div className="mt-3 text-center">
                <button className="px-6 py-2 bg-electric-blue text-white rounded-lg hover:bg-[#00B8E6] transition-colors">
                  {ad.ctaText}
                </button>
              </div>
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
                className="w-full h-auto rounded-lg mb-3"
                onLoad={handleImpression}
              />
              <button className="w-full px-4 py-2 bg-electric-blue text-white rounded-lg hover:bg-[#00B8E6] transition-colors text-sm">
                {ad.ctaText}
              </button>
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
              className="w-full h-auto"
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

