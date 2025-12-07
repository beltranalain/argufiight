/**
 * Script to manually force process a specific debate
 * This will check if it's expired and process it accordingly
 * Usage: tsx scripts/force-process-debate.ts <debate-id>
 */

// Make this file a module to avoid variable name conflicts
export {}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'
const CRON_SECRET = process.env.CRON_SECRET

async function forceProcessDebate(debateId: string) {
  try {
    console.log('Force processing debate:', debateId)
    
    // First, trigger the general process-expired endpoint
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (CRON_SECRET) {
      headers['Authorization'] = `Bearer ${CRON_SECRET}`
    }
    
    console.log('Calling /api/debates/process-expired...')
    const response = await fetch(`${BASE_URL}/api/debates/process-expired`, {
      method: 'POST',
      headers,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Processing failed: ${error}`)
    }

    const result = await response.json()
    console.log('\nProcessing result:', JSON.stringify(result, null, 2))
    
    // Check if this specific debate was processed
    if (result.results) {
      console.log('\n=== Summary ===')
      console.log(`Processed: ${result.results.processed}`)
      console.log(`Advanced: ${result.results.advanced}`)
      console.log(`Completed: ${result.results.completed}`)
      if (result.results.errors.length > 0) {
        console.log(`Errors: ${result.results.errors.length}`)
        result.results.errors.forEach((err: string) => console.log(`  - ${err}`))
      }
    }
    
    // Now check the debate status
    console.log('\nChecking debate status...')
    const debateResponse = await fetch(`${BASE_URL}/api/debates/${debateId}`)
    if (debateResponse.ok) {
      const debate = await debateResponse.json()
      console.log('\n=== Debate Status After Processing ===')
      console.log('Status:', debate.status)
      console.log('Current Round:', debate.currentRound, '/', debate.totalRounds)
      console.log('Round Deadline:', debate.roundDeadline)
      console.log('Ended At:', debate.endedAt)
      console.log('Verdict Reached:', debate.verdictReached)
    }
    
    return result
  } catch (error) {
    console.error('Error processing debate:', error)
    throw error
  }
}

const debateId = process.argv[2]
if (!debateId) {
  console.error('Usage: tsx scripts/force-process-debate.ts <debate-id>')
  process.exit(1)
}

forceProcessDebate(debateId)
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Failed:', error)
    process.exit(1)
  })

