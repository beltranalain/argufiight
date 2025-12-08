/**
 * Diagnostic script to check tournament creation
 * Run with: npx tsx scripts/check-tournament.ts [tournament-name]
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkTournament(tournamentName?: string) {
  console.log('🔍 Checking Tournaments in Database\n')

  try {
    // Get all tournaments
    const allTournaments = await prisma.tournament.findMany({
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        _count: {
          select: {
            participants: true,
            matches: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`📊 Total tournaments in database: ${allTournaments.length}\n`)

    if (allTournaments.length === 0) {
      console.log('❌ No tournaments found in database')
      console.log('\n💡 Possible issues:')
      console.log('   1. Tournament creation failed silently')
      console.log('   2. Database connection issue')
      console.log('   3. Tournament was deleted')
      return
    }

    // If searching for specific tournament
    if (tournamentName) {
      const matching = allTournaments.filter(t => 
        t.name.toLowerCase().includes(tournamentName.toLowerCase())
      )
      
      if (matching.length === 0) {
        console.log(`❌ No tournament found matching "${tournamentName}"\n`)
        console.log('Available tournaments:')
        allTournaments.forEach((t, i) => {
          console.log(`   ${i + 1}. "${t.name}" (${t.status}) - Created: ${t.createdAt.toISOString()}`)
        })
        return
      }

      console.log(`✅ Found ${matching.length} tournament(s) matching "${tournamentName}":\n`)
      matching.forEach((tournament, i) => {
        console.log(`Tournament ${i + 1}:`)
        console.log(`   ID: ${tournament.id}`)
        console.log(`   Name: ${tournament.name}`)
        console.log(`   Status: ${tournament.status}`)
        console.log(`   Creator: @${tournament.creator.username} (${tournament.creator.email})`)
        console.log(`   Participants: ${tournament._count.participants}/${tournament.maxParticipants}`)
        console.log(`   Rounds: ${tournament.currentRound}/${tournament.totalRounds}`)
        console.log(`   Created: ${tournament.createdAt.toISOString()}`)
        console.log(`   Start Date: ${tournament.startDate.toISOString()}`)
        console.log('')
      })
    } else {
      // Show all tournaments
      console.log('📋 All Tournaments:\n')
      allTournaments.forEach((tournament, i) => {
        console.log(`${i + 1}. "${tournament.name}"`)
        console.log(`   ID: ${tournament.id}`)
        console.log(`   Status: ${tournament.status}`)
        console.log(`   Creator: @${tournament.creator.username}`)
        console.log(`   Participants: ${tournament._count.participants}/${tournament.maxParticipants}`)
        console.log(`   Created: ${tournament.createdAt.toISOString()}`)
        console.log('')
      })
    }

    // Check for common issues
    console.log('🔍 Checking for common issues:\n')
    
    const upcomingTournaments = allTournaments.filter(t => t.status === 'UPCOMING')
    console.log(`   UPCOMING tournaments: ${upcomingTournaments.length}`)
    
    const recentTournaments = allTournaments.filter(t => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      return t.createdAt > oneHourAgo
    })
    console.log(`   Tournaments created in last hour: ${recentTournaments.length}`)
    
    if (recentTournaments.length > 0) {
      console.log('\n   Recent tournaments:')
      recentTournaments.forEach(t => {
        console.log(`     - "${t.name}" (${t.status}) - ${t.createdAt.toISOString()}`)
      })
    }

    // Check API response format
    console.log('\n📡 Testing API Response Format:\n')
    const testTournament = allTournaments[0]
    const formatted = {
      id: testTournament.id,
      name: testTournament.name,
      description: testTournament.description,
      status: testTournament.status,
      maxParticipants: testTournament.maxParticipants,
      currentRound: testTournament.currentRound,
      totalRounds: testTournament.totalRounds,
      participantCount: testTournament._count.participants,
      matchCount: testTournament._count.matches,
      startDate: testTournament.startDate,
      endDate: testTournament.endDate,
      minElo: testTournament.minElo,
      creator: testTournament.creator,
      isParticipant: false, // Would need userId to check
      createdAt: testTournament.createdAt,
    }
    
    console.log('   Sample formatted tournament (as API would return):')
    console.log(JSON.stringify(formatted, null, 2))

  } catch (error: any) {
    console.error('❌ Error checking tournaments:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get tournament name from command line args
const tournamentName = process.argv[2]

checkTournament(tournamentName)

export {}

