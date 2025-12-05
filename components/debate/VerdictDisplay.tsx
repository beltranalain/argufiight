'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Fireworks } from './Fireworks'

interface Verdict {
  id: string
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

interface VerdictDisplayProps {
  verdicts: Verdict[]
  challengerName: string
  opponentName: string
  challengerAvatarUrl?: string | null
  opponentAvatarUrl?: string | null
  finalWinnerId: string | null
  challengerId: string
  opponentId: string
  currentUserId?: string | null
  appealStatus?: string | null
  originalWinnerId?: string | null
  appealRejectionReason?: string | null
}

export function VerdictDisplay({ 
  verdicts, 
  challengerName, 
  opponentName,
  challengerAvatarUrl,
  opponentAvatarUrl,
  finalWinnerId,
  challengerId,
  opponentId,
  currentUserId,
  appealStatus,
  originalWinnerId,
  appealRejectionReason
}: VerdictDisplayProps) {
  const [showAnimations, setShowAnimations] = useState(false)

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => setShowAnimations(true), 100)
    return () => clearTimeout(timer)
  }, [])

  if (!verdicts || verdicts.length === 0) {
    return null
  }

  // Use the verdicts passed in (already filtered by parent component)
  const displayedVerdicts = verdicts

  // Check if this is an appeal verdict
  const isAppealVerdict = appealStatus === 'RESOLVED' && originalWinnerId !== null
  const verdictFlipped = originalWinnerId !== null && originalWinnerId !== finalWinnerId

  // Count votes
  const challengerVotes = displayedVerdicts.filter(v => v.decision === 'CHALLENGER_WINS').length
  const opponentVotes = displayedVerdicts.filter(v => v.decision === 'OPPONENT_WINS').length
  const tieVotes = displayedVerdicts.filter(v => v.decision === 'TIE').length

  // Calculate total scores
  const challengerTotalScore = displayedVerdicts.reduce((sum, v) => sum + (v.challengerScore ?? 0), 0)
  const opponentTotalScore = displayedVerdicts.reduce((sum, v) => sum + (v.opponentScore ?? 0), 0)
  const maxPossibleScore = displayedVerdicts.length * 100

  const isChallengerWinner = finalWinnerId === challengerId
  const isOpponentWinner = finalWinnerId === opponentId
  const isTie = !finalWinnerId
  
  // Determine if current user is winner or loser
  const isCurrentUserWinner = currentUserId && finalWinnerId === currentUserId
  const isCurrentUserLoser = currentUserId && finalWinnerId && finalWinnerId !== currentUserId
  const isCurrentUserChallenger = currentUserId === challengerId
  const isCurrentUserOpponent = currentUserId === opponentId

  const getDecisionBadge = (decision: string, winnerName: string, winnerId: string | null) => {
    switch (decision) {
      case 'CHALLENGER_WINS':
        return (
          <Avatar
            src={challengerAvatarUrl || undefined}
            username={challengerName}
            size="md"
            className="border-2 border-cyber-green"
          />
        )
      case 'OPPONENT_WINS':
        return (
          <Avatar
            src={opponentAvatarUrl || undefined}
            username={opponentName}
            size="md"
            className="border-2 border-neon-orange"
          />
        )
      case 'TIE':
        return <Badge variant="default" className="bg-text-muted text-text-primary">Tie</Badge>
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text-primary">
            {isAppealVerdict ? 'Appeal Verdict' : 'AI Judge Verdicts'}
          </h2>
          {finalWinnerId && (
            <Badge variant="default" size="lg" className="bg-electric-blue text-black">
              {finalWinnerId ? 'Verdict Reached' : 'Tie'}
            </Badge>
          )}
        </div>
        {isAppealVerdict && (
          <div className="mt-4 p-4 bg-electric-blue/10 border border-electric-blue/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-base text-electric-blue font-bold">
                Appeal Verdict (Final)
              </p>
              {verdictFlipped && (
                <Badge variant="default" className="bg-cyber-green text-black">
                  Verdict Changed
                </Badge>
              )}
            </div>
            <p className="text-sm text-text-secondary mb-3">
              This is the appeal verdict. The original verdict has been reviewed by different judges.
              {verdictFlipped && (
                <span className="text-cyber-green font-semibold block mt-2">
                  ✓ The verdict has changed! Your appeal was successful.
                </span>
              )}
            </p>
            
            {/* Show reasoning for both approved and rejected appeals - Make it more prominent */}
            {appealRejectionReason && (
              <div className="mt-4 pt-4 border-t-2 border-electric-blue/30 bg-bg-tertiary/50 p-4 rounded-lg">
                {verdictFlipped ? (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-cyber-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-bold text-cyber-green">
                        Appeal Approved - Verdict Changed:
                      </p>
                    </div>
                    <p className="text-base text-text-primary leading-relaxed">
                      {appealRejectionReason}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-neon-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-bold text-neon-orange">
                        Why the appeal did not change the outcome:
                      </p>
                    </div>
                    <p className="text-base text-text-primary leading-relaxed">
                      {appealRejectionReason}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        <div className="flex gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-cyber-green font-semibold">{challengerVotes}</span>
            <span className="text-text-secondary">for {challengerName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neon-orange font-semibold">{opponentVotes}</span>
            <span className="text-text-secondary">for {opponentName}</span>
          </div>
          {tieVotes > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-text-muted font-semibold">{tieVotes}</span>
              <span className="text-text-secondary">Ties</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardBody>
        {/* Winner/Loser Animation */}
        <AnimatePresence>
          {showAnimations && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6"
            >
              {/* Show winner announcement only if current user is the winner */}
              {isCurrentUserWinner && isChallengerWinner && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="relative p-6 bg-gradient-to-r from-cyber-green/20 to-cyber-green/5 border-2 border-cyber-green rounded-xl overflow-hidden"
                >
                  <Fireworks />
                  <motion.div
                    animate={{ 
                      scale: [1, 1.05, 1],
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="flex items-center justify-center gap-3 relative z-10"
                  >
                    <Avatar
                      src={challengerAvatarUrl || undefined}
                      username={challengerName}
                      size="lg"
                      className="border-2 border-cyber-green"
                    />
                    <h3 className="text-xl font-bold text-cyber-green">
                      You Win!
                    </h3>
                  </motion.div>
                </motion.div>
              )}
              
              {isCurrentUserWinner && isOpponentWinner && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="relative p-6 bg-gradient-to-r from-neon-orange/20 to-neon-orange/5 border-2 border-neon-orange rounded-xl overflow-hidden"
                >
                  <Fireworks />
                  <motion.div
                    animate={{ 
                      scale: [1, 1.05, 1],
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="flex items-center justify-center gap-3 relative z-10"
                  >
                    <Avatar
                      src={opponentAvatarUrl || undefined}
                      username={opponentName}
                      size="lg"
                      className="border-2 border-neon-orange"
                    />
                    <h3 className="text-xl font-bold text-neon-orange">
                      You Win!
                    </h3>
                  </motion.div>
                </motion.div>
              )}
              
              {/* Show loser message only if current user is the loser */}
              {isCurrentUserLoser && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="p-6 bg-gradient-to-r from-bg-tertiary/50 to-bg-tertiary/20 border-2 border-bg-tertiary rounded-xl"
                >
                  <div className="flex items-center justify-center gap-3">
                    <h3 className="text-xl font-bold text-text-secondary">
                      You Lost
                    </h3>
                  </div>
                </motion.div>
              )}
              
              {isTie && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="p-6 bg-gradient-to-r from-electric-blue/20 to-electric-blue/5 border-2 border-electric-blue rounded-xl"
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.05, 1],
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="flex items-center justify-center gap-3"
                  >
                    <div className="w-3 h-3 bg-electric-blue rounded-full animate-pulse" />
                    <h3 className="text-xl font-bold text-electric-blue">
                      It's a Tie!
                    </h3>
                    <div className="w-3 h-3 bg-electric-blue rounded-full animate-pulse" />
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overall Winner Display - Show profile picture of final winner */}
        {finalWinnerId && !isTie && (
          <div className="mb-6 p-4 bg-bg-tertiary rounded-lg border border-bg-tertiary">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-text-secondary">Final Winner:</span>
                {isChallengerWinner ? (
                  <Avatar
                    src={challengerAvatarUrl || undefined}
                    username={challengerName}
                    size="lg"
                    className="border-2 border-cyber-green"
                  />
                ) : isOpponentWinner ? (
                  <Avatar
                    src={opponentAvatarUrl || undefined}
                    username={opponentName}
                    size="lg"
                    className="border-2 border-neon-orange"
                  />
                ) : null}
                <span className="text-lg font-bold text-text-primary">
                  {isChallengerWinner ? challengerName : isOpponentWinner ? opponentName : ''} Wins!
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Total Scores Summary */}
        {(challengerTotalScore > 0 || opponentTotalScore > 0) && (
          <div className="mb-6 p-4 bg-bg-secondary border border-bg-tertiary rounded-lg">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Total Scores</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-secondary">{challengerName}</span>
                  <span className="text-sm font-bold text-text-primary">
                    {challengerTotalScore}/{maxPossibleScore}
                  </span>
                </div>
                <div className="w-full bg-bg-tertiary rounded-full h-2">
                  <div
                    className="bg-cyber-green h-2 rounded-full transition-all"
                    style={{ width: `${(challengerTotalScore / maxPossibleScore) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-secondary">{opponentName}</span>
                  <span className="text-sm font-bold text-text-primary">
                    {opponentTotalScore}/{maxPossibleScore}
                  </span>
                </div>
                <div className="w-full bg-bg-tertiary rounded-full h-2">
                  <div
                    className="bg-neon-orange h-2 rounded-full transition-all"
                    style={{ width: `${(opponentTotalScore / maxPossibleScore) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {displayedVerdicts.map((verdict, index) => (
            <motion.div
              key={verdict.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.3 }}
              className="p-6 bg-bg-tertiary rounded-lg border border-bg-tertiary"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-electric-blue/20 flex items-center justify-center border border-electric-blue/30">
                    <span className="text-electric-blue font-bold text-lg">
                      {verdict.judge.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">
                      {verdict.judge.name}
                    </h3>
                    <p className="text-sm text-text-secondary">
                      {verdict.judge.personality}
                    </p>
                  </div>
                </div>
                {getDecisionBadge(
                  verdict.decision,
                  verdict.decision === 'CHALLENGER_WINS' ? challengerName :
                  verdict.decision === 'OPPONENT_WINS' ? opponentName :
                  'Tie',
                  verdict.decision === 'CHALLENGER_WINS' ? challengerId :
                  verdict.decision === 'OPPONENT_WINS' ? opponentId :
                  null
                )}
              </div>

              {/* Scores */}
              {(verdict.challengerScore !== null || verdict.opponentScore !== null) && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-secondary">{challengerName}</span>
                      <span className="text-text-primary font-semibold">
                        {verdict.challengerScore ?? 0}/100
                      </span>
                    </div>
                    <div className="w-full h-2 bg-bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${verdict.challengerScore ?? 0}%` }}
                        transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                        className="h-full bg-cyber-green"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-secondary">{opponentName}</span>
                      <span className="text-text-primary font-semibold">
                        {verdict.opponentScore ?? 0}/100
                      </span>
                    </div>
                    <div className="w-full h-2 bg-bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${verdict.opponentScore ?? 0}%` }}
                        transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                        className="h-full bg-neon-orange"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Reasoning */}
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-text-primary mb-2">Reasoning</h4>
                <p className="text-text-secondary whitespace-pre-wrap leading-relaxed">
                  {verdict.reasoning}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}

