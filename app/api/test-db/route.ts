import { prisma } from '@/lib/db/prisma'
import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/session-utils'

// Admin-only endpoint — never expose database info publicly
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const userId = await verifyAdmin()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.$connect()
    const userCount = await prisma.user.count()

    return NextResponse.json({
      success: true,
      userCount,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}
