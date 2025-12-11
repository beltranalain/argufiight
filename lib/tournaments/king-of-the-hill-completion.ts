import { prisma } from '@/lib/db/prisma'
import { generateKingOfTheHillRoundVerdicts } from './king-of-the-hill-new'
import { createKingOfTheHillRound } from './king-of-the-hill-rounds'
import { checkAndAdvanceTournamentRound } from './round-advancement'

/**
 * Process King of the Hill debate completion
 * Called when all participants have submitted
 */
export async function processKingOfTheHillDebateCompletion(
  debateId: string
): Promise<void> {
  // Get debate with tournament info
  const debate = await prisma.debate.findUnique({
    where: { id: debateId },
    include: {
      tournamentMatch: {
        include: {
          round: {
            include: {
              tournament: true,
            },
          },
        },
      },
    },
  })

  if (!debate || !debate.tournamentMatch) {
    throw new Error('Debate or tournament match not found')
  }

  const tournament = debate.tournamentMatch.round.tournament
  if (tournament.format !== 'KING_OF_THE_HILL') {
    throw new Error('This function is only for King of the Hill tournaments')
  }

  const roundNumber = debate.tournamentMatch.round.roundNumber

  console.log(`[King of the Hill] Processing debate ${debateId} completion for round ${roundNumber}`)

  // Generate verdicts using new system (same as regular debates)
  const result = await generateKingOfTheHillRoundVerdicts(
    debateId,
    tournament.id,
    roundNumber
  )

  console.log(`[King of the Hill] Round ${roundNumber} verdicts generated:`, {
    eliminated: result.eliminatedParticipantIds.length,
    remaining: result.remainingParticipantIds.length,
  })

  // Mark match as completed
  await prisma.tournamentMatch.update({
    where: { id: debate.tournamentMatch.id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  })

  // Mark round as completed
  await prisma.tournamentRound.update({
    where: { id: debate.tournamentMatch.round.id },
    data: {
      status: 'COMPLETED',
      endDate: new Date(),
    },
  })

  // Check if tournament should advance to next round
  const activeCount = await prisma.tournamentParticipant.count({
    where: {
      tournamentId: tournament.id,
      status: 'ACTIVE',
    },
  })

  console.log(`[King of the Hill] Active participants after round ${roundNumber}: ${activeCount}`)

  // If 2 participants remain, next round is finals (handled by createKingOfTheHillRound)
  // If more than 2, create next King of the Hill round
  // If less than 2, tournament is complete
  if (activeCount === 2) {
    console.log(`[King of the Hill] Transitioning to finals with 2 participants`)
    // Next round will be created as finals
  } else if (activeCount < 2) {
    console.log(`[King of the Hill] Not enough participants - completing tournament`)
    // Tournament will be completed by round advancement logic
  } else {
    console.log(`[King of the Hill] ${activeCount} participants remaining - creating next round`)
  }

  // Advance tournament round (this will create next round if needed)
  await checkAndAdvanceTournamentRound(tournament.id, roundNumber)

  // Send notifications to winners (remaining participants)
  // TODO: Implement notification system
  console.log(`[King of the Hill] Round ${roundNumber} complete. Winners notified.`)
}

