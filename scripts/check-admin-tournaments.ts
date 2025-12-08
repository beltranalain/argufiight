/**
 * Diagnostic script to check if tournaments exist and can be fetched
 */

import { prisma } from '../lib/db/prisma'

async function checkTournaments() {
  try {
    console.log('🔍 Checking tournaments in database...\n')

    // Count tournaments
    const count = await prisma.tournament.count()
    console.log(`📊 Total tournaments in database: ${count}\n`)

    if (count === 0) {
      console.log('❌ No tournaments found in database')
      return
    }

    // Fetch a few tournaments (using select to avoid format field if migration not applied)
    const tournaments = await prisma.tournament.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        maxParticipants: true,
        currentRound: true,
        totalRounds: true,
        createdAt: true,
        creator: {
          select: {
            username: true,
            email: true,
          },
        },
        participants: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`✅ Found ${tournaments.length} tournaments:\n`)

    tournaments.forEach((tournament, index) => {
      console.log(`${index + 1}. ${tournament.name}`)
      console.log(`   ID: ${tournament.id}`)
      console.log(`   Status: ${tournament.status}`)
      console.log(`   Format: ${tournament.format || 'BRACKET (default)'}`)
      console.log(`   Creator: ${tournament.creator?.username || 'Unknown'}`)
      console.log(`   Participants: ${tournament.participants.length}/${tournament.maxParticipants}`)
      console.log(`   Created: ${tournament.createdAt.toISOString()}`)
      console.log('')
    })

    // Test the exact query used by the API
    console.log('🧪 Testing API query...\n')
    const apiTournaments = await prisma.tournament.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        maxParticipants: true,
        currentRound: true,
        totalRounds: true,
        createdAt: true,
        creatorId: true,
        creator: {
          select: {
            username: true,
            email: true,
          },
        },
        participants: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    })

    console.log(`✅ API query returned ${apiTournaments.length} tournaments`)
    console.log(`✅ First tournament: ${apiTournaments[0]?.name || 'None'}`)
  } catch (error: any) {
    console.error('❌ Error checking tournaments:', error)
    console.error('Error message:', error.message)
    console.error('Error code:', error.code)
  } finally {
    await prisma.$disconnect()
  }
}

checkTournaments()

