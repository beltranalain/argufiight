/**
 * Script to check which user a session token belongs to
 * Usage: npx tsx scripts/check-session-token.ts <sessionToken>
 * 
 * To get the session token from browser:
 * 1. Open DevTools → Application → Cookies
 * 2. Find the 'session' cookie
 * 3. Copy its value (it's a JWT)
 * 4. Decode it at https://jwt.io to get the sessionToken
 * 5. Or use this script with the full JWT (it will decode it)
 */

import { prisma } from '../lib/db/prisma'
import { jwtVerify } from 'jose'

const secretKey = process.env.AUTH_SECRET || 'your-secret-key-change-in-production'
const encodedKey = new TextEncoder().encode(secretKey)

async function checkSessionToken(tokenOrJWT: string) {
  try {
    let sessionToken: string

    // Check if it's a JWT (starts with eyJ) or a raw session token
    if (tokenOrJWT.startsWith('eyJ')) {
      // It's a JWT, decode it
      try {
        const { payload } = await jwtVerify(tokenOrJWT, encodedKey)
        sessionToken = (payload as { sessionToken: string }).sessionToken
        console.log('✅ Decoded JWT, session token:', sessionToken.substring(0, 20) + '...')
      } catch (error) {
        console.error('❌ Failed to decode JWT:', error)
        return
      }
    } else {
      // It's a raw session token
      sessionToken = tokenOrJWT
    }

    // Look up session in database
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            isAdmin: true,
          },
        },
      },
    })

    if (!session) {
      console.log('\n❌ Session not found in database')
      console.log('   This session was likely invalidated or expired')
      return
    }

    const now = new Date()
    const isExpired = session.expiresAt < now

    console.log('\n📊 Session Information:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Session ID:  ${session.id}`)
    console.log(`Created:     ${session.createdAt}`)
    console.log(`Expires:     ${session.expiresAt}`)
    console.log(`Status:      ${isExpired ? '❌ EXPIRED' : '✅ ACTIVE'}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log('👤 User Information:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`ID:       ${session.user.id}`)
    console.log(`Email:    ${session.user.email}`)
    console.log(`Username: ${session.user.username}`)
    console.log(`isAdmin:  ${session.user.isAdmin}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    if (session.user.isAdmin) {
      console.log('⚠️  WARNING: This session belongs to an ADMIN user!')
    }

    if (isExpired) {
      console.log('⚠️  This session is expired and should be deleted')
    }
  } catch (error) {
    console.error('Error checking session:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

const tokenOrJWT = process.argv[2]
if (!tokenOrJWT) {
  console.error('Usage: npx tsx scripts/check-session-token.ts <sessionTokenOrJWT>')
  console.error('\nTo get the session token:')
  console.error('1. Open browser DevTools → Application → Cookies')
  console.error('2. Find the "session" cookie')
  console.error('3. Copy its value (it\'s a JWT)')
  console.error('4. Paste it here (or decode at jwt.io to get sessionToken)')
  process.exit(1)
}

checkSessionToken(tokenOrJWT)
