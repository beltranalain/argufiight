import { prisma } from '../lib/db/prisma'
import bcrypt from 'bcryptjs'

async function createTestAdvertiser() {
  try {
    console.log('\n=== Creating Test Advertiser Account ===\n')

    const testEmail = 'test-advertiser@argufight.com'
    const testPassword = 'TestPassword123!' // You can change this

    // Check if advertiser already exists
    const existingAdvertiser = await prisma.advertiser.findUnique({
      where: { contactEmail: testEmail },
    })

    if (existingAdvertiser) {
      console.log(`⚠️  Advertiser already exists: ${testEmail}`)
      console.log(`   Status: ${existingAdvertiser.status}`)
      console.log(`   ID: ${existingAdvertiser.id}`)
      
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: testEmail },
      })

      if (existingUser) {
        console.log(`\n✅ User account exists:`)
        console.log(`   Email: ${existingUser.email}`)
        console.log(`   Username: ${existingUser.username}`)
        console.log(`   ID: ${existingUser.id}`)
        console.log(`\n📋 Login Credentials:`)
        console.log(`   Email: ${testEmail}`)
        console.log(`   Password: (Check if you know it, or reset via email)`)

        // Update password if needed
        const updatePassword = process.argv.includes('--update-password')
        if (updatePassword) {
          const hashedPassword = await bcrypt.hash(testPassword, 10)
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { passwordHash: hashedPassword },
          })
          console.log(`\n✅ Password updated to: ${testPassword}`)
        }
      } else {
        console.log(`\n⚠️  User account doesn't exist. Creating...`)
        const hashedPassword = await bcrypt.hash(testPassword, 10)
        const user = await prisma.user.create({
          data: {
            email: testEmail,
            username: 'test-advertiser',
            passwordHash: hashedPassword,
          },
        })
        console.log(`✅ User account created:`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Username: ${user.username}`)
        console.log(`   Password: ${testPassword}`)
      }

      return
    }

    // Create new advertiser
    console.log('Creating new advertiser...')
    const advertiser = await prisma.advertiser.create({
      data: {
        companyName: 'Test Ad Company',
        website: 'https://testcompany.com',
        industry: 'Technology',
        contactEmail: testEmail,
        contactName: 'Test Advertiser',
        businessEIN: '12-3456789',
        status: 'PENDING', // Will need admin approval
      },
    })

    console.log(`✅ Advertiser created:`)
    console.log(`   Company: ${advertiser.companyName}`)
    console.log(`   Email: ${advertiser.contactEmail}`)
    console.log(`   Status: ${advertiser.status}`)
    console.log(`   ID: ${advertiser.id}`)

    // Create user account
    console.log('\nCreating user account...')
    const hashedPassword = await bcrypt.hash(testPassword, 10)
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        username: 'test-advertiser',
        passwordHash: hashedPassword,
      },
    })

    console.log(`✅ User account created:`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Username: ${user.username}`)
    console.log(`   Password: ${testPassword}`)

    console.log(`\n📋 Test Advertiser Credentials:`)
    console.log(`   Email: ${testEmail}`)
    console.log(`   Password: ${testPassword}`)
    console.log(`   Status: PENDING (needs admin approval)`)
    console.log(`\n📋 Next Steps:`)
    console.log(`   1. Go to /admin/advertisers`)
    console.log(`   2. Find "${advertiser.companyName}"`)
    console.log(`   3. Click "Approve"`)
    console.log(`   4. Login at /login with credentials above`)

  } catch (error: any) {
    console.error('Error creating test advertiser:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestAdvertiser()
