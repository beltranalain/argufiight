'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { StaggerContainer } from '@/components/ui/StaggerContainer'
import { StaggerItem } from '@/components/ui/StaggerItem'
import { cardHover, cardTap } from '@/lib/animations'
import { useToast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/lib/hooks/useAuth'
import { fetchClient } from '@/lib/api/fetchClient'

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
  googleId: string | null
  coins?: number
  consecutiveLoginDays?: number
  longestLoginStreak?: number
  totalLoginDays?: number
  lastLoginDate?: string | null
  isAI?: boolean
  aiPersonality?: string | null
  aiResponseDelay?: number | null
  aiPaused?: boolean
  subscription?: { tier: string; status: string; billingCycle: string | null } | null
  isCreator?: boolean
  creatorStatus?: string | null
  creatorSince?: string | null
}

interface UserLimitInfo {
  userLimit: number
  currentUserCount: number
  waitingListCount: number
  isLimited: boolean
}

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <title>Signed up with Google</title>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

function UserRow({ user, onViewProfile, onSuspend, onDelete, onToggleCreator, isCreatorProcessing, isSuperAdmin, showCheckbox, isSelected, onSelect }: {
  user: UserData
  onViewProfile?: () => void
  onSuspend?: () => void
  onDelete: () => void
  onToggleCreator: () => void
  isCreatorProcessing: boolean
  isSuperAdmin?: boolean
  showCheckbox?: boolean
  isSelected?: boolean
  onSelect?: () => void
}) {
  const isSuspended = user.bannedUntil && new Date(user.bannedUntil) > new Date()

  return (
    <motion.div
      onClick={onViewProfile}
      whileHover={cardHover}
      whileTap={cardTap}
      className={`p-4 bg-bg-tertiary rounded-lg border border-bg-tertiary hover:border-electric-blue transition-all ${onViewProfile ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {showCheckbox && (
            <input type="checkbox" checked={isSelected} onChange={onSelect} onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded border-bg-tertiary bg-bg-tertiary text-electric-blue focus:ring-electric-blue focus:ring-2 flex-shrink-0" />
          )}
          <Avatar username={user.username} src={user.avatarUrl} size="md" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-white font-semibold">{user.username}</h3>
              {user.googleId && <GoogleIcon />}
              {user.isAI && <Badge variant="default" size="sm" className="bg-purple-500 text-white">AI User</Badge>}
              {user.aiPersonality && <Badge variant="default" size="sm" className="bg-electric-blue text-black">{user.aiPersonality}</Badge>}
              {user.aiPaused && <Badge variant="default" size="sm" className="bg-neon-orange text-black">Paused</Badge>}
              {(user.isAdmin || user.employeeRole) && !user.isAI && (
                <Badge variant="default" size="sm" className="bg-electric-blue text-black">Employee</Badge>
              )}
              {user.employeeRole && <Badge variant="default" size="sm" className="bg-cyber-green text-black">{user.employeeRole}</Badge>}
              {user.accessLevel && <Badge variant="default" size="sm" className="bg-hot-pink text-black">{user.accessLevel}</Badge>}
              {user.subscription?.tier === 'PRO' && user.subscription?.status === 'ACTIVE' && (
                <Badge variant="default" size="sm" className="bg-electric-blue/20 text-electric-blue border border-electric-blue/30">PRO</Badge>
              )}
              {isSuspended && <Badge variant="default" size="sm" className="bg-neon-orange text-black">Suspended</Badge>}
              {user.isCreator && (
                <Badge variant="default" size="sm" className="bg-electric-blue text-black">Creator ({user.creatorStatus || 'N/A'})</Badge>
              )}
            </div>
            <p className="text-sm text-text-secondary">{user.email}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary flex-wrap">
              <span>ELO: {user.eloRating}</span>
              <span>•</span>
              <span>{user.totalDebates} debates</span>
              <span>•</span>
              <label className="flex items-center gap-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" checked={user.isCreator || false} onChange={onToggleCreator} disabled={isCreatorProcessing}
                  className="w-4 h-4 rounded border-bg-tertiary bg-bg-tertiary text-electric-blue focus:ring-electric-blue focus:ring-2" />
                <span className="text-xs text-text-secondary">Creator Mode</span>
              </label>
              <span>•</span>
              <span>Coins: {user.coins?.toLocaleString() || 0}</span>
              {user.isAI && user.aiResponseDelay !== undefined && (
                <>
                  <span>•</span>
                  <span>Auto-accept: {user.aiResponseDelay! < 3600000 ? `${Math.round(user.aiResponseDelay! / 60000)} min` : `${Math.round(user.aiResponseDelay! / 3600000)} hours`}</span>
                </>
              )}
              {!user.isAI && (
                <>
                  <span>•</span>
                  <span className="text-cyber-green">{user.debatesWon}W</span>
                  <span className="text-neon-orange">{user.debatesLost}L</span>
                  <span className="text-yellow-500">{user.debatesTied || 0}T</span>
                </>
              )}
            </div>
            {(user.consecutiveLoginDays !== undefined || user.longestLoginStreak !== undefined) && (
              <div className="flex items-center gap-4 mt-1 text-xs text-text-secondary">
                {user.consecutiveLoginDays !== undefined && <><span>Streak: {user.consecutiveLoginDays} days</span><span>•</span></>}
                {user.longestLoginStreak !== undefined && (
                  <>
                    <span>Best: {user.longestLoginStreak} days</span>
                    {user.totalLoginDays !== undefined && <><span>•</span><span>Total: {user.totalLoginDays} logins</span></>}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-text-secondary mr-4">Joined {new Date(user.createdAt).toLocaleDateString()}</div>
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {onSuspend && (
              <Button variant="secondary" size="sm" onClick={onSuspend} className="text-xs"
                disabled={isSuperAdmin === false && (user.isAdmin || !!user.employeeRole)}
                title={isSuperAdmin === false && (user.isAdmin || !!user.employeeRole) ? 'Only super admin can suspend admin users' : undefined}>
                {isSuspended ? 'Unsuspend' : 'Suspend'}
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={onDelete} className="text-xs text-red-400 hover:text-red-300 hover:border-red-400"
              disabled={isSuperAdmin === false && (user.isAdmin || !!user.employeeRole)}
              title={isSuperAdmin === false && (user.isAdmin || !!user.employeeRole) ? 'Only super admin can delete admin users' : undefined}>
              Delete
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function AdminUsersPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()
  const isSuperAdmin = currentUser?.email === 'admin@argufight.com'

  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false)
  const [isAIUserModalOpen, setIsAIUserModalOpen] = useState(false)
  const [editingAIUser, setEditingAIUser] = useState<UserData | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [actionUserId, setActionUserId] = useState<string | null>(null)
  const [actionType, setActionType] = useState<'suspend' | 'unsuspend' | 'delete' | null>(null)
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)
  const [suspendDays, setSuspendDays] = useState('7')
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false)

  const { data: allUsers = [], isLoading, isError, refetch } = useQuery<UserData[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const data = await fetchClient<{ users: UserData[] }>('/api/admin/users')
      return data.users || []
    },
    staleTime: 60_000,
  })

  const { data: userLimitInfo } = useQuery<UserLimitInfo>({
    queryKey: ['admin-user-limit'],
    queryFn: () => fetchClient<UserLimitInfo>('/api/admin/settings/user-limit'),
    staleTime: 300_000,
  })

  const aiUsers = useMemo(() => allUsers.filter(u => u.isAI), [allUsers])
  const employees = useMemo(() => allUsers.filter(u => !u.isAI && (u.isAdmin || u.employeeRole)), [allUsers])
  const regularUsers = useMemo(() => allUsers.filter(u => !u.isAI && !u.isAdmin && !u.employeeRole), [allUsers])

  const invalidateUsers = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    queryClient.invalidateQueries({ queryKey: ['admin-user-limit'] })
  }

  const actionMutation = useMutation({
    mutationFn: async ({ userId, type, days }: { userId: string; type: 'delete' | 'suspend' | 'unsuspend'; days?: number }) => {
      if (type === 'delete') {
        return fetchClient(`/api/admin/users/${userId}`, { method: 'DELETE' })
      }
      return fetchClient(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ suspendDays: type === 'suspend' ? days : 0 }),
      })
    },
    onSuccess: (_, vars) => {
      const msg = vars.type === 'delete' ? 'User deleted' : vars.type === 'suspend' ? 'User suspended' : 'User unsuspended'
      showToast({ type: 'success', title: msg })
      if (vars.type === 'delete' && selectedUserId === vars.userId) {
        setIsProfileModalOpen(false)
        setSelectedUserId(null)
      }
      setIsActionModalOpen(false)
      setActionUserId(null)
      setActionType(null)
      setSuspendDays('7')
      invalidateUsers()
    },
    onError: (error: any) => {
      showToast({ type: 'error', title: 'Action Failed', description: error.message || 'Failed to perform action' })
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (userIds: string[]) =>
      fetchClient('/api/admin/users/bulk-delete', { method: 'POST', body: JSON.stringify({ userIds }) }),
    onSuccess: () => {
      showToast({ type: 'success', title: 'Users Deleted', description: `${selectedUserIds.size} user(s) deleted` })
      setSelectedUserIds(new Set())
      setIsBulkDeleteModalOpen(false)
      invalidateUsers()
    },
    onError: (error: any) => {
      showToast({ type: 'error', title: 'Deletion Failed', description: error.message || 'Failed to delete users' })
    },
  })

  const toggleCreatorMutation = useMutation({
    mutationFn: ({ userId, enabled }: { userId: string; enabled: boolean }) =>
      fetchClient(`/api/admin/users/${userId}/creator/toggle`, { method: 'POST', body: JSON.stringify({ enabled }) }),
    onSuccess: (_, vars) => {
      showToast({ type: 'success', title: 'Creator Mode Updated', description: `Creator mode ${vars.enabled ? 'enabled' : 'disabled'}` })
      invalidateUsers()
    },
    onError: (error: any) => {
      showToast({ type: 'error', title: 'Update Failed', description: error.message || 'Failed to toggle creator mode' })
    },
  })

  const togglePauseMutation = useMutation({
    mutationFn: (userId: string) =>
      fetchClient(`/api/admin/ai-users/${userId}/toggle-pause`, { method: 'POST' }),
    onSuccess: () => {
      showToast({ type: 'success', title: 'Success', description: 'AI user pause toggled' })
      invalidateUsers()
    },
    onError: () => {
      showToast({ type: 'error', title: 'Error', description: 'Failed to toggle pause' })
    },
  })

  const handleSuspendUser = (userId: string, bannedUntil: string | null) => {
    setActionUserId(userId)
    setActionType(bannedUntil && new Date(bannedUntil) > new Date() ? 'unsuspend' : 'suspend')
    setSuspendDays('7')
    setIsActionModalOpen(true)
  }

  const handleDeleteUser = (userId: string) => {
    setActionUserId(userId)
    setActionType('delete')
    setIsActionModalOpen(true)
  }

  const confirmAction = () => {
    if (!actionUserId || !actionType) return
    if (actionType === 'suspend') {
      const days = parseInt(suspendDays)
      if (isNaN(days) || days <= 0) {
        showToast({ type: 'error', title: 'Invalid', description: 'Please enter a valid number of days' })
        return
      }
      actionMutation.mutate({ userId: actionUserId, type: 'suspend', days })
    } else {
      actionMutation.mutate({ userId: actionUserId, type: actionType })
    }
  }

  const handleSelectUser = (userId: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev)
      next.has(userId) ? next.delete(userId) : next.add(userId)
      return next
    })
  }

  const handleSelectAll = () => {
    setSelectedUserIds(prev =>
      prev.size === regularUsers.length ? new Set() : new Set(regularUsers.map(u => u.id))
    )
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><LoadingSpinner size="lg" /></div>
  }

  if (isError) {
    return <ErrorDisplay title="Failed to load users" onRetry={() => refetch()} />
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
                  <Badge variant="default" size="sm" className={`border ${userLimitInfo.waitingListCount > 0 ? 'bg-neon-orange/20 text-neon-orange border-neon-orange/30' : 'bg-bg-tertiary text-text-secondary border-bg-tertiary'}`}>
                    {userLimitInfo.waitingListCount} Waiting
                  </Badge>
                </div>
              )}
            </div>
            <p className="text-text-secondary">Manage platform users and employees</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => window.location.href = '/admin/users/user-limit'}>User Limit Settings</Button>
            <Button variant="secondary" onClick={() => { setEditingAIUser(null); setIsAIUserModalOpen(true) }}>Create AI User</Button>
            <Button variant="primary" onClick={() => setIsEmployeeModalOpen(true)}>Add Employee</Button>
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
                <Button variant="secondary" size="sm" onClick={() => { setEditingAIUser(null); setIsAIUserModalOpen(true) }}>Create AI User</Button>
              </div>
            </CardHeader>
            <CardBody>
              {aiUsers.length === 0 ? (
                <EmptyState icon={<svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
                  title="No AI Users" description="Create AI users to automatically accept challenges and participate in debates" />
              ) : (
                <StaggerContainer className="space-y-4">
                  {aiUsers.map((user) => (
                    <StaggerItem key={user.id}>
                      <UserRow user={user}
                        onDelete={() => handleDeleteUser(user.id)}
                        onToggleCreator={() => toggleCreatorMutation.mutate({ userId: user.id, enabled: !user.isCreator })}
                        isCreatorProcessing={toggleCreatorMutation.isPending}
                      />
                      <div className="flex gap-2 mt-2 pl-16" onClick={(e) => e.stopPropagation()}>
                        <Button variant="secondary" size="sm" className="text-xs"
                          onClick={() => { setEditingAIUser(user); setIsAIUserModalOpen(true) }}>Edit</Button>
                        <Button variant="secondary" size="sm" className="text-xs"
                          onClick={() => togglePauseMutation.mutate(user.id)}>
                          {user.aiPaused ? 'Resume' : 'Pause'}
                        </Button>
                      </div>
                    </StaggerItem>
                  ))}
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
                      <UserRow user={user}
                        onViewProfile={() => { setSelectedUserId(user.id); setIsProfileModalOpen(true) }}
                        onSuspend={() => handleSuspendUser(user.id, user.bannedUntil)}
                        onDelete={() => handleDeleteUser(user.id)}
                        onToggleCreator={() => toggleCreatorMutation.mutate({ userId: user.id, enabled: !user.isCreator })}
                        isCreatorProcessing={toggleCreatorMutation.isPending}
                        isSuperAdmin={isSuperAdmin}
                      />
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </CardBody>
            </Card>
          )}

          {/* Regular Users Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">All Users</h2>
                  <p className="text-sm text-text-secondary mt-1">Platform users and participants</p>
                </div>
                {regularUsers.length > 0 && (
                  <div className="flex items-center gap-3">
                    {selectedUserIds.size > 0 && (
                      <Button variant="danger" size="sm" onClick={() => setIsBulkDeleteModalOpen(true)}>
                        Delete Selected ({selectedUserIds.size})
                      </Button>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary hover:text-white transition-colors">
                      <input type="checkbox" checked={regularUsers.length > 0 && selectedUserIds.size === regularUsers.length}
                        onChange={handleSelectAll} className="w-4 h-4 rounded border-bg-tertiary bg-bg-tertiary text-electric-blue focus:ring-electric-blue focus:ring-2" />
                      <span>Select All</span>
                    </label>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardBody>
              {regularUsers.length === 0 ? (
                <EmptyState icon={<svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                  title="No Users" description="No users have signed up yet" />
              ) : (
                <StaggerContainer className="space-y-4">
                  {regularUsers.map((user) => (
                    <StaggerItem key={user.id}>
                      <UserRow user={user}
                        onViewProfile={() => { setSelectedUserId(user.id); setIsProfileModalOpen(true) }}
                        onSuspend={() => handleSuspendUser(user.id, user.bannedUntil)}
                        onDelete={() => handleDeleteUser(user.id)}
                        onToggleCreator={() => toggleCreatorMutation.mutate({ userId: user.id, enabled: !user.isCreator })}
                        isCreatorProcessing={toggleCreatorMutation.isPending}
                        showCheckbox isSelected={selectedUserIds.has(user.id)} onSelect={() => handleSelectUser(user.id)}
                      />
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <AddEmployeeModal isOpen={isEmployeeModalOpen} onClose={() => setIsEmployeeModalOpen(false)} onSuccess={invalidateUsers} />
      <UserProfileModal isOpen={isProfileModalOpen} onClose={() => { setIsProfileModalOpen(false); setSelectedUserId(null) }} userId={selectedUserId} />
      <AIUserModal isOpen={isAIUserModalOpen} onClose={() => { setIsAIUserModalOpen(false); setEditingAIUser(null) }} onSuccess={invalidateUsers}
        editingUser={editingAIUser ? { id: editingAIUser.id, username: editingAIUser.username, avatarUrl: editingAIUser.avatarUrl, aiPersonality: editingAIUser.aiPersonality || 'BALANCED', aiResponseDelay: editingAIUser.aiResponseDelay || 3600000, aiPaused: editingAIUser.aiPaused || false } : null} />

      {/* Action Confirmation Modal */}
      <Modal isOpen={isActionModalOpen} onClose={() => { if (!actionMutation.isPending) { setIsActionModalOpen(false); setActionUserId(null); setActionType(null); setSuspendDays('7') } }}
        title={actionType === 'delete' ? 'Delete User' : actionType === 'suspend' ? 'Suspend User' : 'Unsuspend User'}>
        <div className="space-y-4">
          <p className="text-text-secondary">
            {actionType === 'delete' && 'Are you sure you want to permanently delete this user? This action cannot be undone. All user data, debates, and related information will be permanently removed.'}
            {actionType === 'suspend' && 'Suspend this user from debating. They will still be able to log in and browse the platform, but will not be able to create or accept debate challenges.'}
            {actionType === 'unsuspend' && 'Are you sure you want to unsuspend this user? They will regain the ability to debate.'}
          </p>
          {actionType === 'suspend' && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">Suspension Duration (Days)</label>
              <input type="number" min="1" max="365" value={suspendDays} onChange={(e) => setSuspendDays(e.target.value)}
                className="w-full px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
                placeholder="Enter number of days" disabled={actionMutation.isPending} />
              <p className="text-xs text-text-secondary mt-1">User will be suspended from debating for the specified number of days</p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-bg-tertiary">
            <Button variant="secondary" onClick={() => { setIsActionModalOpen(false); setActionUserId(null); setActionType(null); setSuspendDays('7') }}
              disabled={actionMutation.isPending}>Cancel</Button>
            <Button variant={actionType === 'delete' ? 'danger' : 'primary'} onClick={confirmAction} isLoading={actionMutation.isPending}>
              {actionType === 'delete' ? 'Delete User' : actionType === 'suspend' ? 'Suspend User' : 'Unsuspend User'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <Modal isOpen={isBulkDeleteModalOpen} onClose={() => { if (!bulkDeleteMutation.isPending) setIsBulkDeleteModalOpen(false) }} title="Delete Selected Users">
        <div className="space-y-4">
          <p className="text-text-secondary">Are you sure you want to permanently delete {selectedUserIds.size} user(s)? This action cannot be undone.</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-bg-tertiary">
            <Button variant="secondary" onClick={() => setIsBulkDeleteModalOpen(false)} disabled={bulkDeleteMutation.isPending}>Cancel</Button>
            <Button variant="danger" onClick={() => bulkDeleteMutation.mutate(Array.from(selectedUserIds))} isLoading={bulkDeleteMutation.isPending}>
              Delete {selectedUserIds.size} User(s)
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
