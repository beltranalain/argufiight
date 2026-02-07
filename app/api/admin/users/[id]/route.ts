import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getUserIdFromSession } from '@/lib/auth/session-utils'

export const dynamic = 'force-dynamic'

// GET /api/admin/users/[id] - Get a specific user's full profile (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession()
    const userId = getUserIdFromSession(session)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        bio: true,
        eloRating: true,
        debatesWon: true,
        debatesLost: true,
        debatesTied: true,
        totalDebates: true,
        isAdmin: true,
        isBanned: true,
        employeeRole: true,
        accessLevel: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate win rate (wins / total debates, not wins / (wins + losses))
    const winRate = user.totalDebates > 0
      ? Math.round((user.debatesWon / user.totalDebates) * 100)
      : 0

    // Return user with winRate, matching the modal's expected format
    return NextResponse.json({
      user: {
        ...user,
        winRate,
      },
    })
  } catch (error) {
    console.error('Failed to get user:', error)
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/users/[id] - Update user (suspend/unsuspend, ban/unban)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession()
    const userId = getUserIdFromSession(session)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { suspendDays, banReason } = body

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, isAdmin: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent suspending other admins
    if (user.isAdmin) {
      return NextResponse.json(
        { error: 'Cannot suspend admin users' },
        { status: 400 }
      )
    }

    // Calculate suspension end date
    let bannedUntil: Date | null = null
    if (suspendDays !== undefined && suspendDays !== null) {
      if (suspendDays === 0) {
        // Unsuspend - clear the suspension
        bannedUntil = null
      } else if (suspendDays > 0) {
        // Suspend for specified number of days
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + suspendDays)
        bannedUntil = endDate
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        bannedUntil: bannedUntil !== undefined ? bannedUntil : undefined,
        banReason: banReason !== undefined ? banReason : undefined,
      },
      select: {
        id: true,
        username: true,
        email: true,
        bannedUntil: true,
        banReason: true,
      },
    })

    const isSuspending = suspendDays !== undefined && suspendDays !== null && suspendDays > 0
    const message = isSuspending 
      ? `User suspended for ${suspendDays} day${suspendDays !== 1 ? 's' : ''}` 
      : 'User unsuspended successfully'

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message,
    })
  } catch (error) {
    console.error('Failed to update user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id] - Delete a user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[DELETE /api/admin/users/[id]] ===== DELETE REQUEST RECEIVED =====')
  console.log('[DELETE /api/admin/users/[id]] Request URL:', request.url)
  console.log('[DELETE /api/admin/users/[id]] Request method:', request.method)
  console.log('[DELETE /api/admin/users/[id]] Request headers:', Object.fromEntries(request.headers.entries()))
  try {
    const session = await verifySession()
    const userId = getUserIdFromSession(session)
    console.log('[DELETE /api/admin/users/[id]] Session verified, userId:', userId)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { id } = await params
    console.log('[DELETE /api/admin/users/[id]] Extracted ID from params:', id)
    console.log('[DELETE /api/admin/users/[id]] ID type:', typeof id)
    console.log('[DELETE /api/admin/users/[id]] ID length:', id?.length)

    // Prevent admin from deleting themselves (unless super admin - but still prevent for safety)
    if (id === userId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }
    
    // Check if current user is super admin
    const currentAdminUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })
    const isSuperAdmin = currentAdminUser?.email === 'admin@argufight.com'

    // Check if user exists
    console.log('[DELETE /api/admin/users/[id]] Looking up user with ID:', id)
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, email: true, isAdmin: true },
    })
    console.log('[DELETE /api/admin/users/[id]] User lookup result:', user ? `Found: ${user.username}` : 'NOT FOUND')

    if (!user) {
      console.log('[DELETE /api/admin/users/[id]] User not found - may have been already deleted')
      // Return 404 but with a message indicating the user may have been already deleted
      return NextResponse.json(
        { 
          error: 'User not found',
          message: 'This user may have already been deleted. Please refresh the page.',
          receivedId: id 
        },
        { status: 404 }
      )
    }

    // Only super admin can delete other admin users
    if (user.isAdmin && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'Only super admin can delete admin users' },
        { status: 403 }
      )
    }
    
    // Allow deleting admin users, but show a warning in the log
    if (user.isAdmin) {
      console.warn(`[ADMIN] Admin user being deleted: ${user.username} (${user.email}) by ${isSuperAdmin ? 'super admin' : 'admin'} ${userId}`)
    }

    // Manually delete related records that don't have cascade delete
    // TournamentParticipant and TournamentSubscription don't have onDelete: Cascade
    await prisma.tournamentParticipant.deleteMany({
      where: {
        userId: id,
      },
    })

    await prisma.tournamentSubscription.deleteMany({
      where: {
        userId: id,
      },
    })

    // Delete belt-related records (BeltChallenge doesn't have cascade delete on user relations)
    await prisma.beltChallenge.deleteMany({
      where: {
        OR: [
          { challengerId: id },
          { beltHolderId: id },
        ],
      },
    })

    // Delete belt history records
    await prisma.beltHistory.deleteMany({
      where: {
        OR: [
          { fromUserId: id },
          { toUserId: id },
        ],
      },
    })

    // Handle belts currently held by this user (set to VACANT)
    await prisma.belt.updateMany({
      where: {
        currentHolderId: id,
      },
      data: {
        currentHolderId: null,
        status: 'VACANT',
        acquiredAt: null,
      },
    })

    // Delete user (cascade will handle other related records)
    await prisma.user.delete({
      where: { id },
    })

    console.log(`[ADMIN] User deleted: ${user.username} (${id}) by admin ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    })
  } catch (error: any) {
    console.error('Failed to delete user:', error)
    // Return more detailed error message for debugging
    const errorMessage = error?.message || 'Failed to delete user'
    const errorCode = error?.code || 'UNKNOWN_ERROR'
    
    return NextResponse.json(
      { 
        error: 'Failed to delete user',
        details: errorMessage,
        code: errorCode,
      },
      { status: 500 }
    )
  }
}
