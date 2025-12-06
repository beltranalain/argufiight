import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'
import { sendAdvertiserApprovalEmail } from '@/lib/email/advertiser-notifications'

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

    // Send approval email
    try {
      await sendAdvertiserApprovalEmail(
        advertiser.contactEmail,
        advertiser.contactName,
        advertiser.companyName
      )
    } catch (emailError) {
      console.error('Failed to send approval email (non-blocking):', emailError)
      // Don't fail the approval if email fails
    }

    return NextResponse.json({ success: true, advertiser })
  } catch (error: any) {
    console.error('Failed to approve advertiser:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to approve advertiser' },
      { status: 500 }
    )
  }
}

