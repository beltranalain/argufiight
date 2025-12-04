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
    linkUrl: string | null
    order: number
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
  const [mediaLibrary, setMediaLibrary] = useState<any[]>([])

  useEffect(() => {
    fetchSections()
    fetchMediaLibrary()
  }, [])

  const fetchSections = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/content/sections')
      if (response.ok) {
        const data = await response.json()
        // Ensure sections is always an array
        const sections = Array.isArray(data.sections) 
          ? data.sections 
          : (Array.isArray(data) ? data : [])
        setSections(sections)
      } else {
        setSections([])
      }
    } catch (error) {
      console.error('Failed to fetch sections:', error)
      setSections([])
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Save failed' }))
        throw new Error(errorData.error || 'Save failed')
      }

      const result = await response.json()
      showToast({
        type: 'success',
        title: 'Section Saved',
        description: 'Homepage section updated successfully',
      })
      await fetchSections() // Refresh sections
      // Update selected section with fresh data
      if (result.section) {
        setSelectedSection(result.section)
      } else {
        // Fallback: fetch updated section
        const updatedSections = await fetch('/api/admin/content/sections').then(r => r.json())
        const updatedSection = updatedSections.sections?.find((s: HomepageSection) => s.id === selectedSection.id)
        if (updatedSection) {
          setSelectedSection(updatedSection)
        }
      }
    } catch (error: any) {
      console.error('Save error:', error)
      showToast({
        type: 'error',
        title: 'Save Failed',
        description: error.message || 'Failed to save section. Please try again.',
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

  const sortedSections = Array.isArray(sections) 
    ? [...sections].sort((a, b) => a.order - b.order)
    : []

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
          {(sortedSections || []).map((section) => (
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
  // Ensure section always has images and buttons arrays
  const safeSection = {
    ...initialSection,
    images: initialSection.images || [],
    buttons: initialSection.buttons || [],
  }
  const [section, setSection] = useState(safeSection)
  const { showToast } = useToast()
  const [title, setTitle] = useState(initialSection.title || '')
  const [content, setContent] = useState(initialSection.content || '')
  const [metaTitle, setMetaTitle] = useState(initialSection.metaTitle || '')
  const [metaDescription, setMetaDescription] = useState(initialSection.metaDescription || '')
  const [order, setOrder] = useState(initialSection.order)
  const [isSaving, setIsSaving] = useState(false)

  // Update local state when section prop changes
  useEffect(() => {
    const safe = {
      ...initialSection,
      images: initialSection.images || [],
      buttons: initialSection.buttons || [],
    }
    setSection(safe)
    setTitle(initialSection.title || '')
    setContent(initialSection.content || '')
    setMetaTitle(initialSection.metaTitle || '')
    setMetaDescription(initialSection.metaDescription || '')
    setOrder(initialSection.order)
  }, [initialSection])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({
        title,
        content,
        metaTitle,
        metaDescription,
        order,
      })
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
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
          images={section.images || []}
          mediaLibrary={mediaLibrary}
          onUpdate={async () => {
            await onMediaUpload()
            // Refresh the section data
            try {
              const response = await fetch('/api/admin/content/sections')
              if (response.ok) {
                const data = await response.json()
                const sections = Array.isArray(data.sections) ? data.sections : []
                const updatedSection = sections.find((s: HomepageSection) => s.id === section.id)
                if (updatedSection) {
                  setSection({
                    ...updatedSection,
                    images: updatedSection.images || [],
                    buttons: updatedSection.buttons || [],
                  })
                }
              }
            } catch (error) {
              console.error('Failed to refresh section:', error)
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
  onUpdate: () => Promise<void>
}) {
  const { showToast } = useToast()
  const [isUploading, setIsUploading] = useState(false)

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
      await onUpdate()
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
        {(images || []).map((image) => (
          <div key={image.id} className="flex items-center gap-4 p-4 bg-bg-tertiary rounded-lg">
            <div className="relative w-24 h-24 rounded overflow-hidden">
              {image.url.startsWith('data:') ? (
                <img
                  src={image.url}
                  alt={image.alt || ''}
                  className="w-full h-full object-cover"
                />
              ) : image.url.includes('blob.vercel-storage.com') ? (
                <img
                  src={image.url}
                  alt={image.alt || ''}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image src={image.url} alt={image.alt || ''} fill className="object-cover" unoptimized={image.url.includes('blob.vercel-storage.com')} />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input
                type="text"
                defaultValue={image.alt || ''}
                placeholder="Alt text"
                onBlur={(e) => {
                  fetch(`/api/admin/content/images/${image.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ alt: e.target.value }),
                  }).catch(console.error)
                }}
                className="w-full px-3 py-2 bg-bg-secondary border border-bg-tertiary rounded text-white text-sm"
              />
              <input
                type="text"
                defaultValue={image.caption || ''}
                placeholder="Caption"
                onBlur={(e) => {
                  fetch(`/api/admin/content/images/${image.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ caption: e.target.value }),
                  }).catch(console.error)
                }}
                className="w-full px-3 py-2 bg-bg-secondary border border-bg-tertiary rounded text-white text-sm"
              />
              <input
                type="url"
                defaultValue={(image as any).linkUrl || ''}
                placeholder="Link URL (e.g., https://apps.apple.com/...)"
                onBlur={(e) => {
                  fetch(`/api/admin/content/images/${image.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ linkUrl: e.target.value || null }),
                  }).catch(console.error)
                }}
                className="w-full px-3 py-2 bg-bg-secondary border border-bg-tertiary rounded text-white text-sm"
              />
            </div>
            <Button
              variant="secondary"
              onClick={async () => {
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
              }}
              className="text-sm px-3 py-1.5"
            >
              Delete
            </Button>
          </div>
        ))}
        <div className="border-2 border-dashed border-bg-tertiary rounded-lg p-4 text-center">
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
  )
}

function SectionButtonsManager({
  sectionId,
  buttons,
}: {
  sectionId: string
  buttons: HomepageSection['buttons']
}) {
  const { showToast } = useToast()
  const [localButtons, setLocalButtons] = useState(buttons)

  useEffect(() => {
    setLocalButtons(buttons)
  }, [buttons])

  const handleButtonChange = async (buttonId: string, field: string, value: string | boolean) => {
    try {
      const response = await fetch(`/api/admin/content/buttons/${buttonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })

      if (response.ok) {
        const updatedButton = await response.json()
        setLocalButtons(localButtons.map(btn => btn.id === buttonId ? updatedButton.button : btn))
        showToast({
          type: 'success',
          title: 'Button Updated',
          description: 'Button saved successfully',
        })
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Update Failed',
        description: 'Failed to update button',
      })
    }
  }

  const handleCreateButton = async () => {
    try {
      const response = await fetch('/api/admin/content/buttons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId,
          text: 'New Button',
          url: '#',
          variant: 'primary',
          order: localButtons.length,
          isVisible: true,
        }),
      })

      if (response.ok) {
        const newButton = await response.json()
        setLocalButtons([...localButtons, newButton.button])
        showToast({
          type: 'success',
          title: 'Button Created',
          description: 'New button added successfully',
        })
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Create Failed',
        description: 'Failed to create button',
      })
    }
  }

  const handleDeleteButton = async (buttonId: string) => {
    try {
      const response = await fetch(`/api/admin/content/buttons/${buttonId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setLocalButtons(localButtons.filter(btn => btn.id !== buttonId))
        showToast({
          type: 'success',
          title: 'Button Deleted',
          description: 'Button removed successfully',
        })
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        description: 'Failed to delete button',
      })
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-white">Section Buttons</label>
        <Button
          variant="secondary"
          onClick={handleCreateButton}
          className="text-xs px-3 py-1.5"
        >
          + Add Button
        </Button>
      </div>
      <div className="space-y-2">
        {localButtons.map((button) => (
          <div key={button.id} className="flex items-center gap-4 p-4 bg-bg-tertiary rounded-lg">
            <input
              type="text"
              defaultValue={button.text}
              placeholder="Button text"
              onBlur={(e) => handleButtonChange(button.id, 'text', e.target.value)}
              className="flex-1 px-3 py-2 bg-bg-secondary border border-bg-tertiary rounded text-white text-sm"
            />
            <input
              type="text"
              defaultValue={button.url || ''}
              placeholder="URL"
              onBlur={(e) => handleButtonChange(button.id, 'url', e.target.value)}
              className="flex-1 px-3 py-2 bg-bg-secondary border border-bg-tertiary rounded text-white text-sm"
            />
            <select
              defaultValue={button.variant}
              onChange={(e) => handleButtonChange(button.id, 'variant', e.target.value)}
              className="px-3 py-2 bg-bg-secondary border border-bg-tertiary rounded text-white text-sm"
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="app-store">App Store</option>
              <option value="google-play">Google Play</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-white">
              <input
                type="checkbox"
                defaultChecked={button.isVisible}
                onChange={(e) => handleButtonChange(button.id, 'isVisible', e.target.checked)}
                className="rounded"
              />
              Visible
            </label>
            <Button
              variant="secondary"
              onClick={() => handleDeleteButton(button.id)}
              className="text-xs px-3 py-1.5 text-red-400 hover:text-red-300"
            >
              Delete
            </Button>
          </div>
        ))}
        {localButtons.length === 0 && (
          <p className="text-text-secondary text-sm text-center py-4">No buttons yet. Click "Add Button" to create one.</p>
        )}
      </div>
    </div>
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
              {item.url.startsWith('data:') ? (
                <img
                  src={item.url}
                  alt={item.alt || ''}
                  className="w-full h-full object-cover"
                />
              ) : item.url.includes('blob.vercel-storage.com') ? (
                <img
                  src={item.url}
                  alt={item.alt || ''}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image src={item.url} alt={item.alt || ''} fill className="object-cover" />
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

