import { prisma } from '../lib/db/prisma'
import { getStripeKeys, createStripeClient } from '../lib/stripe/stripe-client'

async function checkStripeConfig() {
  console.log('🔍 Checking Stripe Configuration...\n')

  try {
    // 1. Check API keys
    console.log('1️⃣ Checking API Keys...')
    const { publishableKey, secretKey } = await getStripeKeys()
    
    if (!publishableKey) {
      console.log('❌ Publishable Key: NOT FOUND')
    } else {
      const isTest = publishableKey.startsWith('pk_test_')
      const isLive = publishableKey.startsWith('pk_live_')
      console.log(`✅ Publishable Key: ${publishableKey.substring(0, 20)}...`)
      console.log(`   Mode: ${isTest ? '🧪 TEST MODE' : isLive ? '🔴 LIVE MODE' : '❓ UNKNOWN'}`)
    }
    
    if (!secretKey) {
      console.log('❌ Secret Key: NOT FOUND')
    } else {
      const isTest = secretKey.startsWith('sk_test_')
      const isLive = secretKey.startsWith('sk_live_')
      console.log(`✅ Secret Key: ${secretKey.substring(0, 20)}...`)
      console.log(`   Mode: ${isTest ? '🧪 TEST MODE' : isLive ? '🔴 LIVE MODE' : '❓ UNKNOWN'}`)
    }

    // 2. Check database settings
    console.log('\n2️⃣ Checking Database Settings...')
    const settings = await prisma.adminSetting.findMany({
      where: {
        key: {
          in: ['STRIPE_PUBLISHABLE_KEY', 'STRIPE_SECRET_KEY'],
        },
      },
    })

    const dbPublishableKey = settings.find(s => s.key === 'STRIPE_PUBLISHABLE_KEY')
    const dbSecretKey = settings.find(s => s.key === 'STRIPE_SECRET_KEY')

    if (dbPublishableKey) {
      const isTest = dbPublishableKey.value?.startsWith('pk_test_')
      console.log(`✅ Database Publishable Key: ${dbPublishableKey.value?.substring(0, 20)}...`)
      console.log(`   Mode: ${isTest ? '🧪 TEST MODE' : '🔴 LIVE MODE'}`)
    } else {
      console.log('⚠️  No publishable key in database (using env var)')
    }

    if (dbSecretKey) {
      const isTest = dbSecretKey.value?.startsWith('sk_test_')
      console.log(`✅ Database Secret Key: ${dbSecretKey.value?.substring(0, 20)}...`)
      console.log(`   Mode: ${isTest ? '🧪 TEST MODE' : '🔴 LIVE MODE'}`)
    } else {
      console.log('⚠️  No secret key in database (using env var)')
    }

    // 3. Test Stripe connection
    console.log('\n3️⃣ Testing Stripe Connection...')
    if (!secretKey) {
      console.log('❌ Cannot test connection - no secret key found')
    } else {
      try {
        const stripe = await createStripeClient()
        
        // Try to retrieve account info (this will fail if key is invalid)
        const account = await stripe.accounts.retrieve()
        console.log('✅ Stripe connection successful!')
        console.log(`   Account ID: ${account.id}`)
        console.log(`   Country: ${account.country}`)
        console.log(`   Type: ${account.type}`)
        
        // Check if Connect is enabled by trying to list accounts
        try {
          const accounts = await stripe.accounts.list({ limit: 1 })
          console.log('✅ Stripe Connect appears to be enabled')
        } catch (connectError: any) {
          if (connectError.message?.includes('Connect') || connectError.code === 'resource_missing') {
            console.log('⚠️  Stripe Connect may not be enabled')
            console.log('   Go to: https://dashboard.stripe.com/settings/connect')
          } else {
            console.log('✅ Stripe Connect check passed')
          }
        }
      } catch (error: any) {
        console.log('❌ Stripe connection failed:')
        console.log(`   Error: ${error.message}`)
        if (error.message?.includes('Invalid API Key')) {
          console.log('   → Check your API keys in Admin Settings')
        } else if (error.message?.includes('Expired')) {
          console.log('   → Your API key has expired. Get a new one from Stripe Dashboard')
        }
      }
    }

    // 4. Check environment variables
    console.log('\n4️⃣ Checking Environment Variables...')
    const envPublishable = process.env.STRIPE_PUBLISHABLE_KEY
    const envSecret = process.env.STRIPE_SECRET_KEY

    if (envPublishable) {
      const isTest = envPublishable.startsWith('pk_test_')
      console.log(`✅ ENV Publishable Key: ${envPublishable.substring(0, 20)}...`)
      console.log(`   Mode: ${isTest ? '🧪 TEST MODE' : '🔴 LIVE MODE'}`)
    } else {
      console.log('⚠️  No STRIPE_PUBLISHABLE_KEY in environment')
    }

    if (envSecret) {
      const isTest = envSecret.startsWith('sk_test_')
      console.log(`✅ ENV Secret Key: ${envSecret.substring(0, 20)}...`)
      console.log(`   Mode: ${isTest ? '🧪 TEST MODE' : '🔴 LIVE MODE'}`)
    } else {
      console.log('⚠️  No STRIPE_SECRET_KEY in environment')
    }

    // 5. Summary
    console.log('\n📊 Summary:')
    const hasPublishable = !!publishableKey
    const hasSecret = !!secretKey
    const bothTest = publishableKey?.startsWith('pk_test_') && secretKey?.startsWith('sk_test_')
    const bothLive = publishableKey?.startsWith('pk_live_') && secretKey?.startsWith('sk_live_')
    const mixed = hasPublishable && hasSecret && !bothTest && !bothLive

    if (!hasPublishable || !hasSecret) {
      console.log('❌ Missing API keys - configure them in Admin Settings → General')
    } else if (bothTest) {
      console.log('✅ TEST MODE configured correctly!')
      console.log('   Ready for testing Stripe Connect')
    } else if (bothLive) {
      console.log('⚠️  LIVE MODE detected - switch to TEST MODE for testing')
    } else if (mixed) {
      console.log('⚠️  Mixed modes detected - both keys should be test or both live')
    }

  } catch (error: any) {
    console.error('❌ Error checking Stripe config:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkStripeConfig()
