'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import { BattleHistory } from '@/components/profile/BattleHistory'
import { PastDebates } from '@/components/profile/PastDebates'
import { CreatorCTA } from '@/components/profile/CreatorCTA'
import { AdDisplay } from '@/components/ads/AdDisplay'

interface UserProfile {
  id: string
  email?: string
  username: string
  avatarUrl: string | null
  bio: string | null
  eloRating: number
  debatesWon: number
  debatesLost: number
  debatesTied: number
  totalDebates: number
  totalScore: number
  totalMaxScore: number
  totalWordCount: number
  totalStatements: number
  averageWordCount: number
  averageRounds: number
  createdAt: string
  subscription?: {
    tier: 'FREE' | 'PRO'
  }
}

interface TournamentStats {
  totalTournaments: number
  completedTournaments: number
  activeTournaments: number
  championships: number
  totalTournamentWins: number
  totalTournamentLosses: number
  winRate: number
  bestFinish: number
}

export default function UsernameProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string
  const { user: currentUser, refetch } = useAuth()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [tournamentStats, setTournamentStats] = useState<TournamentStats | null>(null)
  const isOwnProfile = currentUser?.username === username

  useEffect(() => {
    if (username) {
      fetchProfile()
      if (isOwnProfile) {
        fetchTournamentStats()
      }
    }
  }, [username, isOwnProfile])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/users/username/${username}/profile`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
        if (isOwnProfile) {
          setFormData({
            username: data.user.username || '',
            bio: data.user.bio || '',
          })
          setAvatarPreview(data.user.avatarUrl)
        }
      } else if (response.status === 404) {
        router.push('/')
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTournamentStats = async () => {
    try {
      const response = await fetch('/api/profile/tournament-stats')
      if (response.ok) {
        const data = await response.json()
        setTournamentStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch tournament stats:', error)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast({
          type: 'error',
          title: 'Invalid File',
          description: 'Please select an image file',
        })
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        showToast({
          type: 'error',
          title: 'File Too Large',
          description: 'Image must be less than 5MB',
        })
        return
      }

      setAvatarFile(file)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadAvatar = async () => {
    if (!avatarFile) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', avatarFile)

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload avatar')
      }

      const data = await response.json()
      setAvatarPreview(data.avatarUrl)
      setAvatarFile(null)
      
      showToast({
        type: 'success',
        title: 'Avatar Updated',
        description: 'Your profile picture has been updated',
      })

      refetch()
      fetchProfile()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Upload Failed',
        description: error.message || 'Failed to upload avatar',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
      }

      showToast({
        type: 'success',
        title: 'Profile Updated',
        description: 'Your profile has been saved',
      })

      refetch()
      // If username changed, redirect to new username
      const data = await response.json()
      if (data.user?.username && data.user.username !== username) {
        router.push(`/${data.user.username}`)
      } else {
        fetchProfile()
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Save Failed',
        description: error.message || 'Failed to update profile',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="PROFILE" />
        <div className="pt-20 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const winRate = profile.totalDebates > 0 
    ? ((profile.debatesWon / profile.totalDebates) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="PROFILE" />
      
      <div className="pt-24 px-4 md:px-8 pb-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Profile Banner Ad */}
          {profile && (
            <AdDisplay
              placement="PROFILE_BANNER"
              userId={profile.id}
              context={isOwnProfile ? "own-profile" : "other-profile"}
            />
          )}

          {/* Profile Header */}
          <Card>
            <CardBody>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Avatar
                      src={avatarPreview || profile.avatarUrl}
                      username={profile.username}
                      size="xl"
                    />
                    {avatarFile && isOwnProfile && (
                      <div className="absolute inset-0 bg-bg-primary/50 rounded-full flex items-center justify-center">
                        <span className="text-text-primary text-xs">New</span>
                      </div>
                    )}
                  </div>
                  
                  {isOwnProfile && (
                    <div className="flex flex-col gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change Photo
                      </Button>
                      {avatarFile && (
                        <Button
                          variant="primary"
                          onClick={handleUploadAvatar}
                          isLoading={isUploading}
                        >
                          Upload
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold text-text-primary mb-2">{profile.username}</h1>
                    {isOwnProfile && profile.email && (
                      <p className="text-text-secondary">{profile.email}</p>
                    )}
                  </div>

                  {/* ELO and Overall Score */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 bg-electric-blue/20 border border-electric-blue/30 rounded-lg px-6 py-4">
                      <p className="text-xs text-text-secondary mb-1">ELO Rating</p>
                      <p className="text-3xl font-bold text-electric-blue">{profile.eloRating || 1200}</p>
                      <p className="text-xs text-text-muted mt-1">Current rating</p>
                    </div>
                    {profile.totalMaxScore > 0 ? (
                      <div className="flex-1 bg-cyber-green/20 border border-cyber-green/30 rounded-lg px-6 py-4">
                        <p className="text-xs text-text-secondary mb-1">Overall Score</p>
                        <p className="text-3xl font-bold text-cyber-green">
                          {profile.totalScore.toLocaleString()}/{profile.totalMaxScore.toLocaleString()}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          {Math.round((profile.totalScore / profile.totalMaxScore) * 100)}% average
                        </p>
                      </div>
                    ) : (
                      <div className="flex-1 bg-bg-tertiary border border-bg-secondary rounded-lg px-6 py-4">
                        <p className="text-xs text-text-secondary mb-1">Overall Score</p>
                        <p className="text-3xl font-bold text-text-secondary">N/A</p>
                        <p className="text-xs text-text-muted mt-1">No completed debates yet</p>
                      </div>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-bg-tertiary rounded-lg p-3">
                      <p className="text-xs text-text-secondary mb-1">Total</p>
                      <p className="text-xl font-bold text-text-primary">{profile.totalDebates || 0}</p>
                    </div>
                    <div className="bg-bg-tertiary rounded-lg p-3">
                      <p className="text-xs text-text-secondary mb-1">Wins</p>
                      <p className="text-xl font-bold text-cyber-green">{profile.debatesWon || 0}</p>
                    </div>
                    <div className="bg-bg-tertiary rounded-lg p-3">
                      <p className="text-xs text-text-secondary mb-1">Losses</p>
                      <p className="text-xl font-bold text-neon-orange">{profile.debatesLost || 0}</p>
                    </div>
                    <div className="bg-bg-tertiary rounded-lg p-3">
                      <p className="text-xs text-text-secondary mb-1">Ties</p>
                      <p className="text-xl font-bold text-text-muted">{profile.debatesTied || 0}</p>
                    </div>
                    <div className="bg-bg-tertiary rounded-lg p-3">
                      <p className="text-xs text-text-secondary mb-1">Win Rate</p>
                      <p className="text-xl font-bold text-electric-blue">{winRate}%</p>
                    </div>
                  </div>

                  {/* Deep Analytics Section */}
                  <div className="mt-6 pt-6 border-t border-bg-tertiary">
                    <h3 className="text-lg font-bold text-text-primary mb-4">Performance Analytics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-bg-tertiary rounded-lg p-4 border border-bg-secondary">
                        <p className="text-text-secondary text-sm mb-1">Total Words</p>
                        <p className="text-2xl font-bold text-text-primary">
                          {profile.totalWordCount?.toLocaleString() || 0}
                        </p>
                        <p className="text-xs text-text-muted mt-1">Across all debates</p>
                      </div>
                      <div className="bg-bg-tertiary rounded-lg p-4 border border-bg-secondary">
                        <p className="text-text-secondary text-sm mb-1">Avg Words/Statement</p>
                        <p className="text-2xl font-bold text-electric-blue">
                          {Math.round(profile.averageWordCount || 0)}
                        </p>
                        <p className="text-xs text-text-muted mt-1">Per argument</p>
                      </div>
                      <div className="bg-bg-tertiary rounded-lg p-4 border border-bg-secondary">
                        <p className="text-text-secondary text-sm mb-1">Total Statements</p>
                        <p className="text-2xl font-bold text-text-primary">
                          {profile.totalStatements?.toLocaleString() || 0}
                        </p>
                        <p className="text-xs text-text-muted mt-1">Arguments submitted</p>
                      </div>
                      <div className="bg-bg-tertiary rounded-lg p-4 border border-bg-secondary">
                        <p className="text-text-secondary text-sm mb-1">Avg Rounds/Debate</p>
                        <p className="text-2xl font-bold text-cyber-green">
                          {profile.averageRounds?.toFixed(1) || '0.0'}
                        </p>
                        <p className="text-xs text-text-muted mt-1">Per debate</p>
                      </div>
                    </div>
                  </div>

                  {/* Tournament Stats Section - Only for own profile */}
                  {isOwnProfile && tournamentStats && (
                    <div className="mt-6 pt-6 border-t border-bg-tertiary">
                      <h3 className="text-lg font-bold text-text-primary mb-4">Tournament Stats</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-bg-tertiary rounded-lg p-4 border border-bg-secondary">
                          <p className="text-text-secondary text-sm mb-1">Total Tournaments</p>
                          <p className="text-2xl font-bold text-text-primary">
                            {tournamentStats.totalTournaments}
                          </p>
                          <p className="text-xs text-text-muted mt-1">Participated</p>
                        </div>
                        <div className="bg-bg-tertiary rounded-lg p-4 border border-bg-secondary">
                          <p className="text-text-secondary text-sm mb-1">Championships</p>
                          <p className="text-2xl font-bold text-cyber-green">
                            {tournamentStats.championships}
                          </p>
                          <p className="text-xs text-text-muted mt-1">Tournaments won</p>
                        </div>
                        <div className="bg-bg-tertiary rounded-lg p-4 border border-bg-secondary">
                          <p className="text-text-secondary text-sm mb-1">Tournament Win Rate</p>
                          <p className="text-2xl font-bold text-electric-blue">
                            {tournamentStats.winRate}%
                          </p>
                          <p className="text-xs text-text-muted mt-1">
                            {tournamentStats.totalTournamentWins}W / {tournamentStats.totalTournamentLosses}L
                          </p>
                        </div>
                        <div className="bg-bg-tertiary rounded-lg p-4 border border-bg-secondary">
                          <p className="text-text-secondary text-sm mb-1">Active Tournaments</p>
                          <p className="text-2xl font-bold text-neon-orange">
                            {tournamentStats.activeTournaments}
                          </p>
                          <p className="text-xs text-text-muted mt-1">Currently playing</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Creator CTA - Only for own profile */}
          {isOwnProfile && profile && (
            <CreatorCTA
              userId={profile.id}
              eloRating={profile.eloRating}
              totalDebates={profile.totalDebates}
              createdAt={new Date(profile.createdAt)}
            />
          )}

          {/* Past Debates - Show for all profiles */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">Past Debates</h2>
              <p className="text-sm text-text-secondary mt-1">
                {isOwnProfile ? 'Your completed debates' : `${profile.username}'s completed debates`}
              </p>
            </CardHeader>
            <CardBody>
              <PastDebates userId={profile.id} currentUserId={currentUser?.id} />
            </CardBody>
          </Card>

          {/* Battle History - Only for own profile */}
          {isOwnProfile && currentUser && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-text-primary">Battle History</h2>
                <p className="text-sm text-text-secondary mt-1">
                  Users you've debated with
                </p>
              </CardHeader>
              <CardBody>
                <BattleHistory userId={currentUser.id} />
              </CardBody>
            </Card>
          )}

          {/* Edit Profile - Only for own profile */}
          {isOwnProfile && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-text-primary">Edit Profile</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <Input
                    label="Username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Your username"
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Bio
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="primary"
                      onClick={handleSave}
                      isLoading={isSaving}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

