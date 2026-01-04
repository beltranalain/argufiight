/**
 * Script to check active sessions for a user
 * Usage: npx tsx scripts/check-user-sessions.ts <email>
 */

import { prisma } from '../lib/db/prisma'

async function checkUserSessions(email: string) {
  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        isAdmin: true,
      },
    })

    if (!user) {
      console.log(`❌ User with email ${email} not found`)
      return
    }

    console.log('\n📊 User Information:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`ID:       ${user.id}`)
    console.log(`Email:    ${user.email}`)
    console.log(`Username: ${user.username}`)
    console.log(`isAdmin:  ${user.isAdmin}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Find all active sessions for this user
    const now = new Date()
    const sessions = await prisma.session.findMany({
      where: {
        userId: user.id,
        expiresAt: {
          gt: now, // Only active sessions
        },
      },
      select: {
        id: true,
        token: true,
        createdAt: true,
        expiresAt: true,
        twoFactorVerified: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`Active Sessions: ${sessions.length}\n`)

    if (sessions.length === 0) {
      console.log('✅ No active sessions found')
    } else {
      sessions.forEach((session, index) => {
        const expiresIn = Math.round((session.expiresAt.getTime() - now.getTime()) / 1000 / 60)
        console.log(`${index + 1}. Session ID: ${session.id}`)
        console.log(`   Created: ${session.createdAt}`)
        console.log(`   Expires: ${session.expiresAt} (in ${expiresIn} minutes)`)
        console.log(`   2FA Verified: ${session.twoFactorVerified ? 'Yes' : 'No'}`)
        console.log(`   Token: ${session.token.substring(0, 20)}...`)
        console.log('')
      })
    }

    // Also check if there are any sessions that might be confused
    console.log('\n🔍 Checking for potential session conflicts...')
    
    // Check admin user's sessions
    const adminUser = await prisma.user.findFirst({
      where: { isAdmin: true },
      select: { id: true, email: true, username: true },
    })

    if (adminUser && adminUser.id !== user.id) {
      const adminSessions = await prisma.session.findMany({
        where: {
          userId: adminUser.id,
          expiresAt: { gt: now },
        },
        select: {
          id: true,
          createdAt: true,
          expiresAt: true,
        },
      })

      console.log(`\n⚠️  Admin user (${adminUser.username}) has ${adminSessions.length} active sessions`)
      if (adminSessions.length > 0) {
        console.log('   If you see admin data, you might be using an admin session cookie')
        console.log('   Solution: Clear ALL cookies and log in again')
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  } catch (error) {
    console.error('Error checking sessions:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

const email = process.argv[2]
if (!email) {
  console.error('Usage: npx tsx scripts/check-user-sessions.ts <email>')
  process.exit(1)
}

checkUserSessions(email)
