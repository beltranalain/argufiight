'use client'

import { useState, useEffect } from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import { UserSearchInput } from './UserSearchInput'

interface CreateDebateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  initialTopic?: string
  initialCategory?: string
}

interface User {
  id: string
  username: string
  avatarUrl: string | null
  eloRating: number
}

const POSITIONS = [
  { value: 'FOR', label: 'For' },
  { value: 'AGAINST', label: 'Against' },
] as const

type PositionValue = typeof POSITIONS[number]['value']

const CHALLENGE_TYPES = [
  { value: 'OPEN', label: 'Open Challenge', description: 'Anyone can accept' },
  { value: 'DIRECT', label: 'Direct Challenge', description: 'Challenge a specific user' },
  { value: 'GROUP', label: 'Group Challenge', description: 'Invite multiple users' },
] as const

type ChallengeTypeValue = typeof CHALLENGE_TYPES[number]['value']

export function CreateDebateModal({ isOpen, onClose, onSuccess, initialTopic, initialCategory }: CreateDebateModalProps) {
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [categories, setCategories] = useState<Array<{ value: string; label: string }>>([])
  const [category, setCategory] = useState<string>('TECH')
  const [position, setPosition] = useState<PositionValue>('FOR')
  const [totalRounds, setTotalRounds] = useState(5)
  const [speedMode, setSpeedMode] = useState(false)
  const [challengeType, setChallengeType] = useState<ChallengeTypeValue>('OPEN')
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<Array<{ file: File; preview: string; alt?: string; caption?: string; order: number }>>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const { showToast } = useToast()

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        if (response.ok) {
          const data = await response.json()
          const activeCategories = (data.categories || [])
            .map((cat: any) => ({
              value: cat.name,
              label: cat.label || cat.name.charAt(0) + cat.name.slice(1).toLowerCase(),
            }))
            .sort((a: any, b: any) => {
              // Sort by sortOrder if available, otherwise by label
              const aOrder = data.categories.find((c: any) => c.name === a.value)?.sortOrder ?? 999
              const bOrder = data.categories.find((c: any) => c.name === b.value)?.sortOrder ?? 999
              return aOrder - bOrder
            })
          
          setCategories(activeCategories)
          
          // Set initial category if provided and valid
          if (initialCategory && activeCategories.some((c: any) => c.value === initialCategory)) {
            setCategory(initialCategory)
          } else if (activeCategories.length > 0) {
            setCategory(activeCategories[0].value)
          }
        } else {
          // Fallback to default categories if API fails
          setCategories([
            { value: 'SPORTS', label: 'Sports' },
            { value: 'POLITICS', label: 'Politics' },
            { value: 'TECH', label: 'Tech' },
            { value: 'ENTERTAINMENT', label: 'Entertainment' },
            { value: 'SCIENCE', label: 'Science' },
            { value: 'OTHER', label: 'Other' },
          ])
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
        // Fallback to default categories
        setCategories([
          { value: 'SPORTS', label: 'Sports' },
          { value: 'POLITICS', label: 'Politics' },
          { value: 'TECH', label: 'Tech' },
          { value: 'ENTERTAINMENT', label: 'Entertainment' },
          { value: 'SCIENCE', label: 'Science' },
          { value: 'OTHER', label: 'Other' },
        ])
      } finally {
        setIsLoadingCategories(false)
      }
    }

    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen, initialCategory])

  // Update form when initial values are provided
  useEffect(() => {
    if (isOpen) {
      if (initialTopic) {
        setTopic(initialTopic)
      }
      if (initialCategory && categories.some(cat => cat.value === initialCategory)) {
        setCategory(initialCategory)
      } else if (categories.length > 0) {
        setCategory(categories[0].value)
      }
    } else {
      // Reset form when modal closes
      setTopic('')
      setDescription('')
      if (categories.length > 0) {
        setCategory(categories[0].value)
      } else {
        setCategory('TECH')
      }
      setPosition('FOR')
      setTotalRounds(5)
      setSpeedMode(false)
      setChallengeType('OPEN')
      setSelectedUsers([])
      setImages([])
    }
  }, [isOpen, initialTopic, initialCategory, categories])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Limit to 6 images max
    const remainingSlots = 6 - images.length
    if (remainingSlots <= 0) {
      showToast({
        title: 'Limit Reached',
        description: 'You can add up to 6 images per debate',
        type: 'error',
      })
      return
    }

    const newImages = files.slice(0, remainingSlots).map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      alt: '',
      caption: '',
      order: images.length + index,
    }))

    setImages([...images, ...newImages])
    e.target.value = '' // Reset input
  }

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    // Update order for remaining images
    const reorderedImages = newImages.map((img, i) => ({ ...img, order: i }))
    setImages(reorderedImages)
  }

  const handleImageFieldChange = (index: number, field: 'alt' | 'caption', value: string) => {
    const newImages = [...images]
    newImages[index] = { ...newImages[index], [field]: value }
    setImages(newImages)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!topic.trim()) {
      showToast({
        title: 'Error',
        description: 'Topic is required',
        type: 'error',
      })
      return
    }

    // Validate challenge type requirements
    if (challengeType === 'DIRECT' && selectedUsers.length !== 1) {
      showToast({
        title: 'Error',
        description: 'Please select exactly one user for a direct challenge',
        type: 'error',
      })
      return
    }

    if (challengeType === 'GROUP' && selectedUsers.length === 0) {
      showToast({
        title: 'Error',
        description: 'Please select at least one user for a group challenge',
        type: 'error',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/debates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          description: description.trim() || null,
          category,
          challengerPosition: position,
          totalRounds,
          speedMode,
          challengeType,
          invitedUserIds: challengeType !== 'OPEN' ? selectedUsers.map(u => u.id) : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create debate')
      }

      const debate = await response.json()

      // Upload images if any
      if (images.length > 0) {
        setUploadingImages(true)
        try {
          for (let i = 0; i < images.length; i++) {
            const imageData = images[i]
            const formData = new FormData()
            formData.append('image', imageData.file)
            formData.append('debateId', debate.id)
            formData.append('alt', imageData.alt || '')
            formData.append('caption', imageData.caption || '')
            formData.append('order', i.toString())

            const imageResponse = await fetch('/api/debates/images', {
              method: 'POST',
              body: formData,
            })

            if (!imageResponse.ok) {
              console.error('Failed to upload image:', await imageResponse.text())
            }
          }
        } catch (error) {
          console.error('Error uploading images:', error)
          // Don't fail the whole operation if images fail
        } finally {
          setUploadingImages(false)
        }
      }

      const successMessage = challengeType === 'OPEN'
        ? 'Your challenge is now waiting for an opponent'
        : challengeType === 'DIRECT'
        ? `Challenge sent to ${selectedUsers[0]?.username}!`
        : `Challenge sent to ${selectedUsers.length} user${selectedUsers.length > 1 ? 's' : ''}!`

      showToast({
        title: 'Debate Created!',
        description: successMessage,
        type: 'success',
      })

      // Reset form
      setTopic('')
      setDescription('')
      if (categories.length > 0) {
        setCategory(categories[0].value)
      } else {
        setCategory('TECH')
      }
      setPosition('FOR')
      setTotalRounds(5)
      setSpeedMode(false)
      setChallengeType('OPEN')
      setSelectedUsers([])
      setImages([])

      // Dispatch custom event to refresh challenges panel
      // Only dispatch if page is fully loaded (not during refresh)
      if (document.readyState === 'complete') {
        window.dispatchEvent(new Event('debate-created'))
      }

      onClose()
      onSuccess?.()
    } catch (error: any) {
      showToast({
        title: 'Error',
        description: error.message || 'Failed to create debate',
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Debate Challenge">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Topic */}
        <Input
          label="Debate Topic"
          placeholder="e.g., Is AI Art Real Art?"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
          maxLength={200}
        />

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add context or details about the debate topic..."
            className="w-full px-4 py-3 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-electric-blue transition-colors resize-none"
            rows={4}
            maxLength={1000}
          />
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">
            Images (Optional) - Up to 6 images
          </label>
          <div className="space-y-4">
            {/* Image Upload Area */}
            <div className="border-2 border-dashed border-bg-tertiary rounded-lg p-6 text-center hover:border-electric-blue transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
                id="debate-images-upload"
                disabled={images.length >= 6}
              />
              <label
                htmlFor="debate-images-upload"
                className={`cursor-pointer ${images.length >= 6 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg className="w-12 h-12 mx-auto mb-2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-text-secondary text-sm">
                  {images.length >= 6 ? 'Maximum 6 images reached' : 'Click to add images or drag and drop'}
                </p>
                <p className="text-text-muted text-xs mt-1">JPG, PNG, WebP up to 10MB each</p>
              </label>
            </div>

            {/* Image Preview Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative bg-bg-secondary border border-bg-tertiary rounded-lg p-3">
                    <div className="relative aspect-square mb-2 rounded overflow-hidden">
                      <img
                        src={image.preview}
                        alt={image.alt || `Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Alt text (optional)"
                      value={image.alt}
                      onChange={(e) => handleImageFieldChange(index, 'alt', e.target.value)}
                      className="w-full px-2 py-1 mb-2 bg-bg-tertiary border border-bg-tertiary rounded text-text-primary text-xs placeholder-text-muted focus:outline-none focus:border-electric-blue"
                    />
                    <input
                      type="text"
                      placeholder="Caption (optional)"
                      value={image.caption}
                      onChange={(e) => handleImageFieldChange(index, 'caption', e.target.value)}
                      className="w-full px-2 py-1 bg-bg-tertiary border border-bg-tertiary rounded text-text-primary text-xs placeholder-text-muted focus:outline-none focus:border-electric-blue"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-3">
            Category
          </label>
          {isLoadingCategories ? (
            <div className="flex items-center justify-center py-4">
              <div className="text-text-secondary text-sm">Loading categories...</div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`px-4 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
                    category === cat.value
                      ? 'border-electric-blue bg-electric-blue/10 text-electric-blue'
                      : 'border-bg-tertiary text-text-secondary hover:border-text-secondary'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Position */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-3">
            Your Position
          </label>
          <div className="flex gap-4">
            {POSITIONS.map((pos) => (
              <button
                key={pos.value}
                type="button"
                onClick={() => setPosition(pos.value)}
                className={`flex-1 px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                  position === pos.value
                    ? 'border-electric-blue bg-electric-blue/10 text-electric-blue'
                    : 'border-bg-tertiary text-text-secondary hover:border-text-secondary'
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rounds */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-3">
            Number of Rounds: {totalRounds}
          </label>
          <input
            type="range"
            min="3"
            max="7"
            value={totalRounds}
            onChange={(e) => setTotalRounds(Number(e.target.value))}
            className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-electric-blue"
          />
          <div className="flex justify-between text-xs text-text-secondary mt-1">
            <span>3 (Quick)</span>
            <span>5 (Standard)</span>
            <span>7 (Extended)</span>
          </div>
        </div>

        {/* Challenge Type */}
        <div>
          <label className="block text-sm font-semibold text-text-primary mb-3">
            Challenge Type
          </label>
          <div className="space-y-2">
            {CHALLENGE_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => {
                  setChallengeType(type.value)
                  if (type.value === 'OPEN') {
                    setSelectedUsers([])
                  }
                }}
                className={`w-full px-4 py-3 rounded-lg border-2 text-left transition-all ${
                  challengeType === type.value
                    ? 'border-electric-blue bg-electric-blue/10'
                    : 'border-bg-tertiary hover:border-text-secondary'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-semibold ${challengeType === type.value ? 'text-electric-blue' : 'text-text-primary'}`}>
                      {type.label}
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">{type.description}</p>
                  </div>
                  {challengeType === type.value && (
                    <div className="w-5 h-5 rounded-full bg-electric-blue flex items-center justify-center">
                      <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* User Selection (for Direct/Group challenges) */}
        {(challengeType === 'DIRECT' || challengeType === 'GROUP') && (
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              {challengeType === 'DIRECT' ? 'Select User' : 'Select Users'}
              {challengeType === 'GROUP' && (
                <span className="text-text-secondary text-xs ml-2">(Up to 10 users)</span>
              )}
            </label>
            <UserSearchInput
              selectedUsers={selectedUsers}
              onUsersChange={setSelectedUsers}
              maxUsers={challengeType === 'DIRECT' ? 1 : 10}
              placeholder={challengeType === 'DIRECT' ? 'Search for a user to challenge...' : 'Search for users to invite...'}
              allowMultiple={challengeType === 'GROUP'}
            />
            {challengeType === 'DIRECT' && selectedUsers.length === 0 && (
              <p className="text-xs text-text-secondary mt-2">
                You must select a user to send a direct challenge
              </p>
            )}
            {challengeType === 'GROUP' && selectedUsers.length === 0 && (
              <p className="text-xs text-text-secondary mt-2">
                Select at least one user to send a group challenge
              </p>
            )}
          </div>
        )}

        {/* Speed Mode */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="speedMode"
            checked={speedMode}
            onChange={(e) => setSpeedMode(e.target.checked)}
            className="w-5 h-5 rounded border-bg-tertiary bg-bg-secondary text-electric-blue focus:ring-electric-blue focus:ring-2"
          />
          <label htmlFor="speedMode" className="text-sm text-text-primary cursor-pointer">
            <span className="font-semibold">Speed Mode</span>
            <span className="text-text-secondary ml-2">(1 hour per round instead of 24 hours)</span>
          </label>
        </div>

        <ModalFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting || uploadingImages} disabled={uploadingImages}>
            {uploadingImages ? 'Uploading Images...' : 'Create Challenge'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

