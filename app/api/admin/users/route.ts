import { NextRequest, NextResponse } from 'next/server'
import { verifySessionWithDb } from '@/lib/auth/session-verify'
import { prisma } from '@/lib/db/prisma'

// GET /api/admin/users - Get all users
export async function GET(request: NextRequest) {
  try {
    const session = await verifySessionWithDb()

    if (!session || !session.userId) {
      console.error('[API /admin/users] No session or userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      console.error('[API /admin/users] User is not admin:', session.userId)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    // Increase default limit to ensure all employees are visible
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200) // Max 200 per page, default 100
    const skip = (page - 1) * limit
    const search = searchParams.get('search')?.trim()

    const where: any = {}
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get total count for pagination
    const total = await prisma.user.count({ where })

    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        eloRating: true,
        totalDebates: true,
        debatesWon: true,
        debatesLost: true,
        debatesTied: true,
        isAdmin: true,
        isBanned: true,
        bannedUntil: true,
        employeeRole: true,
        accessLevel: true,
        isAI: true,
        aiPersonality: true,
        aiResponseDelay: true,
        aiPaused: true,
        googleId: true,
        createdAt: true,
        subscription: {
          select: {
            tier: true,
            status: true,
            billingCycle: true,
          },
        },
      },
    })

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

