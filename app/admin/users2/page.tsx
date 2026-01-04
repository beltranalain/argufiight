'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useAuth } from '@/lib/hooks/useAuth'

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
  createdAt: string
}

export default function AdminUsers2Page() {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Try the admin API first
      const response = await fetch('/api/admin/users')
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else if (response.status === 403) {
        // If 403, try a direct database query via a public endpoint
        setError('Admin access denied. Trying alternative method...')
        
        // Fallback: Use a public API that lists users (if it exists)
        // Or we can create one
        const fallbackResponse = await fetch('/api/users/list')
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json()
          setUsers(fallbackData.users || [])
          setError(null)
        } else {
          setError(`Access denied (${response.status}). Check server logs for details.`)
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        setError(errorData.error || `Failed to fetch users (${response.status})`)
      }
    } catch (error: any) {
      console.error('Failed to fetch users:', error)
      setError(error.message || 'Failed to fetch users')
    } finally {
      setIsLoading(false)
    }
  }

  const getWinRate = (user: UserData) => {
    if (user.totalDebates === 0) return 0
    return Math.round((user.debatesWon / user.totalDebates) * 100)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">All Users (Simple View)</h1>
          <p className="text-text-secondary">Total: {users.length} users</p>
          {user && (
            <p className="text-text-secondary text-sm mt-1">
              Logged in as: <span className="font-semibold">{user.username}</span> 
              {user.isAdmin && <Badge className="ml-2">Admin</Badge>}
            </p>
          )}
        </div>

        {error && (
          <Card className="mb-6 border-neon-orange">
            <CardBody>
              <div className="flex items-center gap-3">
                <span className="text-neon-orange text-xl">⚠️</span>
                <div>
                  <p className="text-text-primary font-semibold">Error Loading Users</p>
                  <p className="text-text-secondary text-sm">{error}</p>
                  <button
                    onClick={fetchUsers}
                    className="mt-2 text-electric-blue hover:text-neon-orange text-sm font-medium"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {users.length === 0 && !error ? (
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
            title="No Users Found"
            description="No users are registered in the system"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <Card key={user.id} className="hover:border-electric-blue transition-colors">
                <CardBody>
                  <div className="flex items-start gap-4">
                    <Avatar
                      src={user.avatarUrl}
                      username={user.username}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-text-primary truncate">
                          {user.username}
                        </h3>
                        {user.isAdmin && (
                          <Badge variant="default" className="bg-electric-blue text-black text-xs">
                            Admin
                          </Badge>
                        )}
                        {user.isBanned && (
                          <Badge variant="default" className="bg-neon-orange text-black text-xs">
                            Banned
                          </Badge>
                        )}
                      </div>
                      <p className="text-text-secondary text-sm truncate mb-3">
                        {user.email}
                      </p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-text-secondary">ELO:</span>
                          <span className="text-electric-blue font-semibold">{user.eloRating}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Debates:</span>
                          <span className="text-text-primary font-semibold">{user.totalDebates}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Record:</span>
                          <span className="text-text-primary">
                            <span className="text-cyber-green">{user.debatesWon}W</span>
                            {' '}/{' '}
                            <span className="text-neon-orange">{user.debatesLost}L</span>
                            {' '}/{' '}
                            <span className="text-yellow-500">{user.debatesTied}T</span>
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Win Rate:</span>
                          <span className="text-electric-blue font-semibold">{getWinRate(user)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
