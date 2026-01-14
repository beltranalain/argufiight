'use client'

import { useState } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'

interface W9FormData {
  legalName: string
  businessName: string
  taxIdType: 'SSN' | 'EIN' | ''
  taxId: string
  businessType: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  zipCode: string
  country: string
}

interface W9FormProps {
  existingData?: Partial<W9FormData> | null
  onSubmit: (data: W9FormData) => Promise<void>
  isLoading?: boolean
}

export function W9Form({ existingData, onSubmit, isLoading }: W9FormProps) {
  const { showToast } = useToast()
  const [formData, setFormData] = useState<W9FormData>({
    legalName: existingData?.legalName || '',
    businessName: existingData?.businessName || '',
    taxIdType: existingData?.taxIdType || '',
    taxId: existingData?.taxId || '',
    businessType: existingData?.businessType || 'Individual',
    addressLine1: existingData?.addressLine1 || '',
    addressLine2: existingData?.addressLine2 || '',
    city: existingData?.city || '',
    state: existingData?.state || '',
    zipCode: existingData?.zipCode || '',
    country: existingData?.country || 'US',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof W9FormData, string>>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof W9FormData, string>> = {}

    if (!formData.legalName.trim()) {
      newErrors.legalName = 'Legal name is required'
    }

    if (!formData.taxIdType) {
      newErrors.taxIdType = 'Please select SSN or EIN'
    }

    if (!formData.taxId.trim()) {
      newErrors.taxId = 'Tax ID is required'
    } else {
      if (formData.taxIdType === 'SSN' && !/^\d{3}-?\d{2}-?\d{4}$/.test(formData.taxId.replace(/\s/g, ''))) {
        newErrors.taxId = 'SSN must be in format XXX-XX-XXXX'
      }
      if (formData.taxIdType === 'EIN' && !/^\d{2}-?\d{7}$/.test(formData.taxId.replace(/\s/g, ''))) {
        newErrors.taxId = 'EIN must be in format XX-XXXXXXX'
      }
    }

    if (!formData.businessType) {
      newErrors.businessType = 'Business type is required'
    }

    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = 'Address is required'
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required'
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required'
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required'
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = 'ZIP code must be in format 12345 or 12345-6789'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
      })
      return
    }

    try {
      await onSubmit(formData)
      showToast({
        type: 'success',
        title: 'W-9 Submitted',
        description: 'Your tax information has been saved successfully',
      })
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Submission Failed',
        description: error.message || 'Failed to submit W-9 form',
      })
    }
  }

  const formatTaxId = (value: string, type: string) => {
    const digits = value.replace(/\D/g, '')
    if (type === 'SSN') {
      if (digits.length <= 3) return digits
      if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`
    }
    if (type === 'EIN') {
      if (digits.length <= 2) return digits
      return `${digits.slice(0, 2)}-${digits.slice(2, 9)}`
    }
    return value
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">W-9 Tax Information</h2>
            <p className="text-sm text-text-secondary mt-1">
              Required for tax reporting. Your information is encrypted and secure.
            </p>
          </div>
          {existingData?.legalName && (
            <Badge className="bg-green-500 text-white">Submitted</Badge>
          )}
        </div>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Legal Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Legal Name <span className="text-red-400">*</span>
            </label>
            <Input
              type="text"
              value={formData.legalName}
              onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
              placeholder="John Doe"
              className={errors.legalName ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {errors.legalName && (
              <p className="text-red-400 text-xs mt-1">{errors.legalName}</p>
            )}
          </div>

          {/* Business Name (Optional) */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Business Name (if different from legal name)
            </label>
            <Input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              placeholder="My Business LLC"
              disabled={isLoading}
            />
          </div>

          {/* Tax ID Type */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Tax ID Type <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="taxIdType"
                  value="SSN"
                  checked={formData.taxIdType === 'SSN'}
                  onChange={(e) => setFormData({ ...formData, taxIdType: e.target.value as 'SSN' | 'EIN', taxId: '' })}
                  disabled={isLoading}
                  className="w-4 h-4 text-electric-blue"
                />
                <span className="text-text-secondary">SSN</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="taxIdType"
                  value="EIN"
                  checked={formData.taxIdType === 'EIN'}
                  onChange={(e) => setFormData({ ...formData, taxIdType: e.target.value as 'SSN' | 'EIN', taxId: '' })}
                  disabled={isLoading}
                  className="w-4 h-4 text-electric-blue"
                />
                <span className="text-text-secondary">EIN</span>
              </label>
            </div>
            {errors.taxIdType && (
              <p className="text-red-400 text-xs mt-1">{errors.taxIdType}</p>
            )}
          </div>

          {/* Tax ID */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              {formData.taxIdType === 'SSN' ? 'Social Security Number (SSN)' : formData.taxIdType === 'EIN' ? 'Employer Identification Number (EIN)' : 'Tax ID'} <span className="text-red-400">*</span>
            </label>
            <Input
              type="text"
              value={formData.taxId}
              onChange={(e) => {
                const formatted = formData.taxIdType ? formatTaxId(e.target.value, formData.taxIdType) : e.target.value
                setFormData({ ...formData, taxId: formatted })
              }}
              placeholder={formData.taxIdType === 'SSN' ? 'XXX-XX-XXXX' : formData.taxIdType === 'EIN' ? 'XX-XXXXXXX' : 'Enter tax ID'}
              maxLength={formData.taxIdType === 'SSN' ? 11 : formData.taxIdType === 'EIN' ? 10 : 20}
              className={errors.taxId ? 'border-red-500' : ''}
              disabled={isLoading || !formData.taxIdType}
            />
            {errors.taxId && (
              <p className="text-red-400 text-xs mt-1">{errors.taxId}</p>
            )}
            <p className="text-xs text-text-secondary mt-1">
              Your tax ID is encrypted and stored securely. We only use this for 1099 tax form generation.
            </p>
          </div>

          {/* Business Type */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Business Type <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.businessType}
              onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
              className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
              disabled={isLoading}
            >
              <option value="Individual">Individual/Sole Proprietor</option>
              <option value="LLC">LLC</option>
              <option value="Corporation">Corporation (C-Corp)</option>
              <option value="S-Corporation">S-Corporation</option>
              <option value="Partnership">Partnership</option>
              <option value="Trust">Trust</option>
              <option value="Estate">Estate</option>
            </select>
            {errors.businessType && (
              <p className="text-red-400 text-xs mt-1">{errors.businessType}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Address Line 1 <span className="text-red-400">*</span>
            </label>
            <Input
              type="text"
              value={formData.addressLine1}
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              placeholder="123 Main St"
              className={errors.addressLine1 ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {errors.addressLine1 && (
              <p className="text-red-400 text-xs mt-1">{errors.addressLine1}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Address Line 2 (Optional)
            </label>
            <Input
              type="text"
              value={formData.addressLine2}
              onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
              placeholder="Apt 4B"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                City <span className="text-red-400">*</span>
              </label>
              <Input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="New York"
                className={errors.city ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.city && (
                <p className="text-red-400 text-xs mt-1">{errors.city}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                State <span className="text-red-400">*</span>
              </label>
              <Input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                placeholder="NY"
                maxLength={2}
                className={errors.state ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.state && (
                <p className="text-red-400 text-xs mt-1">{errors.state}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              ZIP Code <span className="text-red-400">*</span>
            </label>
            <Input
              type="text"
              value={formData.zipCode}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              placeholder="10001"
              maxLength={10}
              className={errors.zipCode ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {errors.zipCode && (
              <p className="text-red-400 text-xs mt-1">{errors.zipCode}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-bg-tertiary">
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {existingData?.legalName ? 'Update W-9 Information' : 'Submit W-9 Form'}
            </Button>
          </div>

          <div className="bg-bg-tertiary/50 rounded-lg p-4 text-xs text-text-secondary">
            <p className="font-semibold mb-2">Why we need this:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>If you earn $600 or more in a calendar year, we're required by law to issue you a 1099-NEC form</li>
              <li>Your tax information is encrypted and stored securely</li>
              <li>We only use this information for tax reporting purposes</li>
              <li>You can update your information at any time</li>
            </ul>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}
