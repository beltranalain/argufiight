'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'
import { ContentCalendar } from '@/components/admin/marketing/ContentCalendar'
import { ContentGenerators } from '@/components/admin/marketing/ContentGenerators'
import { AnalyticsDashboard } from '@/components/admin/marketing/AnalyticsDashboard'

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
  const [activeTab, setActiveTab] = useState<'strategy' | 'calendar' | 'posts' | 'analytics'>('strategy')
  const [strategies, setStrategies] = useState<MarketingStrategy[]>([])
  const [isLoadingStrategies, setIsLoadingStrategies] = useState(false)
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false)
  
  // Strategy generation form
  const [strategyName, setStrategyName] = useState('')
  const [strategyStartDate, setStrategyStartDate] = useState('')
  const [strategyEndDate, setStrategyEndDate] = useState('')
  const [strategyGoals, setStrategyGoals] = useState('')
  const [strategyPlatforms, setStrategyPlatforms] = useState('Instagram, LinkedIn, Twitter')

  useEffect(() => {
    fetchStrategies()
  }, [])

  const fetchStrategies = async () => {
    try {
      setIsLoadingStrategies(true)
      const response = await fetch('/api/admin/marketing/strategy')
      if (response.ok) {
        const data = await response.json()
        setStrategies(data.strategies || [])
      }
    } catch (error) {
      console.error('Failed to fetch strategies:', error)
    } finally {
      setIsLoadingStrategies(false)
    }
  }

  const handleGenerateStrategy = async () => {
    if (!strategyName || !strategyStartDate || !strategyEndDate) {
      showToast({
        type: 'error',
        title: 'Missing Fields',
        description: 'Please fill in name, start date, and end date',
      })
      return
    }

    try {
      setIsGeneratingStrategy(true)
      const response = await fetch('/api/admin/marketing/strategy/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: strategyName,
          startDate: strategyStartDate,
          endDate: strategyEndDate,
          goals: strategyGoals || undefined,
          platforms: strategyPlatforms || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate strategy')
      }

      const data = await response.json()
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
      fetchStrategies()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Generation Failed',
        description: error.message || 'Failed to generate marketing strategy',
      })
    } finally {
      setIsGeneratingStrategy(false)
    }
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
                  isLoading={isGeneratingStrategy}
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
                          <div className="flex flex-wrap gap-2">
                            {Array.isArray(strategy.platforms) ? strategy.platforms.map((platform, idx) => (
                              <Badge key={idx} className="bg-electric-blue/20 text-electric-blue text-xs">
                                {typeof platform === 'string' ? platform : JSON.stringify(platform)}
                              </Badge>
                            )) : null}
                          </div>
                          {strategy.frequency && (
                            <p className="text-xs text-text-muted mt-2">
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
      {activeTab === 'posts' && <ContentGenerators />}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && <AnalyticsDashboard />}
    </div>
  )
}

