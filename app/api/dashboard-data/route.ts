import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

// Shared select shape for debate listings (matches /api/debates format)
const debateSelect = {
  id: true,
  topic: true,
  category: true,
  status: true,
  challengerId: true,
  opponentId: true,
  winnerId: true,
  endedAt: true,
  createdAt: true,
  verdictReached: true,
  verdictDate: true,
  challengeType: true,
  invitedUserIds: true,
  currentRound: true,
  totalRounds: true,
  roundDuration: true,
  roundDeadline: true,
  spectatorCount: true,
  challengerPosition: true,
  opponentPosition: true,
  isPrivate: true,
  shareToken: true,
  description: true,
  challenger: {
    select: { id: true, username: true, avatarUrl: true, eloRating: true },
  },
  opponent: {
    select: { id: true, username: true, avatarUrl: true, eloRating: true },
  },
  images: {
    select: { id: true, url: true, alt: true, caption: true, order: true },
    orderBy: { order: 'asc' as const },
  },
  statements: {
    select: { id: true, round: true, authorId: true },
  },
  tournamentMatch: {
    select: {
      id: true,
      tournament: {
        select: { id: true, name: true, format: true, currentRound: true, totalRounds: true },
      },
      round: { select: { roundNumber: true } },
    },
  },
  participants: {
    select: {
      id: true,
      userId: true,
      status: true,
      user: {
        select: { id: true, username: true, avatarUrl: true, eloRating: true },
      },
    },
  },
} as const

