import { NextRequest, NextResponse } from 'next/server'
import { verifySessionWithDb } from '@/lib/auth/session-verify'
import { prisma } from '@/lib/db/prisma'

// PUT /api/admin/belts/[id] - Update a belt (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json()
    const {
      name,
      type,
      category,
      coinValue,
      designImageUrl,
      designColors,
      sponsorName,
      sponsorLogoUrl,
    } = body
    
    console.log('=== PUT /api/admin/belts/[id] ===')
    console.log('Belt ID:', id)
    console.log('Received designImageUrl:', designImageUrl)
    console.log('designImageUrl type:', typeof designImageUrl)
    console.log('designImageUrl after trim:', designImageUrl?.trim())

    // Validate belt type if provided
    if (type) {
      const validTypes = ['ROOKIE', 'CATEGORY', 'CHAMPIONSHIP', 'UNDEFEATED', 'TOURNAMENT']
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: `Invalid belt type. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (type !== undefined) updateData.type = type as any
    if (category !== undefined) updateData.category = category || null
    if (coinValue !== undefined) updateData.coinValue = parseInt(coinValue) || 0
    if (designImageUrl !== undefined) {
      const trimmedUrl = designImageUrl?.trim() || null
      updateData.designImageUrl = trimmedUrl
      console.log('Setting designImageUrl to:', trimmedUrl)
    }
    if (designColors !== undefined) updateData.designColors = designColors || null
    if (sponsorName !== undefined) updateData.sponsorName = sponsorName.trim() || null
    if (sponsorLogoUrl !== undefined) updateData.sponsorLogoUrl = sponsorLogoUrl.trim() || null
    
    console.log('Update data object:', updateData)
    console.log('designImageUrl in updateData:', updateData.designImageUrl)

    // Update belt
    const belt = await prisma.belt.update({
      where: { id },
      data: updateData,
    })
    
    console.log('Belt updated successfully')
    console.log('Updated belt designImageUrl:', belt.designImageUrl)
    console.log('Full updated belt:', belt)

    return NextResponse.json({ belt })
  } catch (error: any) {
    console.error('Failed to update belt:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update belt' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/belts/[id] - Delete a belt (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Check if belt exists
    const belt = await prisma.belt.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        currentHolderId: true,
        status: true,
        isStaked: true,
      },
    })

    if (!belt) {
      return NextResponse.json({ error: 'Belt not found' }, { status: 404 })
    }

    // Check if belt can be deleted (cannot delete if staked)
    if (belt.isStaked) {
      return NextResponse.json(
        { error: 'Cannot delete belt that is currently staked in a debate or tournament.' },
        { status: 400 }
      )
    }

    // Check for pending challenges - cancel them automatically
    const pendingChallenges = await prisma.beltChallenge.findMany({
      where: {
        beltId: id,
        status: 'PENDING',
      },
    })

    if (pendingChallenges.length > 0) {
      // Cancel all pending challenges
      await prisma.beltChallenge.updateMany({
        where: {
          beltId: id,
          status: 'PENDING',
        },
        data: {
          status: 'CANCELLED',
        },
      })
      console.log(`[API /admin/belts/[id]] Cancelled ${pendingChallenges.length} pending challenge(s) before deletion`)
    }

    // If belt has a holder, clear it first (belt will be deleted anyway, but this ensures clean state)
    if (belt.currentHolderId) {
      await prisma.belt.update({
        where: { id },
        data: {
          currentHolderId: null,
        },
      })
      console.log(`[API /admin/belts/[id]] Cleared holder before deletion`)
    }

    // Delete belt history first (cascade should handle this, but being explicit)
    await prisma.beltHistory.deleteMany({
      where: { beltId: id },
    })

    // Delete belt challenges (all statuses)
    await prisma.beltChallenge.deleteMany({
      where: { beltId: id },
    })

    // Delete the belt
    await prisma.belt.delete({
      where: { id },
    })

    console.log(`[API /admin/belts/[id]] Belt deleted: ${belt.name} (${id})`)

    return NextResponse.json({ 
      success: true, 
      message: `Belt "${belt.name}" deleted successfully` 
    })
  } catch (error: any) {
    console.error('[API /admin/belts/[id]] Error deleting belt:', error)
    console.error('[API /admin/belts/[id]] Error stack:', error?.stack)
    return NextResponse.json(
      { error: error.message || 'Failed to delete belt' },
      { status: 500 }
    )
  }
}
