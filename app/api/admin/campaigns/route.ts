import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

// GET /api/admin/campaigns?type=PLATFORM_ADS&status=PENDING_REVIEW
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAdmin()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    const where: any = {}
    if (type) {
      where.type = type
    }
    if (status) {
      where.status = status
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        advertiser: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ campaigns })
  } catch (error: any) {
    console.error('Failed to fetch campaigns:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

