'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { SeoScoreWidget } from '@/components/admin/SeoScoreWidget'
import { useToast } from '@/components/ui/Toast'
import { generateSlug } from '@/lib/utils/slug'
import { calculateSeoScore } from '@/lib/utils/seo-score'
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
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content')
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

  // Derived SEO score
  const slug = useMemo(() => generateSlug(title), [title])
  const seoAnalysis = useMemo(() => calculateSeoScore({
    title, content, excerpt, metaTitle, metaDescription, keywords, slug,
  }), [title, content, excerpt, metaTitle, metaDescription, keywords, slug])

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

  const handleGenerateWithAI = async () => {
    if (!title.trim()) {
      showToast({ type: 'error', title: 'Title Required', description: 'Enter a title before generating with AI.' })
      return
    }

    // Confirm if content already exists
    if (content.trim() && !window.confirm('This will replace your current content. Continue?')) {
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/admin/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Generation failed')
      }

      const data = await response.json()
      const gen = data.generated

      setContent(gen.content || '')
      setExcerpt(gen.excerpt || '')
      setMetaDescription(gen.metaDescription || '')
      setKeywords(gen.keywords || '')

      // Auto-select matching tags from suggestions
      if (gen.suggestedTags?.length && tags.length) {
        const matchedIds: string[] = []
        const unmatched: string[] = []

        for (const suggested of gen.suggestedTags) {
          const match = tags.find(t => t.name.toLowerCase() === suggested.toLowerCase())
          if (match) {
            if (!selectedTagIds.includes(match.id)) {
              matchedIds.push(match.id)
            }
          } else {
            unmatched.push(suggested)
          }
        }

        if (matchedIds.length) {
          setSelectedTagIds(prev => [...prev, ...matchedIds])
        }
        if (unmatched.length) {
          showToast({
            type: 'info',
            title: 'Tag Suggestions',
            description: `Consider creating: ${unmatched.join(', ')}`,
          })
        }
      }

      showToast({ type: 'success', title: 'Content Generated', description: 'AI has generated your blog post content.' })
    } catch (error: any) {
      showToast({ type: 'error', title: 'Generation Failed', description: error.message || 'Failed to generate content.' })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      showToast({ type: 'error', title: 'Error', description: 'Category name is required' })
      return
    }

    try {
      const response = await fetch('/api/admin/blog/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName, description: newCategoryDescription }),
      })

      if (response.ok) {
        const data = await response.json()
        setCategories([...categories, data.category])
        setSelectedCategoryIds([...selectedCategoryIds, data.category.id])
        setNewCategoryName('')
        setNewCategoryDescription('')
        setShowCategoryModal(false)
        showToast({ type: 'success', title: 'Category Created', description: 'Category created successfully' })
      } else {
        throw new Error('Failed to create category')
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Error', description: 'Failed to create category' })
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      showToast({ type: 'error', title: 'Error', description: 'Tag name is required' })
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
        showToast({ type: 'success', title: 'Tag Created', description: 'Tag created successfully' })
      } else {
        throw new Error('Failed to create tag')
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Error', description: 'Failed to create tag' })
    }
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      showToast({ type: 'error', title: 'Validation Error', description: 'Title and content are required' })
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
        publishedAt: status === 'PUBLISHED'
          ? (post?.publishedAt || new Date().toISOString())
          : null,
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
      showToast({ type: 'error', title: 'Save Failed', description: error.message || 'Failed to save blog post' })
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

  const inputClass = 'w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue'

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={post ? 'Edit Blog Post' : 'Create New Blog Post'}
      size="2xl"
    >
      <div className="flex flex-col md:flex-row gap-6">
        {/* ===== MAIN CONTENT AREA ===== */}
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex gap-1 mb-5 border-b border-bg-tertiary">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === 'content'
                  ? 'text-electric-blue'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              Content
              {activeTab === 'content' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-electric-blue" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('seo')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === 'seo'
                  ? 'text-electric-blue'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              SEO
              {activeTab === 'seo' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-electric-blue" />
              )}
            </button>
          </div>

          {/* ===== CONTENT TAB ===== */}
          {activeTab === 'content' && (
            <div className="space-y-5">
              {/* Title + Generate with AI */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`${inputClass} flex-1`}
                    placeholder="Blog post title"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleGenerateWithAI}
                    disabled={!title.trim() || isGenerating}
                    isLoading={isGenerating}
                    className="whitespace-nowrap flex-shrink-0"
                  >
                    {isGenerating ? 'Generating...' : 'Generate with AI'}
                  </Button>
                </div>
                {/* Slug preview */}
                {title.trim() && (
                  <p className="text-xs text-text-secondary mt-1.5">
                    Slug: <span className="text-electric-blue font-mono">/blog/{slug}</span>
                  </p>
                )}
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Excerpt</label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={2}
                  className={inputClass}
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
                    <Button variant="secondary" onClick={() => setShowMediaLibrary(true)}>
                      {selectedFeaturedImage ? 'Change Image' : 'Select Featured Image'}
                    </Button>
                    {selectedFeaturedImage && (
                      <Button variant="secondary" onClick={() => setFeaturedImageId(null)} className="ml-2">
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== SEO TAB ===== */}
          {activeTab === 'seo' && (
            <div className="space-y-5">
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
                  className={inputClass}
                  placeholder={title || 'SEO title (defaults to post title)'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Meta Description
                  <span className={`text-xs ml-2 ${metaDescription.length > 160 ? 'text-red-400' : 'text-text-secondary'}`}>
                    ({metaDescription.length}/160)
                  </span>
                </label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  maxLength={160}
                  rows={3}
                  className={inputClass}
                  placeholder="SEO description (recommended: 120-160 characters)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Keywords</label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className={inputClass}
                  placeholder="Comma-separated keywords"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">OG Image URL</label>
                <input
                  type="text"
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                  className={inputClass}
                  placeholder="Open Graph image URL (optional)"
                />
              </div>
            </div>
          )}
        </div>

        {/* ===== SIDEBAR ===== */}
        <div className="w-full md:w-[280px] flex-shrink-0 space-y-5">
          {/* SEO Score */}
          <div className="bg-bg-tertiary/50 rounded-xl p-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">SEO Score</p>
            <SeoScoreWidget analysis={seoAnalysis} />
          </div>

          {/* Post Settings */}
          <div className="bg-bg-tertiary/50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Post Settings</p>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 text-electric-blue"
              />
              <span className="text-white text-sm">Featured</span>
            </label>
          </div>

          {/* Categories */}
          <div className="bg-bg-tertiary/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Categories</p>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="text-xs text-electric-blue hover:text-[#00B8E6]"
              >
                + New
              </button>
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center gap-2 cursor-pointer"
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
                    className="w-3.5 h-3.5 text-electric-blue"
                  />
                  <span className="text-white text-sm">{category.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-bg-tertiary/50 rounded-xl p-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Tags</p>
            <div className="flex gap-1.5 mb-2">
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
                placeholder="Type + Enter"
                className="flex-1 min-w-0 px-2.5 py-1.5 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-electric-blue"
              />
              <button
                onClick={handleCreateTag}
                className="text-xs text-electric-blue hover:text-[#00B8E6] px-2 flex-shrink-0"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {tags.map((tag) => (
                <label
                  key={tag.id}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs cursor-pointer transition-colors ${
                    selectedTagIds.includes(tag.id)
                      ? 'bg-electric-blue/20 text-electric-blue border border-electric-blue/30'
                      : 'bg-bg-tertiary text-text-secondary hover:text-white border border-transparent'
                  }`}
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
                    className="hidden"
                  />
                  {tag.name}
                  {selectedTagIds.includes(tag.id) && (
                    <span className="text-electric-blue/60 hover:text-electric-blue">×</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t border-bg-tertiary mt-5">
        <Button variant="secondary" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : post ? 'Update Post' : 'Create Post'}
        </Button>
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
        <ContentImageSelector
          mediaLibrary={mediaLibrary}
          onInsert={handleImageInsert}
          onClose={() => setShowImageSelector(false)}
          onMediaRefresh={fetchMediaLibrary}
        />
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    if (isUploading) return // Prevent double uploads
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
      } else {
        const errorData = await response.json().catch(() => ({}))
        showToast({
          type: 'error',
          title: 'Upload Failed',
          description: errorData.error || `Upload failed (${response.status})`,
        })
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Upload Failed',
        description: 'Network error uploading image',
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Select Featured Image" size="lg">
      <div className="space-y-4">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isUploading
              ? 'border-electric-blue/50 bg-electric-blue/5'
              : 'border-bg-tertiary hover:border-electric-blue/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            disabled={isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleUpload(file)
            }}
            className="hidden"
            id="media-upload"
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <LoadingSpinner size="md" />
              <span className="text-electric-blue text-sm font-medium">
                Uploading image...
              </span>
            </div>
          ) : (
            <label
              htmlFor="media-upload"
              className="cursor-pointer text-electric-blue hover:text-[#00B8E6] font-medium"
            >
              + Upload Image
            </label>
          )}
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

function ContentImageSelector({
  mediaLibrary,
  onInsert,
  onClose,
  onMediaRefresh,
}: {
  mediaLibrary: MediaItem[]
  onInsert: (url: string, alt: string) => void
  onClose: () => void
  onMediaRefresh: () => void
}) {
  const { showToast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    if (isUploading) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/content/media', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        if (data.media) {
          onInsert(data.media.url, data.media.alt || '')
          onMediaRefresh()
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        showToast({
          type: 'error',
          title: 'Upload Failed',
          description: errorData.error || `Upload failed (${response.status})`,
        })
      }
    } catch (error) {
      console.error('Upload failed:', error)
      showToast({
        type: 'error',
        title: 'Upload Failed',
        description: 'Failed to upload image',
      })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Insert Image" size="lg">
      <div className="space-y-4">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isUploading
              ? 'border-electric-blue/50 bg-electric-blue/5'
              : 'border-bg-tertiary hover:border-electric-blue/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            disabled={isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleUpload(file)
            }}
            className="hidden"
            id="content-image-upload"
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <LoadingSpinner size="md" />
              <span className="text-electric-blue text-sm font-medium">
                Uploading image...
              </span>
            </div>
          ) : (
            <label
              htmlFor="content-image-upload"
              className="cursor-pointer text-electric-blue hover:text-[#00B8E6] font-medium"
            >
              + Upload New Image
            </label>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {mediaLibrary.map((item) => (
            <div
              key={item.id}
              onClick={() => onInsert(item.url, item.alt || '')}
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
  )
}
