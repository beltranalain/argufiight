'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { SubmitArgumentForm } from '@/components/debate/SubmitArgumentForm'
import { VerdictDisplay } from '@/components/debate/VerdictDisplay'
import { KingOfTheHillVerdictDisplay } from '@/components/debate/KingOfTheHillVerdictDisplay'
import { AppealButton } from '@/components/debate/AppealButton'
import { RematchButton } from '@/components/debate/RematchButton'
import { LiveChat } from '@/components/debate/LiveChat'
import { DebateInteractions } from '@/components/debate/DebateInteractions'
import { CommentsSection } from '@/components/debate/CommentsSection'
import { SharePrivateDebate } from '@/components/debate/SharePrivateDebate'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import { AdDisplay } from '@/components/ads/AdDisplay'
import { BeltTransferAnimation } from '@/components/debate/BeltTransferAnimation'
import { OnboardingCongrats } from '@/components/onboarding/OnboardingCongrats'
import { DEBATE_ACTIVE_POLL_MS, DEBATE_WAITING_POLL_MS, DEBATE_VERDICT_POLL_MS } from '@/lib/constants'

interface Statement {
  id: string
  round: number
  content: string
  author: {
    id: string
    username: string
    avatarUrl: string | null
  }
  createdAt: Date
}

interface Verdict {
  id: string
  createdAt: Date | string
  judge: {
    id: string
    name: string
    emoji: string
    personality: string
  }
  decision: 'CHALLENGER_WINS' | 'OPPONENT_WINS' | 'TIE'
  reasoning: string
  challengerScore: number | null
  opponentScore: number | null
  winnerId: string | null
}

interface DebateImage {
  id: string
  url: string
  alt: string | null
  caption: string | null
  order: number
}

interface Debate {
  id: string
  topic: string
  description: string | null
  category: string
  challenger: {
    id: string
    username: string
    avatarUrl: string | null
    eloRating: number
  }
  opponent: {
    id: string
    username: string
    avatarUrl: string | null
    eloRating: number
  } | null
  challengerPosition: string
  opponentPosition: string
  totalRounds: number
  currentRound: number
  status: string
  roundDeadline: Date | string | null
  allowCopyPaste: boolean
  isPrivate: boolean
  shareToken: string | null
  winnerId: string | null
  verdictDate: Date | string | null
  appealedAt: Date | string | null
  appealStatus: string | null
  appealCount: number
  originalWinnerId: string | null
  appealReason: string | null
  appealedStatements: string | null
  appealRejectionReason: string | null
  appealedBy: string | null
  appealedByUser?: {
    id: string
    username: string
    avatarUrl: string | null
  } | null
  rematchRequestedBy: string | null
  rematchRequestedAt: Date | string | null
  rematchStatus: string | null
  originalDebateId: string | null
  rematchDebateId: string | null
  statements: Statement[]
  verdicts?: Verdict[]
  images?: DebateImage[]
  viewCount: number
  createdAt: Date
  challengeType?: string
  participants?: Array<{
    id: string
    userId: string
    position: string
    status: string
    user: {
      id: string
      username: string
      avatarUrl: string | null
      eloRating: number
    }
  }>
  tournamentMatch?: {
    id: string
    tournament: {
      id: string
      name: string
      currentRound: number
      totalRounds: number
      format?: 'BRACKET' | 'CHAMPIONSHIP' | 'KING_OF_THE_HILL'
      participants?: Array<{
        id: string
        userId: string
        cumulativeScore: number | null
        eliminationRound: number | null
        eliminationReason: string | null
        status: string
        user: {
          id: string
          username: string
          avatarUrl: string | null
          eloRating: number
        }
      }>
    }
    round: {
      roundNumber: number
    }
  } | null
  isOnboardingDebate?: boolean
  hasBeltAtStake?: boolean
  beltStakeType?: string | null
  stakedBelt?: {
    id: string
    name: string
    type: string
    category: string
    designImageUrl: string | null
    currentHolderId: string | null
    currentHolder: {
      id: string
      username: string
      avatarUrl: string | null
    } | null
  } | null
}

