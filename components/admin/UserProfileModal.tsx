'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Button } from '@/components/ui/Button'

interface UserProfile {
  id: string
  username: string
  email: string
  avatarUrl: string | null
  bio: string | null
  eloRating: number
  debatesWon: number
  debatesLost: number
  debatesTied: number
  totalDebates: number
  winRate: number
  isAdmin: boolean
  isBanned: boolean
  employeeRole: string | null
  accessLevel: string | null
  createdAt: string
}

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string | null
}

export function UserProfileModal({ isOpen, onClose, userId }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfile()
    } else {
      setProfile(null)
    }
  }, [isOpen, userId])

  const fetchProfile = async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      // Fetch full user profile (admin can see all details)
      const response = await fetch(`/api/admin/users/${userId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.user) {
        setProfile(data.user)
        } else {
          // Handle case where API returns user directly (backward compatibility)
          setProfile(data)
        }
      } else {
        // If user not found (404), close the modal
        if (response.status === 404) {
          console.log('User not found, closing modal')
          onClose()
          setProfile(null)
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          console.error('Failed to fetch user profile:', errorData.error || 'Request failed')
          setProfile(null)
        }
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !userId) return null

  const joinDate = profile
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Profile">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : profile ? (
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <Avatar
                src={profile.avatarUrl}
                username={profile.username}
                size="xl"
              />
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {profile.username}
                  </h2>
                  <p className="text-text-secondary mb-2">{profile.email}</p>
                  <p className="text-sm text-text-secondary">
                    Member since {joinDate}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="default" className="text-lg px-4 py-2 bg-electric-blue text-black">
                    ELO {profile.eloRating}
                  </Badge>
                  {profile.isAdmin && (
                    <Badge variant="default" size="sm" className="bg-electric-blue text-black">
                      Employee
                    </Badge>
                  )}
                  {profile.isBanned && (
                    <Badge variant="default" size="sm" className="bg-neon-orange text-black">
                      Banned
                    </Badge>
                  )}
                </div>
              </div>

              {/* Employee Info */}
              {profile.isAdmin && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {profile.employeeRole && (
                    <Badge variant="default" size="sm" className="bg-cyber-green text-black">
                      {profile.employeeRole}
                    </Badge>
                  )}
                  {profile.accessLevel && (
                    <Badge variant="default" size="sm" className="bg-hot-pink text-black">
                      {profile.accessLevel}
                    </Badge>
                  )}
                </div>
              )}

              {/* Bio */}
              {profile.bio && (
                <p className="text-text-secondary mb-4">{profile.bio}</p>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-bg-tertiary rounded-lg p-4">
                  <p className="text-text-secondary text-sm mb-1">Total</p>
                  <p className="text-2xl font-bold text-white">
                    {profile.totalDebates}
                  </p>
                </div>
                <div className="bg-bg-tertiary rounded-lg p-4">
                  <p className="text-text-secondary text-sm mb-1">Wins</p>
                  <p className="text-2xl font-bold text-cyber-green">
                    {profile.debatesWon}
                  </p>
                </div>
                <div className="bg-bg-tertiary rounded-lg p-4">
                  <p className="text-text-secondary text-sm mb-1">Losses</p>
                  <p className="text-2xl font-bold text-neon-orange">
                    {profile.debatesLost}
                  </p>
                </div>
                <div className="bg-bg-tertiary rounded-lg p-4">
                  <p className="text-text-secondary text-sm mb-1">Win Rate</p>
                  <p className="text-2xl font-bold text-electric-blue">
                    {profile.winRate}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="border-t border-bg-tertiary pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-text-secondary mb-1">User ID</p>
                <p className="text-white font-mono text-sm">
                  {profile.id.substring(0, 8).toUpperCase()}
                </p>
                <p className="text-xs text-text-muted mt-1 font-mono">
                  Full: {profile.id}
                </p>
              </div>
              <div>
                <p className="text-text-secondary mb-1">Account Status</p>
                <p className="text-white">
                  {profile.isBanned ? 'Banned' : 'Active'}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-text-secondary">Failed to load user profile</p>
        </div>
      )}
    </Modal>
  )
}

