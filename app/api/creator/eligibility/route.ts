import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth/session'
import { getCreatorEligibility } from '@/lib/ads/config'

// GET /api/creator/eligibility - Get creator eligibility requirements
export async function GET(request: NextRequest) {
  try {
    const session = await verifySession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eligibility = await getCreatorEligibility()
    return NextResponse.json(eligibility)
  } catch (error: any) {
    console.error('Failed to fetch eligibility:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch eligibility' },
      { status: 500 }
    )
  }
}

