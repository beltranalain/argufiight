/**
 * SECURITY: Remove Stripe Keys from Database
 * Run with: npx tsx scripts/remove-stripe-keys-from-db.ts
 *
 * This script removes Stripe API keys from the AdminSettings table.
 * Stripe keys should NEVER be stored in the database for security reasons.
 * They should only be configured as environment variables.
 */

import { prisma } from '../lib/db/prisma'

async function removeStripeKeysFromDatabase() {
  console.log('🔒 SECURITY: Removing Stripe keys from database...\n')

  try {
    // Find any Stripe keys in AdminSettings
    const stripeKeys = await prisma.adminSetting.findMany({
      where: {
        key: {
          in: ['STRIPE_PUBLISHABLE_KEY', 'STRIPE_SECRET_KEY'],
        },
      },
    })

    if (stripeKeys.length === 0) {
      console.log('✅ No Stripe keys found in database (already secure)')
      console.log('\nVerify environment variables are set:')
      console.log('  - STRIPE_PUBLISHABLE_KEY:', process.env.STRIPE_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing')
      console.log('  - STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Missing')
      return
    }

    console.log(`⚠️  Found ${stripeKeys.length} Stripe key(s) in database:`)
    stripeKeys.forEach((key) => {
      const value = key.value || ''
      const masked = value.length > 10 ? value.substring(0, 10) + '...' : '[empty]'
      console.log(`  - ${key.key}: ${masked}`)
    })

    console.log('\n🗑️  Deleting Stripe keys from database...')

    const result = await prisma.adminSetting.deleteMany({
      where: {
        key: {
          in: ['STRIPE_PUBLISHABLE_KEY', 'STRIPE_SECRET_KEY'],
        },
      },
    })

    console.log(`✅ Deleted ${result.count} Stripe key(s) from database`)

    console.log('\n🔐 Security Checklist:')
    console.log('  ✅ Stripe keys removed from database')
    console.log('  ✅ stripe-client.ts now uses environment variables only')
    console.log('\n⚠️  IMPORTANT: Ensure environment variables are set in Vercel:')
    console.log('  1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables')
    console.log('  2. Verify these variables are set for all environments:')
    console.log('     - STRIPE_PUBLISHABLE_KEY')
    console.log('     - STRIPE_SECRET_KEY')
    console.log('     - STRIPE_WEBHOOK_SECRET (if using webhooks)')
    console.log('\n📝 Local Development:')
    console.log('  Add to .env and .env.local:')
    console.log('  STRIPE_PUBLISHABLE_KEY=pk_test_...')
    console.log('  STRIPE_SECRET_KEY=sk_test_...')

  } catch (error) {
    console.error('❌ Failed to remove Stripe keys:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

removeStripeKeysFromDatabase()
  .then(() => {
    console.log('\n✅ Script finished successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
