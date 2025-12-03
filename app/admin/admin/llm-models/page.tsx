'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

interface AppealAnalytics {
  totalAppeals: number
  successfulAppeals: number
  failedAppeals: number
  successRate: number
  averageAppealLength: number
  topAppealReasons: Array<{
    keyword: string
    count: number
  }>
  appealsByCategory: Array<{
    category: string
    count: number
    successRate: number
  }>
  recentAppeals: Array<{
    id: string
    debateTopic: string
    category: string
    appealReason: string
    appealedStatements: string[]
    originalWinner: string
    newWinner: string | null
    success: boolean | null
    createdAt: string
  }>
}

export default function LLMModelsPage() {
  const [analytics, setAnalytics] = useState<AppealAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/llm-models/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportData = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch(`/api/admin/llm-models/export?format=${format}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `appeal-training-data.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to export data:', error)
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
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">LLM Model Management</h1>
          <p className="text-text-secondary">Analyze appeal data and manage model training</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => handleExportData('csv')}
          >
            Export CSV
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleExportData('json')}
          >
            Export JSON
          </Button>
        </div>
      </div>

      <div className="border-b border-bg-tertiary mb-6">
        <div className="flex gap-1">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'training-data', label: 'Training Data' },
            { id: 'versions', label: 'Model Versions' },
            { id: 'ab-tests', label: 'A/B Tests' },
            { id: 'metrics', label: 'Metrics' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-electric-blue border-b-2 border-electric-blue'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && analytics && (
        <div className="space-y-6 mt-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardBody>
                <p className="text-text-secondary text-sm mb-1">Total Appeals</p>
                <p className="text-3xl font-bold text-white">{analytics.totalAppeals}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-text-secondary text-sm mb-1">Successful</p>
                <p className="text-3xl font-bold text-cyber-green">{analytics.successfulAppeals}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-text-secondary text-sm mb-1">Failed</p>
                <p className="text-3xl font-bold text-neon-orange">{analytics.failedAppeals}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-text-secondary text-sm mb-1">Success Rate</p>
                <p className="text-3xl font-bold text-electric-blue">{analytics.successRate}%</p>
              </CardBody>
            </Card>
          </div>

          {/* Appeal Reasons Analysis */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-white">Top Appeal Keywords</h2>
              <p className="text-sm text-text-secondary mt-1">
                Most common words/phrases in appeal reasons
              </p>
            </CardHeader>
            <CardBody>
              <div className="flex flex-wrap gap-2">
                {analytics.topAppealReasons.map((item, index) => (
                  <Badge key={index} variant="default" className="bg-bg-tertiary">
                    {item.keyword} ({item.count})
                  </Badge>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Appeals by Category */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-white">Appeals by Category</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {analytics.appealsByCategory.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                    <div>
                      <p className="font-semibold text-white">{item.category}</p>
                      <p className="text-sm text-text-secondary">{item.count} appeals</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-electric-blue">{item.successRate}%</p>
                      <p className="text-xs text-text-secondary">success rate</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-white">Appeal Analytics</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-bg-tertiary rounded-lg p-4">
                    <p className="text-text-secondary text-sm mb-1">Average Appeal Length</p>
                    <p className="text-2xl font-bold text-white">
                      {analytics.averageAppealLength} characters
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'training-data' && analytics && (
        <div className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-white">Recent Appeals</h2>
              <p className="text-sm text-text-secondary mt-1">
                Training data from recent appeal submissions
              </p>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {analytics.recentAppeals.map((appeal) => (
                  <div
                    key={appeal.id}
                    className="p-4 bg-bg-tertiary rounded-lg border border-bg-tertiary"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-1">{appeal.debateTopic}</h3>
                        <Badge variant={appeal.category.toLowerCase() as any} size="sm">
                          {appeal.category}
                        </Badge>
                      </div>
                      {appeal.success !== null && (
                        <Badge
                          variant="default"
                          size="sm"
                          className={appeal.success ? 'bg-cyber-green text-black' : 'bg-neon-orange text-black'}
                        >
                          {appeal.success ? 'Successful' : 'Failed'}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-text-secondary mb-1">Appeal Reason:</p>
                        <p className="text-white">{appeal.appealReason}</p>
                      </div>
                      <div>
                        <p className="text-text-secondary mb-1">Appealed Statements:</p>
                        <p className="text-white">{appeal.appealedStatements.length} statements</p>
                      </div>
                      <div className="flex items-center gap-4 text-text-secondary">
                        <span>Original Winner: {appeal.originalWinner}</span>
                        {appeal.newWinner && (
                          <span>New Winner: {appeal.newWinner}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'versions' && <ModelVersionsTab />}
      {activeTab === 'ab-tests' && <ABTestsTab />}
      {activeTab === 'metrics' && <MetricsTab />}
    </div>
  )
}

// Model Versions Tab Component
function ModelVersionsTab() {
  const [versions, setVersions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVersion, setEditingVersion] = useState<any | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    version: '',
    description: '',
    modelType: 'appeal_predictor',
    settings: '',
    isActive: false,
    isDefault: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    fetchVersions()
  }, [])

  const fetchVersions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/llm-models/versions')
      if (response.ok) {
        const data = await response.json()
        setVersions(data.versions)
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = (version?: any) => {
    if (version) {
      setEditingVersion(version)
      // Parse config back to settings if it exists
      let settings = ''
      if (version.config) {
        try {
          const configObj = typeof version.config === 'string' ? JSON.parse(version.config) : version.config
          // Extract a user-friendly description from config
          settings = configObj.description || configObj.notes || ''
        } catch {
          settings = ''
        }
      }
      
      setFormData({
        name: version.name,
        version: version.version,
        description: version.description || '',
        modelType: version.modelType,
        settings: settings,
        isActive: version.isActive,
        isDefault: version.isDefault,
      })
    } else {
      setEditingVersion(null)
      setFormData({
        name: '',
        version: '',
        description: '',
        modelType: 'appeal_predictor',
        settings: '',
        isActive: false,
        isDefault: false,
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingVersion(null)
    setFormData({
      name: '',
      version: '',
      description: '',
      modelType: 'appeal_predictor',
      settings: '',
      isActive: false,
      isDefault: false,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.version || !formData.modelType) {
      showToast({
        title: 'Error',
        description: 'Name, version, and model type are required',
        type: 'error',
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Convert settings description to JSON config
      let config = null
      if (formData.settings.trim()) {
        config = {
          description: formData.settings.trim(),
          notes: formData.settings.trim(),
          createdAt: new Date().toISOString(),
        }
      }

      const url = editingVersion
        ? `/api/admin/llm-models/versions/${editingVersion.id}`
        : '/api/admin/llm-models/versions'
      
      const method = editingVersion ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          version: formData.version.trim(),
        description: formData.description.trim() || null,
        modelType: formData.modelType,
        config: config ? JSON.stringify(config) : null,
        isActive: formData.isActive,
        isDefault: formData.isDefault,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save model version')
      }

      showToast({
        title: 'Success',
        description: editingVersion ? 'Model version updated' : 'Model version created',
        type: 'success',
      })

      handleCloseModal()
      fetchVersions()
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error.message || 'Failed to save model version',
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="flex justify-end">
        <Button variant="primary" onClick={() => handleOpenModal()}>
          Create Model Version
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-white">Model Versions</h2>
          <p className="text-sm text-text-secondary mt-1">
            Manage different versions of your LLM models
          </p>
        </CardHeader>
        <CardBody>
          {versions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-secondary">No model versions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="p-4 bg-bg-tertiary rounded-lg border border-bg-tertiary"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-white font-semibold">{version.name}</h3>
                        <Badge variant="default" size="sm">v{version.version}</Badge>
                        {version.isActive && (
                          <Badge variant="default" size="sm" className="bg-cyber-green text-black">
                            Active
                          </Badge>
                        )}
                        {version.isDefault && (
                          <Badge variant="default" size="sm" className="bg-electric-blue text-black">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary mb-2">{version.description}</p>
                      <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <span>Type: {version.modelType}</span>
                        <span>•</span>
                        <span>{version._count.appealPredictions} predictions</span>
                        <span>•</span>
                        <span>{version._count.metrics} metrics</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => handleOpenModal(version)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create/Edit Model Version Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingVersion ? 'Edit Model Version' : 'Create Model Version'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            placeholder="e.g., Appeal Predictor"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Version"
            placeholder="e.g., 1.0.0"
            value={formData.version}
            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this model version does..."
              className="w-full px-4 py-3 bg-bg-secondary border border-bg-tertiary rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-electric-blue transition-colors resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Model Type
            </label>
            <select
              value={formData.modelType}
              onChange={(e) => setFormData({ ...formData, modelType: e.target.value })}
              className="w-full px-4 py-3 bg-bg-secondary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:border-electric-blue transition-colors"
              required
            >
              <option value="appeal_predictor">Appeal Predictor</option>
              <option value="verdict_judge">Verdict Judge</option>
              <option value="content_moderator">Content Moderator</option>
              <option value="appeal_reason_analyzer">Appeal Reason Analyzer</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Settings / Notes
            </label>
            <p className="text-xs text-text-secondary mb-2">
              Add any additional settings or notes about this model version. This will be stored as JSON automatically.
            </p>
            <textarea
              value={formData.settings}
              onChange={(e) => setFormData({ ...formData, settings: e.target.value })}
              placeholder="e.g., This version uses improved training data from Q4 2024. Optimized for faster response times."
              className="w-full px-4 py-3 bg-bg-secondary border border-bg-tertiary rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-electric-blue transition-colors resize-none"
              rows={4}
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 rounded border-bg-tertiary bg-bg-secondary text-electric-blue focus:ring-electric-blue focus:ring-2"
              />
              <span className="text-sm text-white">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="w-5 h-5 rounded border-bg-tertiary bg-bg-secondary text-electric-blue focus:ring-electric-blue focus:ring-2"
              />
              <span className="text-sm text-white">Default</span>
            </label>
          </div>

          <ModalFooter>
            <Button type="button" variant="ghost" onClick={handleCloseModal} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingVersion ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}

// A/B Tests Tab Component
function ABTestsTab() {
  const [tests, setTests] = useState<any[]>([])
  const [versions, setVersions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    modelVersionAId: '',
    modelVersionBId: '',
    trafficSplit: 50,
    startDate: new Date().toISOString().split('T')[0],
    status: 'draft',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    fetchTests()
    fetchVersions()
  }, [])

  const fetchVersions = async () => {
    try {
      const response = await fetch('/api/admin/llm-models/versions')
      if (response.ok) {
        const data = await response.json()
        setVersions(data.versions)
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error)
    }
  }

  const fetchTests = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/llm-models/ab-tests')
      if (response.ok) {
        const data = await response.json()
        setTests(data.tests)
      }
    } catch (error) {
      console.error('Failed to fetch A/B tests:', error)
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

  const handleOpenModal = () => {
    setFormData({
      name: '',
      description: '',
      modelVersionAId: '',
      modelVersionBId: '',
      trafficSplit: 50,
      startDate: new Date().toISOString().split('T')[0],
      status: 'draft',
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setFormData({
      name: '',
      description: '',
      modelVersionAId: '',
      modelVersionBId: '',
      trafficSplit: 50,
      startDate: new Date().toISOString().split('T')[0],
      status: 'draft',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.modelVersionAId || !formData.modelVersionBId) {
      showToast({
        title: 'Error',
        description: 'Name and both model versions are required',
        type: 'error',
      })
      return
    }

    if (formData.modelVersionAId === formData.modelVersionBId) {
      showToast({
        title: 'Error',
        description: 'Model A and Model B must be different',
        type: 'error',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/llm-models/ab-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          modelVersionAId: formData.modelVersionAId,
          modelVersionBId: formData.modelVersionBId,
          trafficSplit: formData.trafficSplit,
          startDate: new Date(formData.startDate).toISOString(),
          status: formData.status,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create A/B test')
      }

      showToast({
        title: 'Success',
        description: 'A/B test created successfully',
        type: 'success',
      })

      handleCloseModal()
      fetchTests()
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error.message || 'Failed to create A/B test',
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="flex justify-end">
        <Button variant="primary" onClick={handleOpenModal}>
          Create A/B Test
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-white">A/B Tests</h2>
          <p className="text-sm text-text-secondary mt-1">
            Compare model versions side by side
          </p>
        </CardHeader>
        <CardBody>
          {tests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-secondary">No A/B tests yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="p-4 bg-bg-tertiary rounded-lg border border-bg-tertiary"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-semibold mb-1">{test.name}</h3>
                      <p className="text-sm text-text-secondary">{test.description}</p>
                    </div>
                    <Badge
                      variant="default"
                      size="sm"
                      className={
                        test.status === 'active'
                          ? 'bg-cyber-green text-black'
                          : test.status === 'completed'
                          ? 'bg-electric-blue text-black'
                          : 'bg-text-muted text-white'
                      }
                    >
                      {test.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-text-secondary mb-1">Model A</p>
                      <p className="text-white font-semibold">
                        {test.modelVersionA.name} v{test.modelVersionA.version}
                      </p>
                      {test.modelAScore !== null && (
                        <p className="text-sm text-electric-blue mt-1">
                          Score: {test.modelAScore.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary mb-1">Model B</p>
                      <p className="text-white font-semibold">
                        {test.modelVersionB.name} v{test.modelVersionB.version}
                      </p>
                      {test.modelBScore !== null && (
                        <p className="text-sm text-electric-blue mt-1">
                          Score: {test.modelBScore.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                  {test.winner && (
                    <div className="mt-3 pt-3 border-t border-bg-secondary">
                      <p className="text-sm text-text-secondary">
                        Winner: <span className="text-white font-semibold">Model {test.winner}</span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Create A/B Test Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Create A/B Test"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Test Name"
            placeholder="e.g., Model Comparison v1.0 vs v1.1"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this A/B test is comparing..."
              className="w-full px-4 py-3 bg-bg-secondary border border-bg-tertiary rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-electric-blue transition-colors resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Model A <span className="text-neon-orange">*</span>
            </label>
            <select
              value={formData.modelVersionAId}
              onChange={(e) => setFormData({ ...formData, modelVersionAId: e.target.value })}
              className="w-full px-4 py-3 bg-bg-secondary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:border-electric-blue transition-colors"
              required
            >
              <option value="">Select Model Version</option>
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} v{v.version} ({v.modelType})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Model B <span className="text-neon-orange">*</span>
            </label>
            <select
              value={formData.modelVersionBId}
              onChange={(e) => setFormData({ ...formData, modelVersionBId: e.target.value })}
              className="w-full px-4 py-3 bg-bg-secondary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:border-electric-blue transition-colors"
              required
            >
              <option value="">Select Model Version</option>
              {versions
                .filter(v => v.id !== formData.modelVersionAId)
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} v{v.version} ({v.modelType})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Traffic Split: {formData.trafficSplit}% / {100 - formData.trafficSplit}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.trafficSplit}
              onChange={(e) => setFormData({ ...formData, trafficSplit: Number(e.target.value) })}
              className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-electric-blue"
            />
            <div className="flex justify-between text-xs text-text-secondary mt-1">
              <span>0% (All to B)</span>
              <span>50% (Equal)</span>
              <span>100% (All to A)</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-4 py-3 bg-bg-secondary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:border-electric-blue transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 bg-bg-secondary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:border-electric-blue transition-colors"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
            </select>
          </div>

          <ModalFooter>
            <Button type="button" variant="ghost" onClick={handleCloseModal} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create Test
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}

// Metrics Tab Component
function MetricsTab() {
  const [metrics, setMetrics] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedVersion, setSelectedVersion] = useState<string>('')

  useEffect(() => {
    fetchMetrics()
  }, [selectedVersion])

  const fetchMetrics = async () => {
    try {
      setIsLoading(true)
      const url = selectedVersion
        ? `/api/admin/llm-models/metrics?modelVersionId=${selectedVersion}`
        : '/api/admin/llm-models/metrics'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setMetrics(data.metrics)
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
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

  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-white">Performance Metrics</h2>
          <p className="text-sm text-text-secondary mt-1">
            Track model performance over time
          </p>
        </CardHeader>
        <CardBody>
          {metrics.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-secondary">No metrics recorded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {metrics.map((metric) => (
                <div
                  key={metric.id}
                  className="p-4 bg-bg-tertiary rounded-lg border border-bg-tertiary"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">
                        {metric.modelVersion.name} v{metric.modelVersion.version}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {metric.metricType}: {metric.metricValue.toFixed(4)}
                      </p>
                    </div>
                    <div className="text-right text-sm text-text-secondary">
                      <p>{new Date(metric.recordedAt).toLocaleDateString()}</p>
                      {metric.dataset && <p>{metric.dataset}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

