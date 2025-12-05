'use client'

import { useState, useEffect } from 'react'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Badge } from '@/components/ui/Badge'

interface Creator {
  id: string
  username: string
  eloRating: number
  creatorStatus: string | null
  totalDebates: number
  debatesWon: number
  avgMonthlyViews: number
  avgDebateViews: number
  followerCount: number
  profileBannerPrice: number | null
  postDebatePrice: number | null
  debateWidgetPrice: number | null
  profileBannerAvailable: boolean
  postDebateAvailable: boolean
  debateWidgetAvailable: boolean
}

export default function CreatorDiscoveryPage() {
  const [creators, setCreators] = useState<Creator[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    minELO: '',
    category: '',
    minFollowers: '',
    search: '',
  })

  useEffect(() => {
    fetchCreators()
  }, [filters])

  const fetchCreators = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (filters.minELO) params.append('minELO', filters.minELO)
      if (filters.category) params.append('category', filters.category)
      if (filters.minFollowers) params.append('minFollowers', filters.minFollowers)
      if (filters.search) params.append('search', filters.search)

      const response = await fetch(`/api/advertiser/creators?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setCreators(data.creators || [])
      }
    } catch (error) {
      console.error('Failed to fetch creators:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTierColor = (tier: string | null) => {
    switch (tier) {
      case 'PLATINUM':
        return 'bg-purple-500/20 text-purple-400'
      case 'GOLD':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'SILVER':
        return 'bg-gray-400/20 text-gray-300'
      case 'BRONZE':
        return 'bg-orange-600/20 text-orange-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="ADVERTISER" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="ADVERTISER" />
      <div className="pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Discover Creators</h1>
            <p className="text-text-secondary mt-2">Find creators to sponsor for your campaigns</p>
          </div>

          {/* Filters */}
          <Card>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Search Username
                  </label>
                  <Input
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    placeholder="Search..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Min ELO
                  </label>
                  <Input
                    type="number"
                    value={filters.minELO}
                    onChange={(e) => setFilters({ ...filters, minELO: e.target.value })}
                    placeholder="1500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary"
                  >
                    <option value="">All Categories</option>
                    <option value="SPORTS">Sports</option>
                    <option value="TECH">Tech</option>
                    <option value="POLITICS">Politics</option>
                    <option value="SCIENCE">Science</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Min Followers
                  </label>
                  <Input
                    type="number"
                    value={filters.minFollowers}
                    onChange={(e) => setFilters({ ...filters, minFollowers: e.target.value })}
                    placeholder="100"
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Creators Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creators.map((creator) => (
              <Card key={creator.id}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-text-primary">@{creator.username}</h3>
                    {creator.creatorStatus && (
                      <Badge className={getTierColor(creator.creatorStatus)}>
                        {creator.creatorStatus}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-text-secondary">
                    <span>ELO: {creator.eloRating}</span>
                    <span>•</span>
                    <span>{creator.totalDebates} debates</span>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-text-secondary">Monthly Views:</span>
                        <span className="ml-2 text-text-primary font-semibold">
                          {creator.avgMonthlyViews.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-secondary">Followers:</span>
                        <span className="ml-2 text-text-primary font-semibold">
                          {creator.followerCount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-bg-tertiary pt-3">
                      <p className="text-sm font-semibold text-text-secondary mb-2">Available Slots:</p>
                      <div className="space-y-1 text-sm">
                        {creator.profileBannerAvailable && (
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Profile Banner:</span>
                            <span className="text-text-primary">
                              ${creator.profileBannerPrice?.toLocaleString() || 'N/A'}
                            </span>
                          </div>
                        )}
                        {creator.postDebateAvailable && (
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Post-Debate:</span>
                            <span className="text-text-primary">
                              ${creator.postDebatePrice?.toLocaleString() || 'N/A'}
                            </span>
                          </div>
                        )}
                        {creator.debateWidgetAvailable && (
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Debate Widget:</span>
                            <span className="text-text-primary">
                              ${creator.debateWidgetPrice?.toLocaleString() || 'N/A'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => {
                        // TODO: Open make offer modal
                        console.log('Make offer to', creator.id)
                      }}
                    >
                      Make Offer
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {creators.length === 0 && (
            <Card>
              <CardBody>
                <p className="text-text-secondary text-center py-8">
                  No creators found matching your filters.
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

