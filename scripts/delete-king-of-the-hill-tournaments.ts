/**
 * Script to delete all King of the Hill tournaments
 * Usage: npx tsx scripts/delete-king-of-the-hill-tournaments.ts
 */

import { prisma } from '../lib/db/prisma'

async function deleteKingOfTheHillTournaments() {
  try {
    console.log('🔍 Finding all King of the Hill tournaments...\n')

    // Find all King of the Hill tournaments
    const tournaments = await prisma.tournament.findMany({
      where: {
        format: 'KING_OF_THE_HILL',
      },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        creator: {
          select: {
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (tournaments.length === 0) {
      console.log('✅ No King of the Hill tournaments found')
      return
    }

    console.log(`📋 Found ${tournaments.length} King of the Hill tournament(s):\n`)
    tournaments.forEach((tournament, index) => {
      console.log(`${index + 1}. ${tournament.name}`)
      console.log(`   ID: ${tournament.id}`)
      console.log(`   Status: ${tournament.status}`)
      console.log(`   Creator: ${tournament.creator.username} (${tournament.creator.email})`)
      console.log(`   Created: ${tournament.createdAt}`)
      console.log('')
    })

    // Delete all King of the Hill tournaments
    console.log('🗑️  Deleting all King of the Hill tournaments...\n')
    
    for (const tournament of tournaments) {
      try {
        await prisma.tournament.delete({
          where: { id: tournament.id },
        })
        console.log(`✅ Deleted: ${tournament.name} (${tournament.id})`)
      } catch (error: any) {
        console.error(`❌ Failed to delete ${tournament.name}:`, error.message)
      }
    }

    console.log('\n✨ Script completed successfully')
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
deleteKingOfTheHillTournaments()

