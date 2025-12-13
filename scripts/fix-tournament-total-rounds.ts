/**
 * Fix tournament totalRounds for King of the Hill tournaments
 * Updates totalRounds to match the actual highest round number created
 * 
 * Usage: npx tsx scripts/fix-tournament-total-rounds.ts <tournamentId>
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixTournamentTotalRounds(tournamentId: string) {
  try {
    console.log(`\n=== Fixing Tournament Total Rounds ===`)
    console.log(`Tournament ID: ${tournamentId}\n`)

    // Get tournament with rounds
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        rounds: {
          select: {
            roundNumber: true,
          },
          orderBy: {
            roundNumber: 'desc',
          },
        },
      },
    })

    if (!tournament) {
      console.error('❌ Tournament not found')
      return
    }

    console.log(`Tournament: ${tournament.name}`)
    console.log(`Format: ${tournament.format}`)
    console.log(`Current totalRounds: ${tournament.totalRounds}`)
    console.log(`Current currentRound: ${tournament.currentRound}`)
    console.log(`Actual rounds created: ${tournament.rounds.length}`)

    if (tournament.rounds.length === 0) {
      console.log('⚠️  No rounds found. Tournament may not have started yet.')
      return
    }

    // Find the highest round number
    const highestRound = tournament.rounds[0]?.roundNumber || tournament.currentRound
    console.log(`Highest round number: ${highestRound}`)

    if (highestRound === tournament.totalRounds) {
      console.log('✅ totalRounds is already correct!')
      return
    }

    // Update totalRounds to match the highest round
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        totalRounds: highestRound,
      },
    })

    console.log(`\n✅ Updated totalRounds from ${tournament.totalRounds} to ${highestRound}`)
    console.log(`Tournament should now show: ${tournament.currentRound} / ${highestRound}`)

  } catch (error: any) {
    console.error('❌ Error fixing tournament:', error.message)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

// Get tournament ID from command line
const tournamentId = process.argv[2]

if (!tournamentId) {
  console.error('Usage: npx tsx scripts/fix-tournament-total-rounds.ts <tournamentId>')
  console.error('Example: npx tsx scripts/fix-tournament-total-rounds.ts 649ac15a-3215-4d3e-a7c1-b789367259fe')
  process.exit(1)
}

fixTournamentTotalRounds(tournamentId)
