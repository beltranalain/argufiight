/**
 * Script to update Stripe API keys in the database
 * Run: npx tsx scripts/update-stripe-keys.ts
 */

import { prisma } from '@/lib/db/prisma'

const STRIPE_SECRET_KEY = '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'
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51ScEnJGg1mkd57D1TyaXdyry639BxZMAy40Q2PIdXPZCcbbzbkUs7myOjtJBXXSvjMqap0vCgEPyPrfPU3KyIR1800LjCQSEAu'

async function updateStripeKeys() {
  try {
    console.log('🔄 Updating Stripe API keys...\n')

    // Update Secret Key
    const secretKeyResult = await prisma.adminSetting.upsert({
      where: { key: 'STRIPE_SECRET_KEY' },
      update: {
        value: STRIPE_SECRET_KEY,
        encrypted: true,
      },
      create: {
        key: 'STRIPE_SECRET_KEY',
        value: STRIPE_SECRET_KEY,
        encrypted: true,
      },
    })

    console.log('✅ Updated STRIPE_SECRET_KEY')
    console.log(`   Key prefix: ${STRIPE_SECRET_KEY.substring(0, 20)}...`)
    console.log(`   Mode: ${STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'LIVE' : 'TEST'}\n`)

    // Update Publishable Key
    const publishableKeyResult = await prisma.adminSetting.upsert({
      where: { key: 'STRIPE_PUBLISHABLE_KEY' },
      update: {
        value: STRIPE_PUBLISHABLE_KEY,
        encrypted: true,
      },
      create: {
        key: 'STRIPE_PUBLISHABLE_KEY',
        value: STRIPE_PUBLISHABLE_KEY,
        encrypted: true,
      },
    })

    console.log('✅ Updated STRIPE_PUBLISHABLE_KEY')
    console.log(`   Key prefix: ${STRIPE_PUBLISHABLE_KEY.substring(0, 20)}...`)
    console.log(`   Mode: ${STRIPE_PUBLISHABLE_KEY.startsWith('pk_live_') ? 'LIVE' : 'TEST'}\n`)

    // Verify the keys were saved
    const verifySecret = await prisma.adminSetting.findUnique({
      where: { key: 'STRIPE_SECRET_KEY' },
    })

    const verifyPublishable = await prisma.adminSetting.findUnique({
      where: { key: 'STRIPE_PUBLISHABLE_KEY' },
    })

    if (verifySecret && verifyPublishable) {
      console.log('✅ Verification: Both keys are stored in the database')
      console.log(`   Secret Key stored: ${verifySecret.value.substring(0, 20)}...`)
      console.log(`   Publishable Key stored: ${verifyPublishable.value.substring(0, 20)}...`)
      console.log(`   Both keys encrypted: ${verifySecret.encrypted && verifyPublishable.encrypted ? 'Yes' : 'No'}\n`)
    } else {
      console.error('❌ Verification failed: Keys not found after update')
    }

    console.log('✅ Stripe keys updated successfully!')
    console.log('\n📝 Next steps:')
    console.log('   1. Keys are now stored in the database (encrypted)')
    console.log('   2. The system will use these keys for all Stripe operations')
    console.log('   3. You can verify the keys in Admin Dashboard → Settings')
    console.log('   4. Test the connection using the "Test Stripe Connection" button')
  } catch (error: any) {
    console.error('❌ Error updating Stripe keys:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

updateStripeKeys()

