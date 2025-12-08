/**
 * Tournament Match Completion Logic
 * Handles updating tournament matches when debates complete
 */

import { prisma } from '@/lib/db/prisma'
import { checkAndAdvanceTournamentRound } from './round-advancement'

/**
 * Update tournament match when linked debate completes
 * Called after verdict is generated and debate status is VERDICT_READY
 */
export async function updateTournamentMatchOnDebateComplete(debateId: string): Promise<void> {
  try {
    // Find the tournament match linked to this debate
    const match = await prisma.tournamentMatch.findUnique({
      where: { debateId },
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
        round: {
          include: {
            tournament: true,
          },
        },
        debate: {
          select: {
            id: true,
            winnerId: true,
            challengerId: true,
            opponentId: true,
            status: true,
          },
        },
      },
    })

    if (!match) {
      // Not a tournament debate, nothing to do
      return
    }

    // Check if debate has a winner
    if (!match.debate || match.debate.status !== 'VERDICT_READY' || !match.debate.winnerId) {
      console.log(`[Tournament Match] Debate ${debateId} not ready for match completion (status: ${match.debate?.status}, winner: ${match.debate?.winnerId})`)
      return
    }

    // Determine which participant won
    let winningParticipantId: string | null = null
    let losingParticipantId: string | null = null

    if (match.debate.winnerId === match.debate.challengerId) {
      // Challenger won - check if they're participant1 or participant2
      if (match.participant1.userId === match.debate.challengerId) {
        winningParticipantId = match.participant1Id
        losingParticipantId = match.participant2Id
      } else if (match.participant2.userId === match.debate.challengerId) {
        winningParticipantId = match.participant2Id
        losingParticipantId = match.participant1Id
      }
    } else if (match.debate.winnerId === match.debate.opponentId) {
      // Opponent won
      if (match.participant1.userId === match.debate.opponentId) {
        winningParticipantId = match.participant1Id
        losingParticipantId = match.participant2Id
      } else if (match.participant2.userId === match.debate.opponentId) {
        winningParticipantId = match.participant2Id
        losingParticipantId = match.participant1Id
      }
    }

    if (!winningParticipantId || !losingParticipantId) {
      console.error(`[Tournament Match] Could not determine winner for match ${match.id}`)
      return
    }

    // Update match
    await prisma.tournamentMatch.update({
      where: { id: match.id },
      data: {
        winnerId: winningParticipantId,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    })

    // Update participant stats
    await Promise.all([
      // Winner
      prisma.tournamentParticipant.update({
        where: { id: winningParticipantId },
        data: {
          wins: { increment: 1 },
          status: 'ACTIVE',
        },
      }),
      // Loser
      prisma.tournamentParticipant.update({
        where: { id: losingParticipantId },
        data: {
          losses: { increment: 1 },
          status: 'ELIMINATED',
          eliminatedAt: new Date(),
        },
      }),
    ])

    console.log(`[Tournament Match] Match ${match.id} completed. Winner: ${winningParticipantId}, Loser: ${losingParticipantId}`)

    // Check if round is complete and advance if needed
    await checkAndAdvanceTournamentRound(match.round.tournamentId, match.round.roundNumber)
  } catch (error: any) {
    console.error(`[Tournament Match] Error updating match for debate ${debateId}:`, error)
    // Don't throw - we don't want to break verdict generation if tournament update fails
  }
}

