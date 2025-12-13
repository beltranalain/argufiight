import { prisma } from '../lib/db/prisma'

async function approveAdvertiser(advertiserId: string) {
  try {
    console.log(`\n=== Approving Advertiser: ${advertiserId} ===\n`)

    // Find advertiser
    const advertiser = await prisma.advertiser.findUnique({
      where: { id: advertiserId },
      select: {
        id: true,
        companyName: true,
        status: true,
        contactEmail: true,
      },
    })

    if (!advertiser) {
      console.log('❌ Advertiser not found!')
      return
    }

    console.log(`Found advertiser:`)
    console.log(`   Company: ${advertiser.companyName}`)
    console.log(`   Email: ${advertiser.contactEmail}`)
    console.log(`   Current Status: ${advertiser.status}`)

    if (advertiser.status === 'APPROVED') {
      console.log('\n✅ Advertiser is already approved!')
      return
    }

    // Update status to APPROVED
    await prisma.advertiser.update({
      where: { id: advertiserId },
      data: { status: 'APPROVED' },
    })

    console.log('\n✅ Advertiser approved successfully!')
    console.log(`\nThe user ${advertiser.contactEmail} can now login and access the advertiser dashboard.`)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get advertiser ID from command line
const advertiserId = process.argv[2]

if (!advertiserId) {
  console.log('Usage: npx tsx scripts/approve-advertiser.ts <advertiser-id>')
  console.log('\nTo find the advertiser ID, first run:')
  console.log('  npx tsx scripts/check-advertiser.ts <email>')
  process.exit(1)
}

approveAdvertiser(advertiserId)

