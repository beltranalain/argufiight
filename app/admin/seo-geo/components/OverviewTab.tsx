'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/Loading'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface OverviewData {
  latestAudit: {
    overallScore: number
    technicalScore: number
    contentScore: number
    performanceScore: number
    geoScore: number
    totalIssues: number
    criticalIssues: number
    createdAt: string
  } | null
  statusCounts: {
    pending: number
    implemented: number
    dismissed: number
  }
  estimatedIndexedPages: number
  auditHistory: Array<{
    overallScore: number
    technicalScore: number
    contentScore: number
    geoScore: number
    createdAt: string
  }>
  issuesByCategory: {
    technical: number
    content: number
    performance: number
    geo: number
  } | null
}

function ScoreCircle({ score, label }: { score: number; label: string }) {
  const getColor = (s: number) => {
    if (s >= 80) return '#00FF94'
    if (s >= 60) return '#00D9FF'
    if (s >= 40) return '#FF6B35'
    return '#FF006E'
  }
  const color = getColor(score)
  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#1a1a2e"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">{score}</span>
        </div>
      </div>
      <p className="text-sm text-text-secondary mt-2">{label}</p>
    </div>
  )
}

export default function OverviewTab({
  onTabChange,
}: {
  onTabChange: (tab: string) => void
}) {
  const [data, setData] = useState<OverviewData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRunningAudit, setIsRunningAudit] = useState(false)

  useEffect(() => {
    fetchOverview()
  }, [])

  const fetchOverview = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/seo-geo/overview')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Failed to fetch overview:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRunAudit = async () => {
    try {
      setIsRunningAudit(true)
      const response = await fetch('/api/admin/seo-geo/audit', { method: 'POST' })
      if (response.ok) {
        await fetchOverview()
      }
    } catch (error) {
      console.error('Failed to run audit:', error)
    } finally {
      setIsRunningAudit(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const issuesChartData = data?.issuesByCategory
    ? [
        { category: 'Technical', count: data.issuesByCategory.technical },
        { category: 'Content', count: data.issuesByCategory.content },
        { category: 'Performance', count: data.issuesByCategory.performance },
        { category: 'GEO', count: data.issuesByCategory.geo },
      ]
    : []

  const historyChartData = (data?.auditHistory || []).map((a) => ({
    date: new Date(a.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    overall: a.overallScore,
    technical: a.technicalScore,
    content: a.contentScore,
    geo: a.geoScore,
  }))

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-4 flex flex-col items-center">
            <ScoreCircle
              score={data?.latestAudit?.overallScore ?? 0}
              label="SEO Health Score"
            />
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <p className="text-sm text-text-secondary mb-1">Indexed Pages (est.)</p>
            <p className="text-3xl font-bold text-white">
              {data?.estimatedIndexedPages ?? 0}
            </p>
            <p className="text-xs text-text-secondary mt-2">
              Based on sitemap entries
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <p className="text-sm text-text-secondary mb-1">Open Recommendations</p>
            <p className="text-3xl font-bold text-white">
              {data?.statusCounts?.pending ?? 0}
            </p>
            <div className="flex gap-3 mt-2">
              <span className="text-xs text-cyber-green">
                {data?.statusCounts?.implemented ?? 0} done
              </span>
              <span className="text-xs text-text-secondary">
                {data?.statusCounts?.dismissed ?? 0} dismissed
              </span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4 flex flex-col items-center">
            <ScoreCircle
              score={data?.latestAudit?.geoScore ?? 0}
              label="GEO Score"
            />
          </CardBody>
        </Card>
      </div>

      {/* Charts Row */}
      {historyChartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Audit Score Trend */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-white">Score Trend</h3>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={historyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                  <XAxis
                    dataKey="date"
                    stroke="#666"
                    tick={{ fill: '#a0a0a0', fontSize: 12 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="#666"
                    tick={{ fill: '#a0a0a0', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid #333',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="overall"
                    stroke="#00D9FF"
                    strokeWidth={2}
                    name="Overall"
                    dot={{ fill: '#00D9FF' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="geo"
                    stroke="#00FF94"
                    strokeWidth={2}
                    name="GEO"
                    dot={{ fill: '#00FF94' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          {/* Issues by Category */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-white">Issues by Category</h3>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={issuesChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                  <XAxis
                    dataKey="category"
                    stroke="#666"
                    tick={{ fill: '#a0a0a0', fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#666"
                    tick={{ fill: '#a0a0a0', fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid #333',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#00D9FF"
                    radius={[4, 4, 0, 0]}
                    name="Issues"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </div>
      )}

      {/* No audit yet banner */}
      {!data?.latestAudit && (
        <Card>
          <CardBody className="p-8 text-center">
            <div className="text-4xl mb-4">
              <svg className="w-12 h-12 mx-auto text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Audit Data Yet</h3>
            <p className="text-text-secondary mb-4">
              Run your first SEO & GEO audit to see health scores, identify issues, and get
              actionable recommendations.
            </p>
            <button
              onClick={handleRunAudit}
              disabled={isRunningAudit}
              className="px-6 py-2 bg-electric-blue text-black font-semibold rounded-lg hover:bg-[#00B8E6] transition-colors disabled:opacity-50"
            >
              {isRunningAudit ? 'Running Audit...' : 'Run First Audit'}
            </button>
          </CardBody>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={handleRunAudit}
          disabled={isRunningAudit}
          className="p-4 bg-bg-secondary border border-bg-tertiary rounded-lg hover:border-electric-blue transition-colors text-left disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-electric-blue flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <div>
              <p className="text-white font-medium text-sm">
                {isRunningAudit ? 'Running...' : 'Run New Audit'}
              </p>
              <p className="text-text-secondary text-xs">
                Scan for SEO & GEO issues
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onTabChange('recommendations')}
          className="p-4 bg-bg-secondary border border-bg-tertiary rounded-lg hover:border-electric-blue transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-neon-orange flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <div>
              <p className="text-white font-medium text-sm">View Recommendations</p>
              <p className="text-text-secondary text-xs">
                {data?.statusCounts?.pending ?? 0} pending
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onTabChange('geo')}
          className="p-4 bg-bg-secondary border border-bg-tertiary rounded-lg hover:border-electric-blue transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-cyber-green flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-white font-medium text-sm">Edit llms.txt</p>
              <p className="text-text-secondary text-xs">Manage AI engine content</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => onTabChange('settings')}
          className="p-4 bg-bg-secondary border border-bg-tertiary rounded-lg hover:border-electric-blue transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-hot-pink flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="text-white font-medium text-sm">Configure Settings</p>
              <p className="text-text-secondary text-xs">SEO & GEO configuration</p>
            </div>
          </div>
        </button>
      </div>

      {/* Last Audit Info */}
      {data?.latestAudit && (
        <p className="text-xs text-text-secondary text-center">
          Last audit:{' '}
          {new Date(data.latestAudit.createdAt).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </p>
      )}
    </div>
  )
}
