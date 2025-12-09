import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/auth/me - Get current authenticated user
 * Returns the current user's information if authenticated
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifySession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = getUserIdFromSession(session)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        isAdmin: true,
        isBanned: true,
        bannedUntil: true,
        eloRating: true,
        debatesWon: true,
        debatesLost: true,
        debatesTied: true,
        totalDebates: true,
        bio: true,
        googleAuthEnabled: true,
        totpEnabled: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error: any) {
    console.error('[GET /api/auth/me] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
