'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import { BattleHistory } from '@/components/profile/BattleHistory'
import Link from 'next/link'

interface UserProfile {
  id: string
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
  winRate: number
  createdAt: string
}

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const userId = params.id as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [recentDebates, setRecentDebates] = useState<any[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isTogglingFollow, setIsTogglingFollow] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    if (userId) {
      fetchProfile()
      fetchRecentDebates()
      if (currentUser && currentUser.id !== userId) {
        fetchFollowStatus()
      }
    }
  }, [userId, currentUser])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/users/${userId}/profile`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
      } else if (response.status === 404) {
        // User not found
        router.push('/')
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRecentDebates = async () => {
    try {
      const response = await fetch(`/api/debates?userId=${userId}&status=COMPLETED,VERDICT_READY`)
      if (response.ok) {
        const debates = await response.json()
        // Ensure debates is an array before calling slice
        if (Array.isArray(debates)) {
          setRecentDebates(debates.slice(0, 5))
        } else {
          setRecentDebates([])
        }
      } else {
        setRecentDebates([])
      }
    } catch (error) {
      console.error('Failed to fetch recent debates:', error)
      setRecentDebates([])
    }
  }

  const fetchFollowStatus = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/follow`)
      if (response.ok) {
        const data = await response.json()
        setIsFollowing(data.isFollowing || false)
        setFollowerCount(data.followerCount || 0)
        setFollowingCount(data.followingCount || 0)
      }
    } catch (error) {
      console.error('Failed to fetch follow status:', error)
    }
  }

  const handleToggleFollow = async () => {
    if (!currentUser) {
      showToast({
        type: 'error',
        title: 'Login Required',
        description: 'Please log in to follow users',
      })
      return
    }

    setIsTogglingFollow(true)
    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to toggle follow')
      }

      const data = await response.json()
      setIsFollowing(data.following)
      
      // Update follower count
      if (data.following) {
        setFollowerCount((prev) => prev + 1)
        showToast({
          type: 'success',
          title: 'Following',
          description: `You are now following ${profile?.username}`,
        })
      } else {
        setFollowerCount((prev) => Math.max(0, prev - 1))
        showToast({
          type: 'success',
          title: 'Unfollowed',
          description: `You are no longer following ${profile?.username}`,
        })
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to toggle follow',
      })
    } finally {
      setIsTogglingFollow(false)
    }
  }

  // If viewing own profile, redirect to /profile
  useEffect(() => {
    if (currentUser && userId === currentUser.id) {
      router.push('/profile')
    }
  }, [currentUser, userId, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="PROFILE" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="PROFILE" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card>
            <CardBody>
              <p className="text-text-secondary">User not found</p>
            </CardBody>
          </Card>
        </div>
      </div>
    )
  }

  const joinDate = new Date(profile.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  })

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="PROFILE" />
      <div className="pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-4xl mx-auto space-y-6 pt-8">
          {/* Profile Header */}
          <Card>
            <CardBody>
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <Avatar
                    src={profile.avatarUrl}
                    alt={profile.username}
                    size="xl"
                  />
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold text-text-primary mb-2">
                        {profile.username}
                      </h1>
                      <p className="text-text-secondary mb-2">
                        Member since {joinDate}
                      </p>
                      
                      {/* Follow Stats */}
                      <div className="flex items-center gap-4 text-sm text-text-secondary mb-2">
                        <span>
                          <span className="font-semibold text-text-primary">{followerCount}</span> followers
                        </span>
                        <span>
                          <span className="font-semibold text-text-primary">{followingCount}</span> following
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-electric-blue/20 border border-electric-blue/30 rounded-lg px-6 py-4 min-w-[160px]">
                      <p className="text-xs text-text-secondary mb-1">ELO Rating</p>
                      <p className="text-3xl font-bold text-electric-blue">{profile.eloRating}</p>
                      <p className="text-xs text-text-muted mt-1">Current rating</p>
                    </div>
                    {profile.totalMaxScore > 0 ? (
                      <div className="bg-cyber-green/20 border border-cyber-green/30 rounded-lg px-6 py-4 min-w-[160px]">
                        <p className="text-xs text-text-secondary mb-1">Overall Score</p>
                        <p className="text-3xl font-bold text-cyber-green">
                          {profile.totalScore.toLocaleString()}/{profile.totalMaxScore.toLocaleString()}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          {Math.round((profile.totalScore / profile.totalMaxScore) * 100)}% average
                        </p>
                      </div>
                    ) : (
                      <div className="bg-bg-tertiary border border-bg-secondary rounded-lg px-6 py-4 min-w-[160px]">
                        <p className="text-xs text-text-secondary mb-1">Overall Score</p>
                        <p className="text-3xl font-bold text-text-secondary">N/A</p>
                        <p className="text-xs text-text-muted mt-1">No completed debates yet</p>
                      </div>
                        )}
                      </div>
                      {currentUser && currentUser.id !== userId && (
                    <div className="mb-4">
                        <Button
                          variant={isFollowing ? 'secondary' : 'primary'}
                          onClick={handleToggleFollow}
                          isLoading={isTogglingFollow}
                          className="min-w-[100px]"
                        >
                          {isFollowing ? 'Following' : 'Follow'}
                        </Button>
                    </div>
                  )}

                  {profile.bio && (
                    <p className="text-text-secondary mb-4">{profile.bio}</p>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-bg-tertiary rounded-lg p-4">
                      <p className="text-text-secondary text-sm mb-1">Total</p>
                      <p className="text-2xl font-bold text-text-primary">
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

                  {/* Deep Analytics Section */}
                  <div className="mt-8 pt-6 border-t border-bg-tertiary">
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
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Battle History */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">Battle History</h2>
              <p className="text-sm text-text-secondary mt-1">
                Users you've debated with
              </p>
            </CardHeader>
            <CardBody>
              <BattleHistory userId={userId} />
            </CardBody>
          </Card>

          {/* Recent Debates */}
          {recentDebates.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-text-primary">Recent Debates</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  {recentDebates.map((debate) => (
                    <Link
                      key={debate.id}
                      href={`/debate/${debate.id}`}
                      className="block p-4 bg-bg-tertiary rounded-lg hover:bg-bg-secondary transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-text-primary font-semibold mb-1">
                            {debate.topic}
                          </h3>
                          <p className="text-text-secondary text-sm">
                            {debate.category} •{' '}
                            {new Date(debate.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {debate.status === 'VERDICT_READY' && (
                          <Badge variant="success">Completed</Badge>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {recentDebates.length === 0 && (
            <Card>
              <CardBody>
                <p className="text-text-secondary text-center py-8">
                  No debates yet
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

