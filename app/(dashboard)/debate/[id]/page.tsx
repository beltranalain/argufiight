'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { SubmitArgumentForm } from '@/components/debate/SubmitArgumentForm'
import { DebateHeader } from '@/components/debate/DebateHeader'
import { DebateParticipants } from '@/components/debate/DebateParticipants'
import { StatementsTimeline } from '@/components/debate/StatementsTimeline'
import { DebateVerdicts } from '@/components/debate/DebateVerdicts'
import { DebateSidebar } from '@/components/debate/DebateSidebar'
import { AdDisplay } from '@/components/ads/AdDisplay'
import { useDebate } from '@/lib/hooks/queries/useDebate'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import { fetchClient } from '@/lib/api/fetchClient'

export default function DebatePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { showToast } = useToast()

  const debateId = params.id as string
  const shareToken = searchParams.get('shareToken') || undefined

  const [isAccepting, setIsAccepting] = useState(false)
  const [showBeltTransfer, setShowBeltTransfer] = useState(false)
  const [showOnboardingCongrats, setShowOnboardingCongrats] = useState(false)
  const onboardingCongratsShownRef = useRef(false)
  const previousStatusRef = useRef<string | null>(null)
  const previousWinnerRef = useRef<string | null>(null)

  const { data: debate, isLoading, isError, refetch } = useDebate(debateId, shareToken)

  // Track status transitions for toasts and belt transfer
  useEffect(() => {
    if (!debate) return

    const prevStatus = previousStatusRef.current
    const prevWinner = previousWinnerRef.current

    if (debate.status === 'ACTIVE' && prevStatus === 'WAITING') {
      showToast({ title: 'Challenge Accepted!', description: 'The debate has started', type: 'success' })
    }

    if (prevStatus && prevStatus !== debate.status) {
      if (debate.status === 'COMPLETED' || debate.status === 'VERDICT_READY') {
        window.dispatchEvent(new CustomEvent('debate-updated', { detail: { debateId: debate.id, status: debate.status } }))
      }
      if (debate.status === 'VERDICT_READY') {
        window.dispatchEvent(new CustomEvent('verdict-ready', { detail: { debateId: debate.id } }))
      }
    }

    if (
      debate.status === 'VERDICT_READY' &&
      debate.hasBeltAtStake &&
      debate.stakedBelt &&
      debate.winnerId &&
      prevWinner !== debate.winnerId &&
      debate.opponent &&
      debate.beltStakeType === 'CHALLENGE' &&
      debate.winnerId === debate.challenger.id
    ) {
      setShowBeltTransfer(true)
    }

    previousStatusRef.current = debate.status
    previousWinnerRef.current = debate.winnerId || null
  }, [debate?.status, debate?.winnerId])

  // Show onboarding congrats when verdict arrives
  useEffect(() => {
    if (
      debate?.isOnboardingDebate &&
      debate.status === 'VERDICT_READY' &&
      debate.verdicts &&
      debate.verdicts.length > 0 &&
      user &&
      !onboardingCongratsShownRef.current
    ) {
      onboardingCongratsShownRef.current = true
      setShowOnboardingCongrats(true)
    }
  }, [debate?.status, debate?.verdicts?.length, debate?.isOnboardingDebate, user])

  // Listen for statement-submitted events
  useEffect(() => {
    const handleStatementSubmitted = () => {
      setTimeout(() => refetch(), 500)
    }
    window.addEventListener('statement-submitted', handleStatementSubmitted)
    return () => window.removeEventListener('statement-submitted', handleStatementSubmitted)
  }, [refetch])

  const handleAcceptChallenge = useCallback(async () => {
    if (!debate) return
    setIsAccepting(true)
    try {
      await fetchClient(`/api/debates/${debate.id}/accept`, { method: 'POST' })
      window.dispatchEvent(new CustomEvent('debate-accepted', { detail: { debateId: debate.id } }))
      showToast({ title: 'Challenge Accepted!', description: 'The debate has started', type: 'success' })
      queryClient.invalidateQueries({ queryKey: ['debate', debateId] })
    } catch (error: any) {
      showToast({ title: 'Error', description: error.message || 'Failed to accept challenge', type: 'error' })
    } finally {
      setIsAccepting(false)
    }
  }, [debate, debateId, queryClient, showToast])

  // --- Computed values ---
  const isGroupChallenge = debate && (
    debate.challengeType === 'GROUP' ||
    (debate.participants && debate.participants.length > 2 && debate.challengeType !== 'ONE_ON_ONE')
  )

  const currentRoundStatements = debate?.statements?.filter((s: any) => s.round === debate.currentRound) || []
  const userSubmitted = currentRoundStatements.some((s: any) => s.author?.id === user?.id)
  const challengerSubmitted = debate ? currentRoundStatements.some((s: any) => s.author?.id === debate.challenger.id) : false
  const opponentSubmitted = debate?.opponent ? currentRoundStatements.some((s: any) => s.author?.id === debate.opponent!.id) : false
  const noStatementsInRound = currentRoundStatements.length === 0

  const isChallenger = debate && user && debate.challenger.id === user.id
  const isOpponent = debate && user && debate.opponent?.id === user.id
  const isGroupParticipant = isGroupChallenge && debate?.participants?.some(
    (p: any) => {
      const pid = p.userId || p.user?.id
      return pid === user?.id && (p.status === 'ACTIVE' || p.status === 'ACCEPTED')
    }
  )

  const isMyTurn = debate && user && debate.status === 'ACTIVE' && (
    isGroupChallenge
      ? isGroupParticipant && !userSubmitted
      : (
          (noStatementsInRound && isChallenger) ||
          (isChallenger && opponentSubmitted && !challengerSubmitted) ||
          (isOpponent && challengerSubmitted && !opponentSubmitted)
        )
  )

  const isParticipant = debate && user && (
    isGroupChallenge
      ? isGroupParticipant
      : (debate.challenger.id === user.id || debate.opponent?.id === user.id)
  )

  const canSubmit = debate && user && debate.status === 'ACTIVE' && !userSubmitted && isParticipant && isMyTurn

  const calculateTimeLeft = (deadline: Date | string | null): string => {
    if (!deadline) return '\u2014'
    const d = deadline instanceof Date ? deadline : new Date(deadline as string)
    if (isNaN(d.getTime())) return '\u2014'
    const diff = d.getTime() - Date.now()
    if (diff <= 0) return 'Time expired'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m left`
  }

  // --- Render ---

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="DEBATE" />
        <div className="pt-16 md:pt-20 flex items-center justify-center min-h-[calc(100vh-64px)] md:min-h-[calc(100vh-80px)]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (isError || !debate) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="DEBATE" />
        <div className="pt-16 md:pt-20">
          <ErrorDisplay
            title="Debate not found"
            message="This debate may have been removed or you don't have access."
            onRetry={() => refetch()}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="DEBATE" />

      <div className="pt-16 md:pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => router.push('/')}>
              &larr; Back
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Debate Info */}
              <Card>
                <CardHeader>
                  <DebateHeader
                    debate={debate}
                    userId={user?.id}
                    isAccepting={isAccepting}
                    onAcceptChallenge={handleAcceptChallenge}
                  />
                </CardHeader>
                <CardBody>
                  {/* Images */}
                  {debate.images && debate.images.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-text-primary mb-4">Debate Images</h3>
                      <div className={`grid gap-4 ${
                        debate.images.length === 1 ? 'grid-cols-1' :
                        debate.images.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                        debate.images.length <= 4 ? 'grid-cols-2' :
                        'grid-cols-2 md:grid-cols-3'
                      }`}>
                        {debate.images.map((image: any) => (
                          <div key={image.id} className="relative group">
                            <div className="relative aspect-square rounded-lg overflow-hidden border border-bg-tertiary bg-bg-tertiary">
                              <img
                                src={image.url}
                                alt={image.alt || debate.topic}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            </div>
                            {image.caption && (
                              <p className="text-sm text-text-secondary mt-2 text-center">{image.caption}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <DebateParticipants
                    isGroupChallenge={!!isGroupChallenge}
                    participants={debate.participants as any}
                    challenger={debate.challenger}
                    opponent={debate.opponent}
                    challengerPosition={debate.challengerPosition || 'PRO'}
                    opponentPosition={debate.opponentPosition || 'CON'}
                    tournamentFormat={debate.tournamentMatch?.tournament?.format}
                    tournamentParticipants={debate.tournamentMatch?.tournament?.participants as any}
                  />

                  {/* Progress bar */}
                  {debate.status === 'ACTIVE' && (
                    <div className="border-t border-bg-tertiary pt-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-text-secondary">Round {debate.currentRound} of {debate.totalRounds}</span>
                        <span className="text-electric-blue font-medium">{calculateTimeLeft(debate.roundDeadline)}</span>
                      </div>
                      <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-electric-blue transition-all"
                          style={{ width: `${(debate.currentRound / debate.totalRounds) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Statements */}
              <StatementsTimeline
                statements={(debate.statements || []) as any}
                currentRound={debate.currentRound}
                challengerId={debate.challenger.id}
                opponentId={debate.opponent?.id || null}
                challengeType={debate.challengeType}
              />

              {/* In-feed Ad */}
              {debate.status === 'VERDICT_READY' && debate.verdicts && debate.verdicts.length > 0 && (
                <AdDisplay placement="IN_FEED" debateId={debate.id} context="debate-verdict" />
              )}

              {/* Submit Form */}
              {canSubmit && (
                <Card id="submit-argument-form">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-neon-orange rounded-full animate-pulse" />
                      <h2 className="text-xl font-bold text-text-primary">Submit Your Argument</h2>
                    </div>
                    <p className="text-sm text-text-secondary mt-2">Round {debate.currentRound} of {debate.totalRounds}</p>
                  </CardHeader>
                  <CardBody>
                    <SubmitArgumentForm
                      debateId={debate.id}
                      currentRound={debate.currentRound}
                      totalRounds={debate.totalRounds}
                      allowCopyPaste={debate.allowCopyPaste !== false}
                      onSuccess={() => setTimeout(() => refetch(), 500)}
                    />
                  </CardBody>
                </Card>
              )}

              {/* Status Messages */}
              {debate.status === 'WAITING' && user?.id === debate.challenger.id && (
                <Card>
                  <CardBody>
                    <p className="text-text-secondary text-center py-4">
                      Waiting for an opponent to accept your challenge...
                    </p>
                  </CardBody>
                </Card>
              )}

              {debate.status === 'COMPLETED' && (
                <Card>
                  <CardBody>
                    <div className="flex flex-col items-center py-6 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-electric-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-electric-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-electric-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <p className="text-electric-blue font-semibold">AI Judges are deliberating...</p>
                      <p className="text-text-secondary text-sm">Verdicts will appear automatically in a few moments</p>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Verdicts */}
              <DebateVerdicts
                debate={debate as any}
                userId={user?.id}
                showBeltTransfer={showBeltTransfer}
                showOnboardingCongrats={showOnboardingCongrats}
                onBeltTransferComplete={() => setShowBeltTransfer(false)}
                onOnboardingClose={() => setShowOnboardingCongrats(false)}
                onRefresh={() => refetch()}
              />
            </div>

            {/* Right Sidebar */}
            <DebateSidebar debateId={debate.id} status={debate.status} />
          </div>
        </div>
      </div>
    </div>
  )
}
