'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { Modal } from '@/components/ui/Modal'

interface LegalPage {
  id: string
  slug: string
  title: string
  content: string
  metaTitle: string | null
  metaDescription: string | null
  isVisible: boolean
  createdAt: string
  updatedAt: string
}

export default function LegalPagesPage() {
  const [pages, setPages] = useState<LegalPage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingPage, setEditingPage] = useState<LegalPage | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    isVisible: true,
  })
  const { showToast } = useToast()

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    try {
      const response = await fetch('/api/admin/legal-pages')
      if (response.ok) {
        const data = await response.json()
        setPages(data.pages || [])
      }
    } catch (error) {
      console.error('Failed to fetch legal pages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (page: LegalPage) => {
    setEditingPage(page)
    setFormData({
      title: page.title,
      content: page.content,
      metaTitle: page.metaTitle || '',
      metaDescription: page.metaDescription || '',
      isVisible: page.isVisible,
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    try {
      const url = editingPage
        ? `/api/admin/legal-pages/${editingPage.id}`
        : '/api/admin/legal-pages'
      const method = editingPage ? 'PATCH' : 'POST'

      const body = editingPage
        ? formData
        : {
            ...formData,
            slug: formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        showToast({
  title: 'Success',
  description: 'Legal page saved successfully',
  type: 'success'
})
        setIsModalOpen(false)
        setEditingPage(null)
        setFormData({
          title: '',
          content: '',
          metaTitle: '',
          metaDescription: '',
          isVisible: true,
        })
        fetchPages()
      } else {
        const error = await response.json()
        showToast({
  title: 'Error',
  description: error.error || 'Failed to save legal page',
  type: 'error'
})
      }
    } catch (error) {
      console.error('Failed to save legal page:', error)
      showToast({
  title: 'Error',
  description: 'Failed to save legal page',
  type: 'error'
})
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this legal page?')) return

    try {
      const response = await fetch(`/api/admin/legal-pages/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        showToast({
  title: 'Success',
  description: 'Legal page deleted successfully',
  type: 'success'
})
        fetchPages()
      } else {
        showToast({
  title: 'Error',
  description: 'Failed to delete legal page',
  type: 'error'
})
      }
    } catch (error) {
      console.error('Failed to delete legal page:', error)
      showToast({
  title: 'Error',
  description: 'Failed to delete legal page',
  type: 'error'
})
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Legal Pages</h1>
            <p className="text-text-secondary mt-2">
              Manage Terms of Service, Privacy Policy, and other legal pages
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingPage(null)
              setFormData({
                title: '',
                content: '',
                metaTitle: '',
                metaDescription: '',
                isVisible: true,
              })
              setIsModalOpen(true)
            }}
          >
            Create Page
          </Button>
        </div>

        <div className="bg-bg-secondary rounded-lg border border-bg-tertiary overflow-hidden">
          <table className="w-full">
            <thead className="bg-bg-tertiary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Page
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-tertiary">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-bg-tertiary/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-white font-medium">{page.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-text-secondary">/{page.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        page.isVisible
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {page.isVisible ? 'Visible' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-text-secondary text-sm">
                    {new Date(page.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEdit(page)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(page.id)}
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

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingPage(null)
          }}
          title={editingPage ? 'Edit Legal Page' : 'Create Legal Page'}
          size="xl"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-white"
                placeholder="Terms of Service"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Content
              </label>
              <RichTextEditor
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="Enter page content..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Meta Title (SEO)
              </label>
              <input
                type="text"
                value={formData.metaTitle}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-white"
                placeholder="Terms of Service - Honorable AI"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Meta Description (SEO)
              </label>
              <textarea
                value={formData.metaDescription}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-white"
                rows={3}
                placeholder="Terms of Service for Honorable AI..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isVisible"
                checked={formData.isVisible}
                onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                className="w-4 h-4 rounded border-2 border-bg-tertiary bg-bg-secondary checked:bg-electric-blue"
              />
              <label htmlFor="isVisible" className="text-sm text-white">
                Visible to public
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
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
      </div>
  )
}

