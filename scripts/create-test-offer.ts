import { prisma } from '../lib/db/prisma'
import { Prisma, CreatorStatus, PaymentType } from '@prisma/client'

async function createTestOffer(advertiserEmail: string) {
  try {
    console.log(`\n=== Creating Test Offer for: ${advertiserEmail} ===\n`)

    // Find advertiser
    const advertiser = await prisma.advertiser.findUnique({
      where: { contactEmail: advertiserEmail.toLowerCase() },
      include: {
        campaigns: {
          where: { status: 'APPROVED' },
          take: 1,
        },
      },
    })

    if (!advertiser) {
      console.log('❌ Advertiser not found!')
      return
    }

    if (advertiser.status !== 'APPROVED') {
      console.log(`❌ Advertiser status is ${advertiser.status}. Must be APPROVED.`)
      return
    }

    if (advertiser.campaigns.length === 0) {
      console.log('❌ No approved campaigns found for this advertiser.')
      console.log('   Please create and approve a campaign first.')
      return
    }

    const campaign = advertiser.campaigns[0]
    console.log(`✅ Found campaign: ${campaign.name} (${campaign.id})`)

    // Find or create a test creator
    let creator = await prisma.user.findFirst({
      where: { isCreator: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!creator) {
      console.log('⚠️  No creators found. Creating a test creator...')
      creator = await prisma.user.create({
        data: {
          email: `test-creator-${Date.now()}@test.com`,
          username: `testcreator${Date.now()}`,
          isCreator: true,
          creatorStatus: CreatorStatus.BRONZE,
          subscription: {
            create: {
              tier: 'FREE',
            },
          },
          appealLimit: {
            create: {
              monthlyLimit: 4,
              currentCount: 0,
            },
          },
        },
      })
      console.log(`✅ Created test creator: ${creator.username} (${creator.id})`)
    } else {
      console.log(`✅ Using existing creator: ${creator.username} (${creator.id})`)
    }

    // Calculate expiration date (7 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Create the offer
    const offer = await prisma.offer.create({
      data: {
        advertiserId: advertiser.id,
        campaignId: campaign.id,
        creatorId: creator.id,
        placement: 'PROFILE_BANNER',
        duration: 30, // 30 days
        paymentType: PaymentType.FLAT_RATE,
        amount: new Prisma.Decimal(100.00), // $100 test offer
        expiresAt,
        status: 'PENDING',
        message: 'This is a test offer for payment flow testing.',
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    console.log('\n✅ Test offer created successfully!')
    console.log(`\n📋 Offer Details:`)
    console.log(`   ID: ${offer.id}`)
    console.log(`   Creator: @${offer.creator.username}`)
    console.log(`   Campaign: ${offer.campaign.name}`)
    console.log(`   Amount: $${offer.amount}`)
    console.log(`   Placement: ${offer.placement}`)
    console.log(`   Duration: ${offer.duration} days`)
    console.log(`   Status: ${offer.status}`)
    console.log(`   Expires: ${offer.expiresAt.toLocaleDateString()}`)
    console.log(`\n🔗 Test Payment URL:`)
    console.log(`   https://www.argufight.com/advertiser/checkout?offerId=${offer.id}`)
    console.log(`\n💡 Next Steps:`)
    console.log(`   1. Go to https://www.argufight.com/advertiser/dashboard`)
    console.log(`   2. Find the "Sent Offers" section`)
    console.log(`   3. Click "Pay Now" on the test offer`)
    console.log(`   4. Or use the URL above directly`)
  } catch (error: any) {
    console.error('❌ Error creating test offer:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

const email = process.argv[2] || 'abc@abmo.com'

if (!email) {
  console.log('Usage: npx tsx scripts/create-test-offer.ts <advertiser-email>')
  console.log('Example: npx tsx scripts/create-test-offer.ts abc@abmo.com')
  process.exit(1)
}

createTestOffer(email)

