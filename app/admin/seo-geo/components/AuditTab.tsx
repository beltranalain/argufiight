'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface AuditData {
  id: string
  overallScore: number
  technicalScore: number
  contentScore: number
  performanceScore: number
  geoScore: number
  totalIssues: number
  criticalIssues: number
  warningIssues: number
  infoIssues: number
  results: {
    summary: string
    categories: {
      technical: CategoryData
      content: CategoryData
      performance: CategoryData
      geo: CategoryData
    }
  }
  createdAt: string
}

interface CategoryData {
  score: number
  checks: Array<{ name: string; passed: boolean; details?: string }>
  issues: Array<{
    category: string
    severity: string
    title: string
    description: string
    pageUrl?: string
    recommendation: string
  }>
}

interface AuditHistory {
  overallScore: number
  technicalScore: number
  contentScore: number
  performanceScore: number
  geoScore: number
  totalIssues: number
  createdAt: string
}

function ScoreGauge({ score, size = 'lg' }: { score: number; size?: 'sm' | 'lg' }) {
  const getColor = (s: number) => {
    if (s >= 80) return '#00FF94'
    if (s >= 60) return '#00D9FF'
    if (s >= 40) return '#FF6B35'
    return '#FF006E'
  }
  const getLabel = (s: number) => {
    if (s >= 80) return 'Excellent'
    if (s >= 60) return 'Good'
    if (s >= 40) return 'Needs Work'
    return 'Critical'
  }

  const color = getColor(score)
  const dim = size === 'lg' ? 128 : 80
  const radius = size === 'lg' ? 50 : 32
  const strokeW = size === 'lg' ? 10 : 6
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg className="-rotate-90" width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`}>
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke="#1a1a2e"
            strokeWidth={strokeW}
          />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-bold text-white ${size === 'lg' ? 'text-3xl' : 'text-xl'}`}
          >
            {score}
          </span>
        </div>
      </div>
      {size === 'lg' && (
        <p className="text-sm font-medium mt-2" style={{ color }}>
          {getLabel(score)}
        </p>
      )}
    </div>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    warning: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  }
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium border ${styles[severity] || styles.info}`}
    >
      {severity}
    </span>
  )
}

export default function AuditTab() {
  const { showToast } = useToast()
  const [audit, setAudit] = useState<AuditData | null>(null)
  const [history, setHistory] = useState<AuditHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [auditRes, historyRes] = await Promise.all([
        fetch('/api/admin/seo-geo/audit'),
        fetch('/api/admin/seo-geo/audit/history'),
      ])

      if (auditRes.ok) {
        const data = await auditRes.json()
        setAudit(data.audit)
      }
      if (historyRes.ok) {
        const data = await historyRes.json()
        setHistory(data.audits || [])
      }
    } catch (error) {
      console.error('Failed to fetch audit data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRunAudit = async () => {
    try {
      setIsRunning(true)
      const response = await fetch('/api/admin/seo-geo/audit', { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        showToast({
          type: 'success',
          title: 'Audit Complete',
          description: `Score: ${data.audit.overallScore}/100 with ${data.recommendationsCount} recommendation(s)`,
        })
        await fetchData()
      } else {
        throw new Error('Audit failed')
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Audit Failed',
        description: 'Failed to run SEO & GEO audit',
      })
    } finally {
      setIsRunning(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const categories = audit?.results?.categories
  const historyChartData = history.map((h) => ({
    date: new Date(h.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    overall: h.overallScore,
    technical: h.technicalScore,
    content: h.contentScore,
    performance: h.performanceScore,
    geo: h.geoScore,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">SEO & GEO Audit</h2>
          <p className="text-text-secondary">
            {audit
              ? `Last run: ${new Date(audit.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`
              : 'No audits run yet'}
          </p>
        </div>
        <Button onClick={handleRunAudit} disabled={isRunning} isLoading={isRunning}>
          {isRunning ? 'Running Audit...' : 'Run New Audit'}
        </Button>
      </div>

      {!audit ? (
        <Card>
          <CardBody className="p-12 text-center">
            <p className="text-text-secondary text-lg mb-4">
              Run your first audit to analyze your site&apos;s SEO & GEO health.
            </p>
            <Button onClick={handleRunAudit} disabled={isRunning} isLoading={isRunning}>
              Run First Audit
            </Button>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Overall Score + Category Scores */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <Card className="lg:col-span-1">
              <CardBody className="p-6 flex flex-col items-center justify-center">
                <ScoreGauge score={audit.overallScore} size="lg" />
                <p className="text-sm text-text-secondary mt-2">Overall Score</p>
              </CardBody>
            </Card>

            <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Technical', score: audit.technicalScore, color: '#00D9FF' },
                { label: 'Content', score: audit.contentScore, color: '#FF6B35' },
                { label: 'Performance', score: audit.performanceScore, color: '#9D4EDD' },
                { label: 'GEO', score: audit.geoScore, color: '#00FF94' },
              ].map((cat) => (
                <Card key={cat.label}>
                  <CardBody className="p-4 flex flex-col items-center">
                    <ScoreGauge score={cat.score} size="sm" />
                    <p className="text-sm text-text-secondary mt-2">{cat.label}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>

          {/* Summary */}
          <Card>
            <CardBody className="p-4">
              <p className="text-white">{audit.results?.summary}</p>
              <div className="flex gap-4 mt-3">
                <span className="text-xs text-red-400">
                  {audit.criticalIssues} critical
                </span>
                <span className="text-xs text-orange-400">
                  {audit.warningIssues} warnings
                </span>
                <span className="text-xs text-blue-400">
                  {audit.infoIssues} info
                </span>
              </div>
            </CardBody>
          </Card>

          {/* Issues by Category */}
          {categories &&
            (['technical', 'content', 'performance', 'geo'] as const).map((catKey) => {
              const cat = categories[catKey]
              if (!cat?.issues?.length && !cat?.checks?.length) return null

              const catLabels: Record<string, string> = {
                technical: 'Technical SEO',
                content: 'Content SEO',
                performance: 'Performance',
                geo: 'GEO (AI Engine)',
              }

              return (
                <Card key={catKey}>
                  <CardHeader>
                    <div className="flex items-center justify-between w-full">
                      <h3 className="text-lg font-semibold text-white">
                        {catLabels[catKey]}
                      </h3>
                      <span className="text-sm text-text-secondary">
                        Score: {cat.score}/100
                      </span>
                    </div>
                  </CardHeader>
                  <CardBody className="space-y-3">
                    {/* Checks */}
                    {cat.checks?.length > 0 && (
                      <div className="space-y-1.5">
                        {cat.checks.map((check, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span
                              className={
                                check.passed ? 'text-cyber-green' : 'text-red-400'
                              }
                            >
                              {check.passed ? '\u2713' : '\u2717'}
                            </span>
                            <span className="text-text-secondary">
                              {check.name}
                            </span>
                            {check.details && (
                              <span className="text-text-secondary text-xs">
                                ({check.details})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Issues */}
                    {cat.issues?.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <h4 className="text-sm font-medium text-text-secondary">
                          Issues Found
                        </h4>
                        {cat.issues.map((issue, i) => (
                          <div
                            key={i}
                            className="p-3 bg-bg-tertiary rounded-lg border border-bg-tertiary"
                          >
                            <div className="flex items-start gap-2">
                              <SeverityBadge severity={issue.severity} />
                              <div className="flex-1">
                                <p className="text-white text-sm font-medium">
                                  {issue.title}
                                </p>
                                <p className="text-text-secondary text-xs mt-1">
                                  {issue.description}
                                </p>
                                <p className="text-electric-blue text-xs mt-1">
                                  Fix: {issue.recommendation}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardBody>
                </Card>
              )
            })}

          {/* Audit History Chart */}
          {historyChartData.length > 1 && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-white">Audit History</h3>
              </CardHeader>
              <CardBody>
                <ResponsiveContainer width="100%" height={300}>
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
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="overall"
                      stroke="#00D9FF"
                      strokeWidth={2}
                      name="Overall"
                    />
                    <Line
                      type="monotone"
                      dataKey="technical"
                      stroke="#FF6B35"
                      strokeWidth={1.5}
                      name="Technical"
                      strokeDasharray="5 5"
                    />
                    <Line
                      type="monotone"
                      dataKey="content"
                      stroke="#9D4EDD"
                      strokeWidth={1.5}
                      name="Content"
                      strokeDasharray="5 5"
                    />
                    <Line
                      type="monotone"
                      dataKey="geo"
                      stroke="#00FF94"
                      strokeWidth={1.5}
                      name="GEO"
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
