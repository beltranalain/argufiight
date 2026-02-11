'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/fetchClient'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'

interface Campaign {
  id: string
  name: string
  type: string
  status: string
  budget: number
  startDate: string
  endDate: string
  createdAt: string
  advertiser?: {
    companyName: string
  }
}

interface CampaignsResponse {
  campaigns: Campaign[]
}

interface SettingsResponse {
  ADS_PLATFORM_ENABLED?: string
  [key: string]: string | undefined
}

export default function PlatformAdsPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [platformAdsEnabled, setPlatformAdsEnabled] = useState(false)

  const { isLoading: isLoadingCampaigns, error: campaignsError, data: campaignsData } = useQuery({
    queryKey: ['admin', 'campaigns', 'PLATFORM_ADS'],
    queryFn: () => fetchClient<CampaignsResponse>('/api/admin/campaigns?type=PLATFORM_ADS'),
  })

  const { isLoading: isLoadingSettings, error: settingsError } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => fetchClient<SettingsResponse>('/api/admin/settings'),
    select: (data) => {
      setPlatformAdsEnabled(data.ADS_PLATFORM_ENABLED === 'true')
      return data
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (newValue: boolean) =>
      fetchClient<void>('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({
          ADS_PLATFORM_ENABLED: newValue.toString(),
        }),
      }),
    onSuccess: (_data, newValue) => {
      setPlatformAdsEnabled(newValue)
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
      showToast({
        type: 'success',
        title: 'Success',
        description: `Platform Ads ${newValue ? 'enabled' : 'disabled'}`,
      })
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to update setting',
      })
    },
  })

  const campaigns = campaignsData?.campaigns || []
  const isLoading = isLoadingCampaigns || isLoadingSettings
  const error = campaignsError || settingsError

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-cyber-green/20 text-cyber-green'
      case 'SCHEDULED':
        return 'bg-electric-blue/20 text-electric-blue'
      case 'PAUSED':
        return 'bg-neon-orange/20 text-neon-orange'
      default:
        return 'bg-gray-500/20 text-gray-400'
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

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="ADMIN" />
        <div className="pt-20 px-4 md:px-8 pb-8">
          <ErrorDisplay
            title="Failed to load platform ads data"
            message={error.message}
            onRetry={() => {
              queryClient.invalidateQueries({ queryKey: ['admin', 'campaigns', 'PLATFORM_ADS'] })
              queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
            }}
          />
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
              <h1 className="text-3xl font-bold text-text-primary">Platform Ads</h1>
              <p className="text-text-secondary mt-2">Manage platform-wide advertising campaigns</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-text-secondary">Platform Ads:</span>
                <button
                  onClick={() => toggleMutation.mutate(!platformAdsEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    platformAdsEnabled ? 'bg-electric-blue' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      platformAdsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm ${platformAdsEnabled ? 'text-cyber-green' : 'text-gray-400'}`}>
                  {platformAdsEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <Button variant="primary">Create Campaign</Button>
            </div>
          </div>

          {!platformAdsEnabled && (
            <Card>
              <CardBody>
                <p className="text-text-secondary">
                  Platform Ads are currently disabled. Enable the toggle above to start managing campaigns.
                </p>
              </CardBody>
            </Card>
          )}

          {platformAdsEnabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardBody>
                    <div className="text-2xl font-bold text-text-primary">{campaigns.length}</div>
                    <div className="text-text-secondary">Total Campaigns</div>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <div className="text-2xl font-bold text-cyber-green">
                      {campaigns.filter((c) => c.status === 'ACTIVE').length}
                    </div>
                    <div className="text-text-secondary">Active Campaigns</div>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <div className="text-2xl font-bold text-electric-blue">
                      ${campaigns.reduce((sum, c) => sum + Number(c.budget), 0).toLocaleString()}
                    </div>
                    <div className="text-text-secondary">Total Budget</div>
                  </CardBody>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold text-text-primary">Campaigns</h2>
                </CardHeader>
                <CardBody>
                  {campaigns.length === 0 ? (
                    <p className="text-text-secondary text-center py-8">
                      No campaigns yet. Create your first campaign to get started.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {campaigns.map((campaign) => (
                        <div
                          key={campaign.id}
                          className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-bg-tertiary"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-bold text-text-primary">{campaign.name}</h3>
                              <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                            </div>
                            <div className="text-sm text-text-secondary space-y-1">
                              <p>Budget: ${Number(campaign.budget ?? 0).toLocaleString()}</p>
                              <p>
                                Duration:{' '}
                                {new Date(campaign.startDate).toLocaleDateString()} -{' '}
                                {new Date(campaign.endDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="secondary" size="sm">
                              View
                            </Button>
                            <Button variant="secondary" size="sm">
                              Edit
                            </Button>
                          </div>
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
