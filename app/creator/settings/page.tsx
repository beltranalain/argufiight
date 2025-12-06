'use client'

import { useState, useEffect } from 'react'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/Loading'
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

export default function CreatorSettingsPage() {
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<CreatorSettings>({
    profileBannerPrice: null,
    postDebatePrice: null,
    debateWidgetPrice: null,
    profileBannerAvailable: true,
    postDebateAvailable: true,
    debateWidgetAvailable: true,
    creatorStatus: null,
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/creator/profile')
      if (response.ok) {
        const data = await response.json()
        setSettings({
          profileBannerPrice: data.user.profileBannerPrice ? Number(data.user.profileBannerPrice) : null,
          postDebatePrice: data.user.postDebatePrice ? Number(data.user.postDebatePrice) : null,
          debateWidgetPrice: data.user.debateWidgetPrice ? Number(data.user.debateWidgetPrice) : null,
          profileBannerAvailable: data.user.profileBannerAvailable ?? true,
          postDebateAvailable: data.user.postDebateAvailable ?? true,
          debateWidgetAvailable: data.user.debateWidgetAvailable ?? true,
          creatorStatus: data.user.creatorStatus || null,
        })
      } else {
        if (response.status === 403) {
          showToast({
            type: 'error',
            title: 'Access Denied',
            description: 'Creator mode is not enabled for your account.',
          })
          setTimeout(() => {
            window.location.href = '/creator/dashboard'
          }, 2000)
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load settings.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/creator/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileBannerPrice: settings.profileBannerPrice ? Number(settings.profileBannerPrice) : null,
          postDebatePrice: settings.postDebatePrice ? Number(settings.postDebatePrice) : null,
          debateWidgetPrice: settings.debateWidgetPrice ? Number(settings.debateWidgetPrice) : null,
          profileBannerAvailable: settings.profileBannerAvailable,
          postDebateAvailable: settings.postDebateAvailable,
          debateWidgetAvailable: settings.debateWidgetAvailable,
        }),
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Settings Saved',
          description: 'Your ad slot settings have been updated.',
        })
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save settings')
      }
    } catch (error: any) {
      console.error('Failed to save settings:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to save settings.',
      })
    } finally {
      setIsSaving(false)
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
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Ad Slot Settings</h1>
            <p className="text-text-secondary mt-2">
              Configure your ad slot prices and availability. Advertisers will see these when making offers.
            </p>
            {settings.creatorStatus && (
              <div className="mt-3">
                <Badge className="bg-electric-blue/20 text-electric-blue">
                  {settings.creatorStatus} Tier
                </Badge>
              </div>
            )}
          </div>

          {/* Profile Banner Slot */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">Profile Banner</h2>
                  <p className="text-sm text-text-secondary mt-1">
                    Displayed at the top of your profile page
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.profileBannerAvailable}
                    onChange={(e) =>
                      setSettings({ ...settings, profileBannerAvailable: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-bg-tertiary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-electric-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue"></div>
                </label>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Price (USD)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.profileBannerPrice || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        profileBannerPrice: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    placeholder="300.00"
                    disabled={!settings.profileBannerAvailable}
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Set your price for profile banner ad placement
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Post-Debate Slot */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">Post-Debate Ad</h2>
                  <p className="text-sm text-text-secondary mt-1">
                    Displayed after a debate victory
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.postDebateAvailable}
                    onChange={(e) =>
                      setSettings({ ...settings, postDebateAvailable: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-bg-tertiary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-electric-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue"></div>
                </label>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Price (USD)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.postDebatePrice || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        postDebatePrice: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    placeholder="150.00"
                    disabled={!settings.postDebateAvailable}
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Set your price for post-debate ad placement
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Debate Widget Slot */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">Debate Widget</h2>
                  <p className="text-sm text-text-secondary mt-1">
                    Displayed in the sidebar during live debates
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.debateWidgetAvailable}
                    onChange={(e) =>
                      setSettings({ ...settings, debateWidgetAvailable: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-bg-tertiary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-electric-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue"></div>
                </label>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Price (USD)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.debateWidgetPrice || ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        debateWidgetPrice: e.target.value ? parseFloat(e.target.value) : null,
                      })
                    }
                    placeholder="200.00"
                    disabled={!settings.debateWidgetAvailable}
                  />
                  <p className="text-xs text-text-muted mt-1">
                    Set your price for debate widget ad placement
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => window.location.href = '/creator/dashboard'}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

