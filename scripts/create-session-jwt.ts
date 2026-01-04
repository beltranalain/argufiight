/**
 * Create a JWT from a session token for testing
 * Usage: npx tsx scripts/create-session-jwt.ts <sessionToken>
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env file
config({ path: resolve(process.cwd(), '.env') })

import { SignJWT } from 'jose'

const secretKey = process.env.AUTH_SECRET
if (!secretKey) {
  console.error('❌ AUTH_SECRET not found in environment variables!')
  console.error('   Make sure .env file exists and contains AUTH_SECRET')
  process.exit(1)
}

console.log('🔑 Using AUTH_SECRET from .env (length:', secretKey.length, ')')
const encodedKey = new TextEncoder().encode(secretKey)

async function createSessionJWT(sessionToken: string) {
  try {
    // Get the actual session expiration from database
    const { prisma } = await import('../lib/db/prisma')
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      select: { expiresAt: true },
    })
    
    if (!session) {
      console.error('❌ Session not found in database!')
      console.error('   The session token might be invalid or expired')
      process.exit(1)
    }
    
    const now = new Date()
    if (session.expiresAt < now) {
      console.error('❌ Session is EXPIRED!')
      console.error(`   Expired at: ${session.expiresAt}`)
      console.error('   You need to log in again')
      process.exit(1)
    }
    
    // Use the actual session expiration time from database
    const expiresAt = session.expiresAt
    
    // Create JWT with session token
    const sessionJWT = await new SignJWT({ sessionToken })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresAt)
      .sign(encodedKey)
    
    await prisma.$disconnect()
    
    console.log('\n✅ Created session JWT!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Session Token:', sessionToken.substring(0, 20) + '...')
    console.log('Session Expires:', expiresAt)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    console.log('📋 Your session JWT (use this as cookie):')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(sessionJWT)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    console.log('💻 Use it in PowerShell:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`$sessionJWT = "${sessionJWT}"`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
  } catch (error: any) {
    console.error('Error creating JWT:', error)
    if (error.message) {
      console.error('   Details:', error.message)
    }
    process.exit(1)
  }
}

const sessionToken = process.argv[2]
if (!sessionToken) {
  console.error('Usage: npx tsx scripts/create-session-jwt.ts <sessionToken>')
  console.error('\nExample:')
  console.error('  npx tsx scripts/create-session-jwt.ts f4fc10930b5469ceeffb8600d8af62ef6ce10c14e1e4a13408f3377fe2d93ae0')
  process.exit(1)
}

createSessionJWT(sessionToken)
