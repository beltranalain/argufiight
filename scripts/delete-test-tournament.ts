/**
 * Script to delete a test tournament and refund the creator
 * Usage: npx tsx scripts/delete-test-tournament.ts <tournamentId>
 */

import { prisma } from '../lib/db/prisma'
import { decrementFeatureUsage } from '../lib/subscriptions/subscription-utils'
import { FEATURES } from '../lib/subscriptions/features'

async function deleteTournament(tournamentId: string) {
  try {
    console.log(`🔄 Deleting tournament: ${tournamentId}\n`)

    // Get tournament info
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        name: true,
        creatorId: true,
        status: true,
        creator: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    })

    if (!tournament) {
      console.error('❌ Tournament not found')
      process.exit(1)
    }

    console.log('📋 Tournament Info:')
    console.log(`   Name: ${tournament.name}`)
    console.log(`   Status: ${tournament.status}`)
    console.log(`   Creator: ${tournament.creator.username} (${tournament.creator.email})`)
    console.log(`   Creator ID: ${tournament.creatorId}\n`)

    // Refund creator (decrement usage)
    console.log('💰 Refunding creator...')
    await decrementFeatureUsage(tournament.creatorId, FEATURES.TOURNAMENTS)
    console.log('✅ Creator refunded (usage decremented)\n')

    // Delete tournament (cascade will handle related records)
    console.log('🗑️  Deleting tournament and all related records...')
    await prisma.tournament.delete({
      where: { id: tournamentId },
    })
    console.log('✅ Tournament deleted successfully\n')

    console.log('✨ Script completed successfully')
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Get tournament ID from command line
const tournamentId = process.argv[2]

if (!tournamentId) {
  console.error('Usage: npx tsx scripts/delete-test-tournament.ts <tournamentId>')
  process.exit(1)
}

deleteTournament(tournamentId)
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })

