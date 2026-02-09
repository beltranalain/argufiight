'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'

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

interface AffectedPost {
  id: string
  title: string
  slug: string
  wordCount?: number
  status: string
  publishedAt: string | null
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

// Map recommendation titles to API query types
function getAffectedPostsType(rec: Recommendation): string | null {
  const title = rec.title.toLowerCase()
  if (title.includes('thin content')) return 'thin_content'
  if (title.includes('without og or featured')) return 'missing_images'
  if (title.includes('without categories')) return 'missing_categories'
  if (title.includes('duplicate') && title.includes('title')) return 'duplicate_titles'
  if (title.includes('missing meta title')) return 'missing_meta_titles'
  if (title.includes('missing meta description')) return 'missing_meta_descriptions'
  if (title.includes('without featured image')) return 'missing_featured_images'
  return null
}

export default function RecommendationsTab() {
  const { showToast } = useToast()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [statusCounts, setStatusCounts] = useState({ pending: 0, implemented: 0, dismissed: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Details modal state
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [detailsRec, setDetailsRec] = useState<Recommendation | null>(null)
  const [affectedPosts, setAffectedPosts] = useState<AffectedPost[]>([])
  const [affectedDescription, setAffectedDescription] = useState('')
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

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

  const handleViewDetails = async (rec: Recommendation) => {
    const type = getAffectedPostsType(rec)
    if (!type) {
      setDetailsRec(rec)
      setAffectedPosts([])
      setAffectedDescription(rec.description)
      setDetailsModalOpen(true)
      return
    }

    setDetailsRec(rec)
    setDetailsModalOpen(true)
    setIsLoadingDetails(true)
    setAffectedPosts([])

    try {
      const response = await fetch(`/api/admin/seo-geo/recommendations/affected-posts?type=${type}`)
      if (response.ok) {
        const data = await response.json()
        setAffectedPosts(data.posts || [])
        setAffectedDescription(data.description || rec.description)
      }
    } catch (error) {
      console.error('Failed to fetch affected posts:', error)
      setAffectedDescription(rec.description)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const closeDetailsModal = () => {
    setDetailsModalOpen(false)
    setDetailsRec(null)
    setAffectedPosts([])
  }

  const handleCopyAll = () => {
    const text = recommendations
      .map((rec, i) => {
        const parts = [
          `${i + 1}. [${rec.severity.toUpperCase()}] ${rec.title}`,
          `   Category: ${CATEGORY_LABELS[rec.category] || rec.category}`,
          `   ${rec.description}`,
        ]
        if (rec.impact) parts.push(`   Impact: ${rec.impact}`)
        if (rec.effort) parts.push(`   Effort: ${rec.effort}`)
        if (rec.pageUrl) parts.push(`   URL: ${rec.pageUrl}`)
        parts.push(`   Status: ${rec.status}`)
        return parts.join('\n')
      })
      .join('\n\n')

    const header = `SEO & GEO Recommendations (${recommendations.length} items)\n${'='.repeat(50)}\n\n`
    navigator.clipboard.writeText(header + text)
    showToast({
      type: 'success',
      title: 'Copied',
      description: `${recommendations.length} recommendations copied to clipboard`,
    })
  }

  const handleExportCSV = () => {
    const headers = ['Severity', 'Category', 'Title', 'Description', 'Impact', 'Effort', 'Status', 'URL']
    const rows = recommendations.map((rec) => [
      rec.severity,
      CATEGORY_LABELS[rec.category] || rec.category,
      rec.title,
      rec.description,
      rec.impact || '',
      rec.effort || '',
      rec.status,
      rec.pageUrl || '',
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `seo-recommendations-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
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

      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center gap-3">
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

        <div className="ml-auto flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyAll}
            disabled={recommendations.length === 0}
          >
            Copy All
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            disabled={recommendations.length === 0}
          >
            Export CSV
          </Button>
        </div>
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

                  <div className="flex gap-2 flex-shrink-0">
                    {getAffectedPostsType(rec) && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleViewDetails(rec)}
                      >
                        View Details
                      </Button>
                    )}

                    {rec.status === 'pending' && (
                      <>
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
                      </>
                    )}

                    {rec.status !== 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus(rec.id, 'pending')}
                        disabled={updatingId === rec.id}
                        className="px-3 py-1 text-xs text-text-secondary hover:text-white transition-colors"
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Affected Posts Detail Modal */}
      {detailsModalOpen && detailsRec && (
        <Modal
          isOpen={true}
          onClose={closeDetailsModal}
          title={detailsRec.title}
          size="lg"
        >
          <div className="space-y-4">
            {/* Severity + category badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium border ${
                  SEVERITY_STYLES[detailsRec.severity] || SEVERITY_STYLES.info
                }`}
              >
                {detailsRec.severity}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-bg-tertiary text-text-secondary">
                {CATEGORY_LABELS[detailsRec.category] || detailsRec.category}
              </span>
              {detailsRec.impact && (
                <span className={`text-xs ${IMPACT_STYLES[detailsRec.impact] || ''}`}>
                  Impact: {detailsRec.impact}
                </span>
              )}
              {detailsRec.effort && (
                <span className={`text-xs ${EFFORT_STYLES[detailsRec.effort] || ''}`}>
                  Effort: {detailsRec.effort}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-text-secondary text-sm">{affectedDescription}</p>

            {/* Loading state */}
            {isLoadingDetails && (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            )}

            {/* Affected posts list */}
            {!isLoadingDetails && affectedPosts.length > 0 && (
              <div className="border border-bg-tertiary rounded-lg overflow-hidden">
                {/* Table header */}
                <div
                  className={`grid gap-4 px-4 py-2.5 bg-bg-tertiary/50 text-xs font-semibold text-text-secondary uppercase tracking-wide ${
                    affectedPosts[0]?.wordCount !== undefined
                      ? 'grid-cols-[1fr_60px_auto]'
                      : 'grid-cols-[1fr_auto]'
                  }`}
                >
                  <span>Blog Post</span>
                  {affectedPosts[0]?.wordCount !== undefined && <span>Words</span>}
                  <span>Action</span>
                </div>

                {/* Post rows */}
                {affectedPosts.map((post) => (
                  <div
                    key={post.id}
                    className={`grid gap-4 items-center px-4 py-3 border-t border-bg-tertiary hover:bg-bg-tertiary/30 transition-colors ${
                      post.wordCount !== undefined
                        ? 'grid-cols-[1fr_60px_auto]'
                        : 'grid-cols-[1fr_auto]'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{post.title}</p>
                      <p className="text-text-secondary text-xs truncate">/{post.slug}</p>
                    </div>

                    {post.wordCount !== undefined && (
                      <span
                        className={`text-sm font-mono font-bold tabular-nums text-right ${
                          post.wordCount < 300
                            ? 'text-red-400'
                            : post.wordCount < 500
                            ? 'text-orange-400'
                            : 'text-cyber-green'
                        }`}
                      >
                        {post.wordCount}
                      </span>
                    )}

                    <div className="flex gap-2">
                      <a
                        href={`/admin/content?tab=blog&edit=${post.id}`}
                        className="px-3 py-1.5 text-xs font-semibold rounded bg-electric-blue/10 text-electric-blue border border-electric-blue/20 hover:bg-electric-blue/20 transition-colors whitespace-nowrap"
                      >
                        Edit
                      </a>
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-semibold rounded bg-bg-tertiary text-text-secondary hover:text-white transition-colors whitespace-nowrap"
                      >
                        View
                      </a>
                    </div>
                  </div>
                ))}

                {/* Summary footer */}
                <div className="px-4 py-2.5 bg-bg-tertiary/30 border-t border-bg-tertiary text-xs text-text-secondary">
                  {affectedPosts.length} affected post{affectedPosts.length !== 1 ? 's' : ''}
                  {affectedPosts[0]?.wordCount !== undefined && (
                    <> &middot; Target: 500+ words per post</>
                  )}
                </div>
              </div>
            )}

            {/* No affected posts */}
            {!isLoadingDetails && affectedPosts.length === 0 && (
              <div className="text-center py-6 border border-bg-tertiary rounded-lg">
                <p className="text-text-secondary text-sm">
                  No affected blog posts found. This issue may have already been resolved.
                </p>
              </div>
            )}

            {/* Footer actions */}
            <div className="pt-2 flex justify-between items-center border-t border-bg-tertiary pt-4">
              <a
                href="/admin/content?tab=blog"
                className="text-electric-blue text-sm hover:underline"
              >
                Go to Blog Manager
              </a>
              <Button
                variant="secondary"
                size="sm"
                onClick={closeDetailsModal}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
