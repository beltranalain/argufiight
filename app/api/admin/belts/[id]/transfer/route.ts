/**
 * API Route: POST /api/admin/belts/[id]/transfer
 * Admin-only belt transfer
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifySessionWithDb } from '@/lib/auth/session-verify'
import { prisma } from '@/lib/db/prisma'
import { transferBelt } from '@/lib/belts/core'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await verifySessionWithDb()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { toUserId, reason, adminNotes } = body

    if (!toUserId) {
      return NextResponse.json({ error: 'toUserId is required' }, { status: 400 })
    }

    // Get current belt holder
    const belt = await prisma.belt.findUnique({
      where: { id },
      select: { currentHolderId: true },
    })

    if (!belt) {
      return NextResponse.json({ error: 'Belt not found' }, { status: 404 })
    }

    // Transfer belt - temporarily enable belt system for admin operations
    const originalFlag = process.env.ENABLE_BELT_SYSTEM
    if (originalFlag !== 'true') {
      process.env.ENABLE_BELT_SYSTEM = 'true'
    }
    
    let result
    try {
      result = await transferBelt(
        id,
        belt.currentHolderId,
        toUserId,
        reason || 'ADMIN_TRANSFER',
        {
          adminNotes: adminNotes || 'Admin transfer',
          transferredBy: session.userId,
        }
      )
    } finally {
      // Restore original flag value
      if (originalFlag !== 'true') {
        process.env.ENABLE_BELT_SYSTEM = originalFlag || ''
      }
    }

    return NextResponse.json({ success: true, belt: result.belt, history: result.history })
  } catch (error: any) {
    console.error('[API] Error transferring belt:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to transfer belt' },
      { status: 500 }
    )
  }
}
