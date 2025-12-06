import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

// GET /api/advertiser/me - Get current user's advertiser account
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

    // Get user's email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find advertiser by email
    const advertiser = await prisma.advertiser.findUnique({
      where: { contactEmail: user.email },
      select: {
        id: true,
        companyName: true,
        status: true,
        paymentReady: true,
        website: true,
        industry: true,
      },
    })

    if (!advertiser) {
      return NextResponse.json({ error: 'Advertiser account not found' }, { status: 404 })
    }

    // Enhanced security: Only APPROVED advertisers can access dashboard
    // SUSPENDED and BANNED advertisers are blocked
    if (advertiser.status !== 'APPROVED') {
      if (advertiser.status === 'SUSPENDED') {
        return NextResponse.json(
          { error: 'Your advertiser account has been suspended. Please contact support.' },
          { status: 403 }
        )
      }
      if (advertiser.status === 'BANNED') {
        return NextResponse.json(
          { error: 'Your advertiser account has been banned.' },
          { status: 403 }
        )
      }
      return NextResponse.json(
        { error: 'Your advertiser application is still pending approval.' },
        { status: 403 }
      )
    }

    return NextResponse.json({ advertiser })
  } catch (error: any) {
    console.error('Failed to fetch advertiser:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch advertiser' },
      { status: 500 }
    )
  }
}

