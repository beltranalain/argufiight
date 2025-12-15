/**
 * Script to automatically review pending reports and flagged statements
 * Can be run via cron job: e.g., every 5 minutes
 * 
 * Usage: tsx scripts/auto-moderate.ts
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function autoModerate() {
  try {
    console.log('Starting auto-moderation...')
    
    const response = await fetch(`${BASE_URL}/api/moderation/auto-review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Auto-moderation failed: ${error}`)
    }

    const result = await response.json()
    console.log('Auto-moderation completed:', result)
    
    return result
  } catch (error) {
    console.error('Auto-moderation error:', error)
    throw error
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  autoModerate()
    .then(() => {
      console.log('✅ Auto-moderation script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Auto-moderation script failed:', error)
      process.exit(1)
    })
}

export { autoModerate }






