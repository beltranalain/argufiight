/**
 * Fix King of the Hill tournaments where the finals loser wasn't marked as ELIMINATED
 * This script identifies completed tournaments and marks the finals loser as eliminated
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixFinalsLoser(tournamentId: string) {
  try {
    console.log(`\n🔍 Checking tournament ${tournamentId}...`)

    // Get tournament with all necessary data
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
          include: {
            matches: {
              include: {
                debate: {
                  select: {
                    id: true,
                    winnerId: true,
                    challengerId: true,
                    opponentId: true,
                    status: true,
                  },
                },
                participant1: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        username: true,
                      },
                    },
                  },
                },
                participant2: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        username: true,
                      },
                    },
                  },
                },
              },
              orderBy: {
                id: 'asc',
              },
            },
          },
          orderBy: {
            roundNumber: 'desc', // Start with final round
          },
        },
      },
    })

    if (!tournament) {
      console.log(`❌ Tournament not found: ${tournamentId}`)
      return
    }

    if (tournament.format !== 'KING_OF_THE_HILL') {
      console.log(`⚠️  Tournament is not King of the Hill format: ${tournament.format}`)
      return
    }

    if (tournament.status !== 'COMPLETED') {
      console.log(`⚠️  Tournament is not completed: ${tournament.status}`)
      return
    }

    console.log(`✅ Tournament: ${tournament.name}`)
    console.log(`   Format: ${tournament.format}`)
    console.log(`   Status: ${tournament.status}`)
    console.log(`   Total Rounds: ${tournament.totalRounds}`)

    // Find the final round (highest round number)
    const finalRound = tournament.rounds.length > 0
      ? tournament.rounds.reduce((latest, round) =>
          round.roundNumber > latest.roundNumber ? round : latest
        )
      : null

    if (!finalRound) {
      console.log(`❌ No rounds found`)
      return
    }

    console.log(`\n📊 Final Round: ${finalRound.roundNumber}`)
    console.log(`   Matches: ${finalRound.matches.length}`)

    // Find the finals match (should be 1v1 for King of the Hill)
    const finalsMatch = finalRound.matches.find(m => 
      m.participant1 && m.participant2 && m.debate
    )

    if (!finalsMatch) {
      console.log(`❌ No finals match found`)
      return
    }

    console.log(`\n🏆 Finals Match:`)
    console.log(`   Participant 1: @${finalsMatch.participant1.user.username} (${finalsMatch.participant1.user.id})`)
    console.log(`   Participant 2: @${finalsMatch.participant2.user.username} (${finalsMatch.participant2.user.id})`)

    // Get debate winner
    const debate = finalsMatch.debate
    if (!debate || !debate.winnerId) {
      console.log(`❌ Finals debate has no winner`)
      console.log(`   Debate status: ${debate?.status}`)
      console.log(`   Winner ID: ${debate?.winnerId}`)
      return
    }

    console.log(`\n🎯 Debate Winner: ${debate.winnerId}`)

    // Determine winner and loser
    const winnerUserId = debate.winnerId
    const loserUserId = winnerUserId === debate.challengerId 
      ? debate.opponentId 
      : debate.challengerId

    if (!loserUserId) {
      console.log(`❌ Could not determine loser`)
      return
    }

    // Find winner and loser participants
    const winnerParticipant = tournament.participants.find(
      p => p.userId === winnerUserId
    )
    const loserParticipant = tournament.participants.find(
      p => p.userId === loserUserId
    )

    if (!winnerParticipant) {
      console.log(`❌ Winner participant not found: ${winnerUserId}`)
      return
    }

    if (!loserParticipant) {
      console.log(`❌ Loser participant not found: ${loserUserId}`)
      return
    }

    console.log(`\n👑 Winner: @${winnerParticipant.user.username}`)
    console.log(`   Status: ${winnerParticipant.status}`)
    console.log(`   Elimination Round: ${winnerParticipant.eliminationRound}`)

    console.log(`\n💀 Loser: @${loserParticipant.user.username}`)
    console.log(`   Status: ${loserParticipant.status}`)
    console.log(`   Elimination Round: ${loserParticipant.eliminationRound}`)

    // Check if loser is already marked as eliminated
    if (loserParticipant.status === 'ELIMINATED' && 
        loserParticipant.eliminationRound === finalRound.roundNumber) {
      console.log(`\n✅ Loser is already correctly marked as eliminated in round ${finalRound.roundNumber}`)
      return
    }

    // Mark loser as eliminated
    console.log(`\n🔧 Marking loser as eliminated...`)
    await prisma.tournamentParticipant.update({
      where: { id: loserParticipant.id },
      data: {
        status: 'ELIMINATED',
        eliminatedAt: new Date(),
        eliminationRound: finalRound.roundNumber,
        eliminationReason: 'Eliminated in finals - lost to champion',
      },
    })

    console.log(`\n✅ Successfully marked @${loserParticipant.user.username} as eliminated in round ${finalRound.roundNumber}`)

    // Verify winner is marked as ACTIVE
    if (winnerParticipant.status !== 'ACTIVE') {
      console.log(`\n🔧 Marking winner as ACTIVE...`)
      await prisma.tournamentParticipant.update({
        where: { id: winnerParticipant.id },
        data: {
          status: 'ACTIVE',
        },
      })
      console.log(`✅ Winner marked as ACTIVE`)
    }

  } catch (error: any) {
    console.error(`\n❌ Error fixing tournament ${tournamentId}:`, error)
    throw error
  }
}

// Main execution
async function main() {
  const tournamentId = process.argv[2]

  if (!tournamentId) {
    console.error('Usage: tsx scripts/fix-king-of-the-hill-finals-loser.ts <tournament-id>')
    console.error('Example: tsx scripts/fix-king-of-the-hill-finals-loser.ts 649ac15a-3215-4d3e-a7c1-b789367259fe')
    process.exit(1)
  }

  try {
    await fixFinalsLoser(tournamentId)
    console.log(`\n✅ Fix completed successfully`)
  } catch (error: any) {
    console.error(`\n❌ Fix failed:`, error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
