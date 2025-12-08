/**
 * Diagnostic script to check tournament scores and wins/losses
 * Run: npx tsx scripts/check-tournament-scores.ts [tournamentId]
 */

import { prisma } from '@/lib/db/prisma'

async function checkTournamentScores(tournamentId?: string) {
  try {
    console.log('🔍 Checking tournament scores and wins/losses...\n')

    // Get tournaments
    const where = tournamentId ? { id: tournamentId } : {}
    const tournaments = await prisma.tournament.findMany({
      where,
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
          orderBy: {
            seed: 'asc',
          },
        },
        matches: {
          include: {
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
            round: {
              select: {
                roundNumber: true,
              },
            },
          },
          orderBy: {
            round: {
              roundNumber: 'asc',
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: tournamentId ? 1 : 5,
    })

    if (tournaments.length === 0) {
      console.log('❌ No tournaments found')
      return
    }

    for (const tournament of tournaments) {
      console.log(`\n📊 Tournament: ${tournament.name}`)
      console.log(`   ID: ${tournament.id}`)
      console.log(`   Status: ${tournament.status}`)
      console.log(`   Format: ${tournament.format}`)
      console.log(`   Current Round: ${tournament.currentRound} / ${tournament.totalRounds}`)
      console.log(`   Participants: ${tournament.participants.length}`)
      console.log(`   Matches: ${tournament.matches.length}`)

      // Check participants
      console.log(`\n👥 Participants:`)
      for (const participant of tournament.participants) {
        console.log(`   ${participant.seed}. @${participant.user.username}`)
        console.log(`      Status: ${participant.status}`)
        console.log(`      Wins: ${participant.wins}`)
        console.log(`      Losses: ${participant.losses}`)
        console.log(`      ELO at Start: ${participant.eloAtStart}`)
        if (participant.selectedPosition) {
          console.log(`      Position: ${participant.selectedPosition}`)
        }
      }

      // Check matches
      console.log(`\n🏆 Matches:`)
      const matchesByRound = tournament.matches.reduce((acc, match) => {
        const roundNum = match.round?.roundNumber || 0
        if (!acc[roundNum]) acc[roundNum] = []
        acc[roundNum].push(match)
        return acc
      }, {} as Record<number, typeof tournament.matches>)

      for (const [roundNum, matches] of Object.entries(matchesByRound).sort((a, b) => Number(a) - Number(b))) {
        console.log(`\n   Round ${roundNum}:`)
        for (const match of matches) {
          const p1 = match.participant1.user.username
          const p2 = match.participant2.user.username
          const winner = match.winner?.user.username || 'None'
          const status = match.status
          
          console.log(`      ${p1} vs ${p2}`)
          console.log(`         Status: ${status}`)
          console.log(`         Winner: ${winner}`)
          
          if (tournament.format === 'CHAMPIONSHIP') {
            console.log(`         P1 Score: ${match.participant1Score ?? 'N/A'}/100`)
            console.log(`         P2 Score: ${match.participant2Score ?? 'N/A'}/100`)
          }
        }
      }

      // Verify wins/losses match match results
      console.log(`\n✅ Verification:`)
      for (const participant of tournament.participants) {
        const winsFromMatches = tournament.matches.filter(
          m => m.winnerId === participant.id
        ).length
        
        const lossesFromMatches = tournament.matches.filter(
          m => (m.participant1Id === participant.id || m.participant2Id === participant.id) &&
               m.winnerId !== null &&
               m.winnerId !== participant.id
        ).length

        const matchesParticipated = tournament.matches.filter(
          m => m.participant1Id === participant.id || m.participant2Id === participant.id
        ).length

        console.log(`   @${participant.user.username}:`)
        console.log(`      Recorded: ${participant.wins}W ${participant.losses}L`)
        console.log(`      From Matches: ${winsFromMatches}W ${lossesFromMatches}L`)
        console.log(`      Matches Participated: ${matchesParticipated}`)
        
        if (participant.wins !== winsFromMatches || participant.losses !== lossesFromMatches) {
          console.log(`      ⚠️  MISMATCH! Recorded stats don't match match results`)
        } else {
          console.log(`      ✓ Stats match match results`)
        }
      }
    }

    console.log('\n✅ Check complete!')
  } catch (error: any) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get tournament ID from command line
const tournamentId = process.argv[2]

checkTournamentScores(tournamentId)

