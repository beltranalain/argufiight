import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Checking for rematch requests in database...\n')
    
    // Check if rematch columns exist
    const tableInfo = await prisma.$queryRawUnsafe(`PRAGMA table_info(debates)`)
    const hasRematchColumns = tableInfo.some((col) => col.name === 'rematch_requested_by')
    
    if (!hasRematchColumns) {
      console.log('❌ Rematch columns do not exist in debates table')
      console.log('   Run: node scripts/add-rematch-fields.js')
      return
    }
    
    console.log('✅ Rematch columns exist\n')
    
    // Find all debates with rematch requests
    const rematchDebates = await prisma.$queryRawUnsafe(`
      SELECT 
        id,
        topic,
        status,
        rematch_requested_by,
        rematch_status,
        rematch_debate_id
      FROM debates
      WHERE rematch_requested_by IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 10
    `)
    
    if (rematchDebates.length === 0) {
      console.log('ℹ️  No rematch requests found in database')
      console.log('   You need to:')
      console.log('   1. Complete a debate (it must have VERDICT_READY status)')
      console.log('   2. The debate must have a winner (not a tie)')
      console.log('   3. The loser must click "Request Rematch" on the debate page')
      return
    }
    
    console.log(`Found ${rematchDebates.length} rematch request(s):\n`)
    
    for (const debate of rematchDebates) {
      console.log(`Debate ID: ${debate.id}`)
      console.log(`Topic: ${debate.topic}`)
      console.log(`Status: ${debate.status}`)
      console.log(`Rematch Requested By: ${debate.rematch_requested_by}`)
      console.log(`Rematch Status: ${debate.rematch_status}`)
      if (debate.rematch_debate_id) {
        console.log(`Rematch Debate ID: ${debate.rematch_debate_id}`)
      }
      console.log('---\n')
    }
    
    // Check for VERDICT_READY debates
    const verdictReadyDebates = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count
      FROM debates
      WHERE status = 'VERDICT_READY'
        AND winner_id IS NOT NULL
    `)
    
    console.log(`Total completed debates (VERDICT_READY with winner): ${verdictReadyDebates[0]?.count || 0}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()

