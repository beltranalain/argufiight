'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/Loading'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { Avatar } from '@/components/ui/Avatar'
import { useToast } from '@/components/ui/Toast'
import { fetchClient } from '@/lib/api/fetchClient'

interface Category {
  id: string
  name: string
  label: string
  description: string | null
  color: string | null
  icon: string | null
  isActive: boolean
  sortOrder: number
  _count?: { debates: number }
}

interface CategoryStats {
  totalDebates: number
  activeDebates: number
  completedDebates: number
  totalAppeals: number
  successfulAppeals: number
  successRate: number
  averageElo: number
}

interface CategoryAnalytics {
  category: Category
  stats: CategoryStats
  recentDebates: Array<{
    id: string; topic: string; status: string
    challenger: { id: string; username: string; avatarUrl: string | null }
    opponent: { id: string; username: string; avatarUrl: string | null } | null
    winnerId: string | null; createdAt: string
  }>
}

const formatStatus = (status: string) =>
  status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')

export default function AdminCategoriesPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', label: '', description: '', color: '#3B82F6', isActive: true, sortOrder: 0 })

  const { data: categories = [], isLoading, isError, refetch } = useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const data = await fetchClient<{ categories: Category[] }>('/api/admin/categories')
      return data.categories || []
    },
    staleTime: 120_000,
  })

  const { data: analytics } = useQuery<CategoryAnalytics | null>({
    queryKey: ['admin-category-analytics', selectedCategory],
    queryFn: async () => {
      const data = await fetchClient<{ analytics: CategoryAnalytics }>(`/api/admin/categories/${selectedCategory}/analytics`)
      return data.analytics || null
    },
    enabled: !!selectedCategory,
    staleTime: 120_000,
  })

  const saveMutation = useMutation({
    mutationFn: (data: { id?: string; body: Record<string, any> }) => {
      const url = data.id ? `/api/admin/categories/${data.id}` : '/api/admin/categories'
      return fetchClient(url, { method: data.id ? 'PUT' : 'POST', body: JSON.stringify(data.body) })
    },
    onSuccess: () => {
      showToast({ type: 'success', title: 'Success', description: editingCategory ? 'Category updated' : 'Category created' })
      handleCloseModal()
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
    },
    onError: (error: any) => {
      showToast({ type: 'error', title: 'Error', description: error.message || 'Failed to save category' })
    },
  })

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setFormData({ name: category.name, label: category.label, description: category.description || '', color: category.color || '#3B82F6', isActive: category.isActive, sortOrder: category.sortOrder })
    } else {
      setEditingCategory(null)
      setFormData({ name: '', label: '', description: '', color: '#3B82F6', isActive: true, sortOrder: categories.length })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
    setFormData({ name: '', label: '', description: '', color: '#3B82F6', isActive: true, sortOrder: 0 })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.label) {
      showToast({ type: 'error', title: 'Error', description: 'Name and label are required' })
      return
    }
    saveMutation.mutate({
      id: editingCategory?.id,
      body: { name: formData.name.trim().toUpperCase(), label: formData.label.trim(), description: formData.description.trim() || null, color: formData.color, icon: null, isActive: formData.isActive, sortOrder: formData.sortOrder },
    })
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><LoadingSpinner size="lg" /></div>
  }

  if (isError) {
    return <ErrorDisplay title="Failed to load categories" onRetry={() => refetch()} />
  }

  return (
    <>
      <div>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Category Management</h1>
          <p className="text-text-secondary">Manage debate categories and view analytics</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Categories</h2>
            <Button variant="primary" onClick={() => handleOpenModal()}>Add Category</Button>
          </div>
          <div className="border-b border-bg-tertiary">
            <div className="flex gap-1 overflow-x-auto">
              {categories.sort((a, b) => a.sortOrder - b.sortOrder).map((category) => (
                <button key={category.id} onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                  className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${selectedCategory === category.id ? 'text-electric-blue border-b-2 border-electric-blue' : 'text-text-secondary hover:text-white'}`}>
                  {category.label}
                  {category._count && category._count.debates > 0 && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-bg-tertiary">{category._count.debates}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {selectedCategory ? (
          analytics ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card><CardBody><p className="text-text-secondary text-sm mb-1">Total Debates</p><p className="text-3xl font-bold text-white">{analytics.stats.totalDebates}</p></CardBody></Card>
                <Card><CardBody><p className="text-text-secondary text-sm mb-1">Active Debates</p><p className="text-3xl font-bold text-electric-blue">{analytics.stats.activeDebates}</p></CardBody></Card>
                <Card><CardBody><p className="text-text-secondary text-sm mb-1">Appeals</p><p className="text-3xl font-bold text-neon-orange">{analytics.stats.totalAppeals}</p></CardBody></Card>
                <Card><CardBody><p className="text-text-secondary text-sm mb-1">Appeal Success Rate</p><p className="text-3xl font-bold text-cyber-green">{analytics.stats.successRate}%</p></CardBody></Card>
              </div>

              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold text-white">Recent Debates - {analytics.category.label}</h2>
                </CardHeader>
                <CardBody>
                  {analytics.recentDebates.length === 0 ? (
                    <div className="text-center py-8 text-text-secondary"><p>No debates in this category yet</p></div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-bg-tertiary">
                            <th className="text-left py-3 px-4 text-text-secondary font-semibold">Topic</th>
                            <th className="text-left py-3 px-4 text-text-secondary font-semibold">Participants</th>
                            <th className="text-left py-3 px-4 text-text-secondary font-semibold">Status</th>
                            <th className="text-left py-3 px-4 text-text-secondary font-semibold">Winner</th>
                            <th className="text-left py-3 px-4 text-text-secondary font-semibold">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.recentDebates.map((debate) => (
                            <tr key={debate.id} className="border-b border-bg-tertiary hover:bg-bg-tertiary">
                              <td className="py-3 px-4"><p className="text-white font-medium">{debate.topic}</p></td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <Avatar username={debate.challenger.username} src={debate.challenger.avatarUrl} size="sm" />
                                  <span className="text-sm text-text-secondary">{debate.challenger.username}</span>
                                  <span className="text-text-muted">VS</span>
                                  {debate.opponent ? (
                                    <><Avatar username={debate.opponent.username} src={debate.opponent.avatarUrl} size="sm" />
                                    <span className="text-sm text-text-secondary">{debate.opponent.username}</span></>
                                  ) : <span className="text-text-muted text-sm">Waiting...</span>}
                                </div>
                              </td>
                              <td className="py-3 px-4"><Badge variant="default" size="sm">{formatStatus(debate.status)}</Badge></td>
                              <td className="py-3 px-4">
                                {debate.winnerId ? (
                                  <span className="text-sm text-cyber-green">{debate.winnerId === debate.challenger.id ? debate.challenger.username : debate.opponent?.username || 'Unknown'}</span>
                                ) : <span className="text-sm text-text-muted">-</span>}
                              </td>
                              <td className="py-3 px-4"><span className="text-sm text-text-secondary">{new Date(debate.createdAt).toLocaleDateString()}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12"><LoadingSpinner size="lg" /></div>
          )
        ) : (
          <Card><CardBody><div className="text-center py-12 text-text-secondary"><p>Select a category to view analytics and debates</p></div></CardBody></Card>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingCategory ? 'Edit Category' : 'Add Category'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name (Code)" placeholder="e.g., SPORTS, TECH" value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })} required />
          <Input label="Label (Display Name)" placeholder="e.g., Sports, Tech" value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })} required />
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe this category..." className="w-full px-4 py-3 bg-bg-secondary border border-bg-tertiary rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-electric-blue transition-colors resize-none" rows={3} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Color</label>
            <input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full h-10 rounded-lg border border-bg-tertiary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Sort Order" type="number" value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })} />
            <div className="flex items-center pt-8">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded border-bg-tertiary bg-bg-secondary text-electric-blue focus:ring-electric-blue focus:ring-2" />
                <span className="text-sm text-white">Active</span>
              </label>
            </div>
          </div>
          <ModalFooter>
            <Button type="button" variant="ghost" onClick={handleCloseModal} disabled={saveMutation.isPending}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={saveMutation.isPending}>{editingCategory ? 'Update' : 'Create'}</Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  )
}
