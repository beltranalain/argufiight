import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

// GET /api/admin/debates - List debates with search/filter/pagination
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAdmin()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const skip = (page - 1) * limit
    const search = searchParams.get('search')?.trim()
    const status = searchParams.get('status')?.trim()

    const where: any = {}

    if (search) {
      where.OR = [
        { topic: { contains: search, mode: 'insensitive' } },
        { challenger: { username: { contains: search, mode: 'insensitive' } } },
        { opponent: { username: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (status) {
      where.status = status
    }

    const total = await prisma.debate.count({ where })

    const debates = await prisma.debate.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        topic: true,
        category: true,
        status: true,
        visibility: true,
        totalRounds: true,
        currentRound: true,
        speedMode: true,
        viewCount: true,
        createdAt: true,
        challenger: { select: { id: true, username: true, avatarUrl: true } },
        opponent: { select: { id: true, username: true, avatarUrl: true } },
      },
    })

    return NextResponse.json({
      debates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch debates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch debates' },
      { status: 500 }
    )
  }
}
