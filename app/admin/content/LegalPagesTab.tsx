'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import dynamic from 'next/dynamic'
import { Modal } from '@/components/ui/Modal'

const RichTextEditor = dynamic(() => import('@/components/admin/RichTextEditor').then(m => ({ default: m.RichTextEditor })), {
  ssr: false,
  loading: () => <div className="h-[200px] bg-bg-tertiary rounded-lg animate-pulse" />,
})
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Input } from '@/components/ui/Input'

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

export default function LegalPagesTab() {
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
      setIsLoading(true)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Legal Pages</h2>
          <p className="text-text-secondary mt-1">
            Manage Terms of Service, Privacy Policy, and other legal pages
          </p>
        </div>
        <Button
          variant="primary"
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
          + Create Page
        </Button>
      </div>

      <Card>
        <CardBody>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : pages.length === 0 ? (
            <p className="text-text-secondary text-center py-8">No legal pages yet</p>
          ) : (
            <div className="space-y-4">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="p-4 bg-bg-tertiary border border-bg-tertiary rounded-lg hover:border-electric-blue/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-white">{page.title}</h3>
                        <Badge className={page.isVisible ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                          {page.isVisible ? 'Visible' : 'Hidden'}
                        </Badge>
                      </div>
                      <p className="text-sm text-text-secondary">/{page.slug}</p>
                      <p className="text-xs text-text-muted mt-1">
                        Updated: {new Date(page.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

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
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
            <Input
              value={formData.metaTitle}
              onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
              placeholder="Terms of Service - Argufight"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Meta Description (SEO)
            </label>
            <textarea
              value={formData.metaDescription}
              onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
              className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white"
              rows={3}
              placeholder="Terms of Service for Argufight..."
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

          <div className="flex justify-end gap-2 pt-4 border-t border-bg-tertiary">
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

