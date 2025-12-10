'use client'

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

interface KingOfTheHillResultsProps {
  participants: TournamentParticipant[]
  roundNumber: number
  totalRounds: number
}

export function KingOfTheHillResults({
  participants,
  roundNumber,
  totalRounds,
}: KingOfTheHillResultsProps) {
  // Separate eliminated and remaining participants
  const eliminated = participants.filter(p => p.status === 'ELIMINATED' && p.eliminationRound === roundNumber)
  const remaining = participants.filter(p => p.status === 'ACTIVE' || (p.status === 'REGISTERED' && !eliminated.some(e => e.id === p.id)))
  
  // Sort remaining by cumulative score (highest first)
  const sortedRemaining = [...remaining].sort((a, b) => (b.cumulativeScore || 0) - (a.cumulativeScore || 0))
  
  // Sort eliminated by cumulative score (lowest first)
  const sortedEliminated = [...eliminated].sort((a, b) => (a.cumulativeScore || 0) - (b.cumulativeScore || 0))

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
          {/* Remaining Participants (Advancing) */}
          {sortedRemaining.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-cyber-green mb-4">
                ✅ Advancing to Next Round ({sortedRemaining.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedRemaining.map((participant, index) => (
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
                    {participant.cumulativeScore !== null && (
                      <div className="mt-2">
                        <p className="text-sm text-text-secondary">
                          Total Score: <span className="font-semibold text-electric-blue">{participant.cumulativeScore}</span>
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Eliminated Participants */}
          {sortedEliminated.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-red-400 mb-4">
                ❌ Eliminated ({sortedEliminated.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedEliminated.map((participant) => (
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
                    {participant.cumulativeScore !== null && (
                      <div className="mt-2 mb-2">
                        <p className="text-sm text-text-secondary">
                          Final Score: <span className="font-semibold text-red-400">{participant.cumulativeScore}</span>
                        </p>
                      </div>
                    )}
                    {participant.eliminationReason && (
                      <div className="mt-2 p-2 bg-bg-secondary rounded border border-red-400/20">
                        <p className="text-xs text-text-secondary font-semibold mb-1">Elimination Reason:</p>
                        <p className="text-sm text-text-primary">{participant.eliminationReason}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

