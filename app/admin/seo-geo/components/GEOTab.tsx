'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'

interface AiBotStatus {
  name: string
  userAgent: string
  allowed: boolean
  scope: string
}

interface StructuredDataCoverage {
  pageType: string
  hasSchema: boolean
  schemaTypes: string[]
}

interface GeoData {
  aiBots: AiBotStatus[]
  llmsTxtContent: string
  llmsTxtSource: string
  structuredDataCoverage: StructuredDataCoverage[]
  contentQuality: {
    totalPosts: number
    avgWordCount: number
    postsOver1000Words: number
    postsWithKeywords: number
    postsWithCategories: number
    postsWithFeaturedImages: number
  }
  rssFeedStatus: {
    exists: boolean
    path: string
  }
  geoScore: number
}

function ScoreGauge({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s >= 80) return '#00FF94'
    if (s >= 60) return '#00D9FF'
    if (s >= 40) return '#FF6B35'
    return '#FF006E'
  }
  const color = getColor(score)
  const circumference = 2 * Math.PI * 40
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative w-24 h-24">
      <svg className="-rotate-90 w-24 h-24" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#1a1a2e" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-white">{score}</span>
      </div>
    </div>
  )
}

export default function GEOTab() {
  const { showToast } = useToast()
  const [data, setData] = useState<GeoData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editedLlmsTxt, setEditedLlmsTxt] = useState('')
  const [isEditingLlms, setIsEditingLlms] = useState(false)

  useEffect(() => {
    fetchGeoData()
  }, [])

  const fetchGeoData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/seo-geo/geo')
      if (response.ok) {
        const result = await response.json()
        setData(result)
        setEditedLlmsTxt(result.llmsTxtContent)
      }
    } catch (error) {
      console.error('Failed to fetch GEO data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveLlmsTxt = async () => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/admin/seo-geo/geo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ llmsTxtContent: editedLlmsTxt }),
      })
      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Saved',
          description: 'llms.txt content updated successfully',
        })
        setIsEditingLlms(false)
        await fetchGeoData()
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to save llms.txt content',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!data) return null

  const cq = data.contentQuality

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Generative Engine Optimization (GEO)
          </h2>
          <p className="text-text-secondary">
            Optimize your content for AI-powered search engines and chatbots
          </p>
        </div>
        <ScoreGauge score={data.geoScore} />
      </div>

      {/* AI Bot Access Status */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">AI Bot Access Status</h3>
        </CardHeader>
        <CardBody>
          <p className="text-text-secondary text-sm mb-4">
            These AI crawlers can access your public content. Rules are defined in{' '}
            <code className="text-electric-blue">robots.ts</code>.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bg-tertiary">
                  <th className="text-left py-2 px-3 text-text-secondary font-medium">
                    AI Engine
                  </th>
                  <th className="text-left py-2 px-3 text-text-secondary font-medium">
                    User Agent
                  </th>
                  <th className="text-left py-2 px-3 text-text-secondary font-medium">
                    Status
                  </th>
                  <th className="text-left py-2 px-3 text-text-secondary font-medium">
                    Scope
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.aiBots.map((bot) => (
                  <tr key={bot.userAgent} className="border-b border-bg-tertiary/50">
                    <td className="py-2 px-3 text-white">{bot.name}</td>
                    <td className="py-2 px-3 text-text-secondary font-mono text-xs">
                      {bot.userAgent}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          bot.allowed
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {bot.allowed ? 'Allowed' : 'Blocked'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-text-secondary text-xs">
                      {bot.scope}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* llms.txt Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <h3 className="text-lg font-semibold text-white">llms.txt Content</h3>
              <p className="text-text-secondary text-sm mt-1">
                This file tells AI engines about your site. Served at{' '}
                <code className="text-electric-blue">/llms.txt</code>
              </p>
            </div>
            {!isEditingLlms ? (
              <Button
                variant="secondary"
                onClick={() => setIsEditingLlms(true)}
              >
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditedLlmsTxt(data.llmsTxtContent)
                    setIsEditingLlms(false)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveLlmsTxt}
                  disabled={isSaving}
                  isLoading={isSaving}
                >
                  Save
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {isEditingLlms ? (
            <textarea
              value={editedLlmsTxt}
              onChange={(e) => setEditedLlmsTxt(e.target.value)}
              rows={18}
              className="w-full px-4 py-3 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue resize-y"
              spellCheck={false}
            />
          ) : (
            <pre className="w-full p-4 bg-bg-tertiary rounded-lg text-text-secondary font-mono text-sm whitespace-pre-wrap overflow-x-auto">
              {data.llmsTxtContent}
            </pre>
          )}
          <p className="text-xs text-text-secondary mt-2">
            Source:{' '}
            {data.llmsTxtSource === 'admin_settings'
              ? 'Admin Settings (editable)'
              : 'Static file (public/llms.txt)'}
          </p>
        </CardBody>
      </Card>

      {/* Structured Data Coverage */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">Structured Data Coverage</h3>
        </CardHeader>
        <CardBody>
          <p className="text-text-secondary text-sm mb-4">
            JSON-LD structured data helps AI engines understand your content semantically.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bg-tertiary">
                  <th className="text-left py-2 px-3 text-text-secondary font-medium">
                    Page Type
                  </th>
                  <th className="text-left py-2 px-3 text-text-secondary font-medium">
                    Status
                  </th>
                  <th className="text-left py-2 px-3 text-text-secondary font-medium">
                    Schema Types
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.structuredDataCoverage.map((item) => (
                  <tr
                    key={item.pageType}
                    className="border-b border-bg-tertiary/50"
                  >
                    <td className="py-2 px-3 text-white">{item.pageType}</td>
                    <td className="py-2 px-3">
                      <span
                        className={
                          item.hasSchema ? 'text-cyber-green' : 'text-red-400'
                        }
                      >
                        {item.hasSchema ? '\u2713 Implemented' : '\u2717 Missing'}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex flex-wrap gap-1">
                        {item.schemaTypes.map((type) => (
                          <span
                            key={type}
                            className="px-1.5 py-0.5 bg-bg-tertiary rounded text-xs text-text-secondary"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Content Quality Metrics */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">Content Quality for AI</h3>
        </CardHeader>
        <CardBody>
          <p className="text-text-secondary text-sm mb-4">
            AI engines favor comprehensive, well-structured, and categorized content.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-3 bg-bg-tertiary rounded-lg">
              <p className="text-2xl font-bold text-white">{cq.totalPosts}</p>
              <p className="text-xs text-text-secondary">Published Posts</p>
            </div>
            <div className="p-3 bg-bg-tertiary rounded-lg">
              <p className="text-2xl font-bold text-white">{cq.avgWordCount}</p>
              <p className="text-xs text-text-secondary">Avg Word Count</p>
            </div>
            <div className="p-3 bg-bg-tertiary rounded-lg">
              <p className="text-2xl font-bold text-white">{cq.postsOver1000Words}</p>
              <p className="text-xs text-text-secondary">Posts 1000+ Words</p>
            </div>
            <div className="p-3 bg-bg-tertiary rounded-lg">
              <p className="text-2xl font-bold text-white">{cq.postsWithKeywords}</p>
              <p className="text-xs text-text-secondary">Posts with Keywords</p>
            </div>
            <div className="p-3 bg-bg-tertiary rounded-lg">
              <p className="text-2xl font-bold text-white">{cq.postsWithCategories}</p>
              <p className="text-xs text-text-secondary">Categorized Posts</p>
            </div>
            <div className="p-3 bg-bg-tertiary rounded-lg">
              <p className="text-2xl font-bold text-white">
                {cq.postsWithFeaturedImages}
              </p>
              <p className="text-xs text-text-secondary">Posts with Images</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* RSS Feed Status */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">RSS Feed</h3>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-cyber-green">{'\u2713'}</span>
                <span className="text-white">RSS feed is active</span>
              </div>
              <p className="text-text-secondary text-sm mt-1">
                Available at{' '}
                <a
                  href="/feed.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-electric-blue hover:text-[#00B8E6]"
                >
                  /feed.xml
                </a>{' '}
                - includes latest debates and blog posts
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
