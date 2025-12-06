import { prisma } from '../lib/db/prisma'

async function checkUser() {
  const email = process.argv[2] || 'abc@abmo.com'
  
  try {
    console.log(`Checking user: ${email}`)
    
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
        isAdmin: true,
        googleAuthEnabled: true,
        createdAt: true,
      },
    })

    if (!user) {
      console.log('❌ User not found')
      return
    }

    console.log('\n✅ User found:')
    console.log(`  ID: ${user.id}`)
    console.log(`  Email: ${user.email}`)
    console.log(`  Username: ${user.username}`)
    console.log(`  Is Admin: ${user.isAdmin}`)
    console.log(`  Google Auth Enabled: ${user.googleAuthEnabled}`)
    console.log(`  Has Password: ${user.passwordHash ? 'Yes' : 'No (OAuth only)'}`)
    console.log(`  Created: ${user.createdAt}`)

    // Check if they're an advertiser
    const advertiser = await prisma.advertiser.findUnique({
      where: { contactEmail: email.toLowerCase() },
      select: {
        id: true,
        companyName: true,
        status: true,
        createdAt: true,
      },
    })

    if (advertiser) {
      console.log('\n📢 Advertiser Account:')
      console.log(`  Company: ${advertiser.companyName}`)
      console.log(`  Status: ${advertiser.status}`)
      console.log(`  Created: ${advertiser.createdAt}`)
    } else {
      console.log('\n❌ No advertiser account found')
    }

    if (!user.passwordHash) {
      console.log('\n⚠️  This user does not have a password set.')
      console.log('   They must use Google authentication to log in.')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()