// GET /api/dashboard-data — single endpoint for all dashboard panel data
// Replaces ~12 separate API calls with 1
export async function GET() {
  try {
    const session = await verifySession()
    const userId = session ? getUserIdFromSession(session) : null

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Run ALL dashboard queries in parallel
    const [
      categories,
      activeDebates,
      userActiveDebates,
      waitingDebates,
      userWaitingDebates,
      recentDebates,
      leaderboardUsers,
      userRankData,
      userBelts,
      beltChallengesRaw,
      tournaments,
      navUnread,
      navSubscription,
      navUser,
      navBeltCount,
      yourTurnDebates,
    ] = await Promise.all([
      // 1. Categories
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, name: true, label: true, description: true, color: true, icon: true, sortOrder: true },
      }),

      // 2. Active debates (Live Battles - public only)
      prisma.debate.findMany({
        where: { status: 'ACTIVE', isPrivate: false },
        select: debateSelect,
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),

      // 3. User's active debates (My Battle)
      prisma.debate.findMany({
        where: {
          status: 'ACTIVE',
          OR: [{ challengerId: userId }, { opponentId: userId }],
        },
        select: debateSelect,
        orderBy: { createdAt: 'desc' },
      }),

      // 4. Waiting debates (Open Challenges - public)
      prisma.debate.findMany({
        where: { status: 'WAITING', isPrivate: false },
        select: debateSelect,
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),

      // 5. User's waiting debates (My Challenges)
      prisma.debate.findMany({
        where: {
          status: 'WAITING',
          OR: [{ challengerId: userId }, { opponentId: userId }],
        },
        select: debateSelect,
        orderBy: { createdAt: 'desc' },
      }),

      // 6. Recent debates (Profile panel - user's debates, all statuses)
      prisma.debate.findMany({
        where: {
          OR: [{ challengerId: userId }, { opponentId: userId }],
          status: { not: 'WAITING' },
        },
        select: debateSelect,
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // 7. Leaderboard top 3
      prisma.user.findMany({
        where: { isAdmin: false, isBanned: false },
        select: {
          id: true, username: true, avatarUrl: true, eloRating: true,
          debatesWon: true, debatesLost: true, debatesTied: true,
          totalDebates: true, totalScore: true, totalMaxScore: true,
        },
        orderBy: { eloRating: 'desc' },
        take: 3,
      }),

      // 8. User's rank
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true, username: true, avatarUrl: true, eloRating: true,
          debatesWon: true, debatesLost: true, debatesTied: true,
          totalDebates: true, totalScore: true, totalMaxScore: true,
        },
      }),

      // 9. User's belts
      prisma.belt.findMany({
        where: {
          currentHolderId: userId,
          status: { in: ['ACTIVE', 'MANDATORY', 'STAKED', 'GRACE_PERIOD'] },
        },
        include: {
          currentHolder: { select: { id: true, username: true, avatarUrl: true } },
        },
      }),

      // 10. Belt challenges (to user's belts + challenges made)
      Promise.all([
        prisma.beltChallenge.findMany({
          where: {
            belt: { currentHolderId: userId },
            status: { notIn: ['COMPLETED', 'DECLINED', 'EXPIRED'] },
          },
          include: {
            belt: true,
            challenger: { select: { id: true, username: true, avatarUrl: true } },
            beltHolder: { select: { id: true, username: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.beltChallenge.findMany({
          where: {
            challengerId: userId,
            status: { notIn: ['COMPLETED', 'DECLINED', 'EXPIRED'] },
          },
          include: {
            belt: true,
            challenger: { select: { id: true, username: true, avatarUrl: true } },
            beltHolder: { select: { id: true, username: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]),

      // 11. Active tournaments
      prisma.tournament.findMany({
        where: { status: { in: ['UPCOMING', 'REGISTRATION_OPEN', 'IN_PROGRESS'] } },
        orderBy: { startDate: 'asc' },
        take: 3,
      }).catch(() => []),

      // 12-15. Nav data queries
      prisma.notification.count({ where: { userId, read: false } }),
      prisma.userSubscription.findUnique({ where: { userId }, select: { tier: true } }),
      prisma.user.findUnique({ where: { id: userId }, select: { email: true, coins: true } }),
      prisma.belt.count({
        where: { currentHolderId: userId, status: { in: ['ACTIVE', 'MANDATORY', 'STAKED', 'GRACE_PERIOD'] } },
      }),

      // 16. Your-turn check: active debates where user hasn't submitted
      prisma.debate.findMany({
        where: {
          status: 'ACTIVE',
          OR: [{ challengerId: userId }, { opponentId: userId }],
        },
        select: { id: true, topic: true, currentRound: true, roundDeadline: true, statements: { select: { authorId: true, round: true } } },
      }),
    ])

    // Process belt challenges
    const [challengesToMyBelts, challengesMade] = beltChallengesRaw

    // Process leaderboard with computed fields
    const leaderboard = leaderboardUsers.map((u, i) => ({
      ...u,
      rank: i + 1,
      winRate: u.totalDebates > 0 ? Math.round((u.debatesWon / u.totalDebates) * 1000) / 10 : 0,
      overallScore: u.totalScore,
      overallScorePercent: u.totalMaxScore > 0 ? Math.round((u.totalScore / u.totalMaxScore) * 1000) / 10 : 0,
    }))

    // Process user rank
    let userRank = null
    if (userRankData && !leaderboard.some(u => u.id === userId)) {
      const rank = await prisma.user.count({
        where: { isAdmin: false, isBanned: false, eloRating: { gt: userRankData.eloRating } },
      })
      userRank = {
        ...userRankData,
        rank: rank + 1,
        winRate: userRankData.totalDebates > 0 ? Math.round((userRankData.debatesWon / userRankData.totalDebates) * 1000) / 10 : 0,
        overallScore: userRankData.totalScore,
        overallScorePercent: userRankData.totalMaxScore > 0 ? Math.round((userRankData.totalScore / userRankData.totalMaxScore) * 1000) / 10 : 0,
      }
    }

    // Process your-turn
    let yourTurn = null
    for (const debate of yourTurnDebates) {
      const submitted = debate.statements.some(
        (s: any) => s.authorId === userId && s.round === debate.currentRound
      )
      if (!submitted) {
        yourTurn = { debateId: debate.id, topic: debate.topic, round: debate.currentRound, deadline: debate.roundDeadline }
        break
      }
    }

    // Advertiser check
    let isAdvertiser = false
    if (navUser?.email) {
      const adv = await prisma.advertiser.findUnique({
        where: { contactEmail: navUser.email },
        select: { id: true },
      })
      isAdvertiser = !!adv
    }

    // Add hasNoStatements flag to debate arrays
    const addFlags = (debates: any[]) => debates.map(d => ({
      ...d,
      hasNoStatements: !d.statements || d.statements.length === 0,
    }))

    return NextResponse.json({
      categories: { categories },
      activeDebates: { debates: addFlags(activeDebates) },
      userActiveDebates: { debates: addFlags(userActiveDebates) },
      waitingDebates: { debates: addFlags(waitingDebates) },
      userWaitingDebates: { debates: addFlags(userWaitingDebates) },
      recentDebates: { debates: addFlags(recentDebates) },
      leaderboard: { leaderboard, userRank },
      belts: { currentBelts: userBelts, challengesToMyBelts, challengesMade },
      tournaments: { tournaments },
      nav: {
        unreadCount: navUnread,
        tier: navSubscription?.tier || 'FREE',
        isAdvertiser,
        beltCount: navBeltCount,
        coinBalance: navUser?.coins || 0,
      },
      yourTurn: yourTurn ? { hasTurn: true, ...yourTurn } : { hasTurn: false },
    })
  } catch (error) {
    console.error('[dashboard-data] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
