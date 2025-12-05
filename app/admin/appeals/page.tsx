'use client'

import { useState, useEffect } from 'react'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { Avatar } from '@/components/ui/Avatar'

interface AppealLimit {
  id: string
  userId: string
  monthlyLimit: number
  currentCount: number
  resetDate: string
  subscriptionTier: string | null
  user: {
    id: string
    username: string
    email: string
    avatarUrl: string | null
  }
}

interface AppealStatistics {
  totalAppeals: number
  pendingAppeals: number
  resolvedAppeals: number
  totalUsers: number
}

export default function AppealsManagementPage() {
  const { showToast } = useToast()
  const [appealLimits, setAppealLimits] = useState<AppealLimit[]>([])
  const [statistics, setStatistics] = useState<AppealStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<AppealLimit | null>(null)
  const [adjustmentValue, setAdjustmentValue] = useState(0)
  const [newLimit, setNewLimit] = useState(4)
  const [defaultLimit, setDefaultLimit] = useState(4)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchAppealData()
    fetchSettings()
  }, [])

  const fetchAppealData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/appeals')
      if (response.ok) {
        const data = await response.json()
        setAppealLimits(data.appealLimits || [])
        setStatistics(data.statistics || null)
      }
    } catch (error) {
      console.error('Failed to fetch appeal data:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load appeal data',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/appeals/settings')
      if (response.ok) {
        const data = await response.json()
        setDefaultLimit(data.defaultMonthlyLimit || 4)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const handleAdjustCount = async (userId: string, adjustment: number) => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/admin/appeals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'adjust',
          value: adjustment,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to adjust appeal count')
      }

      showToast({
        type: 'success',
        title: 'Success',
        description: `Appeal count ${adjustment > 0 ? 'increased' : 'decreased'} by ${Math.abs(adjustment)}`,
      })

      fetchAppealData()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to adjust appeal count',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSetLimit = async (userId: string, limit: number) => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/admin/appeals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'setLimit',
          value: limit,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to set limit')
      }

      showToast({
        type: 'success',
        title: 'Success',
        description: `Monthly limit set to ${limit}`,
      })

      fetchAppealData()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to set limit',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async (userId: string) => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/admin/appeals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'reset',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reset appeal count')
      }

      showToast({
        type: 'success',
        title: 'Success',
        description: 'Appeal count reset to 0',
      })

      fetchAppealData()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to reset appeal count',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveDefaultLimit = async () => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/admin/appeals/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultMonthlyLimit: defaultLimit,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save settings')
      }

      showToast({
        type: 'success',
        title: 'Success',
        description: 'Default appeal limit updated',
      })
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to save settings',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const filteredLimits = appealLimits.filter(limit =>
    limit.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    limit.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getRemainingAppeals = (limit: AppealLimit) => {
    return Math.max(0, limit.monthlyLimit - limit.currentCount)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="ADMIN" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="ADMIN" />
      <div className="pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-text-primary">Appeal Management</h1>
          </div>

          {/* Statistics */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardBody>
                  <p className="text-sm text-text-secondary mb-1">Total Appeals</p>
                  <p className="text-2xl font-bold text-text-primary">{statistics.totalAppeals}</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <p className="text-sm text-text-secondary mb-1">Pending</p>
                  <p className="text-2xl font-bold text-neon-orange">{statistics.pendingAppeals}</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <p className="text-sm text-text-secondary mb-1">Resolved</p>
                  <p className="text-2xl font-bold text-cyber-green">{statistics.resolvedAppeals}</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody>
                  <p className="text-sm text-text-secondary mb-1">Users with Limits</p>
                  <p className="text-2xl font-bold text-electric-blue">{statistics.totalUsers}</p>
                </CardBody>
              </Card>
            </div>
          )}

          {/* System Settings */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">System Settings</h2>
            </CardHeader>
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Default Monthly Appeal Limit
                  </label>
                  <Input
                    type="number"
                    value={defaultLimit}
                    onChange={(e) => setDefaultLimit(parseInt(e.target.value) || 0)}
                    min="0"
                    className="max-w-xs"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    This limit applies to new users. Existing users keep their current limits.
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={handleSaveDefaultLimit}
                  isLoading={isSaving}
                  className="mt-6"
                >
                  Save Default Limit
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* User Search */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">User Appeal Limits</h2>
            </CardHeader>
            <CardBody>
              <div className="mb-4">
                <Input
                  placeholder="Search by username or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                {filteredLimits.length === 0 ? (
                  <p className="text-text-secondary text-center py-8">
                    {searchQuery ? 'No users found' : 'No appeal limits set yet'}
                  </p>
                ) : (
                  filteredLimits.map((limit) => {
                    const remaining = getRemainingAppeals(limit)
                    const usagePercent = limit.monthlyLimit > 0
                      ? (limit.currentCount / limit.monthlyLimit) * 100
                      : 0

                    return (
                      <div
                        key={limit.id}
                        className="p-4 bg-bg-secondary border border-bg-tertiary rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={limit.user.avatarUrl}
                              username={limit.user.username}
                              size="md"
                            />
                            <div>
                              <p className="font-semibold text-text-primary">{limit.user.username}</p>
                              <p className="text-sm text-text-secondary">{limit.user.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={remaining > 0 ? 'default' : 'error'}
                              className="mb-2"
                            >
                              {remaining} remaining
                            </Badge>
                            <p className="text-xs text-text-secondary">
                              {limit.currentCount}/{limit.monthlyLimit} used
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="w-full bg-bg-tertiary rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                usagePercent >= 100
                                  ? 'bg-neon-orange'
                                  : usagePercent >= 75
                                  ? 'bg-neon-orange/70'
                                  : 'bg-electric-blue'
                              }`}
                              style={{ width: `${Math.min(100, usagePercent)}%` }}
                            />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleAdjustCount(limit.userId, -1)}
                              disabled={isSaving || limit.currentCount === 0}
                            >
                              -1
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleAdjustCount(limit.userId, 1)}
                              disabled={isSaving}
                            >
                              +1
                            </Button>
                            <Input
                              type="number"
                              value={adjustmentValue}
                              onChange={(e) => setAdjustmentValue(parseInt(e.target.value) || 0)}
                              placeholder="Custom"
                              className="w-20"
                              min="-100"
                              max="100"
                            />
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                if (adjustmentValue !== 0) {
                                  handleAdjustCount(limit.userId, adjustmentValue)
                                  setAdjustmentValue(0)
                                }
                              }}
                              disabled={isSaving || adjustmentValue === 0}
                            >
                              Apply
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={newLimit}
                              onChange={(e) => setNewLimit(parseInt(e.target.value) || 4)}
                              placeholder="New limit"
                              className="w-24"
                              min="0"
                            />
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleSetLimit(limit.userId, newLimit)}
                              disabled={isSaving}
                            >
                              Set Limit
                            </Button>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleReset(limit.userId)}
                            disabled={isSaving}
                          >
                            Reset Count
                          </Button>
                        </div>

                        <p className="text-xs text-text-muted mt-2">
                          Resets on: {new Date(limit.resetDate).toLocaleDateString()}
                        </p>
                      </div>
                    )
                  })
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

