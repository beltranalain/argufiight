import { prisma } from '../lib/db/prisma'

async function clearAdvertiserStripeAccount() {
  console.log('🔄 Clearing invalid Stripe account ID...\n')

  try {
    const advertiser = await prisma.advertiser.findUnique({
      where: { contactEmail: 'info@kamioi.com' },
      select: {
        id: true,
        contactEmail: true,
        companyName: true,
        stripeAccountId: true,
      },
    })

    if (!advertiser) {
      console.log('❌ Advertiser not found')
      return
    }

    console.log('📋 Current advertiser info:')
    console.log(`   Email: ${advertiser.contactEmail}`)
    console.log(`   Company: ${advertiser.companyName}`)
    console.log(`   Current Stripe Account ID: ${advertiser.stripeAccountId || 'NOT SET'}\n`)

    if (!advertiser.stripeAccountId) {
      console.log('ℹ️  No Stripe account ID to clear')
      return
    }

    // Clear the stripeAccountId
    await prisma.advertiser.update({
      where: { id: advertiser.id },
      data: { stripeAccountId: null },
    })

    console.log('✅ Stripe account ID cleared!')
    console.log('   The system will create a new account when you try to connect again.\n')

    // Verify
    const updated = await prisma.advertiser.findUnique({
      where: { id: advertiser.id },
      select: { stripeAccountId: true },
    })

    if (!updated?.stripeAccountId) {
      console.log('✅ Verification: Stripe account ID is now null')
    } else {
      console.log('⚠️  Warning: Stripe account ID still exists')
    }

  } catch (error: any) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearAdvertiserStripeAccount()
