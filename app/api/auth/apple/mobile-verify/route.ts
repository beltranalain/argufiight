import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createSessionWithoutCookie } from '@/lib/auth/session'
import * as jose from 'jose'

// Apple's public key endpoint
const APPLE_KEYS_URL = 'https://appleid.apple.com/auth/keys'

async function verifyAppleToken(identityToken: string) {
  // Fetch Apple's public keys
  const JWKS = jose.createRemoteJWKSet(new URL(APPLE_KEYS_URL))

  // Verify the JWT
  const { payload } = await jose.jwtVerify(identityToken, JWKS, {
    issuer: 'https://appleid.apple.com',
    audience: 'com.argufight.app', // Must match your bundle identifier
  })

  return payload
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { identityToken, fullName, email: clientEmail } = body

    if (!identityToken) {
      return NextResponse.json({ error: 'Missing identity token' }, { status: 400 })
    }

    // Verify the Apple identity token
    let payload
    try {
      payload = await verifyAppleToken(identityToken)
    } catch (err: any) {
      console.error('[Apple Auth] Token verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid identity token' }, { status: 401 })
    }

    const appleId = payload.sub as string
    const appleEmail = (payload.email as string)?.toLowerCase() || clientEmail?.toLowerCase()

    if (!appleId) {
      return NextResponse.json({ error: 'Invalid token: no subject' }, { status: 400 })
    }

    // Find user by Apple ID
    let user = await prisma.user.findUnique({
      where: { appleId },
    })

    // If no user by Apple ID, try by email
    if (!user && appleEmail) {
      user = await prisma.user.findUnique({
        where: { email: appleEmail },
      })
    }

    // Create new user if not found
    if (!user) {
      const crypto = require('crypto')
      const placeholderHash = crypto.randomBytes(32).toString('hex')

      // Build username from fullName or email
      let baseUsername = ''
      if (fullName?.givenName) {
        baseUsername = (fullName.givenName + (fullName.familyName || '')).replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
      } else if (appleEmail) {
        baseUsername = appleEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '')
      }
      if (!baseUsername) baseUsername = 'user'

      let username = baseUsername
      let counter = 1
      while (counter < 100 && await prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${counter}`
        counter++
      }
      if (counter >= 100) username = `user${Date.now()}`

      user = await prisma.user.create({
        data: {
          email: appleEmail || `apple_${appleId}@private.appleid.com`,
          username,
          appleId,
          appleEmail: appleEmail || null,
          appleAuthEnabled: true,
          passwordHash: placeholderHash,
          subscription: {
            create: { tier: 'FREE', status: 'ACTIVE' },
          },
          appealLimit: {
            create: { monthlyLimit: 4, currentCount: 0 },
          },
        },
      })

      console.log('[Apple Auth] New user created:', user.id)
    } else {
      // Link Apple ID to existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          appleId,
          appleEmail: appleEmail || user.appleEmail,
          appleAuthEnabled: true,
        },
      })
      console.log('[Apple Auth] Existing user linked:', user.id)
    }

    // Create session
    const { sessionJWT } = await createSessionWithoutCookie(user.id)

    return NextResponse.json({
      token: sessionJWT,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        eloRating: user.eloRating,
        isAdmin: user.isAdmin,
        coins: user.coins,
        isBanned: user.isBanned,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
      },
    })
  } catch (error: any) {
    console.error('[Apple Auth] Error:', error.message)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
