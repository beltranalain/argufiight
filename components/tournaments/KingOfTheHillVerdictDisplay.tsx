'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'

interface Participant {
  id: string
  userId: string
  username: string
  avatarUrl?: string | null
  eloRating: number
  status: string
  eliminationRound: number | null
  eliminationReason: string | null
}

interface Verdict {
  id: string
  judge: {
    id: string
    name: string
    emoji: string
    personality: string
  }
  reasoning: string
  challengerScore: number | null
  opponentScore: number | null
}

interface KingOfTheHillVerdictDisplayProps {
  verdicts: Verdict[]
  participants: Participant[]
  roundNumber: number
  debateId: string
}

/**
 * King of the Hill Verdict Display
 * Matches the EXACT format of regular debate VerdictDisplay
 * Shows all participants with scores from 3 judges
 */
export function KingOfTheHillVerdictDisplay({
  verdicts,
  participants,
  roundNumber,
  debateId,
}: KingOfTheHillVerdictDisplayProps) {
  const [showAnimations, setShowAnimations] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowAnimations(true), 100)
    return () => clearTimeout(timer)
  }, [])

  if (!verdicts || verdicts.length === 0) {
    return null
  }

  // Parse verdict reasoning to extract participant scores
  // Format: "username: score/100\n   reasoning\n\nusername2: score/100..."
  const parseVerdictScores = (reasoning: string): Record<string, { score: number; reasoning: string }> => {
    const scores: Record<string, { score: number; reasoning: string }> = {}
    const lines = reasoning.split('\n')
    let currentUsername: string | null = null
    let currentReasoning: string[] = []

    for (const line of lines) {
      // Match "username: score/100"
      if (line.includes(':') && line.includes('/100')) {
        // Save previous participant if exists
        if (currentUsername) {
          scores[currentUsername].reasoning = currentReasoning.join(' ').trim()
        }

        const match = line.match(/([^:]+):\s*(\d+)\/100/)
        if (match) {
          currentUsername = match[1].trim()
          const score = parseInt(match[2], 10)
          scores[currentUsername] = { score, reasoning: '' }
          currentReasoning = []
        }
      } else if (currentUsername && line.trim().startsWith('   ')) {
        // Reasoning line (indented with 3 spaces)
        currentReasoning.push(line.trim())
      } else if (currentUsername && line.trim() && !line.includes('Elimination Reasoning:')) {
        // Additional reasoning
        currentReasoning.push(line.trim())
      }
    }

    // Save last participant
    if (currentUsername) {
      scores[currentUsername].reasoning = currentReasoning.join(' ').trim()
    }

    return scores
  }

  // Calculate total scores for each participant (sum of all 3 judges)
  const participantScores: Record<string, { totalScore: number; judgeScores: Array<{ judgeName: string; score: number; reasoning: string }> }> = {}

  participants.forEach(participant => {
    participantScores[participant.userId] = {
      totalScore: 0,
      judgeScores: [],
    }
  })

  // Only use the first 3 verdicts (EXACTLY 3 judges, SAME as regular debates)
  const displayedVerdicts = verdicts.slice(0, 3)
  
  displayedVerdicts.forEach(verdict => {
    const scores = parseVerdictScores(verdict.reasoning)
    
    Object.entries(scores).forEach(([username, { score, reasoning }]) => {
      const participant = participants.find(p => p.username === username)
      if (participant && score >= 0 && score <= 100) {
        participantScores[participant.userId].totalScore += score
        participantScores[participant.userId].judgeScores.push({
          judgeName: verdict.judge.name,
          score,
          reasoning: reasoning || `Score: ${score}/100`,
        })
      }
    })
  })

  // Separate eliminated and remaining participants
  const eliminated = participants.filter(p => p.status === 'ELIMINATED' && p.eliminationRound === roundNumber)
  const remaining = participants.filter(p => p.status === 'ACTIVE' || (p.status === 'REGISTERED' && !eliminated.some(e => e.id === p.id)))

  // Sort by total score
  const sortedParticipants = [...participants].sort((a, b) => {
    const scoreA = participantScores[a.userId]?.totalScore || 0
    const scoreB = participantScores[b.userId]?.totalScore || 0
    return scoreB - scoreA // Highest first
  })

  // EXACTLY 3 judges (SAME as regular debates) - max score is 300
  const maxPossibleScore = 300 // 3 judges × 100 = 300 (FIXED, not based on verdicts.length)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text-primary">
            AI Judge Verdicts
          </h2>
          <Badge variant="default" size="lg" className="bg-electric-blue text-black">
            Verdict Reached
          </Badge>
        </div>
        <p className="text-text-secondary mt-2">
          King of the Hill - Round {roundNumber}
        </p>
      </CardHeader>
      <CardBody>
        {/* Total Scores Summary (SAME format as regular debates) */}
        <div className="mb-6 p-4 bg-bg-secondary border border-bg-tertiary rounded-lg">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Total Scores (from {verdicts.length} judges)</h3>
          <div className="space-y-2">
            {sortedParticipants.map((participant) => {
              const score = participantScores[participant.userId]?.totalScore || 0
              const isEliminated = participant.status === 'ELIMINATED' && participant.eliminationRound === roundNumber
              
              return (
                <div key={participant.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-text-primary font-semibold">
                      {participant.username}
                    </span>
                    <span className={`text-sm font-bold ${isEliminated ? 'text-red-400' : 'text-text-primary'}`}>
                      {score}/{maxPossibleScore}
                    </span>
                  </div>
                  <div className="w-full bg-bg-tertiary rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(score / maxPossibleScore) * 100}%` }}
                      transition={{ duration: 0.8 }}
                      className={`h-full rounded-full ${isEliminated ? 'bg-red-400' : 'bg-cyber-green'}`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Individual Judge Verdicts (SAME format as regular debates) - EXACTLY 3 judges */}
        <div className="space-y-6">
          {displayedVerdicts.map((verdict, index) => {
            const scores = parseVerdictScores(verdict.reasoning)
            
            return (
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
                </div>

                {/* Scores for each participant (SAME format as regular debates) */}
                <div className="space-y-3 mb-4">
                  {sortedParticipants.map((participant) => {
                    const judgeScore = scores[participant.username]
                    if (!judgeScore) return null
                    
                    const isEliminated = participant.status === 'ELIMINATED' && participant.eliminationRound === roundNumber
                    
                    return (
                      <div key={participant.id} className={isEliminated ? 'p-3 bg-red-500/10 border border-red-500/30 rounded-lg' : ''}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-text-secondary">{participant.username}</span>
                          <span className={`font-semibold ${isEliminated ? 'text-red-400' : 'text-text-primary'}`}>
                            {judgeScore.score}/100
                          </span>
                        </div>
                        <div className="w-full h-2 bg-bg-secondary rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${judgeScore.score}%` }}
                            transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                            className={`h-full ${isEliminated ? 'bg-red-400' : 'bg-cyber-green'}`}
                          />
                        </div>
                        {/* Show reasoning for eliminated participants */}
                        {isEliminated && judgeScore.reasoning && (
                          <p className="text-xs text-text-secondary mt-2 italic">
                            {judgeScore.reasoning}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Reasoning (SAME format as regular debates) */}
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-text-primary mb-2">Reasoning</h4>
                  <p className="text-text-secondary whitespace-pre-wrap leading-relaxed">
                    {verdict.reasoning}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </CardBody>
    </Card>
  )
}

