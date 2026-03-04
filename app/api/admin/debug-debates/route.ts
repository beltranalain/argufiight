import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifySession } from '@/lib/auth/session'
import { getUserIdFromSession } from '@/lib/auth/session-utils'

export const dynamic = 'force-dynamic'

export async function GET() {
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
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    // Get ALL active/waiting debates with their privacy fields
    const activeDebates = await prisma.debate.findMany({
      where: {
        status: { in: ['ACTIVE', 'WAITING'] },
      },
      select: {
        id: true,
        topic: true,
        status: true,
        isPrivate: true,
        visibility: true,
        challengeType: true,
        isOnboardingDebate: true,
        createdAt: true,
        challenger: { select: { username: true } },
        opponent: { select: { username: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    // Count by visibility/privacy combos
    const counts = await Promise.all([
      prisma.debate.count({ where: { status: { in: ['ACTIVE', 'WAITING'] } } }),
      prisma.debate.count({ where: { status: { in: ['ACTIVE', 'WAITING'] }, isPrivate: false } }),
      prisma.debate.count({ where: { status: { in: ['ACTIVE', 'WAITING'] }, isPrivate: true } }),
      prisma.debate.count({ where: { status: { in: ['ACTIVE', 'WAITING'] }, visibility: 'PUBLIC' } }),
      prisma.debate.count({ where: { status: { in: ['ACTIVE', 'WAITING'] }, visibility: 'PRIVATE' } }),
    ])

    return NextResponse.json({
      summary: {
        totalActiveWaiting: counts[0],
        isPrivateFalse: counts[1],
        isPrivateTrue: counts[2],
        visibilityPublic: counts[3],
        visibilityPrivate: counts[4],
      },
      debates: activeDebates,
    })
  } catch (error: any) {
    console.error('[Debug Debates]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
