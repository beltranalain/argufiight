'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
// AdminLayout is provided by app/admin/layout.tsx
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import Image from 'next/image'
import { SocialMediaLinksManager } from './social-media-manager'
import BlogManagementTab from './BlogManagementTab'
import SEOManagementTab from './SEOManagementTab'
import LegalPagesTab from './LegalPagesTab'

interface HomepageSection {
  id: string
  key: string
  title: string | null
  content: string | null
  order: number
  isVisible: boolean
  metaTitle: string | null
  metaDescription: string | null
  contactEmail: string | null
  images: Array<{
    id: string
    url: string
    alt: string | null
    caption: string | null
    linkUrl: string | null
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

interface SocialMediaLink {
  id: string
  platform: string
  url: string
  order: number
  isActive: boolean
}

export default function ContentManagerPage() {
  const { showToast } = useToast()
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get('tab') as 'homepage' | 'blog' | 'seo' | 'legal' | null
  const [activeTab, setActiveTab] = useState<'homepage' | 'blog' | 'seo' | 'legal'>(
    tabFromUrl || 'homepage'
  )
  const [sections, setSections] = useState<HomepageSection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSection, setSelectedSection] = useState<HomepageSection | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false)
  const [mediaLibrary, setMediaLibrary] = useState<any[]>([])
  const [socialLinks, setSocialLinks] = useState<SocialMediaLink[]>([])
  const [isLoadingSocial, setIsLoadingSocial] = useState(true)

  useEffect(() => {
    if (tabFromUrl && ['homepage', 'blog', 'seo', 'legal'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  useEffect(() => {
    fetchSections()
    fetchMediaLibrary()
    fetchSocialLinks()
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

  const fetchSocialLinks = async () => {
    try {
      setIsLoadingSocial(true)
      const response = await fetch('/api/admin/content/social-media')
      if (response.ok) {
        const data = await response.json()
        setSocialLinks(data.links || [])
      }
    } catch (error) {
      console.error('Failed to fetch social media links:', error)
    } finally {
      setIsLoadingSocial(false)
    }
  }

  const handleSaveSocialLink = async (platform: string, url: string, order: number) => {
    try {
      const response = await fetch('/api/admin/content/social-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, url, order, isActive: true }),
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Social Link Saved',
          description: `${platform} link updated successfully`,
        })
        fetchSocialLinks()
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        description: 'Failed to save social media link',
      })
    }
  }

  const handleDeleteSocialLink = async (platform: string) => {
    try {
      const response = await fetch(`/api/admin/content/social-media?platform=${platform}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Link Deleted',
          description: `${platform} link removed`,
        })
        fetchSocialLinks()
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        description: 'Failed to delete social media link',
      })
    }
  }

  const handleToggleVisibility = async (sectionId: string, currentVisibility: boolean) => {
    const newVisibility = !currentVisibility
    console.log('[Content Manager] Toggling visibility:', {
      sectionId,
      currentVisibility,
      newVisibility,
    })

    try {
      const response = await fetch(`/api/admin/content/sections/${sectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: newVisibility }),
      })

      console.log('[Content Manager] Toggle response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Update failed' }))
        throw new Error(errorData.error || 'Update failed')
      }

      const result = await response.json()
      console.log('[Content Manager] Toggle response data:', result)

      // Update the section in local state immediately
      setSections(prevSections =>
        prevSections.map(s =>
          s.id === sectionId
            ? { ...s, isVisible: newVisibility }
            : s
        )
      )

      // Also update selectedSection if it's the one being toggled
      if (selectedSection?.id === sectionId) {
        setSelectedSection(prev => prev ? { ...prev, isVisible: newVisibility } : null)
      }

      showToast({
        type: 'success',
        title: 'Section Updated',
        description: `Section ${newVisibility ? 'shown' : 'hidden'} successfully`,
      })

