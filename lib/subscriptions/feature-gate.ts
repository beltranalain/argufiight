import { NextResponse } from 'next/server'
import { canUseFeature, hasFeatureAccess } from './subscription-utils'
import { FEATURES } from './features'

/**
 * Middleware to require feature access
 * Throws error if user doesn't have access
 */
export async function requireFeature(
  userId: string,
  feature: string
): Promise<void> {
  const hasAccess = await hasFeatureAccess(userId, feature)
  if (!hasAccess) {
    throw new Error(`Feature "${feature}" requires a Pro subscription`)
  }
}

/**
 * Check feature access and return response if denied
 */
export async function checkFeatureAccess(
  userId: string,
  feature: string
): Promise<NextResponse | null> {
  const hasAccess = await hasFeatureAccess(userId, feature)
  if (!hasAccess) {
    return NextResponse.json(
      {
        error: 'This feature requires a Pro subscription',
        feature,
        upgradeRequired: true,
      },
      { status: 403 }
    )
  }
  return null
}

/**
 * Check feature usage limit and return response if exceeded
 */
export async function checkFeatureLimit(
  userId: string,
  feature: string
): Promise<NextResponse | null> {
  const canUse = await canUseFeature(userId, feature)
  if (!canUse.allowed) {
    return NextResponse.json(
      {
        error: canUse.reason || 'Feature limit exceeded',
        feature,
        currentUsage: canUse.currentUsage,
        limit: canUse.limit,
        upgradeRequired: canUse.reason?.includes('Pro subscription'),
      },
      { status: 403 }
    )
  }
  return null
}

