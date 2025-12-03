/**
 * Script to process expired debate rounds
 * Can be run via cron job: e.g., every 5 minutes
 * 
 * Usage: tsx scripts/process-expired-rounds.ts
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const CRON_SECRET = process.env.CRON_SECRET

async function processExpiredRounds() {
  try {
    console.log('Processing expired debate rounds...')
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (CRON_SECRET) {
      headers['Authorization'] = `Bearer ${CRON_SECRET}`
    }
    
    const response = await fetch(`${BASE_URL}/api/debates/process-expired`, {
      method: 'POST',
      headers,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Processing failed: ${error}`)
    }

    const result = await response.json()
    console.log('Processing completed:', result)
    
    if (result.results.processed > 0 || result.results.advanced > 0 || result.results.completed > 0) {
      console.log(`\nSummary:`)
      console.log(`  - Processed: ${result.results.processed}`)
      console.log(`  - Advanced: ${result.results.advanced}`)
      console.log(`  - Completed: ${result.results.completed}`)
      if (result.results.errors.length > 0) {
        console.log(`  - Errors: ${result.results.errors.length}`)
        result.results.errors.forEach((err: string) => console.log(`    - ${err}`))
      }
    } else {
      console.log('No expired rounds found.')
    }
    
    return result
  } catch (error) {
    console.error('Error processing expired rounds:', error)
    throw error
  }
}

// Run if called directly
processExpiredRounds()
  .then(() => {
    console.log('Done.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })

export { processExpiredRounds }

