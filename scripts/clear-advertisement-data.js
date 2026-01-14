/**
 * Script to clear all advertisement-related data from the database
 * This includes:
 * - All clicks and impressions
 * - All ad contracts
 * - All offers
 * - All campaigns
 * - All advertisements (Direct Ads)
 * - All advertisers
 * - User account (by email)
 * 
 * Usage: node scripts/clear-advertisement-data.js [email]
 */

import { PrismaClient } from '@prisma/client'
import readline from 'readline'

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function clearAllAdvertisementData(email = null) {
  try {
    console.log('\n=== Advertisement Data Cleanup Script ===\n')
    
    // Get email if not provided
    if (!email) {
      email = await question('Enter the email address to clear (or press Enter to clear ALL data): ')
      if (!email || email.trim() === '') {
        const confirm = await question('\n⚠️  WARNING: This will delete ALL advertisement data for ALL users. Continue? (yes/no): ')
        if (confirm.toLowerCase() !== 'yes') {
          console.log('Cancelled.')
          return
        }
        email = null
      }
    }

    console.log('\n📊 Starting cleanup...\n')

    let deletedCounts = {
      clicks: 0,
      impressions: 0,
      contracts: 0,
      offers: 0,
      campaigns: 0,
      advertisements: 0,
      advertisers: 0,
      users: 0
    }

    // Step 1: Delete clicks and impressions (must be first due to foreign keys)
    console.log('1. Deleting clicks and impressions...')
    const clicksDeleted = await prisma.click.deleteMany({})
    const impressionsDeleted = await prisma.impression.deleteMany({})
    deletedCounts.clicks = clicksDeleted.count
    deletedCounts.impressions = impressionsDeleted.count
    console.log(`   ✓ Deleted ${clicksDeleted.count} clicks`)
    console.log(`   ✓ Deleted ${impressionsDeleted.count} impressions`)

    // Step 2: Delete ad contracts
    console.log('\n2. Deleting ad contracts...')
    const contractsDeleted = await prisma.adContract.deleteMany({})
    deletedCounts.contracts = contractsDeleted.count
    console.log(`   ✓ Deleted ${contractsDeleted.count} ad contracts`)

    // Step 3: Delete offers
    console.log('\n3. Deleting offers...')
    const offersDeleted = await prisma.offer.deleteMany({})
    deletedCounts.offers = offersDeleted.count
    console.log(`   ✓ Deleted ${offersDeleted.count} offers`)

    // Step 4: Delete campaigns
    console.log('\n4. Deleting campaigns...')
    const campaignsDeleted = await prisma.campaign.deleteMany({})
    deletedCounts.campaigns = campaignsDeleted.count
    console.log(`   ✓ Deleted ${campaignsDeleted.count} campaigns`)

    // Step 5: Delete advertisements (Direct Ads)
    console.log('\n5. Deleting advertisements (Direct Ads)...')
    const advertisementsDeleted = await prisma.advertisement.deleteMany({})
    deletedCounts.advertisements = advertisementsDeleted.count
    console.log(`   ✓ Deleted ${advertisementsDeleted.count} advertisements`)

    // Step 6: Delete advertisers
    console.log('\n6. Deleting advertisers...')
    if (email) {
      // Delete specific advertiser by email
      const advertiser = await prisma.advertiser.findUnique({
        where: { contactEmail: email }
      })
      if (advertiser) {
        await prisma.advertiser.delete({
          where: { contactEmail: email }
        })
        deletedCounts.advertisers = 1
        console.log(`   ✓ Deleted advertiser: ${email}`)
      } else {
        console.log(`   ⚠️  No advertiser found with email: ${email}`)
      }
    } else {
      // Delete all advertisers
      const advertisersDeleted = await prisma.advertiser.deleteMany({})
      deletedCounts.advertisers = advertisersDeleted.count
      console.log(`   ✓ Deleted ${advertisersDeleted.count} advertisers`)
    }

    // Step 7: Delete user account and sessions (if email provided)
    if (email) {
      console.log('\n7. Deleting user account and sessions...')
      const user = await prisma.user.findUnique({
        where: { email: email },
        include: { sessions: true }
      })
      if (user) {
        // Delete sessions first (if not cascading)
        if (user.sessions && user.sessions.length > 0) {
          await prisma.session.deleteMany({
            where: { userId: user.id }
          })
          console.log(`   ✓ Deleted ${user.sessions.length} session(s)`)
        }
        
        // Try to delete user, but handle foreign key constraints gracefully
        try {
          // Delete tournament-related data first (if they exist)
          try {
            // Get tournament participants for this user
            const participants = await prisma.tournamentParticipant.findMany({
              where: { userId: user.id },
              select: { id: true, tournamentId: true }
            })
            
            if (participants.length > 0) {
              // Delete tournament matches that reference these participants
              for (const participant of participants) {
                try {
                  await prisma.tournamentMatch.deleteMany({
                    where: {
                      OR: [
                        { participant1Id: participant.id },
                        { participant2Id: participant.id },
                        { winnerId: participant.id }
                      ]
                    }
                  })
                } catch (e) {
                  // Matches might not exist
                }
              }
              
              // Delete tournament participants
              const tournamentParticipants = await prisma.tournamentParticipant.deleteMany({
                where: { userId: user.id }
              })
              if (tournamentParticipants.count > 0) {
                console.log(`   ✓ Deleted ${tournamentParticipants.count} tournament participant record(s)`)
              }
            }
          } catch (e) {
            // Tournament participants might not exist or already deleted
            console.log(`   ℹ️  No tournament participants to delete`)
          }
          
          // Delete user (this will cascade delete related data)
          await prisma.user.delete({
            where: { email: email }
          })
          deletedCounts.users = 1
          console.log(`   ✓ Deleted user: ${email}`)
        } catch (error) {
          if (error.code === 'P2003') {
            console.log(`   ⚠️  Could not delete user due to foreign key constraints`)
            console.log(`   ⚠️  User account still exists, but all advertisement data is cleared`)
            console.log(`   ⚠️  You can still create a new advertiser account with this email`)
            console.log(`   ⚠️  Note: The user account may have other data (debates, tournaments, etc.)`)
          } else {
            throw error
          }
        }
      } else {
        console.log(`   ⚠️  No user found with email: ${email}`)
      }
    } else {
      console.log('\n7. Skipping user deletion (use specific email to delete user)')
    }

    // Summary
    console.log('\n' + '='.repeat(50))
    console.log('✅ CLEANUP COMPLETE')
    console.log('='.repeat(50))
    console.log('\nDeleted:')
    console.log(`  • Clicks: ${deletedCounts.clicks}`)
    console.log(`  • Impressions: ${deletedCounts.impressions}`)
    console.log(`  • Ad Contracts: ${deletedCounts.contracts}`)
    console.log(`  • Offers: ${deletedCounts.offers}`)
    console.log(`  • Campaigns: ${deletedCounts.campaigns}`)
    console.log(`  • Advertisements: ${deletedCounts.advertisements}`)
    console.log(`  • Advertisers: ${deletedCounts.advertisers}`)
    if (email) {
      console.log(`  • Users: ${deletedCounts.users}`)
    }
    console.log('\n✨ All advertisement data has been cleared!')
    console.log('   You can now create a new account with the same email.\n')

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
    rl.close()
  }
}

// Run the script
const email = process.argv[2] || null
clearAllAdvertisementData(email)
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
