'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardBody } from '@/components/ui/Card'
import { DebateCard } from '@/components/debate/DebateCard'
import { LoadingSpinner } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { Tabs } from '@/components/ui/Tabs'
import { AdDisplay } from '@/components/ads/AdDisplay'
import { useDebates } from '@/lib/hooks/queries/useDebates'

const STATUS_MAP: Record<string, string | undefined> = {
  all: undefined,
  active: 'ACTIVE',
  completed: 'COMPLETED,VERDICT_READY',
  waiting: 'WAITING',
}

const EMPTY_MESSAGES: Record<string, { title: string; description: string }> = {
  all: { title: 'No Debates Yet', description: "You haven't participated in any debates yet" },
  active: { title: 'No Active Debates', description: "You don't have any active debates right now" },
  completed: { title: 'No Completed Debates', description: 'Complete a debate to see it here' },
  waiting: { title: 'No Waiting Debates', description: "You don't have any debates waiting for opponents" },
}

export default function DebatesHistoryPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')

  const { data, isLoading, isError, refetch } = useDebates({
    userId: user?.id,
    status: STATUS_MAP[activeTab],
  })

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="DEBATE HISTORY" />
        <div className="pt-20 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const debates = data?.debates || []

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )
    }

    if (isError) {
      return <ErrorDisplay title="Failed to load debates" onRetry={() => refetch()} />
    }

    if (debates.length === 0) {
      const msg = EMPTY_MESSAGES[activeTab] || EMPTY_MESSAGES.all
      return (
        <div className="py-12">
          <EmptyState
            title={msg.title}
            description={msg.description}
            action={activeTab === 'all' ? { label: 'Create Debate', onClick: () => router.push('/') } : undefined}
          />
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {debates.map((debate, index) => (
          <div key={debate.id}>
            <DebateCard debate={debate} />
            {(index + 1) % 10 === 0 && (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 my-6">
                <AdDisplay placement="IN_FEED" context="debates-history" />
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  const tabs = ['all', 'active', 'completed', 'waiting'].map((id) => ({
    id,
    label: id === 'all' ? 'All Debates' : id.charAt(0).toUpperCase() + id.slice(1),
    content: <div className="mt-6">{renderContent()}</div>,
  }))

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="DEBATE HISTORY" />

      <div className="pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-text-primary mb-2">Debate History</h1>
            <p className="text-text-secondary">View all your debates and their outcomes</p>
          </div>

          <Card>
            <CardBody className="p-0">
              <Tabs
                tabs={tabs}
                defaultTab={activeTab}
                onChange={setActiveTab}
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
