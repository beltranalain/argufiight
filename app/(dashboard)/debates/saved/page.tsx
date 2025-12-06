'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { DebateCard } from '@/components/debate/DebateCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { TopNav } from '@/components/layout/TopNav'

interface SavedDebate {
  id: string
  topic: string
  category: string
  status: string
  challenger: {
    id: string
    username: string
    avatarUrl: string | null
    eloRating: number
  }
  opponent: {
    id: string
    username: string
    avatarUrl: string | null
    eloRating: number
  } | null
  challengerPosition: string
  opponentPosition: string
  currentRound: number
  totalRounds: number
  roundDeadline: Date | string | null
  spectatorCount: number
  images?: Array<{
    id: string
    url: string
    alt: string | null
    caption: string | null
    order: number
  }>
  savedAt: string
}

export default function SavedDebatesPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [debates, setDebates] = useState<SavedDebate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (user) {
      fetchSavedDebates()
    } else {
      setIsLoading(false)
    }
  }, [user])

  const fetchSavedDebates = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/debates/saved')
      
      if (!response.ok) {
        throw new Error('Failed to fetch saved debates')
      }

      const data = await response.json()
      setDebates(data.debates || [])
      setTotal(data.total || 0)
    } catch (error: any) {
      console.error('Error fetching saved debates:', error)
      showToast({
        title: 'Error',
        description: error.message || 'Failed to load saved debates',
        type: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnsave = async (debateId: string) => {
    try {
      const response = await fetch(`/api/debates/${debateId}/save`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to unsave debate')
      }

      // Remove from list
      setDebates(prev => prev.filter(d => d.id !== debateId))
      setTotal(prev => prev - 1)

      showToast({
        title: 'Debate Unsaved',
        description: 'The debate has been removed from your saved list',
        type: 'success',
      })
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error.message || 'Failed to unsave debate',
        type: 'error',
      })
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="THE ARENA" />
        <div className="container mx-auto px-4 py-8 pt-20">
          <EmptyState
            icon={
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            }
            title="Please Sign In"
            description="You need to be signed in to view your saved debates"
          />
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="THE ARENA" />
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="THE ARENA" />
      <div className="container mx-auto px-4 py-8 pt-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Saved Debates
        </h1>
        <p className="text-text-secondary">
          {total === 0 
            ? 'No saved debates yet'
            : `${total} ${total === 1 ? 'debate' : 'debates'} saved`}
        </p>
      </div>

      {debates.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          }
          title="No Saved Debates"
          description="Debates you save will appear here. Start exploring and save debates you want to revisit!"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {debates.map((debate) => (
            <div key={debate.id} className="relative">
              <DebateCard debate={debate} />
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-4 right-4 z-10"
                onClick={() => handleUnsave(debate.id)}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5zm5 4a1 1 0 10-2 0v4a1 1 0 102 0V9zm4 0a1 1 0 10-2 0v4a1 1 0 102 0V9z" clipRule="evenodd" />
                </svg>
                Unsave
              </Button>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}

