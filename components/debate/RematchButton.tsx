'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/lib/hooks/useAuth'

interface RematchButtonProps {
  debateId: string
  rematchRequestedBy: string | null
  rematchRequestedAt: Date | string | null
  rematchStatus: string | null
  isLoser: boolean
  onRematchRequested?: () => void
}

export function RematchButton({
  debateId,
  rematchRequestedBy,
  rematchRequestedAt,
  rematchStatus,
  isLoser,
  onRematchRequested,
}: RematchButtonProps) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [isRequesting, setIsRequesting] = useState(false)
  const [isResponding, setIsResponding] = useState(false)

  // Check if rematch was requested by current user
  const rematchRequestedByCurrentUser = user && rematchRequestedBy === user.id
  const rematchRequestedByOpponent = user && rematchRequestedBy && rematchRequestedBy !== user.id

  // Check if rematch is pending
  const isPending = rematchStatus === 'PENDING'
  const isAccepted = rematchStatus === 'ACCEPTED'
  const isDeclined = rematchStatus === 'DECLINED'

  const handleRequestRematch = async () => {
    if (!user) {
      showToast({
        title: 'Not Authenticated',
        description: 'Please sign in to request a rematch',
        type: 'error',
      })
      return
    }

    setIsRequesting(true)
    try {
      const response = await fetch(`/api/debates/${debateId}/rematch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'request' }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to request rematch')
      }

      showToast({
        title: 'Rematch Requested',
        description: 'Your opponent will be notified of your rematch request',
        type: 'success',
      })

      // Dispatch event to refresh challenges panel
      // Only dispatch if page is fully loaded (not during refresh)
      if (document.readyState === 'complete') {
        window.dispatchEvent(new Event('rematch-requested'))
      }
      onRematchRequested?.()
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error.message || 'Failed to request rematch',
        type: 'error',
      })
    } finally {
      setIsRequesting(false)
    }
  }

  const handleRespondToRematch = async (accept: boolean) => {
    if (!user) {
      showToast({
        title: 'Not Authenticated',
        description: 'Please sign in to respond to rematch',
        type: 'error',
      })
      return
    }

    setIsResponding(true)
    try {
      const response = await fetch(`/api/debates/${debateId}/rematch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: accept ? 'accept' : 'decline' }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${accept ? 'accept' : 'decline'} rematch`)
      }

      const data = await response.json()

      if (accept && data.rematchDebateId) {
        showToast({
          title: 'Rematch Accepted!',
          description: 'A new debate has been created. Redirecting...',
          type: 'success',
        })
        // Dispatch event to refresh challenges panel
        // Only dispatch if page is fully loaded (not during refresh)
        if (document.readyState === 'complete') {
          window.dispatchEvent(new Event('rematch-accepted'))
        }
        // Redirect to the new rematch debate after a short delay
        setTimeout(() => {
          window.location.href = `/debate/${data.rematchDebateId}`
        }, 1500)
      } else {
        showToast({
          title: `Rematch ${accept ? 'Accepted' : 'Declined'}`,
          description: accept ? 'A new debate has been created' : 'Rematch request declined',
          type: accept ? 'success' : 'info',
        })
        if (accept && data.rematchDebateId) {
          // Dispatch event to refresh challenges panel
          window.dispatchEvent(new Event('rematch-accepted'))
          setTimeout(() => {
            window.location.href = `/debate/${data.rematchDebateId}`
          }, 1500)
        } else {
          // Dispatch event to refresh challenges panel when declined
          // Only dispatch if page is fully loaded (not during refresh)
          if (document.readyState === 'complete') {
            window.dispatchEvent(new Event('rematch-declined'))
          }
        }
      }

      onRematchRequested?.()
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error.message || `Failed to ${accept ? 'accept' : 'decline'} rematch`,
        type: 'error',
      })
    } finally {
      setIsResponding(false)
    }
  }

  // Don't show button if rematch is already accepted
  if (isAccepted) {
    return null
  }

  // Show request button for loser if no rematch has been requested
  if (isLoser && !rematchRequestedBy && !isPending && !isDeclined) {
    return (
      <div className="mt-4">
        <Button
          variant="secondary"
          onClick={handleRequestRematch}
          isLoading={isRequesting}
          className="w-full"
        >
          Request Rematch
        </Button>
      </div>
    )
  }

  // Show pending status if current user requested rematch
  if (rematchRequestedByCurrentUser && isPending) {
    return (
      <div className="mt-4 p-4 bg-bg-tertiary rounded-lg border border-electric-blue/30">
        <p className="text-sm text-text-secondary text-center">
          Rematch request sent. Waiting for opponent to respond...
        </p>
      </div>
    )
  }

  // Show accept/decline buttons if opponent requested rematch
  if (rematchRequestedByOpponent && isPending) {
    return (
      <div className="mt-4 space-y-3">
        <div className="p-4 bg-bg-tertiary rounded-lg border border-electric-blue/30">
          <p className="text-sm text-text-primary mb-3 text-center">
            Your opponent has requested a rematch!
          </p>
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={() => handleRespondToRematch(true)}
              isLoading={isResponding}
              className="flex-1"
            >
              Accept Rematch
            </Button>
            <Button
              variant="ghost"
              onClick={() => handleRespondToRematch(false)}
              isLoading={isResponding}
              className="flex-1"
            >
              Decline
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Show declined status
  if (isDeclined) {
    return (
      <div className="mt-4 p-4 bg-bg-tertiary rounded-lg border border-bg-tertiary">
        <p className="text-sm text-text-secondary text-center">
          Rematch request was declined
        </p>
      </div>
    )
  }

  return null
}

