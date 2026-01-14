import { createStripeClient, createAdvertiserStripeAccount } from '../lib/stripe/stripe-client'

async function testStripeConnectCreate() {
  console.log('🧪 Testing Stripe Connect Account Creation...\n')

  try {
    const stripe = await createStripeClient()
    
    // First, check if we can list accounts (basic Connect check)
    console.log('1️⃣ Checking if Connect is enabled (list accounts)...')
    try {
      const accounts = await stripe.accounts.list({ limit: 1 })
      console.log('✅ Can list accounts - Connect appears enabled')
    } catch (listError: any) {
      console.log('❌ Cannot list accounts:', listError.message)
      console.log('   This suggests Connect is not enabled')
      return
    }

    // Try to create an Express account (this is what fails)
    console.log('\n2️⃣ Attempting to create Express account...')
    try {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: 'test@example.com',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'company',
        company: {
          name: 'Test Company',
        },
      })
      console.log('✅ Successfully created Express account!')
      console.log(`   Account ID: ${account.id}`)
      console.log(`   Type: ${account.type}`)
      console.log(`   Country: ${account.country}`)
      
      // Clean up - delete the test account
      console.log('\n3️⃣ Cleaning up test account...')
      await stripe.accounts.del(account.id)
      console.log('✅ Test account deleted')
      
    } catch (createError: any) {
      console.log('❌ Failed to create Express account:')
      console.log(`   Error Type: ${createError.type || 'unknown'}`)
      console.log(`   Error Code: ${createError.code || 'unknown'}`)
      console.log(`   Error Message: ${createError.message}`)
      
      if (createError.raw) {
        console.log(`   Raw Error:`, JSON.stringify(createError.raw, null, 2))
      }
      
      // Check for specific error types
      if (createError.code === 'resource_missing') {
        console.log('\n⚠️  This error usually means:')
        console.log('   - Stripe Connect is not enabled in your Stripe Dashboard')
        console.log('   - Go to: https://dashboard.stripe.com/settings/connect')
        console.log('   - Make sure you\'re in TEST MODE (toggle in top right)')
        console.log('   - Click "Enable Connect" or "Get Started"')
      } else if (createError.type === 'invalid_request_error') {
        console.log('\n⚠️  This error usually means:')
        console.log('   - Your API key might be invalid or expired')
        console.log('   - Check your API keys in Admin Settings')
      } else if (createError.message?.includes('Connect')) {
        console.log('\n⚠️  This error suggests Stripe Connect is not properly enabled')
      }
    }

    // Also test the helper function
    console.log('\n4️⃣ Testing createAdvertiserStripeAccount helper...')
    try {
      const accountId = await createAdvertiserStripeAccount(
        'test-advertiser-id',
        'test@example.com',
        'Test Company'
      )
      console.log('✅ Helper function succeeded!')
      console.log(`   Account ID: ${accountId}`)
      
      // Clean up
      await stripe.accounts.del(accountId)
      console.log('✅ Test account deleted')
    } catch (helperError: any) {
      console.log('❌ Helper function failed:')
      console.log(`   Error: ${helperError.message}`)
      console.log(`   Code: ${helperError.code || 'unknown'}`)
    }

  } catch (error: any) {
    console.error('❌ Unexpected error:', error)
  }
}

testStripeConnectCreate()
  .then(() => {
    console.log('\n✅ Test complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })
