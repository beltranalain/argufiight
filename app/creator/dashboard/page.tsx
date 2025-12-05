'use client'

import { useState, useEffect } from 'react'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

interface Contract {
  id: string
  status: string
  totalAmount: number
  creatorPayout: number
  startDate: string
  endDate: string
  advertiser: {
    companyName: string
  }
  campaign: {
    name: string
  }
}

interface Offer {
  id: string
  amount: number
  placement: string
  duration: number
  status: string
  expiresAt: string
  advertiser: {
    companyName: string
  }
  campaign: {
    name: string
  }
}

export default function CreatorDashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [earnings, setEarnings] = useState({
    totalEarned: 0,
    pendingPayout: 0,
    thisMonth: 0,
  })
  const [activeContracts, setActiveContracts] = useState<Contract[]>([])
  const [pendingOffers, setPendingOffers] = useState<Offer[]>([])
  const [creatorInfo, setCreatorInfo] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [contractsRes, offersRes, earningsRes, profileRes] = await Promise.all([
        fetch('/api/creator/contracts?status=ACTIVE'),
        fetch('/api/creator/offers?status=PENDING'),
        fetch('/api/creator/earnings'),
        fetch('/api/creator/profile'),
      ])

      if (contractsRes.ok) {
        const data = await contractsRes.json()
        setActiveContracts(data.contracts || [])
      }

      if (offersRes.ok) {
        const data = await offersRes.json()
        setPendingOffers(data.offers || [])
      }

      if (earningsRes.ok) {
        const data = await earningsRes.json()
        setEarnings(data)
      }

      if (profileRes.ok) {
        const data = await profileRes.json()
        setCreatorInfo(data)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
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

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="CREATOR" />
      <div className="pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Creator Dashboard</h1>
              <p className="text-text-secondary mt-2">Manage your sponsorships and earnings</p>
            </div>
            <div className="flex gap-3">
              <Link href="/creator/settings">
                <Button variant="secondary">Ad Slot Settings</Button>
              </Link>
              <Link href="/creator/earnings">
                <Button variant="secondary">View Earnings</Button>
              </Link>
            </div>
          </div>

          {/* Earnings Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>

          {/* Pending Offers */}
          {pendingOffers.length > 0 && (
            <Card className="border-electric-blue/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-text-primary">
                    Pending Offers ({pendingOffers.length})
                  </h2>
                  <Link href="/creator/offers">
                    <Button variant="secondary" size="sm">View All</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {pendingOffers.slice(0, 3).map((offer) => (
                    <div
                      key={offer.id}
                      className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-bg-tertiary"
                    >
                      <div>
                        <h3 className="text-lg font-bold text-text-primary">
                          {offer.advertiser.companyName}
                        </h3>
                        <div className="text-sm text-text-secondary space-y-1 mt-1">
                          <p>Campaign: {offer.campaign.name}</p>
                          <p>
                            ${Number(offer.amount).toLocaleString()} for {offer.duration} days •{' '}
                            {offer.placement}
                          </p>
                          <p>Expires: {new Date(offer.expiresAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/creator/offers/${offer.id}`}>
                          <Button variant="primary" size="sm">Review</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Active Contracts */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">
                Active Contracts ({activeContracts.length})
              </h2>
            </CardHeader>
            <CardBody>
              {activeContracts.length === 0 ? (
                <p className="text-text-secondary text-center py-8">
                  No active contracts. Accept offers to start earning!
                </p>
              ) : (
                <div className="space-y-4">
                  {activeContracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-bg-tertiary"
                    >
                      <div>
                        <h3 className="text-lg font-bold text-text-primary">
                          {contract.advertiser.companyName}
                        </h3>
                        <div className="text-sm text-text-secondary space-y-1 mt-1">
                          <p>Campaign: {contract.campaign.name}</p>
                          <p>
                            Payout: ${Number(contract.creatorPayout).toLocaleString()} • Ends:{' '}
                            {new Date(contract.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-cyber-green/20 text-cyber-green">ACTIVE</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Creator Stats for Advertisers */}
          {creatorInfo && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-text-primary">Your Creator Profile</h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-text-primary">
                      {creatorInfo.avgMonthlyViews.toLocaleString()}
                    </div>
                    <div className="text-sm text-text-secondary">Avg Monthly Views</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-text-primary">
                      {creatorInfo.followerCount.toLocaleString()}
                    </div>
                    <div className="text-sm text-text-secondary">Followers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-text-primary">
                      {creatorInfo.totalDebates}
                    </div>
                    <div className="text-sm text-text-secondary">Total Debates</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-text-primary">
                      {creatorInfo.eloRating}
                    </div>
                    <div className="text-sm text-text-secondary">ELO Rating</div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

