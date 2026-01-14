import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const advertiser = await prisma.advertiser.findFirst({
      where: { status: 'APPROVED' },
    })

    if (!advertiser) {
      console.log('No approved advertisers found')
      return
    }

    console.log('Approved advertiser found:')
    console.log('Email:', advertiser.contactEmail)
    console.log('Company:', advertiser.companyName)
    console.log('Status:', advertiser.status)

    // Check if user account exists
    const user = await prisma.user.findUnique({
      where: { email: advertiser.contactEmail },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
      },
    })

    if (user) {
      console.log('\nUser account exists:')
      console.log('Username:', user.username)
      console.log('Has password:', !!user.passwordHash)
    } else {
      console.log('\n⚠️  No user account found for this advertiser email!')
      console.log('The advertiser was approved but no user account was created.')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
