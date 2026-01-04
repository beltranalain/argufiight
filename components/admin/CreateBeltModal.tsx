'use client'

import { useState, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

interface CreateBeltModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const BELT_TYPES = [
  { value: 'ROOKIE', label: 'Rookie' },
  { value: 'CATEGORY', label: 'Category' },
  { value: 'CHAMPIONSHIP', label: 'Championship' },
  { value: 'UNDEFEATED', label: 'Undefeated' },
  { value: 'TOURNAMENT', label: 'Tournament' },
]

const CATEGORIES = [
  'POLITICS',
  'SPORTS',
  'TECH',
  'ENTERTAINMENT',
  'SCIENCE',
  'PHILOSOPHY',
  'RELIGION',
  'ECONOMICS',
  'HEALTH',
  'EDUCATION',
  'GENERAL',
]

export function CreateBeltModal({ isOpen, onClose, onSuccess }: CreateBeltModalProps) {
  const { showToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'CATEGORY',
    category: '',
    coinValue: '0',
    designImageUrl: '',
    sponsorName: '',
    sponsorLogoUrl: '',
    initialHolderId: '',
  })

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Please select an image file',
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Image must be less than 10MB',
      })
      return
    }

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/admin/belts/images', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({ ...prev, designImageUrl: data.url }))
        showToast({
          type: 'success',
          title: 'Success',
          description: 'Image uploaded successfully',
        })
      } else {
        const error = await response.json()
        showToast({
          type: 'error',
          title: 'Error',
          description: error.error || 'Failed to upload image',
        })
      }
    } catch (error) {
      console.error('Failed to upload image:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to upload image',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Choose File button clicked, fileInputRef:', fileInputRef.current)
    if (fileInputRef.current) {
      fileInputRef.current.click()
    } else {
      console.error('File input ref is null')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Belt name is required',
      })
      return
    }

    if (formData.type === 'CATEGORY' && !formData.category) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Category is required for Category type belts',
      })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/admin/belts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          type: formData.type,
          category: formData.category || undefined,
          coinValue: parseInt(formData.coinValue) || 0,
          designImageUrl: formData.designImageUrl.trim() || undefined,
          sponsorName: formData.sponsorName.trim() || undefined,
          sponsorLogoUrl: formData.sponsorLogoUrl.trim() || undefined,
          initialHolderId: formData.initialHolderId.trim() || undefined,
        }),
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Success',
          description: 'Belt created successfully',
        })
        // Reset form
        setFormData({
          name: '',
          type: 'CATEGORY',
          category: '',
          coinValue: '0',
          designImageUrl: '',
          sponsorName: '',
          sponsorLogoUrl: '',
          initialHolderId: '',
        })
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        showToast({
          type: 'error',
          title: 'Error',
          description: error.error || 'Failed to create belt',
        })
      }
    } catch (error) {
      console.error('Failed to create belt:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to create belt',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Belt">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Belt Name */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Belt Name *
          </label>
          <Input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Sports Championship Belt"
            required
          />
        </div>

        {/* Belt Type */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Belt Type *
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value, category: formData.type === 'CATEGORY' ? '' : formData.category })}
            className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-lg text-white"
            required
          >
            {BELT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category (only for CATEGORY type) */}
        {formData.type === 'CATEGORY' && (
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-lg text-white"
              required
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Coin Value */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Initial Coin Value
          </label>
          <Input
            type="number"
            value={formData.coinValue}
            onChange={(e) => setFormData({ ...formData, coinValue: e.target.value })}
            placeholder="0"
            min="0"
          />
        </div>

        {/* Design Image */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Design Image
          </label>
          
          {/* File Upload */}
          <div className="mb-3">
            <div
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-bg-tertiary border-dashed rounded-lg bg-bg-secondary transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {isUploading ? (
                  <>
                    <svg className="w-8 h-8 mb-2 text-text-secondary animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm text-text-secondary">Uploading...</p>
                  </>
                ) : (
                  <>
                    <svg className="w-8 h-8 mb-2 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-3 text-sm text-text-secondary">
                      Drag and drop an image here
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleClick}
                      disabled={isUploading}
                    >
                      Choose File
                    </Button>
                    <p className="mt-2 text-xs text-text-secondary">PNG, JPG, GIF up to 10MB</p>
                  </>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
              id="belt-image-upload"
            />
          </div>

          {/* Or use URL */}
          <div className="mb-2">
            <p className="text-text-secondary text-xs mb-2 text-center">or</p>
            <Input
              type="url"
              value={formData.designImageUrl}
              onChange={(e) => setFormData({ ...formData, designImageUrl: e.target.value })}
              placeholder="https://example.com/belt-image.png"
            />
            <p className="text-text-secondary text-xs mt-1">
              Paste an image URL from any hosting service
            </p>
          </div>
          
          {/* Live Preview */}
          {formData.designImageUrl && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-white mb-2">
                Preview
              </label>
              <div className="relative w-full min-h-[300px] bg-bg-secondary border-2 border-bg-tertiary rounded-xl overflow-hidden flex items-center justify-center p-6">
                <img
                  src={formData.designImageUrl}
                  alt="Belt preview"
                  className="max-w-full max-h-[400px] w-auto h-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    const parent = e.currentTarget.parentElement
                    if (parent) {
                      parent.innerHTML = '<div class="flex items-center justify-center h-full text-text-secondary">Invalid image URL or image failed to load</div>'
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Sponsor Name */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Sponsor Name
          </label>
          <Input
            type="text"
            value={formData.sponsorName}
            onChange={(e) => setFormData({ ...formData, sponsorName: e.target.value })}
            placeholder="Optional sponsor name"
          />
        </div>

        {/* Sponsor Logo URL */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Sponsor Logo URL
          </label>
          <Input
            type="url"
            value={formData.sponsorLogoUrl}
            onChange={(e) => setFormData({ ...formData, sponsorLogoUrl: e.target.value })}
            placeholder="https://example.com/sponsor-logo.png"
          />
        </div>

        {/* Initial Holder ID (optional) */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Initial Holder User ID (Optional)
          </label>
          <Input
            type="text"
            value={formData.initialHolderId}
            onChange={(e) => setFormData({ ...formData, initialHolderId: e.target.value })}
            placeholder="Leave empty to create vacant belt"
          />
          <p className="text-text-secondary text-xs mt-1">
            If provided, the belt will be immediately assigned to this user
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
          >
            Create Belt
          </Button>
        </div>
      </form>
    </Modal>
  )
}
