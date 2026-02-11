'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DebateInteractions } from './DebateInteractions'
import { SharePrivateDebate } from './SharePrivateDebate'

interface DebateHeaderProps {
  debate: {
    id: string
    topic: string
    description?: string | null
    category: string
    status: string
    isPrivate: boolean
    shareToken: string | null
    isOnboardingDebate?: boolean
    challenger: { id: string }
  }
  userId?: string
  isAccepting: boolean
  onAcceptChallenge: () => void
}

export function DebateHeader({ debate, userId, isAccepting, onAcceptChallenge }: DebateHeaderProps) {
  return (
    <>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Badge variant={debate.category.toLowerCase() as any} className="mb-3">
            {debate.category}
          </Badge>
          <h1 className="text-3xl font-bold text-text-primary mb-2">{debate.topic}</h1>
          {debate.description && (
            <p className="text-text-secondary">{debate.description}</p>
          )}
        </div>
        {debate.status === 'WAITING' && userId && userId !== debate.challenger.id && (
          <Button
            variant="primary"
            onClick={onAcceptChallenge}
            isLoading={isAccepting}
          >
            Accept Challenge
          </Button>
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-bg-tertiary">
        <DebateInteractions debateId={debate.id} />
      </div>
      {debate.isPrivate && debate.shareToken && !debate.isOnboardingDebate && (
        <div className="mt-4 pt-4 border-t border-bg-tertiary">
          <SharePrivateDebate
            debateId={debate.id}
            shareToken={debate.shareToken}
            isPrivate={debate.isPrivate}
          />
        </div>
      )}
    </>
  )
}
