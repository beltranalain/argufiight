'use client'

import { useChallenge } from '@/lib/contexts/ChallengeContext'
import { CreateDebateModal } from '@/components/debate/CreateDebateModal'
import { useRouter } from 'next/navigation'

export function ChallengeModal() {
  const { challenge, closeChallenge } = useChallenge()
  const router = useRouter()

  if (!challenge) {
    return null
  }

  const handleSuccess = () => {
    closeChallenge()
    // Refresh the page to update belt data
    router.refresh()
  }

  return (
    <CreateDebateModal
      isOpen={true}
      onClose={closeChallenge}
      onSuccess={handleSuccess}
      beltChallengeMode={true}
      beltId={challenge.beltId}
      opponentId={challenge.opponentId}
      opponentUsername={challenge.opponentUsername}
      beltName={challenge.beltName}
      initialCategory={challenge.beltCategory || undefined}
    />
  )
}
