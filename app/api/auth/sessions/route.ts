import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'
import { getUserSessions } from '@/lib/auth/session'

// GET /api/auth/sessions - Get all active sessions for current user
export async function GET(request: NextRequest) {
  try {
    const session = await verifySession()
    const userId = getUserIdFromSession(session)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all active sessions for this user
    const sessions = await getUserSessions(userId)

    // Get user info for each session (they're all the same user, but we need basic info)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        isAdmin: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return sessions with user info
    const sessionsWithUser = sessions.map((s) => ({
      id: s.id,
      token: s.token,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
        isAdmin: user.isAdmin,
      },
    }))

    return NextResponse.json({ sessions: sessionsWithUser })
  } catch (error: any) {
    console.error('Failed to get sessions:', error)
    return NextResponse.json(
      { error: 'Failed to get sessions' },
      { status: 500 }
    )
  }
}

