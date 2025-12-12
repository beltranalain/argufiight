/**
 * Script to reset a user's subscription to FREE tier
 * Usage: npx tsx scripts/reset-user-subscription.ts <email>
 */

import { prisma } from '@/lib/db/prisma'

const userEmail = process.argv[2]

if (!userEmail) {
  console.error('❌ Please provide a user email')
  console.log('Usage: npx tsx scripts/reset-user-subscription.ts <email>')
  process.exit(1)
}

async function resetUserSubscription() {
  try {
    console.log(`\n🔄 Resetting subscription for: ${userEmail}\n`)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, email: true, username: true },
    })

    if (!user) {
      console.error(`❌ User not found: ${userEmail}`)
      process.exit(1)
    }

    console.log(`✅ Found user: ${user.username || user.email} (${user.id})`)

    // Get current subscription
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: user.id },
    })

    if (!subscription) {
      console.log('ℹ️  No subscription found, creating FREE subscription...')
      await prisma.userSubscription.create({
        data: {
          userId: user.id,
          tier: 'FREE',
          status: 'ACTIVE',
          billingCycle: null,
        },
      })
      console.log('✅ Created FREE subscription')
    } else {
      console.log(`📋 Current subscription: ${subscription.tier} (${subscription.status})`)
      
      // Reset to FREE
      await prisma.userSubscription.update({
        where: { id: subscription.id },
        data: {
          tier: 'FREE',
          status: 'ACTIVE',
          billingCycle: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          stripeSubscriptionId: null,
          stripePriceId: null,
          cancelAtPeriodEnd: false,
          cancelledAt: null,
          promoCodeId: null,
          // Keep stripeCustomerId in case they want to subscribe again
        },
      })
      console.log('✅ Reset subscription to FREE')
    }

    // Reset appeal limits to FREE tier (4/month)
    await prisma.appealLimit.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        monthlyLimit: 4,
        currentCount: 0,
      },
      update: {
        monthlyLimit: 4,
      },
    })
    console.log('✅ Reset appeal limits to FREE tier (4/month)')

    // Verify the reset
    const updatedSubscription = await prisma.userSubscription.findUnique({
      where: { userId: user.id },
    })

    console.log('\n📊 Final Status:')
    console.log(`   Tier: ${updatedSubscription?.tier}`)
    console.log(`   Status: ${updatedSubscription?.status}`)
    console.log(`   Billing Cycle: ${updatedSubscription?.billingCycle || 'N/A'}`)
    console.log(`   Stripe Customer ID: ${updatedSubscription?.stripeCustomerId || 'None'}`)
    console.log(`   Stripe Subscription ID: ${updatedSubscription?.stripeSubscriptionId || 'None'}`)

    console.log('\n✅ User subscription reset complete!')
    console.log('   The user can now test the subscription flow from scratch.\n')
  } catch (error: any) {
    console.error('❌ Error resetting subscription:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetUserSubscription()

