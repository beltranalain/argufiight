'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/fetchClient'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/Loading'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'

interface CreatorSettings {
  profileBannerPrice: number | null
  postDebatePrice: number | null
  debateWidgetPrice: number | null
  profileBannerAvailable: boolean
  postDebateAvailable: boolean
  debateWidgetAvailable: boolean
  creatorStatus: string | null
}

interface SettingsResponse {
  user: {
    isCreator: boolean
    profileBannerPrice: number | null
    postDebatePrice: number | null
    debateWidgetPrice: number | null
    profileBannerAvailable: boolean
    postDebateAvailable: boolean
    debateWidgetAvailable: boolean
    creatorStatus: string | null
  }
}

export function SettingsTab() {
  const router = useRouter()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [settings, setSettings] = useState<CreatorSettings>({
    profileBannerPrice: 300,
    postDebatePrice: 150,
    debateWidgetPrice: 200,
    profileBannerAvailable: true,
    postDebateAvailable: true,
    debateWidgetAvailable: true,
    creatorStatus: null,
  })

  const { data, isLoading, error, refetch } = useQuery<SettingsResponse>({
    queryKey: ['creator', 'settings'],
    queryFn: () => fetchClient<SettingsResponse>('/api/creator/settings'),
    retry: (failureCount, error) => {
      // Don't retry on 403 (not a creator) or 401 (unauthorized)
      if (error instanceof Error && 'status' in error) {
        const status = (error as any).status
        if (status === 403 || status === 401) return false
      }
      return failureCount < 3
    },
  })

  const isCreator = data?.user?.isCreator || false

  // Sync fetched data into local settings state for form editing
  useEffect(() => {
    if (data?.user) {
      setSettings({
        profileBannerPrice: data.user.profileBannerPrice ? Number(data.user.profileBannerPrice) : 300,
        postDebatePrice: data.user.postDebatePrice ? Number(data.user.postDebatePrice) : 150,
        debateWidgetPrice: data.user.debateWidgetPrice ? Number(data.user.debateWidgetPrice) : 200,
        profileBannerAvailable: data.user.profileBannerAvailable ?? true,
        postDebateAvailable: data.user.postDebateAvailable ?? true,
        debateWidgetAvailable: data.user.debateWidgetAvailable ?? true,
        creatorStatus: data.user.creatorStatus || null,
      })
    }
  }, [data])

  const enableCreatorMutation = useMutation({
    mutationFn: () => fetchClient('/api/creators/enable', { method: 'POST' }),
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Creator Mode Enabled',
        description: 'You can now configure your ad slot settings.',
      })
      queryClient.invalidateQueries({ queryKey: ['creator', 'settings'] })
    },
    onError: (error: any) => {
      showToast({
        type: 'error',
        title: 'Error',
        description: error?.message || 'Failed to enable creator mode',
      })
    },
  })

  const saveSettingsMutation = useMutation({
    mutationFn: () =>
      fetchClient('/api/creator/settings', {
        method: 'PUT',
        body: JSON.stringify({
          profileBannerPrice: settings.profileBannerPrice ? Number(settings.profileBannerPrice) : null,
          postDebatePrice: settings.postDebatePrice ? Number(settings.postDebatePrice) : null,
          debateWidgetPrice: settings.debateWidgetPrice ? Number(settings.debateWidgetPrice) : null,
          profileBannerAvailable: settings.profileBannerAvailable,
          postDebateAvailable: settings.postDebateAvailable,
          debateWidgetAvailable: settings.debateWidgetAvailable,
        }),
      }),
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Settings Saved',
        description: 'Your ad slot settings have been updated.',
      })
      queryClient.invalidateQueries({ queryKey: ['creator', 'settings'] })
    },
    onError: (error: any) => {
      showToast({
        type: 'error',
        title: 'Error',
        description: error?.message || 'Failed to save settings.',
      })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error && !(error instanceof Error && 'status' in error && (error as any).status === 403)) {
    return (
      <ErrorDisplay
        title="Failed to load settings"
        message={error instanceof Error ? error.message : 'Something went wrong. Please try again.'}
        onRetry={() => refetch()}
      />
    )
  }

  if (!isCreator) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-text-primary mb-2">Creator Mode Not Enabled</h2>
            <p className="text-text-secondary mb-6">
              Enable creator mode to configure your ad slot settings and start earning.
            </p>
            <Button
              variant="primary"
              onClick={() => enableCreatorMutation.mutate()}
              isLoading={enableCreatorMutation.isPending}
            >
              Enable Creator Mode
            </Button>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Ad Slot Settings</h2>
          <p className="text-text-secondary mt-1">
            Configure your ad slot prices and availability
            {settings.creatorStatus && (
              <span className="ml-2">
                <Badge className="bg-electric-blue/20 text-electric-blue">
                  {settings.creatorStatus}
                </Badge>
              </span>
            )}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => saveSettingsMutation.mutate()}
          isLoading={saveSettingsMutation.isPending}
        >
          Save Settings
        </Button>
      </div>

      {/* Profile Banner */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-text-primary">Profile Banner</h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.profileBannerAvailable}
                onChange={(e) =>
                  setSettings({ ...settings, profileBannerAvailable: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue"></div>
            </label>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Price per month ($)
              </label>
              <Input
                type="number"
                value={settings.profileBannerPrice || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    profileBannerPrice: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="300"
                disabled={!settings.profileBannerAvailable}
              />
            </div>
            <p className="text-sm text-text-secondary">
              Displayed at the top of your profile page. Great for brand awareness.
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Post-Debate Ad */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-text-primary">Post-Debate Ad</h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.postDebateAvailable}
                onChange={(e) =>
                  setSettings({ ...settings, postDebateAvailable: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue"></div>
            </label>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Price per ad ($)
              </label>
              <Input
                type="number"
                value={settings.postDebatePrice || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    postDebatePrice: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="150"
                disabled={!settings.postDebateAvailable}
              />
            </div>
            <p className="text-sm text-text-secondary">
              Shown after you win a debate. Captures engaged viewers at a high-momentum moment.
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Debate Widget */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-text-primary">Debate Widget</h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.debateWidgetAvailable}
                onChange={(e) =>
                  setSettings({ ...settings, debateWidgetAvailable: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue"></div>
            </label>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Price per debate ($)
              </label>
              <Input
                type="number"
                value={settings.debateWidgetPrice || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    debateWidgetPrice: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="200"
                disabled={!settings.debateWidgetAvailable}
              />
            </div>
            <p className="text-sm text-text-secondary">
              Displayed in the sidebar during live debates. Reaches active viewers in real-time.
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Stripe Setup */}
      <Card className="border-electric-blue/50">
        <CardHeader>
          <h3 className="text-lg font-bold text-text-primary">Payment Setup</h3>
        </CardHeader>
        <CardBody>
          <p className="text-text-secondary mb-4">
            Complete Stripe onboarding to receive payouts. You'll need to provide tax information and bank details.
          </p>
          <Button
            variant="primary"
            onClick={() => router.push('/creator/setup')}
          >
            Complete Stripe Setup
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}
