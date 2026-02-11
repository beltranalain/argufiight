'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/fetchClient'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Badge } from '@/components/ui/Badge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ChartDataPoint {
  date: string
  impressions: number
  clicks: number
}

interface CampaignAnalytics {
  id: string
  name: string
  status: string
  type: string
  budget: number
  startDate: string
  endDate: string
  impressions: number
  clicks: number
  ctr: number
  spent: number
  remaining: number
  chartData?: ChartDataPoint[]
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

const formatStatus = (status: string) => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
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
    case 'COMPLETED':
      return 'bg-gray-500/20 text-gray-400'
    default:
      return 'bg-gray-500/20 text-gray-400'
  }
}

export default function CampaignAnalyticsPage() {
  const params = useParams()
  const campaignId = params.id as string

  const analyticsQuery = useQuery({
    queryKey: ['advertiser', 'campaign', campaignId, 'analytics'],
    queryFn: () => fetchClient<{ analytics: CampaignAnalytics }>(`/api/advertiser/campaigns/${campaignId}/analytics`),
    enabled: !!campaignId,
  })

  const analytics = analyticsQuery.data?.analytics ?? null

  if (analyticsQuery.isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="ADVERTISER" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (analyticsQuery.isError) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="ADVERTISER" />
        <div className="pt-20 px-4 md:px-8 pb-8">
          <ErrorDisplay
            title="Failed to load analytics"
            message="Could not load campaign analytics. Please try again."
            onRetry={() => analyticsQuery.refetch()}
          />
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
              <Badge className={getStatusColor(analytics.status)}>
                {formatStatus(analytics.status)}
              </Badge>
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

          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">Performance Over Time</h2>
            </CardHeader>
            <CardBody>
              {analytics.chartData && analytics.chartData.length > 0 ? (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="date"
                        stroke="#9CA3AF"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                        labelStyle={{ color: '#F9FAFB' }}
                      />
                      <Legend
                        wrapperStyle={{ color: '#F9FAFB' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="impressions"
                        stroke="#00D9FF"
                        strokeWidth={2}
                        name="Impressions"
                        dot={{ fill: '#00D9FF', r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="clicks"
                        stroke="#10B981"
                        strokeWidth={2}
                        name="Clicks"
                        dot={{ fill: '#10B981', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center bg-bg-secondary rounded-lg">
                  <p className="text-text-secondary">
                    No performance data yet. Data will appear once the campaign is active and receiving impressions.
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Contracts Breakdown - Only show for Creator Sponsorship campaigns */}
          {analytics.type === 'CREATOR_SPONSORSHIP' && (
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
                            <p>Status: {formatStatus(contract.status)}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(contract.status)}>
                          {formatStatus(contract.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
