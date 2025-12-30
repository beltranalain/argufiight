/**
 * Script to check for existing users with blocked/reserved usernames
 * Run with: npx tsx scripts/check-blocked-usernames.ts
 */

import { prisma } from '../lib/db/prisma'
import { isBlockedUsername } from '../lib/utils/validation'

async function checkBlockedUsernames() {
  console.log('🔍 Checking for users with blocked usernames...\n')

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        isBanned: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`📊 Total users: ${users.length}\n`)

    const blockedUsers: Array<{
      id: string
      username: string
      email: string
      createdAt: Date
      isBanned: boolean
    }> = []

    // Check each user
    for (const user of users) {
      if (user.username && isBlockedUsername(user.username)) {
        blockedUsers.push(user)
      }
    }

    if (blockedUsers.length === 0) {
      console.log('✅ No users found with blocked usernames!\n')
      return
    }

    console.log(`⚠️  Found ${blockedUsers.length} user(s) with blocked usernames:\n`)
    console.log('─'.repeat(80))
    
    for (const user of blockedUsers) {
      console.log(`\n🚫 Username: ${user.username}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   User ID: ${user.id}`)
      console.log(`   Created: ${user.createdAt.toISOString()}`)
      console.log(`   Banned: ${user.isBanned ? 'Yes' : 'No'}`)
    }

    console.log('\n' + '─'.repeat(80))
    console.log('\n💡 Recommendation:')
    console.log('   Consider updating these usernames or banning these accounts')
    console.log('   to prevent impersonation.\n')
  } catch (error) {
    console.error('❌ Error checking blocked usernames:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkBlockedUsernames()






