'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/Loading'

export default function AdminFeaturesPage() {
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  
  // Feature flags
  const [features, setFeatures] = useState({
    FEATURE_LIKES_ENABLED: true,
    FEATURE_SAVES_ENABLED: true,
    FEATURE_SHARES_ENABLED: true,
    FEATURE_COMMENTS_ENABLED: true,
    FEATURE_FOLLOWS_ENABLED: true,
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        
        // Load feature flags (default to true if not set)
        setFeatures({
          FEATURE_LIKES_ENABLED: data.FEATURE_LIKES_ENABLED === 'true' || data.FEATURE_LIKES_ENABLED === undefined,
          FEATURE_SAVES_ENABLED: data.FEATURE_SAVES_ENABLED === 'true' || data.FEATURE_SAVES_ENABLED === undefined,
          FEATURE_SHARES_ENABLED: data.FEATURE_SHARES_ENABLED === 'true' || data.FEATURE_SHARES_ENABLED === undefined,
          FEATURE_COMMENTS_ENABLED: data.FEATURE_COMMENTS_ENABLED === 'true' || data.FEATURE_COMMENTS_ENABLED === undefined,
          FEATURE_FOLLOWS_ENABLED: data.FEATURE_FOLLOWS_ENABLED === 'true' || data.FEATURE_FOLLOWS_ENABLED === undefined,
        })
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setIsFetching(false)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...Object.fromEntries(
            Object.entries(features).map(([key, value]) => [key, value.toString()])
          ),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save settings')
      }

      showToast({
        type: 'success',
        title: 'Settings Saved',
        description: 'Feature flags have been updated',
      })
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        description: error.message || 'Please try again',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-2">Feature Flags</h1>
      <p className="text-text-secondary mb-8">Enable or disable social interaction features</p>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Social Features</h2>
            <p className="text-sm text-text-secondary mt-1">
              Control which social interaction features are available to users
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
              <div>
                <p className="font-semibold text-white">Likes</p>
                <p className="text-sm text-text-secondary">
                  Allow users to like debates
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={features.FEATURE_LIKES_ENABLED}
                  onChange={(e) =>
                    setFeatures((prev) => ({
                      ...prev,
                      FEATURE_LIKES_ENABLED: e.target.checked,
                    }))
                  }
                />
                <div className="w-11 h-6 bg-bg-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
              <div>
                <p className="font-semibold text-white">Saves</p>
                <p className="text-sm text-text-secondary">
                  Allow users to bookmark/save debates
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={features.FEATURE_SAVES_ENABLED}
                  onChange={(e) =>
                    setFeatures((prev) => ({
                      ...prev,
                      FEATURE_SAVES_ENABLED: e.target.checked,
                    }))
                  }
                />
                <div className="w-11 h-6 bg-bg-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
              <div>
                <p className="font-semibold text-white">Shares</p>
                <p className="text-sm text-text-secondary">
                  Allow users to share debates
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={features.FEATURE_SHARES_ENABLED}
                  onChange={(e) =>
                    setFeatures((prev) => ({
                      ...prev,
                      FEATURE_SHARES_ENABLED: e.target.checked,
                    }))
                  }
                />
                <div className="w-11 h-6 bg-bg-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
              <div>
                <p className="font-semibold text-white">Comments</p>
                <p className="text-sm text-text-secondary">
                  Allow users to comment on debates
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={features.FEATURE_COMMENTS_ENABLED}
                  onChange={(e) =>
                    setFeatures((prev) => ({
                      ...prev,
                      FEATURE_COMMENTS_ENABLED: e.target.checked,
                    }))
                  }
                />
                <div className="w-11 h-6 bg-bg-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
              <div>
                <p className="font-semibold text-white">Follows</p>
                <p className="text-sm text-text-secondary">
                  Allow users to follow other users
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={features.FEATURE_FOLLOWS_ENABLED}
                  onChange={(e) =>
                    setFeatures((prev) => ({
                      ...prev,
                      FEATURE_FOLLOWS_ENABLED: e.target.checked,
                    }))
                  }
                />
                <div className="w-11 h-6 bg-bg-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue"></div>
              </label>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={isLoading}
              >
                Save Feature Settings
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}



