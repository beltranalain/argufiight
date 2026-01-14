import { prisma } from '../lib/db/prisma'

async function deleteAdvertiser() {
  const email = process.argv[2] || 'info@kamioi.com'

  console.log('\n=== Deleting Advertiser Application ===\n')
  console.log(`Looking for advertiser with email: ${email}\n`)

  try {
    // Find the advertiser
    const advertiser = await prisma.advertiser.findUnique({
      where: { contactEmail: email },
      select: {
        id: true,
        companyName: true,
        contactEmail: true,
        status: true,
        createdAt: true,
      },
    })

    if (!advertiser) {
      console.log(`❌ No advertiser found with email: ${email}`)
      return
    }

    console.log('✅ Found advertiser:')
    console.log(`   ID: ${advertiser.id}`)
    console.log(`   Company: ${advertiser.companyName}`)
    console.log(`   Email: ${advertiser.contactEmail}`)
    console.log(`   Status: ${advertiser.status}`)
    console.log(`   Created: ${advertiser.createdAt}`)

    // Delete the advertiser
    await prisma.advertiser.delete({
      where: { id: advertiser.id },
    })

    console.log('\n✅ Advertiser deleted successfully!')

  } catch (error: any) {
    console.error('\n❌ Error deleting advertiser:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

deleteAdvertiser()
