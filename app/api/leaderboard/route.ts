import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/leaderboard - Get ELO leaderboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const category = searchParams.get('category') // Optional: filter by category

    // Get top users by ELO rating
    const leaderboard = await prisma.user.findMany({
      where: {
        isAdmin: false, // Exclude admins/employees
        isBanned: false, // Exclude banned users
        totalDebates: {
          gte: 1, // At least 1 completed debate
        },
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        eloRating: true,
        debatesWon: true,
        debatesLost: true,
        debatesTied: true,
        totalDebates: true,
      },
      orderBy: {
        eloRating: 'desc',
      },
      take: limit,
    })

    // Calculate win rates and add rank
    const leaderboardWithRank = leaderboard.map((user, index) => {
      const winRate = user.totalDebates > 0
        ? ((user.debatesWon / user.totalDebates) * 100).toFixed(1)
        : '0.0'

      return {
        rank: index + 1,
        ...user,
        winRate: parseFloat(winRate),
      }
    })

    return NextResponse.json({
      leaderboard: leaderboardWithRank,
      total: leaderboardWithRank.length,
    })
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}

