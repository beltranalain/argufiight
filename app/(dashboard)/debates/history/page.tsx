'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { DebateCard } from '@/components/debate/DebateCard'
import { LoadingSpinner } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'

interface Debate {
  id: string
  topic: string
  description: string | null
  category: string
  challenger: {
    id: string
    username: string
    avatarUrl: string | null
  }
  opponent: {
    id: string
    username: string
    avatarUrl: string | null
  } | null
  challengerPosition: string
  opponentPosition: string
  currentRound: number
  totalRounds: number
  status: string
  roundDeadline: Date | string | null
  spectatorCount: number
  winnerId: string | null
  endedAt: Date | string | null
}

export default function DebatesHistoryPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [debates, setDebates] = useState<Debate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchDebates()
    }
  }, [user, activeTab])

  // Update activeTab when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
  }

  const fetchDebates = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      params.append('userId', user?.id || '')
      
      if (activeTab === 'completed') {
        params.append('status', 'COMPLETED,VERDICT_READY')
      } else if (activeTab === 'active') {
        params.append('status', 'ACTIVE')
      } else if (activeTab === 'waiting') {
        params.append('status', 'WAITING')
      }
      // 'all' tab shows all debates

      const response = await fetch(`/api/debates?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setDebates(data)
      }
    } catch (error) {
      console.error('Failed to fetch debates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black">
        <TopNav currentPanel="DEBATE HISTORY" />
        <div className="pt-20 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )
    }

    if (debates.length === 0) {
      let emptyState
      if (activeTab === 'all') {
        emptyState = (
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            title="No Debates Yet"
            description="You haven't participated in any debates yet"
            action={{
              label: 'Create Debate',
              onClick: () => router.push('/'),
            }}
          />
        )
      } else if (activeTab === 'active') {
        emptyState = (
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            title="No Active Debates"
            description="You don't have any active debates right now"
          />
        )
      } else if (activeTab === 'completed') {
        emptyState = (
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="No Completed Debates"
            description="Complete a debate to see it here"
          />
        )
      } else {
        emptyState = (
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="No Waiting Debates"
            description="You don't have any debates waiting for opponents"
          />
        )
      }
      return <div className="py-12">{emptyState}</div>
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {debates.map((debate) => (
          <DebateCard key={debate.id} debate={debate} />
        ))}
      </div>
    )
  }

  const tabs = [
    {
      id: 'all',
      label: 'All Debates',
      content: <div className="mt-6">{renderContent()}</div>,
    },
    {
      id: 'active',
      label: 'Active',
      content: <div className="mt-6">{renderContent()}</div>,
    },
    {
      id: 'completed',
      label: 'Completed',
      content: <div className="mt-6">{renderContent()}</div>,
    },
    {
      id: 'waiting',
      label: 'Waiting',
      content: <div className="mt-6">{renderContent()}</div>,
    },
  ]

  return (
    <div className="min-h-screen bg-black">
      <TopNav currentPanel="DEBATE HISTORY" />
      
      <div className="pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-text-primary mb-2">Debate History</h1>
            <p className="text-text-secondary">View all your debates and their outcomes</p>
          </div>

          {/* Tabs */}
          <Card>
            <CardBody className="p-0">
              <Tabs 
                tabs={tabs} 
                defaultTab={activeTab}
                onChange={(tabId) => setActiveTab(tabId)}
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

