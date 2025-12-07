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
import { LoadingSpinner } from '@/components/ui/Loading'
import { StaggerContainer } from '@/components/ui/StaggerContainer'
import { StaggerItem } from '@/components/ui/StaggerItem'
import { cardHover, cardTap } from '@/lib/animations'

interface UserData {
  id: string
  username: string
  email: string
  avatarUrl: string | null
  eloRating: number
  totalDebates: number
  debatesWon: number
  isAdmin: boolean
  isBanned: boolean
  employeeRole: string | null
  accessLevel: string | null
  createdAt: string
}

export default function AdminUsersPage() {
  const [userData, setUserData] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUserData(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Separate employees (admins) from regular users
  const employees = userData.filter(user => user.isAdmin)
  const regularUsers = userData.filter(user => !user.isAdmin)

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
            <h1 className="text-4xl font-bold text-white mb-2">User Management</h1>
            <p className="text-text-secondary">Manage platform users and employees</p>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
          >
            Add Employee
          </Button>
        </div>

        <div className="space-y-6">
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
                      <div className="flex items-center gap-4">
                        <Avatar 
                          username={user.username}
                          src={user.avatarUrl}
                          size="md"
                        />
                        <div>
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
                            {user.isBanned && (
                              <Badge variant="default" size="sm" className="bg-neon-orange text-black">
                                Banned
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-text-secondary">{user.email}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
                            <span>ELO: {user.eloRating}</span>
                            <span>•</span>
                            <span>{user.totalDebates} debates</span>
                            <span>•</span>
                            <span>{user.debatesWon} wins</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-text-secondary">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
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
                      <div className="flex items-center gap-4">
                        <Avatar 
                          username={user.username}
                          src={user.avatarUrl}
                          size="md"
                        />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-semibold">{user.username}</h3>
                            {user.isBanned && (
                              <Badge variant="default" size="sm" className="bg-neon-orange text-black">
                                Banned
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-text-secondary">{user.email}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
                            <span>ELO: {user.eloRating}</span>
                            <span>•</span>
                            <span>{user.totalDebates} debates</span>
                            <span>•</span>
                            <span>{user.debatesWon} wins</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-text-secondary">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
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
    </>
  )
}

