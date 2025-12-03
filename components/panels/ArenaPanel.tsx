'use client'

import { useState, useEffect } from 'react'
import { TrendingTopics } from '@/components/debate/TrendingTopics'
import { DebateCard } from '@/components/debate/DebateCard'
import { LoadingCard } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card, CardBody } from '@/components/ui/Card'
import { CreateDebateModal } from '@/components/debate/CreateDebateModal'
import { StaggerContainer } from '@/components/ui/StaggerContainer'
import { StaggerItem } from '@/components/ui/StaggerItem'

export function ArenaPanel() {
  const [debates, setDebates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [initialDebateData, setInitialDebateData] = useState<{ topic?: string; category?: string } | null>(null)

  useEffect(() => {
    fetchDebates()
  }, [filter])

  // Listen for custom event to refresh debates
  // Only listen if this component is mounted (not during page refresh)
  useEffect(() => {
    let isMounted = true
    
    const handleRefresh = () => {
      // Only refresh if component is still mounted and not during initial load
      if (isMounted && document.visibilityState === 'visible') {
        fetchDebates()
      }
    }
    
    // Small delay to avoid catching events from page refresh
    const timeoutId = setTimeout(() => {
      window.addEventListener('debate-created', handleRefresh)
    }, 100)
    
    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      window.removeEventListener('debate-created', handleRefresh)
    }
  }, [])

  // Listen for custom event to open create debate modal
  useEffect(() => {
    const handleOpenModal = (event: any) => {
      const data = event.detail || {}
      setInitialDebateData(data)
      setIsCreateModalOpen(true)
    }
    
    window.addEventListener('open-create-debate-modal', handleOpenModal as EventListener)
    return () => {
      window.removeEventListener('open-create-debate-modal', handleOpenModal as EventListener)
    }
  }, [])

  const fetchDebates = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'ALL') {
        params.append('category', filter)
      }
      params.append('status', 'ACTIVE')
      
      const response = await fetch(`/api/debates?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch debates: ${response.statusText}`)
      }
      const data = await response.json()
      // Ensure data is an array before setting
      if (Array.isArray(data)) {
        setDebates(data)
      } else if (Array.isArray(data.debates)) {
        setDebates(data.debates)
      } else {
        setDebates([])
      }
    } catch (error) {
      console.error('Failed to fetch debates:', error)
      // Error is logged but we don't show toast to avoid spam
      // The empty state will show if no debates are found
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Trending Topics */}
      <TrendingTopics />

      {/* Live Debates */}
      <div className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h3 className="text-2xl font-bold text-text-primary mb-1">Live Battles</h3>
            <p className="text-text-secondary text-sm">Watch debates unfold in real-time</p>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {['ALL', 'SPORTS', 'TECH', 'POLITICS'].map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`px-3 py-1.5 rounded-lg border-2 text-sm font-semibold transition-all ${
                  filter === category
                    ? 'border-electric-blue bg-electric-blue/10 text-electric-blue'
                    : 'border-bg-tertiary text-text-secondary hover:border-text-secondary'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

      {/* Debate Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <LoadingCard key={i} lines={4} />
          ))}
        </div>
      ) : debates.length === 0 ? (
        <div className="py-12">
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
            title="No Active Debates"
            description="Be the first to start a debate!"
              action={{
                label: 'Create Debate',
                onClick: () => setIsCreateModalOpen(true),
              }}
          />
        </div>
      ) : (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {debates.map((debate: any) => (
            <StaggerItem key={debate.id}>
              <DebateCard debate={debate} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
      </div>

      {/* Create Debate Modal */}
      <CreateDebateModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setInitialDebateData(null)
        }}
        onSuccess={() => {
          fetchDebates()
          setInitialDebateData(null)
        }}
        initialTopic={initialDebateData?.topic}
        initialCategory={initialDebateData?.category as any}
      />
    </div>
  )
}

