'use client'

import { useState, useEffect, useRef } from 'react'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { Modal } from '@/components/ui/Modal'
import { EmailTemplateEditor } from '@/components/admin/EmailTemplateEditor'
import { CreatorsTab } from './CreatorsTab'
import { calculateStripeFees } from '@/lib/stripe/fee-calculator'

// ============================================
// DIRECT ADS TAB
// Admin-created ads for direct clients and internal promotions
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

function DirectAdsTab() {
  const { showToast } = useToast()
  const [ads, setAds] = useState<Advertisement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const fetchAds = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true)
      const response = await fetch('/api/admin/advertisements', {
        cache: 'no-store', // Prevent stale data
      })
      if (response.ok) {
        const data = await response.json()
        setAds(data.ads || [])
      }
    } catch (error) {
      console.error('Failed to fetch ads:', error)
    } finally {
      if (showLoading) setIsLoading(false)
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
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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
      console.log('[DirectAdsTab] Saving advertisement...', { editingAd: editingAd?.id, formData })
      
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
      // Handle creativeUrl: always send if editing (to preserve existing) or if provided for new ads
      if (editingAd && !selectedFile) {
        // When editing: always send creativeUrl to preserve or update it
        // Use formData.creativeUrl if set, otherwise use existing ad's creativeUrl
        const urlToSend = formData.creativeUrl || editingAd.creativeUrl || ''
        if (urlToSend) {
          submitFormData.append('creativeUrl', urlToSend)
          console.log('[DirectAdsTab] Sending creativeUrl for update:', urlToSend)
        }
      } else if (!editingAd && formData.creativeUrl && !selectedFile) {
        // For new ads, only send if no file
        submitFormData.append('creativeUrl', formData.creativeUrl)
      }
      if (selectedFile) {
        submitFormData.append('file', selectedFile)
        console.log('[DirectAdsTab] Sending new file:', selectedFile.name)
      }

      console.log('[DirectAdsTab] Calling API:', method, url)
      const response = await fetch(url, {
        method,
        body: submitFormData,
        cache: 'no-store',
      })

      console.log('[DirectAdsTab] Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        let error
        try {
          error = JSON.parse(errorText)
        } catch {
          error = { error: errorText || 'Failed to save advertisement' }
        }
        console.error('[DirectAdsTab] Save error:', error)
        throw new Error(error.error || 'Failed to save advertisement')
      }

      const result = await response.json()
      console.log('[DirectAdsTab] Save successful:', result)
      const savedAd = result.ad

      // Optimistic update - add/update ad in list immediately
      if (editingAd) {
        setAds(prevAds => prevAds.map(ad => ad.id === editingAd.id ? savedAd : ad))
      } else {
        setAds(prevAds => [savedAd, ...prevAds])
      }

      showToast({
        type: 'success',
        title: 'Success',
        description: `Advertisement ${editingAd ? 'updated' : 'created'} successfully!`,
      })

      setShowCreateModal(false)
      
      // Reset form
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
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Force refresh to ensure consistency
      await fetchAds(false)
    } catch (error: any) {
      console.error('[DirectAdsTab] Save failed:', error)
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
          <h2 className="text-2xl font-bold text-text-primary">Direct Ads</h2>
          <p className="text-text-secondary mt-1">Admin-created ads that display immediately when active</p>
        </div>
        <Button variant="primary" onClick={handleCreate}>
          Create Direct Ad
        </Button>
      </div>

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
                  
                  {/* File Input */}
                  <div className="mb-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setSelectedFile(file)
                          // Clear URL input when file is selected
                          setFormData({ ...formData, creativeUrl: '' })
                        }
                      }}
                      className="block w-full text-sm text-text-secondary
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-electric-blue file:text-white
                        file:cursor-pointer file:hover:bg-[#00B8E6]
                        hover:file:bg-[#00B8E6]
                        file:transition-colors
                        bg-bg-secondary border border-bg-tertiary rounded-lg
                        cursor-pointer"
                      id="creative-image-upload"
                    />
                    {selectedFile && (
                      <div className="mt-2 p-2 bg-bg-secondary rounded-lg border border-bg-tertiary">
                        <p className="text-sm text-text-primary">
                          <strong>Selected:</strong> {selectedFile.name}
                        </p>
                        <p className="text-xs text-text-secondary mt-1">
                          Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        {selectedFile.type.startsWith('image/') && (
                          <div className="mt-2">
                            <img
                              src={URL.createObjectURL(selectedFile)}
                              alt="Preview"
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(null)
                            if (fileInputRef.current) {
                              fileInputRef.current.value = ''
                            }
                          }}
                          className="mt-2"
                        >
                          Remove File
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* URL Input (only show if no file selected) */}
                  {!selectedFile && (
                    <div>
                      <Input
                        value={formData.creativeUrl}
                        onChange={(e) => setFormData({ ...formData, creativeUrl: e.target.value })}
                        placeholder="Or enter image URL (e.g., https://example.com/image.jpg)"
                      />
                      {formData.creativeUrl && (
                        <div className="mt-2">
                          <img
                            src={formData.creativeUrl}
                            alt="URL Preview"
                            className="w-full h-32 object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show current image when editing (if no new file selected) */}
                  {editingAd && editingAd.creativeUrl && !selectedFile && !formData.creativeUrl && (
                    <div className="mt-2">
                      <p className="text-sm text-text-secondary mb-2">Current Image:</p>
                      <img
                        src={editingAd.creativeUrl}
                        alt="Current creative"
                        className="w-full h-32 object-cover rounded-lg border border-bg-tertiary"
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
  rejectionReason?: string
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
      } else {
        const errorText = await campaignsRes.text().catch(() => 'Unable to read error')
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText || `HTTP ${campaignsRes.status}` }
        }
        console.error('[AdvertiserCampaigns] Failed to fetch campaigns:', campaignsRes.status, errorData)
      }

      if (settingsRes.ok) {
        const settings = await settingsRes.json()
        setPlatformAdsEnabled(settings.ADS_PLATFORM_ENABLED === 'true')
      } else {
        console.error('[AdvertiserCampaigns] Failed to fetch settings:', settingsRes.status)
      }
    } catch (error) {
      console.error('[AdvertiserCampaigns] Failed to fetch data:', error)
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

  const handleApproveCampaign = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/campaigns/${id}/approve`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        const isActivated = data.campaign?.status === 'ACTIVE'
        showToast({
          type: 'success',
          title: 'Success',
          description: isActivated 
            ? 'Campaign approved and activated (start date reached)' 
            : 'Campaign approved (will activate when start date is reached)',
        })
        fetchData()
      } else {
        const errorData = await response.json()
        showToast({
          type: 'error',
          title: 'Error',
          description: errorData.error || 'Failed to approve campaign',
        })
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to approve campaign',
      })
    }
  }

  const handleActivateCampaign = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/campaigns/${id}/activate`, {
        method: 'POST',
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Success',
          description: 'Campaign activated',
        })
        fetchData()
      } else {
        const errorData = await response.json()
        showToast({
          type: 'error',
          title: 'Error',
          description: errorData.error || 'Failed to activate campaign',
        })
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to activate campaign',
      })
    }
  }

  const handleRejectCampaign = async (id: string) => {
    const reason = prompt('Please provide a reason for rejecting this campaign:')
    if (!reason || reason.trim() === '') {
      return // User cancelled or entered empty reason
    }

    try {
      const response = await fetch(`/api/admin/campaigns/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Success',
          description: 'Campaign rejected',
        })
        fetchData()
      } else {
        const errorData = await response.json()
        showToast({
          type: 'error',
          title: 'Error',
          description: errorData.error || 'Failed to reject campaign',
        })
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to reject campaign',
      })
    }
  }

  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [campaignDetails, setCampaignDetails] = useState<any>(null)
  const [isLoadingCampaignDetails, setIsLoadingCampaignDetails] = useState(false)

  const handleViewCampaign = async (id: string) => {
    try {
      setIsLoadingCampaignDetails(true)
      const response = await fetch(`/api/admin/campaigns/${id}`)
      if (response.ok) {
        const data = await response.json()
        setCampaignDetails(data.campaign)
        setSelectedCampaign(campaigns.find(c => c.id === id) || null)
        setShowCampaignModal(true)
      } else {
        showToast({
          type: 'error',
          title: 'Error',
          description: 'Failed to load campaign details',
        })
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load campaign details',
      })
    } finally {
      setIsLoadingCampaignDetails(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-cyber-green/20 text-cyber-green'
      case 'APPROVED':
        return 'bg-cyber-green/20 text-cyber-green'
      case 'SCHEDULED':
        return 'bg-electric-blue/20 text-electric-blue'
      case 'PAUSED':
        return 'bg-neon-orange/20 text-neon-orange'
      case 'PENDING_REVIEW':
      case 'PENDING REVIEW':
        return 'bg-neon-orange/20 text-neon-orange'
      case 'REJECTED':
        return 'bg-red-500/20 text-red-500'
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
          <h2 className="text-2xl font-bold text-text-primary">Advertiser Campaigns</h2>
          <p className="text-text-secondary mt-1">Review and manage campaigns from external advertisers</p>
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
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-lg font-bold text-text-primary">{campaign.name}</h4>
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                          </Badge>
                          {campaign.advertiser && (
                            <span className="text-sm text-text-secondary">
                              by {campaign.advertiser.companyName}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-text-secondary space-y-1">
                          <p>Budget: ${Number(campaign.budget).toLocaleString()}</p>
                          <p>
                            Duration:{' '}
                            {new Date(campaign.startDate).toLocaleDateString()} -{' '}
                            {new Date(campaign.endDate).toLocaleDateString()}
                          </p>
                          {campaign.status === 'REJECTED' && campaign.rejectionReason && (
                            <p className="text-red-400 text-xs mt-1">
                              Reason: {campaign.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleViewCampaign(campaign.id)}
                        >
                          View
                        </Button>
                        {(campaign.status === 'PENDING_REVIEW' || campaign.status === 'PENDING REVIEW') && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleApproveCampaign(campaign.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleRejectCampaign(campaign.id)}
                              className="bg-red-500/20 text-red-500 hover:bg-red-500/30"
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {campaign.status === 'APPROVED' && (
                          <>
                            <Badge className="bg-cyber-green/20 text-cyber-green">
                              Approved - Waiting for start date
                            </Badge>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleActivateCampaign(campaign.id)}
                            >
                              Activate Now
                            </Button>
                          </>
                        )}
                        {campaign.status === 'ACTIVE' && (
                          <Badge className="bg-electric-blue/20 text-electric-blue">
                            Active
                          </Badge>
                        )}
                        {campaign.status === 'REJECTED' && (
                          <Badge className="bg-red-500/20 text-red-500">
                            Rejected
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Campaign Details Modal */}
          {showCampaignModal && campaignDetails && (
            <Modal
              isOpen={showCampaignModal}
              onClose={() => {
                setShowCampaignModal(false)
                setCampaignDetails(null)
                setSelectedCampaign(null)
              }}
              title={`Campaign Details: ${campaignDetails.name}`}
              size="large"
            >
              {isLoadingCampaignDetails ? (
                <div className="flex justify-center items-center h-48">
                  <LoadingSpinner size="lg" />
                </div>
              ) : campaignDetails ? (
                <div className="space-y-6 text-text-primary">
                  {/* Advertiser Info */}
                  <Card>
                    <CardHeader>
                      <h4 className="text-lg font-bold">Advertiser Information</h4>
                    </CardHeader>
                    <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-text-secondary">Company Name</label>
                        <p className="font-medium">{campaignDetails.advertiser?.companyName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-text-secondary">Contact Email</label>
                        <p className="font-medium">{campaignDetails.advertiser?.contactEmail || 'N/A'}</p>
                      </div>
                      {campaignDetails.advertiser?.contactName && (
                        <div>
                          <label className="text-sm text-text-secondary">Contact Name</label>
                          <p className="font-medium">{campaignDetails.advertiser.contactName}</p>
                        </div>
                      )}
                      {campaignDetails.advertiser?.contactPhone && (
                        <div>
                          <label className="text-sm text-text-secondary">Phone Number</label>
                          <p className="font-medium">{campaignDetails.advertiser.contactPhone}</p>
                        </div>
                      )}
                    </CardBody>
                  </Card>

                  {/* Campaign Info */}
                  <Card>
                    <CardHeader>
                      <h4 className="text-lg font-bold">Campaign Information</h4>
                    </CardHeader>
                    <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-text-secondary">Campaign Name</label>
                        <p className="font-medium">{campaignDetails.name}</p>
                      </div>
                      <div>
                        <label className="text-sm text-text-secondary">Type</label>
                        <p className="font-medium">{campaignDetails.type}</p>
                      </div>
                      <div>
                        <label className="text-sm text-text-secondary">Category</label>
                        <p className="font-medium">{campaignDetails.category || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-text-secondary">Status</label>
                        <div className="mt-1">
                          <Badge className={
                            campaignDetails.status === 'PENDING_REVIEW' ? 'bg-neon-orange/20 text-neon-orange' :
                            campaignDetails.status === 'APPROVED' ? 'bg-cyber-green/20 text-cyber-green' :
                            campaignDetails.status === 'ACTIVE' ? 'bg-electric-blue/20 text-electric-blue' :
                            campaignDetails.status === 'REJECTED' ? 'bg-red-500/20 text-red-500' :
                            'bg-gray-500/20 text-gray-400'
                          }>
                            {campaignDetails.status === 'PENDING_REVIEW' ? 'PENDING REVIEW' : campaignDetails.status}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-text-secondary">Start Date</label>
                        <p className="font-medium">{new Date(campaignDetails.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="text-sm text-text-secondary">End Date</label>
                        <p className="font-medium">{new Date(campaignDetails.endDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="text-sm text-text-secondary">Created At</label>
                        <p className="font-medium">{new Date(campaignDetails.createdAt).toLocaleString()}</p>
                      </div>
                      {campaignDetails.approvedAt && (
                        <div>
                          <label className="text-sm text-text-secondary">Approved At</label>
                          <p className="font-medium">{new Date(campaignDetails.approvedAt).toLocaleString()}</p>
                        </div>
                      )}
                    </CardBody>
                  </Card>

                  {/* Payment Info */}
                  {campaignDetails.paymentStatus === 'PAID' && (
                    <Card>
                      <CardHeader>
                        <h4 className="text-lg font-bold">Payment Information</h4>
                      </CardHeader>
                      <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-text-secondary">Campaign Budget (Base)</label>
                          <p className="font-medium text-lg">${Number(campaignDetails.budget).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <label className="text-sm text-text-secondary">Stripe Processing Fee</label>
                          <p className="font-medium text-lg text-neon-orange">
                            ${calculateStripeFees(Number(campaignDetails.budget)).fee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-text-secondary">Total Amount Paid</label>
                          <p className="font-bold text-xl text-cyber-green">
                            ${calculateStripeFees(Number(campaignDetails.budget)).total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-text-secondary">Payment Status</label>
                          <div className="mt-1">
                            <Badge className={campaignDetails.paymentStatus === 'PAID' ? 'bg-cyber-green/20 text-cyber-green' : 'bg-neon-orange/20 text-neon-orange'}>
                              {campaignDetails.paymentStatus || 'PENDING'}
                            </Badge>
                          </div>
                        </div>
                        {campaignDetails.paidAt && (
                          <div>
                            <label className="text-sm text-text-secondary">Paid At</label>
                            <p className="font-medium">{new Date(campaignDetails.paidAt).toLocaleString()}</p>
                          </div>
                        )}
                        {campaignDetails.stripePaymentId && (
                          <div>
                            <label className="text-sm text-text-secondary">Stripe Payment ID</label>
                            <p className="font-medium break-all">{campaignDetails.stripePaymentId}</p>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  )}

                  {/* Creative Assets */}
                  <Card>
                    <CardHeader>
                      <h4 className="text-lg font-bold">Creative Assets</h4>
                    </CardHeader>
                    <CardBody className="space-y-4">
                      {campaignDetails.bannerUrl && (
                        <div>
                          <label className="text-sm text-text-secondary">Banner Image</label>
                          <img src={campaignDetails.bannerUrl} alt="Campaign Banner" className="mt-2 max-w-full h-auto rounded-lg border border-bg-tertiary" />
                        </div>
                      )}
                      {campaignDetails.videoUrl && (
                        <div>
                          <label className="text-sm text-text-secondary">Video Preview</label>
                          <video src={campaignDetails.videoUrl} controls className="mt-2 max-w-full h-auto rounded-lg border border-bg-tertiary" />
                        </div>
                      )}
                      {!campaignDetails.bannerUrl && !campaignDetails.videoUrl && (
                        <p className="text-text-secondary">No creative assets provided.</p>
                      )}
                    </CardBody>
                  </Card>

                  {/* Campaign Settings */}
                  <Card>
                    <CardHeader>
                      <h4 className="text-lg font-bold">Campaign Settings</h4>
                    </CardHeader>
                    <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-text-secondary">Destination URL</label>
                        <a href={campaignDetails.destinationUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-electric-blue hover:underline break-all">
                          {campaignDetails.destinationUrl}
                        </a>
                      </div>
                      <div>
                        <label className="text-sm text-text-secondary">CTA Text</label>
                        <p className="font-medium">{campaignDetails.ctaText}</p>
                      </div>
                      {campaignDetails.rejectionReason && (
                        <div className="col-span-2">
                          <label className="text-sm text-text-secondary">Rejection Reason</label>
                          <p className="text-text-primary font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                            {campaignDetails.rejectionReason}
                          </p>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </div>
              ) : (
                <p className="text-text-secondary text-center py-8">Failed to load campaign details.</p>
              )}
              <div className="mt-6 flex justify-end">
                <Button variant="secondary" onClick={() => {
                  setShowCampaignModal(false)
                  setCampaignDetails(null)
                  setSelectedCampaign(null)
                }}>
                  Close
                </Button>
              </div>
            </Modal>
          )}
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
  contactName?: string | null
  contactPhone?: string | null
  website?: string | null
  businessEIN?: string | null
  companySize?: string | null
  monthlyAdBudget?: string | null
  marketingGoals?: string | null
  status: string
  createdAt: string
  approvedAt?: string | null
  rejectionReason?: string | null
  suspendedAt?: string | null
  suspensionReason?: string | null
}

interface Contract {
  id: string
  status: string
  totalAmount: number
  platformFee: number
  creatorPayout: number
  escrowHeld: boolean
  payoutSent: boolean
  payoutDate: string | null
  advertiser: {
    companyName: string
  }
  creator: {
    username: string
    creatorStatus: string | null
    creatorTaxInfo: {
      stripeAccountId: string | null
      payoutEnabled: boolean
    } | null
  }
  campaign: {
    id: string
    name: string
  } | null
  endDate: string
}

function CreatorMarketplaceTab() {
  const { showToast } = useToast()
  const [activeContracts, setActiveContracts] = useState<Contract[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [marketplaceEnabled, setMarketplaceEnabled] = useState(false)
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
      const timestamp = Date.now()
      const [contractsRes, statsRes, settingsRes] = await Promise.all([
        fetch(`/api/admin/contracts?status=ACTIVE&t=${timestamp}`, { cache: 'no-store' }),
        fetch(`/api/admin/marketplace/stats?t=${timestamp}`, { cache: 'no-store' }),
        fetch(`/api/admin/settings?t=${timestamp}`, { cache: 'no-store' }),
      ])

      if (contractsRes.ok) {
        const data = await contractsRes.json()
        setActiveContracts(data.contracts || [])
      }

      if (statsRes.ok) {
        const data = await statsRes.json()
        // Stats API should return pendingAdvertisers count, but if not, set to 0
        setStats({
          ...data,
          pendingAdvertisers: data.pendingAdvertisers || 0
        })
      }

      if (settingsRes.ok) {
        const settings = await settingsRes.json()
        const marketplaceValue = settings.ADS_CREATOR_MARKETPLACE_ENABLED
        const marketplaceEnabled = marketplaceValue === 'true'
        console.log('[CreatorMarketplace] Fetched ADS_CREATOR_MARKETPLACE_ENABLED:', marketplaceValue, '→ enabled:', marketplaceEnabled)
        setMarketplaceEnabled(marketplaceEnabled)
      } else {
        console.error('[CreatorMarketplace] Failed to fetch settings:', settingsRes.status)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMarketplace = async () => {
    const newValue = !marketplaceEnabled
    console.log('[CreatorMarketplace] Toggling to:', newValue)
    // Optimistically update UI
    setMarketplaceEnabled(newValue)
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ADS_CREATOR_MARKETPLACE_ENABLED: newValue.toString(),
        }),
      })

      const result = await response.json()
      console.log('[CreatorMarketplace] Save response:', response.status, result)

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Success',
          description: `Creator Marketplace ${newValue ? 'enabled' : 'disabled'}`,
        })
        // Refresh data after toggle to ensure state is synced
        await fetchData()
      } else {
        // Revert on error
        setMarketplaceEnabled(!newValue)
        showToast({
          type: 'error',
          title: 'Error',
          description: result.error || 'Failed to update setting',
        })
      }
    } catch (error: any) {
      console.error('[CreatorMarketplace] Error saving toggle:', error)
      // Revert on error
      setMarketplaceEnabled(!newValue)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to update setting',
      })
    }
  }



  const handlePayout = async (contractId: string) => {
    if (!confirm('Are you sure you want to process the payout for this contract? This will transfer funds to the creator.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/contracts/${contractId}/payout`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        showToast({
          type: 'success',
          title: 'Payout Processed',
          description: `Successfully transferred $${data.contract.creatorPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to creator. Platform fee of $${data.contract.platformFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} retained.`,
        })
        fetchData()
      } else {
        const error = await response.json()
        showToast({
          type: 'error',
          title: 'Payout Failed',
          description: error.error || 'Failed to process payout',
        })
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to process payout',
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
                  {activeContracts.map((contract: any) => {
                    const isReadyForPayout = contract.escrowHeld && !contract.payoutSent && 
                      new Date(contract.endDate) <= new Date()
                    const canPayout = contract.creator?.creatorTaxInfo?.stripeAccountId && 
                      contract.creator?.creatorTaxInfo?.payoutEnabled
                    
                    return (
                      <div
                        key={contract.id}
                        className="p-4 bg-bg-secondary rounded-lg border border-bg-tertiary space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-text-primary">
                              {contract.advertiser.companyName} × @{contract.creator.username}
                            </h4>
                            <div className="text-sm text-text-secondary space-y-1 mt-2">
                              <p>Campaign: {contract.campaign?.name || 'N/A'}</p>
                              <p>Total Amount: ${Number(contract.totalAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                              <p>Platform Fee: ${Number(contract.platformFee).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                              <p>Creator Payout: ${Number(contract.creatorPayout).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                              <p>Ends: {new Date(contract.endDate).toLocaleDateString()}</p>
                              {contract.payoutSent && contract.payoutDate && (
                                <p className="text-cyber-green">Paid out: {new Date(contract.payoutDate).toLocaleDateString()}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={
                              contract.payoutSent 
                                ? "bg-cyber-green/20 text-cyber-green"
                                : contract.status === 'ACTIVE'
                                ? "bg-cyber-green/20 text-cyber-green"
                                : "bg-electric-blue/20 text-electric-blue"
                            }>
                              {contract.payoutSent ? 'PAID' : contract.status}
                            </Badge>
                            {isReadyForPayout && !contract.payoutSent && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handlePayout(contract.id)}
                                disabled={!canPayout}
                                title={!canPayout ? 'Creator must complete Stripe onboarding' : ''}
                              >
                                Process Payout
                              </Button>
                            )}
                            {!canPayout && isReadyForPayout && (
                              <p className="text-xs text-text-muted text-right">
                                Creator needs Stripe setup
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
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
  const [pendingAdvertisers, setPendingAdvertisers] = useState<Advertiser[]>([])
  const [approvedAdvertisers, setApprovedAdvertisers] = useState<Advertiser[]>([])
  const [rejectedAdvertisers, setRejectedAdvertisers] = useState<Advertiser[]>([])
  const [suspendedAdvertisers, setSuspendedAdvertisers] = useState<Advertiser[]>([])
  const [advertiserSubTab, setAdvertiserSubTab] = useState('pending')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<Advertiser | null>(null)
  const [advertiserStats, setAdvertiserStats] = useState<any>(null)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    fetchAdvertisers()
  }, [])

  const fetchAdvertisers = async () => {
    try {
      setIsLoading(true)
      const timestamp = Date.now()
      const [pendingRes, approvedRes, rejectedRes, suspendedRes] = await Promise.all([
        fetch(`/api/admin/advertisers?status=PENDING&t=${timestamp}`, { cache: 'no-store' }),
        fetch(`/api/admin/advertisers?status=APPROVED&t=${timestamp}`, { cache: 'no-store' }),
        fetch(`/api/admin/advertisers?status=REJECTED&t=${timestamp}`, { cache: 'no-store' }),
        fetch(`/api/admin/advertisers?status=SUSPENDED&t=${timestamp}`, { cache: 'no-store' }),
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
      
      if (suspendedRes.ok) {
        const data = await suspendedRes.json()
        setSuspendedAdvertisers(data.advertisers || [])
      }
    } catch (error) {
      console.error('Failed to fetch advertisers:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleViewDetails = (advertiser: Advertiser) => {
    setSelectedAdvertiser(advertiser)
    setShowDetailsModal(true)
  }
  
  const handleRejectClick = (advertiser: Advertiser) => {
    setSelectedAdvertiser(advertiser)
    setRejectionReason('')
    setShowRejectModal(true)
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

  const handleApproveAdvertiser = async (id: string) => {
    try {
      console.log('[AdvertisersManagement] Approving advertiser:', id)
      const response = await fetch(`/api/admin/advertisers/${id}/approve`, {
        method: 'POST',
      })

      const data = await response.json().catch(() => ({}))
      console.log('[AdvertisersManagement] Approval response:', response.status, data)

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Success',
          description: 'Advertiser approved',
        })
        await fetchAdvertisers()
        console.log('[AdvertisersManagement] Data refreshed after approval')
      } else {
        const errorMsg = data.error || `HTTP ${response.status}`
        console.error('[AdvertisersManagement] Approval failed:', errorMsg)
        showToast({
          type: 'error',
          title: 'Error',
          description: errorMsg,
        })
      }
    } catch (error: any) {
      console.error('[AdvertisersManagement] Approval error:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to approve advertiser',
      })
    }
  }

  const handleRejectAdvertiser = async (id: string, reason: string) => {
    try {
      console.log('[AdvertisersManagement] Rejecting advertiser:', id, 'Reason:', reason)
      const response = await fetch(`/api/admin/advertisers/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })

      const data = await response.json().catch(() => ({}))
      console.log('[AdvertisersManagement] Rejection response:', response.status, data)

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Success',
          description: 'Advertiser rejected',
        })
        setShowRejectModal(false)
        setRejectionReason('')
        setSelectedAdvertiser(null)
        await fetchAdvertisers()
        console.log('[AdvertisersManagement] Data refreshed after rejection')
      } else {
        const errorMsg = data.error || `HTTP ${response.status}`
        console.error('[AdvertisersManagement] Rejection failed:', errorMsg)
        showToast({
          type: 'error',
          title: 'Error',
          description: errorMsg,
        })
      }
    } catch (error: any) {
      console.error('[AdvertisersManagement] Rejection error:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to reject advertiser',
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
                { id: 'suspended', label: 'Suspended', count: suspendedAdvertisers.length },
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
                    <Badge className={`ml-2 ${
                      tab.id === 'pending' ? 'bg-neon-orange/20 text-neon-orange' : 
                      tab.id === 'approved' ? 'bg-cyber-green/20 text-cyber-green' : 
                      tab.id === 'rejected' ? 'bg-red-500/20 text-red-500' :
                      'bg-yellow-500/20 text-yellow-500'
                    }`}>
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
                          variant="secondary"
                          size="sm"
                          onClick={() => handleViewDetails(advertiser)}
                        >
                          View Details
                        </Button>
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
                          onClick={() => handleRejectClick(advertiser)}
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
                      <div className="flex items-center gap-2">
                        <Badge className="bg-cyber-green/20 text-cyber-green">APPROVED</Badge>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleViewStats(advertiser)}
                        >
                          View Stats
                        </Button>
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
                      </div>
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

          {/* Suspended Tab */}
          {advertiserSubTab === 'suspended' && (
            <div>
              {suspendedAdvertisers.length === 0 ? (
                <p className="text-text-secondary">No suspended advertisers</p>
              ) : (
                <div className="space-y-4">
                  {suspendedAdvertisers.map((advertiser) => (
                    <div
                      key={advertiser.id}
                      className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-bg-tertiary"
                    >
                      <div>
                        <h4 className="text-lg font-bold text-text-primary">{advertiser.companyName}</h4>
                        <div className="text-sm text-text-secondary space-y-1 mt-2">
                          <p>Industry: {advertiser.industry}</p>
                          <p>Contact: {advertiser.contactEmail}</p>
                          {advertiser.suspendedAt && (
                            <p className="text-yellow-500">
                              Suspended: {new Date(advertiser.suspendedAt).toLocaleDateString()}
                              {advertiser.suspensionReason && ` - ${advertiser.suspensionReason}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-yellow-500/20 text-yellow-500">SUSPENDED</Badge>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleViewStats(advertiser)}
                        >
                          View Stats
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleUnsuspend(advertiser.id)}
                        >
                          Unsuspend
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

      {/* Rejection Modal */}
      {showRejectModal && selectedAdvertiser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardHeader>
              <h3 className="text-xl font-bold text-text-primary">
                Reject Advertiser: {selectedAdvertiser.companyName}
              </h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejecting this application..."
                    rows={4}
                    className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-electric-blue"
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowRejectModal(false)
                      setRejectionReason('')
                      setSelectedAdvertiser(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      if (rejectionReason.trim()) {
                        handleRejectAdvertiser(selectedAdvertiser.id, rejectionReason.trim())
                      } else {
                        showToast({
                          type: 'error',
                          title: 'Error',
                          description: 'Please provide a rejection reason',
                        })
                      }
                    }}
                    disabled={!rejectionReason.trim()}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedAdvertiser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-text-primary">
                  Application Details: {selectedAdvertiser.companyName}
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowDetailsModal(false)
                    setSelectedAdvertiser(null)
                  }}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-6">
                {/* Company Information */}
                <div>
                  <h4 className="text-lg font-semibold text-text-primary mb-3">Company Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-text-secondary">Company Name</label>
                      <p className="text-text-primary font-medium">{selectedAdvertiser.companyName}</p>
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary">Industry</label>
                      <p className="text-text-primary font-medium">{selectedAdvertiser.industry}</p>
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary">Website</label>
                      <p className="text-text-primary font-medium">
                        {selectedAdvertiser.website ? (
                          <a href={selectedAdvertiser.website} target="_blank" rel="noopener noreferrer" className="text-electric-blue hover:underline">
                            {selectedAdvertiser.website}
                          </a>
                        ) : (
                          <span className="text-text-secondary">Not provided</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary">Business EIN</label>
                      <p className="text-text-primary font-medium">
                        {selectedAdvertiser.businessEIN || <span className="text-text-secondary">Not provided</span>}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary">Company Size</label>
                      <p className="text-text-primary font-medium">
                        {selectedAdvertiser.companySize ? (
                          selectedAdvertiser.companySize.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                        ) : (
                          <span className="text-text-secondary">Not provided</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary">Monthly Ad Budget</label>
                      <p className="text-text-primary font-medium">
                        {selectedAdvertiser.monthlyAdBudget ? (
                          selectedAdvertiser.monthlyAdBudget.replace('_', ' - ').replace('UNDER ', '< $').replace('OVER ', '> $').replace(/\b\w/g, l => l.toUpperCase())
                        ) : (
                          <span className="text-text-secondary">Not provided</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="text-lg font-semibold text-text-primary mb-3">Contact Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-text-secondary">Contact Name</label>
                      <p className="text-text-primary font-medium">
                        {selectedAdvertiser.contactName || <span className="text-text-secondary">Not provided</span>}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary">Contact Email</label>
                      <p className="text-text-primary font-medium">
                        <a href={`mailto:${selectedAdvertiser.contactEmail}`} className="text-electric-blue hover:underline">
                          {selectedAdvertiser.contactEmail}
                        </a>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary">Contact Phone</label>
                      <p className="text-text-primary font-medium">
                        {selectedAdvertiser.contactPhone ? (
                          <a href={`tel:${selectedAdvertiser.contactPhone}`} className="text-electric-blue hover:underline">
                            {selectedAdvertiser.contactPhone}
                          </a>
                        ) : (
                          <span className="text-text-secondary">Not provided</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Marketing Goals */}
                {selectedAdvertiser.marketingGoals && (
                  <div>
                    <h4 className="text-lg font-semibold text-text-primary mb-3">Marketing Goals</h4>
                    <p className="text-text-primary bg-bg-secondary p-4 rounded-lg">
                      {selectedAdvertiser.marketingGoals}
                    </p>
                  </div>
                )}

                {/* Application Status */}
                <div>
                  <h4 className="text-lg font-semibold text-text-primary mb-3">Application Status</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-text-secondary">Status</label>
                      <div className="mt-1">
                        {getStatusBadge(selectedAdvertiser.status)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary">Applied Date</label>
                      <p className="text-text-primary font-medium">
                        {new Date(selectedAdvertiser.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {selectedAdvertiser.approvedAt && (
                      <div>
                        <label className="text-sm text-text-secondary">Approved Date</label>
                        <p className="text-text-primary font-medium">
                          {new Date(selectedAdvertiser.approvedAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {selectedAdvertiser.rejectionReason && (
                      <div className="col-span-2">
                        <label className="text-sm text-text-secondary">Rejection Reason</label>
                        <p className="text-text-primary font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                          {selectedAdvertiser.rejectionReason}
                        </p>
                      </div>
                    )}
                    {selectedAdvertiser.suspensionReason && (
                      <div className="col-span-2">
                        <label className="text-sm text-text-secondary">Suspension Reason</label>
                        <p className="text-text-primary font-medium bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                          {selectedAdvertiser.suspensionReason}
                        </p>
                      </div>
                    )}
                  </div>
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
// EMAIL TEMPLATES TAB
// ============================================
// Helper function to extract body content from full HTML
const extractBodyContent = (fullHtml: string): string => {
  // Try to extract content from the inner div (body content)
  const bodyMatch = fullHtml.match(/<div[^>]*style="[^"]*background:\s*#f9f9f9[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/body>/i)
  if (bodyMatch) {
    return bodyMatch[1].trim()
  }
  // Fallback: try to extract from any div with padding
  const divMatch = fullHtml.match(/<div[^>]*style="[^"]*padding:\s*30px[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/body>/i)
  if (divMatch) {
    return divMatch[1].trim()
  }
  // If no match, return empty
  return ''
}

// Helper function to wrap body content in email template
const wrapEmailTemplate = (bodyContent: string, type: 'approval' | 'rejection'): string => {
  if (type === 'approval') {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Advertiser Application Approved</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #000; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🎉 Application Approved!</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; color: #000;">
    ${bodyContent}
  </div>
</body>
</html>`
  } else {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Advertiser Application Update</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #000; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f9f9f9; padding: 30px; border-radius: 10px; color: #000;">
    ${bodyContent}
  </div>
</body>
</html>`
  }
}

function EmailTemplatesTab() {
  const { showToast } = useToast()
  
  // Store just the body content (what the user edits)
  const [approvalEmail, setApprovalEmail] = useState({
    subject: 'Your Advertiser Application Has Been Approved!',
    bodyContent: `<p>Hi {{advertiserName}},</p>
    
<p>Great news! Your advertiser application for <strong>{{companyName}}</strong> has been approved.</p>

<p>You can now access your advertiser dashboard to:</p>
<ul>
  <li>Create and manage advertising campaigns</li>
  <li>Connect your Stripe account for payments</li>
  <li>Discover and sponsor creators</li>
  <li>Track your campaign performance</li>
</ul>

<div style="text-align: center; margin: 30px 0;">
  <a href="{{dashboardUrl}}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
    Access Dashboard
  </a>
</div>

<p style="font-size: 14px; color: #666;">
  If you haven't already, you'll need to <a href="{{loginUrl}}" style="color: #667eea;">sign in</a> using the email address you provided: <strong>{{advertiserEmail}}</strong>
</p>

<p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
  If you have any questions, please contact our support team.
</p>

<p style="margin-top: 20px;">
  Best regards,<br>
  The Argu Fight Team
</p>`,
  })

  const [rejectionEmail, setRejectionEmail] = useState({
    subject: 'Update on Your Advertiser Application',
    bodyContent: `<p>Hi {{advertiserName}},</p>

<p>Thank you for your interest in advertising with Argu Fight.</p>

<p>Unfortunately, we are unable to approve your advertiser application for <strong>{{companyName}}</strong> at this time.</p>

<p>If you have any questions or would like to discuss this decision, please contact our support team.</p>

<p style="margin-top: 30px;">
  Best regards,<br>
  The Argu Fight Team
</p>`,
  })

  const [previewType, setPreviewType] = useState<'approval' | 'rejection' | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  const replacePlaceholders = (template: string, type: 'approval' | 'rejection') => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'
    const dashboardUrl = `${baseUrl}/advertiser/dashboard`
    const loginUrl = `${baseUrl}/login`
    
    let html = template
      .replace(/\{\{advertiserName\}\}/g, 'John Doe')
      .replace(/\{\{companyName\}\}/g, 'Example Company')
      .replace(/\{\{advertiserEmail\}\}/g, 'john.doe@example.com')
      .replace(/\{\{dashboardUrl\}\}/g, dashboardUrl)
      .replace(/\{\{loginUrl\}\}/g, loginUrl)

    if (type === 'rejection') {
      html = html
        .replace(/\{\{#if reason\}\}/g, '')
        .replace(/\{\{\/if\}\}/g, '')
        .replace(/\{\{reason\}\}/g, 'Your application did not meet our current advertising guidelines.')
    } else {
      // Remove handlebars conditionals for approval
      html = html.replace(/\{\{#if reason\}\}[\s\S]*?\{\{\/if\}\}/g, '')
    }

    return html
  }

  const handlePreview = (type: 'approval' | 'rejection') => {
    setPreviewType(type)
    setShowPreviewModal(true)
  }

  const getPreviewHtml = () => {
    if (!previewType) return ''
    const bodyContent = previewType === 'approval' ? approvalEmail.bodyContent : rejectionEmail.bodyContent
    const fullHtml = wrapEmailTemplate(bodyContent, previewType)
    return replacePlaceholders(fullHtml, previewType)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Email Templates</h2>
        <p className="text-text-secondary mt-1">
          Manage approval and rejection email templates sent to advertisers
        </p>
      </div>

      {/* Approval Email Template */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-text-primary">Approval Email</h3>
              <p className="text-sm text-text-secondary mt-1">
                Sent when an advertiser application is approved
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => handlePreview('approval')}
            >
              Preview
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Subject Line
              </label>
              <Input
                value={approvalEmail.subject}
                onChange={(e) => setApprovalEmail({ ...approvalEmail, subject: e.target.value })}
                placeholder="Email subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Email Content
              </label>
              <EmailTemplateEditor
                value={approvalEmail.bodyContent}
                onChange={(html) => setApprovalEmail({ ...approvalEmail, bodyContent: html })}
                placeholder="Enter your email content here. Use the toolbar to format text, add links, emojis, and insert placeholders."
                availablePlaceholders={['advertiserName', 'companyName', 'advertiserEmail', 'dashboardUrl', 'loginUrl']}
              />
              <p className="text-xs text-text-secondary mt-2">
                Available placeholders: {'{'}advertiserName{'}'}, {'{'}companyName{'}'}, {'{'}advertiserEmail{'}'}, {'{'}dashboardUrl{'}'}, {'{'}loginUrl{'}'}. HTML is generated automatically in the background.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Rejection Email Template */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-text-primary">Rejection Email</h3>
              <p className="text-sm text-text-secondary mt-1">
                Sent when an advertiser application is rejected
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => handlePreview('rejection')}
            >
              Preview
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Subject Line
              </label>
              <Input
                value={rejectionEmail.subject}
                onChange={(e) => setRejectionEmail({ ...rejectionEmail, subject: e.target.value })}
                placeholder="Email subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Email Content
              </label>
              <EmailTemplateEditor
                value={rejectionEmail.bodyContent}
                onChange={(html) => setRejectionEmail({ ...rejectionEmail, bodyContent: html })}
                placeholder="Enter your email content here. Use the toolbar to format text, add links, emojis, and insert placeholders."
                availablePlaceholders={['advertiserName', 'companyName', 'reason']}
              />
              <p className="text-xs text-text-secondary mt-2">
                Available placeholders: {'{'}advertiserName{'}'}, {'{'}companyName{'}'}, {'{'}reason{'}'}. HTML is generated automatically in the background.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false)
          setPreviewType(null)
        }}
        title={`Email Preview - ${previewType === 'approval' ? 'Approval' : 'Rejection'}`}
      >
        <div className="space-y-4">
          <div className="bg-bg-secondary p-4 rounded-lg">
            <p className="text-sm font-medium text-text-secondary mb-1">Subject:</p>
            <p className="text-text-primary">
              {previewType === 'approval' ? approvalEmail.subject : rejectionEmail.subject}
            </p>
          </div>
          <div className="border border-bg-tertiary rounded-lg overflow-hidden">
            <div className="bg-white p-4" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <style dangerouslySetInnerHTML={{ __html: `
                .email-preview * {
                  color: #000 !important;
                }
                .email-preview a {
                  color: #2563eb !important;
                }
                .email-preview p,
                .email-preview div,
                .email-preview span,
                .email-preview strong,
                .email-preview em,
                .email-preview li,
                .email-preview ul,
                .email-preview ol {
                  color: #000 !important;
                }
              ` }} />
              <div
                className="email-preview"
                dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                style={{ maxWidth: '100%', color: '#000' }}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setShowPreviewModal(false)
                setPreviewType(null)
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function AdvertisementsPage() {
  const [activeTab, setActiveTab] = useState('basic')

  // Support tab from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const tab = urlParams.get('tab')
      if (tab && ['basic', 'platform', 'marketplace', 'creators', 'advertisers', 'email'].includes(tab)) {
        setActiveTab(tab)
      }
    }
  }, [])

  const tabs = [
    { 
      id: 'basic', 
      label: 'Direct Ads', 
      content: (
        <div>
          <div className="mb-4 p-4 bg-bg-secondary rounded-lg border border-bg-tertiary">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Direct Ads</h3>
            <p className="text-text-secondary text-sm">
              Create and manage ads directly. These are admin-created ads for direct clients, internal promotions, 
              or quick campaigns. No advertiser account needed. Ads display immediately when set to Active.
            </p>
          </div>
          <DirectAdsTab />
        </div>
      )
    },
    { 
      id: 'platform', 
      label: 'Advertiser Campaigns', 
      content: (
        <div>
          <div className="mb-4 p-4 bg-bg-secondary rounded-lg border border-bg-tertiary">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Advertiser Campaigns</h3>
            <p className="text-text-secondary text-sm">
              Manage campaigns created by external advertisers. Advertisers apply, get approved, then create campaigns. 
              You review and approve campaigns before they go live. These are managed advertising relationships.
            </p>
          </div>
          <PlatformAdsTab />
        </div>
      )
    },
    { 
      id: 'marketplace', 
      label: 'Creator Marketplace', 
      content: <CreatorMarketplaceTab />
    },
    { id: 'creators', label: 'Creators', content: <CreatorsTab /> },
    { id: 'advertisers', label: 'Advertisers', content: <AdvertisersManagementTab /> },
    { id: 'email', label: 'Email', content: <EmailTemplatesTab /> },
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
