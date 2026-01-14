import { NextRequest, NextResponse } from 'next/server'
import { checkAndAdvanceExpiredRounds } from '@/lib/debates/round-advancement'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// This route should be called by a cron job (e.g., Vercel Cron)
// GET /api/cron/advance-debate-rounds - Check and advance all expired debate rounds
export async function GET(request: NextRequest) {
  // In a real application, you might want to secure this endpoint
  // e.g., by checking a secret token in the request headers
  // if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // }

  try {
    const result = await checkAndAdvanceExpiredRounds()
    return NextResponse.json({
      success: true,
      message: `Processed ${result.processed} debates.`,
      details: result.debates,
    })
  } catch (error: any) {
    console.error('Cron job failed to advance debate rounds:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to advance debate rounds' },
      { status: 500 }
    )
  }
}
