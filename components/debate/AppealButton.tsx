'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

interface AppealButtonProps {
  debateId: string
  verdictDate: Date | string | null
  appealCount: number
  appealStatus: string | null
  isLoser: boolean
  verdicts: Array<{
    id: string
    decision: 'CHALLENGER_WINS' | 'OPPONENT_WINS' | 'TIE'
    reasoning: string
    judge: {
      id: string
      name: string
      personality: string
    }
  }>
  onAppealSubmitted?: () => void
}

export function AppealButton({
  debateId,
  verdictDate,
  appealCount,
  appealStatus,
  isLoser,
  verdicts,
  onAppealSubmitted,
}: AppealButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const [appealReason, setAppealReason] = useState<string>('')
  const [selectedVerdicts, setSelectedVerdicts] = useState<Set<string>>(new Set())
  const scrollPositionRef = useRef<number>(0)
  const scrollLockRef = useRef<boolean>(false)
  const { showToast } = useToast()

  // Calculate time remaining for appeal
  useEffect(() => {
    if (!verdictDate) return

    const updateTimeRemaining = () => {
      const verdictTime = new Date(verdictDate).getTime()
      const now = Date.now()
      const hoursSinceVerdict = (now - verdictTime) / (1000 * 60 * 60)
      const hoursRemaining = 48 - hoursSinceVerdict

      if (hoursRemaining <= 0) {
        setTimeRemaining('Expired')
      } else {
        const hours = Math.floor(hoursRemaining)
        const minutes = Math.floor((hoursRemaining - hours) * 60)
        setTimeRemaining(`${hours}h ${minutes}m`)
      }
    }

    updateTimeRemaining()
    const interval = setInterval(updateTimeRemaining, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [verdictDate, appealCount])

  // Scroll lock system
  useEffect(() => {
    if (!scrollLockRef.current) return

    const preventScroll = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      window.scrollTo(0, scrollPositionRef.current)
      document.documentElement.scrollTop = scrollPositionRef.current
      document.body.scrollTop = scrollPositionRef.current
    }

    const lockScroll = () => {
      window.scrollTo(0, scrollPositionRef.current)
      document.documentElement.scrollTop = scrollPositionRef.current
      document.body.scrollTop = scrollPositionRef.current
    }

    // Prevent all scroll events
    window.addEventListener('scroll', preventScroll, { passive: false, capture: true })
    window.addEventListener('wheel', preventScroll, { passive: false, capture: true })
    window.addEventListener('touchmove', preventScroll, { passive: false, capture: true })
    
    // Continuously lock scroll position
    const lockInterval = setInterval(lockScroll, 10)

    return () => {
      window.removeEventListener('scroll', preventScroll, { capture: true })
      window.removeEventListener('wheel', preventScroll, { capture: true })
      window.removeEventListener('touchmove', preventScroll, { capture: true })
      clearInterval(lockInterval)
    }
  }, [scrollLockRef.current])

  // Don't show button if conditions aren't met
  if (!isLoser || appealCount > 0 || appealStatus === 'RESOLVED' || appealStatus === 'DENIED') {
    return null
  }

  // Check if appeal window expired
  if (verdictDate) {
    const verdictTime = new Date(verdictDate).getTime()
    const hoursSinceVerdict = (Date.now() - verdictTime) / (1000 * 60 * 60)
    if (hoursSinceVerdict > 48) {
      return null
    }
  }

  const handleAppeal = async (e?: React.FormEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    
    // Save scroll position BEFORE anything else
    scrollPositionRef.current = window.scrollY || window.pageYOffset || document.documentElement.scrollTop
    
    // Activate scroll lock
    scrollLockRef.current = true
    
    // Force scroll to saved position immediately
    window.scrollTo({ top: scrollPositionRef.current, behavior: 'auto' })
    document.documentElement.scrollTop = scrollPositionRef.current
    document.body.scrollTop = scrollPositionRef.current
    
    setIsSubmitting(true)
    
    try {
      // Validate appeal reason
      if (!appealReason.trim() || appealReason.trim().length < 50) {
        showToast({
          type: 'error',
          title: 'Appeal Reason Required',
          description: 'Please provide a detailed explanation (at least 50 characters) of why you believe the verdict was incorrect.',
        })
        scrollLockRef.current = false
        return
      }

      // Validate at least one statement is selected
      if (selectedVerdicts.size === 0) {
        showToast({
          type: 'error',
          title: 'Select Verdicts',
          description: 'Please select at least one judge verdict that you believe was incorrect.',
        })
        scrollLockRef.current = false
        return
      }

      const response = await fetch(`/api/debates/${debateId}/appeal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: appealReason.trim(),
          verdictIds: Array.from(selectedVerdicts),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit appeal')
      }

      // Keep modal open and scroll locked during state update
      showToast({
        type: 'success',
        title: 'Appeal Submitted',
        description: 'A new verdict will be generated shortly. You will be notified when it\'s ready.',
      })

      // Blur any active element to prevent focus scroll
      const activeElement = document.activeElement as HTMLElement
      if (activeElement && activeElement !== document.body) {
        activeElement.blur()
      }

      // Reset form
      setAppealReason('')
      setSelectedVerdicts(new Set())
      
      // Close modal immediately - don't wait
      setIsModalOpen(false)
      
      // Release scroll lock after modal closes
      setTimeout(() => {
        scrollLockRef.current = false
      }, 500)
      
      // Don't call onAppealSubmitted immediately to prevent page refresh/scroll
      // The appeal status will update naturally or user can refresh manually
      // onAppealSubmitted?.() // Commented out to prevent scroll issue
      
    } catch (error: any) {
      scrollLockRef.current = false
      
      showToast({
        type: 'error',
        title: 'Appeal Failed',
        description: error.message || 'Failed to submit appeal',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show pending/processing status
  if (appealStatus === 'PENDING' || appealStatus === 'PROCESSING') {
    return (
      <div className="w-full p-4 bg-bg-tertiary rounded-lg border border-bg-secondary">
        <p className="text-sm font-semibold text-electric-blue mb-1">
          {appealStatus === 'PENDING' ? 'Appeal Submitted' : 'Processing Appeal'}
        </p>
        <p className="text-xs text-text-secondary">
          {appealStatus === 'PENDING' 
            ? 'Your appeal has been submitted. A new verdict is being generated...'
            : 'New verdict is being generated. This may take a few moments.'}
        </p>
      </div>
    )
  }

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => {
          // Save scroll position when opening modal
          scrollPositionRef.current = window.scrollY || window.pageYOffset || document.documentElement.scrollTop
          setIsModalOpen(true)
        }}
        className="w-full"
      >
        Appeal Verdict
        {timeRemaining && timeRemaining !== 'Expired' && (
          <span className="ml-2 text-xs opacity-75">({timeRemaining})</span>
        )}
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          // Restore scroll when closing without submitting
          if (!isSubmitting) {
            window.scrollTo({ top: scrollPositionRef.current, behavior: 'auto' })
          }
          setIsModalOpen(false)
        }}
        title="Appeal Verdict"
        size="md"
      >
        <form 
          onSubmit={(e) => { 
            e.preventDefault()
            handleAppeal(e)
          }} 
          className="space-y-4"
        >
          <p className="text-text-secondary">
            You are about to appeal this verdict. A new verdict will be generated using different AI judges.
          </p>
          
          <div className="bg-bg-tertiary p-4 rounded-lg space-y-2">
            <p className="text-sm font-semibold text-text-primary">Important:</p>
            <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
              <li>You can only appeal once per debate</li>
              <li>The new verdict will be final (no second appeal)</li>
              <li>ELO ratings will only change if the verdict flips</li>
              <li>This appeal is completely free</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-3">
              Select Judge Verdicts to Appeal <span className="text-neon-orange">*</span>
            </label>
            <p className="text-xs text-text-secondary mb-3">
              Select the specific judge verdicts/reasoning that you believe were incorrect. You can select 2 or all of them.
            </p>
            <div className="space-y-3 max-h-60 overflow-y-auto border border-bg-tertiary rounded-lg p-3 bg-bg-secondary">
              {verdicts.map((verdict) => {
                const isSelected = selectedVerdicts.has(verdict.id)
                return (
                  <label
                    key={verdict.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-electric-blue/10 border-electric-blue/30'
                        : 'bg-bg-tertiary border-bg-tertiary hover:border-bg-secondary'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const newSet = new Set(selectedVerdicts)
                        if (e.target.checked) {
                          newSet.add(verdict.id)
                        } else {
                          newSet.delete(verdict.id)
                        }
                        setSelectedVerdicts(newSet)
                      }}
                      className="mt-1 w-4 h-4 rounded border-bg-tertiary bg-bg-secondary text-electric-blue focus:ring-electric-blue focus:ring-2"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-text-primary">
                          {verdict.judge.name}
                        </span>
                        <span className="text-xs text-text-muted">
                          ({verdict.judge.personality})
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          verdict.decision === 'CHALLENGER_WINS' 
                            ? 'bg-cyber-green/20 text-cyber-green'
                            : verdict.decision === 'OPPONENT_WINS'
                            ? 'bg-neon-orange/20 text-neon-orange'
                            : 'bg-text-muted/20 text-text-muted'
                        }`}>
                          {verdict.decision === 'CHALLENGER_WINS' ? 'Challenger Wins' :
                           verdict.decision === 'OPPONENT_WINS' ? 'Opponent Wins' : 'Tie'}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary line-clamp-3">
                        {verdict.reasoning}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>
            <p className="text-xs text-text-muted mt-2">
              {selectedVerdicts.size} of {verdicts.length} judge verdicts selected
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Appeal Reason <span className="text-neon-orange">*</span>
            </label>
            <textarea
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              placeholder="Explain why you believe the selected judge's reasoning/verdict was incorrect. What specific aspects of the judge's evaluation do you disagree with? What flaws do you see in their reasoning? (Minimum 50 characters)"
              className="w-full px-4 py-3 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-electric-blue transition-colors resize-none"
              rows={6}
              minLength={50}
              maxLength={1000}
              required
            />
            <p className="text-xs text-text-muted mt-1">
              {appealReason.length}/1000 characters (minimum 50 required)
            </p>
          </div>

          {timeRemaining && timeRemaining !== 'Expired' && (
            <p className="text-xs text-text-muted">
              Time remaining: {timeRemaining}
            </p>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setAppealReason('')
                setSelectedVerdicts(new Set())
                window.scrollTo({ top: scrollPositionRef.current, behavior: 'auto' })
                setIsModalOpen(false)
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              disabled={appealReason.trim().length < 50 || selectedVerdicts.size === 0}
            >
              Submit Appeal
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
