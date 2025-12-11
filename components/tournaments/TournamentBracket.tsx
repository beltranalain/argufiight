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
  const isKingOfTheHill = format === 'KING_OF_THE_HILL'
  
  // Build bracket structure
  const bracketStructure = useMemo(() => {
    const structure: BracketSlot[][][] = [] // [round][match][slot]
    
    // Helper to find participant by ID
    const findParticipant = (participantId: string | null): Participant | null => {
      if (!participantId) return null
      return participants.find((p) => p.id === participantId) || null
    }
    
    // For King of the Hill, get active participants for each round
    const getActiveParticipantsForRound = (round: number): Participant[] => {
      if (!isKingOfTheHill) return []
      
      // For finals (last round), only 2 participants remain
      if (round === totalRounds) {
        // Get participants from the match (finals is 1v1)
        const roundMatch = matches.find((m) => m.round === round)
        if (roundMatch) {
          const p1 = findParticipant(roundMatch.participant1Id)
          const p2 = findParticipant(roundMatch.participant2Id)
          return [p1, p2].filter((p): p is Participant => p !== null)
        }
        return []
      }
      
      // For non-finals rounds, get all active participants
      // Active = not eliminated (status is ACTIVE or REGISTERED)
      return participants.filter((p) => 
        p.status === 'ACTIVE' || p.status === 'REGISTERED'
      )
    }
    
    // Build bracket round by round
    for (let round = 1; round <= totalRounds; round++) {
      const roundMatches = matches.filter((m) => m.round === round)
      const roundSlots: BracketSlot[][] = []
      
      if (isKingOfTheHill && round < totalRounds) {
        // King of the Hill: Show all active participants in a single "open debate" box
        // For each round, get participants who were active at the START of that round
        // For Round 1: All registered participants
        // For Round 2+: Participants who survived previous rounds (ACTIVE status, not eliminated in previous rounds)
        let activeParticipants: Participant[] = []
        
        if (round === 1) {
          // Round 1: Show all registered participants (before any eliminations)
          activeParticipants = participants.filter(p => 
            p.status === 'REGISTERED' || p.status === 'ACTIVE' || 
            (p.status === 'ELIMINATED' && (p.eliminationRound === null || p.eliminationRound > round))
          )
        } else {
          // Round 2+: Show participants who were not eliminated in previous rounds
          // They should be ACTIVE and not eliminated in rounds 1 through (round-1)
          activeParticipants = participants.filter(p => {
            if (p.status === 'ELIMINATED') {
              // Only include if eliminated in a later round (shouldn't happen, but safety check)
              return p.eliminationRound !== null && p.eliminationRound >= round
            }
            // Include ACTIVE participants (they survived previous rounds)
            return p.status === 'ACTIVE'
          })
        }
        
        const roundMatch = roundMatches[0] // King of the Hill has one match per round
        
        // Show the round even if match doesn't exist yet (for upcoming rounds)
        if (activeParticipants.length > 0) {
          // Create slots for all active participants
          const allParticipants: BracketSlot[] = activeParticipants.map((participant) => ({
            participant,
            matchId: roundMatch?.id || null,
            isWinner: roundMatch?.winnerId ? roundMatch.winnerId === participant.userId : false,
            debateId: roundMatch?.debate?.id || null,
            matchStatus: roundMatch?.status || 'UPCOMING',
            score: null, // Scores are per-participant, not per-match for King of the Hill
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
  }, [participants, matches, totalRounds, isKingOfTheHill])

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
                    const isKingOfTheHillRound = isKingOfTheHill && roundNum < totalRounds
                    const slot1 = match[0]
                    const slot2 = match[1]
                    const isActive = slot1?.matchStatus === 'IN_PROGRESS' || slot2?.matchStatus === 'IN_PROGRESS'
                    const isCompleted = slot1?.matchStatus === 'COMPLETED' || slot2?.matchStatus === 'COMPLETED'
                    const isFinalRound = roundNum === totalRounds
                    const isFinalWinner = isFinalRound && isCompleted && (slot1?.isWinner || slot2?.isWinner)
                    
                    // King of the Hill: Show all participants in one box
                    if (isKingOfTheHillRound) {
                      const allParticipants = match.filter((slot) => slot.participant !== null)
                      const debateId = slot1?.debateId
                      
                      return (
                        <div
                          key={matchIndex}
                          className="relative"
                          style={{ minHeight: `${getSlotHeight(roundNum)}px` }}
                        >
                          {/* Match Card - Open Debate with All Participants */}
                          <div
                            className={`relative z-10 p-4 rounded-lg border-2 ${
                              isActive
                                ? 'border-electric-blue bg-electric-blue/10'
                                : isCompleted
                                ? 'border-cyber-green/50 bg-cyber-green/5'
                                : 'border-bg-tertiary bg-bg-secondary'
                            }`}
                          >
                            <div className="mb-3 text-center">
                              <h4 className="text-lg font-bold text-text-primary mb-1">Open Debate</h4>
                              <p className="text-sm text-text-secondary">
                                All {allParticipants.length} participants submit simultaneously
                              </p>
                            </div>
                            
                            {/* All Participants Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                              {allParticipants.map((slot, idx) => (
                                <div
                                  key={idx}
                                  className={`p-3 rounded transition-all ${
                                    slot.isWinner
                                      ? 'bg-cyber-green/20 border border-cyber-green'
                                      : 'bg-bg-tertiary'
                                  }`}
                                >
                                  {slot.participant && (
                                    <div className="flex items-center gap-2">
                                      <Avatar
                                        src={slot.participant.user.avatarUrl}
                                        username={slot.participant.user.username}
                                        size="sm"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-text-primary text-sm font-semibold truncate">
                                          ({slot.participant.seed}) @{slot.participant.user.username}
                                          {slot.isWinner && (
                                            <span className="ml-2 text-cyber-green">✓ Advanced</span>
                                          )}
                                        </p>
                                        <p className="text-text-secondary text-xs">ELO: {slot.participant.user.eloRating}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            {/* Match Status & View Debate Button */}
                            <div className="flex items-center justify-between gap-3">
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
                                {formatStatus(slot1?.matchStatus || 'PENDING')}
                              </Badge>
                              {debateId && (
                                <Link href={`/debate/${debateId}`} className="flex-shrink-0">
                                  <Button variant="secondary" size="sm">
                                    View
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    }
                    
                    // Traditional 1v1 match display

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
                                    {slot1.isWinner && isFinalWinner && (
                                      <span className="ml-2 text-cyber-green font-bold">Champion</span>
                                    )}
                                    {slot1.isWinner && !isFinalWinner && (
                                      <span className="ml-2 text-cyber-green">✓ Winner</span>
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
                                    {slot2.isWinner && isFinalWinner && (
                                      <span className="ml-2 text-cyber-green font-bold">Champion</span>
                                    )}
                                    {slot2.isWinner && !isFinalWinner && (
                                      <span className="ml-2 text-cyber-green">✓ Winner</span>
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

