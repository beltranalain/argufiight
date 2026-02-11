'use client'

import dynamic from 'next/dynamic'
import { Card, CardBody } from '@/components/ui/Card'

const VerdictDisplay = dynamic(() => import('./VerdictDisplay').then(m => ({ default: m.VerdictDisplay })), {
  loading: () => <div className="animate-pulse bg-bg-tertiary rounded-xl h-64" />,
})

const KingOfTheHillVerdictDisplay = dynamic(
  () => import('./KingOfTheHillVerdictDisplay').then(m => ({ default: m.KingOfTheHillVerdictDisplay })),
  { loading: () => <div className="animate-pulse bg-bg-tertiary rounded-xl h-64" /> }
)

const AppealButton = dynamic(() => import('./AppealButton').then(m => ({ default: m.AppealButton })))
const RematchButton = dynamic(() => import('./RematchButton').then(m => ({ default: m.RematchButton })))
const BeltTransferAnimation = dynamic(() => import('./BeltTransferAnimation').then(m => ({ default: m.BeltTransferAnimation })))
const OnboardingCongrats = dynamic(() => import('../onboarding/OnboardingCongrats').then(m => ({ default: m.OnboardingCongrats })))

interface Verdict {
  id: string
  createdAt: Date | string
  judge: { id: string; name: string; emoji: string; personality: string }
  decision: 'CHALLENGER_WINS' | 'OPPONENT_WINS' | 'TIE'
  reasoning: string
  challengerScore: number | null
  opponentScore: number | null
  winnerId: string | null
}

interface DebateVerdictsProps {
  debate: {
    id: string
    status: string
    topic: string
    challenger: { id: string; username: string; avatarUrl: string | null }
    opponent: { id: string; username: string; avatarUrl: string | null } | null
    winnerId: string | null
    verdicts?: Verdict[]
    verdictDate: Date | string | null
    appealedAt: Date | string | null
    appealStatus: string | null
    appealCount: number
    originalWinnerId: string | null
    appealReason: string | null
    appealedStatements: string | null
    appealRejectionReason: string | null
    appealedBy: string | null
    appealedByUser?: { id: string; username: string; avatarUrl: string | null } | null
    rematchRequestedBy: string | null
    rematchRequestedAt: Date | string | null
    rematchStatus: string | null
    challengeType?: string
    isOnboardingDebate?: boolean
    hasBeltAtStake?: boolean
    beltStakeType?: string | null
    stakedBelt?: {
      id: string; name: string; designImageUrl: string | null
      currentHolderId: string | null
    } | null
    participants?: Array<{ id: string; userId: string; position: string; status: string; user: { id: string; username: string; avatarUrl: string | null; eloRating: number } }>
    tournamentMatch?: {
      id: string
      tournament: {
        id: string; name: string; format?: string; currentRound: number; totalRounds: number
        participants?: Array<{ id: string; userId: string; cumulativeScore: number | null; eliminationRound: number | null; eliminationReason: string | null; status: string; user: { id: string; username: string; avatarUrl: string | null; eloRating: number } }>
      }
      round: { roundNumber: number }
    } | null
  }
  userId?: string
  showBeltTransfer: boolean
  showOnboardingCongrats: boolean
  onBeltTransferComplete: () => void
  onOnboardingClose: () => void
  onRefresh: () => void
}

