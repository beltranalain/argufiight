'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/fetchClient'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import Link from 'next/link'
import { OffersTab } from './OffersTab'
import { EarningsTab } from './EarningsTab'
import { SettingsTab } from './SettingsTab'
import { TaxDocumentsTab } from '@/components/creator/TaxDocumentsTab'

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

interface DashboardData {
  activeContracts: Contract[]
  pendingOffers: Offer[]
  earnings: {
    totalEarned: number
    pendingPayout: number
    thisMonth: number
  }
  creatorInfo: any
  eligibility: {
    minELO: number
    minDebates: number
    minAgeMonths: number
  } | null
  platformFees: {
    BRONZE: number
    SILVER: number
    GOLD: number
    PLATINUM: number
  } | null
}

async function fetchDashboardData(): Promise<DashboardData> {
  const [contractsData, offersData, earningsData, profileData, eligibilityData, feesData] = await Promise.all([
    fetchClient<{ contracts: Contract[] }>('/api/creator/contracts').catch(() => ({ contracts: [] })),
    fetchClient<{ offers: Offer[] }>('/api/creator/offers?status=PENDING').catch(() => ({ offers: [] })),
    fetchClient<{ totalEarned: number; pendingPayout: number; thisMonth: number }>('/api/creator/earnings').catch(() => ({ totalEarned: 0, pendingPayout: 0, thisMonth: 0 })),
    fetchClient<any>('/api/creator/profile').catch(() => null),
    fetchClient<{ minELO: number; minDebates: number; minAgeMonths: number }>('/api/creator/eligibility').catch(() => null),
    fetchClient<{ BRONZE: number; SILVER: number; GOLD: number; PLATINUM: number }>('/api/creator/platform-fees').catch(() => null),
  ])

  const activeAndScheduled = (contractsData.contracts || []).filter(
    (c: Contract) => c.status === 'ACTIVE' || c.status === 'SCHEDULED'
  )

  return {
    activeContracts: activeAndScheduled,
    pendingOffers: offersData.offers || [],
    earnings: earningsData,
    creatorInfo: profileData,
    eligibility: eligibilityData,
    platformFees: feesData,
  }
}

