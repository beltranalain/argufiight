import { prisma } from '../lib/db/prisma'
import { createStripeClient } from '../lib/stripe/stripe-client'

async function verifyPaymentReady() {
  console.log('🔍 Verifying Payment Ready Status...\n')

  try {
    const advertiser = await prisma.advertiser.findUnique({
      where: { contactEmail: 'info@kamioi.com' },
      select: {
        id: true,
        companyName: true,
        stripeAccountId: true,
        paymentReady: true,
      },
    })

    if (!advertiser) {
      console.log('❌ Advertiser not found')
      return
    }

    console.log('📋 Current Status:')
    console.log(`   Company: ${advertiser.companyName}`)
    console.log(`   Stripe Account ID: ${advertiser.stripeAccountId || 'NOT SET'}`)
    console.log(`   Payment Ready (DB): ${advertiser.paymentReady}\n`)

    if (!advertiser.stripeAccountId) {
      console.log('⚠️  No Stripe account connected')
      return
    }

    // Check Stripe account status
    const stripe = await createStripeClient()
    const account = await stripe.accounts.retrieve(advertiser.stripeAccountId)

    console.log('📊 Stripe Account Status:')
    console.log(`   Account ID: ${account.id}`)
    console.log(`   Details Submitted: ${account.details_submitted}`)
    console.log(`   Charges Enabled: ${account.charges_enabled}`)
    console.log(`   Payouts Enabled: ${account.payouts_enabled}`)
    
    if (account.requirements) {
      console.log(`   Currently Due: ${account.requirements.currently_due?.length || 0} items`)
      console.log(`   Eventually Due: ${account.requirements.eventually_due?.length || 0} items`)
      console.log(`   Past Due: ${account.requirements.past_due?.length || 0} items`)
      if (account.requirements.disabled_reason) {
        console.log(`   Disabled Reason: ${account.requirements.disabled_reason}`)
      }
    }

    // Account is ready if details are submitted
    const paymentReady = !!account.details_submitted

    console.log(`\n✅ Calculated Payment Ready: ${paymentReady}`)

    // Update database if different
    if (advertiser.paymentReady !== paymentReady) {
      await prisma.advertiser.update({
        where: { id: advertiser.id },
        data: { paymentReady },
      })
      console.log(`\n✅ Updated paymentReady in database: ${paymentReady}`)
    } else {
      console.log(`\n✅ Database already has correct paymentReady status`)
    }

  } catch (error: any) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyPaymentReady()
