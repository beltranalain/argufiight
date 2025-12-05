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

    const advertiser = await prisma.advertiser.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: userId,
      },
    })

    // TODO: Send approval email

    return NextResponse.json({ success: true, advertiser })
  } catch (error: any) {
    console.error('Failed to approve advertiser:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to approve advertiser' },
      { status: 500 }
    )
  }
}

