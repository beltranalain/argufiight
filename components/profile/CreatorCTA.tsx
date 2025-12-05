'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
// Note: Eligibility check is done server-side via API

interface CreatorCTAProps {
  userId: string
  eloRating: number
  totalDebates: number
  createdAt: Date
}

export function CreatorCTA({ userId, eloRating, totalDebates, createdAt }: CreatorCTAProps) {
  const router = useRouter()
  const [eligible, setEligible] = useState<{ eligible: boolean; reasons: string[] } | null>(null)
  const [isEnabling, setIsEnabling] = useState(false)
  const [isCreator, setIsCreator] = useState(false)

  useEffect(() => {
    checkEligibility()
    checkCreatorStatus()
  }, [userId, eloRating, totalDebates, createdAt])

  const checkEligibility = async () => {
    try {
      const response = await fetch(`/api/creators/check-eligibility?elo=${eloRating}&debates=${totalDebates}&createdAt=${createdAt.toISOString()}`)
      if (response.ok) {
        const result = await response.json()
        setEligible(result)
      }
    } catch (error) {
      console.error('Failed to check eligibility:', error)
    }
  }

  const checkCreatorStatus = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/profile`)
      if (response.ok) {
        const data = await response.json()
        setIsCreator(data.user?.isCreator || false)
      }
    } catch (error) {
      console.error('Failed to check creator status:', error)
    }
  }

  const handleEnableCreator = async () => {
    setIsEnabling(true)
    try {
      const response = await fetch('/api/creators/enable', {
        method: 'POST',
      })

      if (response.ok) {
        router.push('/creator/setup')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to enable creator mode')
      }
    } catch (error) {
      alert('Failed to enable creator mode')
    } finally {
      setIsEnabling(false)
    }
  }

  if (isCreator) {
    return (
      <div className="bg-gradient-to-br from-electric-blue/20 to-neon-orange/20 border border-electric-blue/30 rounded-xl p-6 mt-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Creator Mode Active</h3>
            <p className="text-sm text-text-secondary">
              You're earning money from sponsorships. Manage your creator account.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => router.push('/creator/dashboard')}
          >
            Creator Dashboard
          </Button>
        </div>
      </div>
    )
  }

  if (!eligible) {
    return null // Still checking
  }

  return (
    <div className="bg-gradient-to-br from-electric-blue/20 to-neon-orange/20 border border-electric-blue/30 rounded-xl p-6 mt-4">
      <h3 className="text-lg font-bold text-white mb-2">💰 Become a Creator</h3>
      <p className="text-sm text-text-secondary mb-4">
        Monetize your debates. Get paid by advertisers. Earn while you argue.
      </p>

      {eligible.eligible ? (
        <>
          <p className="text-sm text-cyber-green mb-4">
            ✓ You're eligible! Start earning today.
          </p>
          <Button
            variant="primary"
            className="w-full"
            onClick={handleEnableCreator}
            isLoading={isEnabling}
          >
            Enable Creator Mode
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-text-secondary mb-2">Requirements:</p>
          <ul className="text-xs text-text-muted space-y-1 mb-4">
            {eligible.reasons.map((reason, index) => (
              <li key={index} className="flex items-start gap-2">
                <span>✗</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-text-secondary">
            Keep debating to unlock creator features!
          </p>
        </>
      )}
    </div>
  )
}

