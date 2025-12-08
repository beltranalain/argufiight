/**
 * Tournament Round Advancement Logic
 * Handles checking round completion and advancing to next round or completing tournament
 */

import { prisma } from '@/lib/db/prisma'
import { generateTournamentMatches } from './match-generation'
import { reseedTournamentParticipants } from './reseed'
import { completeTournament } from './tournament-completion'

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
        matches: true,
        tournament: {
          select: {
            id: true,
            currentRound: true,
            totalRounds: true,
            status: true,
            reseedAfterRound: true,
            reseedMethod: true,
          },
        },
      },
    })

    if (!round) {
      console.error(`[Tournament Round] Round ${roundNumber} not found for tournament ${tournamentId}`)
      return
    }

    // Check if all matches are complete
    const allMatchesComplete = round.matches.every((m) => m.status === 'COMPLETED')
    const hasMatches = round.matches.length > 0

    if (!hasMatches) {
      console.log(`[Tournament Round] Round ${roundNumber} has no matches`)
      return
    }

    if (!allMatchesComplete) {
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

