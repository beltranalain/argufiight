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
import { TierBadge } from '@/components/subscriptions/TierBadge'
import { AdDisplay } from '@/components/ads/AdDisplay'
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
  subscription: {
    tier: 'FREE' | 'PRO'
  }
}

// Reserved routes that should not be treated as usernames
const RESERVED_ROUTES = [
  'api',
  'admin',
  'advertiser',
  'creator',
  'auth',
  'login',
  'signup',
  'logout',
  'profile',
  'debates',
  'debate',
  'tournaments',
  'tournament',
  'leaderboard',
  'trending',
  'messages',
  'upgrade',
  'support',
  'settings',
  'advertise',
  'about',
  'terms',
  'privacy',
  'help',
  'faq',
  'contact',
  '_next',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
]

export default function UsernameProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const username = params.username as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [recentDebates, setRecentDebates] = useState<any[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [isTogglingFollow, setIsTogglingFollow] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    // Check if this is a reserved route
    if (RESERVED_ROUTES.includes(username?.toLowerCase() || '')) {
      router.push('/')
      return
    }

    if (username) {
      fetchProfile()
      fetchRecentDebates()
      if (currentUser && currentUser.username !== username) {
        fetchFollowStatus()
      }
    }
  }, [username, currentUser, router])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/users/username/${username}/profile`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
      } else if (response.status === 404) {
        // User not found - show 404
        setProfile(null)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRecentDebates = async () => {
    if (!profile) return
    
    try {
      const response = await fetch(`/api/debates?userId=${profile.id}&status=COMPLETED,VERDICT_READY`)
      if (response.ok) {
        const data = await response.json()
        const debates = data.debates || []
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
    if (!currentUser || !profile) return

    try {
      const response = await fetch(`/api/users/${profile.id}/follow-status`)
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
      router.push('/login')
      return
    }

    if (!profile) return

    if (currentUser.id === profile.id) {
      return
    }

    setIsTogglingFollow(true)
    try {
      const response = await fetch(`/api/users/${profile.id}/follow`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setIsFollowing(data.following)
        setFollowerCount(data.followerCount)
        showToast({
          type: 'success',
          title: data.following ? 'Following' : 'Unfollowed',
          description: data.following
            ? `You are now following @${profile.username}`
            : `You unfollowed @${profile.username}`,
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to toggle follow')
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

  // Redirect to own profile if viewing own profile
  useEffect(() => {
    if (currentUser && profile && currentUser.id === profile.id) {
      router.push('/profile')
    }
  }, [currentUser, profile, router])

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
              <Button
                variant="primary"
                onClick={() => router.push('/')}
                className="mt-4"
              >
                Go Home
              </Button>
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
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-6">
            <CardBody>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <Avatar
                    src={profile.avatarUrl}
                    alt={profile.username}
                    size="xl"
                    className="w-24 h-24 md:w-32 md:h-32"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-text-primary">
                          @{profile.username}
                        </h1>
                        <TierBadge tier={profile.subscription.tier} />
                      </div>
                      {profile.bio && (
                        <p className="text-text-secondary mb-4">{profile.bio}</p>
                      )}
                      <div className="flex items-center gap-6 text-sm text-text-secondary mb-4">
                        <span>Joined {joinDate}</span>
                        {followerCount > 0 && (
                          <span>{followerCount} followers</span>
                        )}
                        {followingCount > 0 && (
                          <span>{followingCount} following</span>
                        )}
                      </div>
                    </div>
                    {currentUser && currentUser.id !== profile.id && (
                      <Button
                        variant={isFollowing ? 'secondary' : 'primary'}
                        onClick={handleToggleFollow}
                        disabled={isTogglingFollow}
                      >
                        {isTogglingFollow
                          ? '...'
                          : isFollowing
                          ? 'Following'
                          : 'Follow'}
                      </Button>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-electric-blue">
                        {profile.eloRating}
                      </div>
                      <div className="text-sm text-text-secondary">ELO Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-cyber-green">
                        {profile.debatesWon}
                      </div>
                      <div className="text-sm text-text-secondary">Wins</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-neon-orange">
                        {profile.debatesLost}
                      </div>
                      <div className="text-sm text-text-secondary">Losses</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-text-primary">
                        {profile.winRate}%
                      </div>
                      <div className="text-sm text-text-secondary">Win Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Recent Debates */}
          {recentDebates.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <h2 className="text-2xl font-bold text-text-primary">Recent Debates</h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {recentDebates.map((debate: any) => {
                    const opponent = debate.challengerId === profile.id ? debate.opponent : debate.challenger
                    const isWinner = debate.winnerId === profile.id
                    
                    return (
                      <Link
                        key={debate.id}
                        href={`/debate/${debate.id}`}
                        className="block p-3 bg-bg-tertiary rounded-lg border border-bg-tertiary hover:border-electric-blue transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text-primary truncate mb-1">
                              {debate.topic}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-text-secondary">
                              <span>vs {opponent?.username || 'Unknown'}</span>
                              {debate.category && (
                                <>
                                  <span>•</span>
                                  <Badge variant="default" size="sm" className="text-xs">
                                    {debate.category}
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {isWinner ? (
                              <Badge variant="default" className="bg-cyber-green text-white">
                                Won
                              </Badge>
                            ) : debate.winnerId ? (
                              <Badge variant="default" className="bg-neon-orange text-white">
                                Lost
                              </Badge>
                            ) : (
                              <Badge variant="default" className="bg-gray-500 text-white">
                                Tied
                              </Badge>
                            )}
                            <span className="text-xs text-text-secondary">
                              {new Date(debate.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Battle History */}
          {profile && (
            <Card className="mb-6">
              <CardHeader>
                <h2 className="text-2xl font-bold text-text-primary">Battle History</h2>
              </CardHeader>
              <CardBody>
                <BattleHistory userId={profile.id} />
              </CardBody>
            </Card>
          )}

          {/* Ad Display */}
          <AdDisplay placement="profile" />
        </div>
      </div>
    </div>
  )
}

