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
  cumulativeScore: number | null
  eliminationRound: number | null
  eliminationReason: string | null
  status: string
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
}

interface KingOfTheHillResultsProps {
  participants: Participant[]
  roundNumber: number
  totalRounds: number
  debateId: string
}

export function KingOfTheHillResults({
  participants,
  roundNumber,
  totalRounds,
  debateId,
}: KingOfTheHillResultsProps) {
  const [verdicts, setVerdicts] = useState<Verdict[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch verdicts for this debate
  useEffect(() => {
    async function fetchVerdicts() {
      try {
        const response = await fetch(`/api/debates/${debateId}/verdicts`)
        if (response.ok) {
          const data = await response.json()
          setVerdicts(data)
        }
      } catch (error) {
        console.error('Failed to fetch verdicts:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchVerdicts()
  }, [debateId])

  // Parse verdict reasoning to extract participant scores
  const parseVerdictScores = (reasoning: string): Record<string, { score: number; judgeReasoning: string }> => {
    const scores: Record<string, { score: number; judgeReasoning: string }> = {}
    
    // Parse format: "King of the Hill Round X - Judge: Name\n\nScores for each participant:\nusername: score/100\n   reasoning"
    const lines = reasoning.split('\n')
    let currentUsername: string | null = null
    let inScoresSection = false
    
    for (const line of lines) {
      // Skip header lines
      if (line.includes('King of the Hill Round') || line.includes('Judge:')) {
        continue
      }
      if (line.includes('Scores for each participant:')) {
        inScoresSection = true
        continue
      }
      
      // Only parse after we've entered the scores section
      if (!inScoresSection) continue
      
      // Match lines like "username: score/100"
      if (line.includes(':') && line.includes('/100')) {
        const match = line.match(/([^:]+):\s*(\d+)\/100/)
        if (match) {
          currentUsername = match[1].trim()
          const score = parseInt(match[2], 10)
          if (score >= 0 && score <= 100) {
            scores[currentUsername] = { score, judgeReasoning: '' }
          }
        }
      } else if (currentUsername && line.trim().startsWith('   ')) {
        // This is the reasoning for the current participant (indented with 3 spaces)
        if (scores[currentUsername]) {
          scores[currentUsername].judgeReasoning = line.trim()
        }
      }
    }
    
    return scores
  }

  // Calculate total scores for each participant from all 3 judges
  const participantScores: Record<string, { totalScore: number; judgeScores: Array<{ judgeName: string; score: number; reasoning: string }> }> = {}
  
  // Initialize all participants with 0 scores
  participants.forEach(participant => {
    participantScores[participant.userId] = {
      totalScore: 0,
      judgeScores: [],
    }
  })

  // Parse verdicts and aggregate scores
  verdicts.forEach(verdict => {
    const scores = parseVerdictScores(verdict.reasoning)
    
    Object.entries(scores).forEach(([username, { score, judgeReasoning }]) => {
      const participant = participants.find(p => p.username === username)
      if (participant) {
        if (!participantScores[participant.userId]) {
          participantScores[participant.userId] = { totalScore: 0, judgeScores: [] }
        }
        // Validate score is in range (0-100)
        if (score >= 0 && score <= 100) {
          participantScores[participant.userId].totalScore += score
          participantScores[participant.userId].judgeScores.push({
            judgeName: verdict.judge.name,
            score,
            reasoning: judgeReasoning || `Score: ${score}/100`,
          })
        }
      }
    })
  })

  // Separate eliminated and remaining participants
  const eliminated = participants.filter(p => p.status === 'ELIMINATED' && p.eliminationRound === roundNumber)
  const remaining = participants.filter(p => p.status === 'ACTIVE' || (p.status === 'REGISTERED' && !eliminated.some(e => e.id === p.id)))
  
  // Sort remaining by total score (highest first)
  const sortedRemaining = [...remaining].sort((a, b) => {
    const scoreA = participantScores[a.userId]?.totalScore || 0
    const scoreB = participantScores[b.userId]?.totalScore || 0
    return scoreB - scoreA
  })
  
  // Sort eliminated by total score (lowest first)
  const sortedEliminated = [...eliminated].sort((a, b) => {
    const scoreA = participantScores[a.userId]?.totalScore || 0
    const scoreB = participantScores[b.userId]?.totalScore || 0
    return scoreA - scoreB
  })

  const maxPossibleScore = verdicts.length * 100 // 3 judges × 100 = 300

  if (loading) {
    return (
      <Card>
        <CardBody>
          <p className="text-text-secondary text-center py-4">Loading verdicts...</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text-primary">
            King of the Hill - Round {roundNumber} Results
          </h2>
          <Badge variant="default" size="lg" className="bg-electric-blue text-black">
            {eliminated.length} Eliminated
          </Badge>
        </div>
        <p className="text-text-secondary mt-2">
          Bottom 25% eliminated ({eliminated.length} participant{eliminated.length !== 1 ? 's' : ''})
        </p>
      </CardHeader>
      <CardBody>
        {/* Total Scores Summary (same format as regular debates) */}
        {verdicts.length > 0 && (
          <div className="mb-6 p-4 bg-bg-secondary border border-bg-tertiary rounded-lg">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Total Scores (from {verdicts.length} judges)</h3>
            <div className="space-y-2">
              {sortedRemaining.map((participant) => {
                const score = participantScores[participant.userId]?.totalScore || 0
                return (
                  <div key={participant.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-text-primary font-semibold">
                        {participant.username}
                      </span>
                      <span className="text-sm font-bold text-text-primary">
                        {score}/{maxPossibleScore}
                      </span>
                    </div>
                    <div className="w-full bg-bg-tertiary rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(score / maxPossibleScore) * 100}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full bg-cyber-green rounded-full"
                      />
                    </div>
                  </div>
                )
              })}
              {sortedEliminated.map((participant) => {
                const score = participantScores[participant.userId]?.totalScore || 0
                return (
                  <div key={participant.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-text-primary font-semibold">
                        {participant.username}
                      </span>
                      <span className="text-sm font-bold text-red-400">
                        {score}/{maxPossibleScore}
                      </span>
                    </div>
                    <div className="w-full bg-bg-tertiary rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(score / maxPossibleScore) * 100}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full bg-red-400 rounded-full"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Individual Judge Verdicts (same format as regular debates) */}
        {verdicts.length > 0 && (
          <div className="space-y-6">
            {verdicts.map((verdict, index) => {
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

                  {/* Scores for each participant (same format as regular debates) */}
                  {Object.keys(scores).length > 0 && (
                    <div className="space-y-3 mb-4">
                      {participants
                        .sort((a, b) => {
                          const scoreA = scores[a.username]?.score || 0
                          const scoreB = scores[b.username]?.score || 0
                          return scoreB - scoreA // Sort by score descending
                        })
                        .map((participant) => {
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
                              {isEliminated && judgeScore.judgeReasoning && (
                                <p className="text-xs text-text-secondary mt-2 italic">
                                  {judgeScore.judgeReasoning}
                                </p>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  )}

                  {/* Overall Reasoning (for eliminated participants) */}
                  {eliminated.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-bg-tertiary">
                      <h4 className="text-sm font-semibold text-text-primary mb-2">
                        Elimination Reasoning
                      </h4>
                      <div className="space-y-2">
                        {eliminated.map((participant) => {
                          const judgeScore = scores[participant.username]
                          if (!judgeScore) return null
                          
                          return (
                            <div key={participant.id} className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                              <p className="text-sm font-semibold text-red-400 mb-1">
                                {participant.username} (Eliminated)
                              </p>
                              <p className="text-text-secondary text-sm whitespace-pre-wrap leading-relaxed">
                                {judgeScore.judgeReasoning || participant.eliminationReason || 'No specific reasoning provided by this judge.'}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
