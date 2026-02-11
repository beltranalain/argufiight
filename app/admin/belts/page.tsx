'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/fetchClient'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { CreateBeltModal } from '@/components/admin/CreateBeltModal'
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
}

interface BeltSettings {
  id: string
  beltType: string
  challengeCooldownDays: number
  challengeExpiryDays: number
  maxDeclines: number
  defensePeriodDays: number
  inactivityDays: number
  mandatoryDefenseDays: number
  gracePeriodDays: number
  eloRange: number
  requireCoinsForChallenge?: boolean
  freeChallengesPerWeek: number
}

export default function BeltsAdminPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [deletingBeltId, setDeletingBeltId] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    category: '',
  })
  const [showChallengeRules, setShowChallengeRules] = useState(false)
  const [editingSettings, setEditingSettings] = useState<Partial<BeltSettings>>({})

  // Fetch belts
  const {
    data: belts = [],
    isLoading,
    isError,
    refetch: refetchBelts,
  } = useQuery<Belt[]>({
    queryKey: ['admin-belts', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.type) params.append('type', filters.type)
      if (filters.category) params.append('category', filters.category)
      const data = await fetchClient<{ belts: Belt[] }>(`/api/belts?${params.toString()}`)
      return data.belts || []
    },
    staleTime: 30_000,
  })

  // Fetch belt settings
  const {
    data: beltSettings = [],
  } = useQuery<BeltSettings[]>({
    queryKey: ['admin-belt-settings'],
    queryFn: async () => {
      const data = await fetchClient<{ settings: BeltSettings[] }>('/api/admin/belts/settings')
      return data.settings || []
    },
    staleTime: 60_000,
  })

  // Refresh belts when page becomes visible (user navigates back from details page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setTimeout(() => {
          refetchBelts()
        }, 100)
      }
    }
    const handleFocus = () => {
      setTimeout(() => {
        refetchBelts()
      }, 100)
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [refetchBelts])

  // Save challenge rules mutation
  const saveRulesMutation = useMutation({
    mutationFn: (updates: Partial<BeltSettings>) => {
      const beltType = updates.beltType || beltSettings[0]?.beltType
      return fetchClient('/api/admin/belts/settings', {
        method: 'PUT',
        body: JSON.stringify({ beltType, ...updates }),
      })
    },
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Success',
        description: 'Challenge rules updated successfully',
      })
      setEditingSettings({})
      queryClient.invalidateQueries({ queryKey: ['admin-belt-settings'] })
      queryClient.invalidateQueries({ queryKey: ['admin-belts'] })
    },
    onError: (error: any) => {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to update challenge rules',
      })
    },
  })

  // Delete belt mutation
  const deleteBeltMutation = useMutation({
    mutationFn: (beltId: string) =>
      fetchClient(`/api/admin/belts/${beltId}`, { method: 'DELETE' }),
    onSuccess: (_data, beltId) => {
      const belt = belts.find(b => b.id === beltId)
      showToast({
        type: 'success',
        title: 'Belt Deleted',
        description: `"${belt?.name || 'Belt'}" has been deleted successfully.`,
      })
      setDeletingBeltId(null)
      queryClient.invalidateQueries({ queryKey: ['admin-belts'] })
    },
    onError: (error: any) => {
      setDeletingBeltId(null)
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to delete belt',
      })
    },
  })

  const handleSaveChallengeRules = () => {
    const beltType = editingSettings.beltType || beltSettings[0]?.beltType
    if (!beltType) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'No belt type found',
      })
      return
    }
    saveRulesMutation.mutate(editingSettings)
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

  const handleDeleteBelt = (beltId: string, beltName: string) => {
    if (!confirm(`Are you sure you want to delete "${beltName}"?\n\nThis action cannot be undone. All belt history and challenges will be permanently deleted.`)) {
      return
    }
    setDeletingBeltId(beltId)
    deleteBeltMutation.mutate(beltId)
  }

  if (isError) {
    return (
      <ErrorDisplay
        title="Failed to load belts"
        message="Something went wrong while loading belts. Please try again."
        onRetry={() => refetchBelts()}
      />
    )
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

      {/* Challenge Rules Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Challenge Rules Configuration</h2>
              <p className="text-text-secondary text-sm mt-1">
                Configure how many times users can challenge belt holders and other challenge rules
              </p>
            </div>
            <Button
              onClick={() => {
                setShowChallengeRules(!showChallengeRules)
                if (!showChallengeRules && beltSettings.length > 0) {
                  setEditingSettings(beltSettings[0])
                }
              }}
              variant="secondary"
              size="sm"
            >
              {showChallengeRules ? 'Hide' : 'Configure Rules'}
            </Button>
          </div>
        </CardHeader>
        {showChallengeRules && (
          <CardBody>
            <div className="space-y-6">
              <div className="bg-bg-tertiary p-4 rounded-lg border border-border">
                <h3 className="text-lg font-semibold text-white mb-4">Current Rules</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-text-secondary">Free Challenges</p>
                    <p className="text-white font-medium">
                      {editingSettings.freeChallengesPerWeek ?? beltSettings[0]?.freeChallengesPerWeek ?? 1} per week
                    </p>
                    <p className="text-text-secondary text-xs mt-1">(Resets every 7 days)</p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Require Coins</p>
                    <p className="text-white font-medium">
                      {editingSettings.requireCoinsForChallenge !== false && (beltSettings[0]?.requireCoinsForChallenge !== false) ? 'Yes' : 'No'}
                    </p>
                    <p className="text-text-secondary text-xs mt-1">(When disabled, no coins needed)</p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Challenge Cooldown</p>
                    <p className="text-white font-medium">
                      {editingSettings.challengeCooldownDays ?? beltSettings[0]?.challengeCooldownDays ?? 7} days
                    </p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Challenge Expiry</p>
                    <p className="text-white font-medium">
                      {editingSettings.challengeExpiryDays ?? beltSettings[0]?.challengeExpiryDays ?? 3} days
                    </p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Max Declines</p>
                    <p className="text-white font-medium">
                      {editingSettings.maxDeclines ?? beltSettings[0]?.maxDeclines ?? 2}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Edit Challenge Rules</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Challenge Cooldown (Days)
                    </label>
                    <Input
                      type="number"
                      value={editingSettings.challengeCooldownDays ?? beltSettings[0]?.challengeCooldownDays ?? 7}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        challengeCooldownDays: parseInt(e.target.value) || 7,
                        beltType: beltSettings[0]?.beltType,
                      })}
                      min="0"
                      placeholder="7"
                    />
                    <p className="text-text-secondary text-xs mt-1">
                      Days before same user can challenge same belt again
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Challenge Expiry (Days)
                    </label>
                    <Input
                      type="number"
                      value={editingSettings.challengeExpiryDays ?? beltSettings[0]?.challengeExpiryDays ?? 3}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        challengeExpiryDays: parseInt(e.target.value) || 3,
                        beltType: beltSettings[0]?.beltType,
                      })}
                      min="1"
                      placeholder="3"
                    />
                    <p className="text-text-secondary text-xs mt-1">
                      Days before challenge expires if not responded to
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Max Declines
                    </label>
                    <Input
                      type="number"
                      value={editingSettings.maxDeclines ?? beltSettings[0]?.maxDeclines ?? 2}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        maxDeclines: parseInt(e.target.value) || 2,
                        beltType: beltSettings[0]?.beltType,
                      })}
                      min="0"
                      placeholder="2"
                    />
                    <p className="text-text-secondary text-xs mt-1">
                      Max times holder can decline before forced to accept
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Grace Period (Days)
                    </label>
                    <Input
                      type="number"
                      value={editingSettings.gracePeriodDays ?? beltSettings[0]?.gracePeriodDays ?? 30}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        gracePeriodDays: parseInt(e.target.value) || 30,
                        beltType: beltSettings[0]?.beltType,
                      })}
                      min="0"
                      placeholder="30"
                    />
                    <p className="text-text-secondary text-xs mt-1">
                      Protection period for new belt holders
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Free Challenges Per Week
                    </label>
                    <Input
                      type="number"
                      value={editingSettings.freeChallengesPerWeek ?? beltSettings[0]?.freeChallengesPerWeek ?? 1}
                      onChange={(e) => setEditingSettings({
                        ...editingSettings,
                        freeChallengesPerWeek: parseInt(e.target.value) || 1,
                        beltType: beltSettings[0]?.beltType,
                      })}
                      min="0"
                      placeholder="1"
                    />
                    <p className="text-text-secondary text-xs mt-1">
                      Number of free challenges each user gets per week (resets every 7 days)
                    </p>
                  </div>

                  <div className="p-4 bg-bg-secondary rounded-lg border border-border">
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="checkbox"
                        id="requireCoinsForChallenge"
                        checked={editingSettings.requireCoinsForChallenge !== undefined ? editingSettings.requireCoinsForChallenge : (beltSettings[0]?.requireCoinsForChallenge !== false)}
                        onChange={(e) => setEditingSettings({
                          ...editingSettings,
                          requireCoinsForChallenge: e.target.checked,
                          beltType: beltSettings[0]?.beltType,
                        })}
                        className="w-5 h-5 rounded border-bg-tertiary bg-bg-secondary text-electric-blue focus:ring-electric-blue focus:ring-2"
                      />
                      <label htmlFor="requireCoinsForChallenge" className="text-sm font-medium text-white cursor-pointer">
                        Require Coins for Challenges
                      </label>
                    </div>
                    <p className="text-text-secondary text-xs ml-8">
                      When unchecked, users can challenge without coins or free challenges
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border">

                  <div className="flex justify-end gap-3">
                    <Button
                      onClick={() => {
                        setEditingSettings({})
                        setShowChallengeRules(false)
                      }}
                      variant="secondary"
                      disabled={saveRulesMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveChallengeRules}
                      variant="primary"
                      disabled={saveRulesMutation.isPending}
                    >
                      {saveRulesMutation.isPending ? 'Saving...' : 'Save Challenge Rules'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        )}
      </Card>

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
                onClick={() => refetchBelts()}
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
                          style={{ imageRendering: 'auto' as const }}
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
                          <p className="text-text-secondary">Current Holder</p>
                          {belt.currentHolder ? (
                            <div className="flex items-center gap-2">
                              <Avatar
                                src={belt.currentHolder.avatarUrl}
                                username={belt.currentHolder.username}
                                size="sm"
                              />
                              <a
                                href={`/admin/users?userId=${belt.currentHolder.id}`}
                                className="text-white font-medium hover:text-primary hover:underline"
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
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeleteBelt(belt.id, belt.name)}
                        disabled={deletingBeltId === belt.id}
                        className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                      >
                        {deletingBeltId === belt.id ? 'Deleting...' : 'Delete'}
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
          queryClient.invalidateQueries({ queryKey: ['admin-belts'] })
        }}
      />
    </div>
  )
}
