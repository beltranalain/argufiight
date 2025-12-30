// Feature flags utility
// Checks admin settings to determine if features are enabled

import { prisma } from '@/lib/db/prisma'

const FEATURE_KEYS = {
  LIKES: 'FEATURE_LIKES_ENABLED',
  SAVES: 'FEATURE_SAVES_ENABLED',
  SHARES: 'FEATURE_SHARES_ENABLED',
  COMMENTS: 'FEATURE_COMMENTS_ENABLED',
  FOLLOWS: 'FEATURE_FOLLOWS_ENABLED',
} as const

// Default values (all enabled by default)
const DEFAULT_FEATURES = {
  [FEATURE_KEYS.LIKES]: 'true',
  [FEATURE_KEYS.SAVES]: 'true',
  [FEATURE_KEYS.SHARES]: 'true',
  [FEATURE_KEYS.COMMENTS]: 'true',
  [FEATURE_KEYS.FOLLOWS]: 'true',
}

// Cache for feature flags (refresh every 5 minutes)
let featureCache: Record<string, boolean> | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function getFeatureFlags(): Promise<Record<string, boolean>> {
  const now = Date.now()
  
  // Return cached if still valid
  if (featureCache && (now - cacheTimestamp) < CACHE_TTL) {
    return featureCache
  }

  try {
    const settings = await prisma.adminSetting.findMany({
      where: {
        key: {
          in: Object.values(FEATURE_KEYS),
        },
      },
    })

    const flags: Record<string, boolean> = {}
    
    // Check each feature
    for (const key of Object.values(FEATURE_KEYS)) {
      const setting = settings.find(s => s.key === key)
      const value = setting?.value || DEFAULT_FEATURES[key] || 'true'
      flags[key] = value.toLowerCase() === 'true'
    }

    // Update cache
    featureCache = flags
    cacheTimestamp = now

    return flags
  } catch (error) {
    console.error('Failed to fetch feature flags:', error)
    // Return defaults on error
    return Object.fromEntries(
      Object.values(FEATURE_KEYS).map(key => [key, true])
    )
  }
}

export async function isFeatureEnabled(feature: keyof typeof FEATURE_KEYS): Promise<boolean> {
  const flags = await getFeatureFlags()
  return flags[FEATURE_KEYS[feature]] ?? true
}

// Client-side hook for checking features
export function useFeatureFlags() {
  // This would be used in client components
  // For now, we'll check server-side in API routes
  return null
}










