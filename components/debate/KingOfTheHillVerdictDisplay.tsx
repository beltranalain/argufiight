'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'

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

interface Participant {
  id: string
  userId: string
  user: {
    id: string
    username: string
    avatarUrl: string | null
  }
}

interface TournamentParticipant {
  id: string
  userId: string
  status: string
  eliminationRound: number | null
  cumulativeScore: number | null
}

interface KingOfTheHillVerdictDisplayProps {
  verdicts: Verdict[]
  participants: Participant[]
  tournamentParticipants: TournamentParticipant[]
  currentUserId?: string | null
}

interface ParticipantScore {
  username: string
  score: number
  userId: string
  avatarUrl: string | null
  isEliminated: boolean
  eliminationRound: number | null
}

export function KingOfTheHillVerdictDisplay({
  verdicts,
  participants,
  tournamentParticipants,
  currentUserId,
}: KingOfTheHillVerdictDisplayProps) {
  const [showAnimations, setShowAnimations] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowAnimations(true), 100)
    return () => clearTimeout(timer)
  }, [])

  if (!verdicts || verdicts.length === 0) {
    return null
  }

  // Parse participant scores from verdict reasoning
  const parseParticipantScores = (reasoning: string): ParticipantScore[] => {
    const scores: ParticipantScore[] = []
    
    // Extract scores from reasoning (format: "username: score/100")
    const lines = reasoning.split('\n')
    const scoreLines = lines.filter(line => line.includes(':') && line.includes('/100'))
    
    for (const line of scoreLines) {
      const match = line.match(/([^:]+):\s*(\d+)\/100/)
      if (match) {
        const username = match[1].trim()
        const score = parseInt(match[2], 10)
        
        // Find participant info by username
        const participant = participants.find(p => p.user.username === username)
        
        if (participant) {
          const tournamentParticipant = tournamentParticipants.find(
            tp => tp.userId === participant.userId
          )
          
          scores.push({
            username,
            score,
            userId: participant.userId,
            avatarUrl: participant.user.avatarUrl,
            isEliminated: tournamentParticipant?.status === 'ELIMINATED' || false,
            eliminationRound: tournamentParticipant?.eliminationRound || null,
          })
        }
      }
    }
    
    return scores.sort((a, b) => b.score - a.score) // Sort by score descending
  }

  // Calculate total scores across all judges
  const calculateTotalScores = (): ParticipantScore[] => {
    const scoreMap = new Map<string, { total: number; count: number; participant: ParticipantScore }>()
    
    for (const verdict of verdicts) {
      const scores = parseParticipantScores(verdict.reasoning)
      
      for (const scoreData of scores) {
          if (!scoreMap.has(scoreData.userId)) {
          const participant = participants.find(p => p.userId === scoreData.userId)
          const tournamentParticipant = tournamentParticipants.find(
            tp => tp.userId === scoreData.userId
          )
          
          if (participant) {
            scoreMap.set(scoreData.userId, {
              total: 0,
              count: 0,
              participant: {
                username: participant.user.username,
                score: 0,
                userId: participant.userId,
                avatarUrl: participant.user.avatarUrl,
                isEliminated: tournamentParticipant?.status === 'ELIMINATED' || false,
                eliminationRound: tournamentParticipant?.eliminationRound || null,
              },
            })
          }
        }
        
        const entry = scoreMap.get(scoreData.userId)!
        entry.total += scoreData.score
        entry.count += 1
      }
    }
    
    // Calculate averages and return sorted
    return Array.from(scoreMap.values())
      .map(entry => ({
        ...entry.participant,
        score: entry.count > 0 ? Math.round(entry.total / entry.count) : 0,
      }))
      .sort((a, b) => b.score - a.score)
  }

  const totalScores = calculateTotalScores()
  const maxScore = Math.max(...totalScores.map(s => s.score), 100)

  // Count votes per participant (not applicable for GROUP, but calculate for display)
  const participantVotes = new Map<string, { wins: number; ties: number }>()
  for (const verdict of verdicts) {
    const scores = parseParticipantScores(verdict.reasoning)
    const highestScore = Math.max(...scores.map(s => s.score))
    const winners = scores.filter(s => s.score === highestScore)
    
    if (winners.length === 1) {
      const current = participantVotes.get(winners[0].userId) || { wins: 0, ties: 0 }
      participantVotes.set(winners[0].userId, { ...current, wins: current.wins + 1 })
    } else {
      winners.forEach(w => {
        const current = participantVotes.get(w.userId) || { wins: 0, ties: 0 }
        participantVotes.set(w.userId, { ...current, ties: current.ties + 1 })
      })
    }
  }

  // Determine if it's actually a tie (all participants have same score)
  const allSameScore = totalScores.length > 0 && totalScores.every(s => s.score === totalScores[0].score)
  const isTie = allSameScore

  // Get eliminated participants
  const eliminatedParticipants = totalScores.filter(p => p.isEliminated)

  return (
    <div className="space-y-6">
      {/* Total Scores Summary */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-text-primary">AI Judge Verdicts</h2>
        </CardHeader>
        <CardBody>
          {/* Summary Line */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 text-sm text-text-secondary">
              {totalScores.map((participant, idx) => {
                const votes = participantVotes.get(participant.userId) || { wins: 0, ties: 0 }
                return (
                  <span key={participant.userId}>
                    {votes.wins} for {participant.username}
                    {votes.ties > 0 && ` ${votes.ties} Ties`}
                    {idx < totalScores.length - 1 && ' • '}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Winner/Tie Banner - Only show if NOT a tie */}
          {!isTie && totalScores.length > 0 && (
            <div className="mb-6 p-4 bg-cyber-green/20 border-2 border-cyber-green rounded-lg">
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-cyber-green rounded-full" />
                <p className="text-lg font-bold text-cyber-green">
                  Winner: {totalScores[0].username} ({totalScores[0].score}/100)
                </p>
                <div className="w-3 h-3 bg-cyber-green rounded-full" />
              </div>
            </div>
          )}

          {/* Eliminated Participants with Red Motion Boxes */}
          {eliminatedParticipants.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-text-secondary mb-3">Eliminated Participants</h3>
              <div className="flex flex-wrap gap-3">
                {eliminatedParticipants.map((participant) => (
                  <motion.div
                    key={participant.userId}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={showAnimations ? { scale: 1, opacity: 1 } : {}}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="relative"
                  >
                    <div className="p-2 border-2 border-red-500 rounded-lg bg-red-500/20 animate-pulse">
                      <Avatar
                        src={participant.avatarUrl || undefined}
                        username={participant.username}
                        size="md"
                      />
                      {participant.eliminationRound && (
                        <p className="text-xs text-red-400 text-center mt-1">
                          Round {participant.eliminationRound}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Total Scores Chart */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Total Scores</h3>
            <div className="space-y-4">
              {totalScores.map((participant, index) => {
                const isEliminated = participant.isEliminated
                return (
                  <div key={participant.userId}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={participant.avatarUrl || undefined}
                          username={participant.username}
                          size="sm"
                        />
                        <span className={isEliminated ? 'text-red-400' : 'text-text-primary'}>
                          {participant.username}
                        </span>
                        {isEliminated && (
                          <Badge variant="default" size="sm" className="bg-red-500 text-white">
                            Eliminated
                          </Badge>
                        )}
                      </div>
                      <span className={`font-semibold ${isEliminated ? 'text-red-400' : 'text-text-primary'}`}>
                        {participant.score}/100
                      </span>
                    </div>
                    <div className="w-full h-3 bg-bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={showAnimations ? { width: `${(participant.score / maxScore) * 100}%` } : {}}
                        transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                        className={`h-full ${
                          isEliminated
                            ? 'bg-red-500'
                            : index === 0
                            ? 'bg-cyber-green'
                            : index === 1
                            ? 'bg-electric-blue'
                            : 'bg-neon-orange'
                        }`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Individual Judge Verdicts */}
      {verdicts.map((verdict, verdictIndex) => {
        const participantScores = parseParticipantScores(verdict.reasoning)
        const maxJudgeScore = Math.max(...participantScores.map(s => s.score), 100)
        
        // Extract elimination reasoning and full analysis
        const reasoningParts = verdict.reasoning.split('\n\n---\n\n')
        const eliminationReasoning = reasoningParts.find(part => part.startsWith('Elimination Reasoning:'))
        const fullAnalysis = reasoningParts.find(part => part.startsWith('Full Analysis:'))

        return (
          <Card key={verdict.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-electric-blue/20 flex items-center justify-center text-2xl">
                    {verdict.judge.emoji}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">
                      {verdict.judge.name}
                    </h3>
                    <p className="text-sm text-text-secondary">{verdict.judge.personality}</p>
                  </div>
                </div>
                <Badge variant="default" className="bg-bg-tertiary text-text-secondary">
                  {participantScores.length > 0 && participantScores[0].score === participantScores[participantScores.length - 1].score
                    ? 'Tie'
                    : 'Winner: ' + participantScores[0]?.username}
                </Badge>
              </div>
            </CardHeader>
            <CardBody>
              {/* Scores Chart - Same format as regular debates */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-text-primary mb-3">Reasoning</h4>
                <div className="space-y-3">
                  {participantScores.map((participant, index) => {
                    const isEliminated = participant.isEliminated
                    return (
                      <div key={participant.userId}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <div className="flex items-center gap-2">
                            <Avatar
                              src={participant.avatarUrl || undefined}
                              username={participant.username}
                              size="sm"
                            />
                            <span className={isEliminated ? 'text-red-400' : 'text-text-secondary'}>
                              {participant.username}
                            </span>
                          </div>
                          <span className={`font-semibold ${isEliminated ? 'text-red-400' : 'text-text-primary'}`}>
                            {participant.score}/100
                          </span>
                        </div>
                        <div className="w-full h-2 bg-bg-secondary rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={showAnimations ? { width: `${(participant.score / maxJudgeScore) * 100}%` } : {}}
                            transition={{ delay: verdictIndex * 0.2 + index * 0.1 + 0.5, duration: 0.8 }}
                            className={`h-full ${
                              isEliminated
                                ? 'bg-red-500'
                                : index === 0
                                ? 'bg-cyber-green'
                                : index === 1
                                ? 'bg-electric-blue'
                                : 'bg-neon-orange'
                            }`}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Elimination Reasoning */}
              {eliminationReasoning && (
                <div className="mt-4 pt-4 border-t border-bg-tertiary">
                  <h4 className="text-sm font-semibold text-text-primary mb-2">Elimination Reasoning</h4>
                  <p className="text-sm text-text-secondary whitespace-pre-wrap">
                    {eliminationReasoning.replace('Elimination Reasoning:', '').trim()}
                  </p>
                </div>
              )}

              {/* Full Analysis */}
              {fullAnalysis && (
                <div className="mt-4 pt-4 border-t border-bg-tertiary">
                  <h4 className="text-sm font-semibold text-text-primary mb-2">Full Analysis</h4>
                  <p className="text-sm text-text-secondary whitespace-pre-wrap">
                    {fullAnalysis.replace('Full Analysis:', '').trim()}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        )
      })}
    </div>
  )
}
