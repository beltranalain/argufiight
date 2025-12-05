import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

// GET /api/creator/earnings/detailed - Get detailed earnings data
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

    // Get all contracts
    const contracts = await prisma.adContract.findMany({
      where: { creatorId: userId },
      include: {
        advertiser: {
          select: {
            companyName: true,
          },
        },
        campaign: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate totals
    const completedContracts = contracts.filter((c) => c.status === 'COMPLETED' && c.payoutSent)
    const totalEarned = completedContracts.reduce(
      (sum, contract) => sum + Number(contract.creatorPayout),
      0
    )

    const pendingContracts = contracts.filter(
      (c) => c.status === 'ACTIVE' && !c.payoutSent
    )
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

    // This year's earnings
    const startOfYear = new Date()
    startOfYear.setMonth(0)
    startOfYear.setDate(1)
    startOfYear.setHours(0, 0, 0, 0)

    const thisYearContracts = completedContracts.filter(
      (contract) => contract.payoutDate && new Date(contract.payoutDate) >= startOfYear
    )
    const thisYear = thisYearContracts.reduce(
      (sum, contract) => sum + Number(contract.creatorPayout),
      0
    )

    // Monthly breakdown (last 12 months)
    const monthlyBreakdown: Record<string, number> = {}
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = month.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      monthlyBreakdown[monthKey] = 0
    }

    completedContracts.forEach((contract) => {
      if (contract.payoutDate) {
        const payoutDate = new Date(contract.payoutDate)
        const monthKey = payoutDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
        if (monthlyBreakdown[monthKey] !== undefined) {
          monthlyBreakdown[monthKey] += Number(contract.creatorPayout)
        }
      }
    })

    const monthlyBreakdownArray = Object.entries(monthlyBreakdown)
      .reverse()
      .map(([month, earnings]) => ({ month, earnings }))

    return NextResponse.json({
      totalEarned,
      pendingPayout,
      thisMonth,
      thisYear,
      contracts: contracts.map((contract) => ({
        id: contract.id,
        status: contract.status,
        creatorPayout: contract.creatorPayout,
        totalAmount: contract.totalAmount,
        payoutDate: contract.payoutDate,
        completedAt: contract.completedAt,
        advertiser: contract.advertiser,
        campaign: contract.campaign,
      })),
      monthlyBreakdown: monthlyBreakdownArray,
    })
  } catch (error: any) {
    console.error('Failed to fetch detailed earnings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch earnings' },
      { status: 500 }
    )
  }
}

