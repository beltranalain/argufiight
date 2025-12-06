import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyPassword } from '@/lib/auth/password'
import { createSession } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim()
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
        googleAuthEnabled: true,
        isAdmin: true,
        isBanned: true,
        bannedUntil: true,
        avatarUrl: true,
        bio: true,
        eloRating: true,
        debatesWon: true,
        debatesLost: true,
        debatesTied: true,
        totalDebates: true,
        totpEnabled: true,
      },
    })

    if (!user) {
      console.log(`[LOGIN] User not found for email: ${normalizedEmail}`)
      // Don't reveal if user exists or not (security best practice)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Note: We allow suspended users to log in, they just can't debate
    // Only check isBanned (permanent ban), not bannedUntil (temporary suspension)

    // Check if user has Google OAuth enabled (no password)
    if (user.googleAuthEnabled && !user.passwordHash) {
      return NextResponse.json(
        { error: 'This account uses Google authentication. Please sign in with Google.' },
        { status: 401 }
      )
    }

    // Verify password
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    let isValid = false
    try {
      isValid = await verifyPassword(password, user.passwordHash)
    } catch (error) {
      console.error('[LOGIN] Password verification error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    if (!isValid) {
      console.log(`[LOGIN] Invalid password for user: ${user.email}`)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if user is employee or advertiser (requires 2FA)
    const isEmployee = user.isAdmin
    let isAdvertiser = false
    let requires2FA = false

    if (isEmployee) {
      requires2FA = true
    } else {
      const advertiser = await prisma.advertiser.findUnique({
        where: { contactEmail: user.email },
        select: { status: true },
      })
      isAdvertiser = advertiser?.status === 'APPROVED'
      if (isAdvertiser) {
        requires2FA = true
      }
    }

    // If 2FA is required but not set up, create a temporary session for setup
    if (requires2FA && !user.totpEnabled) {
      // Create temporary session for 2FA setup
      const tempSessionJWT = await createSession(user.id)
      return NextResponse.json({
        requires2FASetup: true,
        token: tempSessionJWT,
        userId: user.id,
      })
    }

    // If 2FA is enabled, require verification before creating full session
    if (requires2FA && user.totpEnabled) {
      // Create temporary session that will be upgraded after 2FA verification
      const tempSessionJWT = await createSession(user.id)
      return NextResponse.json({
        requires2FA: true,
        token: tempSessionJWT,
        userId: user.id,
      })
    }

    // No 2FA required, create full session
    const sessionJWT = await createSession(user.id)
    console.log(`Login successful for user: ${user.email}`)

    // Return user (without password) with token for mobile apps
    const { passwordHash, ...userWithoutPassword } = user

    // Transform user object to snake_case for mobile compatibility
    const mobileUser = {
      id: userWithoutPassword.id,
      email: userWithoutPassword.email,
      username: userWithoutPassword.username,
      avatar_url: userWithoutPassword.avatarUrl || undefined,
      bio: userWithoutPassword.bio || undefined,
      elo_rating: userWithoutPassword.eloRating,
      debates_won: userWithoutPassword.debatesWon,
      debates_lost: userWithoutPassword.debatesLost,
      debates_tied: userWithoutPassword.debatesTied,
      total_debates: userWithoutPassword.totalDebates,
      isAdmin: userWithoutPassword.isAdmin, // Include isAdmin for web app
    }

    return NextResponse.json({
      token: sessionJWT, // Return JWT token for mobile apps
      user: mobileUser,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

