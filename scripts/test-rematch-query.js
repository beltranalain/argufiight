import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const testUserId = '661ba372-c1fb-4ee8-8cd8-764525cbe2f4'
    
    console.log('Testing rematch query for user:', testUserId)
    console.log('---\n')
    
    // Test the exact query from the API
    const rematchDebates = await prisma.$queryRawUnsafe(`
      SELECT 
        d.id,
        d.topic,
        d.description,
        d.category,
        d.status,
        d.challenger_id,
        d.opponent_id,
        d.winner_id,
        d.rematch_requested_by,
        d.rematch_status,
        d.rematch_debate_id,
        d.created_at
      FROM debates d
      WHERE d.rematch_requested_by = ?
        AND (d.rematch_status = 'PENDING' OR d.rematch_status = 'ACCEPTED')
    `, testUserId)
    
    console.log('Query result count:', rematchDebates.length)
    console.log('Query result:', JSON.stringify(rematchDebates, null, 2))
    
    // Also check what rematch_requested_by values exist
    const allRematches = await prisma.$queryRawUnsafe(`
      SELECT 
        id,
        topic,
        rematch_requested_by,
        rematch_status
      FROM debates
      WHERE rematch_requested_by IS NOT NULL
    `)
    
    console.log('\nAll rematch requests in database:')
    console.log(JSON.stringify(allRematches, null, 2))
    
  } catch (error) {
    console.error('Error:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

main()





