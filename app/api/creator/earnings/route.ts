import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

// GET /api/creator/earnings - Get creator earnings stats
export async function GET(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = getUserIdFromSession(session)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a creator
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isCreator: true },
    })

    if (!user || !user.isCreator) {
      return NextResponse.json(
        { error: 'Creator mode not enabled' },
        { status: 403 }
      )
    }

    // Get all completed contracts
    const completedContracts = await prisma.adContract.findMany({
      where: {
        creatorId: userId,
        status: 'COMPLETED',
        payoutSent: true,
      },
      select: {
        creatorPayout: true,
        payoutDate: true,
      },
    })

    // Calculate totals
    const totalEarned = completedContracts.reduce(
      (sum, contract) => sum + Number(contract.creatorPayout),
      0
    )

    // Get pending contracts (active, not yet paid)
    const pendingContracts = await prisma.adContract.findMany({
      where: {
        creatorId: userId,
        status: 'ACTIVE',
        payoutSent: false,
      },
      select: {
        creatorPayout: true,
      },
    })

    const pendingPayout = pendingContracts.reduce(
      (sum, contract) => sum + Number(contract.creatorPayout),
      0
    )

    // This month's earnings
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const thisMonthContracts = completedContracts.filter(
      (contract) => contract.payoutDate && new Date(contract.payoutDate) >= startOfMonth
    )

    const thisMonth = thisMonthContracts.reduce(
      (sum, contract) => sum + Number(contract.creatorPayout),
      0
    )

    return NextResponse.json({
      totalEarned,
      pendingPayout,
      thisMonth,
    })
  } catch (error: any) {
    console.error('Failed to fetch earnings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch earnings' },
      { status: 500 }
    )
  }
}

