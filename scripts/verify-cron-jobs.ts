/**
 * Script to verify cron jobs are working correctly
 * This checks both endpoints and provides status information
 * Usage: tsx scripts/verify-cron-jobs.ts
 */

// Make this file a module
export {}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'
const CRON_SECRET = process.env.CRON_SECRET

async function verifyCronJobs() {
  console.log('🔍 Verifying Cron Jobs Status...\n')
  console.log('Base URL:', BASE_URL)
  console.log('CRON_SECRET:', CRON_SECRET ? '✅ Set' : '⚠️  Not set (endpoints will work without auth)\n')
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  if (CRON_SECRET) {
    headers['Authorization'] = `Bearer ${CRON_SECRET}`
  }
  
  // Test 1: Process Expired Rounds
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('1️⃣  Testing: Process Expired Debate Rounds')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Endpoint: POST /api/debates/process-expired')
  
  try {
    const startTime = Date.now()
    const response = await fetch(`${BASE_URL}/api/debates/process-expired`, {
      method: 'POST',
      headers,
    })
    const duration = Date.now() - startTime
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Status: WORKING')
      console.log(`⏱️  Response time: ${duration}ms`)
      console.log('📊 Results:')
      console.log(`   - Processed: ${data.results?.processed || 0}`)
      console.log(`   - Advanced: ${data.results?.advanced || 0}`)
      console.log(`   - Completed: ${data.results?.completed || 0}`)
      console.log(`   - Cancelled: ${data.results?.cancelled || 0}`)
      if (data.results?.errors?.length > 0) {
        console.log(`   - Errors: ${data.results.errors.length}`)
        data.results.errors.forEach((err: string) => console.log(`     • ${err}`))
      }
      console.log(`🕐 Timestamp: ${data.timestamp || 'N/A'}`)
    } else if (response.status === 401) {
      console.log('❌ Status: UNAUTHORIZED')
      console.log('⚠️  CRON_SECRET mismatch!')
      console.log('   Make sure the CRON_SECRET in Vercel matches the one in cron-job.org')
      const error = await response.text()
      console.log(`   Error: ${error}`)
    } else if (response.status === 404) {
      console.log('❌ Status: NOT FOUND')
      console.log('   Endpoint does not exist. Check deployment.')
    } else {
      console.log(`❌ Status: ERROR (${response.status})`)
      const error = await response.text()
      console.log(`   Error: ${error}`)
    }
  } catch (error: any) {
    console.log('❌ Status: FAILED TO CONNECT')
    console.log(`   Error: ${error.message}`)
    console.log('   Check if the site is deployed and accessible')
  }
  
  console.log('\n')
  
  // Test 2: AI Auto-Accept
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('2️⃣  Testing: AI Auto-Accept Challenges')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Endpoint: GET /api/cron/ai-auto-accept')
  
  try {
    const startTime = Date.now()
    const response = await fetch(`${BASE_URL}/api/cron/ai-auto-accept`, {
      method: 'GET',
      headers,
    })
    const duration = Date.now() - startTime
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Status: WORKING')
      console.log(`⏱️  Response time: ${duration}ms`)
      console.log('📊 Results:')
      console.log(`   - AI Users Found: ${data.aiUsersCount || 0}`)
      console.log(`   - Challenges Accepted: ${data.accepted || 0}`)
      if (data.message) {
        console.log(`   - Message: ${data.message}`)
      }
    } else if (response.status === 401) {
      console.log('❌ Status: UNAUTHORIZED')
      console.log('⚠️  CRON_SECRET mismatch!')
      console.log('   Make sure the CRON_SECRET in Vercel matches the one in cron-job.org')
      const error = await response.text()
      console.log(`   Error: ${error}`)
    } else if (response.status === 404) {
      console.log('❌ Status: NOT FOUND')
      console.log('   Endpoint does not exist. Check deployment.')
    } else {
      console.log(`❌ Status: ERROR (${response.status})`)
      const error = await response.text()
      console.log(`   Error: ${error}`)
    }
  } catch (error: any) {
    console.log('❌ Status: FAILED TO CONNECT')
    console.log(`   Error: ${error.message}`)
    console.log('   Check if the site is deployed and accessible')
  }
  
  console.log('\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📋 Next Steps:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('1. Check cron-job.org Console → Execution History')
  console.log('   - Look for successful executions (green checkmarks)')
  console.log('   - Check execution times match your schedule (every 10 min)')
  console.log('   - Review any error messages if executions failed')
  console.log('')
  console.log('2. Check Vercel Logs:')
  console.log('   - Go to Vercel Dashboard → Your Project → Functions → Logs')
  console.log('   - Look for calls to /api/debates/process-expired')
  console.log('   - Look for calls to /api/cron/ai-auto-accept')
  console.log('')
  console.log('3. Verify CRON_SECRET:')
  console.log('   - Vercel: Settings → Environment Variables → CRON_SECRET')
  console.log('   - cron-job.org: ADVANCED tab → Headers → Authorization value')
  console.log('   - They must match exactly (including "Bearer " prefix)')
  console.log('')
  console.log('4. Test a debate:')
  console.log('   - Create or find a debate that should expire')
  console.log('   - Wait for the deadline to pass')
  console.log('   - The cron job should process it within 10 minutes')
}

verifyCronJobs()
  .then(() => {
    console.log('\n✅ Verification complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error)
    process.exit(1)
  })

