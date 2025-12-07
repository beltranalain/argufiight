import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { hashPassword } from '@/lib/auth/password'
import crypto from 'crypto'

// Store reset tokens in memory (in production, use Redis or database)
const resetTokens = new Map<string, { email: string; expiresAt: number }>()

// Clean up expired tokens every hour
setInterval(() => {
  const now = Date.now()
  for (const [token, data] of resetTokens.entries()) {
    if (data.expiresAt < now) {
      resetTokens.delete(token)
    }
  }
}, 60 * 60 * 1000)

// POST /api/auth/forgot-password - Request password reset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim()

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    // Don't reveal if user exists (security best practice)
    // Always return success message
    if (user) {
      // Generate reset token
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = Date.now() + 60 * 60 * 1000 // 1 hour

      // Store token
      resetTokens.set(token, { email: normalizedEmail, expiresAt })

      // In production, send email with reset link
      // For now, we'll return the token in development
      console.log(`[FORGOT-PASSWORD] Reset token for ${normalizedEmail}: ${token}`)
      console.log(`[FORGOT-PASSWORD] Reset link: http://localhost:3000/reset-password?token=${token}`)

      // TODO: Send email with reset link
      // await sendPasswordResetEmail(user.email, token)
    }

    // Always return success (don't reveal if user exists)
    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    })
  } catch (error) {
    console.error('[FORGOT-PASSWORD] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/auth/reset-password - Reset password with token
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword } = body

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      )
    }

    // Validate password
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check token
    const tokenData = resetTokens.get(token)
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Check if token expired
    if (tokenData.expiresAt < Date.now()) {
      resetTokens.delete(token)
      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: tokenData.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword)

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    })

    // Delete used token
    resetTokens.delete(token)

    console.log(`[RESET-PASSWORD] Password reset successful for: ${user.email}`)

    return NextResponse.json({
      message: 'Password has been reset successfully',
    })
  } catch (error) {
    console.error('[RESET-PASSWORD] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/auth/reset-password?token=xxx - Verify token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Check token
    const tokenData = resetTokens.get(token)
    if (!tokenData) {
      return NextResponse.json(
        { valid: false, error: 'Invalid token' },
        { status: 200 }
      )
    }

    // Check if token expired
    if (tokenData.expiresAt < Date.now()) {
      resetTokens.delete(token)
      return NextResponse.json(
        { valid: false, error: 'Token has expired' },
        { status: 200 }
      )
    }

    return NextResponse.json({
      valid: true,
      email: tokenData.email,
    })
  } catch (error) {
    console.error('[VERIFY-TOKEN] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


