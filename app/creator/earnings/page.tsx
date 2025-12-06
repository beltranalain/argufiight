'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface EarningsData {
  totalEarned: number
  pendingPayout: number
  thisMonth: number
  thisYear: number
  contracts: Array<{
    id: string
    status: string
    creatorPayout: number
    totalAmount: number
    payoutDate: string | null
    completedAt: string | null
    advertiser: {
      companyName: string
    }
    campaign: {
      name: string
    }
  }>
  monthlyBreakdown: Array<{
    month: string
    earnings: number
  }>
}

export default function CreatorEarningsPage() {
  const router = useRouter()
  const [earnings, setEarnings] = useState<EarningsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreator, setIsCreator] = useState<boolean | null>(null)

  useEffect(() => {
    fetchEarnings()
  }, [])

  const fetchEarnings = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/creator/earnings/detailed')
      
      if (response.ok) {
        const data = await response.json()
        setEarnings(data)
        setIsCreator(true)
      } else if (response.status === 403) {
        const errorData = await response.json()
        setError(errorData.error || 'Creator mode not enabled')
        setIsCreator(false)
      } else if (response.status === 401) {
        setError('Please log in to view your earnings')
        router.push('/login')
      } else {
        setError('Failed to load earnings')
      }
    } catch (error) {
      console.error('Failed to fetch earnings:', error)
      setError('Failed to load earnings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnableCreator = async () => {
    try {
      const response = await fetch('/api/creators/enable', {
        method: 'POST',
      })

      if (response.ok) {
        router.push('/creator/setup')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to enable creator mode')
      }
    } catch (error) {
      alert('Failed to enable creator mode')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="CREATOR" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  // Show error state if creator mode is not enabled
  if (isCreator === false || error) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="CREATOR" />
        <div className="pt-20 px-4 md:px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            <Card>
              <CardBody>
                <div className="text-center py-12">
                  <div className="mb-6">
                    <svg className="w-16 h-16 mx-auto text-electric-blue mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-2xl font-bold text-text-primary mb-2">Creator Mode Not Enabled</h2>
                    <p className="text-text-secondary mb-6">
                      {error || 'You need to enable creator mode to view your earnings.'}
                    </p>
                  </div>
                  <div className="space-y-4">
                    <Button
                      variant="primary"
                      onClick={handleEnableCreator}
                      className="mx-auto"
                    >
                      Enable Creator Mode
                    </Button>
                    <div>
                      <Button
                        variant="secondary"
                        onClick={() => router.push('/creator')}
                      >
                        Go to Creator Dashboard
                      </Button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!earnings) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="CREATOR" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-text-secondary mb-4">No earnings data available</p>
            <Button variant="secondary" onClick={fetchEarnings}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="CREATOR" />
      <div className="pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Earnings & Payouts</h1>
            <p className="text-text-secondary mt-2">Track your earnings and payout history</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardBody>
                <div className="text-2xl font-bold text-cyber-green">
                  ${earnings.totalEarned.toLocaleString()}
                </div>
                <div className="text-text-secondary">Total Earned</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-2xl font-bold text-electric-blue">
                  ${earnings.pendingPayout.toLocaleString()}
                </div>
                <div className="text-text-secondary">Pending Payout</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-2xl font-bold text-neon-orange">
                  ${earnings.thisMonth.toLocaleString()}
                </div>
                <div className="text-text-secondary">This Month</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-2xl font-bold text-text-primary">
                  ${earnings.thisYear.toLocaleString()}
                </div>
                <div className="text-text-secondary">This Year</div>
              </CardBody>
            </Card>
          </div>

          {/* Monthly Breakdown Chart */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">Monthly Earnings</h2>
            </CardHeader>
            <CardBody>
              <div className="h-64 flex items-center justify-center bg-bg-secondary rounded-lg">
                <p className="text-text-secondary">
                  Chart visualization coming soon (monthly earnings over time)
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Contract History */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">Payout History</h2>
            </CardHeader>
            <CardBody>
              {earnings.contracts.length === 0 ? (
                <p className="text-text-secondary text-center py-8">
                  No payouts yet. Complete contracts to start earning!
                </p>
              ) : (
                <div className="space-y-4">
                  {earnings.contracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-bg-tertiary"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-text-primary">
                            {contract.campaign.name}
                          </h3>
                          <Badge
                            className={
                              contract.status === 'COMPLETED'
                                ? 'bg-cyber-green/20 text-cyber-green'
                                : contract.status === 'ACTIVE'
                                ? 'bg-electric-blue/20 text-electric-blue'
                                : 'bg-gray-500/20 text-gray-400'
                            }
                          >
                            {contract.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-text-secondary space-y-1">
                          <p>Advertiser: {contract.advertiser.companyName}</p>
                          <p>
                            Payout: ${Number(contract.creatorPayout).toLocaleString()} / $
                            {Number(contract.totalAmount).toLocaleString()} total
                          </p>
                          {contract.payoutDate && (
                            <p>Paid: {new Date(contract.payoutDate).toLocaleDateString()}</p>
                          )}
                          {contract.completedAt && !contract.payoutDate && (
                            <p className="text-neon-orange">
                              Completed: {new Date(contract.completedAt).toLocaleDateString()} (Payout pending)
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

