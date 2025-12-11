'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'

interface TournamentParticipant {
  id: string
  userId: string
  username: string
  avatarUrl: string | null
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
  createdAt: string
}

interface KingOfTheHillResultsProps {
  participants: TournamentParticipant[]
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
    
    // Parse format: "username: score/100\n   reasoning"
    const lines = reasoning.split('\n')
    let currentUsername: string | null = null
    
    for (const line of lines) {
      if (line.includes(':') && line.includes('/100')) {
        // Extract username and score
        const match = line.match(/([^:]+):\s*(\d+)\/100/)
        if (match) {
          currentUsername = match[1].trim()
          const score = parseInt(match[2], 10)
          scores[currentUsername] = { score, judgeReasoning: '' }
        }
      } else if (currentUsername && line.trim().startsWith('   ')) {
        // This is the reasoning for the current participant
        scores[currentUsername].judgeReasoning = line.trim()
      }
    }
    
    return scores
  }

  // Calculate total scores for each participant from all 3 judges
  const participantScores: Record<string, { totalScore: number; judgeScores: Array<{ judgeName: string; score: number; reasoning: string }> }> = {}
  
  participants.forEach(participant => {
    participantScores[participant.userId] = {
      totalScore: 0,
      judgeScores: [],
    }
  })

  verdicts.forEach(verdict => {
    const scores = parseVerdictScores(verdict.reasoning)
    Object.entries(scores).forEach(([username, { score, judgeReasoning }]) => {
      const participant = participants.find(p => p.username === username)
      if (participant) {
        if (!participantScores[participant.userId]) {
          participantScores[participant.userId] = { totalScore: 0, judgeScores: [] }
        }
        participantScores[participant.userId].totalScore += score
        participantScores[participant.userId].judgeScores.push({
          judgeName: verdict.judge.name,
          score,
          reasoning: judgeReasoning || verdict.reasoning,
        })
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

  if (loading) {
    return (
      <Card>
        <CardBody>
          <p className="text-text-secondary">Loading verdicts...</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-text-primary">
            King of the Hill - Round {roundNumber} Results
          </h2>
          <p className="text-text-secondary">
            {eliminated.length} participant{eliminated.length !== 1 ? 's' : ''} eliminated (bottom 25%)
          </p>
        </CardHeader>
        <CardBody>
          {/* Total Scores Summary (like regular debates) */}
          {verdicts.length > 0 && (
            <div className="mb-6 p-4 bg-bg-secondary border border-bg-tertiary rounded-lg">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Total Scores (from 3 judges)</h3>
              <div className="space-y-2">
                {sortedRemaining.map((participant) => {
                  const score = participantScores[participant.userId]?.totalScore || 0
                  return (
                    <div key={participant.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-text-primary font-semibold">
                          {participant.username}
                        </span>
                        <span className="text-sm text-electric-blue font-bold">
                          {score}/300
                        </span>
                      </div>
                      <div className="w-full bg-bg-tertiary rounded-full h-2">
                        <div
                          className="h-full bg-electric-blue transition-all"
                          style={{ width: `${(score / 300) * 100}%` }}
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
                        <span className="text-sm text-red-400 font-bold">
                          {score}/300
                        </span>
                      </div>
                      <div className="w-full bg-bg-tertiary rounded-full h-2">
                        <div
                          className="h-full bg-red-400 transition-all"
                          style={{ width: `${(score / 300) * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Individual Judge Verdicts (like regular debates) */}
          {verdicts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">AI Judge Verdicts</h3>
              <div className="space-y-4">
                {verdicts.map((verdict) => {
                  const scores = parseVerdictScores(verdict.reasoning)
                  return (
                    <div
                      key={verdict.id}
                      className="p-4 bg-bg-tertiary rounded-lg border border-bg-tertiary"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-electric-blue/20 flex items-center justify-center border border-electric-blue/30">
                            <span className="text-electric-blue font-bold text-lg">
                              {verdict.judge.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-text-primary">
                              {verdict.judge.name}
                            </h4>
                            <p className="text-sm text-text-secondary">
                              {verdict.judge.personality}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Scores for each participant */}
                      <div className="space-y-3">
                        {Object.entries(scores).map(([username, { score }]) => {
                          const participant = participants.find(p => p.username === username)
                          if (!participant) return null
                          
                          return (
                            <div key={participant.id}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-text-primary font-semibold">
                                  {username}
                                </span>
                                <span className="text-electric-blue font-bold">
                                  {score}/100
                                </span>
                              </div>
                              <div className="w-full h-2 bg-bg-secondary rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-electric-blue transition-all"
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Remaining Participants (Advancing) */}
          {sortedRemaining.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-cyber-green mb-4">
                ✅ Advancing to Next Round ({sortedRemaining.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedRemaining.map((participant, index) => {
                  const score = participantScores[participant.userId]?.totalScore || 0
                  return (
                    <div
                      key={participant.id}
                      className="p-4 rounded-lg border border-cyber-green/30 bg-cyber-green/10"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar
                          src={participant.avatarUrl}
                          username={participant.username}
                          size="md"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-text-primary">
                              {participant.username}
                            </p>
                            <Badge variant="default" className="bg-cyber-green text-black">
                              #{index + 1}
                            </Badge>
                          </div>
                          <p className="text-sm text-text-secondary">
                            ELO: {participant.eloRating}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-text-secondary">
                          Total Score: <span className="font-semibold text-electric-blue">{score}/300</span>
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Eliminated Participants */}
          {sortedEliminated.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-red-400 mb-4">
                ❌ Eliminated ({sortedEliminated.length})
              </h3>
              <div className="space-y-4">
                {sortedEliminated.map((participant) => {
                  const score = participantScores[participant.userId]?.totalScore || 0
                  const judgeScores = participantScores[participant.userId]?.judgeScores || []
                  
                  return (
                    <div
                      key={participant.id}
                      className="p-4 rounded-lg border border-red-400/30 bg-red-400/10"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar
                          src={participant.avatarUrl}
                          username={participant.username}
                          size="md"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-text-primary">
                            {participant.username}
                          </p>
                          <p className="text-sm text-text-secondary">
                            ELO: {participant.eloRating}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 mb-2">
                        <p className="text-sm text-text-secondary">
                          Final Score: <span className="font-semibold text-red-400">{score}/300</span>
                        </p>
                      </div>
                      
                      {/* Elimination Reasons from Each Judge */}
                      {judgeScores.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-text-secondary font-semibold mb-2">Elimination Reasons from Judges:</p>
                          {judgeScores.map((judgeScore, idx) => (
                            <div key={idx} className="p-2 bg-bg-secondary rounded border border-red-400/20">
                              <p className="text-xs text-electric-blue font-semibold mb-1">
                                {judgeScore.judgeName}: {judgeScore.score}/100
                              </p>
                              <p className="text-sm text-text-primary">{judgeScore.reasoning || 'No specific reasoning provided'}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

