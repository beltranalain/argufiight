'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { AddEmployeeModal } from '@/components/admin/AddEmployeeModal'
import { UserProfileModal } from '@/components/admin/UserProfileModal'
import { AIUserModal } from '@/components/admin/AIUserModal'
import { LoadingSpinner } from '@/components/ui/Loading'
import { StaggerContainer } from '@/components/ui/StaggerContainer'
import { StaggerItem } from '@/components/ui/StaggerItem'
import { cardHover, cardTap } from '@/lib/animations'
import { useToast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'

interface UserData {
  id: string
  username: string
  email: string
  avatarUrl: string | null
  eloRating: number
  totalDebates: number
  debatesWon: number
  debatesLost: number
  debatesTied: number
  isAdmin: boolean
  isBanned: boolean
  bannedUntil: string | null
  employeeRole: string | null
  accessLevel: string | null
  createdAt: string
  // AI User fields (optional)
  isAI?: boolean
  aiPersonality?: string | null
  aiResponseDelay?: number | null
  aiPaused?: boolean
}

interface UserLimitInfo {
  userLimit: number
  currentUserCount: number
  waitingListCount: number
  isLimited: boolean
}

export default function AdminUsersPage() {
  const { showToast } = useToast()
  const [userData, setUserData] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [userLimitInfo, setUserLimitInfo] = useState<UserLimitInfo | null>(null)
  const [actionUserId, setActionUserId] = useState<string | null>(null)
  const [actionType, setActionType] = useState<'suspend' | 'unsuspend' | 'delete' | null>(null)
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [suspendDays, setSuspendDays] = useState<string>('7')
  const [aiUsers, setAiUsers] = useState<UserData[]>([])
  const [regularUsers, setRegularUsers] = useState<UserData[]>([])
  const [employees, setEmployees] = useState<UserData[]>([])
  const [isAIUserModalOpen, setIsAIUserModalOpen] = useState(false)
  const [editingAIUser, setEditingAIUser] = useState<UserData | null>(null)

  useEffect(() => {
    fetchUsers()
    fetchUserLimitInfo()
  }, [])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        const users = data.users || []
        setUserData(users)
        // Separate users into categories
        const ai = users.filter((u: any) => u.isAI)
        const emp = users.filter((u: any) => u.isAdmin || u.employeeRole)
        const regular = users.filter((u: any) => !u.isAI && !u.isAdmin && !u.employeeRole)
        setAiUsers(ai)
        setEmployees(emp)
        setRegularUsers(regular)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserLimitInfo = async () => {
    try {
      const response = await fetch('/api/admin/settings/user-limit')
      if (response.ok) {
        const data = await response.json()
        setUserLimitInfo(data)
      }
    } catch (error) {
      console.error('Failed to fetch user limit info:', error)
    }
  }

  const handleSuspendUser = (userId: string, bannedUntil: string | null) => {
    setActionUserId(userId)
    const isSuspended = bannedUntil && new Date(bannedUntil) > new Date()
    setActionType(isSuspended ? 'unsuspend' : 'suspend')
    setSuspendDays('7') // Default to 7 days
    setIsActionModalOpen(true)
  }

  const handleDeleteUser = (userId: string) => {
    setActionUserId(userId)
    setActionType('delete')
    setIsActionModalOpen(true)
  }

  const confirmAction = async () => {
    if (!actionUserId || !actionType) return

    setIsProcessing(true)
    try {
      if (actionType === 'delete') {
        const response = await fetch(`/api/admin/users/${actionUserId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          showToast({
            type: 'success',
            title: 'User Deleted',
            description: 'User has been permanently deleted',
          })
          // Close profile modal if viewing the deleted user
          if (selectedUserId === actionUserId) {
            setIsProfileModalOpen(false)
            setSelectedUserId(null)
          }
          fetchUsers()
          fetchUserLimitInfo()
        } else {
          const error = await response.json()
          throw new Error(error.error || 'Failed to delete user')
        }
      } else {
        // Suspend/Unsuspend
        const days = actionType === 'suspend' ? parseInt(suspendDays) : 0
        if (actionType === 'suspend' && (isNaN(days) || days <= 0)) {
          throw new Error('Please enter a valid number of days (greater than 0)')
        }

        const response = await fetch(`/api/admin/users/${actionUserId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ suspendDays: days }),
        })

        if (response.ok) {
          const data = await response.json()
          showToast({
            type: 'success',
            title: actionType === 'suspend' ? 'User Suspended' : 'User Unsuspended',
            description: data.message || `User has been ${actionType === 'suspend' ? 'suspended' : 'unsuspended'} successfully`,
          })
          fetchUsers()
          fetchUserLimitInfo()
        } else {
          const error = await response.json()
          throw new Error(error.error || `Failed to ${actionType} user`)
        }
      }

      setIsActionModalOpen(false)
      setActionUserId(null)
      setActionType(null)
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Action Failed',
        description: error.message || 'Failed to perform action',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Users are already separated in fetchUsers

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-4xl font-bold text-white">User Management</h1>
              {userLimitInfo && (
                <div className="flex items-center gap-3">
                  <Badge variant="default" size="sm" className="bg-electric-blue/20 text-electric-blue border border-electric-blue/30">
                    Limit: {userLimitInfo.userLimit === 0 ? 'Unlimited' : userLimitInfo.userLimit}
                  </Badge>
                  <Badge variant="default" size="sm" className={`border ${
                    userLimitInfo.waitingListCount > 0
                      ? 'bg-neon-orange/20 text-neon-orange border-neon-orange/30'
                      : 'bg-bg-tertiary text-text-secondary border-bg-tertiary'
                  }`}>
                    {userLimitInfo.waitingListCount} Waiting
                  </Badge>
                </div>
              )}
            </div>
            <p className="text-text-secondary">Manage platform users and employees</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => window.location.href = '/admin/users/user-limit'}
            >
              User Limit Settings
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setEditingAIUser(null)
                setIsAIUserModalOpen(true)
              }}
            >
              Create AI User
            </Button>
            <Button
              variant="primary"
              onClick={() => setIsModalOpen(true)}
            >
              Add Employee
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* AI Users Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">AI Users</h2>
                  <p className="text-sm text-text-secondary mt-1">Automated users that accept challenges and debate</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditingAIUser(null)
                    setIsAIUserModalOpen(true)
                  }}
                >
                  Create AI User
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {aiUsers.length === 0 ? (
                <EmptyState
                  icon={
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  }
                  title="No AI Users"
                  description="Create AI users to automatically accept challenges and participate in debates"
                />
              ) : (
                <StaggerContainer className="space-y-4">
                  {aiUsers.map((user) => {
                    const aiUser = user as any
                    const delayMs = aiUser.aiResponseDelay || 3600000
                    const delayHours = Math.round(delayMs / 3600000)
                    const delayLabel = delayMs < 3600000 
                      ? `${Math.round(delayMs / 60000)} min`
                      : delayHours === 1 
                        ? '1 hour'
                        : `${delayHours} hours`
                    
                    return (
                      <StaggerItem key={user.id}>
                        <motion.div
                          whileHover={cardHover}
                          whileTap={cardTap}
                          className="p-4 bg-bg-tertiary rounded-lg border border-bg-tertiary hover:border-electric-blue transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <Avatar 
                                username={user.username}
                                src={user.avatarUrl}
                                size="md"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-white font-semibold">{user.username}</h3>
                                  <Badge variant="default" size="sm" className="bg-purple-500 text-white">
                                    AI User
                                  </Badge>
                                  {aiUser.aiPersonality && (
                                    <Badge variant="default" size="sm" className="bg-electric-blue text-black">
                                      {aiUser.aiPersonality}
                                    </Badge>
                                  )}
                                  {aiUser.aiPaused && (
                                    <Badge variant="default" size="sm" className="bg-neon-orange text-black">
                                      Paused
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-text-secondary">{user.email}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
                                  <span>ELO: {user.eloRating}</span>
                                  <span>•</span>
                                  <span>{user.totalDebates} debates</span>
                                  <span>•</span>
                                  <span>Auto-accept: {delayLabel}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    setEditingAIUser(user)
                                    setIsAIUserModalOpen(true)
                                  }}
                                  className="text-xs"
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      const response = await fetch(`/api/admin/ai-users/${user.id}/toggle-pause`, {
                                        method: 'POST',
                                      })
                                      if (response.ok) {
                                        showToast({
                                          type: 'success',
                                          title: 'Success',
                                          description: `AI user ${aiUser.aiPaused ? 'resumed' : 'paused'}`,
                                        })
                                        fetchUsers()
                                      }
                                    } catch (error) {
                                      showToast({
                                        type: 'error',
                                        title: 'Error',
                                        description: 'Failed to toggle pause',
                                      })
                                    }
                                  }}
                                  className="text-xs"
                                >
                                  {aiUser.aiPaused ? 'Resume' : 'Pause'}
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-xs text-red-400 hover:text-red-300 hover:border-red-400"
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </StaggerItem>
                    )
                  })}
                </StaggerContainer>
              )}
            </CardBody>
          </Card>

          {/* Employees Section */}
          {employees.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-white">Employees</h2>
                <p className="text-sm text-text-secondary mt-1">Platform administrators and staff</p>
              </CardHeader>
            <CardBody>
              <StaggerContainer className="space-y-4">
                {employees.map((user) => (
                  <StaggerItem key={user.id}>
                    <motion.div
                      onClick={() => {
                        setSelectedUserId(user.id)
                        setIsProfileModalOpen(true)
                      }}
                      whileHover={cardHover}
                      whileTap={cardTap}
                      className="p-4 bg-bg-tertiary rounded-lg border border-bg-tertiary hover:border-electric-blue transition-all cursor-pointer"
                    >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar 
                          username={user.username}
                          src={user.avatarUrl}
                          size="md"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-semibold">{user.username}</h3>
                            <Badge variant="default" size="sm" className="bg-electric-blue text-black">
                              Employee
                            </Badge>
                            {user.employeeRole && (
                              <Badge variant="default" size="sm" className="bg-cyber-green text-black">
                                {user.employeeRole}
                              </Badge>
                            )}
                            {user.accessLevel && (
                              <Badge variant="default" size="sm" className="bg-hot-pink text-black">
                                {user.accessLevel}
                              </Badge>
                            )}
                            {user.bannedUntil && new Date(user.bannedUntil) > new Date() && (
                              <Badge variant="default" size="sm" className="bg-neon-orange text-black">
                                Suspended
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-text-secondary">{user.email}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
                            <span>ELO: {user.eloRating}</span>
                            <span>•</span>
                            <span>{user.totalDebates} debates</span>
                            <span>•</span>
                            <span className="text-cyber-green">{user.debatesWon}W</span>
                            <span className="text-neon-orange">{user.debatesLost}L</span>
                            <span className="text-yellow-500">{user.debatesTied || 0}T</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-text-secondary mr-4">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSuspendUser(user.id, user.bannedUntil)}
                            className="text-xs"
                            disabled={true}
                            title="Cannot suspend admin users"
                          >
                            {user.bannedUntil && new Date(user.bannedUntil) > new Date() ? 'Unsuspend' : 'Suspend'}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-xs text-red-400 hover:text-red-300 hover:border-red-400"
                            disabled={true}
                            title="Cannot delete admin users"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </StaggerItem>
                ))}
              </StaggerContainer>
            </CardBody>
          </Card>
        )}

        {/* Regular Users Section */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">All Users</h2>
            <p className="text-sm text-text-secondary mt-1">Platform users and participants</p>
          </CardHeader>
          <CardBody>
            {regularUsers.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                }
                title="No Users"
                description="No users have signed up yet"
              />
            ) : (
              <StaggerContainer className="space-y-4">
                {regularUsers.map((user) => (
                  <StaggerItem key={user.id}>
                    <motion.div
                      onClick={() => {
                        setSelectedUserId(user.id)
                        setIsProfileModalOpen(true)
                      }}
                      whileHover={cardHover}
                      whileTap={cardTap}
                      className="p-4 bg-bg-tertiary rounded-lg border border-bg-tertiary hover:border-electric-blue transition-all cursor-pointer"
                    >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar 
                          username={user.username}
                          src={user.avatarUrl}
                          size="md"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-semibold">{user.username}</h3>
                            {user.bannedUntil && new Date(user.bannedUntil) > new Date() && (
                              <Badge variant="default" size="sm" className="bg-neon-orange text-black">
                                Suspended
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-text-secondary">{user.email}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
                            <span>ELO: {user.eloRating}</span>
                            <span>•</span>
                            <span>{user.totalDebates} debates</span>
                            <span>•</span>
                            <span className="text-cyber-green">{user.debatesWon}W</span>
                            <span className="text-neon-orange">{user.debatesLost}L</span>
                            <span className="text-yellow-500">{user.debatesTied || 0}T</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-text-secondary mr-4">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSuspendUser(user.id, user.bannedUntil)}
                            className="text-xs"
                          >
                            {user.bannedUntil && new Date(user.bannedUntil) > new Date() ? 'Unsuspend' : 'Suspend'}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-xs text-red-400 hover:text-red-300 hover:border-red-400"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </CardBody>
        </Card>
        </div>
      </div>

      <AddEmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchUsers}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false)
          setSelectedUserId(null)
        }}
        userId={selectedUserId}
      />

      <AIUserModal
        isOpen={isAIUserModalOpen}
        onClose={() => {
          setIsAIUserModalOpen(false)
          setEditingAIUser(null)
        }}
        onSuccess={fetchUsers}
        editingUser={editingAIUser ? {
          id: editingAIUser.id,
          username: editingAIUser.username,
          avatarUrl: editingAIUser.avatarUrl,
          aiPersonality: editingAIUser.aiPersonality || 'BALANCED',
          aiResponseDelay: editingAIUser.aiResponseDelay || 3600000,
          aiPaused: editingAIUser.aiPaused || false,
        } : null}
      />

      {/* Action Confirmation Modal */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => {
          if (!isProcessing) {
            setIsActionModalOpen(false)
            setActionUserId(null)
            setActionType(null)
            setSuspendDays('7')
          }
        }}
        title={
          actionType === 'delete'
            ? 'Delete User'
            : actionType === 'suspend'
            ? 'Suspend User'
            : 'Unsuspend User'
        }
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            {actionType === 'delete' && (
              <>
                Are you sure you want to permanently delete this user? This action cannot be undone.
                All user data, debates, and related information will be permanently removed.
              </>
            )}
            {actionType === 'suspend' && (
              <>
                Suspend this user from debating. They will still be able to log in and browse the platform,
                but will not be able to create or accept debate challenges.
              </>
            )}
            {actionType === 'unsuspend' && (
              <>
                Are you sure you want to unsuspend this user? They will regain the ability to debate.
              </>
            )}
          </p>
          {actionType === 'suspend' && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Suspension Duration (Days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={suspendDays}
                onChange={(e) => setSuspendDays(e.target.value)}
                className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
                placeholder="Enter number of days"
                disabled={isProcessing}
              />
              <p className="text-xs text-text-secondary mt-1">
                User will be suspended from debating for the specified number of days
              </p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-bg-tertiary">
            <Button
              variant="secondary"
              onClick={() => {
                setIsActionModalOpen(false)
                setActionUserId(null)
                setActionType(null)
                setSuspendDays('7')
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'delete' ? 'danger' : 'primary'}
              onClick={confirmAction}
              isLoading={isProcessing}
            >
              {actionType === 'delete' ? 'Delete User' : actionType === 'suspend' ? 'Suspend User' : 'Unsuspend User'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

