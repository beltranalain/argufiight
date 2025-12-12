'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/Loading'

interface AnalyticsData {
  totalPosts: number
  totalBlogPosts: number
  totalNewsletters: number
  totalImpressions: number
  totalEngagement: number
  topPosts: Array<{
    id: string
    contentType: string
    title: string
    impressions: number
    engagement: number
    engagementRate: number
  }>
  platformStats: Array<{
    platform: string
    posts: number
    impressions: number
    engagement: number
  }>
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      // For now, return mock data - we'll implement real analytics later
      // const response = await fetch(`/api/admin/marketing/analytics?range=${timeRange}`)
      // if (response.ok) {
      //   const data = await response.json()
      //   setAnalytics(data)
      // }

      // Mock data for now
      setAnalytics({
        totalPosts: 45,
        totalBlogPosts: 12,
        totalNewsletters: 8,
        totalImpressions: 125000,
        totalEngagement: 8500,
        topPosts: [
          {
            id: '1',
            contentType: 'SOCIAL_POST',
            title: 'Platform Launch Announcement',
            impressions: 15000,
            engagement: 1200,
            engagementRate: 8.0,
          },
          {
            id: '2',
            contentType: 'BLOG_POST',
            title: 'How to Win Debates',
            impressions: 12000,
            engagement: 950,
            engagementRate: 7.9,
          },
        ],
        platformStats: [
          { platform: 'Instagram', posts: 20, impressions: 60000, engagement: 4200 },
          { platform: 'LinkedIn', posts: 15, impressions: 45000, engagement: 2800 },
          { platform: 'Twitter', posts: 10, impressions: 20000, engagement: 1500 },
        ],
      })
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardBody>
          <p className="text-text-secondary text-center py-8">No analytics data available</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <div className="flex gap-2 bg-bg-tertiary p-1 rounded-lg">
          {[
            { value: '7d', label: '7 Days' },
            { value: '30d', label: '30 Days' },
            { value: '90d', label: '90 Days' },
            { value: 'all', label: 'All Time' },
          ].map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value as any)}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                timeRange === range.value
                  ? 'bg-electric-blue text-white'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-text-secondary mb-1">Social Posts</p>
            <p className="text-2xl font-bold text-white">{analytics.totalPosts}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-text-secondary mb-1">Blog Posts</p>
            <p className="text-2xl font-bold text-white">{analytics.totalBlogPosts}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-text-secondary mb-1">Newsletters</p>
            <p className="text-2xl font-bold text-white">{analytics.totalNewsletters}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-text-secondary mb-1">Total Impressions</p>
            <p className="text-2xl font-bold text-white">
              {(analytics.totalImpressions / 1000).toFixed(1)}K
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-text-secondary mb-1">Total Engagement</p>
            <p className="text-2xl font-bold text-white">
              {(analytics.totalEngagement / 1000).toFixed(1)}K
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Top Performing Content */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-white">Top Performing Content</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {analytics.topPosts.map((post) => (
              <div
                key={post.id}
                className="p-4 bg-bg-tertiary border border-bg-tertiary rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge>{post.contentType.replace('_', ' ')}</Badge>
                      <h3 className="font-semibold text-white">{post.title}</h3>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-text-secondary">Impressions</p>
                    <p className="text-sm font-medium text-white">
                      {post.impressions.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Engagement</p>
                    <p className="text-sm font-medium text-white">
                      {post.engagement.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Engagement Rate</p>
                    <p className="text-sm font-medium text-electric-blue">
                      {post.engagementRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Platform Stats */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-white">Platform Performance</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {analytics.platformStats.map((stat) => (
              <div key={stat.platform} className="p-4 bg-bg-tertiary border border-bg-tertiary rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">{stat.platform}</h3>
                  <Badge>{stat.posts} posts</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-text-secondary">Impressions</p>
                    <p className="text-lg font-bold text-white">
                      {(stat.impressions / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Engagement</p>
                    <p className="text-lg font-bold text-electric-blue">
                      {(stat.engagement / 1000).toFixed(1)}K
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

