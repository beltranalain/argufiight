'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'

interface Pricing {
  monthly: number
  yearly: number
}

interface PromoCode {
  id: string
  code: string
  description: string | null
  discountType: string
  discountValue: number
  maxUses: number | null
  currentUses: number
  validFrom: string
  validUntil: string | null
  applicableTo: string
  billingCycles: string | null
  isActive: boolean
  createdAt: string
}

export default function SubscriptionsPage() {
  const { showToast } = useToast()
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get('tab') as 'pricing' | 'promo-codes' | 'overview' | null
  const [activeTab, setActiveTab] = useState<'pricing' | 'promo-codes' | 'overview'>(
    tabFromUrl || 'pricing'
  )
  
  // Pricing state
  const [pricing, setPricing] = useState<Pricing>({ monthly: 9.99, yearly: 89.0 })
  const [isLoadingPricing, setIsLoadingPricing] = useState(true)
  const [isSavingPricing, setIsSavingPricing] = useState(false)
  const [formData, setFormData] = useState({
    monthly: '9.99',
    yearly: '89.00',
  })

  // Promo codes state
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [isLoadingPromoCodes, setIsLoadingPromoCodes] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null)
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE')
  const [discountValue, setDiscountValue] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [validFrom, setValidFrom] = useState(new Date().toISOString().split('T')[0])
  const [validUntil, setValidUntil] = useState('')
  const [applicableTo, setApplicableTo] = useState<'FREE' | 'PRO' | 'BOTH'>('PRO')
  const [billingCycles, setBillingCycles] = useState<string[]>([])
  const [isSavingPromo, setIsSavingPromo] = useState(false)

  // Overview state
  const [overview, setOverview] = useState<any>(null)
  const [isLoadingOverview, setIsLoadingOverview] = useState(true)

  useEffect(() => {
    if (tabFromUrl && ['pricing', 'promo-codes', 'overview'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  useEffect(() => {
    if (activeTab === 'pricing') {
      fetchPricing()
    } else if (activeTab === 'promo-codes') {
      fetchPromoCodes()
    } else if (activeTab === 'overview') {
      fetchOverview()
    }
  }, [activeTab])

  const fetchPricing = async () => {
    try {
      setIsLoadingPricing(true)
      const response = await fetch('/api/subscriptions/pricing')
      if (response.ok) {
        const data = await response.json()
        setPricing(data)
        setFormData({
          monthly: data.monthly.toString(),
          yearly: data.yearly.toString(),
        })
      }
    } catch (error) {
      console.error('Failed to fetch pricing:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load pricing',
      })
    } finally {
      setIsLoadingPricing(false)
    }
  }

  const handleSavePricing = async () => {
    const monthly = parseFloat(formData.monthly)
    const yearly = parseFloat(formData.yearly)

    if (isNaN(monthly) || isNaN(yearly)) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Please enter valid numbers',
      })
      return
    }

    if (monthly <= 0 || yearly <= 0) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Prices must be greater than 0',
      })
      return
    }

    try {
      setIsSavingPricing(true)
      const response = await fetch('/api/subscriptions/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthly, yearly }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update pricing')
      }

      const data = await response.json()
      setPricing(data.pricing)
      showToast({
        type: 'success',
        title: 'Success',
        description: 'Pricing updated successfully!',
      })
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to update pricing',
      })
    } finally {
      setIsSavingPricing(false)
    }
  }

  const fetchPromoCodes = async () => {
    try {
      setIsLoadingPromoCodes(true)
      const response = await fetch('/api/admin/promo-codes')
      if (response.ok) {
        const data = await response.json()
        setPromoCodes(data.promoCodes || [])
      }
    } catch (error) {
      console.error('Failed to fetch promo codes:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load promo codes',
      })
    } finally {
      setIsLoadingPromoCodes(false)
    }
  }

  const handleOpenModal = (promoCode?: PromoCode) => {
    if (promoCode) {
      setEditingCode(promoCode)
      setCode(promoCode.code)
      setDescription(promoCode.description || '')
      setDiscountType(promoCode.discountType as 'PERCENTAGE' | 'FIXED_AMOUNT')
      setDiscountValue(promoCode.discountValue.toString())
      setMaxUses(promoCode.maxUses?.toString() || '')
      setValidFrom(new Date(promoCode.validFrom).toISOString().split('T')[0])
      setValidUntil(promoCode.validUntil ? new Date(promoCode.validUntil).toISOString().split('T')[0] : '')
      setApplicableTo(promoCode.applicableTo as 'FREE' | 'PRO' | 'BOTH')
      setBillingCycles(promoCode.billingCycles ? JSON.parse(promoCode.billingCycles) : [])
    } else {
      setEditingCode(null)
      resetForm()
    }
    setIsModalOpen(true)
  }

  const resetForm = () => {
    setCode('')
    setDescription('')
    setDiscountType('PERCENTAGE')
    setDiscountValue('')
    setMaxUses('')
    setValidFrom(new Date().toISOString().split('T')[0])
    setValidUntil('')
    setApplicableTo('PRO')
    setBillingCycles([])
  }

  const handleSavePromo = async () => {
    if (!code.trim()) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Code is required',
      })
      return
    }

    if (!discountValue || parseFloat(discountValue) <= 0) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Discount value must be greater than 0',
      })
      return
    }

    setIsSavingPromo(true)
    try {
      const url = editingCode
        ? `/api/admin/promo-codes/${editingCode.id}`
        : '/api/admin/promo-codes'

      const method = editingCode ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.toUpperCase().trim(),
          description: description.trim() || null,
          discountType,
          discountValue: parseFloat(discountValue),
          maxUses: maxUses ? parseInt(maxUses) : null,
          validFrom: new Date(validFrom).toISOString(),
          validUntil: validUntil ? new Date(validUntil).toISOString() : null,
          applicableTo,
          billingCycles: billingCycles.length > 0 ? JSON.stringify(billingCycles) : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save promo code')
      }

      showToast({
        type: 'success',
        title: 'Success',
        description: editingCode ? 'Promo code updated' : 'Promo code created',
      })

      setIsModalOpen(false)
      resetForm()
      fetchPromoCodes()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to save promo code',
      })
    } finally {
      setIsSavingPromo(false)
    }
  }

  const handleToggleActive = async (promoCode: PromoCode) => {
    try {
      const response = await fetch(`/api/admin/promo-codes/${promoCode.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !promoCode.isActive,
        }),
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Success',
          description: promoCode.isActive ? 'Promo code deactivated' : 'Promo code activated',
        })
        fetchPromoCodes()
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to update promo code',
      })
    }
  }

  const handleDelete = async (promoCode: PromoCode) => {
    if (!confirm(`Are you sure you want to delete promo code "${promoCode.code}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/promo-codes/${promoCode.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Success',
          description: 'Promo code deleted',
        })
        fetchPromoCodes()
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to delete promo code',
      })
    }
  }

  const fetchOverview = async () => {
    try {
      setIsLoadingOverview(true)
      const response = await fetch('/api/admin/subscriptions/overview')
      if (response.ok) {
        const data = await response.json()
        setOverview(data)
      }
    } catch (error) {
      console.error('Failed to fetch overview:', error)
    } finally {
      setIsLoadingOverview(false)
    }
  }

  const calculateSavings = () => {
    const monthlyYearly = pricing.monthly * 12
    if (monthlyYearly > pricing.yearly) {
      const savings = monthlyYearly - pricing.yearly
      const savingsPercent = ((savings / monthlyYearly) * 100).toFixed(0)
      return { savings, savingsPercent }
    }
    return null
  }

  const savings = calculateSavings()

  const isExpired = (promoCode: PromoCode) => {
    if (!promoCode.validUntil) return false
    return new Date() > new Date(promoCode.validUntil)
  }

  const isNotYetValid = (promoCode: PromoCode) => {
    return new Date() < new Date(promoCode.validFrom)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Subscriptions</h1>
          <p className="text-text-secondary">Manage subscription pricing and promo codes</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-bg-tertiary">
        {[
          { id: 'pricing', label: 'Pricing', icon: '💰' },
          { id: 'promo-codes', label: 'Promo Codes', icon: '🎟️' },
          { id: 'overview', label: 'Overview', icon: '📊' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-electric-blue text-electric-blue'
                : 'border-transparent text-text-secondary hover:text-white'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Pricing Tab */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-white">Pro Subscription Pricing</h2>
              <p className="text-sm text-text-secondary mt-1">
                Set the monthly and yearly prices for Pro subscriptions
              </p>
            </CardHeader>
            <CardBody className="space-y-6">
              {isLoadingPricing ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-white">
                        Monthly Price (USD)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                          $
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.monthly}
                          onChange={(e) => setFormData({ ...formData, monthly: e.target.value })}
                          className="pl-8"
                          placeholder="9.99"
                        />
                      </div>
                      <p className="text-xs text-text-secondary">
                        Current: ${pricing.monthly.toFixed(2)}/month
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-white">
                        Yearly Price (USD)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                          $
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.yearly}
                          onChange={(e) => setFormData({ ...formData, yearly: e.target.value })}
                          className="pl-8"
                          placeholder="89.00"
                        />
                      </div>
                      <p className="text-xs text-text-secondary">
                        Current: ${pricing.yearly.toFixed(2)}/year
                      </p>
                    </div>
                  </div>

                  {savings && (
                    <div className="p-4 bg-cyber-green/10 border border-cyber-green/30 rounded-lg">
                      <p className="text-sm text-cyber-green">
                        <strong>Yearly Savings:</strong> ${savings.savings.toFixed(2)} ({savings.savingsPercent}% off)
                      </p>
                      <p className="text-xs text-text-secondary mt-1">
                        Monthly × 12 = ${(pricing.monthly * 12).toFixed(2)} vs Yearly = ${pricing.yearly.toFixed(2)}
                      </p>
                    </div>
                  )}

                  <div className="p-4 bg-neon-orange/10 border border-neon-orange/30 rounded-lg">
                    <p className="text-sm text-neon-orange">
                      <strong>Note:</strong> Price changes only affect new subscriptions. Existing subscribers will continue at their current rate until they cancel and resubscribe.
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="primary"
                      onClick={handleSavePricing}
                      isLoading={isSavingPricing}
                      className="flex-1"
                    >
                      Save Pricing
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={fetchPricing}
                      className="flex-1"
                    >
                      Reset
                    </Button>
                  </div>
                </>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-white">Current Pricing</h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-bg-tertiary rounded-lg">
                  <div className="text-sm text-text-secondary mb-1">Monthly</div>
                  <div className="text-3xl font-bold text-electric-blue">
                    ${pricing.monthly.toFixed(2)}
                    <span className="text-lg text-text-secondary font-normal">/month</span>
                  </div>
                </div>
                <div className="p-4 bg-bg-tertiary rounded-lg">
                  <div className="text-sm text-text-secondary mb-1">Yearly</div>
                  <div className="text-3xl font-bold text-electric-blue">
                    ${pricing.yearly.toFixed(2)}
                    <span className="text-lg text-text-secondary font-normal">/year</span>
                  </div>
                  {savings && (
                    <div className="mt-2 text-xs text-cyber-green">
                      Save {savings.savingsPercent}% vs monthly
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Promo Codes Tab */}
      {activeTab === 'promo-codes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Promo Codes</h2>
              <p className="text-sm text-text-secondary mt-1">
                Manage promo codes for Pro subscriptions
              </p>
            </div>
            <Button variant="primary" onClick={() => handleOpenModal()}>
              + Create Promo Code
            </Button>
          </div>

          <Card>
            <CardBody>
              {isLoadingPromoCodes ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : promoCodes.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-text-secondary mb-4">No promo codes yet</p>
                  <Button variant="primary" onClick={() => handleOpenModal()}>
                    Create Your First Promo Code
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-bg-tertiary">
                        <th className="text-left py-3 px-4 text-text-secondary font-semibold">Code</th>
                        <th className="text-left py-3 px-4 text-text-secondary font-semibold">Discount</th>
                        <th className="text-left py-3 px-4 text-text-secondary font-semibold">Uses</th>
                        <th className="text-left py-3 px-4 text-text-secondary font-semibold">Valid Period</th>
                        <th className="text-left py-3 px-4 text-text-secondary font-semibold">Applicable To</th>
                        <th className="text-left py-3 px-4 text-text-secondary font-semibold">Status</th>
                        <th className="text-right py-3 px-4 text-text-secondary font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {promoCodes.map((promoCode) => (
                        <tr key={promoCode.id} className="border-b border-bg-tertiary hover:bg-bg-secondary">
                          <td className="py-3 px-4">
                            <div className="font-mono font-bold text-white">{promoCode.code}</div>
                            {promoCode.description && (
                              <div className="text-xs text-text-secondary mt-1">{promoCode.description}</div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-white">
                              {promoCode.discountType === 'PERCENTAGE' ? (
                                <>{promoCode.discountValue}%</>
                              ) : (
                                <>${promoCode.discountValue.toFixed(2)}</>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-text-primary">
                              {promoCode.currentUses}
                              {promoCode.maxUses ? ` / ${promoCode.maxUses}` : ' / ∞'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-text-primary">
                              {new Date(promoCode.validFrom).toLocaleDateString()}
                              {promoCode.validUntil && (
                                <> - {new Date(promoCode.validUntil).toLocaleDateString()}</>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1">
                              <Badge variant="default" size="sm">
                                {promoCode.applicableTo}
                              </Badge>
                              {promoCode.billingCycles && (
                                <div className="text-xs text-text-secondary">
                                  {JSON.parse(promoCode.billingCycles).join(', ')}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1">
                              {isExpired(promoCode) ? (
                                <Badge className="bg-red-500/20 text-red-400">Expired</Badge>
                              ) : isNotYetValid(promoCode) ? (
                                <Badge className="bg-yellow-500/20 text-yellow-400">Not Yet Valid</Badge>
                              ) : promoCode.isActive ? (
                                <Badge className="bg-cyber-green/20 text-cyber-green">Active</Badge>
                              ) : (
                                <Badge className="bg-gray-500/20 text-gray-400">Inactive</Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleOpenModal(promoCode)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleToggleActive(promoCode)}
                              >
                                {promoCode.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDelete(promoCode)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {isLoadingOverview ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : overview ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <h3 className="text-sm font-medium text-text-secondary">Active Subscriptions</h3>
                  </CardHeader>
                  <CardBody>
                    <p className="text-2xl font-bold text-electric-blue">
                      {overview.activeCount || 0}
                    </p>
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader>
                    <h3 className="text-sm font-medium text-text-secondary">Total Revenue</h3>
                  </CardHeader>
                  <CardBody>
                    <p className="text-2xl font-bold text-cyber-green">
                      ${overview.totalRevenue?.toFixed(2) || '0.00'}
                    </p>
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader>
                    <h3 className="text-sm font-medium text-text-secondary">Active Promo Codes</h3>
                  </CardHeader>
                  <CardBody>
                    <p className="text-2xl font-bold text-neon-orange">
                      {promoCodes.filter(pc => pc.isActive && !isExpired(pc) && !isNotYetValid(pc)).length}
                    </p>
                  </CardBody>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardBody>
                <p className="text-text-secondary text-center py-8">No overview data available</p>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* Create/Edit Promo Code Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          resetForm()
          setEditingCode(null)
        }}
        title={editingCode ? 'Edit Promo Code' : 'Create Promo Code'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Code *</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="WELCOME50"
              disabled={!!editingCode}
            />
            <p className="text-xs text-text-secondary mt-1">
              {editingCode ? 'Code cannot be changed after creation' : 'Unique code (uppercase, no spaces)'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Welcome discount for new users"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Discount Type *</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT')}
                className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white"
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED_AMOUNT">Fixed Amount ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Discount Value *</label>
              <Input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'PERCENTAGE' ? '50' : '10.00'}
                step={discountType === 'PERCENTAGE' ? '1' : '0.01'}
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Max Uses</label>
            <Input
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Leave empty for unlimited"
              min="1"
            />
            <p className="text-xs text-text-secondary mt-1">Leave empty for unlimited uses</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Valid From *</label>
              <Input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Valid Until</label>
              <Input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
              <p className="text-xs text-text-secondary mt-1">Leave empty for no expiration</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Applicable To *</label>
            <select
              value={applicableTo}
              onChange={(e) => setApplicableTo(e.target.value as 'FREE' | 'PRO' | 'BOTH')}
              className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white"
            >
              <option value="PRO">Pro Only</option>
              <option value="FREE">Free Only</option>
              <option value="BOTH">Both Tiers</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Billing Cycles</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={billingCycles.includes('MONTHLY')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setBillingCycles([...billingCycles, 'MONTHLY'])
                    } else {
                      setBillingCycles(billingCycles.filter((c) => c !== 'MONTHLY'))
                    }
                  }}
                  className="rounded"
                />
                <span className="text-text-primary">Monthly</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={billingCycles.includes('YEARLY')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setBillingCycles([...billingCycles, 'YEARLY'])
                    } else {
                      setBillingCycles(billingCycles.filter((c) => c !== 'YEARLY'))
                    }
                  }}
                  className="rounded"
                />
                <span className="text-text-primary">Yearly</span>
              </label>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Leave both unchecked to apply to all billing cycles
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-bg-tertiary">
            <Button
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false)
                resetForm()
                setEditingCode(null)
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSavePromo} isLoading={isSavingPromo}>
              {editingCode ? 'Update' : 'Create'} Promo Code
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

