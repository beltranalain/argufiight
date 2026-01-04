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
    const { toUserId, toUsername, reason, adminNotes } = body

    if (!toUserId && !toUsername) {
      return NextResponse.json({ error: 'toUserId or toUsername is required' }, { status: 400 })
    }

    // Get current belt holder
    const belt = await prisma.belt.findUnique({
      where: { id },
      select: { currentHolderId: true },
    })

    if (!belt) {
      return NextResponse.json({ error: 'Belt not found' }, { status: 404 })
    }

    // Resolve user ID - accept either userId or username
    let finalToUserId: string | null = null
    if (toUserId) {
      // Check if it's a valid UUID (user ID) or a username
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(toUserId)
      if (isUUID) {
        finalToUserId = toUserId
      } else {
        // It's a username, look it up
        const user = await prisma.user.findUnique({
          where: { username: toUserId },
          select: { id: true },
        })
        if (!user) {
          return NextResponse.json({ error: `User not found: ${toUserId}` }, { status: 404 })
        }
        finalToUserId = user.id
      }
    } else if (toUsername) {
      const user = await prisma.user.findUnique({
        where: { username: toUsername },
        select: { id: true },
      })
      if (!user) {
        return NextResponse.json({ error: `User not found: ${toUsername}` }, { status: 404 })
      }
      finalToUserId = user.id
    }

    // Validate the target user exists
    if (finalToUserId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: finalToUserId },
        select: { id: true, username: true },
      })
      if (!targetUser) {
        return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
      }
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
        finalToUserId,
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
