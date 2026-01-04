'use client'

import { useState, useEffect, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

interface EditBeltModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  belt: {
    id: string
    name: string
    type: string
    category: string | null
    coinValue: number
    designImageUrl: string | null
    sponsorName: string | null
    sponsorLogoUrl: string | null
  }
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

export function EditBeltModal({ isOpen, onClose, onSuccess, belt }: EditBeltModalProps) {
  const { showToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: belt.name,
    type: belt.type,
    category: belt.category || '',
    coinValue: belt.coinValue.toString(),
    designImageUrl: belt.designImageUrl || '',
    sponsorName: belt.sponsorName || '',
    sponsorLogoUrl: belt.sponsorLogoUrl || '',
  })

  // Track if we've uploaded an image to prevent reset
  const uploadedImageUrlRef = useRef<string | null>(null)
  
  // Update form data when belt changes, but preserve uploaded image URL
  useEffect(() => {
    if (belt && isOpen) {
      console.log('Modal opened, initializing formData from belt:', belt.designImageUrl)
      // Preserve uploaded URL if one exists, otherwise use belt's URL
      const imageUrl = uploadedImageUrlRef.current || belt.designImageUrl || ''
      setFormData({
        name: belt.name,
        type: belt.type,
        category: belt.category || '',
        coinValue: belt.coinValue.toString(),
        designImageUrl: imageUrl,
        sponsorName: belt.sponsorName || '',
        sponsorLogoUrl: belt.sponsorLogoUrl || '',
      })
    }
    if (!isOpen) {
      // Clear ref when modal closes
      uploadedImageUrlRef.current = null
    }
  }, [belt, isOpen])

  // Debug: Log when file input ref is set
  useEffect(() => {
    console.log('File input ref:', fileInputRef.current)
  }, [isOpen])

  const handleImageUpload = async (file: File) => {
    console.log('handleImageUpload called with file:', file.name, file.type, file.size)
    
    if (!file.type.startsWith('image/')) {
      console.log('Invalid file type:', file.type)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Please select an image file',
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      console.log('File too large:', file.size)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Image must be less than 10MB',
      })
      return
    }

    try {
      setIsUploading(true)
      console.log('Starting upload...')
      const formData = new FormData()
      formData.append('image', file)
      console.log('FormData created, sending to /api/admin/belts/images')

      const response = await fetch('/api/admin/belts/images', {
        method: 'POST',
        body: formData,
      })

      console.log('Upload response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Upload successful, received URL:', data.url)
        // Store in ref to prevent reset
        uploadedImageUrlRef.current = data.url
        setFormData(prev => {
          const updated = { ...prev, designImageUrl: data.url }
          console.log('Updated formData with URL:', updated.designImageUrl)
          console.log('Full formData after update:', updated)
          return updated
        })
        showToast({
          type: 'success',
          title: 'Image Uploaded!',
          description: 'Your image has been uploaded. Scroll down to see the preview, then click "Update Belt" to save.',
        })
      } else {
        const error = await response.json()
        console.error('Upload failed:', error)
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
    console.log('File input changed', e.target.files)
    const file = e.target.files?.[0]
    if (file) {
      console.log('File selected:', file.name, file.type, file.size)
      handleImageUpload(file)
      // Reset the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } else {
      console.log('No file selected')
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
      
      // Get the current formData value - check ref first, then formData
      const currentDesignImageUrl = uploadedImageUrlRef.current || formData.designImageUrl?.trim() || ''
      console.log('=== UPDATING BELT ===')
      console.log('Current formData object:', formData)
      console.log('uploadedImageUrlRef.current:', uploadedImageUrlRef.current)
      console.log('formData.designImageUrl:', formData.designImageUrl)
      console.log('designImageUrl being used:', currentDesignImageUrl)
      
      const updateData = {
        name: formData.name.trim(),
        type: formData.type,
        category: formData.category || undefined,
        coinValue: parseInt(formData.coinValue) || 0,
        designImageUrl: currentDesignImageUrl || undefined,
        sponsorName: formData.sponsorName.trim() || undefined,
        sponsorLogoUrl: formData.sponsorLogoUrl.trim() || undefined,
      }
      console.log('Updating belt with data:', updateData)
      console.log('designImageUrl being sent:', updateData.designImageUrl)
      
      const response = await fetch(`/api/admin/belts/${belt.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Belt update response:', result)
        console.log('Updated belt designImageUrl:', result.belt?.designImageUrl)
        showToast({
          type: 'success',
          title: 'Success',
          description: 'Belt updated successfully',
        })
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        showToast({
          type: 'error',
          title: 'Error',
          description: error.error || 'Failed to update belt',
        })
      }
    } catch (error) {
      console.error('Failed to update belt:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to update belt',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Belt" size="lg">
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
            onChange={(e) => setFormData({ ...formData, type: e.target.value, category: formData.type === 'CATEGORY' ? formData.category : (e.target.value === 'CATEGORY' ? '' : formData.category) })}
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
            Coin Value
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
            <div className="flex gap-2">
              <Input
                type="url"
                value={formData.designImageUrl || ''}
                onChange={(e) => {
                  console.log('URL input changed to:', e.target.value)
                  setFormData({ ...formData, designImageUrl: e.target.value })
                }}
                placeholder="https://example.com/belt-image.png"
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  // Test image URL
                  const testImageUrl = 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&h=600&fit=crop'
                  setFormData(prev => ({ ...prev, designImageUrl: testImageUrl }))
                  showToast({
                    type: 'success',
                    title: 'Test Image Added',
                    description: 'A test image URL has been added. Click "Update Belt" to save.',
                  })
                }}
              >
                Use Test Image
              </Button>
            </div>
            <p className="text-text-secondary text-xs mt-1">
              Paste an image URL from any hosting service, or click "Use Test Image" to try with a sample image
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
                  onLoad={() => console.log('Preview image loaded successfully')}
                  onError={(e) => {
                    console.error('Preview image failed to load:', formData.designImageUrl)
                    e.currentTarget.style.display = 'none'
                    const parent = e.currentTarget.parentElement
                    if (parent) {
                      parent.innerHTML = `
                        <div class="flex flex-col items-center justify-center h-full text-text-secondary text-center p-4">
                          <p class="mb-2">Image URL saved but preview failed to load</p>
                          <p class="text-xs">URL: ${formData.designImageUrl.substring(0, 50)}...</p>
                          <p class="text-xs mt-2">Click "Update Belt" to save. The image may take a moment to be available.</p>
                        </div>
                      `
                    }
                  }}
                />
              </div>
              <p className="text-xs text-text-secondary mt-2 text-center">
                ⚠️ Don't forget to click <strong>"Update Belt"</strong> below to save this image!
              </p>
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
            Update Belt
          </Button>
        </div>
      </form>
    </Modal>
  )
}
