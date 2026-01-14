import { getStripeKeys, createStripeClient } from '../lib/stripe/stripe-client'

async function verifyStripeKeysMatch() {
  console.log('🔍 Verifying Stripe Keys Match...\n')

  try {
    const { publishableKey, secretKey } = await getStripeKeys()

    if (!publishableKey || !secretKey) {
      console.log('❌ Missing keys')
      return
    }

    console.log('1️⃣ Checking Key Prefixes...')
    const pubPrefix = publishableKey.substring(0, 20)
    const secPrefix = secretKey.substring(0, 20)
    console.log(`   Publishable: ${pubPrefix}...`)
    console.log(`   Secret: ${secPrefix}...`)

    // Extract account ID from keys (they should match)
    // Publishable keys: pk_test_51XXXXX... or pk_live_51XXXXX...
    // Secret keys: sk_test_51XXXXX... or sk_live_51XXXXX...
    // The part after the mode prefix should match
    const pubAccountPart = publishableKey.substring(7, 20) // After "pk_test_" or "pk_live_"
    const secAccountPart = secretKey.substring(7, 20) // After "sk_test_" or "sk_live_"

    console.log('\n2️⃣ Comparing Account IDs...')
    console.log(`   Publishable account part: ${pubAccountPart}`)
    console.log(`   Secret account part: ${secAccountPart}`)

    if (pubAccountPart === secAccountPart) {
      console.log('✅ Keys appear to be from the same Stripe account!')
    } else {
      console.log('❌ WARNING: Keys appear to be from DIFFERENT Stripe accounts!')
      console.log('   This will cause the "account session not found" error.')
      console.log('   Make sure both keys are from the same Stripe account.')
    }

    // Check modes match
    const pubIsTest = publishableKey.startsWith('pk_test_')
    const secIsTest = secretKey.startsWith('sk_test_')
    const pubIsLive = publishableKey.startsWith('pk_live_')
    const secIsLive = secretKey.startsWith('sk_live_')

    console.log('\n3️⃣ Checking Modes...')
    if (pubIsTest && secIsTest) {
      console.log('✅ Both keys are in TEST mode')
    } else if (pubIsLive && secIsLive) {
      console.log('✅ Both keys are in LIVE mode')
    } else {
      console.log('❌ WARNING: Keys are in different modes!')
      console.log(`   Publishable: ${pubIsTest ? 'TEST' : pubIsLive ? 'LIVE' : 'UNKNOWN'}`)
      console.log(`   Secret: ${secIsTest ? 'TEST' : secIsLive ? 'LIVE' : 'UNKNOWN'}`)
      console.log('   Both keys must be in the same mode (both test or both live)')
    }

    // Try to verify by making an API call
    console.log('\n4️⃣ Verifying with Stripe API...')
    try {
      const stripe = await createStripeClient()
      const account = await stripe.accounts.retrieve()
      
      console.log('✅ Stripe API connection successful')
      console.log(`   Account ID: ${account.id}`)
      console.log(`   Country: ${account.country}`)
      console.log(`   Type: ${account.type}`)
      
      // Try to create a test account session to verify keys work together
      console.log('\n5️⃣ Testing Account Session Creation...')
      try {
        // First, create a test Express account
        const testAccount = await stripe.accounts.create({
          type: 'express',
          country: 'US',
          email: 'test@example.com',
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        })
        
        console.log(`   Created test account: ${testAccount.id}`)
        
        // Try to create an account session
        const accountSession = await stripe.accountSessions.create({
          account: testAccount.id,
          components: {
            account_onboarding: {
              enabled: true,
              features: {
                external_account_collection: true,
              },
            },
          },
        })
        
        console.log('✅ Account session created successfully!')
        console.log(`   Client Secret: ${accountSession.client_secret.substring(0, 20)}...`)
        
        // Clean up
        await stripe.accounts.del(testAccount.id)
        console.log('   Test account deleted')
        
        console.log('\n✅ All checks passed! Keys should work together.')
      } catch (sessionError: any) {
        console.log('❌ Failed to create account session:')
        console.log(`   Error: ${sessionError.message}`)
        console.log(`   Code: ${sessionError.code}`)
        if (sessionError.code === 'resource_missing') {
          console.log('\n   This error suggests Stripe Connect is not enabled.')
        }
      }
    } catch (apiError: any) {
      console.log('❌ Stripe API error:')
      console.log(`   Error: ${apiError.message}`)
    }

  } catch (error: any) {
    console.error('❌ Error:', error)
  }
}

verifyStripeKeysMatch()
  .then(() => {
    console.log('\n✅ Verification complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error)
    process.exit(1)
  })
