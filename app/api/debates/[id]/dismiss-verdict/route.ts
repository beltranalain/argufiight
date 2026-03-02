import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getSession } from '@/lib/auth/get-session'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const debate = await prisma.debate.findUnique({
      where: { id },
      select: { id: true, status: true, challengerId: true, opponentId: true },
    })

    if (!debate) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (debate.challengerId !== session.userId && debate.opponentId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (debate.status !== 'VERDICT_READY') {
      return NextResponse.json({ success: true }) // already dismissed
    }

    await prisma.debate.update({
      where: { id },
      data: { status: 'COMPLETED' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[dismiss-verdict]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
