/**
 * Verify a JWT to test if AUTH_SECRET matches
 * Usage: npx tsx scripts/verify-jwt.ts <jwt>
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env file
config({ path: resolve(process.cwd(), '.env') })

import { jwtVerify } from 'jose'

const secretKey = process.env.AUTH_SECRET
if (!secretKey) {
  console.error('❌ AUTH_SECRET not found in environment variables!')
  process.exit(1)
}

const encodedKey = new TextEncoder().encode(secretKey)

async function verifyJWT(jwt: string) {
  try {
    const { payload } = await jwtVerify(jwt, encodedKey)
    console.log('✅ JWT is valid!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Payload:', JSON.stringify(payload, null, 2))
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    return true
  } catch (error: any) {
    console.error('❌ JWT verification failed!')
    console.error('   Error:', error.message)
    console.error('   This means AUTH_SECRET might not match')
    return false
  }
}

const jwt = process.argv[2]
if (!jwt) {
  console.error('Usage: npx tsx scripts/verify-jwt.ts <jwt>')
  process.exit(1)
}

verifyJWT(jwt)
