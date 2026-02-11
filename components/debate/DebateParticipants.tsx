'use client'

import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'

interface Participant {
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
}

interface TournamentParticipant {
  userId: string
  cumulativeScore: number | null
  eliminationRound: number | null
  eliminationReason: string | null
  status: string
}

interface DebateParticipantsProps {
  isGroupChallenge: boolean
  participants?: Participant[]
  challenger: { id: string; username: string; avatarUrl: string | null; eloRating: number }
  opponent: { id: string; username: string; avatarUrl: string | null; eloRating: number } | null
  challengerPosition: string
  opponentPosition: string
  tournamentFormat?: string
  tournamentParticipants?: TournamentParticipant[]
}

export function DebateParticipants({
  isGroupChallenge,
  participants,
  challenger,
  opponent,
  challengerPosition,
  opponentPosition,
  tournamentFormat,
  tournamentParticipants,
}: DebateParticipantsProps) {
  if (isGroupChallenge) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          All Participants ({participants?.length || 0})
        </h3>
        {participants && participants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {participants.map((participant) => {
              const tp = tournamentFormat === 'KING_OF_THE_HILL'
                ? tournamentParticipants?.find(t => t.userId === participant.userId)
                : null
              const isEliminated = tp?.status === 'ELIMINATED'

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
                      <p className={`font-semibold ${isEliminated ? 'text-red-400' : 'text-text-primary'}`}>
                        {participant.user.username}
                      </p>
                      {isEliminated && (
                        <Badge variant="default" size="sm" className="bg-red-500 text-white">
                          Eliminated
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary">ELO: {participant.user.eloRating}</p>
                    {tournamentFormat === 'KING_OF_THE_HILL' && tp?.cumulativeScore != null && (
                      <p className="text-sm text-electric-blue font-semibold mt-1">
                        Score: {tp.cumulativeScore}/300
                      </p>
                    )}
                    {tp?.eliminationRound && (
                      <p className="text-xs text-text-secondary mt-1">
                        Eliminated in Round {tp.eliminationRound}
                      </p>
                    )}
                    {participant.position && tournamentFormat !== 'KING_OF_THE_HILL' && (
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
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="flex items-center gap-4">
        <Avatar src={challenger.avatarUrl} username={challenger.username} size="lg" />
        <div>
          <p className="font-semibold text-text-primary">{challenger.username}</p>
          <p className="text-sm text-text-secondary">ELO: {challenger.eloRating}</p>
          <Badge variant="default" size="sm" className="mt-1">{challengerPosition}</Badge>
        </div>
      </div>

      {opponent ? (
        <div className="flex items-center gap-4">
          <Avatar src={opponent.avatarUrl} username={opponent.username} size="lg" />
          <div>
            <p className="font-semibold text-text-primary">{opponent.username}</p>
            <p className="text-sm text-text-secondary">ELO: {opponent.eloRating}</p>
            <Badge variant="default" size="sm" className="mt-1">{opponentPosition}</Badge>
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
  )
}
