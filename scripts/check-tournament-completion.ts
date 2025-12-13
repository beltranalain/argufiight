/**
 * Check tournament completion status and fix if needed
 * 
 * Usage: npx tsx scripts/check-tournament-completion.ts <tournamentId>
 */

import { PrismaClient } from '@prisma/client'
import { processKingOfTheHillDebateCompletion } from '../lib/tournaments/king-of-the-hill'
import { completeTournament } from '../lib/tournaments/tournament-completion'

const prisma = new PrismaClient()

async function checkTournamentCompletion(tournamentId: string) {
  try {
    console.log(`\n=== Checking Tournament Completion ===`)
    console.log(`Tournament ID: ${tournamentId}\n`)

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
                    challengeType: true,
                    totalRounds: true,
                    currentRound: true,
                  },
                },
              },
            },
          },
          orderBy: {
            roundNumber: 'desc',
          },
        },
        participants: {
          where: {
            status: 'ACTIVE',
          },
          include: {
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    })

    if (!tournament) {
      console.error('❌ Tournament not found')
      return
    }

    console.log(`Tournament: ${tournament.name}`)
    console.log(`Status: ${tournament.status}`)
    console.log(`Format: ${tournament.format}`)
    console.log(`Current Round: ${tournament.currentRound} / ${tournament.totalRounds}`)
    console.log(`Active Participants: ${tournament.participants.length}`)
    console.log(`Total Rounds Created: ${tournament.rounds.length}`)

    if (tournament.format !== 'KING_OF_THE_HILL') {
      console.log('⚠️  This script is for King of the Hill tournaments only')
      return
    }

    // Get the final round (highest round number)
    const finalRound = tournament.rounds[0] // Already ordered desc
    if (!finalRound) {
      console.log('⚠️  No rounds found')
      return
    }

    console.log(`\nFinal Round: ${finalRound.roundNumber}`)
    console.log(`Matches in final round: ${finalRound.matches.length}`)

    if (finalRound.matches.length === 0) {
      console.log('⚠️  No matches in final round')
      return
    }

    const finalMatch = finalRound.matches[0]
    const finalDebate = finalMatch.debate

    if (!finalDebate) {
      console.log('⚠️  Final match has no debate')
      return
    }

    console.log(`\nFinal Debate: ${finalDebate.id}`)
    console.log(`Debate Status: ${finalDebate.status}`)
    console.log(`Debate Type: ${finalDebate.challengeType}`)
    console.log(`Debate Rounds: ${finalDebate.currentRound} / ${finalDebate.totalRounds}`)
    console.log(`Winner ID: ${finalDebate.winnerId || 'None'}`)

    // Check verdicts
    const verdictCount = await prisma.verdict.count({
      where: { debateId: finalDebate.id },
    })
    console.log(`Verdicts: ${verdictCount}`)

    // Check if debate is complete
    if (finalDebate.status === 'COMPLETED' && verdictCount === 0) {
      console.log('\n⚠️  Debate is COMPLETED but has no verdicts!')
      console.log('   This needs verdict generation.')
      
      if (finalDebate.challengeType === 'ONE_ON_ONE') {
        console.log('   Generating standard verdicts for finals...')
        const { generateInitialVerdicts } = await import('../lib/verdicts/generate-initial')
        await generateInitialVerdicts(finalDebate.id)
        console.log('   ✅ Verdicts generated')
      }
    }

    // Check if tournament should be complete
    if (tournament.status !== 'COMPLETED') {
      if (finalDebate.status === 'VERDICT_READY') {
        if (finalDebate.winnerId) {
          console.log('\n✅ Finals has a winner - tournament should be complete!')
          console.log('   Attempting to complete tournament...')
          await completeTournament(tournamentId)
          console.log('   ✅ Tournament completion triggered')
        } else {
          console.log('\n⚠️  Finals is VERDICT_READY but has no winner')
          console.log('   This might be a tie. Checking verdicts...')
          
          // Try to process completion which should handle ties
          await processKingOfTheHillDebateCompletion(finalDebate.id)
          console.log('   ✅ Processed completion')
        }
      } else {
        console.log(`\n⚠️  Finals debate status is ${finalDebate.status}, not VERDICT_READY`)
        console.log('   Tournament cannot complete until finals has verdicts')
      }
    } else {
      console.log('\n✅ Tournament is already COMPLETED')
    }

    // Final status
    const updated = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        status: true,
        currentRound: true,
        totalRounds: true,
      },
    })

    console.log(`\n📊 Final Status:`)
    console.log(`   Status: ${updated?.status}`)
    console.log(`   Rounds: ${updated?.currentRound} / ${updated?.totalRounds}`)

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

const tournamentId = process.argv[2]

if (!tournamentId) {
  console.error('Usage: npx tsx scripts/check-tournament-completion.ts <tournamentId>')
  process.exit(1)
}

checkTournamentCompletion(tournamentId)
