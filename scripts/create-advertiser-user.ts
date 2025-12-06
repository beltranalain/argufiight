import { prisma } from '../lib/db/prisma'
import { hashPassword } from '../lib/auth/password'

async function createAdvertiserUser(email: string, password: string) {
  try {
    // Check if advertiser exists
    const advertiser = await prisma.advertiser.findUnique({
      where: { contactEmail: email.toLowerCase() },
    })

    if (!advertiser) {
      console.log(`❌ Advertiser not found for email: ${email}`)
      console.log('   Please create the advertiser first in the admin panel.')
      return
    }

    if (advertiser.status !== 'APPROVED') {
      console.log(`⚠️  Advertiser exists but status is: ${advertiser.status}`)
      console.log('   Only APPROVED advertisers can log in.')
      return
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      console.log(`✅ User already exists: ${existingUser.username}`)
      console.log(`   Email: ${existingUser.email}`)
      
      // Update password if provided
      if (password) {
        const passwordHash = await hashPassword(password)
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { passwordHash },
        })
        console.log(`   Password has been updated!`)
        console.log(`\n📝 Login Credentials:`)
        console.log(`   Email: ${email}`)
        console.log(`   Password: ${password}`)
      } else {
        console.log(`   Has password: ${existingUser.passwordHash ? 'Yes' : 'No'}`)
        if (!existingUser.passwordHash) {
          console.log(`\n⚠️  User has no password. Run this script with a password to set one.`)
        }
      }
      return
    }

    // Create new user account
    const username = email.split('@')[0]
    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username,
        passwordHash: passwordHash,
        // Create FREE subscription for new user
        subscription: {
          create: {
            tier: 'FREE',
          },
        },
        // Create appeal limit for new user
        appealLimit: {
          create: {
            monthlyLimit: 4,
            currentCount: 0,
          },
        },
      },
    })

    console.log(`✅ Created user account for advertiser!`)
    console.log(`   Username: ${user.username}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Password: ${password}`)
    console.log(`\n📝 Login Credentials:`)
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
    console.log(`\n🔐 Login URL: https://www.argufight.com/login`)
    console.log(`\n⚠️  Note: As an approved advertiser, you'll need to set up 2FA on first login.`)
  } catch (error: any) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

// Get email and password from command line
const email = process.argv[2]
const password = process.argv[3] || 'password123'

if (!email) {
  console.log('Usage: npx tsx scripts/create-advertiser-user.ts <email> [password]')
  console.log('Example: npx tsx scripts/create-advertiser-user.ts abc@abmo.com password123')
  process.exit(1)
}

createAdvertiserUser(email, password)

