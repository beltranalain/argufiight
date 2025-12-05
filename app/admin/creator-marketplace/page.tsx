'use client'

import { useState, useEffect } from 'react'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'

interface Advertiser {
  id: string
  companyName: string
  industry: string
  contactEmail: string
  status: string
  createdAt: string
}

interface Campaign {
  id: string
  name: string
  status: string
  advertiser: {
    companyName: string
  }
  createdAt: string
}

interface Contract {
  id: string
  status: string
  totalAmount: number
  advertiser: {
    companyName: string
  }
  creator: {
    username: string
  }
  endDate: string
}

export default function CreatorMarketplacePage() {
  const { showToast } = useToast()
  const [pendingAdvertisers, setPendingAdvertisers] = useState<Advertiser[]>([])
  const [pendingCampaigns, setPendingCampaigns] = useState<Campaign[]>([])
  const [activeContracts, setActiveContracts] = useState<Contract[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [marketplaceEnabled, setMarketplaceEnabled] = useState(false)
  const [stats, setStats] = useState({
    pendingAdvertisers: 0,
    activeContracts: 0,
    monthlyRevenue: 0,
    totalCreators: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [advertisersRes, campaignsRes, contractsRes, statsRes, settingsRes] = await Promise.all([
        fetch('/api/admin/advertisers?status=PENDING'),
        fetch('/api/admin/campaigns?status=PENDING_REVIEW'),
        fetch('/api/admin/contracts?status=ACTIVE'),
        fetch('/api/admin/marketplace/stats'),
        fetch('/api/admin/settings'),
      ])

      if (advertisersRes.ok) {
        const data = await advertisersRes.json()
        setPendingAdvertisers(data.advertisers || [])
      }

      if (campaignsRes.ok) {
        const data = await campaignsRes.json()
        setPendingCampaigns(data.campaigns || [])
      }

      if (contractsRes.ok) {
        const data = await contractsRes.json()
        setActiveContracts(data.contracts || [])
      }

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }

      if (settingsRes.ok) {
        const settings = await settingsRes.json()
        setMarketplaceEnabled(settings.ADS_CREATOR_MARKETPLACE_ENABLED === 'true')
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMarketplace = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ADS_CREATOR_MARKETPLACE_ENABLED: (!marketplaceEnabled).toString(),
        }),
      })

      if (response.ok) {
        setMarketplaceEnabled(!marketplaceEnabled)
        showToast({
          type: 'success',
          title: 'Success',
          description: `Creator Marketplace ${!marketplaceEnabled ? 'enabled' : 'disabled'}`,
        })
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to update setting',
      })
    }
  }

  const handleApproveAdvertiser = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/advertisers/${id}/approve`, {
        method: 'POST',
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Success',
          description: 'Advertiser approved',
        })
        fetchData()
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to approve advertiser',
      })
    }
  }

  const handleRejectAdvertiser = async (id: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/advertisers/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Success',
          description: 'Advertiser rejected',
        })
        fetchData()
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to reject advertiser',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="ADMIN" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="ADMIN" />
      <div className="pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Creator Marketplace</h1>
              <p className="text-text-secondary mt-2">Manage advertiser applications and creator contracts</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">Creator Marketplace:</span>
              <button
                onClick={toggleMarketplace}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  marketplaceEnabled ? 'bg-electric-blue' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    marketplaceEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm ${marketplaceEnabled ? 'text-cyber-green' : 'text-gray-400'}`}>
                {marketplaceEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          {!marketplaceEnabled && (
            <Card>
              <CardBody>
                <p className="text-text-secondary">
                  Creator Marketplace is currently disabled. Enable the toggle above to start managing advertisers and contracts.
                </p>
              </CardBody>
            </Card>
          )}

          {marketplaceEnabled && (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardBody>
                    <div className="text-2xl font-bold text-neon-orange">{stats.pendingAdvertisers}</div>
                    <div className="text-text-secondary">Pending Advertisers</div>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <div className="text-2xl font-bold text-cyber-green">{stats.activeContracts}</div>
                    <div className="text-text-secondary">Active Contracts</div>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <div className="text-2xl font-bold text-electric-blue">
                      ${stats.monthlyRevenue.toLocaleString()}
                    </div>
                    <div className="text-text-secondary">Monthly Revenue</div>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <div className="text-2xl font-bold text-purple-400">{stats.totalCreators}</div>
                    <div className="text-text-secondary">Total Creators</div>
                  </CardBody>
                </Card>
              </div>

              {/* Pending Advertiser Applications */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-text-primary">
                      Pending Advertiser Applications
                      {pendingAdvertisers.length > 0 && (
                        <Badge className="ml-3 bg-neon-orange/20 text-neon-orange">
                          {pendingAdvertisers.length}
                        </Badge>
                      )}
                    </h2>
                  </div>
                </CardHeader>
                <CardBody>
                  {pendingAdvertisers.length === 0 ? (
                    <p className="text-text-secondary">No pending applications</p>
                  ) : (
                    <div className="space-y-4">
                      {pendingAdvertisers.map((advertiser) => (
                        <div
                          key={advertiser.id}
                          className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-bg-tertiary"
                        >
                          <div>
                            <h3 className="text-lg font-bold text-text-primary">{advertiser.companyName}</h3>
                            <div className="text-sm text-text-secondary space-y-1 mt-2">
                              <p>Industry: {advertiser.industry}</p>
                              <p>Contact: {advertiser.contactEmail}</p>
                              <p>Applied: {new Date(advertiser.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleApproveAdvertiser(advertiser.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => {
                                const reason = prompt('Rejection reason:')
                                if (reason) handleRejectAdvertiser(advertiser.id, reason)
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Pending Campaign Reviews */}
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold text-text-primary">
                    Pending Campaign Reviews
                    {pendingCampaigns.length > 0 && (
                      <Badge className="ml-3 bg-neon-orange/20 text-neon-orange">
                        {pendingCampaigns.length}
                      </Badge>
                    )}
                  </h2>
                </CardHeader>
                <CardBody>
                  {pendingCampaigns.length === 0 ? (
                    <p className="text-text-secondary">No pending campaigns</p>
                  ) : (
                    <div className="space-y-4">
                      {pendingCampaigns.map((campaign) => (
                        <div
                          key={campaign.id}
                          className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-bg-tertiary"
                        >
                          <div>
                            <h3 className="text-lg font-bold text-text-primary">{campaign.name}</h3>
                            <p className="text-sm text-text-secondary">
                              Advertiser: {campaign.advertiser.companyName}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="primary" size="sm">
                              Approve
                            </Button>
                            <Button variant="danger" size="sm">
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Active Contracts */}
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold text-text-primary">
                    Active Contracts ({activeContracts.length})
                  </h2>
                </CardHeader>
                <CardBody>
                  {activeContracts.length === 0 ? (
                    <p className="text-text-secondary">No active contracts</p>
                  ) : (
                    <div className="space-y-4">
                      {activeContracts.map((contract) => (
                        <div
                          key={contract.id}
                          className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-bg-tertiary"
                        >
                          <div>
                            <h3 className="text-lg font-bold text-text-primary">
                              {contract.advertiser.companyName} × @{contract.creator.username}
                            </h3>
                            <div className="text-sm text-text-secondary space-y-1 mt-2">
                              <p>Amount: ${Number(contract.totalAmount).toLocaleString()}</p>
                              <p>
                                Ends: {new Date(contract.endDate).toLocaleDateString()}
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}

