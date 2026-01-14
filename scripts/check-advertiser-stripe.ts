import { prisma } from '../lib/db/prisma'
import { createStripeClient } from '../lib/stripe/stripe-client'

async function checkAdvertiserStripe() {
  console.log('🔍 Checking Advertiser Stripe Configuration...\n')

  try {
    // Find the advertiser
    const advertiser = await prisma.advertiser.findUnique({
      where: { contactEmail: 'info@kamioi.com' },
      select: {
        id: true,
        contactEmail: true,
        companyName: true,
        status: true,
        stripeAccountId: true,
      },
    })

    if (!advertiser) {
      console.log('❌ Advertiser not found')
      return
    }

    console.log('✅ Advertiser found:')
    console.log(`   ID: ${advertiser.id}`)
    console.log(`   Email: ${advertiser.contactEmail}`)
    console.log(`   Company: ${advertiser.companyName}`)
    console.log(`   Status: ${advertiser.status}`)
    console.log(`   Stripe Account ID: ${advertiser.stripeAccountId || 'NOT SET'}\n`)

    if (advertiser.stripeAccountId) {
      console.log('2️⃣ Checking existing Stripe account...')
      try {
        const stripe = await createStripeClient()
        const account = await stripe.accounts.retrieve(advertiser.stripeAccountId)
        
        console.log('✅ Stripe account exists and is valid:')
        console.log(`   Account ID: ${account.id}`)
        console.log(`   Type: ${account.type}`)
        console.log(`   Country: ${account.country}`)
        console.log(`   Charges Enabled: ${account.charges_enabled}`)
        console.log(`   Payouts Enabled: ${account.payouts_enabled}`)
        console.log(`   Details Submitted: ${account.details_submitted}`)
        
        // Try to create an account session
        console.log('\n3️⃣ Testing account session creation...')
        try {
          const accountSession = await stripe.accountSessions.create({
            account: advertiser.stripeAccountId,
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
        } catch (sessionError: any) {
          console.log('❌ Failed to create account session:')
          console.log(`   Error: ${sessionError.message}`)
          console.log(`   Type: ${sessionError.type}`)
          console.log(`   Code: ${sessionError.code}`)
        }
      } catch (accountError: any) {
        console.log('❌ Stripe account is invalid or deleted:')
        console.log(`   Error: ${accountError.message}`)
        console.log(`   Code: ${accountError.code}`)
        console.log('\n⚠️  Recommendation: Clear the stripeAccountId and try again')
        console.log('   This will force the system to create a new account')
      }
    } else {
      console.log('ℹ️  No Stripe account ID set - system will create one on first connect')
    }

  } catch (error: any) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdvertiserStripe()