      // Refresh sections to ensure consistency
      await fetchSections()
    } catch (error: any) {
      console.error('[Content Manager] Toggle visibility error:', error)
      showToast({
        type: 'error',
        title: 'Update Failed',
        description: error.message || 'Failed to update section visibility',
      })
    }
  }

  const handleEditSection = (section: HomepageSection) => {
    setSelectedSection(section)
    setIsEditModalOpen(true)
  }

  const handleSaveSection = async (sectionData: Partial<HomepageSection>) => {
    if (!selectedSection) return

    console.log('[Content Manager] Saving section:', {
      sectionId: selectedSection.id,
      sectionKey: selectedSection.key,
      data: sectionData,
    })

    try {
      const response = await fetch(`/api/admin/content/sections/${selectedSection.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sectionData),
      })

      console.log('[Content Manager] Save response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Save failed' }))
        throw new Error(errorData.error || 'Save failed')
      }

      const result = await response.json()
      
      // Refresh sections list
      await fetchSections()
      
      // Update selected section with fresh data from response (includes images and buttons)
      if (result.section) {
        setSelectedSection({
          ...result.section,
          images: result.section.images || [],
          buttons: result.section.buttons || [],
        })
      } else {
        // Fallback: fetch updated section if not in response
        const updatedSections = await fetch('/api/admin/content/sections').then(r => r.json())
        const updatedSection = (updatedSections.sections || updatedSections || []).find(
          (s: HomepageSection) => s.id === selectedSection.id
        )
        
        if (updatedSection) {
          setSelectedSection({
            ...updatedSection,
            images: updatedSection.images || [],
            buttons: updatedSection.buttons || [],
          })
        }
      }
      
      showToast({
        type: 'success',
        title: 'Section Saved',
        description: 'Homepage section updated successfully',
      })
      // Keep modal open - don't close it
    } catch (error: any) {
      console.error('[Content Manager] Save error:', error)
      console.error('[Content Manager] Error details:', {
        message: error.message,
        stack: error.stack,
        sectionId: selectedSection?.id,
        sectionData: sectionData,
      })
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
            <p className="text-text-secondary">Manage your homepage content, blog posts, SEO settings, and legal pages</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-bg-tertiary">
          {[
            { id: 'homepage', label: 'Homepage' },
            { id: 'blog', label: 'Blog' },
            { id: 'seo', label: 'SEO' },
            { id: 'legal', label: 'Legal' },
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
              {tab.label}
            </button>
          ))}
        </div>

        {/* Homepage Tab */}
        {activeTab === 'homepage' && (
          <div>
            <div className="flex items-center justify-between mb-6">
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
                // Open public homepage in a new tab
                window.open('/home', '_blank')
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
              onToggleVisibility={() => handleToggleVisibility(section.id, section.isVisible !== false)}
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
            onSectionsUpdate={async () => {
              await fetchSections()
              // Also refresh the selected section if it exists
              if (selectedSection) {
                try {
                  const response = await fetch('/api/admin/content/sections')
                  if (response.ok) {
                    const data = await response.json()
                    const sections = Array.isArray(data.sections) ? data.sections : []
                    const updatedSection = sections.find((s: HomepageSection) => s.id === selectedSection.id)
                    if (updatedSection) {
                      setSelectedSection({
                        ...updatedSection,
                        images: updatedSection.images || [],
                        buttons: updatedSection.buttons || [],
                      })
                    }
                  }
                } catch (error) {
                  console.error('Failed to refresh selected section:', error)
                }
              }
            }}
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

        {/* SEO Note */}
        <div className="mt-12 pt-8 border-t border-bg-tertiary">
          <div className="bg-bg-tertiary rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">SEO Management</h3>
            <p className="text-text-secondary text-sm">
              Each section has <strong>Meta Title</strong> and <strong>Meta Description</strong> fields for SEO. 
              The <strong>Hero</strong> section's meta fields are used for the homepage's primary SEO tags. 
              Edit any section and use the Meta Title and Meta Description fields to optimize SEO.
            </p>
          </div>
        </div>

        {/* Static Pages Section */}
        <div className="mt-6 pt-8 border-t border-bg-tertiary">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Static Pages</h2>
              <p className="text-text-secondary">Manage content for how-it-works, pricing, about, and FAQ pages</p>
            </div>
          </div>
          <StaticPagesManager />
        </div>

        {/* Social Media Links Section */}
        <div className="mt-6 pt-8 border-t border-bg-tertiary">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Social Media Links</h2>
              <p className="text-text-secondary">Manage social media links displayed in the footer</p>
            </div>
          </div>

          {isLoadingSocial ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="sm" />
            </div>
          ) : (
            <SocialMediaLinksManager
              links={socialLinks}
              onSave={handleSaveSocialLink}
              onDelete={handleDeleteSocialLink}
            />
          )}
        </div>
          </div>
        )}

        {/* Blog Tab */}
        {activeTab === 'blog' && <BlogManagementTab />}

        {/* SEO Tab */}
        {activeTab === 'seo' && <SEOManagementTab />}

        {/* Legal Tab */}
        {activeTab === 'legal' && <LegalPagesTab />}
    </div>
  )
}

// Static Pages Manager Component
function StaticPagesManager() {
  const { showToast } = useToast()
  const [pages, setPages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingPage, setEditingPage] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    isVisible: true,
  })

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/static-pages')
      if (response.ok) {
        const data = await response.json()
        setPages(data.pages || [])
      }
    } catch (error) {
      console.error('Failed to fetch static pages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (page: any) => {
    setEditingPage(page)
    setFormData({
      title: page.title,
      content: page.content,
      metaTitle: page.metaTitle || '',
      metaDescription: page.metaDescription || '',
      keywords: page.keywords || '',
      isVisible: page.isVisible,
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    try {
      const url = editingPage
        ? `/api/admin/static-pages/${editingPage.id}`
        : '/api/admin/static-pages'
      
      const method = editingPage ? 'PATCH' : 'POST'
      const body = editingPage
        ? formData
        : { ...formData, slug: getSlugFromTitle(formData.title) }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Save failed' }))
        throw new Error(error.error || 'Save failed')
      }

      showToast({
        type: 'success',
        title: 'Page Saved',
        description: `Static page ${editingPage ? 'updated' : 'created'} successfully`,
      })
      
      setIsModalOpen(false)
      setEditingPage(null)
      fetchPages()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        description: error.message || 'Failed to save page',
      })
    }
  }

  const handleToggleVisibility = async (page: any) => {
    try {
      const response = await fetch(`/api/admin/static-pages/${page.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !page.isVisible }),
      })

      if (!response.ok) {
        throw new Error('Failed to toggle visibility')
      }

      showToast({
        type: 'success',
        title: 'Visibility Updated',
        description: `Page is now ${!page.isVisible ? 'visible' : 'hidden'}`,
      })

      fetchPages()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Update Failed',
        description: error.message || 'Failed to update visibility',
      })
    }
  }

  const getSlugFromTitle = (title: string) => {
    return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  const predefinedPages = [
    { slug: 'how-it-works', title: 'How It Works', url: '/how-it-works' },
    { slug: 'pricing', title: 'Pricing', url: '/pricing' },
    { slug: 'about', title: 'About Us', url: '/about' },
    { slug: 'faq', title: 'FAQ', url: '/faq' },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="sm" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {predefinedPages.map((predefined) => {
        const page = pages.find((p) => p.slug === predefined.slug)
        return (
          <div
            key={predefined.slug}
            className="bg-bg-secondary border border-bg-tertiary rounded-xl p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold text-white">{predefined.title}</h3>
                  <span className="px-2 py-1 text-xs rounded bg-bg-tertiary text-text-secondary">
                    {predefined.slug}
                  </span>
                  {page && (
                    page.isVisible ? (
                      <span className="px-2 py-1 text-xs rounded bg-cyber-green/20 text-cyber-green">
                        Visible
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded bg-text-muted/20 text-text-muted">
                        Hidden
                      </span>
                    )
                  )}
                </div>
                {page ? (
                  <p className="text-text-secondary text-sm mb-2">
                    Last updated: {new Date(page.updatedAt).toLocaleDateString()}
                  </p>
                ) : (
                  <p className="text-text-secondary text-sm mb-2">
                    Not yet created. Click "Create" to add content.
                  </p>
                )}
                <a
                  href={predefined.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-electric-blue hover:text-[#00B8E6] text-sm"
                >
                  View page →
                </a>
              </div>
              <div className="flex items-center gap-2">
                {page && (
                  <Button
                    variant="secondary"
                    onClick={() => handleToggleVisibility(page)}
                    className="text-sm"
                  >
                    {page.isVisible ? 'Hide' : 'Show'}
                  </Button>
                )}
                <Button
                  onClick={() => {
                    if (page) {
                      handleEdit(page)
                    } else {
                      setFormData({
                        title: predefined.title,
                        content: '',
                        metaTitle: '',
                        metaDescription: '',
                        keywords: '',
                        isVisible: true,
                      })
                      setEditingPage(null)
                      setIsModalOpen(true)
                    }
                  }}
                >
                  {page ? 'Edit' : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        )
      })}

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => {
            setIsModalOpen(false)
            setEditingPage(null)
          }}
          title={editingPage ? `Edit ${editingPage.title}` : 'Create Static Page'}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white"
                disabled={!!editingPage}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Content</label>
              <RichTextEditor
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                placeholder="Enter page content here..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Meta Title</label>
              <input
                type="text"
                value={formData.metaTitle}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white"
                placeholder="SEO meta title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Meta Description</label>
              <textarea
                value={formData.metaDescription}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white"
                placeholder="SEO meta description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Keywords</label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white"
                placeholder="Comma-separated keywords"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isVisible}
                  onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-white">Visible</span>
              </label>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-bg-tertiary">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingPage(null)
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </Modal>
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
            {section.isVisible !== false ? (
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
            {section.isVisible !== false ? 'Hide' : 'Show'}
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
  const [contactEmail, setContactEmail] = useState(initialSection.contactEmail || '')
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
    setContactEmail(initialSection.contactEmail || '')
    setOrder(initialSection.order)
  }, [initialSection.id, initialSection.images, initialSection.buttons])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const saveData: Partial<HomepageSection> = {
        order,
      }
      
      // Only include fields that have values or are explicitly set
      if (title !== undefined) saveData.title = title || null
      if (content !== undefined) saveData.content = content || null
      if (metaTitle !== undefined) saveData.metaTitle = metaTitle || null
      if (metaDescription !== undefined) saveData.metaDescription = metaDescription || null
      if (section.key === 'footer' && contactEmail !== undefined) {
        saveData.contactEmail = contactEmail || null
      }
      
      console.log('[EditSectionModal] Saving with data:', saveData)
      await onSave(saveData)
    } catch (error) {
      console.error('[EditSectionModal] Save error:', error)
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
          <label className="block text-sm font-medium text-white mb-2">
            {section.key === 'footer' ? 'Copyright Text' : 'Content'}
          </label>
          {section.key === 'footer' ? (
            <input
              type="text"
              value={content || ''}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Argu Fight. All rights reserved."
              className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
            />
          ) : (
            <>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Enter your content here. Use the toolbar to format text, add links, and create lists."
              />
              <p className="text-xs text-text-secondary mt-2">
                Use the toolbar above to format your text, add links, and create lists. HTML is generated automatically in the background.
              </p>
            </>
          )}
          {section.key === 'footer' && (
            <p className="text-xs text-text-secondary mt-2">
              Enter your copyright text (e.g., "Argu Fight. All rights reserved."). The copyright symbol and year will be added automatically.
            </p>
          )}
        </div>

        {/* Contact Email (Footer only) */}
        {section.key === 'footer' && (
          <div>
            <label className="block text-sm font-medium text-white mb-2">Contact Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="info@argufight.com"
              className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
            />
            <p className="text-xs text-text-secondary mt-2">
              Enter the contact email address displayed in the footer's Contact section.
            </p>
          </div>
        )}

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
            // This will refresh both the sections list AND the selectedSection
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
      console.log('[SectionImagesManager] Image upload response:', data)
      
      // Refresh sections to get updated image data
      await onUpdate()
      
      showToast({
        type: 'success',
        title: 'Image Uploaded',
        description: 'Image added to section successfully',
      })
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
            <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden group">
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
              {/* Delete button overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={async () => {
                    if (!confirm('Are you sure you want to delete this image?')) return
                    
                    try {
                      const response = await fetch(`/api/admin/content/media/${item.id}`, {
                        method: 'DELETE',
                      })

                      if (response.ok) {
                        showToast({
                          type: 'success',
                          title: 'Image Deleted',
                          description: 'Image removed from media library',
                        })
                        onUpload()
                      } else {
                        throw new Error('Delete failed')
                      }
                    } catch (error) {
                      showToast({
                        type: 'error',
                        title: 'Delete Failed',
                        description: 'Failed to delete image',
                      })
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}


function ImageItemComponent({
  image,
  onUpdate,
}: {
  image: HomepageSection['images'][0]
  onUpdate: () => Promise<void>
}) {
  const { showToast } = useToast()
  const [altText, setAltText] = useState(image.alt || '')
  const [caption, setCaption] = useState(image.caption || '')
  const [position, setPosition] = useState(image.imagePosition || 'left')
  const [isSaving, setIsSaving] = useState(false)

  // Update local state when image prop changes (e.g., after save/refresh)
  // Use image.id as key dependency to detect when a different image is loaded
  useEffect(() => {
    setAltText(image.alt || '')
    setCaption(image.caption || '')
    setPosition(image.imagePosition || 'left')
  }, [image.id, image.alt, image.caption, image.imagePosition])

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

      const result = await response.json()
      
      // Update local state immediately with saved values
      // This ensures the UI reflects the saved data even before refresh
      setAltText(result.image?.alt || altText)
      setCaption(result.image?.caption || caption)
      setPosition(result.image?.imagePosition || position)

      showToast({
        type: 'success',
        title: 'Image Updated',
        description: 'Image details saved successfully',
      })
      
      // Refresh section data to ensure everything is in sync
      await onUpdate()
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
    if (!confirm('Are you sure you want to delete this image?')) {
      return
    }

    console.log('[ImageItemComponent] Deleting image:', image.id)

    try {
      const response = await fetch(`/api/admin/content/images/${image.id}`, {
        method: 'DELETE',
      })

      console.log('[ImageItemComponent] Delete response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Delete failed' }))
        console.error('[ImageItemComponent] Delete error response:', errorData)
        throw new Error(errorData.error || 'Failed to delete image')
      }

      const result = await response.json()
      console.log('[ImageItemComponent] Delete success:', result)

      showToast({
        type: 'success',
        title: 'Image Deleted',
        description: 'Image removed from section successfully',
      })

      // Refresh section data
      await onUpdate()
    } catch (error: any) {
      console.error('[ImageItemComponent] Delete image error:', error)
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
  onSave: () => Promise<void>
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
      await onSave()
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