function CreatorDashboardContent() {
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get('tab') as 'overview' | 'offers' | 'earnings' | 'settings' | 'tax-documents' | 'how-it-works' | null
  const [activeTab, setActiveTab] = useState<'overview' | 'offers' | 'earnings' | 'settings' | 'tax-documents' | 'how-it-works'>(
    tabFromUrl || 'overview'
  )

  useEffect(() => {
    if (tabFromUrl && ['overview', 'offers', 'earnings', 'settings', 'tax-documents', 'how-it-works'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['creator', 'dashboard'],
    queryFn: fetchDashboardData,
  })

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

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="CREATOR" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <ErrorDisplay
            title="Failed to load dashboard"
            message={error instanceof Error ? error.message : 'Something went wrong. Please try again.'}
            onRetry={() => refetch()}
          />
        </div>
      </div>
    )
  }

  const { activeContracts, pendingOffers, earnings, creatorInfo, eligibility, platformFees } = data!

  // Overview Tab Content
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <div className="text-2xl font-bold text-cyber-green">
              ${(earnings.totalEarned ?? 0).toLocaleString()}
            </div>
            <div className="text-text-secondary">Total Earned</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-2xl font-bold text-electric-blue">
              ${(earnings.pendingPayout ?? 0).toLocaleString()}
            </div>
            <div className="text-text-secondary">Pending Payout</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-2xl font-bold text-neon-orange">
              ${(earnings.thisMonth ?? 0).toLocaleString()}
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
                        ${Number(offer.amount ?? 0).toLocaleString()} for {offer.duration} days •{' '}
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
                        Payout: ${Number(contract.creatorPayout ?? 0).toLocaleString()} • Ends:{' '}
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
                  {creatorInfo.avgMonthlyViews?.toLocaleString() ?? "0"}
                </div>
                <div className="text-sm text-text-secondary">Avg Monthly Views</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">
                  {creatorInfo.followerCount?.toLocaleString() ?? "0"}
                </div>
                <div className="text-sm text-text-secondary">Followers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">
                  {creatorInfo.totalDebates ?? 0}
                </div>
                <div className="text-sm text-text-secondary">Total Debates</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-text-primary">
                  {creatorInfo.eloRating ?? 0}
                </div>
                <div className="text-sm text-text-secondary">ELO Rating</div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )

  // How It Works Tab Content
  const HowItWorksTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-text-primary">How the Creator Marketplace Works</h2>
        </CardHeader>
        <CardBody className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-text-primary mb-3">Overview</h3>
            <p className="text-text-secondary">
              The Creator Marketplace allows top debaters to monetize their profile by selling ad space to advertisers.
              As you improve your debating skills and build your audience, you can earn more from each sponsorship.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-text-primary mb-3">Eligibility Requirements</h3>
            <p className="text-text-secondary mb-3">
              To become a creator, you must meet the following requirements:
            </p>
            {eligibility ? (
              <ul className="list-disc list-inside space-y-2 text-text-secondary">
                <li>Minimum ELO Rating: <strong className="text-text-primary">{eligibility.minELO}</strong></li>
                <li>Minimum Debates Completed: <strong className="text-text-primary">{eligibility.minDebates}</strong></li>
                <li>Minimum Account Age: <strong className="text-text-primary">{eligibility.minAgeMonths} months</strong></li>
              </ul>
            ) : (
              <p className="text-text-muted">Loading requirements...</p>
            )}
          </div>

          <div>
            <h3 className="text-xl font-bold text-text-primary mb-3">Creator Tiers & Platform Fees</h3>
            <p className="text-text-secondary mb-3">
              Your creator tier is determined by your ELO rating. Higher tiers pay lower platform fees, meaning you keep more of your earnings:
            </p>
            {platformFees ? (
              <div className="space-y-3">
                <div className="p-4 bg-bg-secondary rounded-lg border border-bg-tertiary">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-600/20 text-amber-400">BRONZE</Badge>
                      <span className="text-text-secondary">ELO 1500-1999</span>
                    </div>
                    <span className="text-lg font-bold text-text-primary">{platformFees.BRONZE}% Platform Fee</span>
                  </div>
                  <p className="text-sm text-text-muted">You keep {100 - platformFees.BRONZE}% of each contract</p>
                </div>
                <div className="p-4 bg-bg-secondary rounded-lg border border-bg-tertiary">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gray-400/20 text-gray-300">SILVER</Badge>
                      <span className="text-text-secondary">ELO 2000-2499</span>
                    </div>
                    <span className="text-lg font-bold text-text-primary">{platformFees.SILVER}% Platform Fee</span>
                  </div>
                  <p className="text-sm text-text-muted">You keep {100 - platformFees.SILVER}% of each contract</p>
                </div>
                <div className="p-4 bg-bg-secondary rounded-lg border border-bg-tertiary">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-500/20 text-yellow-400">GOLD</Badge>
                      <span className="text-text-secondary">ELO 2500+</span>
                    </div>
                    <span className="text-lg font-bold text-text-primary">{platformFees.GOLD}% Platform Fee</span>
                  </div>
                  <p className="text-sm text-text-muted">You keep {100 - platformFees.GOLD}% of each contract</p>
                </div>
                <div className="p-4 bg-bg-secondary rounded-lg border border-bg-tertiary">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-cyan-500/20 text-cyan-400">PLATINUM</Badge>
                      <span className="text-text-secondary">Top 1% of debaters</span>
                    </div>
                    <span className="text-lg font-bold text-text-primary">{platformFees.PLATINUM}% Platform Fee</span>
                  </div>
                  <p className="text-sm text-text-muted">You keep {100 - platformFees.PLATINUM}% of each contract</p>
                </div>
              </div>
            ) : (
              <p className="text-text-muted">Loading platform fees...</p>
            )}
          </div>

          <div>
            <h3 className="text-xl font-bold text-text-primary mb-3">How Earnings Work</h3>
            <div className="space-y-3 text-text-secondary">
              <p>
                <strong className="text-text-primary">1. Set Your Prices:</strong> Configure your ad slot prices in the Ad Slot Settings.
                You can set different prices for Profile Banner, Post-Debate, and Debate Widget placements.
              </p>
              <p>
                <strong className="text-text-primary">2. Receive Offers:</strong> Advertisers browse creators and make offers based on your pricing and availability.
                You'll receive notifications when new offers arrive.
              </p>
              <p>
                <strong className="text-text-primary">3. Accept or Negotiate:</strong> Review each offer and decide to accept, decline, or counter with different terms.
                You can negotiate up to 3 rounds with advertisers.
              </p>
              <p>
                <strong className="text-text-primary">4. Contract & Payment:</strong> When you accept an offer, a contract is created and payment is held in escrow.
                The platform fee is calculated based on your current tier.
              </p>
              <p>
                <strong className="text-text-primary">5. Ad Display:</strong> Once the contract is active, the advertiser's ad will display in your selected ad slot.
                Ads are automatically tracked for impressions and clicks.
              </p>
              <p>
                <strong className="text-text-primary">6. Payout:</strong> After the contract completes and all requirements are met,
                your earnings (minus the platform fee) are automatically released to your account.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-text-primary mb-3">Better Debater = Better Earnings</h3>
            <div className="space-y-3 text-text-secondary">
              <p>
                Your ELO rating directly impacts your earning potential:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-text-primary">Higher ELO = Higher Tier:</strong> As your ELO increases, you move up tiers (Bronze → Silver → Gold → Platinum)</li>
                <li><strong className="text-text-primary">Lower Platform Fees:</strong> Higher tiers pay lower platform fees, so you keep more of each contract</li>
                <li><strong className="text-text-primary">More Attractive to Advertisers:</strong> Advertisers prefer creators with higher ELO ratings and better debate records</li>
                <li><strong className="text-text-primary">Better Negotiating Power:</strong> Top-tier creators can command higher prices for their ad slots</li>
              </ul>
              <p className="mt-3">
                <strong className="text-text-primary">Pro Tip:</strong> Focus on winning debates and improving your ELO rating.
                Not only will you become a better debater, but you'll also maximize your earnings potential!
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-text-primary mb-3">Ad Slot Types</h3>
            <div className="space-y-3">
              <div className="p-4 bg-bg-secondary rounded-lg border border-bg-tertiary">
                <h4 className="font-bold text-text-primary mb-2">Profile Banner</h4>
                <p className="text-sm text-text-secondary">
                  Displayed at the top of your profile page. Great for brand awareness and visibility.
                </p>
              </div>
              <div className="p-4 bg-bg-secondary rounded-lg border border-bg-tertiary">
                <h4 className="font-bold text-text-primary mb-2">Post-Debate Ad</h4>
                <p className="text-sm text-text-secondary">
                  Shown after you win a debate. Captures engaged viewers at a high-momentum moment.
                </p>
              </div>
              <div className="p-4 bg-bg-secondary rounded-lg border border-bg-tertiary">
                <h4 className="font-bold text-text-primary mb-2">Debate Widget</h4>
                <p className="text-sm text-text-secondary">
                  Displayed in the sidebar during live debates. Reaches active viewers in real-time.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-text-primary mb-3">Rules & Guidelines</h3>
            <div className="space-y-2 text-text-secondary">
              <p>• All contracts are binding once accepted. Review offers carefully before accepting.</p>
              <p>• Payment is held in escrow until contract completion to protect both parties.</p>
              <p>• You can pause ad slot availability at any time in your settings.</p>
              <p>• Platform fees are calculated at contract creation based on your current tier.</p>
              <p>• Disputes should be reported through the Support system for admin review.</p>
              <p>• Advertisers must be approved by platform admins before making offers.</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="CREATOR" />
      <div className="pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Creator Dashboard</h1>
            <p className="text-text-secondary mt-2">Manage your sponsorships and earnings</p>
          </div>

          {/* Tabs */}
          <Card>
            <Tabs
              tabs={[
                { id: 'overview', label: 'Overview', content: <OverviewTab /> },
                { id: 'offers', label: 'Offers', content: <OffersTab /> },
                { id: 'earnings', label: 'Earnings', content: <EarningsTab /> },
                { id: 'tax-documents', label: 'Tax Documents', content: <TaxDocumentsTab /> },
                { id: 'settings', label: 'Settings', content: <SettingsTab /> },
                { id: 'how-it-works', label: 'How It Works', content: <HowItWorksTab /> },
              ]}
              defaultTab={activeTab}
              onChange={(tab) => setActiveTab(tab as typeof activeTab)}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function CreatorDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="CREATOR" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    }>
      <CreatorDashboardContent />
    </Suspense>
  )
}
