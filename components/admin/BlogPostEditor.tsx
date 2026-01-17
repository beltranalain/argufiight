'use client'

import { useState, useEffect, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { useToast } from '@/components/ui/Toast'
import Image from 'next/image'

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  metaTitle: string | null
  metaDescription: string | null
  keywords: string | null
  ogImage: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED'
  publishedAt: string | null
  featuredImageId: string | null
  featuredImage: {
    id: string
    url: string
    alt: string | null
  } | null
  categoryIds: string[]
  tagIds: string[]
  featured: boolean
}

interface Category {
  id: string
  name: string
  slug: string
}

interface Tag {
  id: string
  name: string
  slug: string
}

interface MediaItem {
  id: string
  url: string
  alt: string | null
  filename: string
}

export function BlogPostEditor({
  post,
  onClose,
  onSave,
}: {
  post: BlogPost | null
  onClose: () => void
  onSave: () => void
}) {
  const [showImageSelector, setShowImageSelector] = useState(false)
  const { showToast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const editorRef = useRef<any>(null)

  // Form fields
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [keywords, setKeywords] = useState('')
  const [ogImage, setOgImage] = useState('')
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED'>('DRAFT')
  const [featuredImageId, setFeaturedImageId] = useState<string | null>(null)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [newTagName, setNewTagName] = useState('')
  const [featured, setFeatured] = useState(false)

  // Data
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([])
  const [showMediaLibrary, setShowMediaLibrary] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')

  useEffect(() => {
    if (post) {
      setTitle(post.title)
      setExcerpt(post.excerpt || '')
      setContent(post.content)
      setMetaTitle(post.metaTitle || '')
      setMetaDescription(post.metaDescription || '')
      setKeywords(post.keywords || '')
      setOgImage(post.ogImage || '')
      setStatus(post.status)
      setFeaturedImageId(post.featuredImageId)
      setSelectedCategoryIds(post.categoryIds || [])
      setSelectedTagIds(post.tagIds || [])
      setFeatured(post.featured)
    }
    fetchCategories()
    fetchTags()
    fetchMediaLibrary()
  }, [post])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/blog/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/admin/blog/tags')
      if (response.ok) {
        const data = await response.json()
        setTags(data.tags || [])
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error)
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

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Category name is required',
      })
      return
    }

    try {
      const response = await fetch('/api/admin/blog/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName,
          description: newCategoryDescription,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCategories([...categories, data.category])
        setSelectedCategoryIds([...selectedCategoryIds, data.category.id])
        setNewCategoryName('')
        setNewCategoryDescription('')
        setShowCategoryModal(false)
        showToast({
          type: 'success',
          title: 'Category Created',
          description: 'Category created successfully',
        })
      } else {
        throw new Error('Failed to create category')
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to create category',
      })
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Tag name is required',
      })
      return
    }

    try {
      const response = await fetch('/api/admin/blog/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName }),
      })

      if (response.ok) {
        const data = await response.json()
        const tagExists = tags.find(t => t.id === data.tag.id)
        if (!tagExists) {
          setTags([...tags, data.tag])
        }
        if (!selectedTagIds.includes(data.tag.id)) {
          setSelectedTagIds([...selectedTagIds, data.tag.id])
        }
        setNewTagName('')
        showToast({
          type: 'success',
          title: 'Tag Created',
          description: 'Tag created successfully',
        })
      } else {
        throw new Error('Failed to create tag')
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to create tag',
      })
    }
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        description: 'Title and content are required',
      })
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        title,
        excerpt,
        content,
        metaTitle: metaTitle || title,
        metaDescription,
        keywords,
        ogImage,
        status,
        // Automatically set publishedAt to now when status is PUBLISHED
        publishedAt: status === 'PUBLISHED' ? new Date().toISOString() : null,
        featuredImageId,
        categoryIds: selectedCategoryIds,
        tagIds: selectedTagIds,
        featured,
      }

      const url = post ? `/api/admin/blog/${post.id}` : '/api/admin/blog'
      const method = post ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: post ? 'Updated' : 'Created',
          description: `Blog post ${post ? 'updated' : 'created'} successfully`,
        })
        onSave()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save')
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        description: error.message || 'Failed to save blog post',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const selectedFeaturedImage = mediaLibrary.find(m => m.id === featuredImageId)

  const handleImageSelect = () => {
    setShowImageSelector(true)
  }

  const handleImageInsert = (imageUrl: string, alt: string) => {
    if (editorRef.current) {
      editorRef.current.chain().focus().setImage({ src: imageUrl, alt }).run()
    }
    setShowImageSelector(false)
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={post ? 'Edit Blog Post' : 'Create New Blog Post'}
      size="xl"
    >
      <div className="space-y-6 max-h-[80vh] overflow-y-auto p-1">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
            placeholder="Blog post title"
          />
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Excerpt</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
            placeholder="Short description for listings (optional)"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Content <span className="text-red-400">*</span>
          </label>
          <div className="bg-bg-tertiary rounded-lg p-4">
              <RichTextEditor
                ref={editorRef}
                value={content}
                onChange={setContent}
                onImageSelect={handleImageSelect}
                placeholder="Write your blog post content..."
              />
          </div>
        </div>

        {/* Featured Image */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Featured Image</label>
          <div className="flex gap-4">
            {selectedFeaturedImage && (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-bg-tertiary">
                {selectedFeaturedImage.url.startsWith('data:') || selectedFeaturedImage.url.includes('blob.vercel-storage.com') ? (
                  <img
                    src={selectedFeaturedImage.url}
                    alt={selectedFeaturedImage.alt || ''}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={selectedFeaturedImage.url}
                    alt={selectedFeaturedImage.alt || ''}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
            )}
            <div className="flex-1">
              <Button
                variant="secondary"
                onClick={() => setShowMediaLibrary(true)}
              >
                {selectedFeaturedImage ? 'Change Image' : 'Select Featured Image'}
              </Button>
              {selectedFeaturedImage && (
                <Button
                  variant="secondary"
                  onClick={() => setFeaturedImageId(null)}
                  className="ml-2"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Categories */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-white">Categories</label>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowCategoryModal(true)}
            >
              + New Category
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-bg-tertiary rounded-lg cursor-pointer hover:bg-bg-tertiary/80"
              >
                <input
                  type="checkbox"
                  checked={selectedCategoryIds.includes(category.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCategoryIds([...selectedCategoryIds, category.id])
                    } else {
                      setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== category.id))
                    }
                  }}
                  className="w-4 h-4 text-electric-blue"
                />
                <span className="text-white text-sm">{category.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Tags</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleCreateTag()
                }
              }}
              placeholder="Type tag name and press Enter"
              className="flex-1 px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
            />
            <Button variant="secondary" onClick={handleCreateTag}>
              Add Tag
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <label
                key={tag.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-bg-tertiary rounded-lg cursor-pointer hover:bg-bg-tertiary/80"
              >
                <input
                  type="checkbox"
                  checked={selectedTagIds.includes(tag.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTagIds([...selectedTagIds, tag.id])
                    } else {
                      setSelectedTagIds(selectedTagIds.filter(id => id !== tag.id))
                    }
                  }}
                  className="w-4 h-4 text-electric-blue"
                />
                <span className="text-white text-sm">{tag.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* SEO Section */}
        <div className="border-t border-bg-tertiary pt-4">
          <h3 className="text-lg font-semibold text-white mb-4">SEO Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Meta Title
                <span className="text-text-secondary text-xs ml-2">
                  ({metaTitle.length || title.length}/60)
                </span>
              </label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                maxLength={60}
                className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
                placeholder={title || 'SEO title (defaults to post title)'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Meta Description
                <span className="text-text-secondary text-xs ml-2">
                  ({metaDescription.length}/160)
                </span>
              </label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                maxLength={160}
                rows={3}
                className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
                placeholder="SEO description (recommended: 150-160 characters)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Keywords</label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
                placeholder="Comma-separated keywords"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">OG Image URL</label>
              <input
                type="text"
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
                className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
                placeholder="Open Graph image URL (optional)"
              />
            </div>
          </div>
        </div>

        {/* Publishing Settings */}
        <div className="border-t border-bg-tertiary pt-4">
          <h3 className="text-lg font-semibold text-white mb-4">Publishing Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>


            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 text-electric-blue"
                />
                <span className="text-white text-sm">Feature this post</span>
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t border-bg-tertiary">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : post ? 'Update Post' : 'Create Post'}
          </Button>
        </div>
      </div>

      {/* Media Library Modal */}
      {showMediaLibrary && (
        <MediaLibrarySelector
          media={mediaLibrary}
          selectedId={featuredImageId}
          onSelect={(id) => {
            setFeaturedImageId(id)
            setShowMediaLibrary(false)
          }}
          onClose={() => setShowMediaLibrary(false)}
          onUpload={fetchMediaLibrary}
        />
      )}

      {/* Category Creation Modal */}
      {showCategoryModal && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowCategoryModal(false)
            setNewCategoryName('')
            setNewCategoryDescription('')
          }}
          title="Create New Category"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Category Name</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Description</label>
              <textarea
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
              />
            </div>
            <div className="flex justify-end gap-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCategoryModal(false)
                  setNewCategoryName('')
                  setNewCategoryDescription('')
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateCategory}>Create</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Image Selector Modal */}
      {showImageSelector && (
        <Modal isOpen={true} onClose={() => setShowImageSelector(false)} title="Insert Image" size="lg">
          <div className="space-y-4">
            <div className="border-2 border-dashed border-bg-tertiary rounded-lg p-8 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    // Upload the file and insert it
                    const formData = new FormData()
                    formData.append('file', file)

                    fetch('/api/admin/content/media', {
                      method: 'POST',
                      body: formData,
                    })
                    .then(response => response.json())
                    .then(data => {
                      if (data.media) {
                        handleImageInsert(data.media.url, data.media.alt || '')
                        fetchMediaLibrary() // Refresh media library
                      }
                    })
                    .catch(error => {
                      console.error('Upload failed:', error)
                      showToast({
                        type: 'error',
                        title: 'Upload Failed',
                        description: 'Failed to upload image',
                      })
                    })
                  }
                  e.target.value = '' // Reset input
                }}
                className="hidden"
                id="content-image-upload"
              />
              <label
                htmlFor="content-image-upload"
                className="cursor-pointer text-electric-blue hover:text-[#00B8E6]"
              >
                + Upload New Image
              </label>
            </div>

            <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {mediaLibrary.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleImageInsert(item.url, item.alt || '')}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-bg-tertiary hover:border-electric-blue cursor-pointer transition-all"
                >
                  {item.url.startsWith('data:') || item.url.includes('blob.vercel-storage.com') ? (
                    <img
                      src={item.url}
                      alt={item.alt || ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={item.url}
                      alt={item.alt || ''}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  )
}

function MediaLibrarySelector({
  media,
  selectedId,
  onSelect,
  onClose,
  onUpload,
}: {
  media: MediaItem[]
  selectedId: string | null
  onSelect: (id: string) => void
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
    <Modal isOpen={true} onClose={onClose} title="Select Featured Image" size="lg">
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
            <div
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                selectedId === item.id
                  ? 'border-electric-blue ring-2 ring-electric-blue'
                  : 'border-bg-tertiary hover:border-electric-blue/50'
              }`}
            >
              {item.url.startsWith('data:') || item.url.includes('blob.vercel-storage.com') ? (
                <img
                  src={item.url}
                  alt={item.alt || ''}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={item.url}
                  alt={item.alt || ''}
                  fill
                  className="object-cover"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}

