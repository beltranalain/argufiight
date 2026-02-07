'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
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
  ResponsiveContainer,
} from 'recharts'

interface GSCData {
  connected: boolean
  totals?: {
    clicks: number
    impressions: number
    ctr: number
    position: number
  }
  dateData?: Array<{
    date: string
    clicks: number
    impressions: number
    ctr: number
    position: number
  }>
  queries?: Array<{
    query: string
    clicks: number
    impressions: number
    ctr: number
    position: number
  }>
  pages?: Array<{
    page: string
    clicks: number
    impressions: number
    ctr: number
    position: number
  }>
  countries?: Array<{
    country: string
    clicks: number
    impressions: number
  }>
  devices?: Array<{
    device: string
    clicks: number
    impressions: number
  }>
}

const COLORS = ['#00D9FF', '#FF6B35', '#FF006E', '#00FF94', '#9D4EDD']
const TIME_RANGES = [
  { key: '7d', label: '7 days', days: 7 },
  { key: '28d', label: '28 days', days: 28 },
  { key: '90d', label: '3 months', days: 90 },
]

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toLocaleString()
}

export default function SearchConsoleTab({
  onTabChange,
}: {
  onTabChange: (tab: string) => void
}) {
  const [data, setData] = useState<GSCData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('28d')
  const [sortConfig, setSortConfig] = useState<{
    table: string
    key: string
    dir: 'asc' | 'desc'
  }>({ table: '', key: 'clicks', dir: 'desc' })

  useEffect(() => {
    fetchData()
  }, [timeRange])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const days = TIME_RANGES.find((r) => r.key === timeRange)?.days || 28
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - days)

      const startDate = start.toISOString().split('T')[0]
      const endDate = end.toISOString().split('T')[0]

      const response = await fetch(
        `/api/admin/seo-geo/search-console?type=overview&startDate=${startDate}&endDate=${endDate}`
      )
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Failed to fetch GSC data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSort = (table: string, key: string) => {
    setSortConfig((prev) => ({
      table,
      key,
      dir: prev.table === table && prev.key === key && prev.dir === 'desc' ? 'asc' : 'desc',
    }))
  }

  const sortData = <T extends Record<string, unknown>>(
    items: T[],
    table: string,
    key: string
  ): T[] => {
    if (sortConfig.table !== table) return items
    return [...items].sort((a, b) => {
      const aVal = (a[key] as number) || 0
      const bVal = (b[key] as number) || 0
      return sortConfig.dir === 'desc' ? bVal - aVal : aVal - bVal
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Not connected state
  if (!data?.connected) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Google Search Console</h2>
          <p className="text-text-secondary">
            Connect Google Search Console to see how your site performs in Google Search
          </p>
        </div>

        <Card>
          <CardBody className="p-8">
            <div className="max-w-lg mx-auto text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-tertiary flex items-center justify-center">
                <svg className="w-8 h-8 text-electric-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Search Console Not Connected
              </h3>
              <p className="text-text-secondary mb-6">
                Connect Google Search Console to see real ranking data, search queries,
                impressions, clicks, and average position.
              </p>
              <Button variant="secondary" onClick={() => onTabChange('settings')}>
                Configure in Settings
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">Setup Instructions</h3>
          </CardHeader>
          <CardBody>
            <ol className="space-y-3 text-sm text-text-secondary">
              {[
                <>Create a project in <span className="text-white">Google Cloud Console</span> and enable the Search Console API</>,
                'Create OAuth 2.0 credentials (Client ID and Client Secret)',
                <>Verify your site in <span className="text-white">Google Search Console</span></>,
                <>Enter credentials in the <button onClick={() => onTabChange('settings')} className="text-electric-blue hover:underline">Settings tab</button>, then click &quot;Connect&quot;</>,
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-electric-blue/20 text-electric-blue flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      </div>
    )
  }

  // Connected state - full dashboard
  const chartData = (data.dateData || [])
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({
      ...d,
      date: new Date(d.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      ctrPercent: Math.round(d.ctr * 10000) / 100,
      positionRound: Math.round(d.position * 10) / 10,
    }))

  const sortedQueries = sortData(data.queries || [], 'queries', sortConfig.key)
  const sortedPages = sortData(data.pages || [], 'pages', sortConfig.key)

  const SortHeader = ({
    table,
    colKey,
    label,
    className,
  }: {
    table: string
    colKey: string
    label: string
    className?: string
  }) => (
    <th
      className={`py-2 px-3 text-text-secondary font-medium cursor-pointer hover:text-white transition-colors ${className || 'text-right'}`}
      onClick={() => handleSort(table, colKey)}
    >
      {label}
      {sortConfig.table === table && sortConfig.key === colKey && (
        <span className="ml-1">{sortConfig.dir === 'desc' ? '\u2193' : '\u2191'}</span>
      )}
    </th>
  )

  return (
    <div className="space-y-6">
      {/* Header with time range */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Google Search Console</h2>
          <p className="text-text-secondary">
            Search performance data from Google
          </p>
        </div>
        <div className="flex gap-1 bg-bg-tertiary rounded-lg p-1">
          {TIME_RANGES.map((range) => (
            <button
              key={range.key}
              onClick={() => setTimeRange(range.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                timeRange === range.key
                  ? 'bg-electric-blue text-black'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      {data.totals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardBody className="p-4">
              <p className="text-xs text-text-secondary">Total Impressions</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatNumber(data.totals.impressions)}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-4">
              <p className="text-xs text-text-secondary">Total Clicks</p>
              <p className="text-2xl font-bold text-electric-blue mt-1">
                {formatNumber(data.totals.clicks)}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-4">
              <p className="text-xs text-text-secondary">Average Position</p>
              <p className="text-2xl font-bold text-white mt-1">
                {Math.round(data.totals.position * 10) / 10}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-4">
              <p className="text-xs text-text-secondary">Average CTR</p>
              <p className="text-2xl font-bold text-cyber-green mt-1">
                {(data.totals.ctr * 100).toFixed(1)}%
              </p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Performance Over Time Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">
              Performance Over Time
            </h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                <XAxis
                  dataKey="date"
                  stroke="#666"
                  tick={{ fill: '#a0a0a0', fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  yAxisId="left"
                  stroke="#666"
                  tick={{ fill: '#a0a0a0', fontSize: 11 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#666"
                  tick={{ fill: '#a0a0a0', fontSize: 11 }}
                  reversed
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
                  yAxisId="left"
                  type="monotone"
                  dataKey="clicks"
                  stroke="#00D9FF"
                  strokeWidth={2}
                  name="Clicks"
                  dot={false}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="impressions"
                  stroke="#9D4EDD"
                  strokeWidth={1.5}
                  name="Impressions"
                  dot={false}
                  strokeDasharray="5 5"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="positionRound"
                  stroke="#FF6B35"
                  strokeWidth={1.5}
                  name="Position"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      )}

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Queries */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">Top Queries</h3>
          </CardHeader>
          <CardBody>
            {sortedQueries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-bg-tertiary">
                      <th className="text-left py-2 px-3 text-text-secondary font-medium">
                        Query
                      </th>
                      <SortHeader table="queries" colKey="clicks" label="Clicks" />
                      <SortHeader table="queries" colKey="impressions" label="Impr." />
                      <SortHeader table="queries" colKey="ctr" label="CTR" />
                      <SortHeader table="queries" colKey="position" label="Pos." />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedQueries.map((q, i) => (
                      <tr
                        key={i}
                        className="border-b border-bg-tertiary/50 hover:bg-bg-tertiary/30"
                      >
                        <td className="py-2 px-3 text-white max-w-[200px] truncate">
                          {q.query}
                        </td>
                        <td className="py-2 px-3 text-right text-electric-blue">
                          {q.clicks}
                        </td>
                        <td className="py-2 px-3 text-right text-text-secondary">
                          {formatNumber(q.impressions)}
                        </td>
                        <td className="py-2 px-3 text-right text-text-secondary">
                          {(q.ctr * 100).toFixed(1)}%
                        </td>
                        <td className="py-2 px-3 text-right text-text-secondary">
                          {q.position}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-text-secondary text-center py-4">No query data</p>
            )}
          </CardBody>
        </Card>

        {/* Top Pages */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">Top Pages</h3>
          </CardHeader>
          <CardBody>
            {sortedPages.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-bg-tertiary">
                      <th className="text-left py-2 px-3 text-text-secondary font-medium">
                        Page
                      </th>
                      <SortHeader table="pages" colKey="clicks" label="Clicks" />
                      <SortHeader table="pages" colKey="impressions" label="Impr." />
                      <SortHeader table="pages" colKey="position" label="Pos." />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPages.map((p, i) => (
                      <tr
                        key={i}
                        className="border-b border-bg-tertiary/50 hover:bg-bg-tertiary/30"
                      >
                        <td className="py-2 px-3 text-white max-w-[250px] truncate text-xs">
                          {p.page.replace(/^https?:\/\/[^/]+/, '')}
                        </td>
                        <td className="py-2 px-3 text-right text-electric-blue">
                          {p.clicks}
                        </td>
                        <td className="py-2 px-3 text-right text-text-secondary">
                          {formatNumber(p.impressions)}
                        </td>
                        <td className="py-2 px-3 text-right text-text-secondary">
                          {p.position}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-text-secondary text-center py-4">No page data</p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Countries and Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Countries */}
        {data.countries && data.countries.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-white">Countries</h3>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.countries.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
                  <XAxis type="number" stroke="#666" tick={{ fill: '#a0a0a0', fontSize: 11 }} />
                  <YAxis
                    dataKey="country"
                    type="category"
                    stroke="#666"
                    tick={{ fill: '#a0a0a0', fontSize: 11 }}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a2e',
                      border: '1px solid #333',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="clicks" fill="#00D9FF" radius={[0, 4, 4, 0]} name="Clicks" />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        )}

        {/* Devices */}
        {data.devices && data.devices.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-white">Devices</h3>
            </CardHeader>
            <CardBody>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={data.devices}
                      dataKey="clicks"
                      nameKey="device"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }: { name?: string; percent?: number }) =>
                        `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`
                      }
                    >
                      {data.devices.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a2e',
                        border: '1px solid #333',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  )
}
