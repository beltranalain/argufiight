'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Badge } from '@/components/ui/Badge'

interface CampaignAnalytics {
  id: string
  name: string
  status: string
  budget: number
  startDate: string
  endDate: string
  impressions: number
  clicks: number
  ctr: number
  spent: number
  remaining: number
  contracts: Array<{
    id: string
    creator: {
      username: string
    }
    impressionsDelivered: number
    clicksDelivered: number
    status: string
  }>
}

export default function CampaignAnalyticsPage() {
  const params = useParams()
  const campaignId = params.id as string
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [campaignId])

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/advertiser/campaigns/${campaignId}/analytics`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
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
      case 'COMPLETED':
        return 'bg-gray-500/20 text-gray-400'
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

  if (!analytics) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="ADVERTISER" />
        <div className="pt-20 px-4 md:px-8 pb-8">
          <Card>
            <CardBody>
              <p className="text-text-secondary">Campaign not found</p>
            </CardBody>
          </Card>
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
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-text-primary">{analytics.name}</h1>
              <Badge className={getStatusColor(analytics.status)}>{analytics.status}</Badge>
            </div>
            <p className="text-text-secondary">
              {new Date(analytics.startDate).toLocaleDateString()} -{' '}
              {new Date(analytics.endDate).toLocaleDateString()}
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardBody>
                <div className="text-2xl font-bold text-electric-blue">
                  {analytics.impressions.toLocaleString()}
                </div>
                <div className="text-text-secondary">Total Impressions</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-2xl font-bold text-cyber-green">
                  {analytics.clicks.toLocaleString()}
                </div>
                <div className="text-text-secondary">Total Clicks</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-2xl font-bold text-neon-orange">
                  {analytics.ctr.toFixed(2)}%
                </div>
                <div className="text-text-secondary">Click-Through Rate</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-2xl font-bold text-text-primary">
                  ${analytics.spent.toLocaleString()}
                </div>
                <div className="text-text-secondary">
                  Spent / ${analytics.budget.toLocaleString()} Budget
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Performance Chart Placeholder */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">Performance Over Time</h2>
            </CardHeader>
            <CardBody>
              <div className="h-64 flex items-center justify-center bg-bg-secondary rounded-lg">
                <p className="text-text-secondary">
                  Chart visualization coming soon (impressions/clicks over time)
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Contracts Breakdown */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">Creator Contracts</h2>
            </CardHeader>
            <CardBody>
              {analytics.contracts.length === 0 ? (
                <p className="text-text-secondary">No contracts for this campaign</p>
              ) : (
                <div className="space-y-4">
                  {analytics.contracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-bg-tertiary"
                    >
                      <div>
                        <p className="font-semibold text-text-primary">
                          @{contract.creator.username}
                        </p>
                        <div className="text-sm text-text-secondary space-y-1 mt-1">
                          <p>
                            {contract.impressionsDelivered.toLocaleString()} impressions •{' '}
                            {contract.clicksDelivered.toLocaleString()} clicks
                          </p>
                          <p>Status: {contract.status}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(contract.status)}>
                        {contract.status}
                      </Badge>
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

