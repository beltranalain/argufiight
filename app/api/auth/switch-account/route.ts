import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

// POST /api/auth/switch-account - Switch to a different session
export async function POST(request: NextRequest) {
  try {
    const session = await verifySession()
    const userId = getUserIdFromSession(session)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { sessionToken } = body

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session token is required' },
        { status: 400 }
      )
    }

    // Verify the session token belongs to this user
    const targetSession = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            avatarUrl: true,
            isAdmin: true,
          },
        },
      },
    })

    if (!targetSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (targetSession.userId !== userId) {
      return NextResponse.json(
        { error: 'Session does not belong to you' },
        { status: 403 }
      )
    }

    if (targetSession.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Session has expired' },
        { status: 400 }
      )
    }

    // Create new JWT with the target session token
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET || 'your-secret-key')
    const sessionJWT = await new SignJWT({ sessionToken: targetSession.token })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret)

    // Set the new session cookie
    const cookieStore = await cookies()
    cookieStore.set('session', sessionJWT, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    return NextResponse.json({
      success: true,
      user: targetSession.user,
    })
  } catch (error: any) {
    console.error('Failed to switch account:', error)
    return NextResponse.json(
      { error: 'Failed to switch account' },
      { status: 500 }
    )
  }
}

