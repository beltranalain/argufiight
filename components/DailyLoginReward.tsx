'use client'

import { useDailyLoginReward } from '@/lib/hooks/useDailyLoginReward'
import { useToast } from '@/components/ui/Toast'
import { useEffect } from 'react'
import { useFeatureFlags } from '@/lib/contexts/FeatureFlagContext'
import { FEATURE_KEYS } from '@/lib/features'

/**
 * Component that automatically claims daily login reward and shows notification
 * Add this to your root layout or main app component
 */
export function DailyLoginReward() {
  const { isEnabled } = useFeatureFlags()
  const enabled = isEnabled(FEATURE_KEYS.DAILY_LOGIN_REWARD) && isEnabled(FEATURE_KEYS.COINS)
  const { status, claimed, rewardAmount, error } = useDailyLoginReward(enabled)
  const { showToast } = useToast()

  useEffect(() => {
    console.log('[DailyLoginReward Component] Status:', status, 'Claimed:', claimed, 'Amount:', rewardAmount)
    if (status && claimed && rewardAmount > 0) {
      console.log('[DailyLoginReward Component] Showing toast notification')
      showToast({
        type: 'success',
        title: 'Daily Login Reward!',
        description: `You earned ${rewardAmount} coins! ${status.streak > 1 ? `(${status.streak} day streak)` : ''}`,
      })
    } else if (status && !claimed) {
      console.log('[DailyLoginReward Component] Already rewarded today or no reward')
    }
  }, [status, claimed, rewardAmount, showToast])

  // Don't render anything - this is just a side-effect component
  return null
}
