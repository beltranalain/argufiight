'use client'

import { Badge } from '@/components/ui/Badge'
import { useFeatureFlags } from '@/lib/contexts/FeatureFlagContext'
import { FEATURE_KEYS } from '@/lib/features'

interface TierBadgeProps {
  tier: 'FREE' | 'PRO'
  size?: 'sm' | 'md' | 'lg'
  showVerified?: boolean
}

export function TierBadge({ tier, size = 'md', showVerified = false }: TierBadgeProps) {
  const { isEnabled } = useFeatureFlags()

  // When subscriptions are disabled, hide tier badges entirely
  if (!isEnabled(FEATURE_KEYS.SUBSCRIPTIONS)) {
    return null
  }
  if (tier === 'PRO') {
    return (
      <div className="flex items-center gap-2">
        <Badge
          variant="default"
          className={`bg-electric-blue/20 text-electric-blue border border-electric-blue/30 ${
            size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-base px-3 py-1' : 'text-sm px-2.5 py-1'
          }`}
        >
          PRO
        </Badge>
        {showVerified && (
          <span className="text-electric-blue text-lg" title="Verified Pro User">
            ✓
          </span>
        )}
      </div>
    )
  }

  return (
    <Badge
      variant="default"
      className={`${
        size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-base px-3 py-1' : 'text-sm px-2.5 py-1'
      }`}
    >
      FREE
    </Badge>
  )
}

