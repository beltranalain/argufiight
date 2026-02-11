'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/fetchClient'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/Loading'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface AnalyticsData {
  kpis: {
    sessions: number
    users: number
    pageViews: number
    bounceRate: number
    avgSessionDuration: number
    newUsers: number
    returningUsers: number
  }
  trafficOverTime: Array<{ date: string; sessions: number; users: number; pageViews: number }>
  trafficSources: Array<{ source: string; sessions: number; percentage: number }>
  deviceBreakdown: Array<{ device: string; sessions: number; percentage: number }>
  topPages: Array<{ page: string; views: number; uniqueViews: number }>
  geographicData: Array<{ country: string; sessions: number; users: number }>
  hourlyTraffic: Array<{ hour: string; sessions: number }>
}

const COLORS = ['#00D9FF', '#FF6B35', '#FF006E', '#00FF94', '#9D4EDD', '#F72585']

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  const { data, isLoading, error, refetch } = useQuery<AnalyticsData>({
    queryKey: ['admin', 'analytics', timeRange],
    queryFn: () => fetchClient<AnalyticsData>(`/api/admin/analytics?range=${timeRange}`),
  })

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to load analytics"
        message={error instanceof Error ? error.message : 'Something went wrong. Please try again.'}
        onRetry={() => refetch()}
      />
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Google Analytics</h1>
          <p className="text-text-secondary">Advanced analytics dashboard with KPIs, charts, and insights</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg border-2 font-semibold transition-all ${
                timeRange === range
                  ? 'border-electric-blue bg-electric-blue/10 text-electric-blue'
                  : 'border-bg-tertiary text-text-secondary hover:border-text-secondary'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4 mb-8">
        <Card>
          <CardBody className="p-4">
            <p className="text-sm text-text-secondary mb-1">Sessions</p>
            <p className="text-2xl font-bold text-white">{data.kpis.sessions.toLocaleString()}</p>
            <p className="text-xs text-text-secondary mt-1">Based on real data</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="text-sm text-text-secondary mb-1">Users</p>
            <p className="text-2xl font-bold text-white">{data.kpis.users.toLocaleString()}</p>
            <p className="text-xs text-text-secondary mt-1">Based on real data</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="text-sm text-text-secondary mb-1">Page Views</p>
            <p className="text-2xl font-bold text-white">{data.kpis.pageViews.toLocaleString()}</p>
            <p className="text-xs text-text-secondary mt-1">Based on real data</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="text-sm text-text-secondary mb-1">Bounce Rate</p>
            <p className="text-2xl font-bold text-white">{data.kpis.bounceRate.toFixed(1)}%</p>
            <p className="text-xs text-text-secondary mt-1">Based on real data</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="text-sm text-text-secondary mb-1">Avg. Session</p>
            <p className="text-2xl font-bold text-white">{Math.floor(data.kpis.avgSessionDuration / 60)}m {data.kpis.avgSessionDuration % 60}s</p>
            <p className="text-xs text-text-secondary mt-1">Based on real data</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="text-sm text-text-secondary mb-1">New Users</p>
            <p className="text-2xl font-bold text-white">{data.kpis.newUsers.toLocaleString()}</p>
            <p className="text-xs text-cyber-green mt-1">{((data.kpis.newUsers / data.kpis.users) * 100).toFixed(1)}% of total</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4">
            <p className="text-sm text-text-secondary mb-1">Returning</p>
            <p className="text-2xl font-bold text-white">{data.kpis.returningUsers.toLocaleString()}</p>
            <p className="text-xs text-cyber-green mt-1">{((data.kpis.returningUsers / data.kpis.users) * 100).toFixed(1)}% of total</p>
          </CardBody>
        </Card>
      </div>

      {/* Traffic Over Time Chart */}
      <Card className="mb-8">
        <CardHeader>
          <h2 className="text-xl font-bold text-white">Traffic Over Time</h2>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.trafficOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis
                dataKey="date"
                stroke="#666"
                tick={{ fill: '#a0a0a0' }}
              />
              <YAxis
                stroke="#666"
                tick={{ fill: '#a0a0a0' }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: any) => typeof value === 'number' ? value.toLocaleString() : value}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="sessions"
                stroke="#00D9FF"
                strokeWidth={2}
                name="Sessions"
              />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#FF6B35"
                strokeWidth={2}
                name="Users"
              />
              <Line
                type="monotone"
                dataKey="pageViews"
                stroke="#00FF94"
                strokeWidth={2}
                name="Page Views"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Traffic Sources</h2>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.trafficSources}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.source}: ${entry.percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="sessions"
                >
                  {data.trafficSources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => typeof value === 'number' ? value.toLocaleString() : value}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Device Breakdown</h2>
            <p className="text-sm text-text-secondary mt-1">Device tracking requires Google Analytics integration</p>
          </CardHeader>
          <CardBody>
            {data.deviceBreakdown.length > 0 && data.deviceBreakdown[0].device !== 'Unknown' ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.deviceBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                  <XAxis
                    dataKey="device"
                    stroke="#666"
                    tick={{ fill: '#a0a0a0' }}
                  />
                  <YAxis
                    stroke="#666"
                    tick={{ fill: '#a0a0a0' }}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any) => typeof value === 'number' ? value.toLocaleString() : value}
                  />
                  <Bar dataKey="sessions" fill="#00D9FF" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8">
                <p className="text-text-secondary">Device data not available</p>
                <p className="text-sm text-text-muted mt-2">Enable Google Analytics integration to view device breakdown</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Top Pages & Geographic Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Top Pages</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {data.topPages.map((page, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{page.page}</p>
                    <p className="text-sm text-text-secondary">{page.uniqueViews.toLocaleString()} unique views</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-electric-blue font-bold">{page.views.toLocaleString()}</p>
                    <p className="text-xs text-text-secondary">views</p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Geographic Data */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Geographic Distribution</h2>
          </CardHeader>
          <CardBody>
            {data.geographicData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-text-secondary">Geographic data not available</p>
                <p className="text-sm text-text-muted mt-2">Enable Google Analytics integration to view geographic data</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.geographicData.map((geo, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                    <div className="flex-1">
                      <p className="text-white font-medium">{geo.country}</p>
                      <p className="text-sm text-text-secondary">{geo.users.toLocaleString()} users</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-electric-blue font-bold">{geo.sessions.toLocaleString()}</p>
                      <p className="text-xs text-text-secondary">sessions</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Hourly Traffic */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-white">Hourly Traffic Pattern</h2>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.hourlyTraffic}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis
                dataKey="hour"
                stroke="#666"
                tick={{ fill: '#a0a0a0' }}
              />
              <YAxis
                stroke="#666"
                tick={{ fill: '#a0a0a0' }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '8px'
                }}
                formatter={(value: any) => typeof value === 'number' ? value.toLocaleString() : value}
              />
              <Bar dataKey="sessions" fill="#FF6B35" />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </div>
  )
}
