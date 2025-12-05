import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

interface TickerUpdate {
  id: string
  type: 'BIG_BATTLE' | 'HIGH_VIEWS' | 'MAJOR_UPSET' | 'NEW_VERDICT' | 'STREAK' | 'MILESTONE'
  title: string
  message: string
  debateId: string | null
  priority: 'high' | 'medium' | 'low'
  createdAt: string
}

export async function GET(request: NextRequest) {
  try {
    const updates: TickerUpdate[] = []
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // 1. BIG BATTLES - High ELO matchups (both players ELO > 1500 or combined > 3000)
    const bigBattles = await prisma.debate.findMany({
      where: {
        status: 'ACTIVE',
        createdAt: {
          gte: oneDayAgo,
        },
        challenger: {
          eloRating: { gte: 1500 },
        },
        opponent: {
          eloRating: { gte: 1500 },
        },
      },
      select: {
        id: true,
        topic: true,
        createdAt: true,
        challenger: {
          select: {
            username: true,
            eloRating: true,
          },
        },
        opponent: {
          select: {
            username: true,
            eloRating: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    })

    for (const debate of bigBattles) {
      if (!debate.challenger || !debate.opponent) continue
      const combinedElo = debate.challenger.eloRating + debate.opponent.eloRating
      updates.push({
        id: `big-battle-${debate.id}`,
        type: 'BIG_BATTLE',
        title: '🔥 BIG BATTLE',
        message: `${debate.challenger.username} (${debate.challenger.eloRating}) vs ${debate.opponent.username} (${debate.opponent.eloRating}) - ${debate.topic.substring(0, 50)}${debate.topic.length > 50 ? '...' : ''}`,
        debateId: debate.id,
        priority: combinedElo > 3500 ? 'high' : 'medium',
        createdAt: debate.createdAt.toISOString(),
      })
    }

    // 2. HIGH VIEWS - Debates with high view counts (viewCount > 50)
    const highViewDebates = await prisma.debate.findMany({
      where: {
        viewCount: { gte: 50 },
        createdAt: {
          gte: oneDayAgo,
        },
      },
      select: {
        id: true,
        topic: true,
        viewCount: true,
        createdAt: true,
        challenger: {
          select: {
            username: true,
          },
        },
        opponent: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        viewCount: 'desc',
      },
      take: 5,
    })

    for (const debate of highViewDebates) {
      if (!debate.challenger || !debate.opponent) continue
      updates.push({
        id: `high-views-${debate.id}`,
        type: 'HIGH_VIEWS',
        title: '👁️ TRENDING',
        message: `${debate.challenger.username} vs ${debate.opponent.username} - ${debate.viewCount} views • ${debate.topic.substring(0, 40)}${debate.topic.length > 40 ? '...' : ''}`,
        debateId: debate.id,
        priority: debate.viewCount > 100 ? 'high' : 'medium',
        createdAt: debate.createdAt.toISOString(),
      })
    }

    // 3. MAJOR UPSETS - Low ELO beating high ELO (difference > 200 points)
    const recentCompleted = await prisma.debate.findMany({
      where: {
        status: 'COMPLETED',
        endedAt: {
          gte: oneDayAgo,
        },
        challengerEloChange: { not: null },
        opponentEloChange: { not: null },
      },
      select: {
        id: true,
        topic: true,
        endedAt: true,
        challenger: {
          select: {
            username: true,
            eloRating: true,
          },
        },
        opponent: {
          select: {
            username: true,
            eloRating: true,
          },
        },
        challengerEloChange: true,
        opponentEloChange: true,
        verdicts: {
          where: {
            isFinal: true,
          },
          select: {
            winnerId: true,
          },
          take: 1,
        },
      },
      orderBy: {
        endedAt: 'desc',
      },
      take: 10,
    })

    for (const debate of recentCompleted) {
      if (debate.verdicts.length === 0) continue
      if (!debate.challenger || !debate.opponent) continue
      
      const winnerId = debate.verdicts[0].winnerId
      const challengerElo = debate.challenger.eloRating - (debate.challengerEloChange || 0)
      const opponentElo = debate.opponent.eloRating - (debate.opponentEloChange || 0)
      const eloDiff = Math.abs(challengerElo - opponentElo)
      
      if (eloDiff > 200) {
        const winner = winnerId === debate.challenger.id ? debate.challenger : debate.opponent
        const loser = winnerId === debate.challenger.id ? debate.opponent : debate.challenger
        const winnerElo = winnerId === debate.challenger.id ? challengerElo : opponentElo
        const loserElo = winnerId === debate.challenger.id ? opponentElo : challengerElo
        
        if (winnerElo < loserElo) {
          // Upset: lower ELO won
          updates.push({
            id: `upset-${debate.id}`,
            type: 'MAJOR_UPSET',
            title: '⚡ MAJOR UPSET',
            message: `${winner.username} (${Math.round(winnerElo)}) defeated ${loser.username} (${Math.round(loserElo)}) • ${debate.topic.substring(0, 40)}${debate.topic.length > 40 ? '...' : ''}`,
            debateId: debate.id,
            priority: eloDiff > 300 ? 'high' : 'medium',
            createdAt: debate.endedAt?.toISOString() || debate.createdAt.toISOString(),
          })
        }
      }
    }

    // 4. NEW VERDICTS - Recently completed debates with verdicts
    const newVerdicts = await prisma.debate.findMany({
      where: {
        status: 'COMPLETED',
        endedAt: {
          gte: oneHourAgo,
        },
      },
      select: {
        id: true,
        topic: true,
        endedAt: true,
        challenger: {
          select: {
            username: true,
          },
        },
        opponent: {
          select: {
            username: true,
          },
        },
        verdicts: {
          where: {
            isFinal: true,
          },
          select: {
            winnerId: true,
          },
          take: 1,
        },
      },
      orderBy: {
        endedAt: 'desc',
      },
      take: 5,
    })

    for (const debate of newVerdicts) {
      if (debate.verdicts.length === 0) continue
      if (!debate.challenger || !debate.opponent) continue
      
      const winnerId = debate.verdicts[0].winnerId
      const winner = winnerId === debate.challenger.id ? debate.challenger : debate.opponent
      
      updates.push({
        id: `verdict-${debate.id}`,
        type: 'NEW_VERDICT',
        title: '⚖️ VERDICT',
        message: `${winner.username} won "${debate.topic.substring(0, 45)}${debate.topic.length > 45 ? '...' : ''}"`,
        debateId: debate.id,
        priority: 'medium',
        createdAt: debate.endedAt?.toISOString() || debate.createdAt.toISOString(),
      })
    }

    // 5. STREAKS - Users on winning streaks (3+ wins in a row)
    // First, get top users who might be on streaks
    const potentialStreakUsers = await prisma.user.findMany({
      where: {
        isAdmin: false,
        isBanned: false,
        debatesWon: { gte: 3 },
        totalDebates: { gte: 3 },
      },
      select: {
        id: true,
        username: true,
        debatesWon: true,
        totalDebates: true,
        eloRating: true,
      },
      orderBy: {
        eloRating: 'desc',
      },
      take: 20,
    })

    // Get all recent completed debates for these users in one query
    const userIds = potentialStreakUsers.map(u => u.id)
    const allRecentDebates = await prisma.debate.findMany({
      where: {
        status: 'COMPLETED',
        OR: [
          { challengerId: { in: userIds } },
          { opponentId: { in: userIds } },
        ],
        endedAt: {
          gte: oneDayAgo,
        },
      },
      select: {
        id: true,
        challengerId: true,
        opponentId: true,
        endedAt: true,
        verdicts: {
          where: {
            isFinal: true,
          },
          select: {
            winnerId: true,
          },
          take: 1,
        },
      },
      orderBy: {
        endedAt: 'desc',
      },
    })

    // Group debates by user and calculate streaks
    const userDebates = new Map<string, typeof allRecentDebates>()
    for (const debate of allRecentDebates) {
      if (debate.verdicts.length === 0) continue
      
      const winnerId = debate.verdicts[0].winnerId
      if (userIds.includes(winnerId)) {
        if (!userDebates.has(winnerId)) {
          userDebates.set(winnerId, [])
        }
        userDebates.get(winnerId)!.push(debate)
      }
    }

    // Check for streaks
    for (const user of potentialStreakUsers) {
      const userRecentDebates = userDebates.get(user.id) || []
      if (userRecentDebates.length < 3) continue

      // Sort by endedAt desc and check consecutive wins
      userRecentDebates.sort((a, b) => 
        (b.endedAt?.getTime() || 0) - (a.endedAt?.getTime() || 0)
      )

      let streakCount = 0
      for (const debate of userRecentDebates) {
        if (debate.verdicts.length > 0 && debate.verdicts[0].winnerId === user.id) {
          streakCount++
        } else {
          break
        }
      }

      if (streakCount >= 3) {
        updates.push({
          id: `streak-${user.id}-${Date.now()}`,
          type: 'STREAK',
          title: '🔥 HOT STREAK',
          message: `${user.username} is on a ${streakCount}-win streak! (ELO: ${user.eloRating})`,
          debateId: null,
          priority: streakCount >= 5 ? 'high' : 'medium',
          createdAt: new Date().toISOString(),
        })
      }
    }

    // 6. MILESTONES - Users reaching ELO milestones (1500, 1600, 1700, etc.)
    const milestoneUsers = await prisma.user.findMany({
      where: {
        isAdmin: false,
        isBanned: false,
        eloRating: {
          gte: 1500,
        },
        updatedAt: {
          gte: oneHourAgo,
        },
      },
      select: {
        id: true,
        username: true,
        eloRating: true,
        updatedAt: true,
      },
      orderBy: {
        eloRating: 'desc',
      },
      take: 5,
    })

    for (const user of milestoneUsers) {
      const elo = Math.floor(user.eloRating)
      // Check if it's a milestone (1500, 1600, 1700, etc.)
      if (elo % 100 === 0 && elo >= 1500) {
        updates.push({
          id: `milestone-${user.id}-${elo}`,
          type: 'MILESTONE',
          title: '🏆 MILESTONE',
          message: `${user.username} reached ${elo} ELO!`,
          debateId: null,
          priority: elo >= 2000 ? 'high' : 'medium',
          createdAt: user.updatedAt.toISOString(),
        })
      }
    }

    // Sort by priority and recency
    updates.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    // Return top 20 updates
    return NextResponse.json({
      updates: updates.slice(0, 20),
      total: updates.length,
    })
  } catch (error) {
    console.error('Failed to fetch ticker updates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ticker updates', updates: [] },
      { status: 500 }
    )
  }
}

