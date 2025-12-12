'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'

interface UserLimitData {
  userLimit: number
  currentUserCount: number
  waitingListCount: number
  isLimited: boolean
}

interface WaitingListEntry {
  id: string
  email: string
  username: string
  position: number
  notified: boolean
  createdAt: string
}

export default function UserLimitPage() {
  const { showToast } = useToast()
  const [userLimitData, setUserLimitData] = useState<UserLimitData | null>(null)
  const [waitingList, setWaitingList] = useState<WaitingListEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [newLimit, setNewLimit] = useState<string>('')
  const [isApproving, setIsApproving] = useState<string | null>(null)

  useEffect(() => {
    fetchUserLimitData()
    fetchWaitingList()
  }, [])

  const fetchUserLimitData = async () => {
    try {
      const response = await fetch('/api/admin/settings/user-limit')
      if (response.ok) {
        const data = await response.json()
        setUserLimitData(data)
        setNewLimit(data.userLimit.toString())
      }
    } catch (error) {
      console.error('Failed to fetch user limit:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load user limit settings',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchWaitingList = async () => {
    try {
      const response = await fetch('/api/admin/waiting-list')
      if (response.ok) {
        const data = await response.json()
        setWaitingList(data.waitingList || [])
      }
    } catch (error) {
      console.error('Failed to fetch waiting list:', error)
    }
  }

  const handleSaveLimit = async () => {
    const limit = parseInt(newLimit)
    if (isNaN(limit) || limit < 0) {
      showToast({
        type: 'error',
        title: 'Invalid Limit',
        description: 'User limit must be a non-negative number. Use 0 for unlimited.',
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/settings/user-limit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userLimit: limit }),
      })

      if (response.ok) {
        const data = await response.json()
        setUserLimitData(data)
        showToast({
          type: 'success',
          title: 'User Limit Updated',
          description: `User limit set to ${limit === 0 ? 'unlimited' : limit}`,
        })
        // Refresh waiting list
        fetchWaitingList()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update user limit')
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Update Failed',
        description: error.message || 'Failed to update user limit',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleApproveUser = async (waitingListId: string) => {
    setIsApproving(waitingListId)
    try {
      const response = await fetch(`/api/admin/waiting-list/${waitingListId}/approve`, {
        method: 'POST',
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'User Approved',
          description: 'User has been approved and account created',
        })
        // Refresh data
        fetchUserLimitData()
        fetchWaitingList()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to approve user')
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Approval Failed',
        description: error.message || 'Failed to approve user',
      })
    } finally {
      setIsApproving(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">User Limit Management</h1>
        <p className="text-text-secondary mb-8">Control the maximum number of users allowed on the platform</p>
      </div>

      {/* User Limit Settings */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-white">User Limit Settings</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-6">
            {/* Current Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-bg-tertiary p-4 rounded-lg">
                <p className="text-text-secondary text-sm mb-1">Current Limit</p>
                <p className="text-2xl font-bold text-white">
                  {userLimitData?.userLimit === 0 ? 'Unlimited' : userLimitData?.userLimit}
                </p>
              </div>
              <div className="bg-bg-tertiary p-4 rounded-lg">
                <p className="text-text-secondary text-sm mb-1">Current Users</p>
                <p className="text-2xl font-bold text-white">{userLimitData?.currentUserCount || 0}</p>
              </div>
              <div className="bg-bg-tertiary p-4 rounded-lg">
                <p className="text-text-secondary text-sm mb-1">On Waiting List</p>
                <p className="text-2xl font-bold text-white">{userLimitData?.waitingListCount || 0}</p>
              </div>
            </div>

            {/* Usage Indicator */}
            {userLimitData && userLimitData.isLimited && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-text-secondary text-sm">Usage</p>
                  <p className="text-text-secondary text-sm">
                    {userLimitData.currentUserCount} / {userLimitData.userLimit}
                  </p>
                </div>
                <div className="w-full bg-bg-tertiary rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      (userLimitData.currentUserCount / userLimitData.userLimit) >= 1
                        ? 'bg-red-500'
                        : (userLimitData.currentUserCount / userLimitData.userLimit) >= 0.8
                        ? 'bg-yellow-500'
                        : 'bg-electric-blue'
                    }`}
                    style={{
                      width: `${Math.min((userLimitData.currentUserCount / userLimitData.userLimit) * 100, 100)}%`,
                    }}
                  />
                </div>
                {userLimitData.currentUserCount >= userLimitData.userLimit && (
                  <p className="text-red-400 text-sm mt-2">
                    ⚠️ User limit reached. New signups will be added to waiting list.
                  </p>
                )}
              </div>
            )}

            {/* Update Limit */}
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-white mb-2">
                  Set User Limit
                </label>
                <Input
                  type="number"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  placeholder="0 for unlimited"
                  min="0"
                  className="w-full"
                />
                <p className="text-text-muted text-xs mt-1">
                  Set to 0 for unlimited users. Any positive number will limit signups.
                </p>
              </div>
              <Button
                variant="primary"
                onClick={handleSaveLimit}
                isLoading={isSaving}
                disabled={isSaving || newLimit === userLimitData?.userLimit.toString()}
              >
                Save Limit
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Waiting List */}
      {waitingList.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Waiting List</h2>
              <Badge variant="default">{waitingList.length} users</Badge>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {waitingList.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg border border-bg-tertiary hover:border-electric-blue transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Badge variant="default" size="sm">
                        #{entry.position}
                      </Badge>
                      <div>
                        <p className="text-white font-semibold">{entry.username}</p>
                        <p className="text-text-secondary text-sm">{entry.email}</p>
                        <p className="text-text-muted text-xs mt-1">
                          Joined: {new Date(entry.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {entry.notified && (
                      <Badge variant="default" size="sm" className="bg-green-600">
                        Notified
                      </Badge>
                    )}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApproveUser(entry.id)}
                      isLoading={isApproving === entry.id}
                      disabled={isApproving !== null}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {waitingList.length === 0 && userLimitData && userLimitData.isLimited && (
        <Card>
          <CardBody>
            <p className="text-text-secondary text-center py-8">
              No users on waiting list. New signups will be added here when the limit is reached.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  )
}





