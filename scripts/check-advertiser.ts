import { prisma } from '../lib/db/prisma'

async function checkAdvertiser() {
  const email = process.argv[2] || 'abc@abmo.com'
  
  try {
    console.log(`Checking advertiser: ${email}`)
    
    const advertiser = await prisma.advertiser.findUnique({
      where: { contactEmail: email.toLowerCase() },
      include: {
        campaigns: true,
        offers: true,
      },
    })

    if (!advertiser) {
      console.log('❌ Advertiser not found')
      console.log('\nWould you like to create a test advertiser?')
      return
    }

    console.log('\n✅ Advertiser found:')
    console.log(`  ID: ${advertiser.id}`)
    console.log(`  Company: ${advertiser.companyName}`)
    console.log(`  Email: ${advertiser.contactEmail}`)
    console.log(`  Status: ${advertiser.status}`)
    console.log(`  Website: ${advertiser.website}`)
    console.log(`  Created: ${advertiser.createdAt}`)
    console.log(`  Campaigns: ${advertiser.campaigns.length}`)
    console.log(`  Offers: ${advertiser.offers.length}`)

    // Check if user exists for this email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
        googleAuthEnabled: true,
        isAdmin: true,
      },
    })

    if (user) {
      console.log('\n👤 User Account:')
      console.log(`  Username: ${user.username}`)
      console.log(`  Has Password: ${user.passwordHash ? 'Yes' : 'No (OAuth only)'}`)
      console.log(`  Google Auth: ${user.googleAuthEnabled ? 'Enabled' : 'Disabled'}`)
      console.log(`  Is Admin: ${user.isAdmin}`)
      
      if (!user.passwordHash && !user.googleAuthEnabled) {
        console.log('\n⚠️  User has no password and Google auth is disabled.')
        console.log('   They cannot log in. Need to set a password or enable Google auth.')
      }
    } else {
      console.log('\n❌ No user account found for this email')
      console.log('   Advertiser exists but user account does not.')
      console.log('   User needs to sign up or be created to log in.')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdvertiser()

