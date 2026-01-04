import { NextRequest, NextResponse } from 'next/server'
import { verifySessionWithDb } from '@/lib/auth/session-verify'
import { prisma } from '@/lib/db/prisma'

// GET /api/admin/belts/settings - Get all belt settings
export async function GET() {
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

    const settings = await prisma.beltSettings.findMany({
      orderBy: { beltType: 'asc' },
    })

    return NextResponse.json({ settings })
  } catch (error: any) {
    console.error('Failed to fetch belt settings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch belt settings' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/belts/settings/[type] - Update belt settings
export async function PUT(request: NextRequest) {
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
    const { beltType, ...updates } = body

    if (!beltType) {
      return NextResponse.json(
        { error: 'Belt type is required' },
        { status: 400 }
      )
    }

    const settings = await prisma.beltSettings.update({
      where: { beltType },
      data: {
        ...updates,
        updatedBy: session.userId,
      },
    })

    return NextResponse.json({ settings })
  } catch (error: any) {
    console.error('Failed to update belt settings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update belt settings' },
      { status: 500 }
    )
  }
}
