import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Testing expired rounds processing...\n')
    
    const now = new Date()
    
    // Find debates with expired deadlines
    const expiredDebates = await prisma.$queryRawUnsafe(`
      SELECT 
        d.id,
        d.topic,
        d.status,
        d.current_round,
        d.total_rounds,
        d.round_deadline,
        d.challenger_id,
        d.opponent_id
      FROM debates d
      WHERE d.status = 'ACTIVE'
        AND d.round_deadline IS NOT NULL
        AND d.round_deadline <= ?
      LIMIT 10
    `, now.toISOString())
    
    console.log(`Found ${expiredDebates.length} debates with expired rounds:\n`)
    
    for (const debate of expiredDebates) {
      console.log(`Debate: ${debate.topic}`)
      console.log(`  ID: ${debate.id}`)
      console.log(`  Status: ${debate.status}`)
      console.log(`  Round: ${debate.current_round}/${debate.total_rounds}`)
      console.log(`  Deadline: ${debate.round_deadline}`)
      console.log(`  Challenger: ${debate.challenger_id}`)
      console.log(`  Opponent: ${debate.opponent_id || 'None'}`)
      
      // Check statements for this round
      const statements = await prisma.$queryRawUnsafe(`
        SELECT author_id, round, content
        FROM statements
        WHERE debate_id = ? AND round = ?
      `, debate.id, debate.current_round)
      
      console.log(`  Statements for round ${debate.current_round}:`, statements.length)
      statements.forEach(s => {
        console.log(`    - ${s.author_id}: ${s.content.substring(0, 50)}...`)
      })
      console.log('---\n')
    }
    
    if (expiredDebates.length > 0) {
      console.log('\nTo process these, call:')
      console.log('POST /api/debates/process-expired')
      console.log('With header: Authorization: Bearer <CRON_SECRET>')
    } else {
      console.log('No expired rounds found.')
    }
    
  } catch (error) {
    console.error('Error:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

main()

