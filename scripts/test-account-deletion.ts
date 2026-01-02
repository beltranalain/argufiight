/**
 * Test account deletion functionality
 * Usage: npx tsx scripts/test-account-deletion.ts [userIdToDelete] [currentUserId]
 */

import { prisma } from '../lib/db/prisma'

async function testAccountDeletion(userIdToDelete?: string, currentUserId?: string) {
  try {
    console.log('\n=== Testing Account Deletion ===\n')

    if (!userIdToDelete || !currentUserId) {
      console.log('Usage: npx tsx scripts/test-account-deletion.ts [userIdToDelete] [currentUserId]')
      console.log('\nFirst, let me show you all users and their sessions:\n')
      
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })

      console.log('Users:')
      allUsers.forEach((user, i) => {
        console.log(`  ${i + 1}. ${user.username} (${user.email}) - ID: ${user.id}`)
      })

      const allSessions = await prisma.session.findMany({
        where: {
          expiresAt: { gt: new Date() },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })

      console.log(`\nActive Sessions (${allSessions.length}):`)
      allSessions.forEach((session, i) => {
        console.log(`  ${i + 1}. User: ${session.user.username} (${session.user.email})`)
        console.log(`     Session ID: ${session.id}`)
        console.log(`     Token: ${session.token.substring(0, 20)}...`)
        console.log(`     Expires: ${session.expiresAt}`)
        console.log('')
      })

      return
    }

    console.log(`Testing deletion of account: ${userIdToDelete}`)
    console.log(`Current user: ${currentUserId}\n`)

    // Check if user exists
    const userToDelete = await prisma.user.findUnique({
      where: { id: userIdToDelete },
      select: {
        id: true,
        email: true,
        username: true,
      },
    })

    if (!userToDelete) {
      console.error(`❌ User ${userIdToDelete} not found`)
      return
    }

    console.log(`✅ Found user: ${userToDelete.username} (${userToDelete.email})`)

    // Find all sessions for this user
    const sessions = await prisma.session.findMany({
      where: {
        userId: userIdToDelete,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        token: true,
        createdAt: true,
        expiresAt: true,
      },
    })

    console.log(`\n📋 Found ${sessions.length} active session(s) for this user:`)
    sessions.forEach((session, i) => {
      console.log(`  ${i + 1}. Session ID: ${session.id}`)
      console.log(`     Token: ${session.token.substring(0, 30)}...`)
      console.log(`     Created: ${session.createdAt}`)
      console.log(`     Expires: ${session.expiresAt}`)
    })

    if (sessions.length === 0) {
      console.log('\n⚠️  No active sessions to delete. This user might only exist as a temp entry.')
      console.log('   The deletion should still work by removing from localStorage.')
      return
    }

    // Test deletion of each session
    console.log('\n🗑️  Testing session deletion...\n')
    
    for (const session of sessions) {
      try {
        console.log(`Deleting session ${session.id}...`)
        
        // Simulate the DELETE API call
        const deleted = await prisma.session.delete({
          where: { token: session.token },
        })

        console.log(`✅ Successfully deleted session: ${deleted.id}`)
      } catch (error: any) {
        console.error(`❌ Failed to delete session ${session.id}:`, error.message)
      }
    }

    // Verify deletion
    const remainingSessions = await prisma.session.findMany({
      where: {
        userId: userIdToDelete,
        expiresAt: { gt: new Date() },
      },
    })

    if (remainingSessions.length === 0) {
      console.log('\n✅ All sessions deleted successfully!')
      console.log('   The account should no longer appear in the account switcher.')
    } else {
      console.log(`\n⚠️  ${remainingSessions.length} session(s) still exist:`)
      remainingSessions.forEach(s => {
        console.log(`  - ${s.id}`)
      })
    }

    // Check if current user can still access their sessions
    const currentUserSessions = await prisma.session.findMany({
      where: {
        userId: currentUserId,
        expiresAt: { gt: new Date() },
      },
    })

    console.log(`\n✅ Current user (${currentUserId}) has ${currentUserSessions.length} active session(s)`)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

const userIdToDelete = process.argv[2]
const currentUserId = process.argv[3]
testAccountDeletion(userIdToDelete, currentUserId)
