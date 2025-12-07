/**
 * Script to test if the cron endpoints are working correctly
 * Usage: tsx scripts/test-cron-endpoints.ts
 */

// Make this file a module to avoid variable name conflicts
export {}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'
const CRON_SECRET = process.env.CRON_SECRET

async function testCronEndpoints() {
  console.log('Testing cron endpoints...\n')
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  if (CRON_SECRET) {
    headers['Authorization'] = `Bearer ${CRON_SECRET}`
    console.log('✅ CRON_SECRET is set (will use Authorization header)')
  } else {
    console.log('⚠️  CRON_SECRET is not set (endpoint will work without auth)')
  }
  
  console.log('\n1. Testing Process Expired Rounds endpoint...')
  try {
    const response = await fetch(`${BASE_URL}/api/debates/process-expired`, {
      method: 'POST',
      headers,
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Process Expired endpoint is working!')
      console.log('   Results:', JSON.stringify(data, null, 2))
    } else if (response.status === 401) {
      console.log('❌ Unauthorized - Check if CRON_SECRET matches in Vercel and cron-job.org')
      const error = await response.text()
      console.log('   Error:', error)
    } else {
      console.log(`❌ Error: ${response.status} ${response.statusText}`)
      const error = await response.text()
      console.log('   Error:', error)
    }
  } catch (error: any) {
    console.log('❌ Failed to connect:', error.message)
  }
  
  console.log('\n2. Testing AI Auto-Accept endpoint...')
  try {
    const response = await fetch(`${BASE_URL}/api/cron/ai-auto-accept`, {
      method: 'GET',
      headers,
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ AI Auto-Accept endpoint is working!')
      console.log('   Results:', JSON.stringify(data, null, 2))
    } else if (response.status === 401) {
      console.log('❌ Unauthorized - Check if CRON_SECRET matches in Vercel and cron-job.org')
      const error = await response.text()
      console.log('   Error:', error)
    } else {
      console.log(`❌ Error: ${response.status} ${response.statusText}`)
      const error = await response.text()
      console.log('   Error:', error)
    }
  } catch (error: any) {
    console.log('❌ Failed to connect:', error.message)
  }
  
  console.log('\n✅ Testing complete!')
  console.log('\nNext steps:')
  console.log('1. Make sure both cron jobs are set up in cron-job.org')
  console.log('2. Check cron-job.org execution history to see if jobs are running')
  console.log('3. Check Vercel logs to see if endpoints are being called')
}

testCronEndpoints()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })

