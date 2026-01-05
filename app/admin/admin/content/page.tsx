'use client'

import { useState, useEffect } from 'react'
// AdminLayout is provided by app/admin/layout.tsx
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import Image from 'next/image'

interface HomepageSection {
  id: string
  key: string
  title: string | null
  content: string | null
  order: number
  isVisible: boolean
  metaTitle: string | null
  metaDescription: string | null
  images: Array<{
    id: string
    url: string
    alt: string | null
    caption: string | null
    order: number
    imagePosition: string | null
  }>
  buttons: Array<{
    id: string
    text: string
    url: string | null
    variant: string
    order: number
    isVisible: boolean
  }>
}

export default function ContentManagerPage() {
  const { showToast } = useToast()
  const [sections, setSections] = useState<HomepageSection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSection, setSelectedSection] = useState<HomepageSection | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false)
  const [mediaLibrary, setMediaLibrary] = useState<any[]>([])

  useEffect(() => {
    fetchSections()
    fetchMediaLibrary()
  }, [])

  const fetchSections = async () => {
    try {
      const response = await fetch('/api/admin/content/sections')
      if (response.ok) {
        const data = await response.json()
        setSections(data.sections || [])
      }
    } catch (error) {
      console.error('Failed to fetch sections:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMediaLibrary = async () => {
    try {
      const response = await fetch('/api/admin/content/media')
      if (response.ok) {
        const data = await response.json()
        setMediaLibrary(data.media || [])
      }
    } catch (error) {
      console.error('Failed to fetch media library:', error)
    }
  }

  const handleToggleVisibility = async (sectionId: string, isVisible: boolean) => {
    try {
      const response = await fetch(`/api/admin/content/sections/${sectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !isVisible }),
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Section Updated',
          description: `Section ${!isVisible ? 'shown' : 'hidden'} successfully`,
        })
        fetchSections()
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Update Failed',
        description: 'Failed to update section visibility',
      })
    }
  }

  const handleEditSection = (section: HomepageSection) => {
    setSelectedSection(section)
    setIsEditModalOpen(true)
  }

  const handleSaveSection = async (sectionData: Partial<HomepageSection>) => {
    if (!selectedSection) return

    try {
      const response = await fetch(`/api/admin/content/sections/${selectedSection.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sectionData),
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Section Saved',
          description: 'Homepage section updated successfully',
        })
        await fetchSections() // Refresh sections
        // Re-open the modal with updated data
        const updatedSections = await fetch('/api/admin/content/sections').then(r => r.json())
        const updatedSection = updatedSections.sections?.find((s: HomepageSection) => s.id === selectedSection.id)
        if (updatedSection) {
          setSelectedSection(updatedSection)
        } else {
          setIsEditModalOpen(false)
          setSelectedSection(null)
        }
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        description: 'Failed to save section',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const sortedSections = [...sections].sort((a, b) => a.order - b.order)

  return (
    <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Content Manager</h1>
            <p className="text-text-secondary">Manage your homepage content, images, and layout</p>
          </div>
          <div className="flex gap-4">
            <Button
              variant="secondary"
              onClick={() => setIsMediaModalOpen(true)}
            >
              Media Library
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsAddSectionModalOpen(true)}
            >
              Add Section
            </Button>
            <Button
              onClick={() => {
                window.open('/', '_blank')
              }}
            >
              Preview Homepage
            </Button>
          </div>
        </div>

        {/* Sections List */}
        <div className="space-y-4">
          {sortedSections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              onEdit={() => handleEditSection(section)}
              onToggleVisibility={() => handleToggleVisibility(section.id, section.isVisible)}
            />
          ))}
        </div>

        {/* Edit Section Modal */}
        {isEditModalOpen && selectedSection && (
          <EditSectionModal
            section={selectedSection}
            mediaLibrary={mediaLibrary}
            onClose={() => {
              setIsEditModalOpen(false)
              setSelectedSection(null)
            }}
            onSave={handleSaveSection}
            onMediaUpload={fetchMediaLibrary}
            onSectionsUpdate={fetchSections}
          />
        )}

        {/* Media Library Modal */}
        {isMediaModalOpen && (
          <MediaLibraryModal
            media={mediaLibrary}
            onClose={() => setIsMediaModalOpen(false)}
            onUpload={fetchMediaLibrary}
          />
        )}

        {/* Add Section Modal */}
        {isAddSectionModalOpen && (
          <AddSectionModal
            onClose={() => setIsAddSectionModalOpen(false)}
            onSave={async () => {
              await fetchSections()
              setIsAddSectionModalOpen(false)
            }}
          />
        )}
    </div>
  )
}

function SectionCard({
  section,
  onEdit,
  onToggleVisibility,
}: {
  section: HomepageSection
  onEdit: () => void
  onToggleVisibility: () => void
}) {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-white">{section.title || section.key}</h3>
            <span className="px-2 py-1 text-xs rounded bg-bg-tertiary text-text-secondary">
              {section.key}
            </span>
            {section.isVisible ? (
              <span className="px-2 py-1 text-xs rounded bg-cyber-green/20 text-cyber-green">
                Visible
              </span>
            ) : (
              <span className="px-2 py-1 text-xs rounded bg-text-muted/20 text-text-muted">
                Hidden
              </span>
            )}
          </div>
          {section.content && (
            <p className="text-text-secondary text-sm mb-4 line-clamp-2">
              {section.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-text-secondary">
            <span>{section.images.length} image(s)</span>
            <span>{section.buttons.length} button(s)</span>
            <span>Order: {section.order}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={onToggleVisibility}
            className="text-sm px-3 py-1.5"
          >
            {section.isVisible ? 'Hide' : 'Show'}
          </Button>
          <Button onClick={onEdit} className="text-sm px-3 py-1.5">
            Edit
          </Button>
        </div>
      </div>
    </div>
  )
}

function EditSectionModal({
  section: initialSection,
  mediaLibrary,
  onClose,
  onSave,
  onMediaUpload,
  onSectionsUpdate,
}: {
  section: HomepageSection
  mediaLibrary: any[]
  onClose: () => void
  onSave: (data: Partial<HomepageSection>) => void
  onMediaUpload: () => void
  onSectionsUpdate: () => Promise<void>
}) {
  const [section, setSection] = useState(initialSection)
  const { showToast } = useToast()
  const [title, setTitle] = useState(initialSection.title || '')
  const [content, setContent] = useState(initialSection.content || '')
  const [metaTitle, setMetaTitle] = useState(initialSection.metaTitle || '')
  const [metaDescription, setMetaDescription] = useState(initialSection.metaDescription || '')
  const [order, setOrder] = useState(initialSection.order)
  const [isSaving, setIsSaving] = useState(false)

  // Update local state when section prop changes
  useEffect(() => {
    setSection(initialSection)
    setTitle(initialSection.title || '')
    setContent(initialSection.content || '')
    setMetaTitle(initialSection.metaTitle || '')
    setMetaDescription(initialSection.metaDescription || '')
    setOrder(initialSection.order)
  }, [initialSection])

  const handleSave = () => {
    setIsSaving(true)
    onSave({
      title,
      content,
      metaTitle,
      metaDescription,
      order,
    })
    setIsSaving(false)
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Edit Section: ${section.key}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
            placeholder="Section title"
          />
        </div>

        {/* Content (Rich Text Editor) */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Content</label>
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Enter your content here. Use the toolbar to format text, add links, and create lists."
          />
          <p className="text-xs text-text-secondary mt-2">
            Use the toolbar above to format your text, add links, and create lists. HTML is generated automatically in the background.
          </p>
        </div>

        {/* SEO */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Meta Title</label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Order</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Meta Description</label>
          <textarea
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
          />
        </div>

        {/* Section Images */}
        <SectionImagesManager
          sectionId={section.id}
          images={section.images}
          mediaLibrary={mediaLibrary}
          onUpdate={async () => {
            await onMediaUpload()
            // Refresh the section data
            const response = await fetch('/api/admin/content/sections')
            if (response.ok) {
              const data = await response.json()
              const updatedSection = data.sections?.find((s: HomepageSection) => s.id === section.id)
              if (updatedSection) {
                setSection(updatedSection)
              }
            }
            await onSectionsUpdate()
          }}
        />

        {/* Section Buttons */}
        <SectionButtonsManager
          sectionId={section.id}
          buttons={section.buttons}
        />

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t border-bg-tertiary">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function SectionImagesManager({
  sectionId,
  images,
  mediaLibrary,
  onUpdate,
}: {
  sectionId: string
  images: HomepageSection['images']
  mediaLibrary: any[]
  onUpdate: () => void
}) {
  const { showToast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [imagePosition, setImagePosition] = useState<string>('left')

  const handleImageUpload = async (file: File) => {
    setIsUploading(true)
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showToast({
          type: 'error',
          title: 'Invalid File',
          description: 'Please select an image file',
        })
        setIsUploading(false)
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showToast({
          type: 'error',
          title: 'File Too Large',
          description: 'Image must be less than 10MB',
        })
        setIsUploading(false)
        return
      }

      const formData = new FormData()
      formData.append('image', file)
      formData.append('sectionId', sectionId)
      formData.append('imagePosition', imagePosition)

      const response = await fetch('/api/admin/content/images', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      showToast({
        type: 'success',
        title: 'Image Uploaded',
        description: 'Image added to section successfully',
      })
      onUpdate()
    } catch (error: any) {
      console.error('Image upload error:', error)
      showToast({
        type: 'error',
        title: 'Upload Failed',
        description: error.message || 'Failed to upload image. Please try again.',
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-white mb-2">Section Images</label>
      <div className="space-y-4">
        {images.map((image) => (
          <ImageItemComponent
            key={image.id}
            image={image}
            onUpdate={onUpdate}
          />
        ))}
        <div className="border-2 border-dashed border-bg-tertiary rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 justify-center">
            <label className="text-sm text-text-secondary">Image Position:</label>
            <select
              value={imagePosition}
              onChange={(e) => setImagePosition(e.target.value)}
              className="px-3 py-1.5 bg-bg-secondary border border-bg-tertiary rounded text-white text-sm"
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
          <div className="text-center">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleImageUpload(file)
                }
                // Reset input so same file can be selected again
                e.target.value = ''
              }}
              className="hidden"
              id={`image-upload-${sectionId}`}
              disabled={isUploading}
            />
            <label
              htmlFor={`image-upload-${sectionId}`}
              className={`cursor-pointer text-electric-blue hover:text-[#00B8E6] transition-colors ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isUploading ? 'Uploading...' : '+ Add Image'}
            </label>
            {isUploading && (
              <div className="mt-2">
                <div className="inline-block w-4 h-4 border-2 border-electric-blue border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionButtonsManager({
  sectionId,
  buttons,
}: {
  sectionId: string
  buttons: HomepageSection['buttons']
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white mb-2">Section Buttons</label>
      <div className="space-y-2">
        {buttons.map((button) => (
          <div key={button.id} className="flex items-center gap-4 p-4 bg-bg-tertiary rounded-lg">
            <input
              type="text"
              defaultValue={button.text}
              placeholder="Button text"
              className="flex-1 px-3 py-2 bg-bg-secondary border border-bg-tertiary rounded text-white text-sm"
            />
            <input
              type="text"
              defaultValue={button.url || ''}
              placeholder="URL"
              className="flex-1 px-3 py-2 bg-bg-secondary border border-bg-tertiary rounded text-white text-sm"
            />
            <select
              defaultValue={button.variant}
              className="px-3 py-2 bg-bg-secondary border border-bg-tertiary rounded text-white text-sm"
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}

function ImageItemComponent({
  image,
  onUpdate,
}: {
  image: HomepageSection['images'][0]
  onUpdate: () => void
}) {
  const { showToast } = useToast()
  const [altText, setAltText] = useState(image.alt || '')
  const [caption, setCaption] = useState(image.caption || '')
  const [position, setPosition] = useState(image.imagePosition || 'left')
  const [isSaving, setIsSaving] = useState(false)

  // Update local state when image prop changes (e.g., after save/refresh)
  useEffect(() => {
    setAltText(image.alt || '')
    setCaption(image.caption || '')
    setPosition(image.imagePosition || 'left')
  }, [image.alt, image.caption, image.imagePosition])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/content/images/${image.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alt: altText,
          caption,
          imagePosition: position,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update image')
      }

      showToast({
        type: 'success',
        title: 'Image Updated',
        description: 'Image details saved successfully',
      })
      onUpdate()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Update Failed',
        description: error.message || 'Failed to update image',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/content/images/${image.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Delete failed' }))
        throw new Error(error.error || 'Failed to delete image')
      }

      showToast({
        type: 'success',
        title: 'Image Deleted',
        description: 'Image removed from section successfully',
      })
      onUpdate()
    } catch (error: any) {
      console.error('Delete image error:', error)
      showToast({
        type: 'error',
        title: 'Delete Failed',
        description: error.message || 'Failed to delete image. Please try again.',
      })
    }
  }

  return (
    <div className="flex items-start gap-4 p-4 bg-bg-tertiary rounded-lg">
      <div className="relative w-24 h-24 rounded overflow-hidden flex-shrink-0">
        <Image src={image.url} alt={image.alt || ''} fill className="object-cover" />
      </div>
      <div className="flex-1 space-y-2">
        <input
          type="text"
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          placeholder="Alt text"
          className="w-full px-3 py-2 bg-bg-secondary border border-bg-tertiary rounded text-white text-sm"
        />
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption"
          className="w-full px-3 py-2 bg-bg-secondary border border-bg-tertiary rounded text-white text-sm"
        />
        <div className="flex items-center gap-2">
          <label className="text-sm text-text-secondary">Position:</label>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="px-3 py-1.5 bg-bg-secondary border border-bg-tertiary rounded text-white text-sm"
          >
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            className="text-sm px-3 py-1.5 ml-auto"
          >
            Save
          </Button>
        </div>
      </div>
      <Button
        variant="secondary"
        onClick={handleDelete}
        className="text-sm px-3 py-1.5"
      >
        Delete
      </Button>
    </div>
  )
}

function AddSectionModal({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: () => void
}) {
  const { showToast } = useToast()
  const [key, setKey] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [order, setOrder] = useState<number | ''>('')
  const [isVisible, setIsVisible] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!key.trim()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        description: 'Section key is required',
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/content/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: key.trim().toLowerCase().replace(/\s+/g, '-'),
          title: title || null,
          content: content || null,
          order: order !== '' ? Number(order) : undefined,
          isVisible,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to create section' }))
        throw new Error(error.error || 'Failed to create section')
      }

      showToast({
        type: 'success',
        title: 'Section Created',
        description: 'New section added successfully',
      })
      onSave()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Creation Failed',
        description: error.message || 'Failed to create section',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Add New Section" size="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Section Key <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="e.g., new-feature, about-us"
            className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
          />
          <p className="text-xs text-text-secondary mt-1">
            Unique identifier (lowercase, hyphens only). This cannot be changed later.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Section title"
            className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">Content</label>
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Enter section content here..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Order</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value === '' ? '' : parseInt(e.target.value) || '')}
              placeholder="Auto"
              className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
            />
            <p className="text-xs text-text-secondary mt-1">Leave empty for auto-assignment</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-2">Visibility</label>
            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={(e) => setIsVisible(e.target.checked)}
                  className="w-4 h-4 rounded bg-bg-tertiary border-bg-tertiary text-electric-blue focus:ring-electric-blue"
                />
                <span className="text-sm text-white">Visible</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-bg-tertiary">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            Create Section
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function MediaLibraryModal({
  media,
  onClose,
  onUpload,
}: {
  media: any[]
  onClose: () => void
  onUpload: () => void
}) {
  const { showToast } = useToast()
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = async (file: File) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/content/media', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Image Uploaded',
          description: 'Image added to media library',
        })
        onUpload()
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Upload Failed',
        description: 'Failed to upload image',
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Media Library" size="lg">
      <div className="space-y-4">
        <div className="border-2 border-dashed border-bg-tertiary rounded-lg p-8 text-center">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleUpload(file)
            }}
            className="hidden"
            id="media-upload"
          />
          <label
            htmlFor="media-upload"
            className="cursor-pointer text-electric-blue hover:text-[#00B8E6]"
          >
            {isUploading ? 'Uploading...' : '+ Upload Image'}
          </label>
        </div>

        <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {media.map((item) => (
            <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden">
              <Image src={item.url} alt={item.alt || ''} fill className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

