'use client'

import { useState, useEffect } from 'react'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'

interface SubscriptionPlan {
  id: string
  name: string
  description: string | null
  price: number
  billingCycle: string
  features: string
  appealLimit: number | null
  debateLimit: number | null
  prioritySupport: boolean
  customBadge: string | null
  stripePriceId: string | null
  stripeProductId: string | null
  isActive: boolean
  createdAt: string
}

export default function SubscriptionPlansPage() {
  const { showToast } = useToast()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    billingCycle: 'MONTHLY',
    features: '',
    appealLimit: '',
    debateLimit: '',
    prioritySupport: false,
    customBadge: '',
    stripePriceId: '',
    stripeProductId: '',
    isActive: false,
  })

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/subscription-plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans || [])
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load subscription plans',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingPlan(null)
    setFormData({
      name: '',
      description: '',
      price: '',
      billingCycle: 'MONTHLY',
      features: '',
      appealLimit: '',
      debateLimit: '',
      prioritySupport: false,
      customBadge: '',
      stripePriceId: '',
      stripeProductId: '',
      isActive: false,
    })
    setShowCreateModal(true)
  }

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan)
    try {
      const featuresArray = JSON.parse(plan.features)
      setFormData({
        name: plan.name,
        description: plan.description || '',
        price: plan.price.toString(),
        billingCycle: plan.billingCycle,
        features: Array.isArray(featuresArray) ? featuresArray.join(', ') : plan.features,
        appealLimit: plan.appealLimit?.toString() || '',
        debateLimit: plan.debateLimit?.toString() || '',
        prioritySupport: plan.prioritySupport,
        customBadge: plan.customBadge || '',
        stripePriceId: plan.stripePriceId || '',
        stripeProductId: plan.stripeProductId || '',
        isActive: plan.isActive,
      })
    } catch {
      setFormData({
        name: plan.name,
        description: plan.description || '',
        price: plan.price.toString(),
        billingCycle: plan.billingCycle,
        features: plan.features,
        appealLimit: plan.appealLimit?.toString() || '',
        debateLimit: plan.debateLimit?.toString() || '',
        prioritySupport: plan.prioritySupport,
        customBadge: plan.customBadge || '',
        stripePriceId: plan.stripePriceId || '',
        stripeProductId: plan.stripeProductId || '',
        isActive: plan.isActive,
      })
    }
    setShowCreateModal(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Name and price are required',
      })
      return
    }

    try {
      setIsSaving(true)
      const url = editingPlan
        ? `/api/admin/subscription-plans/${editingPlan.id}`
        : '/api/admin/subscription-plans'
      const method = editingPlan ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save plan')
      }

      showToast({
        type: 'success',
        title: 'Success',
        description: `Plan ${editingPlan ? 'updated' : 'created'} successfully!`,
      })

      setShowCreateModal(false)
      fetchPlans()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to save plan',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return

    try {
      const response = await fetch(`/api/admin/subscription-plans/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete plan')
      }

      showToast({
        type: 'success',
        title: 'Success',
        description: 'Plan deleted successfully!',
      })

      fetchPlans()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to delete plan',
      })
    }
  }

  const parseFeatures = (features: string): string[] => {
    try {
      const parsed = JSON.parse(features)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return features.split(',').map(f => f.trim()).filter(Boolean)
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
            <h1 className="text-3xl font-bold text-text-primary">Subscription Plans</h1>
            <Button variant="primary" onClick={handleCreate}>
              Create Plan
            </Button>
          </div>

          <Card>
            <CardBody>
              <p className="text-text-secondary mb-4">
                Manage subscription plans for your platform. Plans are not active by default.
                Configure Stripe integration to enable payments.
              </p>
            </CardBody>
          </Card>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const features = parseFeatures(plan.features)
              return (
                <Card key={plan.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-text-primary">{plan.name}</h2>
                      <div className="flex items-center gap-2">
                        {plan.isActive ? (
                          <Badge className="bg-cyber-green/20 text-cyber-green">Active</Badge>
                        ) : (
                          <Badge className="bg-gray-500/20 text-gray-400">Inactive</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-electric-blue mt-2">
                      ${plan.price.toFixed(2)}
                      <span className="text-sm text-text-secondary ml-1">
                        /{plan.billingCycle.toLowerCase()}
                      </span>
                    </p>
                  </CardHeader>
                  <CardBody>
                    {plan.description && (
                      <p className="text-text-secondary mb-4">{plan.description}</p>
                    )}

                    <div className="space-y-2 mb-4">
                      {plan.appealLimit !== null && (
                        <p className="text-sm text-text-secondary">
                          Appeals: {plan.appealLimit}/month
                        </p>
                      )}
                      {plan.debateLimit !== null && (
                        <p className="text-sm text-text-secondary">
                          Debates: {plan.debateLimit}/month
                        </p>
                      )}
                      {plan.prioritySupport && (
                        <p className="text-sm text-cyber-green">✓ Priority Support</p>
                      )}
                      {plan.customBadge && (
                        <p className="text-sm text-electric-blue">Badge: {plan.customBadge}</p>
                      )}
                    </div>

                    {features.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-text-secondary mb-2">Features:</p>
                        <ul className="space-y-1">
                          {features.map((feature, idx) => (
                            <li key={idx} className="text-sm text-text-primary">
                              • {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEdit(plan)}
                        className="flex-1"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="error"
                        size="sm"
                        onClick={() => handleDelete(plan.id)}
                        className="flex-1"
                      >
                        Delete
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              )
            })}
          </div>

          {plans.length === 0 && (
            <Card>
              <CardBody>
                <p className="text-text-secondary text-center py-8">
                  No subscription plans yet. Create your first plan to get started.
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
                    {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                  </h2>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Plan Name *
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Premium, Pro"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary min-h-[80px]"
                        placeholder="Plan description..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Price *
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Billing Cycle *
                        </label>
                        <select
                          value={formData.billingCycle}
                          onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                          className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary"
                        >
                          <option value="MONTHLY">Monthly</option>
                          <option value="YEARLY">Yearly</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Features (comma-separated)
                      </label>
                      <Input
                        value={formData.features}
                        onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                        placeholder="Feature 1, Feature 2, Feature 3"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Appeal Limit
                        </label>
                        <Input
                          type="number"
                          value={formData.appealLimit}
                          onChange={(e) => setFormData({ ...formData, appealLimit: e.target.value })}
                          placeholder="e.g., 10"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Debate Limit
                        </label>
                        <Input
                          type="number"
                          value={formData.debateLimit}
                          onChange={(e) => setFormData({ ...formData, debateLimit: e.target.value })}
                          placeholder="e.g., 50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Custom Badge
                      </label>
                      <Input
                        value={formData.customBadge}
                        onChange={(e) => setFormData({ ...formData, customBadge: e.target.value })}
                        placeholder="e.g., PRO, PREMIUM"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Stripe Price ID
                        </label>
                        <Input
                          value={formData.stripePriceId}
                          onChange={(e) => setFormData({ ...formData, stripePriceId: e.target.value })}
                          placeholder="price_xxx"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          Stripe Product ID
                        </label>
                        <Input
                          value={formData.stripeProductId}
                          onChange={(e) => setFormData({ ...formData, stripeProductId: e.target.value })}
                          placeholder="prod_xxx"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="prioritySupport"
                        checked={formData.prioritySupport}
                        onChange={(e) => setFormData({ ...formData, prioritySupport: e.target.checked })}
                        className="w-5 h-5 rounded border-bg-tertiary bg-bg-secondary text-electric-blue"
                      />
                      <label htmlFor="prioritySupport" className="text-sm text-text-secondary">
                        Priority Support
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-5 h-5 rounded border-bg-tertiary bg-bg-secondary text-electric-blue"
                      />
                      <label htmlFor="isActive" className="text-sm text-text-secondary">
                        Active (Note: Plans are inactive by default)
                      </label>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="primary"
                        onClick={handleSave}
                        isLoading={isSaving}
                        className="flex-1"
                      >
                        {editingPlan ? 'Update' : 'Create'} Plan
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

