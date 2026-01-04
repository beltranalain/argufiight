import { NextRequest, NextResponse } from 'next/server'
import { verifySessionWithDb } from '@/lib/auth/session-verify'
import { prisma } from '@/lib/db/prisma'
import { createBelt } from '@/lib/belts/core'

// POST /api/admin/belts - Create a new belt (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await verifySessionWithDb()
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { isAdmin: true },
    })

    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      type,
      category,
      coinValue = 0,
      designImageUrl,
      designColors,
      sponsorName,
      sponsorLogoUrl,
      initialHolderId, // Optional: assign belt to a user immediately
    } = body

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: name and type' },
        { status: 400 }
      )
    }

    // Validate belt type
    const validTypes = ['ROOKIE', 'CATEGORY', 'CHAMPIONSHIP', 'UNDEFEATED', 'TOURNAMENT']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid belt type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate category for CATEGORY type belts
    if (type === 'CATEGORY' && !category) {
      return NextResponse.json(
        { error: 'Category is required for CATEGORY type belts' },
        { status: 400 }
      )
    }

    // Create belt
    const belt = await createBelt({
      name,
      type: type as any,
      category: category || undefined,
      creationCost: coinValue || 0,
      designImageUrl: designImageUrl || undefined,
      designColors: designColors || undefined,
      sponsorName: sponsorName || undefined,
      sponsorLogoUrl: sponsorLogoUrl || undefined,
      createdBy: session.userId,
    })

    // If initialHolderId is provided, transfer belt to that user
    if (initialHolderId) {
      const { transferBelt } = await import('@/lib/belts/core')
      await transferBelt(
        belt.id,
        null,
        initialHolderId,
        'ADMIN_TRANSFER',
        {
          daysHeld: 0,
          defensesWon: 0,
          defensesLost: 0,
        }
      )
    }

    return NextResponse.json({ belt }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create belt:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create belt' },
      { status: 500 }
    )
  }
}
