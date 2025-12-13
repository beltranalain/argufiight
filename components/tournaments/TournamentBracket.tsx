'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { formatStatus } from '@/lib/utils/format-status'

interface Participant {
  id: string
  userId: string
  seed: number
  status: string
  selectedPosition: string | null
  eliminationRound: number | null
  eliminationReason: string | null
  cumulativeScore: number | null
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
  participant1Score: number | null
  participant2Score: number | null
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
  format?: 'BRACKET' | 'CHAMPIONSHIP' | 'KING_OF_THE_HILL'
}

interface BracketSlot {
  participant: Participant | null
  matchId: string | null
  isWinner: boolean
  debateId: string | null
  matchStatus: string | null
  score: number | null
}

export function TournamentBracket({
  participants,
  matches,
  totalRounds,
  currentRound,
  format = 'BRACKET',
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
      let roundMatches = matches.filter((m) => m.round === round)
      
      const roundSlots: BracketSlot[][] = []
      
      // King of the Hill format: Show all participants in a single "Open Debate" card
      if (format === 'KING_OF_THE_HILL') {
        // For King of the Hill (non-finals), match is an array of all participants
        // Get all participants who were in this round (including eliminated ones)
        const roundParticipants = participants.filter((p) => {
          // For elimination rounds, show ALL participants who participated in that round
          // This includes those eliminated in that round or later
          // For finals, show the 2 finalists
          if (round === totalRounds) {
            // Finals: Show only the 2 finalists (those who made it to finals)
            return p.status === 'ACTIVE' || (p.eliminationRound && p.eliminationRound >= round)
          } else {
            // Elimination rounds: Show ALL participants who were in this round
            // Include: active participants, eliminated in this round, or eliminated in later rounds
            // Exclude: only those eliminated BEFORE this round
            return !p.eliminationRound || p.eliminationRound >= round || p.status === 'ACTIVE'
          }
        })
        
        // Create a single "match" with all participants
        if (roundMatches.length > 0) {
          const match = roundMatches[0] // King of the Hill has one match per round
          const allParticipants: BracketSlot[] = roundParticipants.map((p) => ({
            participant: p,
            matchId: match.id,
            isWinner: false, // No individual winners in elimination rounds
            debateId: match.debate?.id || null,
            matchStatus: match.status,
            score: null, // Scores shown separately for King of the Hill
          }))
          
          roundSlots.push(allParticipants)
        }
      } else {
        // Traditional bracket format: 1v1 matches
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
              score: match.participant1Score,
            },
            {
              participant: participant2,
              matchId: match.id,
              isWinner: match.winnerId ? match.winnerId === participant2?.userId : false,
              debateId: match.debate?.id || null,
              matchStatus: match.status,
              score: match.participant2Score,
            },
          ])
        }
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
                    // For King of the Hill (non-finals), match is an array of all participants
                    const isKingOfTheHill = format === 'KING_OF_THE_HILL'
                    const isFinals = isKingOfTheHill && roundNum === totalRounds
                    const isEliminationRound = isKingOfTheHill && !isFinals
                    
                    // For King of the Hill elimination rounds, match is an array of all participants
                    if (isEliminationRound && Array.isArray(match) && match.length > 2) {
                      // Display all participants in a grid
                      const matchStatus = match[0]?.matchStatus || 'UPCOMING'
                      const isActive = matchStatus === 'IN_PROGRESS'
                      const isCompleted = matchStatus === 'COMPLETED'
                      
                      return (
                        <div
                          key={matchIndex}
                          className={`relative z-10 p-4 rounded-lg border-2 ${
                            isActive
                              ? 'border-electric-blue bg-electric-blue/10'
                              : isCompleted
                              ? 'border-cyber-green/50 bg-cyber-green/5'
                              : 'border-bg-tertiary bg-bg-secondary'
                          }`}
                        >
                          <div className="mb-3">
                            <h4 className="text-sm font-semibold text-text-primary">Open Debate</h4>
                            <p className="text-xs text-text-secondary">
                              {match.length} participants
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {match.map((slot, idx) => {
                              const participant = slot.participant
                              if (!participant) return null
                              
                              // Check if participant was eliminated in this round or earlier
                              const isEliminated = participant.status === 'ELIMINATED' && 
                                participant.eliminationRound !== null &&
                                participant.eliminationRound <= roundNum
                              
                              return (
                                <div
                                  key={idx}
                                  className={`p-2 rounded border ${
                                    isEliminated
                                      ? 'bg-red-500/20 border-red-500/50'
                                      : 'bg-bg-tertiary border-bg-tertiary'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {participant.user.avatarUrl ? (
                                      <img
                                        src={participant.user.avatarUrl}
                                        alt={participant.user.username}
                                        className="w-6 h-6 rounded-full"
                                      />
                                    ) : (
                                      <div className="w-6 h-6 rounded-full bg-bg-secondary flex items-center justify-center">
                                        <span className="text-text-secondary text-xs">
                                          {participant.user.username[0].toUpperCase()}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-xs font-semibold truncate ${
                                        isEliminated ? 'text-red-400' : 'text-text-primary'
                                      }`}>
                                        {participant.user.username}
                                      </p>
                                      {participant.cumulativeScore !== null && (
                                        <p className="text-xs text-electric-blue">
                                          {participant.cumulativeScore}/300
                                        </p>
                                      )}
                                    </div>
                                    {isEliminated && (
                                      <Badge variant="default" className="bg-red-500 text-white text-xs">
                                        ✗
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          {match[0]?.debateId && (
                            <Link
                              href={`/debate/${match[0].debateId}`}
                              className="mt-3 block text-center text-xs text-electric-blue hover:underline"
                            >
                              View Debate →
                            </Link>
                          )}
                        </div>
                      )
                    }
                    
                    // Traditional 1v1 match display (or King of the Hill finals)
                    const slot1 = match[0]
                    const slot2 = match[1]
                    const isActive = slot1?.matchStatus === 'IN_PROGRESS' || slot2?.matchStatus === 'IN_PROGRESS'
                    const isCompleted = slot1?.matchStatus === 'COMPLETED' || slot2?.matchStatus === 'COMPLETED'
                    const isFinalRound = roundNum === totalRounds
                    const isFinalWinner = isFinalRound && isCompleted && (slot1?.isWinner || slot2?.isWinner)

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
                            className={`mb-3 p-3 rounded transition-all ${
                              slot1.isWinner && isFinalWinner
                                ? 'bg-cyber-green/30 border-2 border-cyber-green winner-animation'
                                : slot1.isWinner
                                ? 'bg-cyber-green/20 border border-cyber-green winner-animation'
                                : slot1.participant && slot1.participant.status === 'ELIMINATED' && 
                                  slot1.participant.eliminationRound === roundNum
                                ? 'bg-red-500/20 border-2 border-red-500/50'
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
                                  <p className={`text-sm font-semibold truncate ${
                                    slot1.participant.status === 'ELIMINATED' && 
                                    slot1.participant.eliminationRound === roundNum
                                      ? 'text-red-400'
                                      : 'text-text-primary'
                                  }`}>
                                    ({slot1.participant.seed}) @{slot1.participant.user.username}
                                    {slot1.isWinner && isFinalWinner && (
                                      <span className="ml-2 text-cyber-green font-bold">Champion</span>
                                    )}
                                    {slot1.isWinner && !isFinalWinner && (
                                      <span className="ml-2 text-cyber-green">✓ Winner</span>
                                    )}
                                    {slot1.participant.status === 'ELIMINATED' && 
                                     slot1.participant.eliminationRound === roundNum && (
                                      <span className="ml-2 text-red-400">✗ Eliminated</span>
                                    )}
                                  </p>
                                  <p className="text-text-secondary text-xs">ELO: {slot1.participant.user.eloRating}</p>
                                  {slot1.score !== null && (
                                    <p className="text-electric-blue text-xs font-semibold mt-0.5">
                                      Score: {slot1.score}/100
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <p className="text-text-secondary text-sm">TBD</p>
                            )}
                          </div>

                          {/* VS divider */}
                          <div className="text-center text-text-secondary text-xs my-2">VS</div>

                          {/* Participant 2 */}
                          <div
                            className={`p-3 rounded transition-all ${
                              slot2.isWinner && isFinalWinner
                                ? 'bg-cyber-green/30 border-2 border-cyber-green winner-animation'
                                : slot2.isWinner
                                ? 'bg-cyber-green/20 border border-cyber-green winner-animation'
                                : slot2.participant && slot2.participant.status === 'ELIMINATED' && 
                                  slot2.participant.eliminationRound === roundNum
                                ? 'bg-red-500/20 border-2 border-red-500/50'
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
                                  <p className={`text-sm font-semibold truncate ${
                                    slot2.participant.status === 'ELIMINATED' && 
                                    slot2.participant.eliminationRound === roundNum
                                      ? 'text-red-400'
                                      : 'text-text-primary'
                                  }`}>
                                    ({slot2.participant.seed}) @{slot2.participant.user.username}
                                    {slot2.isWinner && isFinalWinner && (
                                      <span className="ml-2 text-cyber-green font-bold">Champion</span>
                                    )}
                                    {slot2.isWinner && !isFinalWinner && (
                                      <span className="ml-2 text-cyber-green">✓ Winner</span>
                                    )}
                                    {slot2.participant.status === 'ELIMINATED' && 
                                     slot2.participant.eliminationRound === roundNum && (
                                      <span className="ml-2 text-red-400">✗ Eliminated</span>
                                    )}
                                  </p>
                                  <p className="text-text-secondary text-xs">ELO: {slot2.participant.user.eloRating}</p>
                                  {slot2.score !== null && (
                                    <p className="text-electric-blue text-xs font-semibold mt-0.5">
                                      Score: {slot2.score}/100
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <p className="text-text-secondary text-sm">TBD</p>
                            )}
                          </div>

                          {/* Match Status & View Debate Button */}
                          <div className="mt-3 flex items-center justify-between gap-3">
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
                              {formatStatus(slot1.matchStatus)}
                            </Badge>
                            {slot1.debateId && (
                              <Link href={`/debate/${slot1.debateId}`} className="flex-shrink-0">
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

