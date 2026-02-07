'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'

interface Recommendation {
  id: string
  category: string
  severity: string
  title: string
  description: string
  impact: string | null
  effort: string | null
  status: string
  pageUrl: string | null
  createdAt: string
}

const CATEGORY_LABELS: Record<string, string> = {
  technical_seo: 'Technical SEO',
  content_seo: 'Content SEO',
  performance: 'Performance',
  geo: 'GEO',
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  warning: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

const IMPACT_STYLES: Record<string, string> = {
  high: 'text-red-400',
  medium: 'text-orange-400',
  low: 'text-blue-400',
}

const EFFORT_STYLES: Record<string, string> = {
  easy: 'text-cyber-green',
  medium: 'text-orange-400',
  hard: 'text-red-400',
}

export default function RecommendationsTab() {
  const { showToast } = useToast()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [statusCounts, setStatusCounts] = useState({ pending: 0, implemented: 0, dismissed: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    fetchRecommendations()
  }, [filterCategory, filterStatus])

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (filterCategory) params.set('category', filterCategory)
      if (filterStatus) params.set('status', filterStatus)

      const response = await fetch(`/api/admin/seo-geo/recommendations?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendations || [])
        setStatusCounts(data.statusCounts || { pending: 0, implemented: 0, dismissed: 0 })
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      setUpdatingId(id)
      const response = await fetch('/api/admin/seo-geo/recommendations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Updated',
          description: `Recommendation marked as ${status}`,
        })
        await fetchRecommendations()
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to update recommendation',
      })
    } finally {
      setUpdatingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Recommendations</h2>
        <p className="text-text-secondary">
          Actionable improvements based on your latest audit
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-bg-secondary border border-bg-tertiary rounded-lg text-center">
          <p className="text-2xl font-bold text-orange-400">{statusCounts.pending}</p>
          <p className="text-xs text-text-secondary">Pending</p>
        </div>
        <div className="p-4 bg-bg-secondary border border-bg-tertiary rounded-lg text-center">
          <p className="text-2xl font-bold text-cyber-green">{statusCounts.implemented}</p>
          <p className="text-xs text-text-secondary">Implemented</p>
        </div>
        <div className="p-4 bg-bg-secondary border border-bg-tertiary rounded-lg text-center">
          <p className="text-2xl font-bold text-text-secondary">{statusCounts.dismissed}</p>
          <p className="text-xs text-text-secondary">Dismissed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-1.5 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue"
        >
          <option value="">All Categories</option>
          <option value="technical_seo">Technical SEO</option>
          <option value="content_seo">Content SEO</option>
          <option value="performance">Performance</option>
          <option value="geo">GEO</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="implemented">Implemented</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      {/* Recommendations List */}
      {recommendations.length === 0 ? (
        <Card>
          <CardBody className="p-8 text-center">
            <p className="text-text-secondary">
              {filterCategory || filterStatus
                ? 'No recommendations match the current filters.'
                : 'No recommendations yet. Run an audit to generate recommendations.'}
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <Card key={rec.id}>
              <CardBody className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium border ${
                          SEVERITY_STYLES[rec.severity] || SEVERITY_STYLES.info
                        }`}
                      >
                        {rec.severity}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-bg-tertiary text-text-secondary">
                        {CATEGORY_LABELS[rec.category] || rec.category}
                      </span>
                      {rec.impact && (
                        <span
                          className={`text-xs ${IMPACT_STYLES[rec.impact] || ''}`}
                        >
                          Impact: {rec.impact}
                        </span>
                      )}
                      {rec.effort && (
                        <span
                          className={`text-xs ${EFFORT_STYLES[rec.effort] || ''}`}
                        >
                          Effort: {rec.effort}
                        </span>
                      )}
                      {rec.status !== 'pending' && (
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            rec.status === 'implemented'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {rec.status}
                        </span>
                      )}
                    </div>

                    <h4 className="text-white font-medium">{rec.title}</h4>
                    <p className="text-text-secondary text-sm mt-1">
                      {rec.description}
                    </p>
                    {rec.pageUrl && (
                      <a
                        href={rec.pageUrl}
                        className="text-electric-blue text-xs mt-1 inline-block hover:underline"
                      >
                        {rec.pageUrl}
                      </a>
                    )}
                  </div>

                  {rec.status === 'pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUpdateStatus(rec.id, 'implemented')}
                        disabled={updatingId === rec.id}
                      >
                        Done
                      </Button>
                      <button
                        onClick={() => handleUpdateStatus(rec.id, 'dismissed')}
                        disabled={updatingId === rec.id}
                        className="px-3 py-1 text-xs text-text-secondary hover:text-white transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  {rec.status !== 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(rec.id, 'pending')}
                      disabled={updatingId === rec.id}
                      className="px-3 py-1 text-xs text-text-secondary hover:text-white transition-colors flex-shrink-0"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
