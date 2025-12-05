import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await verifyAdmin()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { reason } = body

    if (!reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      )
    }

    const advertiser = await prisma.advertiser.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        approvedBy: userId,
      },
    })

    // TODO: Send rejection email

    return NextResponse.json({ success: true, advertiser })
  } catch (error: any) {
    console.error('Failed to reject advertiser:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to reject advertiser' },
      { status: 500 }
    )
  }
}

