import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = getUserIdFromSession(session)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const offer = await prisma.offer.findUnique({
      where: { id },
    })

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    if (offer.creatorId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (offer.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Offer is not pending' },
        { status: 400 }
      )
    }

    await prisma.offer.update({
      where: { id: offer.id },
      data: {
        status: 'DECLINED',
        respondedAt: new Date(),
      },
    })

    // TODO: Send notification to advertiser

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to decline offer:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to decline offer' },
      { status: 500 }
    )
  }
}

