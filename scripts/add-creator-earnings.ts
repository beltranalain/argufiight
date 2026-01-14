import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'beltranalain@yahoo.com'
  const amount = 10000

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, username: true },
  })

  if (!user) {
    console.error(`User with email ${email} not found`)
    await prisma.$disconnect()
    return
  }

  console.log(`Found user: ${user.username} (${user.id})`)

  // Get or create tax info
  let taxInfo = await prisma.creatorTaxInfo.findUnique({
    where: { creatorId: user.id },
  })

  if (!taxInfo) {
    taxInfo = await prisma.creatorTaxInfo.create({
      data: {
        creatorId: user.id,
        stripeAccountId: `temp_${user.id}`,
        yearlyEarnings: {},
      },
    })
    console.log('Created tax info record')
  }

  // Update yearly earnings for both 2025 and 2026
  const currentYear = new Date().getFullYear()
  const yearlyEarnings = (taxInfo.yearlyEarnings as Record<string, number>) || {}
  // Add to 2025 for testing 1099 generation
  yearlyEarnings['2025'] = (yearlyEarnings['2025'] || 0) + amount
  // Also add to current year
  yearlyEarnings[currentYear.toString()] = (yearlyEarnings[currentYear.toString()] || 0) + amount

  await prisma.creatorTaxInfo.update({
    where: { id: taxInfo.id },
    data: { yearlyEarnings },
  })

  console.log(`Added $${amount} to 2025 and ${currentYear} earnings`)
  console.log(`Total 2025 earnings: $${yearlyEarnings['2025']}`)
  console.log(`Total ${currentYear} earnings: $${yearlyEarnings[currentYear.toString()]}`)

  await prisma.$disconnect()
}

main().catch(console.error)
