/**
 * Script to invalidate all sessions for a user (force logout)
 * Usage: npx tsx scripts/invalidate-all-sessions.ts <email>
 */

import { prisma } from '../lib/db/prisma'

async function invalidateAllSessions(email: string) {
  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
      },
    })

    if (!user) {
      console.log(`❌ User with email ${email} not found`)
      return
    }

    console.log(`\n📊 Invalidating all sessions for: ${user.username} (${user.email})\n`)

    // Delete all sessions for this user
    const result = await prisma.session.deleteMany({
      where: {
        userId: user.id,
      },
    })

    console.log(`✅ Deleted ${result.count} session(s)`)
    console.log('\n⚠️  User will need to log in again')
    console.log('   All active sessions have been invalidated\n')
  } catch (error) {
    console.error('Error invalidating sessions:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

const email = process.argv[2]
if (!email) {
  console.error('Usage: npx tsx scripts/invalidate-all-sessions.ts <email>')
  process.exit(1)
}

invalidateAllSessions(email)
