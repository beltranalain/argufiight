'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'

interface DailyRewardStatus {
  rewarded: boolean
  rewardAmount: number
  streak: number
  longestStreak: number
  totalLoginDays: number
}

/**
 * Hook to automatically claim daily login reward when user is authenticated
 */
export function useDailyLoginReward() {
  const { user, isAuthenticated } = useAuth()
  const [status, setStatus] = useState<DailyRewardStatus | null>(null)
  const [isClaiming, setIsClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Only claim if user is authenticated
    if (!isAuthenticated || !user) {
      return
    }

    // Claim daily reward
    const claimReward = async () => {
      // Prevent multiple simultaneous claims
      if (isClaiming) {
        return
      }

      setIsClaiming(true)
      setError(null)

      try {
        console.log('[useDailyLoginReward] Claiming daily reward for user:', user.id)
        const response = await fetch('/api/rewards/daily-login', {
          method: 'POST',
          credentials: 'include',
        })

        console.log('[useDailyLoginReward] Response status:', response.status)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          console.error('[useDailyLoginReward] Error response:', errorData)
          throw new Error(errorData.error || 'Failed to claim daily reward')
        }

        const data = await response.json()
        console.log('[useDailyLoginReward] Reward data:', JSON.stringify(data, null, 2))
        console.log('[useDailyLoginReward] Rewarded?', data.rewarded, 'Amount:', data.rewardAmount)
        
        setStatus({
          rewarded: data.rewarded || false,
          rewardAmount: data.rewardAmount || 0,
          streak: data.streak || 0,
          longestStreak: data.longestStreak || 0,
          totalLoginDays: data.totalLoginDays || 0,
        })

        // If rewarded, refresh user data to update coin balance
        if (data.rewarded && data.rewardAmount > 0) {
          console.log('[useDailyLoginReward] Reward claimed! Refreshing user data...')
          // Trigger a refresh of user data
          window.dispatchEvent(new Event('user-logged-in'))
          // Also trigger storage event for cross-tab sync
          localStorage.setItem('auth-refresh', Date.now().toString())
        }
      } catch (err) {
        console.error('[useDailyLoginReward] Error claiming reward:', err)
        setError(err instanceof Error ? err.message : 'Failed to claim reward')
      } finally {
        setIsClaiming(false)
      }
    }

    // Small delay to ensure session is fully established
    const timer = setTimeout(() => {
      claimReward()
    }, 500)

    return () => clearTimeout(timer)
  }, [isAuthenticated, user?.id]) // Only run when auth state changes

  return {
    status,
    isClaiming,
    error,
    claimed: status?.rewarded || false,
    rewardAmount: status?.rewardAmount || 0,
  }
}
