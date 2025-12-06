'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isCreator, setIsCreator] = useState(false)
  const [isEnablingCreator, setIsEnablingCreator] = useState(false)
  const [settings, setSettings] = useState<CreatorSettings>({
    profileBannerPrice: 300,
    postDebatePrice: 150,
    debateWidgetPrice: 200,
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
        setIsCreator(true)
        setSettings({
          profileBannerPrice: data.user.profileBannerPrice ? Number(data.user.profileBannerPrice) : 300,
          postDebatePrice: data.user.postDebatePrice ? Number(data.user.postDebatePrice) : 150,
          debateWidgetPrice: data.user.debateWidgetPrice ? Number(data.user.debateWidgetPrice) : 200,
          profileBannerAvailable: data.user.profileBannerAvailable ?? true,
          postDebateAvailable: data.user.postDebateAvailable ?? true,
          debateWidgetAvailable: data.user.debateWidgetAvailable ?? true,
          creatorStatus: data.user.creatorStatus || null,
        })
      } else if (response.status === 403) {
        // Creator mode not enabled - show preview mode with default values
        setIsCreator(false)
        // Keep default preview values
      } else if (response.status === 401) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      setIsCreator(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnableCreator = async () => {
    setIsEnablingCreator(true)
    try {
      const response = await fetch('/api/creators/enable', {
        method: 'POST',
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Creator Mode Enabled',
          description: 'You can now configure your ad slot settings.',
        })
        // Refresh settings
        await fetchSettings()
      } else {
        const errorData = await response.json()
        showToast({
          type: 'error',
          title: 'Error',
          description: errorData.error || 'Failed to enable creator mode',
        })
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to enable creator mode',
      })
    } finally {
      setIsEnablingCreator(false)
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
              {isCreator 
                ? 'Configure your ad slot prices and availability. Advertisers will see these when making offers.'
                : 'Preview how ad slots work on the platform. Enable creator mode to start earning from advertisers.'}
            </p>
            {!isCreator && (
              <div className="mt-4 p-4 bg-electric-blue/10 border border-electric-blue/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-text-primary mb-1">Creator Mode Not Enabled</h3>
                    <p className="text-sm text-text-secondary">
                      Enable creator mode to configure and monetize your ad slots. You're currently viewing a preview.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleEnableCreator}
                    disabled={isEnablingCreator}
                  >
                    {isEnablingCreator ? 'Enabling...' : 'Enable Creator Mode'}
                  </Button>
                </div>
              </div>
            )}
            {isCreator && settings.creatorStatus && (
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
                    disabled={!isCreator}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 bg-bg-tertiary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-electric-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue ${!isCreator ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                </label>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {/* Preview */}
                <div className="p-4 bg-bg-secondary rounded-lg border border-bg-tertiary">
                  <p className="text-xs text-text-muted mb-2">Preview:</p>
                  <div className="bg-bg-tertiary rounded h-24 flex items-center justify-center border-2 border-dashed border-bg-tertiary">
                    <p className="text-text-muted text-sm">Profile Banner Ad Slot (728x90px)</p>
                  </div>
                  <p className="text-xs text-text-muted mt-2">
                    This banner appears at the top of your profile page when an advertiser purchases this slot.
                  </p>
                </div>
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
                    disabled={!isCreator || !settings.profileBannerAvailable}
                  />
                  <p className="text-xs text-text-muted mt-1">
                    {isCreator 
                      ? 'Set your price for profile banner ad placement'
                      : 'Default preview price. Enable creator mode to set your own pricing.'}
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
                    disabled={!isCreator}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 bg-bg-tertiary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-electric-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue ${!isCreator ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                </label>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {/* Preview */}
                <div className="p-4 bg-bg-secondary rounded-lg border border-bg-tertiary">
                  <p className="text-xs text-text-muted mb-2">Preview:</p>
                  <div className="bg-bg-tertiary rounded p-4 border-2 border-dashed border-bg-tertiary">
                    <div className="text-sm text-text-muted mb-2">After debate completion:</div>
                    <div className="bg-bg-primary rounded h-32 flex items-center justify-center">
                      <p className="text-text-muted text-sm">Post-Debate Ad Slot (300x250px)</p>
                    </div>
                  </div>
                  <p className="text-xs text-text-muted mt-2">
                    This ad appears after viewers see the debate results, when you win a debate.
                  </p>
                </div>
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
                    disabled={!isCreator || !settings.postDebateAvailable}
                  />
                  <p className="text-xs text-text-muted mt-1">
                    {isCreator 
                      ? 'Set your price for post-debate ad placement'
                      : 'Default preview price. Enable creator mode to set your own pricing.'}
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
                    disabled={!isCreator}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 bg-bg-tertiary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-electric-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue ${!isCreator ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                </label>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {/* Preview */}
                <div className="p-4 bg-bg-secondary rounded-lg border border-bg-tertiary">
                  <p className="text-xs text-text-muted mb-2">Preview:</p>
                  <div className="flex gap-4">
                    <div className="flex-1 bg-bg-primary rounded p-3 border border-bg-tertiary">
                      <div className="text-xs text-text-muted mb-2">Debate Content</div>
                      <div className="h-32 bg-bg-secondary rounded"></div>
                    </div>
                    <div className="w-48 bg-bg-tertiary rounded p-3 border-2 border-dashed border-bg-tertiary">
                      <div className="text-xs text-text-muted mb-2">Sidebar</div>
                      <div className="bg-bg-primary rounded h-24 flex items-center justify-center">
                        <p className="text-text-muted text-xs">Widget Ad (160x600px)</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-text-muted mt-2">
                    This widget appears in the sidebar while viewers are watching your live debates.
                  </p>
                </div>
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
                    disabled={!isCreator || !settings.debateWidgetAvailable}
                  />
                  <p className="text-xs text-text-muted mt-1">
                    {isCreator 
                      ? 'Set your price for debate widget ad placement'
                      : 'Default preview price. Enable creator mode to set your own pricing.'}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => router.push('/creator/dashboard')}
            >
              {isCreator ? 'Cancel' : 'Back to Dashboard'}
            </Button>
            {isCreator && (
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

