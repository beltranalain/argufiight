'use client'

import { useState, useEffect } from 'react'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'

// ============================================
// BASIC ADS TAB (Legacy System)
// ============================================
interface Advertisement {
  id: string
  title: string
  type: string
  creativeUrl: string
  targetUrl: string
  status: string
  startDate: string | null
  endDate: string | null
  impressions: number
  clicks: number
  category: string | null
  createdAt: string
}

function BasicAdsTab() {
  const { showToast } = useToast()
  const [ads, setAds] = useState<Advertisement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    type: 'BANNER',
    targetUrl: '',
    status: 'DRAFT',
    startDate: '',
    endDate: '',
    category: '',
    creativeUrl: '',
  })

  useEffect(() => {
    fetchAds()
  }, [])

  const fetchAds = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/advertisements')
      if (response.ok) {
        const data = await response.json()
        setAds(data.ads || [])
      }
    } catch (error) {
      console.error('Failed to fetch ads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingAd(null)
    setSelectedFile(null)
    setFormData({
      title: '',
      type: 'BANNER',
      targetUrl: '',
      status: 'DRAFT',
      startDate: '',
      endDate: '',
      category: '',
      creativeUrl: '',
    })
    setShowCreateModal(true)
  }

  const handleEdit = (ad: Advertisement) => {
    setEditingAd(ad)
    setSelectedFile(null)
    setFormData({
      title: ad.title,
      type: ad.type,
      targetUrl: ad.targetUrl,
      status: ad.status,
      startDate: ad.startDate ? ad.startDate.split('T')[0] : '',
      endDate: ad.endDate ? ad.endDate.split('T')[0] : '',
      category: ad.category || '',
      creativeUrl: ad.creativeUrl,
    })
    setShowCreateModal(true)
  }

  const handleSave = async () => {
    if (!formData.title || !formData.targetUrl) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Title and target URL are required',
      })
      return
    }

    if (!selectedFile && !formData.creativeUrl) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Please upload an image or provide an image URL',
      })
      return
    }

    try {
      setIsSaving(true)
      const url = editingAd
        ? `/api/admin/advertisements/${editingAd.id}`
        : '/api/admin/advertisements'
      const method = editingAd ? 'PUT' : 'POST'

      const submitFormData = new FormData()
      submitFormData.append('title', formData.title)
      submitFormData.append('type', formData.type)
      submitFormData.append('targetUrl', formData.targetUrl)
      submitFormData.append('status', formData.status)
      if (formData.startDate) submitFormData.append('startDate', formData.startDate)
      if (formData.endDate) submitFormData.append('endDate', formData.endDate)
      if (formData.category) submitFormData.append('category', formData.category)
      if (formData.creativeUrl && !selectedFile) {
        submitFormData.append('creativeUrl', formData.creativeUrl)
      }
      if (selectedFile) submitFormData.append('file', selectedFile)

      const response = await fetch(url, {
        method,
        body: submitFormData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save advertisement')
      }

      showToast({
        type: 'success',
        title: 'Success',
        description: `Advertisement ${editingAd ? 'updated' : 'created'} successfully!`,
      })

      setShowCreateModal(false)
      fetchAds()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to save advertisement',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this advertisement?')) return

    try {
      const response = await fetch(`/api/admin/advertisements/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete advertisement')
      }

      showToast({
        type: 'success',
        title: 'Success',
        description: 'Advertisement deleted successfully!',
      })

      fetchAds()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to delete advertisement',
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-cyber-green/20 text-cyber-green'
      case 'PAUSED':
        return 'bg-neon-orange/20 text-neon-orange'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'BANNER':
        return 'bg-electric-blue/20 text-electric-blue'
      case 'SPONSORED_DEBATE':
        return 'bg-cyber-green/20 text-cyber-green'
      case 'IN_FEED':
        return 'bg-neon-orange/20 text-neon-orange'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Basic Advertisements</h2>
          <p className="text-text-secondary mt-1">Legacy ad system - for configuration only</p>
        </div>
        <Button variant="primary" onClick={handleCreate}>
          Create Advertisement
        </Button>
      </div>

      <Card>
        <CardBody>
          <p className="text-text-secondary mb-4">
            Manage advertisements for your platform. This is a foundation for future ad revenue.
            Ads are not displayed on the site yet - this is for configuration only.
          </p>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads.map((ad) => (
          <Card key={ad.id}>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-text-primary">{ad.title}</h3>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(ad.status)}>{ad.status}</Badge>
                  <Badge className={getTypeColor(ad.type)}>{ad.type}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div className="mb-4">
                <img
                  src={ad.creativeUrl}
                  alt={ad.title}
                  className="w-full h-32 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-image.png'
                  }}
                />
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-text-secondary">
                  <span className="font-semibold">Target URL:</span>{' '}
                  <a
                    href={ad.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-electric-blue hover:underline"
                  >
                    {ad.targetUrl.length > 30 ? `${ad.targetUrl.substring(0, 30)}...` : ad.targetUrl}
                  </a>
                </p>
                {ad.category && (
                  <p className="text-sm text-text-secondary">
                    <span className="font-semibold">Category:</span> {ad.category}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm text-text-secondary">
                  <span>
                    <span className="font-semibold">Impressions:</span> {ad.impressions.toLocaleString()}
                  </span>
                  <span>
                    <span className="font-semibold">Clicks:</span> {ad.clicks.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleEdit(ad)}
                  className="flex-1"
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(ad.id)}
                  className="flex-1"
                >
                  Delete
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {ads.length === 0 && (
        <Card>
          <CardBody>
            <p className="text-text-secondary text-center py-8">
              No advertisements yet. Create your first ad campaign to get started.
            </p>
          </CardBody>
        </Card>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <h2 className="text-2xl font-bold text-text-primary">
                {editingAd ? 'Edit Advertisement' : 'Create New Advertisement'}
              </h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Title *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Advertisement title"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary"
                    >
                      <option value="BANNER">Banner</option>
                      <option value="SPONSORED_DEBATE">Sponsored Debate</option>
                      <option value="IN_FEED">In-Feed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Status *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="ACTIVE">Active</option>
                      <option value="PAUSED">Paused</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Target URL *
                  </label>
                  <Input
                    value={formData.targetUrl}
                    onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Creative Image *
                  </label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      setSelectedFile(file || null)
                    }}
                    className="w-full"
                  />
                  {!selectedFile && (
                    <div className="mt-2">
                      <Input
                        value={formData.creativeUrl}
                        onChange={(e) => setFormData({ ...formData, creativeUrl: e.target.value })}
                        placeholder="Or enter image URL"
                      />
                    </div>
                  )}
                  {editingAd && editingAd.creativeUrl && !selectedFile && (
                    <div className="mt-2">
                      <img
                        src={editingAd.creativeUrl}
                        alt="Current creative"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Category (optional)
                  </label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Target specific category"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    isLoading={isSaving}
                    className="flex-1"
                  >
                    {editingAd ? 'Update' : 'Create'} Advertisement
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  )
}

// ============================================
// PLATFORM ADS TAB
// ============================================
interface Campaign {
  id: string
  name: string
  type: string
  status: string
  budget: number
  startDate: string
  endDate: string
  createdAt: string
  advertiser?: {
    companyName: string
  }
}

function PlatformAdsTab() {
  const { showToast } = useToast()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [platformAdsEnabled, setPlatformAdsEnabled] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [campaignsRes, settingsRes] = await Promise.all([
        fetch('/api/admin/campaigns?type=PLATFORM_ADS'),
        fetch('/api/admin/settings'),
      ])

      if (campaignsRes.ok) {
        const data = await campaignsRes.json()
        setCampaigns(data.campaigns || [])
      }

      if (settingsRes.ok) {
        const settings = await settingsRes.json()
        setPlatformAdsEnabled(settings.ADS_PLATFORM_ENABLED === 'true')
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const togglePlatformAds = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ADS_PLATFORM_ENABLED: (!platformAdsEnabled).toString(),
        }),
      })

      if (response.ok) {
        setPlatformAdsEnabled(!platformAdsEnabled)
        showToast({
          type: 'success',
          title: 'Success',
          description: `Platform Ads ${!platformAdsEnabled ? 'enabled' : 'disabled'}`,
        })
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to update setting',
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-cyber-green/20 text-cyber-green'
      case 'SCHEDULED':
        return 'bg-electric-blue/20 text-electric-blue'
      case 'PAUSED':
        return 'bg-neon-orange/20 text-neon-orange'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Platform Ads</h2>
          <p className="text-text-secondary mt-1">Manage platform-wide advertising campaigns</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-text-secondary">Platform Ads:</span>
            <button
              onClick={togglePlatformAds}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                platformAdsEnabled ? 'bg-electric-blue' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  platformAdsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${platformAdsEnabled ? 'text-cyber-green' : 'text-gray-400'}`}>
              {platformAdsEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <Button variant="primary">Create Campaign</Button>
        </div>
      </div>

      {!platformAdsEnabled && (
        <Card>
          <CardBody>
            <p className="text-text-secondary">
              Platform Ads are currently disabled. Enable the toggle above to start managing campaigns.
            </p>
          </CardBody>
        </Card>
      )}

      {platformAdsEnabled && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardBody>
                <div className="text-2xl font-bold text-text-primary">{campaigns.length}</div>
                <div className="text-text-secondary">Total Campaigns</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-2xl font-bold text-cyber-green">
                  {campaigns.filter((c) => c.status === 'ACTIVE').length}
                </div>
                <div className="text-text-secondary">Active Campaigns</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-2xl font-bold text-electric-blue">
                  ${campaigns.reduce((sum, c) => sum + Number(c.budget), 0).toLocaleString()}
                </div>
                <div className="text-text-secondary">Total Budget</div>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <h3 className="text-xl font-bold text-text-primary">Campaigns</h3>
            </CardHeader>
            <CardBody>
              {campaigns.length === 0 ? (
                <p className="text-text-secondary text-center py-8">
                  No campaigns yet. Create your first campaign to get started.
                </p>
              ) : (
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-bg-tertiary"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-lg font-bold text-text-primary">{campaign.name}</h4>
                          <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
                        </div>
                        <div className="text-sm text-text-secondary space-y-1">
                          <p>Budget: ${Number(campaign.budget).toLocaleString()}</p>
                          <p>
                            Duration:{' '}
                            {new Date(campaign.startDate).toLocaleDateString()} -{' '}
                            {new Date(campaign.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm">
                          View
                        </Button>
                        <Button variant="secondary" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  )
}

// ============================================
// CREATOR MARKETPLACE TAB
// ============================================
interface Advertiser {
  id: string
  companyName: string
  industry: string
  contactEmail: string
  status: string
  createdAt: string
  approvedAt?: string | null
  rejectionReason?: string | null
  suspendedAt?: string | null
  suspensionReason?: string | null
}

interface MarketplaceCampaign {
  id: string
  name: string
  status: string
  advertiser: {
    companyName: string
  }
  createdAt: string
}

interface Contract {
  id: string
  status: string
  totalAmount: number
  advertiser: {
    companyName: string
  }
  creator: {
    username: string
  }
  endDate: string
}

function CreatorMarketplaceTab() {
  const { showToast } = useToast()
  const [pendingAdvertisers, setPendingAdvertisers] = useState<Advertiser[]>([])
  const [approvedAdvertisers, setApprovedAdvertisers] = useState<Advertiser[]>([])
  const [rejectedAdvertisers, setRejectedAdvertisers] = useState<Advertiser[]>([])
  const [pendingCampaigns, setPendingCampaigns] = useState<MarketplaceCampaign[]>([])
  const [activeContracts, setActiveContracts] = useState<Contract[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [marketplaceEnabled, setMarketplaceEnabled] = useState(false)
  const [advertiserSubTab, setAdvertiserSubTab] = useState('pending')
  const [stats, setStats] = useState({
    pendingAdvertisers: 0,
    activeContracts: 0,
    monthlyRevenue: 0,
    totalCreators: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [pendingRes, approvedRes, rejectedRes, campaignsRes, contractsRes, statsRes, settingsRes] = await Promise.all([
        fetch('/api/admin/advertisers?status=PENDING'),
        fetch('/api/admin/advertisers?status=APPROVED'),
        fetch('/api/admin/advertisers?status=REJECTED'),
        fetch('/api/admin/campaigns?status=PENDING_REVIEW'),
        fetch('/api/admin/contracts?status=ACTIVE'),
        fetch('/api/admin/marketplace/stats'),
        fetch('/api/admin/settings'),
      ])

      if (pendingRes.ok) {
        const data = await pendingRes.json()
        setPendingAdvertisers(data.advertisers || [])
      }

      if (approvedRes.ok) {
        const data = await approvedRes.json()
        setApprovedAdvertisers(data.advertisers || [])
      }

      if (rejectedRes.ok) {
        const data = await rejectedRes.json()
        setRejectedAdvertisers(data.advertisers || [])
      }

      if (campaignsRes.ok) {
        const data = await campaignsRes.json()
        setPendingCampaigns(data.campaigns || [])
      }

      if (contractsRes.ok) {
        const data = await contractsRes.json()
        setActiveContracts(data.contracts || [])
      }

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }

      if (settingsRes.ok) {
        const settings = await settingsRes.json()
        setMarketplaceEnabled(settings.ADS_CREATOR_MARKETPLACE_ENABLED === 'true')
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMarketplace = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ADS_CREATOR_MARKETPLACE_ENABLED: (!marketplaceEnabled).toString(),
        }),
      })

      if (response.ok) {
        setMarketplaceEnabled(!marketplaceEnabled)
        showToast({
          type: 'success',
          title: 'Success',
          description: `Creator Marketplace ${!marketplaceEnabled ? 'enabled' : 'disabled'}`,
        })
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to update setting',
      })
    }
  }

  const handleApproveAdvertiser = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/advertisers/${id}/approve`, {
        method: 'POST',
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Success',
          description: 'Advertiser approved',
        })
        fetchData()
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to approve advertiser',
      })
    }
  }

  const handleRejectAdvertiser = async (id: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/advertisers/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Success',
          description: 'Advertiser rejected',
        })
        fetchData()
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to reject advertiser',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Creator Marketplace</h2>
          <p className="text-text-secondary mt-1">
            Manage advertiser applications and creator contracts
          </p>
          <p className="text-xs text-text-secondary mt-2">
            💡 Advertisers sign up at <a href="/advertise" target="_blank" className="text-electric-blue hover:underline">/advertise</a> | 
            Creators view contracts at <a href="/creator/dashboard" target="_blank" className="text-electric-blue hover:underline">/creator/dashboard</a>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-secondary">Creator Marketplace:</span>
          <button
            onClick={toggleMarketplace}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              marketplaceEnabled ? 'bg-electric-blue' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                marketplaceEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm ${marketplaceEnabled ? 'text-cyber-green' : 'text-gray-400'}`}>
            {marketplaceEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {!marketplaceEnabled && (
        <Card>
          <CardBody>
            <p className="text-text-secondary">
              Creator Marketplace is currently disabled. Enable the toggle above to start managing advertisers and contracts.
            </p>
          </CardBody>
        </Card>
      )}

      {marketplaceEnabled && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardBody>
                <div className="text-2xl font-bold text-neon-orange">{stats.pendingAdvertisers}</div>
                <div className="text-text-secondary">Pending Advertisers</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-2xl font-bold text-cyber-green">{stats.activeContracts}</div>
                <div className="text-text-secondary">Active Contracts</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-2xl font-bold text-electric-blue">
                  ${stats.monthlyRevenue.toLocaleString()}
                </div>
                <div className="text-text-secondary">Monthly Revenue</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-2xl font-bold text-purple-400">{stats.totalCreators}</div>
                <div className="text-text-secondary">Total Creators</div>
              </CardBody>
            </Card>
          </div>

          {/* Advertiser Applications with Sub-tabs */}
          <Card>
            <CardHeader>
              <h3 className="text-xl font-bold text-text-primary">Advertiser Applications</h3>
            </CardHeader>
            <CardBody>
              <div className="border-b border-bg-tertiary mb-4">
                <div className="flex gap-1">
                  {[
                    { id: 'pending', label: 'Pending', count: pendingAdvertisers.length },
                    { id: 'approved', label: 'Approved', count: approvedAdvertisers.length },
                    { id: 'rejected', label: 'Rejected', count: rejectedAdvertisers.length },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setAdvertiserSubTab(tab.id)}
                      className={`px-4 py-2 font-medium transition-colors relative ${
                        advertiserSubTab === tab.id
                          ? 'text-electric-blue'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <Badge className={`ml-2 ${tab.id === 'pending' ? 'bg-neon-orange/20 text-neon-orange' : tab.id === 'approved' ? 'bg-cyber-green/20 text-cyber-green' : 'bg-red-500/20 text-red-500'}`}>
                          {tab.count}
                        </Badge>
                      )}
                      {advertiserSubTab === tab.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-electric-blue" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pending Tab */}
              {advertiserSubTab === 'pending' && (
                <div>
                  {pendingAdvertisers.length === 0 ? (
                    <p className="text-text-secondary">No pending applications</p>
                  ) : (
                    <div className="space-y-4">
                      {pendingAdvertisers.map((advertiser) => (
                        <div
                          key={advertiser.id}
                          className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-bg-tertiary"
                        >
                          <div>
                            <h4 className="text-lg font-bold text-text-primary">{advertiser.companyName}</h4>
                            <div className="text-sm text-text-secondary space-y-1 mt-2">
                              <p>Industry: {advertiser.industry}</p>
                              <p>Contact: {advertiser.contactEmail}</p>
                              <p>Applied: {new Date(advertiser.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleApproveAdvertiser(advertiser.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => {
                                const reason = prompt('Rejection reason:')
                                if (reason) handleRejectAdvertiser(advertiser.id, reason)
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Approved Tab */}
              {advertiserSubTab === 'approved' && (
                <div>
                  {approvedAdvertisers.length === 0 ? (
                    <p className="text-text-secondary">No approved advertisers</p>
                  ) : (
                    <div className="space-y-4">
                      {approvedAdvertisers.map((advertiser) => (
                        <div
                          key={advertiser.id}
                          className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-bg-tertiary"
                        >
                          <div>
                            <h4 className="text-lg font-bold text-text-primary">{advertiser.companyName}</h4>
                            <div className="text-sm text-text-secondary space-y-1 mt-2">
                              <p>Industry: {advertiser.industry}</p>
                              <p>Contact: {advertiser.contactEmail}</p>
                              <p>Approved: {advertiser.approvedAt ? new Date(advertiser.approvedAt).toLocaleDateString() : 'N/A'}</p>
                            </div>
                          </div>
                          <Badge className="bg-cyber-green/20 text-cyber-green">APPROVED</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Rejected Tab */}
              {advertiserSubTab === 'rejected' && (
                <div>
                  {rejectedAdvertisers.length === 0 ? (
                    <p className="text-text-secondary">No rejected advertisers</p>
                  ) : (
                    <div className="space-y-4">
                      {rejectedAdvertisers.map((advertiser) => (
                        <div
                          key={advertiser.id}
                          className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-bg-tertiary"
                        >
                          <div>
                            <h4 className="text-lg font-bold text-text-primary">{advertiser.companyName}</h4>
                            <div className="text-sm text-text-secondary space-y-1 mt-2">
                              <p>Industry: {advertiser.industry}</p>
                              <p>Contact: {advertiser.contactEmail}</p>
                              <p>Rejected: {new Date(advertiser.createdAt).toLocaleDateString()}</p>
                              {advertiser.rejectionReason && (
                                <p className="text-neon-orange">Reason: {advertiser.rejectionReason}</p>
                              )}
                            </div>
                          </div>
                          <Badge className="bg-red-500/20 text-red-500">REJECTED</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Pending Campaign Reviews */}
          <Card>
            <CardHeader>
              <h3 className="text-xl font-bold text-text-primary">
                Pending Campaign Reviews
                {pendingCampaigns.length > 0 && (
                  <Badge className="ml-3 bg-neon-orange/20 text-neon-orange">
                    {pendingCampaigns.length}
                  </Badge>
                )}
              </h3>
            </CardHeader>
            <CardBody>
              {pendingCampaigns.length === 0 ? (
                <p className="text-text-secondary">No pending campaigns</p>
              ) : (
                <div className="space-y-4">
                  {pendingCampaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-bg-tertiary"
                    >
                      <div>
                        <h4 className="text-lg font-bold text-text-primary">{campaign.name}</h4>
                        <p className="text-sm text-text-secondary">
                          Advertiser: {campaign.advertiser.companyName}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="primary" size="sm">
                          Approve
                        </Button>
                        <Button variant="danger" size="sm">
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Active Contracts */}
          <Card>
            <CardHeader>
              <h3 className="text-xl font-bold text-text-primary">
                Active Contracts ({activeContracts.length})
              </h3>
            </CardHeader>
            <CardBody>
              {activeContracts.length === 0 ? (
                <p className="text-text-secondary">No active contracts</p>
              ) : (
                <div className="space-y-4">
                  {activeContracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-bg-tertiary"
                    >
                      <div>
                        <h4 className="text-lg font-bold text-text-primary">
                          {contract.advertiser.companyName} × @{contract.creator.username}
                        </h4>
                        <div className="text-sm text-text-secondary space-y-1 mt-2">
                          <p>Amount: ${Number(contract.totalAmount).toLocaleString()}</p>
                          <p>Ends: {new Date(contract.endDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Badge className="bg-cyber-green/20 text-cyber-green">ACTIVE</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  )
}

// ============================================
// ADVERTISERS MANAGEMENT TAB
// ============================================
function AdvertisersManagementTab() {
  const { showToast } = useToast()
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<Advertiser | null>(null)
  const [advertiserStats, setAdvertiserStats] = useState<any>(null)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')

  useEffect(() => {
    fetchAdvertisers()
  }, [])

  const fetchAdvertisers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/advertisers')
      if (response.ok) {
        const data = await response.json()
        setAdvertisers(data.advertisers || [])
      }
    } catch (error) {
      console.error('Failed to fetch advertisers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewStats = async (advertiser: Advertiser) => {
    try {
      const response = await fetch(`/api/admin/advertisers/${advertiser.id}/stats`)
      if (response.ok) {
        const data = await response.json()
        setAdvertiserStats(data)
        setSelectedAdvertiser(advertiser)
        setShowStatsModal(true)
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to fetch advertiser stats',
      })
    }
  }

  const handleSuspend = async () => {
    if (!selectedAdvertiser) return

    try {
      const response = await fetch(`/api/admin/advertisers/${selectedAdvertiser.id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: suspendReason }),
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Success',
          description: 'Advertiser suspended',
        })
        setShowSuspendModal(false)
        setSuspendReason('')
        fetchAdvertisers()
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to suspend advertiser',
      })
    }
  }

  const handleUnsuspend = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/advertisers/${id}/suspend`, {
        method: 'DELETE',
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Success',
          description: 'Advertiser unsuspended',
        })
        fetchAdvertisers()
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to unsuspend advertiser',
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-cyber-green/20 text-cyber-green">APPROVED</Badge>
      case 'PENDING':
        return <Badge className="bg-neon-orange/20 text-neon-orange">PENDING</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-500/20 text-red-500">REJECTED</Badge>
      case 'SUSPENDED':
        return <Badge className="bg-yellow-500/20 text-yellow-500">SUSPENDED</Badge>
      case 'BANNED':
        return <Badge className="bg-red-600/20 text-red-600">BANNED</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Advertisers Management</h2>
        <p className="text-text-secondary mt-1">
          Manage all advertisers, view stats, and suspend accounts
        </p>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-xl font-bold text-text-primary">
            All Advertisers ({advertisers.length})
          </h3>
        </CardHeader>
        <CardBody>
          {advertisers.length === 0 ? (
            <p className="text-text-secondary">No advertisers found</p>
          ) : (
            <div className="space-y-4">
              {advertisers.map((advertiser) => (
                <div
                  key={advertiser.id}
                  className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-bg-tertiary"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-bold text-text-primary">{advertiser.companyName}</h4>
                      {getStatusBadge(advertiser.status)}
                    </div>
                    <div className="text-sm text-text-secondary space-y-1">
                      <p>Industry: {advertiser.industry}</p>
                      <p>Contact: {advertiser.contactEmail}</p>
                      <p>Joined: {new Date(advertiser.createdAt).toLocaleDateString()}</p>
                      {advertiser.suspendedAt && (
                        <p className="text-yellow-500">
                          Suspended: {new Date(advertiser.suspendedAt).toLocaleDateString()}
                          {advertiser.suspensionReason && ` - ${advertiser.suspensionReason}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleViewStats(advertiser)}
                    >
                      View Stats
                    </Button>
                    {advertiser.status === 'SUSPENDED' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUnsuspend(advertiser.id)}
                      >
                        Unsuspend
                      </Button>
                    ) : advertiser.status === 'APPROVED' ? (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setSelectedAdvertiser(advertiser)
                          setShowSuspendModal(true)
                        }}
                      >
                        Suspend
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Stats Modal */}
      {showStatsModal && advertiserStats && selectedAdvertiser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-text-primary">
                  Stats: {selectedAdvertiser.companyName}
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowStatsModal(false)
                    setAdvertiserStats(null)
                    setSelectedAdvertiser(null)
                  }}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-bg-secondary p-4 rounded-lg">
                  <div className="text-2xl font-bold text-text-primary">{advertiserStats.stats.totalCampaigns}</div>
                  <div className="text-sm text-text-secondary">Total Campaigns</div>
                </div>
                <div className="bg-bg-secondary p-4 rounded-lg">
                  <div className="text-2xl font-bold text-cyber-green">{advertiserStats.stats.activeCampaigns}</div>
                  <div className="text-sm text-text-secondary">Active Campaigns</div>
                </div>
                <div className="bg-bg-secondary p-4 rounded-lg">
                  <div className="text-2xl font-bold text-electric-blue">
                    ${advertiserStats.stats.totalSpent.toLocaleString()}
                  </div>
                  <div className="text-sm text-text-secondary">Total Spent</div>
                </div>
                <div className="bg-bg-secondary p-4 rounded-lg">
                  <div className="text-2xl font-bold text-text-primary">
                    {advertiserStats.stats.totalImpressions.toLocaleString()}
                  </div>
                  <div className="text-sm text-text-secondary">Impressions</div>
                </div>
                <div className="bg-bg-secondary p-4 rounded-lg">
                  <div className="text-2xl font-bold text-text-primary">
                    {advertiserStats.stats.totalClicks.toLocaleString()}
                  </div>
                  <div className="text-sm text-text-secondary">Clicks</div>
                </div>
                <div className="bg-bg-secondary p-4 rounded-lg">
                  <div className="text-2xl font-bold text-cyber-green">
                    {advertiserStats.stats.clickThroughRate}%
                  </div>
                  <div className="text-sm text-text-secondary">CTR</div>
                </div>
                <div className="bg-bg-secondary p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">
                    {advertiserStats.stats.activeContracts}
                  </div>
                  <div className="text-sm text-text-secondary">Active Contracts</div>
                </div>
                <div className="bg-bg-secondary p-4 rounded-lg">
                  <div className="text-2xl font-bold text-electric-blue">
                    ${advertiserStats.stats.totalContractValue.toLocaleString()}
                  </div>
                  <div className="text-sm text-text-secondary">Contract Value</div>
                </div>
                <div className="bg-bg-secondary p-4 rounded-lg">
                  <div className="text-2xl font-bold text-neon-orange">
                    {advertiserStats.stats.pendingOffers}
                  </div>
                  <div className="text-sm text-text-secondary">Pending Offers</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && selectedAdvertiser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <h3 className="text-xl font-bold text-text-primary">
                Suspend: {selectedAdvertiser.companyName}
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Suspension Reason (Optional)
                  </label>
                  <Input
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="Enter reason for suspension..."
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowSuspendModal(false)
                      setSuspendReason('')
                      setSelectedAdvertiser(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button variant="danger" onClick={handleSuspend}>
                    Suspend
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  )
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function AdvertisementsPage() {
  const [activeTab, setActiveTab] = useState('basic')

  const tabs = [
    { id: 'basic', label: 'Basic Ads', content: <BasicAdsTab /> },
    { id: 'platform', label: 'Platform Ads', content: <PlatformAdsTab /> },
    { id: 'marketplace', label: 'Creator Marketplace', content: <CreatorMarketplaceTab /> },
    { id: 'advertisers', label: 'Advertisers', content: <AdvertisersManagementTab /> },
  ]

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="ADMIN" />
      <div className="pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-text-primary">Advertisement Management</h1>
          </div>

          <Card>
            <Tabs tabs={tabs} defaultTab={activeTab} onChange={setActiveTab} />
          </Card>
        </div>
      </div>
    </div>
  )
}
