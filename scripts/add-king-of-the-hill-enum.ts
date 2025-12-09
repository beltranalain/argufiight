/**
 * Script to add KING_OF_THE_HILL to TournamentFormat enum
 * This fixes the database enum to match the Prisma schema
 */

import { prisma } from '../lib/db/prisma'

async function addKingOfTheHillEnum() {
  try {
    console.log('🔄 Adding KING_OF_THE_HILL to TournamentFormat enum...\n')

    // Check if KING_OF_THE_HILL already exists
    const checkResult = await prisma.$queryRaw<Array<{ enumlabel: string }>>`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'TournamentFormat'
      ) AND enumlabel = 'KING_OF_THE_HILL'
    `

    if (checkResult.length > 0) {
      console.log('✅ KING_OF_THE_HILL already exists in TournamentFormat enum')
      return
    }

    console.log('📝 KING_OF_THE_HILL does not exist - adding to enum...\n')

    // Add KING_OF_THE_HILL to the enum
    await prisma.$executeRaw`
      ALTER TYPE "TournamentFormat" ADD VALUE IF NOT EXISTS 'KING_OF_THE_HILL';
    `

    console.log('✅ Successfully added KING_OF_THE_HILL to TournamentFormat enum\n')

    // Verify the enum values
    const enumValues = await prisma.$queryRaw<Array<{ enumlabel: string }>>`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'TournamentFormat'
      )
      ORDER BY enumsortorder
    `

    console.log('📋 Current TournamentFormat enum values:')
    enumValues.forEach((v) => {
      console.log(`   - ${v.enumlabel}`)
    })
    console.log('')

    console.log('✅ Migration complete!')
  } catch (error: any) {
    console.error('❌ Error adding KING_OF_THE_HILL to enum:', error)
    if (error.message?.includes('IF NOT EXISTS')) {
      // PostgreSQL doesn't support IF NOT EXISTS for ALTER TYPE ADD VALUE
      // Try without it
      try {
        await prisma.$executeRaw`
          ALTER TYPE "TournamentFormat" ADD VALUE 'KING_OF_THE_HILL';
        `
        console.log('✅ Successfully added KING_OF_THE_HILL (retry without IF NOT EXISTS)')
      } catch (retryError: any) {
        if (retryError.message?.includes('already exists')) {
          console.log('✅ KING_OF_THE_HILL already exists in enum')
        } else {
          throw retryError
        }
      }
    } else {
      throw error
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
addKingOfTheHillEnum()
  .then(() => {
    console.log('\n✨ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })

