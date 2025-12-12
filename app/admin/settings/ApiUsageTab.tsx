'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { StatCard } from '@/components/admin/StatCard'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tabs } from '@/components/ui/Tabs'

interface ApiUsageStats {
  totalCalls: number
  successfulCalls: number
  failedCalls: number
  totalCost: number
  totalTokens: number
  usageByProvider: Array<{
    provider: string
    calls: number
    cost: number
    tokens: number
  }>
}

interface ApiUsageRecord {
  id: string
  provider: string
  endpoint: string
  model: string | null
  promptTokens: number | null
  completionTokens: number | null
  totalTokens: number | null
  cost: number
  success: boolean
  errorMessage: string | null
  responseTime: number | null
  createdAt: string
  debate: {
    id: string
    topic: string
  } | null
  user: {
    id: string
    username: string
  } | null
}

export default function ApiUsageTab() {
  const [stats, setStats] = useState<ApiUsageStats | null>(null)
  const [records, setRecords] = useState<ApiUsageRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('all')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchData()
  }, [timeRange])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (timeRange !== 'all') {
        params.append('range', timeRange)
      }

      const [statsRes, recordsRes] = await Promise.all([
        fetch(`/api/admin/api-usage/stats?${params.toString()}`),
        fetch(`/api/admin/api-usage/records?${params.toString()}`),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (recordsRes.ok) {
        const recordsData = await recordsRes.json()
        setRecords(recordsData)
      }
    } catch (error) {
      console.error('Failed to fetch API usage data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div className="space-y-8">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <StatCard
                title="Total API Calls"
                value={formatNumber(stats.totalCalls)}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
                color="blue"
              />
              <StatCard
                title="Total Cost"
                value={formatCurrency(stats.totalCost)}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                color="green"
              />
              <StatCard
                title="Total Tokens"
                value={formatNumber(stats.totalTokens)}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                color="orange"
              />
              <StatCard
                title="Success Rate"
                value={stats.totalCalls > 0 ? `${Math.round((stats.successfulCalls / stats.totalCalls) * 100)}%` : '0%'}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                color="pink"
              />
            </div>
          )}

          {/* Usage by Provider */}
          {stats && stats.usageByProvider.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-xl font-bold text-white">Usage by Provider</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {stats.usageByProvider.map((provider) => (
                    <div
                      key={provider.provider}
                      className="p-5 bg-bg-tertiary rounded-lg border border-bg-tertiary hover:border-electric-blue transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-white capitalize">{provider.provider}</h4>
                        <Badge variant="default" size="sm">
                          {provider.calls} calls
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-6 text-sm">
                        <div>
                          <span className="text-text-secondary">Cost: </span>
                          <span className="text-white font-semibold">{formatCurrency(provider.cost)}</span>
                        </div>
                        <div>
                          <span className="text-text-secondary">Tokens: </span>
                          <span className="text-white font-semibold">{formatNumber(provider.tokens)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      ),
    },
    {
      id: 'records',
      label: 'Usage Records',
      content: (
        <Card>
          <CardHeader>
            <h3 className="text-xl font-bold text-white">API Usage Records</h3>
          </CardHeader>
          <CardBody>
            {records.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                title="No API Usage Records"
                description="API usage will appear here once verdicts are generated"
              />
            ) : (
              <div className="space-y-4">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 bg-bg-tertiary rounded-lg border border-bg-tertiary hover:border-electric-blue transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="default" size="sm" className="capitalize">
                            {record.provider}
                          </Badge>
                          <Badge
                            variant={record.success ? 'default' : 'default'}
                            size="sm"
                            className={record.success ? 'bg-cyber-green text-black' : 'bg-neon-orange text-black'}
                          >
                            {record.success ? 'Success' : 'Failed'}
                          </Badge>
                          {record.model && (
                            <span className="text-sm text-text-secondary">{record.model}</span>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary mb-1">{record.endpoint}</p>
                        {record.debate && (
                          <p className="text-sm text-electric-blue hover:text-neon-orange">
                            Debate: {record.debate.topic}
                          </p>
                        )}
                        {record.user && (
                          <p className="text-sm text-text-secondary">User: {record.user.username}</p>
                        )}
                        {record.errorMessage && (
                          <p className="text-sm text-neon-orange mt-2">Error: {record.errorMessage}</p>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-white font-semibold">{formatCurrency(record.cost)}</p>
                        {record.totalTokens && (
                          <p className="text-text-secondary">{formatNumber(record.totalTokens)} tokens</p>
                        )}
                        {record.responseTime && (
                          <p className="text-text-secondary">{record.responseTime}ms</p>
                        )}
                        <p className="text-text-secondary text-xs mt-2">
                          {new Date(record.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {record.promptTokens && record.completionTokens && (
                      <div className="flex gap-4 text-xs text-text-secondary pt-2 border-t border-bg-secondary">
                        <span>Prompt: {formatNumber(record.promptTokens)}</span>
                        <span>Completion: {formatNumber(record.completionTokens)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">API Usage & Costs</h2>
          <p className="text-text-secondary">Track API calls and costs for all services</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('today')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === 'today'
                ? 'bg-electric-blue text-black'
                : 'bg-bg-tertiary text-text-secondary hover:text-white'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === 'week'
                ? 'bg-electric-blue text-black'
                : 'bg-bg-tertiary text-text-secondary hover:text-white'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === 'month'
                ? 'bg-electric-blue text-black'
                : 'bg-bg-tertiary text-text-secondary hover:text-white'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === 'all'
                ? 'bg-electric-blue text-black'
                : 'bg-bg-tertiary text-text-secondary hover:text-white'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <Card>
          <CardBody className="p-0">
            <Tabs
              tabs={tabs}
              defaultTab={activeTab}
              onChange={(tabId) => setActiveTab(tabId)}
            />
          </CardBody>
        </Card>
      )}
    </div>
  )
}

