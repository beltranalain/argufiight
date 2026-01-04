/**
 * Fix user email case to match login normalization
 * Usage: npx tsx scripts/fix-user-email-case.ts <email-or-username>
 */

import { prisma } from '../lib/db/prisma'

async function fixEmailCase(identifier: string) {
  try {
    console.log(`\n=== Fixing email case for: ${identifier} ===\n`)

    // Try to find by email (any case)
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: 'insensitive' } },
          { username: identifier },
        ],
      },
      select: {
        id: true,
        email: true,
        username: true,
      },
    })

    if (!user) {
      console.log('❌ User not found')
      return
    }

    const normalizedEmail = user.email.toLowerCase().trim()
    
    if (user.email === normalizedEmail) {
      console.log(`✅ Email is already normalized: ${user.email}`)
      return
    }

    console.log(`📧 Current email: ${user.email}`)
    console.log(`📧 Normalized email: ${normalizedEmail}`)

    // Check if normalized email already exists for another user
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existing && existing.id !== user.id) {
      console.log(`❌ Email ${normalizedEmail} already exists for another user!`)
      return
    }

    // Update email to lowercase
    await prisma.user.update({
      where: { id: user.id },
      data: { email: normalizedEmail },
    })

    console.log(`✅ Email updated successfully!`)
    console.log(`   Old: ${user.email}`)
    console.log(`   New: ${normalizedEmail}`)
  } catch (error: any) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

const identifier = process.argv[2]

if (!identifier) {
  console.log('Usage: npx tsx scripts/fix-user-email-case.ts <email-or-username>')
  console.log('\nExample:')
  console.log('  npx tsx scripts/fix-user-email-case.ts RiceSzn@RiceSzn.com')
  console.log('  npx tsx scripts/fix-user-email-case.ts RiceSzn')
  process.exit(1)
}

fixEmailCase(identifier)
