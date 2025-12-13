/**
 * Tournament Completion Logic
 * Handles completing tournaments when final round finishes
 */

import { prisma } from '@/lib/db/prisma'

/**
 * Complete a tournament - called when final round finishes
 */
export async function completeTournament(tournamentId: string): Promise<void> {
  try {
    // First get tournament to know totalRounds
    const tournamentInfo = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        totalRounds: true,
        status: true,
      },
    })

    if (!tournamentInfo) {
      throw new Error(`Tournament ${tournamentId} not found`)
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        rounds: {
          where: {
            roundNumber: tournamentInfo.totalRounds, // Get the final round
          },
          include: {
            matches: {
              where: {
                status: 'COMPLETED',
              },
              include: {
                winner: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        username: true,
                      },
                    },
                  },
                },
                debate: {
                  select: {
                    id: true,
                    winnerId: true,
                  },
                },
              },
              orderBy: {
                completedAt: 'desc',
              },
              take: 1, // Get the last completed match (should be the final)
            },
          },
        },
      },
    })

    if (!tournament) {
      throw new Error(`Tournament ${tournamentId} not found`)
    }

    if (tournament.status === 'COMPLETED') {
      console.log(`[Tournament Completion] Tournament ${tournamentId} already completed`)
      return
    }

    // Find the champion (the last remaining active participant or winner of final match)
    let champion = tournament.participants.find((p) => p.status === 'ACTIVE')

    // If no active participant, try to find from final match winner
    if (!champion) {
      const finalRound = tournament.rounds.find((r) => r.roundNumber === tournamentInfo.totalRounds)
      if (finalRound && finalRound.matches.length > 0) {
        const finalMatch = finalRound.matches[0]
        if (finalMatch.winner) {
          champion = tournament.participants.find((p) => p.id === finalMatch.winner!.id)
        }
      }
    }

    // For King of the Hill: Also check debate winner if no active participant
    if (!champion && tournament.format === 'KING_OF_THE_HILL') {
      const finalRound = tournament.rounds.find((r) => r.roundNumber === tournamentInfo.totalRounds)
      if (finalRound && finalRound.matches.length > 0) {
        const finalMatch = finalRound.matches[0]
        if (finalMatch.debate?.winnerId) {
          champion = tournament.participants.find((p) => p.userId === finalMatch.debate!.winnerId)
        }
      }
    }

    if (!champion) {
      console.error(`[Tournament Completion] Could not determine champion for tournament ${tournamentId}`)
      // Still mark tournament as completed even if we can't find champion
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: {
          status: 'COMPLETED',
          endDate: new Date(),
        },
      })
      return
    }

    // King of the Hill: Winner Takes All - Sum all eliminated participants' cumulative scores
    if (tournament.format === 'KING_OF_THE_HILL') {
      const eliminatedParticipants = tournament.participants.filter(
        (p) => p.status === 'ELIMINATED'
      )

      const totalEliminatedScore = eliminatedParticipants.reduce(
        (sum, p) => sum + (p.cumulativeScore || 0),
        0
      )

      if (totalEliminatedScore > 0) {
        // Add eliminated participants' scores to champion's cumulative score
        const championCurrentScore = champion.cumulativeScore || 0
        const newChampionScore = championCurrentScore + totalEliminatedScore

        await prisma.tournamentParticipant.update({
          where: { id: champion.id },
          data: {
            cumulativeScore: newChampionScore,
          },
        })

        console.log(
          `[Tournament Completion] King of the Hill - Winner Takes All: Champion ${champion.user.username} received ${totalEliminatedScore} points from ${eliminatedParticipants.length} eliminated participants. New total: ${newChampionScore}`
        )
      }
    }

    // Update tournament
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        status: 'COMPLETED',
        endDate: new Date(),
      },
    })

    console.log(`[Tournament Completion] Tournament ${tournamentId} completed. Champion: ${champion.user.username}`)

    // Create notifications for all participants
    await createTournamentCompletionNotifications(tournamentId, champion.userId)
  } catch (error: any) {
    console.error(`[Tournament Completion] Error completing tournament ${tournamentId}:`, error)
    throw error
  }
}

/**
 * Create notifications for all participants when tournament completes
 */
async function createTournamentCompletionNotifications(
  tournamentId: string,
  championUserId: string
): Promise<void> {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    })

    if (!tournament) {
      return
    }

    const notifications = tournament.participants.map((participant) => {
      const isChampion = participant.userId === championUserId
      return {
        userId: participant.userId,
        type: isChampion ? 'TOURNAMENT_WON' : 'TOURNAMENT_COMPLETED',
        title: isChampion ? 'Tournament Champion!' : 'Tournament Completed',
        message: isChampion
          ? `Congratulations! You won "${tournament.name}"!`
          : `The tournament "${tournament.name}" has completed.`,
        // Note: Tournament notifications might not have a debateId, so we'll use raw SQL if needed
      }
    })

    // Use valid notification types from enum
    for (const notif of notifications) {
      try {
        await prisma.notification.create({
          data: {
            userId: notif.userId,
            type: notif.type === 'TOURNAMENT_WON' ? 'DEBATE_WON' : 'DEBATE_TIED', // Fallback to existing types (DEBATE_TIED is valid)
            title: notif.title,
            message: notif.message,
          },
        })
      } catch (error) {
        // If notification creation fails, log but don't throw
        console.error(`Failed to create notification for user ${notif.userId}:`, error)
      }
    }

    console.log(`[Tournament Completion] Created ${notifications.length} notifications for tournament ${tournamentId}`)
  } catch (error: any) {
    console.error(`[Tournament Completion] Error creating notifications:`, error)
    // Don't throw - notifications are not critical
  }
}

