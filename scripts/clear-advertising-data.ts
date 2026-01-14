/**
 * Script to clear all advertising-related data
 * This includes:
 * - Advertisers
 * - Advertisements
 * - Campaigns
 * - Ad Contracts
 * - Offers (if exists)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearAdvertisingData() {
  console.log('🧹 Starting to clear all advertising data...\n')

  try {
    // Delete in order to respect foreign key constraints
    
    // 1. Delete Ad Contracts (depends on advertisers, campaigns, creators)
    console.log('Deleting Ad Contracts...')
    const contractsDeleted = await prisma.adContract.deleteMany({})
    console.log(`✅ Deleted ${contractsDeleted.count} ad contracts\n`)

    // 2. Delete Offers (if they exist and depend on advertisers/campaigns)
    try {
      console.log('Deleting Offers...')
      const offersDeleted = await prisma.offer.deleteMany({})
      console.log(`✅ Deleted ${offersDeleted.count} offers\n`)
    } catch (error: any) {
      if (error.code === 'P2001' || error.message?.includes('does not exist')) {
        console.log('⚠️  Offers table does not exist, skipping...\n')
      } else {
        throw error
      }
    }

    // 3. Delete Campaigns (depends on advertisers)
    console.log('Deleting Campaigns...')
    const campaignsDeleted = await prisma.campaign.deleteMany({})
    console.log(`✅ Deleted ${campaignsDeleted.count} campaigns\n`)

    // 4. Delete Advertisements (direct ads)
    console.log('Deleting Advertisements...')
    const adsDeleted = await prisma.advertisement.deleteMany({})
    console.log(`✅ Deleted ${adsDeleted.count} advertisements\n`)

    // 5. Get advertiser emails before deleting (for user cleanup)
    console.log('Getting advertiser emails...')
    const advertiserEmails = await prisma.advertiser.findMany({
      select: { contactEmail: true },
    }).catch(() => [])
    const emails = advertiserEmails.map(a => a.contactEmail.toLowerCase())
    console.log(`Found ${emails.length} advertiser emails\n`)

    // 6. Delete Advertisers (this will cascade to related data)
    console.log('Deleting Advertisers...')
    const advertisersDeleted = await prisma.advertiser.deleteMany({})
    console.log(`✅ Deleted ${advertisersDeleted.count} advertisers\n`)

    // 7. Delete user accounts that were created for advertisers
    if (emails.length > 0) {
      console.log('Deleting advertiser user accounts...')
      const usersDeleted = await prisma.user.deleteMany({
        where: {
          email: { in: emails },
          isAdmin: false, // Don't delete admin accounts
        },
      })
      console.log(`✅ Deleted ${usersDeleted.count} advertiser user accounts\n`)
    }

    // 8. Delete password reset tokens for advertiser emails
    if (emails.length > 0) {
      console.log('Deleting password reset tokens for advertisers...')
      const tokensDeleted = await prisma.passwordResetToken.deleteMany({
        where: {
          email: { in: emails },
        },
      })
      console.log(`✅ Deleted ${tokensDeleted.count} password reset tokens\n`)
    }

    console.log('✨ All advertising data cleared successfully!')
  } catch (error: any) {
    console.error('❌ Error clearing advertising data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
clearAdvertisingData()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
