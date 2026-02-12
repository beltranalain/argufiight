'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/Loading'

const FEATURE_GROUPS = [
  {
    title: 'Social Features',
    description: 'Control social interaction features available to users',
    features: [
      { key: 'FEATURE_LIKES_ENABLED', label: 'Likes', desc: 'Allow users to like debates' },
      { key: 'FEATURE_SAVES_ENABLED', label: 'Saves', desc: 'Allow users to bookmark/save debates' },
      { key: 'FEATURE_SHARES_ENABLED', label: 'Shares', desc: 'Allow users to share debates' },
      { key: 'FEATURE_COMMENTS_ENABLED', label: 'Comments', desc: 'Allow users to comment on debates' },
      { key: 'FEATURE_FOLLOWS_ENABLED', label: 'Follows', desc: 'Allow users to follow other users' },
    ],
  },
  {
    title: 'Game Mechanics',
    description: 'Tournament, belt, coin, and challenge systems',
    features: [
      { key: 'FEATURE_TOURNAMENTS_ENABLED', label: 'Tournaments', desc: 'Tournament bracket system (bracket, championship, king of the hill)' },
      { key: 'FEATURE_BELTS_ENABLED', label: 'Belt Championships', desc: 'Belt challenge and defense system' },
      { key: 'FEATURE_COINS_ENABLED', label: 'Coin Economy', desc: 'Virtual currency for in-app transactions' },
      { key: 'FEATURE_DAILY_LOGIN_REWARD_ENABLED', label: 'Daily Login Rewards', desc: 'Reward coins for consecutive daily logins' },
      { key: 'FEATURE_DAILY_CHALLENGES_ENABLED', label: 'Daily Challenges', desc: 'Daily debate challenges for users' },
      { key: 'FEATURE_STREAKS_ENABLED', label: 'Debate Streaks', desc: 'Track consecutive debate participation streaks' },
      { key: 'FEATURE_PREDICTIONS_ENABLED', label: 'Predictions', desc: 'Allow users to predict debate outcomes' },
    ],
  },
  {
    title: 'Communication',
    description: 'Direct messaging between users',
    features: [
      { key: 'FEATURE_MESSAGING_ENABLED', label: 'Direct Messaging', desc: 'Allow users to send private messages' },
    ],
  },
  {
    title: 'Content & Marketing',
    description: 'Blog, SEO tools, and marketing features',
    features: [
      { key: 'FEATURE_BLOG_ENABLED', label: 'Blog', desc: 'Blog posts with SEO metadata' },
      { key: 'FEATURE_SEO_TOOLS_ENABLED', label: 'SEO Tools', desc: 'SEO audit engine and Google Search Console integration' },
      { key: 'FEATURE_AI_MARKETING_ENABLED', label: 'AI Marketing', desc: 'AI-powered blog generation, social posts, and marketing strategies' },
    ],
  },
  {
    title: 'Business Modules',
    description: 'Payment, subscription, and monetization features',
    features: [
      { key: 'FEATURE_SUBSCRIPTIONS_ENABLED', label: 'Subscriptions', desc: 'FREE/PRO tier system with feature limits and Stripe billing' },
      { key: 'FEATURE_COIN_PURCHASES_ENABLED', label: 'Coin Purchases', desc: 'Allow buying coins with real money via Stripe' },
      { key: 'FEATURE_ADVERTISING_ENABLED', label: 'Advertising System', desc: 'Advertiser dashboard, campaigns, and ad placements' },
      { key: 'FEATURE_CREATOR_MARKETPLACE_ENABLED', label: 'Creator Marketplace', desc: 'Creator dashboard, earnings, offers, and payouts' },
    ],
  },
]

// All feature keys with their defaults
const ALL_FEATURE_DEFAULTS: Record<string, boolean> = {}
for (const group of FEATURE_GROUPS) {
  for (const f of group.features) {
    // Business modules default OFF, everything else ON
    ALL_FEATURE_DEFAULTS[f.key] = !f.key.includes('SUBSCRIPTIONS') &&
      !f.key.includes('COIN_PURCHASES') &&
      !f.key.includes('ADVERTISING') &&
      !f.key.includes('CREATOR_MARKETPLACE') &&
      !f.key.includes('AI_MARKETING')
  }
}

export default function FeaturesTab() {
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [features, setFeatures] = useState<Record<string, boolean>>(ALL_FEATURE_DEFAULTS)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        const loaded: Record<string, boolean> = {}
        for (const key of Object.keys(ALL_FEATURE_DEFAULTS)) {
          if (data[key] !== undefined) {
            loaded[key] = data[key] === 'true'
          } else {
            loaded[key] = ALL_FEATURE_DEFAULTS[key]
          }
        }
        setFeatures(loaded)
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
        body: JSON.stringify(
          Object.fromEntries(
            Object.entries(features).map(([key, value]) => [key, value.toString()])
          )
        ),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save settings')
      }

      showToast({
        type: 'success',
        title: 'Settings Saved',
        description: 'Feature flags have been updated. Changes take effect within 5 minutes.',
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
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Feature Flags</h2>
        <p className="text-text-secondary">Enable or disable platform modules. Changes propagate within 5 minutes.</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {FEATURE_GROUPS.map((group) => (
          <Card key={group.title}>
            <CardHeader>
              <h3 className="text-xl font-bold text-white">{group.title}</h3>
              <p className="text-sm text-text-secondary mt-1">{group.description}</p>
            </CardHeader>
            <CardBody className="space-y-4">
              {group.features.map((feature) => (
                <div key={feature.key} className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                  <div>
                    <p className="font-semibold text-white">{feature.label}</p>
                    <p className="text-sm text-text-secondary">{feature.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={features[feature.key] ?? false}
                      onChange={(e) =>
                        setFeatures((prev) => ({
                          ...prev,
                          [feature.key]: e.target.checked,
                        }))
                      }
                    />
                    <div className="w-11 h-6 bg-bg-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-blue"></div>
                  </label>
                </div>
              ))}
            </CardBody>
          </Card>
        ))}

        <div className="flex justify-end pt-4">
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isLoading}
          >
            Save Feature Settings
          </Button>
        </div>
      </div>
    </div>
  )
}
