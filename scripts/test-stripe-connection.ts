import { getStripeKeys, createStripeClient } from '../lib/stripe/stripe-client'

async function testStripeConnection() {
  console.log('\n=== Testing Stripe Connection ===\n')

  try {
    // Get keys
    const { publishableKey, secretKey } = await getStripeKeys()

    if (!publishableKey) {
      console.log('❌ Stripe Publishable Key not found')
      console.log('   Check Admin Settings → General → Stripe Publishable Key')
      return
    }

    if (!secretKey) {
      console.log('❌ Stripe Secret Key not found')
      console.log('   Check Admin Settings → General → Stripe Secret Key')
      return
    }

    console.log('✅ Keys found:')
    console.log(`   Publishable Key: ${publishableKey.substring(0, 20)}...`)
    console.log(`   Secret Key: ${secretKey.substring(0, 20)}...`)
    console.log(`   Mode: ${secretKey.startsWith('sk_test_') ? 'TEST' : 'LIVE'}`)
    console.log('')

    // Test connection
    console.log('Testing Stripe API connection...')
    const stripe = await createStripeClient()
    
    try {
      // Try to list customers (simple API call to test connection)
      const customers = await stripe.customers.list({ limit: 1 })
      console.log('✅ Stripe connection successful!')
      console.log(`   API Version: ${stripe.getApiField('version')}`)
      console.log(`   Mode: ${secretKey.startsWith('sk_test_') ? 'TEST' : 'LIVE'}`)
      console.log(`   Can list customers: ✅`)
    } catch (stripeError: any) {
      console.log('❌ Stripe API error:')
      console.log(`   Error: ${stripeError.message}`)
      console.log(`   Type: ${stripeError.type || 'Unknown'}`)
      
      if (stripeError.message?.includes('expired') || stripeError.message?.includes('Expired')) {
        console.log('\n⚠️  Your Stripe API key has expired!')
        console.log('   Solution:')
        console.log('   1. Go to https://dashboard.stripe.com/apikeys')
        console.log('   2. Create a new API key')
        console.log('   3. Update it in Admin Settings → General')
      } else if (stripeError.message?.includes('invalid') || stripeError.message?.includes('Invalid')) {
        console.log('\n⚠️  Your Stripe API key is invalid!')
        console.log('   Solution:')
        console.log('   1. Check that you copied the key correctly')
        console.log('   2. Make sure you\'re using the right key (test vs live)')
        console.log('   3. Update it in Admin Settings → General')
      }
    }

  } catch (error: any) {
    console.error('❌ Error testing Stripe:', error.message)
  }
}

testStripeConnection()
