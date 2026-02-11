'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { DebateCard } from '@/components/debate/DebateCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Button } from '@/components/ui/Button'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { useToast } from '@/components/ui/Toast'
import { TopNav } from '@/components/layout/TopNav'
import { useSavedDebates } from '@/lib/hooks/queries/useSavedDebates'
import { useUnsaveDebate } from '@/lib/hooks/mutations/useSaveDebate'

export default function SavedDebatesPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const { data, isLoading, isError, refetch } = useSavedDebates()
  const unsaveDebate = useUnsaveDebate()

  const handleUnsave = (debateId: string) => {
    unsaveDebate.mutate(debateId, {
      onSuccess: () => {
        showToast({ title: 'Debate Unsaved', description: 'The debate has been removed from your saved list', type: 'success' })
      },
      onError: (error: any) => {
        showToast({ title: 'Error', description: error.message || 'Failed to unsave debate', type: 'error' })
      },
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="THE ARENA" />
        <div className="container mx-auto px-4 py-8 pt-20">
          <EmptyState
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

  if (isError) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="THE ARENA" />
        <div className="pt-20">
          <ErrorDisplay title="Failed to load saved debates" onRetry={() => refetch()} />
        </div>
      </div>
    )
  }

  const debates = data?.debates || []
  const total = data?.total || 0

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="THE ARENA" />
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Saved Debates</h1>
          <p className="text-text-secondary">
            {total === 0
              ? 'No saved debates yet'
              : `${total} ${total === 1 ? 'debate' : 'debates'} saved`}
          </p>
        </div>

        {debates.length === 0 ? (
          <EmptyState
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
