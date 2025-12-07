import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/leaderboard - Get ELO leaderboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Max 100 per page, default 50
    const skip = (page - 1) * limit
    const category = searchParams.get('category') // Optional: filter by category

    const where: any = {
      isAdmin: false, // Exclude admins/employees
      isBanned: false, // Exclude banned users
      totalDebates: {
        gte: 1, // At least 1 completed debate
      },
    }

    // Get total count for pagination
    const total = await prisma.user.count({ where })

    // Get top users by ELO rating
    const leaderboard = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        eloRating: true,
        debatesWon: true,
        debatesLost: true,
        debatesTied: true,
        totalDebates: true,
        totalScore: true,
        totalMaxScore: true,
      },
      orderBy: {
        eloRating: 'desc',
      },
      skip,
      take: limit,
    })

    // Calculate win rates, overall scores, and add rank
    const leaderboardWithRank = leaderboard.map((user, index) => {
      const winRate = user.totalDebates > 0
        ? ((user.debatesWon / user.totalDebates) * 100).toFixed(1)
        : '0.0'
      
      const overallScore = user.totalMaxScore > 0
        ? `${user.totalScore}/${user.totalMaxScore}`
        : '0/0'
      
      const overallScorePercent = user.totalMaxScore > 0
        ? ((user.totalScore / user.totalMaxScore) * 100).toFixed(1)
        : '0.0'

      return {
        rank: skip + index + 1, // Global rank based on pagination
        ...user,
        winRate: parseFloat(winRate),
        overallScore,
        overallScorePercent: parseFloat(overallScorePercent),
      }
    })

    return NextResponse.json({
      leaderboard: leaderboardWithRank,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}

