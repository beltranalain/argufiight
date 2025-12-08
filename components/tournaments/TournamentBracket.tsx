'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'

interface Participant {
  id: string
  userId: string
  seed: number
  status: string
  user: {
    id: string
    username: string
    avatarUrl: string | null
    eloRating: number
  }
}

interface Match {
  id: string
  round: number
  matchNumber: number
  participant1Id: string | null
  participant2Id: string | null
  winnerId: string | null
  status: string
  debate: {
    id: string
    topic: string
    status: string
    winnerId: string | null
    challenger: {
      id: string
      username: string
    }
    opponent: {
      id: string
      username: string
    } | null
  } | null
}

interface TournamentBracketProps {
  participants: Participant[]
  matches: Match[]
  totalRounds: number
  currentRound: number
}

interface BracketSlot {
  participant: Participant | null
  matchId: string | null
  isWinner: boolean
  debateId: string | null
  matchStatus: string | null
}

export function TournamentBracket({
  participants,
  matches,
  totalRounds,
  currentRound,
}: TournamentBracketProps) {
  // Build bracket structure
  const bracketStructure = useMemo(() => {
    const structure: BracketSlot[][][] = [] // [round][match][slot]
    
    // Helper to find participant by ID
    const findParticipant = (participantId: string | null): Participant | null => {
      if (!participantId) return null
      return participants.find((p) => p.id === participantId) || null
    }
    
    // Build bracket round by round
    for (let round = 1; round <= totalRounds; round++) {
      const roundMatches = matches.filter((m) => m.round === round)
      const roundSlots: BracketSlot[][] = []
      
      // Sort matches by matchNumber to maintain order
      roundMatches.sort((a, b) => a.matchNumber - b.matchNumber)
      
      for (const match of roundMatches) {
        const participant1 = findParticipant(match.participant1Id)
        const participant2 = findParticipant(match.participant2Id)
        
        roundSlots.push([
          {
            participant: participant1,
            matchId: match.id,
            isWinner: match.winnerId ? match.winnerId === participant1?.userId : false,
            debateId: match.debate?.id || null,
            matchStatus: match.status,
          },
          {
            participant: participant2,
            matchId: match.id,
            isWinner: match.winnerId ? match.winnerId === participant2?.userId : false,
            debateId: match.debate?.id || null,
            matchStatus: match.status,
          },
        ])
      }
      
      structure.push(roundSlots)
    }
    
    return structure
  }, [participants, matches, totalRounds])

  const getSlotHeight = (round: number) => {
    // Each round has fewer matches, so slots get taller
    const baseHeight = 80
    return baseHeight * Math.pow(2, round - 1)
  }

  const getRoundWidth = () => {
    return 280 // Fixed width per round
  }

  return (
    <div className="overflow-x-auto pb-8">
      <div className="inline-block min-w-full">
        <div className="flex gap-4" style={{ minWidth: `${totalRounds * getRoundWidth()}px` }}>
          {bracketStructure.map((round, roundIndex) => {
            const roundNum = roundIndex + 1
            const isCurrentRound = roundNum === currentRound
            
            return (
              <div
                key={roundNum}
                className="flex flex-col justify-center gap-2"
                style={{ width: `${getRoundWidth()}px` }}
              >
                {/* Round Header */}
                <div className="text-center mb-4">
                  <h3
                    className={`text-lg font-bold ${
                      isCurrentRound ? 'text-electric-blue' : 'text-text-secondary'
                    }`}
                  >
                    Round {roundNum}
                  </h3>
                </div>

                {/* Matches in this round */}
                <div className="flex flex-col gap-2" style={{ minHeight: `${round.length * getSlotHeight(roundNum)}px` }}>
                  {round.map((match, matchIndex) => {
                    const slot1 = match[0]
                    const slot2 = match[1]
                    const isActive = slot1.matchStatus === 'IN_PROGRESS' || slot2.matchStatus === 'IN_PROGRESS'
                    const isCompleted = slot1.matchStatus === 'COMPLETED' || slot2.matchStatus === 'COMPLETED'

                    return (
                      <div
                        key={matchIndex}
                        className="relative"
                        style={{ minHeight: `${getSlotHeight(roundNum)}px` }}
                      >
                        {/* Connecting lines to next round (except final round) */}
                        {roundNum < totalRounds && (
                          <>
                            {/* Vertical line up from match center */}
                            <div
                              className="absolute top-1/2 left-full w-0.5 bg-electric-blue/40 z-0"
                              style={{
                                height: `${getSlotHeight(roundNum) / 2}px`,
                                transform: 'translateY(-50%)',
                              }}
                            />
                            {/* Horizontal line to next round */}
                            <div
                              className="absolute top-1/2 left-full bg-electric-blue/40 z-0"
                              style={{
                                width: '16px',
                                height: '2px',
                                transform: 'translateY(-50%)',
                              }}
                            />
                            {/* Vertical line connecting to next round match */}
                            {matchIndex % 2 === 0 && (
                              <div
                                className="absolute top-1/2 left-[calc(100%+16px)] w-0.5 bg-electric-blue/40 z-0"
                                style={{
                                  height: `${getSlotHeight(roundNum + 1) + 8}px`,
                                  transform: 'translateY(-50%)',
                                }}
                              />
                            )}
                          </>
                        )}

                        {/* Match Card */}
                        <div
                          className={`relative z-10 p-3 rounded-lg border-2 ${
                            isActive
                              ? 'border-electric-blue bg-electric-blue/10'
                              : isCompleted
                              ? 'border-cyber-green/50 bg-cyber-green/5'
                              : 'border-bg-tertiary bg-bg-secondary'
                          }`}
                        >
                          {/* Participant 1 */}
                          <div
                            className={`mb-2 p-2 rounded ${
                              slot1.isWinner
                                ? 'bg-cyber-green/20 border border-cyber-green'
                                : 'bg-bg-tertiary'
                            }`}
                          >
                            {slot1.participant ? (
                              <div className="flex items-center gap-2">
                                <Avatar
                                  src={slot1.participant.user.avatarUrl}
                                  username={slot1.participant.user.username}
                                  size="sm"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-text-primary text-sm font-semibold truncate">
                                    ({slot1.participant.seed}) @{slot1.participant.user.username}
                                  </p>
                                  <p className="text-text-secondary text-xs">ELO: {slot1.participant.user.eloRating}</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-text-secondary text-sm">TBD</p>
                            )}
                          </div>

                          {/* VS divider */}
                          <div className="text-center text-text-secondary text-xs my-1">VS</div>

                          {/* Participant 2 */}
                          <div
                            className={`p-2 rounded ${
                              slot2.isWinner
                                ? 'bg-cyber-green/20 border border-cyber-green'
                                : 'bg-bg-tertiary'
                            }`}
                          >
                            {slot2.participant ? (
                              <div className="flex items-center gap-2">
                                <Avatar
                                  src={slot2.participant.user.avatarUrl}
                                  username={slot2.participant.user.username}
                                  size="sm"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-text-primary text-sm font-semibold truncate">
                                    ({slot2.participant.seed}) @{slot2.participant.user.username}
                                  </p>
                                  <p className="text-text-secondary text-xs">ELO: {slot2.participant.user.eloRating}</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-text-secondary text-sm">TBD</p>
                            )}
                          </div>

                          {/* Match Status & View Debate Button */}
                          <div className="mt-2 flex items-center justify-between">
                            <Badge
                              variant="default"
                              size="sm"
                              className={
                                isActive
                                  ? 'bg-electric-blue text-black'
                                  : isCompleted
                                  ? 'bg-cyber-green text-black'
                                  : 'bg-bg-tertiary text-text-secondary'
                              }
                            >
                              {slot1.matchStatus || 'PENDING'}
                            </Badge>
                            {slot1.debateId && (
                              <Link href={`/debate/${slot1.debateId}`}>
                                <Button variant="secondary" size="sm">
                                  View
                                </Button>
                              </Link>
                            )}
                          </div>
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
    </div>
  )
}

