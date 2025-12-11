import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

// GET /api/admin/boards - Get all boards
export async function GET() {
  try {
    const userId = await verifyAdmin()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const boards = await prisma.board.findMany({
      where: { isArchived: false },
      include: {
        lists: {
          where: { isArchived: false },
          include: {
            cards: {
              where: { isArchived: false },
              include: {
                labels: true,
              },
              orderBy: { position: 'asc' },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ boards })
  } catch (error) {
    console.error('Failed to fetch boards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch boards' },
      { status: 500 }
    )
  }
}

// POST /api/admin/boards - Create a new board
export async function POST(request: Request) {
  try {
    const userId = await verifyAdmin()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, color } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Board name is required' },
        { status: 400 }
      )
    }

    const board = await prisma.board.create({
      data: {
        name,
        description: description || null,
        color: color || '#0079bf',
      },
      include: {
        lists: {
          include: {
            cards: {
              include: {
                labels: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ board })
  } catch (error: any) {
    console.error('Failed to create board:', error)
    return NextResponse.json(
      { error: 'Failed to create board' },
      { status: 500 }
    )
  }
}

