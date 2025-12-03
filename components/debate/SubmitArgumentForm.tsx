'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

interface SubmitArgumentFormProps {
  debateId: string
  currentRound: number
  totalRounds: number
  onSuccess?: () => void
}

export function SubmitArgumentForm({ 
  debateId, 
  currentRound, 
  totalRounds,
  onSuccess 
}: SubmitArgumentFormProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim() || content.trim().length < 50) {
      showToast({
        title: 'Error',
        description: 'Argument must be at least 50 characters',
        type: 'error',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/debates/${debateId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: content.trim() }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit argument')
      }

      const data = await response.json()

      showToast({
        title: 'Argument Submitted!',
        description: data.debate.status === 'COMPLETED' 
          ? 'Debate completed! Waiting for AI verdicts...'
          : 'Waiting for opponent to respond...',
        type: 'success',
      })

      setContent('')
      onSuccess?.()
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error.message || 'Failed to submit argument',
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-text-primary mb-2">
          Round {currentRound} of {totalRounds} - Your Argument
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your argument here... (minimum 50 characters)"
          className="w-full px-4 py-3 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-electric-blue transition-colors resize-none min-h-[200px]"
          rows={8}
          maxLength={5000}
          required
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-text-secondary">
            {content.length} / 5000 characters
          </span>
          {content.length > 0 && content.length < 50 && (
            <span className="text-xs text-neon-orange">
              {50 - content.length} more characters needed
            </span>
          )}
        </div>
      </div>

      <Button 
        type="submit" 
        variant="primary" 
        className="w-full"
        isLoading={isSubmitting}
        disabled={content.trim().length < 50}
      >
        Submit Argument
      </Button>
    </form>
  )
}

