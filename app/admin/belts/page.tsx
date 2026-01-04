'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'
import { CreateBeltModal } from '@/components/admin/CreateBeltModal'
import { Modal } from '@/components/ui/Modal'
import Link from 'next/link'

interface Belt {
  id: string
  name: string
  type: string
  category: string | null
  status: string
  designImageUrl?: string | null
  currentHolder: {
    id: string
    username: string
    avatarUrl: string | null
    eloRating: number
  } | null
  tournament: {
    id: string
    name: string
  } | null
  coinValue: number
  creationCost: number
  acquiredAt: string | null
  lastDefendedAt: string | null
  timesDefended: number
  successfulDefenses: number
  createdAt: string
  isStaked: boolean
}

export default function BeltsAdminPage() {
  const { showToast } = useToast()
  const [belts, setBelts] = useState<Belt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [beltToDelete, setBeltToDelete] = useState<Belt | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    category: '',
  })

  useEffect(() => {
    fetchBelts()
  }, [filters])

  const fetchBelts = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.type) params.append('type', filters.type)
      if (filters.category) params.append('category', filters.category)

      const response = await fetch(`/api/belts?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        setBelts(data.belts || [])
      } else {
        const error = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }))
        console.error('[Admin Belts] Failed to fetch belts:', response.status, error)
        showToast({
          type: 'error',
          title: 'Error',
          description: error.error || `Failed to load belts (${response.status})`,
        })
      }
    } catch (error) {
      console.error('Failed to fetch belts:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load belts',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500 text-white'
      case 'INACTIVE':
        return 'bg-yellow-500 text-white'
      case 'VACANT':
        return 'bg-gray-500 text-white'
      case 'STAKED':
        return 'bg-blue-500 text-white'
      case 'MANDATORY':
        return 'bg-red-500 text-white'
      case 'GRACE_PERIOD':
      case 'GRACEPERIOD':
        return 'bg-purple-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const formatBeltStatus = (status: string) => {
    return status.replace(/_/g, ' ')
  }

  const handleDeleteBelt = (belt: Belt) => {
    setBeltToDelete(belt)
    setIsDeleteModalOpen(true)
  }

  const confirmDeleteBelt = async () => {
    if (!beltToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/belts/${beltToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Success',
          description: `Belt "${beltToDelete.name}" deleted successfully`,
        })
        setIsDeleteModalOpen(false)
        setBeltToDelete(null)
        fetchBelts()
      } else {
        const error = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }))
        console.error('[Admin Belts] Failed to delete belt:', response.status, error)
        showToast({
          type: 'error',
          title: 'Error',
          description: error.error || `Failed to delete belt (${response.status})`,
        })
      }
    } catch (error: any) {
      console.error('[Admin Belts] Error deleting belt:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to delete belt',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'ROOKIE':
        return 'bg-blue-500 text-white'
      case 'CATEGORY':
        return 'bg-green-500 text-white'
      case 'CHAMPIONSHIP':
        return 'bg-yellow-500 text-white'
      case 'UNDEFEATED':
        return 'bg-purple-500 text-white'
      case 'TOURNAMENT':
        return 'bg-orange-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Belt Management</h1>
          <p className="text-text-secondary">Manage all belts in the system</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/belts/inactive">
            <Button variant="secondary">
              Inactive Belts
            </Button>
          </Link>
          <Link href="/admin/belts/settings">
            <Button variant="secondary">
              Belt Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-white">Filters</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-lg text-white"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="VACANT">Vacant</option>
                <option value="STAKED">Staked</option>
                <option value="MANDATORY">Mandatory</option>
                <option value="GRACE_PERIOD">GRACE PERIOD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-lg text-white"
              >
                <option value="">All Types</option>
                <option value="ROOKIE">Rookie</option>
                <option value="CATEGORY">Category</option>
                <option value="CHAMPIONSHIP">Championship</option>
                <option value="UNDEFEATED">Undefeated</option>
                <option value="TOURNAMENT">Tournament</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Category
              </label>
              <Input
                type="text"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                placeholder="Filter by category"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Belts List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">All Belts ({belts.length})</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                variant="primary"
              >
                Create Belt
              </Button>
              <Button
                onClick={fetchBelts}
                variant="secondary"
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : belts.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              No belts found
            </div>
          ) : (
            <div className="space-y-4">
              {belts.map((belt) => (
                <div
                  key={belt.id}
                  className="bg-bg-tertiary p-4 rounded-lg border border-border hover:border-primary transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Belt Image on Left */}
                    {belt.designImageUrl ? (
                      <div className="flex-shrink-0 w-24 h-24 bg-bg-secondary border border-bg-tertiary rounded-lg overflow-hidden flex items-center justify-center relative">
                        <img
                          src={belt.designImageUrl}
                          alt={belt.name}
                          className="w-[140%] h-[140%] object-contain"
                          style={{ imageRendering: 'auto' }}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            const parent = e.currentTarget.parentElement
                            if (parent) {
                              parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-text-secondary"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg></div>'
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-24 h-24 bg-bg-secondary border border-bg-tertiary border-dashed rounded-lg flex items-center justify-center">
                        <svg className="w-8 h-8 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Belt Info on Right */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-white">{belt.name}</h3>
                        <Badge className={getTypeBadgeColor(belt.type)} style={{ color: '#ffffff' }}>
                          {belt.type}
                        </Badge>
                        <Badge className={getStatusBadgeColor(belt.status)} style={{ color: '#ffffff' }}>
                          {formatBeltStatus(belt.status)}
                        </Badge>
                        {belt.category && (
                          <span className="inline-flex items-center font-bold rounded-full transition-colors px-3 py-1 text-xs bg-gray-600" style={{ color: '#ffffff' }}>
                            {belt.category}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-text-secondary mb-2">Current Holder</p>
                          {belt.currentHolder ? (
                            <div className="flex items-center gap-2">
                              {belt.currentHolder.avatarUrl ? (
                                <img
                                  src={belt.currentHolder.avatarUrl}
                                  alt={belt.currentHolder.username}
                                  className="w-8 h-8 rounded-full border border-primary object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full border border-primary bg-bg-secondary flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                                  {belt.currentHolder.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <a
                                href={`/admin/users?userId=${belt.currentHolder.id}`}
                                className="text-primary hover:underline font-medium"
                              >
                                {belt.currentHolder.username}
                              </a>
                            </div>
                          ) : (
                            <p className="text-white font-medium">Vacant</p>
                          )}
                        </div>
                        <div>
                          <p className="text-text-secondary">Defenses</p>
                          <p className="text-white font-medium">
                            {belt.successfulDefenses} / {belt.timesDefended}
                          </p>
                        </div>
                        <div>
                          <p className="text-text-secondary">Coin Value</p>
                          <p className="text-white font-medium">{belt.coinValue}</p>
                        </div>
                        <div>
                          <p className="text-text-secondary">Last Defended</p>
                          <p className="text-white font-medium">
                            {belt.lastDefendedAt
                              ? new Date(belt.lastDefendedAt).toLocaleDateString()
                              : 'Never'}
                          </p>
                        </div>
                      </div>

                      {belt.tournament && (
                        <div className="mt-2 text-sm">
                          <p className="text-text-secondary">
                            Tournament:{' '}
                            <a
                              href={`/admin/tournaments?tournamentId=${belt.tournament.id}`}
                              className="text-primary hover:underline"
                            >
                              {belt.tournament.name}
                            </a>
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 ml-4 flex gap-2">
                      <a href={`/admin/belts/${belt.id}`}>
                        <Button variant="secondary" size="sm">
                          View Details
                        </Button>
                      </a>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteBelt(belt)}
                        disabled={belt.isStaked}
                        title={
                          belt.isStaked
                            ? 'Cannot delete staked belt'
                            : belt.currentHolder
                            ? 'Delete belt (will remove from current holder)'
                            : 'Delete belt'
                        }
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

      {/* Create Belt Modal */}
      <CreateBeltModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchBelts()
        }}
      />

      {/* Delete Belt Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteModalOpen(false)
            setBeltToDelete(null)
          }
        }}
        title="Delete Belt"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to permanently delete the belt <strong className="text-white">"{beltToDelete?.name}"</strong>?
          </p>
          <p className="text-text-secondary text-sm">
            This action cannot be undone. All belt history, challenges, and related data will be permanently removed.
          </p>
          {beltToDelete?.currentHolder && (
            <p className="text-neon-orange text-sm font-medium">
              ⚠️ Warning: This belt has an active holder ({beltToDelete.currentHolder.username}). The belt will be removed from the holder and all pending challenges will be cancelled.
            </p>
          )}
          {beltToDelete?.isStaked && (
            <p className="text-red-500 text-sm font-bold">
              ❌ Error: This belt is currently staked in a debate or tournament. You cannot delete a staked belt. Please wait until the debate/tournament is complete.
            </p>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-bg-tertiary">
            <Button
              variant="secondary"
              onClick={() => {
                setIsDeleteModalOpen(false)
                setBeltToDelete(null)
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteBelt}
              isLoading={isDeleting}
              disabled={beltToDelete?.isStaked === true}
            >
              {beltToDelete?.currentHolder ? 'Force Delete Belt' : 'Delete Belt'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
