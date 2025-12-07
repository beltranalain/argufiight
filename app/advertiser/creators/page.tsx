'use client'

import { useState, useEffect, useCallback } from 'react'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Badge } from '@/components/ui/Badge'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

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

interface Campaign {
  id: string
  name: string
  status: string
}

export default function CreatorDiscoveryPage() {
  const { showToast } = useToast()
  const [creators, setCreators] = useState<Creator[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [filters, setFilters] = useState({
    minELO: '',
    category: '',
    minFollowers: '',
    search: '',
  })
  
  // Make Offer Modal State
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false)
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false)
  const [offerForm, setOfferForm] = useState({
    campaignId: '',
    placement: 'PROFILE_BANNER',
    duration: '30',
    paymentType: 'FLAT_RATE',
    amount: '',
    message: '',
  })

  // Initial load - fetch all creators
  useEffect(() => {
    handleSearch()
  }, [])

  // Fetch campaigns when modal opens
  const fetchCampaigns = useCallback(async () => {
    try {
      setIsLoadingCampaigns(true)
      const response = await fetch('/api/advertiser/campaigns')
      if (response.ok) {
        const data = await response.json()
        // Only show approved campaigns
        const approvedCampaigns = (data.campaigns || []).filter(
          (c: Campaign) => c.status === 'APPROVED'
        )
        setCampaigns(approvedCampaigns)
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load campaigns',
      })
    } finally {
      setIsLoadingCampaigns(false)
    }
  }, [showToast])

  const handleOpenOfferModal = useCallback((creator: Creator) => {
    setSelectedCreator(creator)
    setShowOfferModal(true)
    fetchCampaigns()
    // Reset form
    setOfferForm({
      campaignId: '',
      placement: creator.profileBannerAvailable ? 'PROFILE_BANNER' : 
                 creator.postDebateAvailable ? 'POST_DEBATE' : 
                 creator.debateWidgetAvailable ? 'DEBATE_WIDGET' : 'PROFILE_BANNER',
      duration: '30',
      paymentType: 'FLAT_RATE',
      amount: '',
      message: '',
    })
  }, [fetchCampaigns])

  const handleCloseOfferModal = () => {
    setShowOfferModal(false)
    setSelectedCreator(null)
    setCampaigns([])
  }

  const handleSubmitOffer = async () => {
    if (!selectedCreator) return

    // Validate form
    if (!offerForm.campaignId || !offerForm.amount || !offerForm.duration) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        description: 'Please fill in all required fields',
      })
      return
    }

    try {
      setIsSubmittingOffer(true)
      const response = await fetch('/api/advertiser/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId: selectedCreator.id,
          campaignId: offerForm.campaignId,
          placement: offerForm.placement,
          duration: parseInt(offerForm.duration),
          paymentType: offerForm.paymentType,
          amount: parseFloat(offerForm.amount),
          message: offerForm.message || null,
        }),
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Offer Sent',
          description: `Your offer has been sent to @${selectedCreator.username}`,
        })
        handleCloseOfferModal()
      } else {
        const error = await response.json()
        showToast({
          type: 'error',
          title: 'Error',
          description: error.error || 'Failed to send offer',
        })
      }
    } catch (error) {
      console.error('Failed to submit offer:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to send offer',
      })
    } finally {
      setIsSubmittingOffer(false)
    }
  }

  const handleSearch = async () => {
    try {
      setIsLoading(true)
      setHasSearched(true)
      const params = new URLSearchParams()
      if (filters.minELO) params.append('minELO', filters.minELO)
      if (filters.category) params.append('category', filters.category)
      if (filters.minFollowers) params.append('minFollowers', filters.minFollowers)
      if (filters.search && filters.search.trim()) params.append('search', filters.search.trim())

      const response = await fetch(`/api/advertiser/creators?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setCreators(data.creators || [])
        console.log('Fetched creators:', data.creators?.length || 0)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to fetch creators:', response.status, errorData)
        setCreators([])
      }
    } catch (error) {
      console.error('Failed to fetch creators:', error)
      setCreators([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Search Username
                  </label>
                  <Input
                    type="text"
                    value={filters.search}
                    onChange={(e) => {
                      const value = e.target.value
                      setFilters(prev => ({ ...prev, search: value }))
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder="Search username..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Min ELO
                  </label>
                  <Input
                    type="number"
                    value={filters.minELO}
                    onChange={(e) => {
                      const value = e.target.value
                      setFilters(prev => ({ ...prev, minELO: value }))
                    }}
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
                    onChange={(e) => {
                      const value = e.target.value
                      setFilters(prev => ({ ...prev, minFollowers: value }))
                    }}
                    placeholder="100"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  variant="primary" 
                  onClick={handleSearch}
                  isLoading={isLoading}
                >
                  Search
                </Button>
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
                      type="button"
                      variant="primary"
                      className="w-full"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleOpenOfferModal(creator)
                      }}
                    >
                      Make Offer
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {!isLoading && hasSearched && creators.length === 0 && (
            <Card>
              <CardBody>
                <p className="text-text-secondary text-center py-8">
                  No creators found matching your filters.
                </p>
              </CardBody>
            </Card>
          )}

          {!isLoading && !hasSearched && creators.length === 0 && (
            <Card>
              <CardBody>
                <p className="text-text-secondary text-center py-8">
                  Enter search criteria and click "Search" to find creators.
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Make Offer Modal */}
      <Modal
        isOpen={showOfferModal}
        onClose={handleCloseOfferModal}
        title={`Make Offer to @${selectedCreator?.username || ''}`}
        size="lg"
      >
        {selectedCreator && (
          <div className="space-y-4">
            {/* Campaign Selection */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Campaign *
              </label>
              {isLoadingCampaigns ? (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : campaigns.length === 0 ? (
                <div className="p-4 bg-bg-tertiary rounded-lg text-text-secondary text-sm">
                  No approved campaigns found. Please create and get a campaign approved first.
                </div>
              ) : (
                <select
                  value={offerForm.campaignId}
                  onChange={(e) => setOfferForm({ ...offerForm, campaignId: e.target.value })}
                  className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary"
                >
                  <option value="">Select a campaign...</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Placement Selection */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Ad Placement *
              </label>
              <select
                value={offerForm.placement}
                onChange={(e) => setOfferForm({ ...offerForm, placement: e.target.value })}
                className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary"
              >
                {selectedCreator.profileBannerAvailable && (
                  <option value="PROFILE_BANNER">Profile Banner</option>
                )}
                {selectedCreator.postDebateAvailable && (
                  <option value="POST_DEBATE">Post-Debate</option>
                )}
                {selectedCreator.debateWidgetAvailable && (
                  <option value="DEBATE_WIDGET">Debate Widget</option>
                )}
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Duration (days) *
              </label>
              <Input
                type="number"
                value={offerForm.duration}
                onChange={(e) => setOfferForm({ ...offerForm, duration: e.target.value })}
                placeholder="30"
                min="1"
              />
            </div>

            {/* Payment Type */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Payment Type *
              </label>
              <select
                value={offerForm.paymentType}
                onChange={(e) => setOfferForm({ ...offerForm, paymentType: e.target.value })}
                className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary"
              >
                <option value="FLAT_RATE">Flat Rate</option>
                <option value="PAY_PER_CLICK">Pay Per Click (CPC)</option>
                <option value="PAY_PER_IMPRESSION">Pay Per Impression (CPM)</option>
                <option value="PERFORMANCE_BONUS">Performance Bonus</option>
                <option value="REVENUE_SHARE">Revenue Share</option>
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Amount ($) *
              </label>
              <Input
                type="number"
                value={offerForm.amount}
                onChange={(e) => setOfferForm({ ...offerForm, amount: e.target.value })}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Message (Optional)
              </label>
              <textarea
                value={offerForm.message}
                onChange={(e) => setOfferForm({ ...offerForm, message: e.target.value })}
                className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary resize-none"
                rows={4}
                placeholder="Add a personal message to the creator..."
              />
            </div>

            <ModalFooter>
              <Button
                variant="secondary"
                onClick={handleCloseOfferModal}
                disabled={isSubmittingOffer}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmitOffer}
                isLoading={isSubmittingOffer}
                disabled={!offerForm.campaignId || !offerForm.amount || campaigns.length === 0}
              >
                Send Offer
              </Button>
            </ModalFooter>
          </div>
        )}
      </Modal>
    </div>
  )
}

