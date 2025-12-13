/**
 * Fix tournament match status for completed tournaments
 * Updates match status to COMPLETED when tournament is completed
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixMatchStatus(tournamentId: string) {
  try {
    console.log(`\n🔍 Checking tournament ${tournamentId}...`)

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        rounds: {
          include: {
            matches: {
              include: {
                debate: {
                  select: {
                    id: true,
                    status: true,
                    winnerId: true,
                  },
                },
              },
            },
          },
          orderBy: {
            roundNumber: 'desc',
          },
        },
      },
    })

    if (!tournament) {
      console.log(`❌ Tournament not found: ${tournamentId}`)
      return
    }

    if (tournament.status !== 'COMPLETED') {
      console.log(`⚠️  Tournament is not completed: ${tournament.status}`)
      return
    }

    console.log(`✅ Tournament: ${tournament.name}`)
    console.log(`   Status: ${tournament.status}`)

    // Update all matches to COMPLETED if they have a completed debate
    let updatedCount = 0
    for (const round of tournament.rounds) {
      for (const match of round.matches) {
        if (match.debate && match.debate.status === 'VERDICT_READY' && match.debate.winnerId) {
          if (match.status !== 'COMPLETED') {
            console.log(`\n🔧 Updating match ${match.id} (Round ${round.roundNumber}) to COMPLETED`)
            await prisma.tournamentMatch.update({
              where: { id: match.id },
              data: {
                status: 'COMPLETED',
                completedAt: new Date(),
              },
            })
            updatedCount++
          } else {
            console.log(`✅ Match ${match.id} (Round ${round.roundNumber}) already COMPLETED`)
          }
        }
      }
    }

    console.log(`\n✅ Updated ${updatedCount} match(es) to COMPLETED`)

  } catch (error: any) {
    console.error(`\n❌ Error fixing tournament ${tournamentId}:`, error)
    throw error
  }
}

// Main execution
async function main() {
  const tournamentId = process.argv[2]

  if (!tournamentId) {
    console.error('Usage: tsx scripts/fix-tournament-match-status.ts <tournament-id>')
    console.error('Example: tsx scripts/fix-tournament-match-status.ts 649ac15a-3215-4d3e-a7c1-b789367259fe')
    process.exit(1)
  }

  try {
    await fixMatchStatus(tournamentId)
    console.log(`\n✅ Fix completed successfully`)
  } catch (error: any) {
    console.error(`\n❌ Fix failed:`, error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