export function DebateVerdicts({
  debate,
  userId,
  showBeltTransfer,
  showOnboardingCongrats,
  onBeltTransferComplete,
  onOnboardingClose,
  onRefresh,
}: DebateVerdictsProps) {
  const hasVerdicts = debate.verdicts && debate.verdicts.length > 0

  // Onboarding congrats
  if (showOnboardingCongrats && debate.isOnboardingDebate && hasVerdicts && userId && debate.opponent) {
    const challengerTotal = debate.verdicts!.reduce((sum, v) => sum + (v.challengerScore || 0), 0)
    const opponentTotal = debate.verdicts!.reduce((sum, v) => sum + (v.opponentScore || 0), 0)
    const isChallenger = userId === debate.challenger.id
    const myScore = isChallenger ? challengerTotal : opponentTotal
    const theirScore = isChallenger ? opponentTotal : challengerTotal
    const result = debate.winnerId === userId ? 'won' as const : debate.winnerId ? 'lost' as const : 'tie' as const
    return (
      <OnboardingCongrats
        result={result}
        topic={debate.topic}
        challengerScore={myScore}
        opponentScore={theirScore}
        aiOpponentName={debate.opponent.username}
        onClose={onOnboardingClose}
      />
    )
  }

  // Belt transfer animation
  if (
    showBeltTransfer &&
    debate.hasBeltAtStake &&
    debate.stakedBelt &&
    debate.winnerId &&
    debate.opponent &&
    debate.beltStakeType === 'CHALLENGE' &&
    debate.winnerId === debate.challenger.id
  ) {
    return (
      <BeltTransferAnimation
        beltName={debate.stakedBelt.name}
        beltImageUrl={debate.stakedBelt.designImageUrl}
        fromUser={{ id: debate.opponent.id, username: debate.opponent.username, avatarUrl: debate.opponent.avatarUrl }}
        toUser={{ id: debate.challenger.id, username: debate.challenger.username, avatarUrl: debate.challenger.avatarUrl }}
        onComplete={onBeltTransferComplete}
      />
    )
  }

  const beltWon = debate.hasBeltAtStake && debate.stakedBelt && debate.winnerId
    ? { name: debate.stakedBelt.name, imageUrl: debate.stakedBelt.designImageUrl }
    : null

  // King of the Hill verdict
  if (
    debate.status === 'VERDICT_READY' &&
    hasVerdicts &&
    debate.challengeType === 'GROUP' &&
    debate.tournamentMatch?.tournament?.format === 'KING_OF_THE_HILL'
  ) {
    return (
      <KingOfTheHillVerdictDisplay
        verdicts={debate.verdicts!}
        participants={debate.participants || []}
        tournamentParticipants={debate.tournamentMatch.tournament.participants || []}
        currentUserId={userId}
        currentRoundNumber={debate.tournamentMatch?.round?.roundNumber || null}
      />
    )
  }

  // Regular verdict
  if (debate.status === 'VERDICT_READY' && hasVerdicts && debate.opponent && debate.challengeType !== 'GROUP') {
    return (
      <>
        <VerdictDisplay
          verdicts={debate.appealedAt && debate.verdicts
            ? debate.verdicts.filter((v) => {
                const verdictDate = v.createdAt ? new Date(v.createdAt as string) : null
                const appealDate = new Date(debate.appealedAt as string)
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
          currentUserId={userId}
          appealStatus={debate.appealStatus}
          originalWinnerId={debate.originalWinnerId}
          appealRejectionReason={debate.appealRejectionReason}
          beltWon={beltWon}
        />
        {userId && !debate.tournamentMatch && (
          <>
            <AppealButton
              debateId={debate.id}
              verdictDate={debate.verdictDate}
              appealCount={debate.appealCount}
              appealStatus={debate.appealStatus}
              isLoser={userId !== debate.winnerId && (userId === debate.challenger.id || userId === debate.opponent.id)}
              verdicts={debate.verdicts || []}
              onAppealSubmitted={() => {}}
            />
            <RematchButton
              debateId={debate.id}
              rematchRequestedBy={debate.rematchRequestedBy}
              rematchRequestedAt={debate.rematchRequestedAt}
              rematchStatus={debate.rematchStatus}
              isLoser={userId !== debate.winnerId && debate.winnerId !== null && (userId === debate.challenger.id || userId === debate.opponent.id)}
              onRematchRequested={onRefresh}
            />
          </>
        )}
      </>
    )
  }

  // Appealed verdict
  if (debate.status === 'APPEALED' && hasVerdicts && debate.opponent) {
    return (
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
                        : userId === debate.appealedBy
                        ? 'Your Appeal Reason:'
                        : 'Appeal Reason:'}
                    </p>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap">{debate.appealReason}</p>
                  </div>
                  {debate.appealedStatements && (() => {
                    try {
                      const verdictIds = JSON.parse(debate.appealedStatements) as string[]
                      return (
                        <div>
                          <p className="text-xs font-semibold text-electric-blue mb-2">Appealed Judge Verdicts:</p>
                          <div className="space-y-2">
                            {verdictIds.map((verdictId) => {
                              const verdict = debate.verdicts?.find(v => v.id === verdictId)
                              if (!verdict) return null
                              return (
                                <div key={verdictId} className="text-xs text-text-secondary bg-bg-tertiary p-2 rounded">
                                  <span className="font-semibold">{verdict.judge.name}</span> ({verdict.judge.personality}): {verdict.reasoning.substring(0, 100)}{verdict.reasoning.length > 100 ? '...' : ''}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    } catch { return null }
                  })()}
                </div>
              )}
            </div>
          </CardBody>
        </Card>
        <VerdictDisplay
          verdicts={debate.appealedAt && debate.verdicts
            ? debate.verdicts.filter((v) => {
                const verdictDate = v.createdAt ? new Date(v.createdAt as string) : null
                const appealDate = new Date(debate.appealedAt as string)
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
          currentUserId={userId}
          appealStatus={debate.appealStatus}
          originalWinnerId={debate.originalWinnerId}
          appealRejectionReason={debate.appealRejectionReason}
          beltWon={beltWon}
        />
      </>
    )
  }

  return null
}
