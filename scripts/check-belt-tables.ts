/**
 * Check if belt tables exist in database
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkTables() {
  try {
    // Check if tables exist
    const tables = await prisma.$queryRawUnsafe<Array<{ tablename: string }>>(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('belts', 'belt_history', 'belt_challenges', 'belt_settings')
      ORDER BY tablename;
    `)

    console.log('\n📊 Belt tables status:')
    const expectedTables = ['belts', 'belt_history', 'belt_challenges', 'belt_settings']
    
    for (const table of expectedTables) {
      const exists = tables.some(t => t.tablename === table)
      console.log(`  ${exists ? '✅' : '❌'} ${table}`)
    }

    // Check enums
    const enums = await prisma.$queryRawUnsafe<Array<{ typname: string }>>(`
      SELECT typname 
      FROM pg_type 
      WHERE typname IN ('BeltType', 'BeltStatus', 'ChallengeStatus', 'BeltTransferReason')
      ORDER BY typname;
    `)

    console.log('\n📊 Belt enums status:')
    const expectedEnums = ['BeltType', 'BeltStatus', 'ChallengeStatus', 'BeltTransferReason']
    
    for (const enumName of expectedEnums) {
      const exists = enums.some(e => e.typname === enumName)
      console.log(`  ${exists ? '✅' : '❌'} ${enumName}`)
    }

    // Check columns added to users
    const userColumns = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('total_belt_wins', 'total_belt_defenses', 'longest_belt_held', 'current_belts_count')
      ORDER BY column_name;
    `)

    console.log('\n📊 User belt columns status:')
    const expectedColumns = ['total_belt_wins', 'total_belt_defenses', 'longest_belt_held', 'current_belts_count']
    
    for (const col of expectedColumns) {
      const exists = userColumns.some(c => c.column_name === col)
      console.log(`  ${exists ? '✅' : '❌'} ${col}`)
    }

    console.log('')
  } catch (error: any) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkTables()
