import { prisma } from '../lib/db/prisma'

async function checkAdvertiser(email: string) {
  try {
    console.log(`\n=== Checking Advertiser Account: ${email} ===\n`)

    // Check user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        username: true,
      },
    })

    if (!user) {
      console.log('❌ User not found!')
      return
    }

    console.log(`✅ User found: ${user.username} (${user.email})`)

    // Check advertiser
    const advertiser = await prisma.advertiser.findUnique({
      where: { contactEmail: user.email },
      select: {
        id: true,
        companyName: true,
        status: true,
        contactEmail: true,
        createdAt: true,
      },
    })

    if (!advertiser) {
      console.log('\n❌ Advertiser account not found!')
      console.log('\nTo create an advertiser account, run:')
      console.log(`  npx tsx scripts/create-advertiser-user.ts ${email}`)
      return
    }

    console.log(`\n✅ Advertiser account found:`)
    console.log(`   Company: ${advertiser.companyName}`)
    console.log(`   Status: ${advertiser.status}`)
    console.log(`   Contact Email: ${advertiser.contactEmail}`)
    console.log(`   Created: ${advertiser.createdAt}`)

    if (advertiser.status !== 'APPROVED') {
      console.log(`\n⚠️  Advertiser is NOT approved (status: ${advertiser.status})`)
      console.log('\nTo approve this advertiser, run:')
      console.log(`  npx tsx scripts/approve-advertiser.ts ${advertiser.id}`)
    } else {
      console.log(`\n✅ Advertiser is APPROVED - login should work!`)
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get email from command line
const email = process.argv[2]

if (!email) {
  console.log('Usage: npx tsx scripts/check-advertiser.ts <email>')
  console.log('\nExample:')
  console.log('  npx tsx scripts/check-advertiser.ts abc@abmo.com')
  process.exit(1)
}

checkAdvertiser(email)
