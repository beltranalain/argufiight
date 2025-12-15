/**
 * Script to update a user's blocked username
 * Usage: npx tsx scripts/update-blocked-username.ts <userId> <newUsername>
 * 
 * Example: npx tsx scripts/update-blocked-username.ts ff84042c-d9fe-45d7-91a6-64f39fccc6a4 newusername
 */

import { prisma } from '../lib/db/prisma'
import { isValidUsername, isBlockedUsername } from '../lib/utils/validation'

async function updateBlockedUsername(userId: string, newUsername: string) {
  console.log(`🔄 Updating username for user: ${userId}\n`)

  try {
    // Validate new username
    if (isBlockedUsername(newUsername)) {
      console.error(`❌ Error: "${newUsername}" is a blocked/reserved username`)
      process.exit(1)
    }

    if (!isValidUsername(newUsername)) {
      console.error(`❌ Error: "${newUsername}" is not a valid username`)
      console.error('   Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens')
      process.exit(1)
    }

    // Check if new username is already taken
    const existingUser = await prisma.user.findFirst({
      where: {
        username: newUsername.trim(),
        NOT: { id: userId },
      },
    })

    if (existingUser) {
      console.error(`❌ Error: Username "${newUsername}" is already taken by another user`)
      process.exit(1)
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
      },
    })

    if (!user) {
      console.error(`❌ Error: User with ID "${userId}" not found`)
      process.exit(1)
    }

    console.log(`📋 Current username: ${user.username}`)
    console.log(`📧 Email: ${user.email}`)
    console.log(`✨ New username: ${newUsername.trim()}\n`)

    // Update username
    await prisma.user.update({
      where: { id: userId },
      data: {
        username: newUsername.trim(),
      },
    })

    console.log('✅ Username updated successfully!\n')
  } catch (error) {
    console.error('❌ Error updating username:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Get command line arguments
const args = process.argv.slice(2)

if (args.length < 2) {
  console.error('❌ Usage: npx tsx scripts/update-blocked-username.ts <userId> <newUsername>')
  console.error('\nExample:')
  console.error('  npx tsx scripts/update-blocked-username.ts ff84042c-d9fe-45d7-91a6-64f39fccc6a4 newusername')
  process.exit(1)
}

const [userId, newUsername] = args
updateBlockedUsername(userId, newUsername)


