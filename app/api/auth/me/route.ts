import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getUserIdFromSession } from '@/lib/auth/session-utils'

export async function GET(request: NextRequest) {
  try {
    // Check for session override in query params (for multi-session support)
    const { searchParams } = new URL(request.url)
    const sessionOverride = searchParams.get('session')

    let session = await verifySession()

    // If session override is provided, try to use that session
    if (sessionOverride && !session) {
      try {
        const overrideSession = await prisma.session.findUnique({
          where: { token: sessionOverride },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                avatarUrl: true,
                bio: true,
                eloRating: true,
                debatesWon: true,
                debatesLost: true,
                debatesTied: true,
                totalDebates: true,
                totalScore: true,
                totalMaxScore: true,
                isAdmin: true,
                isBanned: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        })

        if (overrideSession && overrideSession.expiresAt > new Date()) {
          return NextResponse.json({ user: overrideSession.user })
        }
      } catch (error) {
        // Invalid override, fall through to normal session check
      }
    }

    if (!session) {
      return NextResponse.json(
        { user: null },
        { status: 401 }
      )
    }

    // Always fetch full user data with stats (session.user only has basic fields)
    const userId = getUserIdFromSession(session)
    if (!userId) {
      return NextResponse.json(
        { user: null },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        bio: true,
        eloRating: true,
        debatesWon: true,
        debatesLost: true,
        debatesTied: true,
        totalDebates: true,
        totalScore: true,
        totalMaxScore: true,
        isAdmin: true,
        isBanned: true,
        isCreator: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { user: null },
        { status: 401 }
      )
    }

    // Return user with both camelCase and snake_case for compatibility
    return NextResponse.json({ 
      user: {
        // camelCase (for web)
        id: user.id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        eloRating: user.eloRating,
        debatesWon: user.debatesWon,
        debatesLost: user.debatesLost,
        debatesTied: user.debatesTied,
        totalDebates: user.totalDebates,
        totalScore: user.totalScore,
        totalMaxScore: user.totalMaxScore,
        isAdmin: user.isAdmin,
        isBanned: user.isBanned,
        isCreator: user.isCreator,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        // snake_case (for mobile compatibility)
        avatar_url: user.avatarUrl || undefined,
        elo_rating: user.eloRating,
        debates_won: user.debatesWon,
        debates_lost: user.debatesLost,
        debates_tied: user.debatesTied,
        total_debates: user.totalDebates,
        total_score: user.totalScore,
        total_max_score: user.totalMaxScore,
        is_creator: user.isCreator,
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { user: null },
      { status: 500 }
    )
  }
}

