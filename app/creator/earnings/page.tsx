'use client'

import { useState, useEffect } from 'react'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Badge } from '@/components/ui/Badge'

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
  const [earnings, setEarnings] = useState<EarningsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchEarnings()
  }, [])

  const fetchEarnings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/creator/earnings/detailed')
      if (response.ok) {
        const data = await response.json()
        setEarnings(data)
      }
    } catch (error) {
      console.error('Failed to fetch earnings:', error)
    } finally {
      setIsLoading(false)
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

  if (!earnings) {
    return null
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

