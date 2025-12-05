'use client'

import { useState, useEffect } from 'react'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'

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

export default function AdvertisementsPage() {
  const { showToast } = useToast()
  const [ads, setAds] = useState<Advertisement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Form state
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
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load advertisements',
      })
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
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="ADMIN" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="ADMIN" />
      <div className="pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-text-primary">Advertisement Management</h1>
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

          {/* Ads Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map((ad) => (
              <Card key={ad.id}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-bold text-text-primary">{ad.title}</h2>
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
                    {ad.startDate && (
                      <p className="text-sm text-text-secondary">
                        <span className="font-semibold">Start:</span>{' '}
                        {new Date(ad.startDate).toLocaleDateString()}
                      </p>
                    )}
                    {ad.endDate && (
                      <p className="text-sm text-text-secondary">
                        <span className="font-semibold">End:</span>{' '}
                        {new Date(ad.endDate).toLocaleDateString()}
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
                      variant="error"
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
      </div>
    </div>
  )
}

