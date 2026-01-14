import { getStripeKeys, createStripeClient } from '../lib/stripe/stripe-client'
import Stripe from 'stripe'

async function testStripeKeys() {
  console.log('\n=== Testing Stripe Keys ===\n')

  try {
    // 1. Get keys
    console.log('1. Retrieving Stripe keys...')
    const { publishableKey, secretKey } = await getStripeKeys()

    if (!publishableKey) {
      console.log('❌ No publishable key found')
      console.log('   Check Admin Settings → General → Stripe Publishable Key')
      return
    }

    if (!secretKey) {
      console.log('❌ No secret key found')
      console.log('   Check Admin Settings → General → Stripe Secret Key')
      return
    }

    console.log('✅ Keys retrieved')
    console.log(`   Publishable Key: ${publishableKey.substring(0, 20)}...${publishableKey.substring(publishableKey.length - 10)}`)
    console.log(`   Secret Key: ${secretKey.substring(0, 20)}...${secretKey.substring(secretKey.length - 10)}`)
    console.log(`   Mode: ${publishableKey.includes('_test_') ? 'TEST' : 'LIVE'}`)

    // 2. Test publishable key format
    console.log('\n2. Validating key formats...')
    const isValidPublishable = publishableKey.startsWith('pk_test_') || publishableKey.startsWith('pk_live_')
    const isValidSecret = secretKey.startsWith('sk_test_') || secretKey.startsWith('sk_live_')

    if (!isValidPublishable) {
      console.log('❌ Invalid publishable key format')
      console.log('   Should start with pk_test_ or pk_live_')
    } else {
      console.log('✅ Publishable key format is valid')
    }

    if (!isValidSecret) {
      console.log('❌ Invalid secret key format')
      console.log('   Should start with sk_test_ or sk_live_')
    } else {
      console.log('✅ Secret key format is valid')
    }

    // 3. Test mode matching
    console.log('\n3. Checking mode consistency...')
    const publishableMode = publishableKey.includes('_test_') ? 'test' : 'live'
    const secretMode = secretKey.includes('_test_') ? 'test' : 'live'

    if (publishableMode !== secretMode) {
      console.log('⚠️  WARNING: Keys are from different modes!')
      console.log(`   Publishable: ${publishableMode.toUpperCase()}`)
      console.log(`   Secret: ${secretMode.toUpperCase()}`)
      console.log('   They should both be TEST or both be LIVE')
    } else {
      console.log(`✅ Both keys are in ${publishableMode.toUpperCase()} mode`)
    }

    // 4. Test Stripe client creation
    console.log('\n4. Testing Stripe client creation...')
    try {
      const stripe = await createStripeClient()
      console.log('✅ Stripe client created successfully')

      // 5. Test API call (list accounts - lightweight test)
      console.log('\n5. Testing API connectivity...')
      try {
        // Try to retrieve account info (this will fail if key is invalid/expired)
        const account = await stripe.accounts.list({ limit: 1 })
        console.log('✅ Stripe API connection successful')
        console.log(`   Connected accounts: ${account.data.length}`)
      } catch (apiError: any) {
        if (apiError.type === 'StripeAuthenticationError') {
          console.log('❌ Stripe API authentication failed')
          console.log(`   Error: ${apiError.message}`)
          if (apiError.message?.includes('expired')) {
            console.log('   ⚠️  Your API key has EXPIRED')
            console.log('   Solution: Get a new key from https://dashboard.stripe.com/apikeys')
          } else if (apiError.message?.includes('Invalid')) {
            console.log('   ⚠️  Your API key is INVALID')
            console.log('   Solution: Check the key in Admin Settings')
          }
        } else {
          console.log('⚠️  API call failed (may be expected if no Connect accounts):')
          console.log(`   Error: ${apiError.message}`)
        }
      }

      // 6. Test publishable key endpoint
      console.log('\n6. Testing publishable key API endpoint...')
      try {
        const response = await fetch('http://localhost:3000/api/stripe/publishable-key')
        if (response.ok) {
          const data = await response.json()
          if (data.publishableKey === publishableKey) {
            console.log('✅ Publishable key API endpoint works correctly')
            console.log(`   Returns: ${data.publishableKey.substring(0, 20)}...`)
          } else {
            console.log('⚠️  Publishable key API returns different key')
            console.log(`   Expected: ${publishableKey.substring(0, 20)}...`)
            console.log(`   Got: ${data.publishableKey?.substring(0, 20) || 'null'}...`)
          }
        } else {
          console.log(`❌ Publishable key API returned error: ${response.status}`)
          const error = await response.text()
          console.log(`   Error: ${error}`)
        }
      } catch (apiError: any) {
        console.log('⚠️  Could not test API endpoint (server may not be running)')
        console.log(`   Error: ${apiError.message}`)
      }

    } catch (clientError: any) {
      console.log('❌ Failed to create Stripe client')
      console.log(`   Error: ${clientError.message}`)
      if (clientError.message?.includes('secret key')) {
        console.log('   Check Admin Settings → General → Stripe Secret Key')
      }
    }

    console.log('\n=== Summary ===')
    console.log('If all tests passed, your Stripe keys are configured correctly.')
    console.log('If you see errors:')
    console.log('1. Go to Admin Settings → General')
    console.log('2. Update Stripe Publishable Key and Stripe Secret Key')
    console.log('3. Get new keys from: https://dashboard.stripe.com/apikeys')
    console.log('4. Make sure both keys are from the same mode (TEST or LIVE)')

  } catch (error: any) {
    console.error('\n❌ Error testing Stripe keys:', error.message)
    console.error(error)
  } finally {
    process.exit(0)
  }
}

testStripeKeys()
