'use client'

import { useState, useEffect } from 'react'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'

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

export default function PromoCodesPage() {
  const { showToast } = useToast()
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null)

  // Form state
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE')
  const [discountValue, setDiscountValue] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [validFrom, setValidFrom] = useState(new Date().toISOString().split('T')[0])
  const [validUntil, setValidUntil] = useState('')
  const [applicableTo, setApplicableTo] = useState<'FREE' | 'PRO' | 'BOTH'>('PRO')
  const [billingCycles, setBillingCycles] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchPromoCodes()
  }, [])

  const fetchPromoCodes = async () => {
    try {
      setIsLoading(true)
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
      setIsLoading(false)
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

  const handleSave = async () => {
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

    setIsSaving(true)
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
      setIsSaving(false)
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

  const isExpired = (promoCode: PromoCode) => {
    if (!promoCode.validUntil) return false
    return new Date() > new Date(promoCode.validUntil)
  }

  const isNotYetValid = (promoCode: PromoCode) => {
    return new Date() < new Date(promoCode.validFrom)
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
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Promo Codes</h1>
              <p className="text-text-secondary mt-1">Manage promo codes for Pro subscriptions</p>
            </div>
            <Button variant="primary" onClick={() => handleOpenModal()}>
              + Create Promo Code
            </Button>
          </div>

          <Card>
            <CardBody>
              {promoCodes.length === 0 ? (
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
      </div>

      {/* Create/Edit Modal */}
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
            <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
              {editingCode ? 'Update' : 'Create'} Promo Code
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

