'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/lib/hooks/useAuth'

interface ActiveDebate {
  id: string
  topic: string
  category: string
  currentRound: number
  totalRounds: number
  status: string
  challenger: {
    id: string
    username: string
  }
  opponent: {
    id: string
    username: string
  } | null
  images?: Array<{
    id: string
    url: string
    alt: string | null
    caption: string | null
    order: number
  }>
}

export function LiveBattlePanel() {
  const { user } = useAuth()
  const [activeDebate, setActiveDebate] = useState<ActiveDebate | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchActiveDebate()
    } else {
      setIsLoading(false)
    }
  }, [user])

  const fetchActiveDebate = async () => {
    try {
      setIsLoading(true)
         const response = await fetch(`/api/debates?userId=${user?.id}&status=ACTIVE`)
           if (response.ok) {
             const data = await response.json()
             // Ensure data is an array
             const debates = Array.isArray(data) ? data : (Array.isArray(data.debates) ? data.debates : [])
             // Get the most recent active debate
             const active = debates.find((d: any) => d.status === 'ACTIVE')
             setActiveDebate(active || null)
           }
    } catch (error) {
      console.error('Failed to fetch active debate:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-2 border-electric-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!activeDebate) {
    return (
      <div>
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="No Active Battle"
          description="Join a debate or wait for your turn to argue"
        />
      </div>
    )
  }

  const progress = (activeDebate.currentRound / activeDebate.totalRounds) * 100
  const isMyTurn = activeDebate.status === 'ACTIVE' && user && (
    activeDebate.challenger.id === user.id || 
    (activeDebate.opponent && activeDebate.opponent.id === user.id)
  )

  return (
    <div className="space-y-4">
      <div>
        <Badge variant={activeDebate.category.toLowerCase() as any} size="sm" className="mb-2">
          {activeDebate.category}
        </Badge>
        <h3 className="text-lg font-bold text-text-primary mb-2 line-clamp-2">
          {activeDebate.topic}
        </h3>
        
        {/* Images */}
        {activeDebate.images && activeDebate.images.length > 0 && (
          <div className="mb-3">
            <div className={`grid gap-2 ${
              activeDebate.images.length === 1 ? 'grid-cols-1' :
              activeDebate.images.length === 2 ? 'grid-cols-2' :
              activeDebate.images.length === 3 ? 'grid-cols-3' :
              activeDebate.images.length === 4 ? 'grid-cols-2' :
              'grid-cols-2'
            }`}>
              {activeDebate.images.slice(0, 4).map((image) => (
                <div key={image.id} className="relative aspect-square rounded overflow-hidden border border-bg-secondary bg-bg-secondary">
                  <img
                    src={image.url}
                    alt={image.alt || activeDebate.topic}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
          <span>Round {activeDebate.currentRound}/{activeDebate.totalRounds}</span>
          {isMyTurn && (
            <Badge variant="default" size="sm" className="bg-neon-orange text-black">
              Your Turn
            </Badge>
          )}
        </div>
        <div className="w-full h-1.5 bg-bg-tertiary rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-electric-blue transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <Link href={`/debate/${activeDebate.id}`}>
        <Button variant="primary" className="w-full">
          {isMyTurn ? 'Continue Debate' : 'View Debate'}
        </Button>
      </Link>
    </div>
  )
}
