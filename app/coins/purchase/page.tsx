'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { TopNav } from '@/components/layout/TopNav'
import { cn } from '@/lib/utils'

interface CoinPackage {
  id: string
  name: string
  priceUSD: number
  baseCoins: number
  bonusCoins: number
  totalCoins: number
  bonusPercent: number
  isPopular?: boolean
}

export default function CoinPurchasePage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [packages, setPackages] = useState<CoinPackage[]>([])
  const [coinBalance, setCoinBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [packagesRes, profileRes] = await Promise.all([
        fetch('/api/coins/packages', { credentials: 'include' }),
        fetch('/api/profile', { credentials: 'include' }),
      ])

      if (!packagesRes.ok) {
        throw new Error('Failed to fetch coin packages')
      }

      const packagesData = await packagesRes.json()
      setPackages(packagesData.packages || [])

      if (profileRes.ok) {
        const profileData = await profileRes.json()
        setCoinBalance(profileData.coins || 0)
      }
    } catch (error: any) {
      console.error('Failed to fetch data:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to load coin packages',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePurchase = async (pkg: CoinPackage) => {
    if (isProcessing) return

    try {
      setIsProcessing(true)
      setSelectedPackage(pkg.id)

      const response = await fetch('/api/coins/purchase/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          packageId: pkg.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const data = await response.json()
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error: any) {
      console.error('Purchase error:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to start checkout',
      })
      setIsProcessing(false)
      setSelectedPackage(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="Buy Coins" />
        <div className="pt-20 md:pt-24 flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="Buy Coins" />
      
      <div className="pt-20 md:pt-24 px-4 md:px-8 pb-12 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
            Buy Coins
          </h1>
          <p className="text-text-secondary text-lg">
            Purchase coins to challenge belts, create tournaments, and more
          </p>
          {coinBalance !== null && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg">
              <svg className="w-5 h-5 text-electric-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-text-primary font-semibold">
                Current Balance: <span className="text-electric-blue">{coinBalance.toLocaleString()}</span>
              </span>
            </div>
          )}
        </div>

        {/* Packages Grid */}
        {packages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
            {packages.map((pkg) => {
              const isSelected = selectedPackage === pkg.id
              const isPopular = pkg.isPopular || pkg.name === 'Large' || pkg.name === 'XL'
              
              return (
                <Card
                  key={pkg.id}
                  className={cn(
                    'relative transition-all hover:scale-105',
                    isPopular && 'border-2 border-electric-blue shadow-lg shadow-electric-blue/20',
                    isSelected && 'ring-2 ring-electric-blue'
                  )}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-electric-blue text-black text-xs font-bold rounded-full">
                      POPULAR
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-2">
                    <h3 className="text-xl font-bold text-text-primary">{pkg.name}</h3>
                    {pkg.bonusPercent > 0 && (
                      <p className="text-sm text-electric-blue font-medium mt-1">
                        {pkg.bonusPercent}% Bonus
                      </p>
                    )}
                  </CardHeader>
                  
                  <CardBody className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-text-primary mb-1">
                        ${pkg.priceUSD.toFixed(2)}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {pkg.baseCoins.toLocaleString()} coins
                        {pkg.bonusCoins > 0 && (
                          <span className="text-electric-blue">
                            {' '}+ {pkg.bonusCoins.toLocaleString()} bonus
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="border-t border-bg-tertiary pt-4 pb-2">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-electric-blue mb-1">
                          {pkg.totalCoins.toLocaleString()}
                        </div>
                        <div className="text-xs text-text-secondary">Total Coins</div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handlePurchase(pkg)}
                      disabled={isProcessing}
                      className={cn(
                        'w-full',
                        isPopular
                          ? 'bg-electric-blue hover:bg-[#00B8E6] text-black'
                          : 'bg-bg-tertiary hover:bg-bg-secondary text-text-primary'
                      )}
                    >
                      {isSelected && isProcessing ? (
                        <span className="flex items-center gap-2">
                          <LoadingSpinner size="sm" />
                          Processing...
                        </span>
                      ) : (
                        'Purchase'
                      )}
                    </Button>
                    
                    {pkg.bonusPercent > 0 && (
                      <div className="text-center text-xs text-text-secondary">
                        {((pkg.totalCoins / pkg.priceUSD).toFixed(1))} coins per $1
                      </div>
                    )}
                  </CardBody>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardBody>
              <p className="text-text-secondary mb-4">No coin packages available at this time.</p>
              <Link href="/belts/room">
                <Button variant="outline">Return to Belts</Button>
              </Link>
            </CardBody>
          </Card>
        )}

        {/* Info Section */}
        <div className="mt-12 max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">How Coins Work</h2>
            </CardHeader>
            <CardBody className="space-y-3 text-text-secondary">
              <p>
                Coins are used to participate in belt challenges and create tournament belts. 
                The more coins you purchase, the more bonus coins you receive.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Belt Challenge Entry: 50-500 coins (varies by belt value)</li>
                <li>Tournament Belt Creation: 1,000-5,000 coins</li>
                <li>Coins never expire</li>
                <li>Secure payment via Stripe</li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
