/**
 * Tournament Round Advancement Logic
 * Handles checking round completion and advancing to next round or completing tournament
 */

import { prisma } from '@/lib/db/prisma'
import { generateTournamentMatches } from './match-generation'
import { reseedTournamentParticipants } from './reseed'
import { completeTournament } from './tournament-completion'
import { calculateChampionshipAdvancement } from './championship-advancement'

/**
 * Check if all matches in a round are complete, and advance if needed
 */
export async function checkAndAdvanceTournamentRound(
  tournamentId: string,
  roundNumber: number
): Promise<void> {
  try {
    // Get the round with all matches
    const round = await prisma.tournamentRound.findUnique({
      where: {
        tournamentId_roundNumber: {
          tournamentId,
          roundNumber,
        },
      },
      include: {
        matches: {
          include: {
            participant1: true,
            participant2: true,
          },
        },
        tournament: {
          select: {
            id: true,
            currentRound: true,
            totalRounds: true,
            status: true,
            reseedAfterRound: true,
            reseedMethod: true,
            format: true,
            maxParticipants: true,
          },
        },
      },
    })

    if (!round) {
      console.error(`[Tournament Round] Round ${roundNumber} not found for tournament ${tournamentId}`)
      return
    }

    // For King of the Hill, check if the debate has all submissions
    if (round.tournament.format === 'KING_OF_THE_HILL') {
      const match = round.matches[0] // King of the Hill has one match per round
      if (!match || !match.debateId) {
        console.log(`[King of the Hill] Round ${roundNumber} has no debate yet`)
        return
      }

      const debate = await prisma.debate.findUnique({
        where: { id: match.debateId },
        include: {
          participants: {
            where: { status: 'ACTIVE' },
          },
          statements: {
            where: { round: 1 }, // King of the Hill rounds are single submission rounds
          },
        },
      })

      if (!debate) {
        console.log(`[King of the Hill] Debate ${match.debateId} not found`)
        return
      }

      // Check if all active participants have submitted
      const activeParticipantIds = new Set(debate.participants.map(p => p.userId))
      const submittedParticipantIds = new Set(debate.statements.map(s => s.authorId))
      const allSubmitted = activeParticipantIds.size > 0 && 
        Array.from(activeParticipantIds).every(id => submittedParticipantIds.has(id))

      if (!allSubmitted) {
        console.log(`[King of the Hill] Not all participants have submitted yet (${submittedParticipantIds.size}/${activeParticipantIds.size})`)
        return
      }

      // All submitted - evaluation should have been triggered by match completion
      // Just check if match is completed
      if (match.status !== 'COMPLETED') {
        console.log(`[King of the Hill] Match not completed yet, waiting for evaluation`)
        return
      }
    }

    // Check if all matches are complete (for other formats)
    const allMatchesComplete = round.matches.every((m) => m.status === 'COMPLETED')
    const hasMatches = round.matches.length > 0

    if (!hasMatches) {
      console.log(`[Tournament Round] Round ${roundNumber} has no matches`)
      return
    }

    if (!allMatchesComplete && round.tournament.format !== 'KING_OF_THE_HILL') {
      // Round not complete yet
      const completedCount = round.matches.filter((m) => m.status === 'COMPLETED').length
      console.log(
        `[Tournament Round] Round ${roundNumber} not complete: ${completedCount}/${round.matches.length} matches done`
      )
      return
    }

    // All matches complete - mark round as complete
    await prisma.tournamentRound.update({
      where: { id: round.id },
      data: {
        status: 'COMPLETED',
        endDate: new Date(),
      },
    })

    console.log(`[Tournament Round] Round ${roundNumber} completed for tournament ${tournamentId}`)

    // Check if this is the final round
    if (roundNumber >= round.tournament.totalRounds) {
      // Tournament complete
      console.log(`[Tournament Round] Final round complete - completing tournament ${tournamentId}`)
      await completeTournament(tournamentId)
      return
    }

    // Not final round - generate next round
    const nextRoundNumber = roundNumber + 1
    console.log(`[Tournament Round] Generating next round ${nextRoundNumber} for tournament ${tournamentId}`)

    // For King of the Hill format, evaluate all submissions and eliminate bottom 25%
    if (round.tournament.format === 'KING_OF_THE_HILL') {
      console.log(`[King of the Hill] Round ${roundNumber} complete - evaluating all submissions and eliminating bottom 25%`)

      // Get the debate for this round
      const roundMatch = await prisma.tournamentMatch.findFirst({
        where: {
          roundId: round.id,
        },
        include: {
          debate: true,
        },
      })

      if (!roundMatch || !roundMatch.debateId) {
        throw new Error(`No debate found for King of the Hill round ${roundNumber}`)
      }

      // Evaluate all submissions together
      const { evaluateKingOfTheHillRound } = await import('./king-of-the-hill')
      const eliminationResult = await evaluateKingOfTheHillRound(
        roundMatch.debateId,
        tournamentId,
        roundNumber
      )

      console.log(
        `[King of the Hill] ${eliminationResult.eliminatedParticipantIds.length} participants eliminated, ${eliminationResult.remainingParticipantIds.length} remaining`
      )

      // Mark remaining participants as ACTIVE
      await Promise.all(
        eliminationResult.remainingParticipantIds.map((participantId) =>
          prisma.tournamentParticipant.update({
            where: { id: participantId },
            data: {
              status: 'ACTIVE',
            },
          })
        )
      )

      // Check if we should transition to finals (exactly 2 remaining)
      if (eliminationResult.remainingParticipantIds.length === 2) {
        console.log(`[King of the Hill] Transitioning to finals with 2 participants`)
        // Next round will be created as finals by match generation
        // Continue to generate next round below
      } else if (eliminationResult.remainingParticipantIds.length < 2) {
        console.log(`[King of the Hill] Not enough participants remaining - completing tournament`)
        await completeTournament(tournamentId)
        return
      } else {
        // More than 2 participants remaining - continue to next round
        console.log(`[King of the Hill] ${eliminationResult.remainingParticipantIds.length} participants remaining - continuing to next round`)
        // Continue to generate next round below
      }
    } else if (round.tournament.format === 'CHAMPIONSHIP' && roundNumber === 1) {
      // For Championship format Round 1, use score-based advancement
      console.log(`[Championship] Round 1 complete - calculating score-based advancement`)

      // Calculate which participants advance based on scores
      const advancingParticipantIds = await calculateChampionshipAdvancement(tournamentId, roundNumber)

      // Mark non-advancing participants as eliminated
      const allParticipantIds = round.matches.flatMap((m) => [
        m.participant1Id,
        m.participant2Id,
      ])
      const eliminatedIds = allParticipantIds.filter((id) => !advancingParticipantIds.includes(id))

      await Promise.all(
        eliminatedIds.map((participantId) =>
          prisma.tournamentParticipant.update({
            where: { id: participantId },
            data: {
              status: 'ELIMINATED',
              eliminatedAt: new Date(),
            },
          })
        )
      )

      // Mark advancing participants as ACTIVE
      await Promise.all(
        advancingParticipantIds.map((participantId) =>
          prisma.tournamentParticipant.update({
            where: { id: participantId },
            data: {
              status: 'ACTIVE',
            },
          })
        )
      )

      console.log(
        `[Championship] ${advancingParticipantIds.length} participants advancing, ${eliminatedIds.length} eliminated`
      )
    } else {
      // For Bracket format or Championship Round 2+, use standard winner-based advancement
      // (Already handled by match completion logic marking winners/losers)
    }

    // Reseed if enabled
    if (round.tournament.reseedAfterRound) {
      await reseedTournamentParticipants(tournamentId, round.tournament.reseedMethod)
    }

    // Update tournament current round
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        currentRound: nextRoundNumber,
      },
    })

    // Generate matches for next round
    await generateTournamentMatches(tournamentId, nextRoundNumber)

    // Get the new round and create debates for matches
    const nextRound = await prisma.tournamentRound.findUnique({
      where: {
        tournamentId_roundNumber: {
          tournamentId,
          roundNumber: nextRoundNumber,
        },
      },
      include: {
        matches: {
          include: {
            participant1: {
              include: {
                user: true,
              },
            },
            participant2: {
              include: {
                user: true,
              },
            },
          },
        },
        tournament: {
          select: {
            name: true,
            roundDuration: true,
          },
        },
      },
    })

    if (!nextRound) {
      throw new Error(`Failed to create next round ${nextRoundNumber}`)
    }

    // Create debates for each match in the new round
    for (const match of nextRound.matches) {
      const participant1 = match.participant1.user
      const participant2 = match.participant2.user

      const debateTopic = `${nextRound.tournament.name} - Round ${nextRound.roundNumber}, Match ${match.id.slice(0, 8)}`

      const debate = await prisma.debate.create({
        data: {
          topic: debateTopic,
          description: `Tournament match: ${participant1.username} vs ${participant2.username}`,
          category: 'SPORTS', // Default category
          challengerId: participant1.id,
          challengerPosition: 'FOR',
          opponentPosition: 'AGAINST',
          opponentId: participant2.id,
          totalRounds: 3, // Tournament matches are 3 rounds
          roundDuration: nextRound.tournament.roundDuration * 3600000, // Convert hours to milliseconds
          speedMode: false,
          allowCopyPaste: true,
          status: 'ACTIVE',
        },
      })

      // Link debate to match
      await prisma.tournamentMatch.update({
        where: { id: match.id },
        data: {
          debateId: debate.id,
          status: 'IN_PROGRESS',
        },
      })

      console.log(`[Tournament Round] Created debate ${debate.id} for match ${match.id} in round ${nextRoundNumber}`)
    }

    console.log(`[Tournament Round] Round ${nextRoundNumber} generated with ${nextRound.matches.length} matches`)
  } catch (error: any) {
    console.error(`[Tournament Round] Error advancing round:`, error)
    throw error
  }
}

