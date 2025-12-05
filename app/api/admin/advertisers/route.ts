import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

// GET /api/admin/advertisers?status=PENDING
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAdmin()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {}
    if (status) {
      where.status = status
    }

    const advertisers = await prisma.advertiser.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ advertisers })
  } catch (error: any) {
    console.error('Failed to fetch advertisers:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch advertisers' },
      { status: 500 }
    )
  }
}

