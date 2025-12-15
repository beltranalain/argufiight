import { NextResponse } from 'next/server'
import { getFeatureFlags } from '@/lib/features'

// GET /api/features - Get all feature flags (public endpoint)
export async function GET() {
  try {
    const flags = await getFeatureFlags()
    return NextResponse.json(flags)
  } catch (error) {
    console.error('Failed to fetch feature flags:', error)
    // Return all enabled on error
    return NextResponse.json({
      FEATURE_LIKES_ENABLED: true,
      FEATURE_SAVES_ENABLED: true,
      FEATURE_SHARES_ENABLED: true,
      FEATURE_COMMENTS_ENABLED: true,
      FEATURE_FOLLOWS_ENABLED: true,
    })
  }
}






