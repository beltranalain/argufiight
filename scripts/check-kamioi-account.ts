import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const email = 'info@kamioi.com'
    
    // Check advertiser account
    const advertiser = await prisma.advertiser.findUnique({
      where: { contactEmail: email },
    })

    if (advertiser) {
      console.log('Advertiser account found:')
      console.log('Email:', advertiser.contactEmail)
      console.log('Company:', advertiser.companyName)
      console.log('Status:', advertiser.status)
      console.log('Contact Name:', advertiser.contactName)
    } else {
      console.log('No advertiser account found for:', email)
    }

    // Check user account
    const user = await prisma.user.findUnique({
      where: { email: email },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
        isAdmin: true,
        createdAt: true,
      },
    })

    if (user) {
      console.log('\nUser account found:')
      console.log('Username:', user.username)
      console.log('Has password:', !!user.passwordHash)
      console.log('Is Admin:', user.isAdmin)
      console.log('Created:', user.createdAt)
      
      if (!user.passwordHash) {
        console.log('\n⚠️  No password set! Account needs password reset.')
      }
    } else {
      console.log('\n⚠️  No user account found for:', email)
      console.log('You may need to create a user account or the advertiser was not approved yet.')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
