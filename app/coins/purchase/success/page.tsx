'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { TopNav } from '@/components/layout/TopNav'

function SuccessPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [coinBalance, setCoinBalance] = useState<number | null>(null)
  const [purchaseDetails, setPurchaseDetails] = useState<{
    packageName: string
    totalCoins: number
    priceUSD: number
  } | null>(null)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    if (!sessionId) {
      router.push('/coins/purchase')
      return
    }

    verifyPurchase(sessionId)
  }, [searchParams, router])

  const verifyPurchase = async (sessionId: string) => {
    try {
      // Fetch updated coin balance
      const profileRes = await fetch('/api/profile', { credentials: 'include' })
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        setCoinBalance(profileData.coins || 0)
      }

      // Get purchase details from session (if needed)
      // For now, we'll just show success
      setIsLoading(false)
      
      showToast({
        type: 'success',
        title: 'Purchase Successful',
        description: 'Your coins have been added to your account.',
      })
    } catch (error: any) {
      console.error('Purchase verification error:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to verify purchase. Please contact support if coins were not added.',
      })
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="Purchase Successful" />
        <div className="pt-20 md:pt-24 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-text-secondary mt-4">Processing your purchase...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="Purchase Successful" />
      
      <div className="pt-20 md:pt-24 px-4 md:px-8 pb-12 max-w-2xl mx-auto">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-electric-blue/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-electric-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Purchase Successful!
            </h1>
            <p className="text-text-secondary">
              Your coins have been added to your account
            </p>
          </CardHeader>
          
          <CardBody className="space-y-6">
            {coinBalance !== null && (
              <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-6">
                <div className="text-sm text-text-secondary mb-2">New Coin Balance</div>
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-6 h-6 text-electric-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-4xl font-bold text-electric-blue">
                    {coinBalance.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => router.push('/belts/room')}
                className="flex-1 bg-electric-blue hover:bg-[#00B8E6] text-black"
              >
                Go to Belt Room
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/coins/purchase')}
                className="flex-1"
              >
                Buy More Coins
              </Button>
            </div>

            <div className="pt-4 border-t border-bg-tertiary">
              <p className="text-sm text-text-secondary mb-4">
                You can use your coins to challenge belts, create tournament belts, and more.
              </p>
              <Link href="/coins" className="text-electric-blue hover:text-[#00B8E6] text-sm font-medium">
                View Transaction History
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default function CoinPurchaseSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  )
}
