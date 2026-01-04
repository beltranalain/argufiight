/**
 * Get a session token from the database for a user
 * Usage: npx tsx scripts/get-session-from-db.ts <email>
 */

import { prisma } from '../lib/db/prisma'

async function getSessionToken(email: string) {
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

    // Find the most recent active session
    const now = new Date()
    const session = await prisma.session.findFirst({
      where: {
        userId: user.id,
        expiresAt: {
          gt: now, // Only active sessions
        },
      },
      select: {
        token: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!session) {
      console.log(`❌ No active sessions found for ${email}`)
      console.log(`\n💡 You need to log in first at http://localhost:3000`)
      return
    }

    console.log('\n✅ Found active session!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`User: ${user.username} (${user.email})`)
    console.log(`Session created: ${session.createdAt}`)
    console.log(`Session expires: ${session.expiresAt}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    // Check if session is expired (now was already declared above)
    const isExpired = session.expiresAt < now
    const expiresInMinutes = Math.round((session.expiresAt.getTime() - now.getTime()) / 1000 / 60)
    
    if (isExpired) {
      console.log('⚠️  WARNING: This session is EXPIRED!')
      console.log(`   Expired: ${expiresInMinutes} minutes ago`)
      console.log('   You need to log in again to create a new session')
      return
    }
    
    console.log(`✅ Session is valid (expires in ${expiresInMinutes} minutes)`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 Your session token:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(session.token)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    console.log('💻 Use it in PowerShell:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`$sessionToken = "${session.token}"`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  } catch (error) {
    console.error('Error getting session:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

const email = process.argv[2]
if (!email) {
  console.error('Usage: npx tsx scripts/get-session-from-db.ts <email>')
  console.error('\nExample:')
  console.error('  npx tsx scripts/get-session-from-db.ts kubancane@example.com')
  process.exit(1)
}

getSessionToken(email)
