'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/Loading'
import dynamic from 'next/dynamic'

const TabLoading = () => (
  <div className="flex items-center justify-center h-64">
    <LoadingSpinner size="lg" />
  </div>
)

// Dynamic import tabs — each contains heavy libraries (recharts, etc.)
const OverviewTab = dynamic(() => import('./components/OverviewTab'), { ssr: false, loading: TabLoading })
const AuditTab = dynamic(() => import('./components/AuditTab'), { ssr: false, loading: TabLoading })
const SearchConsoleTab = dynamic(() => import('./components/SearchConsoleTab'), { ssr: false, loading: TabLoading })
const GEOTab = dynamic(() => import('./components/GEOTab'), { ssr: false, loading: TabLoading })
const RecommendationsTab = dynamic(() => import('./components/RecommendationsTab'), { ssr: false, loading: TabLoading })
const SettingsTab = dynamic(() => import('./components/SettingsTab'), { ssr: false, loading: TabLoading })

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'search-console', label: 'Search Console' },
  { key: 'audit', label: 'SEO Audit' },
  { key: 'geo', label: 'GEO' },
  { key: 'recommendations', label: 'Recommendations' },
  { key: 'settings', label: 'Settings' },
]

function SeoGeoContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'overview')

  useEffect(() => {
    if (tabFromUrl && TABS.some((t) => t.key === tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    router.push(`/admin/seo-geo?tab=${tab}`, { scroll: false })
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">SEO & GEO</h1>
        <p className="text-text-secondary mt-1">
          Search Engine & Generative Engine Optimization dashboard
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-bg-tertiary mb-6 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-electric-blue text-electric-blue'
                  : 'border-transparent text-text-secondary hover:text-white hover:border-bg-tertiary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab onTabChange={handleTabChange} />}
      {activeTab === 'search-console' && (
        <SearchConsoleTab onTabChange={handleTabChange} />
      )}
      {activeTab === 'audit' && <AuditTab />}
      {activeTab === 'geo' && <GEOTab />}
      {activeTab === 'recommendations' && <RecommendationsTab />}
      {activeTab === 'settings' && <SettingsTab />}
    </div>
  )
}

export default function SeoGeoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <SeoGeoContent />
    </Suspense>
  )
}
