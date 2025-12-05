import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'
import { prisma } from '@/lib/db/prisma'

// GET /api/creator/tax-info - Get creator tax info
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

    const taxInfo = await prisma.creatorTaxInfo.findUnique({
      where: { creatorId: userId },
    })

    return NextResponse.json({ taxInfo })
  } catch (error: any) {
    console.error('Failed to fetch tax info:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tax info' },
      { status: 500 }
    )
  }
}

