import { prisma } from '../lib/db/prisma'

async function checkAllStripeKeys() {
  console.log('🔍 Checking ALL Stripe Keys in Database...\n')

  try {
    // Get all Stripe-related settings
    const allSettings = await prisma.adminSetting.findMany({
      where: {
        key: {
          contains: 'STRIPE',
        },
      },
    })

    console.log(`Found ${allSettings.length} Stripe-related settings:\n`)

    for (const setting of allSettings) {
      const value = setting.value || ''
      const preview = value.length > 30 ? value.substring(0, 30) + '...' : value
      const mode = value.startsWith('pk_test_') || value.startsWith('sk_test_') 
        ? '🧪 TEST' 
        : value.startsWith('pk_live_') || value.startsWith('sk_live_')
        ? '🔴 LIVE'
        : '❓ UNKNOWN'
      
      console.log(`Key: ${setting.key}`)
      console.log(`  Value: ${preview}`)
      console.log(`  Mode: ${mode}`)
      console.log(`  Encrypted: ${setting.encrypted}`)
      console.log(`  Updated: ${setting.updatedAt}`)
      console.log('')
    }

    // Check for the specific keys we need
    const publishableKey = allSettings.find(s => s.key === 'STRIPE_PUBLISHABLE_KEY')
    const secretKey = allSettings.find(s => s.key === 'STRIPE_SECRET_KEY')

    if (publishableKey && secretKey) {
      const pubMode = publishableKey.value?.startsWith('pk_test_') ? 'TEST' : 'LIVE'
      const secMode = secretKey.value?.startsWith('sk_test_') ? 'TEST' : 'LIVE'
      
      console.log('📊 Summary:')
      console.log(`  Publishable Key Mode: ${pubMode}`)
      console.log(`  Secret Key Mode: ${secMode}`)
      
      if (pubMode !== secMode) {
        console.log('  ⚠️  WARNING: Keys are in different modes!')
      } else {
        console.log(`  ✅ Both keys are in ${pubMode} mode`)
      }
      
      // Check if they match the account
      const pubAccount = publishableKey.value?.substring(7, 20)
      const secAccount = secretKey.value?.substring(7, 20)
      
      if (pubAccount === secAccount) {
        console.log('  ✅ Keys are from the same Stripe account')
      } else {
        console.log('  ❌ Keys are from DIFFERENT Stripe accounts!')
        console.log(`     Publishable account: ${pubAccount}`)
        console.log(`     Secret account: ${secAccount}`)
      }
    }

  } catch (error: any) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAllStripeKeys()
