'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

interface Campaign {
  id: string
  name: string
  type: string
  status: string
  budget: number
  startDate: string
  endDate: string
  impressionsDelivered?: number
  clicksDelivered?: number
}

interface Advertiser {
  id: string
  companyName: string
  status: string
  paymentReady: boolean
}

export default function AdvertiserDashboardPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalSpent: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [advertiserRes, campaignsRes] = await Promise.all([
        fetch('/api/advertiser/me'),
        fetch('/api/advertiser/campaigns'),
      ])

      if (advertiserRes.ok) {
        const advertiserData = await advertiserRes.json()
        setAdvertiser(advertiserData.advertiser)
      } else if (advertiserRes.status === 401) {
        // Redirect to login with advertiser userType
        router.push('/login?userType=advertiser')
        return
      } else if (advertiserRes.status === 404) {
        // Not an advertiser, redirect to apply
        router.push('/advertise')
        return
      }

      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json()
        setCampaigns(campaignsData.campaigns || [])
        
        // Calculate stats
        const active = campaignsData.campaigns.filter((c: Campaign) => c.status === 'ACTIVE')
        const totalImpressions = campaignsData.campaigns.reduce(
          (sum: number, c: Campaign) => sum + (c.impressionsDelivered || 0),
          0
        )
        const totalClicks = campaignsData.campaigns.reduce(
          (sum: number, c: Campaign) => sum + (c.clicksDelivered || 0),
          0
        )
        const totalSpent = campaignsData.campaigns.reduce(
          (sum: number, c: Campaign) => sum + Number(c.budget),
          0
        )

        setStats({
          activeCampaigns: active.length,
          totalImpressions,
          totalClicks,
          totalSpent,
        })
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-cyber-green/20 text-cyber-green'
      case 'SCHEDULED':
        return 'bg-electric-blue/20 text-electric-blue'
      case 'PAUSED':
        return 'bg-neon-orange/20 text-neon-orange'
      case 'PENDING_REVIEW':
        return 'bg-yellow-500/20 text-yellow-500'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="ADVERTISER" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!advertiser) {
    return null // Will redirect
  }

  if (advertiser.status !== 'APPROVED') {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="ADVERTISER" />
        <div className="pt-20 px-4 md:px-8 pb-20">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <h1 className="text-2xl font-bold text-text-primary">Application Pending</h1>
              </CardHeader>
              <CardBody>
                <p className="text-text-secondary">
                  Your advertiser application is currently <strong>{advertiser.status}</strong>.
                  {advertiser.status === 'PENDING' && ' We\'ll notify you via email once it\'s been reviewed.'}
                  {advertiser.status === 'REJECTED' && ' Please contact support if you have questions.'}
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="ADVERTISER" />
      <div className="pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Advertiser Dashboard</h1>
              <p className="text-text-secondary mt-2">Welcome, {advertiser.companyName}</p>
            </div>
            <div className="flex gap-3">
              <Link href="/advertiser/creators">
                <Button variant="secondary">Discover Creators</Button>
              </Link>
              <Link href="/advertiser/campaigns/create">
                <Button variant="primary">Create Campaign</Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardBody>
                <div className="text-2xl font-bold text-text-primary">{stats.activeCampaigns}</div>
                <div className="text-text-secondary">Active Campaigns</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-2xl font-bold text-electric-blue">
                  {stats.totalImpressions.toLocaleString()}
                </div>
                <div className="text-text-secondary">Total Impressions</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-2xl font-bold text-cyber-green">
                  {stats.totalClicks.toLocaleString()}
                </div>
                <div className="text-text-secondary">Total Clicks</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-2xl font-bold text-neon-orange">
                  ${stats.totalSpent.toLocaleString()}
                </div>
                <div className="text-text-secondary">Total Spent</div>
              </CardBody>
            </Card>
          </div>

          {/* Payment Setup Warning */}
          {!advertiser.paymentReady && (
            <Card className="border-neon-orange/50 bg-neon-orange/10">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary mb-2">
                      Payment Setup Required
                    </h3>
                    <p className="text-text-secondary">
                      Connect your Stripe account to start creating campaigns and making offers to creators.
                    </p>
                  </div>
                  <Button 
                    variant="primary"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/advertiser/stripe-onboarding')
                        if (response.ok) {
                          const data = await response.json()
                          if (data.url) {
                            window.location.href = data.url
                          }
                        } else {
                          const error = await response.json()
                          showToast({
                            type: 'error',
                            title: 'Setup Failed',
                            description: error.error || 'Failed to start Stripe setup',
                          })
                        }
                      } catch (error: any) {
                        showToast({
                          type: 'error',
                          title: 'Error',
                          description: 'Failed to connect Stripe account',
                        })
                      }
                    }}
                  >
                    Connect Stripe
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Campaigns */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-text-primary">Your Campaigns</h2>
                <Link href="/advertiser/campaigns/create">
                  <Button variant="primary" size="sm">+ New Campaign</Button>
                </Link>
              </div>
            </CardHeader>
            <CardBody>
              {campaigns.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-text-secondary mb-4">No campaigns yet</p>
                  <Link href="/advertiser/campaigns/create">
                    <Button variant="primary">Create Your First Campaign</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-bg-tertiary"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-text-primary">{campaign.name}</h3>
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                          </Badge>
                        </div>
                        <div className="text-sm text-text-secondary space-y-1">
                          <p>Budget: ${Number(campaign.budget).toLocaleString()}</p>
                          <p>
                            {new Date(campaign.startDate).toLocaleDateString()} -{' '}
                            {new Date(campaign.endDate).toLocaleDateString()}
                          </p>
                          {(campaign.impressionsDelivered || campaign.clicksDelivered) && (
                            <p>
                              {campaign.impressionsDelivered?.toLocaleString()} impressions •{' '}
                              {campaign.clicksDelivered?.toLocaleString()} clicks
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/advertiser/campaigns/${campaign.id}`}>
                          <Button variant="secondary" size="sm">View</Button>
                        </Link>
                        <Link href={`/advertiser/campaigns/${campaign.id}/analytics`}>
                          <Button variant="secondary" size="sm">Analytics</Button>
                        </Link>
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

