import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

// GET /api/users/search - Search for users
export async function GET(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()

    if (!query || query.length < 2) {
      return NextResponse.json([])
    }

    // Search users by username (SQLite doesn't support case-insensitive, so we'll filter in memory)
    const allUsers = await prisma.user.findMany({
      where: {
        isBanned: false,
        // Exclude the current user
        id: {
          not: session.userId,
        },
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        eloRating: true,
      },
    })

    // Filter by username (case-insensitive) and sort by ELO
    const filteredUsers = allUsers
      .filter(user => user.username.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b.eloRating - a.eloRating)
      .slice(0, 10)

    return NextResponse.json(filteredUsers)
  } catch (error) {
    console.error('User search error:', error)
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    )
  }
}

