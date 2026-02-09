'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { VoiceToTextButton } from './VoiceToTextButton'

interface SubmitArgumentFormProps {
  debateId: string
  currentRound: number
  totalRounds: number
  allowCopyPaste?: boolean
  onSuccess?: () => void
}

export function SubmitArgumentForm({ 
  debateId, 
  currentRound, 
  totalRounds,
  allowCopyPaste = true,
  onSuccess 
}: SubmitArgumentFormProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showToast } = useToast()

  // Handle paste restriction
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!allowCopyPaste) {
      e.preventDefault()
      showToast({
        title: 'Copy-Paste Disabled',
        description: 'This debate does not allow pasting content. Please type your argument manually.',
        type: 'warning',
      })
    }
  }

  // Disable keyboard shortcuts (Ctrl+V, Cmd+V)
  useEffect(() => {
    if (!allowCopyPaste) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
          e.preventDefault()
          showToast({
            title: 'Copy-Paste Disabled',
            description: 'This debate does not allow pasting content. Please type your argument manually.',
            type: 'warning',
          })
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [allowCopyPaste, showToast])

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

      const debateCompleted = data.debate?.status === 'COMPLETED'
      const roundAdvanced = data.debate?.currentRound > currentRound

      showToast({
        title: 'Argument Submitted!',
        description: debateCompleted
          ? 'Debate completed! AI judges are deliberating...'
          : roundAdvanced
          ? `Round ${data.debate.currentRound} started!`
          : 'Waiting for opponent to respond...',
        type: 'success',
      })

      setContent('')

      // Dispatch statement-submitted for immediate refresh
      window.dispatchEvent(new CustomEvent('statement-submitted', {
        detail: { debateId, round: currentRound }
      }))

      // Dispatch debate-updated if debate completed or round advanced
      if (debateCompleted || roundAdvanced) {
        window.dispatchEvent(new CustomEvent('debate-updated', {
          detail: { debateId, status: data.debate?.status, round: data.debate?.currentRound }
        }))
      }

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
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-text-primary">
            Round {currentRound} of {totalRounds} - Your Argument
          </label>
          <VoiceToTextButton
            onTranscript={(text) => {
              // Append transcribed text to existing content
              setContent((prev) => {
                const newContent = prev ? `${prev} ${text}` : text
                return newContent
              })
            }}
            disabled={isSubmitting}
            className="text-xs"
          />
        </div>
        {!allowCopyPaste && (
          <div className="mb-2 p-2 bg-neon-orange/10 border border-neon-orange/30 rounded-lg flex items-center gap-2">
            <svg className="w-4 h-4 text-neon-orange flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xs text-neon-orange font-medium">
              Copy-paste is disabled for this debate. Please type your argument manually.
            </span>
          </div>
        )}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onPaste={handlePaste}
          placeholder={allowCopyPaste 
            ? "Write your argument here... (minimum 50 characters) or use voice input"
            : "Type your argument here... (minimum 50 characters) - Copy-paste is disabled"}
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

