'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/fetchClient'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'
import { ContentCalendar } from '@/components/admin/marketing/ContentCalendar'
import { ContentGenerators } from '@/components/admin/marketing/ContentGenerators'
import { AnalyticsDashboard } from '@/components/admin/marketing/AnalyticsDashboard'
import { SocialPostsManager } from '@/components/admin/marketing/SocialPostsManager'

interface MarketingStrategy {
  id: string
  name: string
  description: string | null
  startDate: string
  endDate: string
  status: string
  goals: string[]
  themes: string[]
  platforms: string[]
  frequency: string | null
  createdAt: string
}

export default function MarketingDashboardPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get('tab') as 'strategy' | 'calendar' | 'posts' | 'analytics' | null
  const [activeTab, setActiveTab] = useState<'strategy' | 'calendar' | 'posts' | 'analytics'>(
    tabFromUrl || 'strategy'
  )

  // Strategy generation form
  const [strategyName, setStrategyName] = useState('')
  const [strategyStartDate, setStrategyStartDate] = useState('')
  const [strategyEndDate, setStrategyEndDate] = useState('')
  const [strategyGoals, setStrategyGoals] = useState('')
  const [strategyPlatforms, setStrategyPlatforms] = useState('Instagram, LinkedIn, Twitter')

  useEffect(() => {
    if (tabFromUrl && ['strategy', 'calendar', 'posts', 'analytics'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  const { data: strategiesData, isLoading: isLoadingStrategies, error: strategiesError, refetch: refetchStrategies } = useQuery<{ strategies: MarketingStrategy[] }>({
    queryKey: ['admin', 'marketing', 'strategies'],
    queryFn: () => fetchClient<{ strategies: MarketingStrategy[] }>('/api/admin/marketing/strategy'),
  })

  const strategies = strategiesData?.strategies ?? []

  const generateStrategyMutation = useMutation({
    mutationFn: (payload: {
      name: string
      startDate: string
      endDate: string
      goals?: string
      platforms?: string
    }) =>
      fetchClient<{ strategy: MarketingStrategy }>('/api/admin/marketing/strategy/generate', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      showToast({
        type: 'success',
        title: 'Strategy Generated!',
        description: `"${data.strategy.name}" has been created successfully`,
      })

      // Reset form
      setStrategyName('')
      setStrategyStartDate('')
      setStrategyEndDate('')
      setStrategyGoals('')
      setStrategyPlatforms('Instagram, LinkedIn, Twitter')

      // Refresh strategies
      queryClient.invalidateQueries({ queryKey: ['admin', 'marketing', 'strategies'] })
    },
    onError: (error: any) => {
      showToast({
        type: 'error',
        title: 'Generation Failed',
        description: error.message || 'Failed to generate marketing strategy',
      })
    },
  })

  const handleGenerateStrategy = () => {
    if (!strategyName || !strategyStartDate || !strategyEndDate) {
      showToast({
        type: 'error',
        title: 'Missing Fields',
        description: 'Please fill in name, start date, and end date',
      })
      return
    }

    generateStrategyMutation.mutate({
      name: strategyName,
      startDate: strategyStartDate,
      endDate: strategyEndDate,
      goals: strategyGoals || undefined,
      platforms: strategyPlatforms || undefined,
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Marketing Agent</h1>
          <p className="text-text-secondary">
            Blaze-like AI marketing platform - Strategy, content, and analytics all in one place
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-bg-tertiary">
        {[
          { id: 'strategy', label: 'Strategy', icon: '📋' },
          { id: 'calendar', label: 'Content Calendar', icon: '📅' },
          { id: 'posts', label: 'Posts', icon: '📱' },
          { id: 'analytics', label: 'Analytics', icon: '📊' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-electric-blue text-electric-blue'
                : 'border-transparent text-text-secondary hover:text-white'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Strategy Tab */}
      {activeTab === 'strategy' && (
        <div className="space-y-6">
          {/* Generate Strategy Card */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-white">Generate Marketing Strategy</h2>
              <p className="text-sm text-text-secondary mt-1">
                Get a complete 12-month AI-powered marketing strategy in minutes
              </p>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Strategy Name *
                    </label>
                    <Input
                      value={strategyName}
                      onChange={(e) => setStrategyName(e.target.value)}
                      placeholder="e.g., Q1 2025 Marketing Strategy"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Platforms
                    </label>
                    <Input
                      value={strategyPlatforms}
                      onChange={(e) => setStrategyPlatforms(e.target.value)}
                      placeholder="Instagram, LinkedIn, Twitter"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Start Date *
                    </label>
                    <Input
                      type="date"
                      value={strategyStartDate}
                      onChange={(e) => setStrategyStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      End Date *
                    </label>
                    <Input
                      type="date"
                      value={strategyEndDate}
                      onChange={(e) => setStrategyEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Marketing Goals (optional)
                  </label>
                    <Input
                      value={strategyGoals}
                      onChange={(e) => setStrategyGoals(e.target.value)}
                      placeholder="e.g., Increase engagement, Grow awareness, Drive signups"
                    />
                    <p className="text-xs text-text-secondary mt-1">
                      Comma-separated list of marketing goals
                    </p>
                  </div>
                <Button
                  variant="primary"
                  onClick={handleGenerateStrategy}
                  isLoading={generateStrategyMutation.isPending}
                  disabled={!strategyName || !strategyStartDate || !strategyEndDate}
                >
                  Generate Strategy
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Strategies List */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-white">Your Marketing Strategies</h2>
            </CardHeader>
            <CardBody>
              {isLoadingStrategies ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : strategiesError ? (
                <ErrorDisplay
                  title="Failed to load strategies"
                  message={strategiesError instanceof Error ? strategiesError.message : 'Something went wrong.'}
                  onRetry={() => refetchStrategies()}
                />
              ) : strategies.length === 0 ? (
                <p className="text-text-secondary text-center py-8">
                  No strategies yet. Generate your first one above!
                </p>
              ) : (
                <div className="space-y-4">
                  {strategies.map((strategy) => (
                    <div
                      key={strategy.id}
                      className="p-4 bg-bg-tertiary border border-bg-tertiary rounded-lg hover:border-electric-blue/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-white">{strategy.name}</h3>
                            <Badge
                              className={
                                strategy.status === 'ACTIVE'
                                  ? 'bg-green-500/20 text-green-400'
                                  : strategy.status === 'ARCHIVED'
                                  ? 'bg-gray-500/20 text-gray-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                              }
                            >
                              {strategy.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-text-secondary mb-2">
                            {new Date(strategy.startDate).toLocaleDateString()} -{' '}
                            {new Date(strategy.endDate).toLocaleDateString()}
                          </p>
                          {strategy.description && (
                            <p className="text-sm text-text-secondary mb-3">{strategy.description}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mb-2">
                            {Array.isArray(strategy.goals) ? strategy.goals.map((goal, idx) => (
                              <Badge key={idx} variant="default" className="text-xs">
                                {typeof goal === 'string' ? goal : JSON.stringify(goal)}
                              </Badge>
                            )) : null}
                          </div>
                          {/* Platform-Specific Content Mix */}
                          {Array.isArray(strategy.platforms) && strategy.platforms.length > 0 && (
                            <div className="mt-4 space-y-3">
                              <h4 className="text-sm font-semibold text-white">Platform-Specific Content Mix</h4>
                              {strategy.platforms.map((platform, idx) => {
                                // Handle both string and object formats
                                let platformData: any = platform
                                if (typeof platform === 'string') {
                                  try {
                                    platformData = JSON.parse(platform)
                                  } catch {
                                    // If it's not JSON, treat it as a simple platform name
                                    return (
                                      <Badge key={idx} className="bg-electric-blue/20 text-electric-blue text-xs">
                                        {platform}
                                      </Badge>
                                    )
                                  }
                                }

                                // If it's an object with platform, frequency, content_mix
                                if (platformData && typeof platformData === 'object' && platformData.platform) {
                                  return (
                                    <div key={idx} className="p-3 bg-electric-blue/10 border border-electric-blue/30 rounded-lg">
                                      <div className="flex items-start justify-between mb-2">
                                        <h5 className="font-semibold text-electric-blue">{platformData.platform}</h5>
                                        {platformData.frequency && (
                                          <Badge className="bg-electric-blue/20 text-electric-blue text-xs">
                                            {platformData.frequency}
                                          </Badge>
                                        )}
                                      </div>
                                      {platformData.content_mix && (
                                        <p className="text-sm text-text-secondary leading-relaxed">
                                          {platformData.content_mix}
                                        </p>
                                      )}
                                    </div>
                                  )
                                }

                                // Fallback for simple string platforms
                                return (
                                  <Badge key={idx} className="bg-electric-blue/20 text-electric-blue text-xs">
                                    {typeof platform === 'string' ? platform : platformData?.platform || 'Platform'}
                                  </Badge>
                                )
                              })}
                            </div>
                          )}
                          {strategy.frequency && (
                            <p className="text-xs text-text-secondary mt-2">
                              Frequency: {strategy.frequency}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <ContentCalendar />
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="space-y-6">
          <ContentGenerators />
          <SocialPostsManager />
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && <AnalyticsDashboard />}
    </div>
  )
}