export default function DebatePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [debate, setDebate] = useState<Debate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [showBeltTransfer, setShowBeltTransfer] = useState(false)
  const [showOnboardingCongrats, setShowOnboardingCongrats] = useState(false)
  const onboardingCongratsShownRef = useRef(false)
  // No scroll manipulation — browser handles scroll position naturally

  useEffect(() => {
    if (params.id) {
      fetchDebate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  // Auto-refresh based on debate status
  useEffect(() => {
    if (!debate || !user) return

    let intervalMs: number | null = null
    if (debate.status === 'WAITING') {
      intervalMs = DEBATE_WAITING_POLL_MS
    } else if (debate.status === 'ACTIVE') {
      intervalMs = DEBATE_ACTIVE_POLL_MS
    } else if (debate.status === 'COMPLETED') {
      // Fast poll while waiting for AI verdicts
      intervalMs = DEBATE_VERDICT_POLL_MS
    }

    if (!intervalMs) return

    const interval = setInterval(() => {
      fetchDebate(false)
    }, intervalMs)

    return () => clearInterval(interval)
  }, [debate?.status, debate?.id, user])

  // Show onboarding congrats when verdict arrives for onboarding debates
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

  // Listen for statement-submitted events to refresh debate data immediately
  useEffect(() => {
    const handleStatementSubmitted = () => {
      // Small delay to ensure backend has processed the submission
      setTimeout(() => {
        fetchDebate(false)
      }, 500)
    }

    window.addEventListener('statement-submitted', handleStatementSubmitted)
    return () => {
      window.removeEventListener('statement-submitted', handleStatementSubmitted)
    }
  }, [])

  const fetchDebate = async (showLoading = true) => {
    if (!params.id) return

    try {
      // Note: Expired rounds are processed by cron jobs, not from frontend
      // Frontend calls would fail with 401 if CRON_SECRET is set

      if (showLoading) {
        setIsLoading(true)
      }
      
      // Include share token from URL if present
      const urlParams = typeof window !== 'undefined' 
        ? new URLSearchParams(window.location.search)
        : new URLSearchParams()
      const shareToken = urlParams.get('shareToken')
      const url = shareToken 
        ? `/api/debates/${params.id}?shareToken=${shareToken}&t=${Date.now()}`
        : `/api/debates/${params.id}?t=${Date.now()}`
      
      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        }
      })
      if (response.ok) {
        const data = await response.json()
        const previousStatus = debate?.status
        const previousRound = debate?.currentRound
        const previousWinnerId = debate?.winnerId

        setDebate(data)

        // Dispatch events on status transitions so dashboard stays in sync
        if (previousStatus && previousStatus !== data.status) {
          if (data.status === 'COMPLETED' || data.status === 'VERDICT_READY') {
            window.dispatchEvent(new CustomEvent('debate-updated', {
              detail: { debateId: data.id, status: data.status }
            }))
          }
          if (data.status === 'VERDICT_READY') {
            window.dispatchEvent(new CustomEvent('verdict-ready', {
              detail: { debateId: data.id }
            }))
          }
        }

        // Dispatch on round advancement
        if (previousRound && previousRound !== data.currentRound) {
          window.dispatchEvent(new CustomEvent('debate-updated', {
            detail: { debateId: data.id, round: data.currentRound }
          }))
        }

        // If status changed from WAITING to ACTIVE, show a message
        if (data.status === 'ACTIVE' && previousStatus === 'WAITING') {
          showToast({
            title: 'Challenge Accepted!',
            description: 'The debate has started',
            type: 'success',
          })
        }
        
        // Check if belt was transferred (verdict ready, has belt at stake, winner changed)
        // For belt challenges: belt holder is the opponent (defending), challenger is trying to win it
        // Transfer occurs when challenger wins (belt goes from opponent to challenger)
        if (
          data.status === 'VERDICT_READY' &&
          data.hasBeltAtStake &&
          data.stakedBelt &&
          data.winnerId &&
          previousWinnerId !== data.winnerId &&
          data.opponent &&
          data.beltStakeType === 'CHALLENGE' &&
          data.winnerId === data.challenger.id
        ) {
          // Show belt transfer animation (challenger won, belt transferred from opponent to challenger)
          setShowBeltTransfer(true)
        }
      } else {
        if (showLoading) {
          showToast({
            title: 'Error',
            description: 'Debate not found',
            type: 'error',
          })
          router.push('/')
        }
      }
    } catch (error) {
      console.error('Failed to fetch debate:', error)
      if (showLoading) {
        showToast({
          title: 'Error',
          description: 'Failed to load debate',
          type: 'error',
        })
      }
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }

  const handleAcceptChallenge = async () => {
    if (!debate) return

    setIsAccepting(true)
    try {
      const response = await fetch(`/api/debates/${debate.id}/accept`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to accept challenge')
      }

      const updatedDebate = await response.json()
      
      // Update debate state immediately
      setDebate(updatedDebate)
      
      // Dispatch event so other pages can refresh
      window.dispatchEvent(new CustomEvent('debate-accepted', { 
        detail: { debateId: updatedDebate.id } 
      }))

      showToast({
        title: 'Challenge Accepted!',
        description: 'The debate has started',
        type: 'success',
      })
      
      // Refresh to ensure all data is up to date
      setTimeout(() => {
        fetchDebate(true)
      }, 500)
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error.message || 'Failed to accept challenge',
        type: 'error',
      })
    } finally {
      setIsAccepting(false)
    }
  }

  const calculateTimeLeft = (deadline: Date | string | null): string => {
    if (!deadline) return '—'
    
    // Convert string to Date if needed (API returns dates as strings)
    const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline)
    
    // Check if date is valid
    if (isNaN(deadlineDate.getTime())) return '—'
    
    const now = new Date()
    const diff = deadlineDate.getTime() - now.getTime()
    
    if (diff <= 0) return 'Time expired'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${hours}h ${minutes}m left`
  }

  // Check if this is a group challenge (King of the Hill)
  const isGroupChallenge = debate && (
    debate.challengeType === 'GROUP' ||
    (debate.participants && debate.participants.length > 2 && debate.challengeType !== 'ONE_ON_ONE')
  )

  // Check if user is a participant (for both 2-person and group debates)
  const isParticipant = debate && user && (
    isGroupChallenge
      ? (debate.participants && debate.participants.some((p: any) => 
          ((p.userId === user.id) || (p.user?.id === user.id)) && 
          (p.status === 'ACCEPTED' || p.status === 'ACTIVE')
        ))
      : (debate.challenger.id === user.id || (debate.opponent && debate.opponent.id === user.id))
  )

  // Determine if it's user's turn and if they can submit
  const currentRoundStatements = (debate?.statements && Array.isArray(debate.statements))
    ? debate.statements.filter(s => s.round === debate.currentRound)
    : []
  
  const challengerSubmitted = debate && currentRoundStatements.some(
    s => s.author.id === debate.challenger.id
  )
  const opponentSubmitted = debate?.opponent ? currentRoundStatements.some(
    s => s.author.id === debate.opponent!.id
  ) : false
  const userSubmitted = currentRoundStatements.some(
    s => s.author.id === user?.id
  )
  const isChallenger = debate && user && debate.challenger.id === user.id
  const isOpponent = debate && user && debate.opponent && debate.opponent.id === user.id
  
  // For GROUP debates (King of the Hill), check if user is a participant
  // Check both userId (direct field) and user.id (relation) for compatibility
  // Also check if participants array exists and has items
  // Include status check to match isParticipant logic
  const isGroupParticipant = isGroupChallenge && 
    debate?.participants && 
    debate.participants.length > 0 &&
    debate.participants.some(
      p => {
        const participantUserId = (p as any).userId || p.user?.id
        const participantStatus = (p as any).status
        // For King of the Hill, participants should be ACTIVE (they're created as ACTIVE)
        // But also accept ACCEPTED for compatibility
        return participantUserId === user?.id && 
               (participantStatus === 'ACTIVE' || participantStatus === 'ACCEPTED')
      }
  )
  
  const noStatementsInRound = currentRoundStatements.length === 0
  
  // Determine if it's user's turn
  // For GROUP debates: all participants can submit simultaneously (anyone who hasn't submitted yet)
  // For regular debates: challenger goes first, then opponent responds
  const isMyTurn = debate && user && debate.status === 'ACTIVE' && (
    isGroupChallenge
      ? // For GROUP debates: anyone can submit if they haven't submitted yet
        isGroupParticipant && !userSubmitted
      : // For regular debates: turn-based
        (
          // New round (no statements yet): challenger goes first
          (noStatementsInRound && isChallenger) ||
          // Challenger's turn: opponent submitted but challenger hasn't
          (isChallenger && opponentSubmitted && !challengerSubmitted) ||
          // Opponent's turn: challenger submitted but opponent hasn't
          (isOpponent && challengerSubmitted && !opponentSubmitted)
        )
  )

  // For GROUP debates (King of the Hill), use isGroupParticipant instead of isParticipant
  // This allows simultaneous submissions for all participants
  const canSubmit = debate && user && 
    debate.status === 'ACTIVE' &&
    !userSubmitted &&
    (isGroupChallenge ? isGroupParticipant : isParticipant) &&
    isMyTurn

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

  if (!debate) {
    return null
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="DEBATE" />
      
      <div className="pt-16 md:pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => router.push('/')}>
              ← Back
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">

          {/* Debate Info */}
          <Card>
            <CardHeader>
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
                {debate.status === 'WAITING' && user && user.id !== debate.challenger.id && (
                  <Button
                    variant="primary"
                    onClick={handleAcceptChallenge}
                    isLoading={isAccepting}
                  >
                    Accept Challenge
                  </Button>
                )}
              </div>
              {/* Interaction buttons */}
              <div className="mt-4 pt-4 border-t border-bg-tertiary">
                <DebateInteractions debateId={debate.id} />
              </div>
              {/* Share Private Debate Link — hide for onboarding debates */}
              {debate.isPrivate && debate.shareToken && !debate.isOnboardingDebate && (
                <div className="mt-4 pt-4 border-t border-bg-tertiary">
                  <SharePrivateDebate
                    debateId={debate.id}
                    shareToken={debate.shareToken}
                    isPrivate={debate.isPrivate}
                  />
                </div>
              )}
            </CardHeader>
            <CardBody>
              {/* Debate Images */}
              {debate.images && debate.images.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Debate Images</h3>
                  <div className={`grid gap-4 ${
                    debate.images.length === 1 ? 'grid-cols-1' :
                    debate.images.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                    debate.images.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
                    debate.images.length === 4 ? 'grid-cols-2 md:grid-cols-2' :
                    'grid-cols-2 md:grid-cols-3'
                  }`}>
                    {debate.images.map((image) => (
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

              {/* Participants */}
              {isGroupChallenge ? (
                // Show all participants for GROUP debates
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    All Participants ({debate.participants?.length || 0})
                  </h3>
                  {debate.participants && debate.participants.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {debate.participants.map((participant) => {
                        // Get tournament participant data for King of the Hill
                        const tournamentParticipant = debate.tournamentMatch?.tournament?.format === 'KING_OF_THE_HILL'
                          ? debate.tournamentMatch.tournament.participants?.find(
                              (tp) => tp.userId === participant.userId
                            )
                          : null
                        
                        const isEliminated = tournamentParticipant?.status === 'ELIMINATED'
                        const cumulativeScore = tournamentParticipant?.cumulativeScore
                        const eliminationRound = tournamentParticipant?.eliminationRound
                        
                        return (
                          <div 
                            key={participant.id} 
                            className={`flex items-center gap-4 p-3 rounded-lg border ${
                              isEliminated
                                ? 'border-red-500/50 bg-red-500/10'
                                : 'border-bg-tertiary bg-bg-secondary/50'
                            }`}
                          >
                          <Avatar 
                            src={participant.user.avatarUrl}
                            username={participant.user.username}
                            size="lg"
                          />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className={`font-semibold ${
                                  isEliminated ? 'text-red-400' : 'text-text-primary'
                                }`}>
                                  {participant.user.username}
                                </p>
                                {isEliminated && (
                                  <Badge variant="default" size="sm" className="bg-red-500 text-white">
                                    ✗ Eliminated
                                  </Badge>
                                )}
                              </div>
                            <p className="text-sm text-text-secondary">ELO: {participant.user.eloRating}</p>
                              {debate.tournamentMatch?.tournament?.format === 'KING_OF_THE_HILL' && cumulativeScore !== null && (
                                <p className="text-sm text-electric-blue font-semibold mt-1">
                                  Score: {cumulativeScore}/300
                                </p>
                              )}
                              {eliminationRound && (
                                <p className="text-xs text-text-secondary mt-1">
                                  Eliminated in Round {eliminationRound}
                                </p>
                              )}
                              {/* Don't show position for King of the Hill - it's an open debate */}
                              {participant.position && debate.tournamentMatch?.tournament?.format !== 'KING_OF_THE_HILL' && (
                            <Badge variant="default" size="sm" className="mt-1">
                              {participant.position}
                            </Badge>
                              )}
                          </div>
                        </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg border border-bg-tertiary bg-bg-secondary/50">
                      <p className="text-text-secondary">Loading participants...</p>
                    </div>
                  )}
                </div>
              ) : (
                // Show challenger/opponent for regular debates
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="flex items-center gap-4">
                    <Avatar 
                      src={debate.challenger.avatarUrl}
                      username={debate.challenger.username}
                      size="lg"
                    />
                    <div>
                      <p className="font-semibold text-text-primary">{debate.challenger.username}</p>
                      <p className="text-sm text-text-secondary">ELO: {debate.challenger.eloRating}</p>
                      <Badge variant="default" size="sm" className="mt-1">
                        {debate.challengerPosition}
                      </Badge>
                    </div>
                  </div>

                  {debate.opponent ? (
                    <div className="flex items-center gap-4">
                      <Avatar 
                        src={debate.opponent.avatarUrl}
                        username={debate.opponent.username}
                        size="lg"
                      />
                      <div>
                        <p className="font-semibold text-text-primary">{debate.opponent.username}</p>
                        <p className="text-sm text-text-secondary">ELO: {debate.opponent.eloRating}</p>
                        <Badge variant="default" size="sm" className="mt-1">
                          {debate.opponentPosition}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-bg-tertiary flex items-center justify-center">
                        <span className="text-text-muted">?</span>
                      </div>
                      <div>
                        <p className="text-text-secondary">Waiting for opponent...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Progress */}
              {debate.status === 'ACTIVE' && (
                <div className="border-t border-bg-tertiary pt-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-text-secondary">
                      Round {debate.currentRound} of {debate.totalRounds}
                    </span>
                    <span className="text-electric-blue font-medium">
                      {calculateTimeLeft(debate.roundDeadline)}
                    </span>
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
          {debate.statements.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-text-primary">Arguments</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-6">
                  {Array.from({ length: debate.currentRound }).map((_, roundIndex) => {
                    const round = roundIndex + 1
                    const roundStatements = debate.statements.filter(s => s.round === round)
                    
                    return (
                      <div key={round} className="border-b border-bg-tertiary pb-6 last:border-0">
                        <h3 className="text-lg font-semibold text-text-primary mb-4">
                          Round {round}
                        </h3>
                        <div className="space-y-4">
                          {roundStatements.map((statement) => {
                            const isChallenger = statement.author.id === debate.challenger.id
                            const isOpponent = debate.opponent && statement.author.id === debate.opponent.id
                            // For group debates (King of the Hill), show all participants
                            const isGroupDebate = debate.challengeType === 'GROUP'
                            
                            return (
                              <div
                                key={statement.id}
                                className={`p-4 rounded-lg border ${
                                  isChallenger
                                    ? 'bg-bg-secondary border-electric-blue/30'
                                    : isOpponent
                                    ? 'bg-bg-tertiary border-bg-tertiary'
                                    : isGroupDebate
                                    ? 'bg-bg-secondary/50 border-bg-tertiary'
                                    : 'bg-bg-tertiary border-bg-tertiary'
                                }`}
                              >
                                <div className="flex items-center gap-3 mb-3">
                                  <Avatar 
                                    src={statement.author.avatarUrl}
                                    username={statement.author.username}
                                    size="sm"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold text-text-primary text-sm">
                                        {statement.author.username}
                                      </p>
                                      {isGroupDebate && (
                                        <Badge variant="default" size="sm">
                                          Participant
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-text-secondary">
                                      {new Date(statement.createdAt).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-text-secondary whitespace-pre-wrap">
                                  {statement.content}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardBody>
            </Card>
          )}

          {/* IN_FEED Ad - Between Arguments and Verdict */}
          {debate.status === 'VERDICT_READY' && debate.verdicts && debate.verdicts.length > 0 && (
            <AdDisplay
              placement="IN_FEED"
              debateId={debate.id}
              context="debate-verdict"
            />
          )}

          {/* Submit Form */}
          {canSubmit && (
            <Card id="submit-argument-form">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-neon-orange rounded-full animate-pulse" />
                  <h2 className="text-xl font-bold text-text-primary">Submit Your Argument</h2>
                </div>
                <p className="text-sm text-text-secondary mt-2">
                  Round {debate.currentRound} of {debate.totalRounds}
                </p>
              </CardHeader>
              <CardBody>
                <SubmitArgumentForm
                  debateId={debate.id}
                  currentRound={debate.currentRound}
                  totalRounds={debate.totalRounds}
                  allowCopyPaste={debate.allowCopyPaste}
                  onSuccess={() => {
                    // Refresh immediately after submission
                    setTimeout(() => {
                      fetchDebate(false)
                    }, 500)
                  }}
                />
              </CardBody>
            </Card>
          )}

          {/* Status Messages */}
          {debate.status === 'WAITING' && user && user.id === debate.challenger.id && (
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


          {/* Onboarding Congrats Overlay */}
          {showOnboardingCongrats && debate.isOnboardingDebate && debate.verdicts && debate.verdicts.length > 0 && user && debate.opponent && (() => {
            const challengerTotal = debate.verdicts.reduce((sum, v) => sum + (v.challengerScore || 0), 0)
            const opponentTotal = debate.verdicts.reduce((sum, v) => sum + (v.opponentScore || 0), 0)
            const isChallenger = user.id === debate.challenger.id
            const myScore = isChallenger ? challengerTotal : opponentTotal
            const theirScore = isChallenger ? opponentTotal : challengerTotal
            const result = debate.winnerId === user.id ? 'won' as const : debate.winnerId ? 'lost' as const : 'tie' as const
            return (
              <OnboardingCongrats
                result={result}
                topic={debate.topic}
                challengerScore={myScore}
                opponentScore={theirScore}
                aiOpponentName={debate.opponent.username}
                onClose={() => setShowOnboardingCongrats(false)}
              />
            )
          })()}

          {/* King of the Hill GROUP Verdict Display */}
          {debate.status === 'VERDICT_READY' && 
           debate.verdicts && 
           debate.verdicts.length > 0 && 
           debate.challengeType === 'GROUP' &&
           debate.tournamentMatch?.tournament?.format === 'KING_OF_THE_HILL' && (
            <>
              <KingOfTheHillVerdictDisplay
                verdicts={debate.verdicts}
                participants={debate.participants || []}
                tournamentParticipants={debate.tournamentMatch.tournament.participants || []}
                currentUserId={user?.id}
                currentRoundNumber={debate.tournamentMatch?.round?.roundNumber || null}
              />
            </>
          )}

          {/* Belt Transfer Animation */}
          {showBeltTransfer &&
            debate.hasBeltAtStake &&
            debate.stakedBelt &&
            debate.winnerId &&
            debate.opponent &&
            debate.beltStakeType === 'CHALLENGE' &&
            debate.winnerId === debate.challenger.id && (
              <BeltTransferAnimation
                beltName={debate.stakedBelt.name}
                beltImageUrl={debate.stakedBelt.designImageUrl}
                fromUser={{
                  id: debate.opponent.id,
                  username: debate.opponent.username,
                  avatarUrl: debate.opponent.avatarUrl,
                }}
                toUser={{
                  id: debate.challenger.id,
                  username: debate.challenger.username,
                  avatarUrl: debate.challenger.avatarUrl,
                }}
                onComplete={() => setShowBeltTransfer(false)}
              />
            )}

          {/* Regular 2-Person Verdict Display */}
          {debate.status === 'VERDICT_READY' && debate.verdicts && debate.verdicts.length > 0 && debate.opponent && debate.challengeType !== 'GROUP' && (
            <>
              <VerdictDisplay
                verdicts={debate.appealedAt && debate.verdicts
                  ? debate.verdicts.filter((v) => {
                      const verdictDate = v.createdAt ? new Date(v.createdAt) : null
                      const appealDate = new Date(debate.appealedAt!)
                      return verdictDate && verdictDate < appealDate
                    })
                  : debate.verdicts || []}
                challengerName={debate.challenger.username}
                opponentName={debate.opponent.username}
                challengerAvatarUrl={debate.challenger.avatarUrl}
                opponentAvatarUrl={debate.opponent.avatarUrl}
                finalWinnerId={debate.winnerId}
                challengerId={debate.challenger.id}
                opponentId={debate.opponent.id}
                currentUserId={user?.id}
                appealStatus={debate.appealStatus}
                originalWinnerId={debate.originalWinnerId}
                appealRejectionReason={debate.appealRejectionReason}
                beltWon={
                  debate.hasBeltAtStake && 
                  debate.stakedBelt && 
                  debate.winnerId
                    ? {
                        name: debate.stakedBelt.name,
                        imageUrl: debate.stakedBelt.designImageUrl,
                      }
                    : null
                }
              />
              {user && !debate.tournamentMatch && (
                <>
                  <AppealButton
                    debateId={debate.id}
                    verdictDate={debate.verdictDate}
                    appealCount={debate.appealCount}
                    appealStatus={debate.appealStatus}
                    isLoser={user.id !== debate.winnerId && (user.id === debate.challenger.id || user.id === debate.opponent.id)}
                    verdicts={debate.verdicts || []}
                    onAppealSubmitted={() => {
                      // Don't refresh immediately - let user manually refresh or wait for natural update
                      // This prevents scroll jump. User can refresh page manually if needed.
                      // fetchDebate() // Commented out to prevent scroll issue
                    }}
                  />
                  <RematchButton
                    debateId={debate.id}
                    rematchRequestedBy={debate.rematchRequestedBy}
                    rematchRequestedAt={debate.rematchRequestedAt}
                    rematchStatus={debate.rematchStatus}
                    isLoser={user.id !== debate.winnerId && debate.winnerId !== null && (user.id === debate.challenger.id || user.id === debate.opponent.id)}
                    onRematchRequested={() => {
                      fetchDebate()
                    }}
                  />
                </>
              )}
            </>
          )}
          
          {debate.status === 'APPEALED' && debate.verdicts && debate.verdicts.length > 0 && debate.opponent && (
            <>
              <Card>
                <CardBody>
                  <div className="p-4 bg-electric-blue/10 border border-electric-blue/30 rounded-lg mb-4 space-y-3">
                    <div>
                      <p className="text-sm text-electric-blue font-semibold mb-1">
                        {debate.appealStatus === 'PENDING' ? 'Appeal Submitted' : debate.appealStatus === 'PROCESSING' ? 'Processing Appeal' : 'Appeal Resolved'}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {debate.appealStatus === 'PENDING' 
                          ? 'Your appeal has been submitted. A new verdict is being generated...'
                          : debate.appealStatus === 'PROCESSING'
                          ? 'New verdict is being generated. This may take a few moments.'
                          : 'The appeal verdict has been generated. See results below.'}
                      </p>
                    </div>
                    {debate.appealReason && (
                      <div className="pt-3 border-t border-electric-blue/20 space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-electric-blue mb-1">
                            {debate.appealedByUser 
                              ? `${debate.appealedByUser.username}'s Appeal Reason:`
                              : user?.id === debate.appealedBy
                              ? 'Your Appeal Reason:'
                              : 'Appeal Reason:'}
                          </p>
                          <p className="text-sm text-text-secondary whitespace-pre-wrap">{debate.appealReason}</p>
                        </div>
                        {debate.appealedStatements && (
                          <div>
                            <p className="text-xs font-semibold text-electric-blue mb-2">Appealed Judge Verdicts:</p>
                            <div className="space-y-2">
                              {(() => {
                                try {
                                  const verdictIds = JSON.parse(debate.appealedStatements) as string[]
                                  return verdictIds.map((verdictId) => {
                                    const verdict = debate.verdicts?.find(v => v.id === verdictId)
                                    if (!verdict) return null
                                    return (
                                      <div key={verdictId} className="text-xs text-text-secondary bg-bg-tertiary p-2 rounded">
                                        <span className="font-semibold">{verdict.judge.name}</span> ({verdict.judge.personality}): {verdict.reasoning.substring(0, 100)}{verdict.reasoning.length > 100 ? '...' : ''}
                                      </div>
                                    )
                                  })
                                } catch {
                                  return null
                                }
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
              <VerdictDisplay
                verdicts={debate.appealedAt && debate.verdicts
                  ? debate.verdicts.filter((v) => {
                      const verdictDate = v.createdAt ? new Date(v.createdAt) : null
                      const appealDate = new Date(debate.appealedAt!)
                      return verdictDate && verdictDate >= appealDate
                    })
                  : debate.verdicts || []}
                challengerName={debate.challenger.username}
                opponentName={debate.opponent.username}
                challengerAvatarUrl={debate.challenger.avatarUrl}
                opponentAvatarUrl={debate.opponent.avatarUrl}
                finalWinnerId={debate.winnerId}
                challengerId={debate.challenger.id}
                opponentId={debate.opponent.id}
                currentUserId={user?.id}
                appealStatus={debate.appealStatus}
                originalWinnerId={debate.originalWinnerId}
                appealRejectionReason={debate.appealRejectionReason}
                beltWon={
                  debate.hasBeltAtStake && 
                  debate.stakedBelt && 
                  debate.winnerId
                    ? {
                        name: debate.stakedBelt.name,
                        imageUrl: debate.stakedBelt.designImageUrl,
                      }
                    : null
                }
              />
            </>
          )}
            </div>

            {/* Right Sidebar - Live Chat and Comments */}
            <div className="lg:col-span-1 space-y-6">
              {/* Debate Widget Ad */}
              <AdDisplay
                placement="DEBATE_WIDGET"
                debateId={debate.id}
                context="debate-sidebar"
              />

              {/* Live Chat - Show for active, completed, and verdict-ready debates (matches API) */}
              {(debate.status === 'ACTIVE' || debate.status === 'COMPLETED' || debate.status === 'VERDICT_READY') && (
                <Card>
                  <CardHeader>
                    <h2 className="text-xl font-bold text-text-primary">Live Chat</h2>
                    <p className="text-sm text-text-secondary mt-1">
                      Chat with everyone watching this debate
                    </p>
                  </CardHeader>
                  <CardBody className="p-0">
                    <LiveChat debateId={debate.id} />
                  </CardBody>
                </Card>
              )}

              {/* Comments Section - Only show if enabled */}
              <Card className="h-[600px] flex flex-col">
                <CardHeader>
                  <h2 className="text-xl font-bold text-text-primary">Comments</h2>
                  <p className="text-sm text-text-secondary mt-1">
                    Discuss this debate
                  </p>
                </CardHeader>
                <CardBody className="p-0 flex-1 overflow-hidden">
                  <CommentsSection debateId={debate.id} />
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

