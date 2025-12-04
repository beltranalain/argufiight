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

    // Verify password
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

    // Create session and get JWT token
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

