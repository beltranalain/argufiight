'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import { useProfile } from '@/lib/hooks/queries/useProfile'
import { useDebates } from '@/lib/hooks/queries/useDebates'
import { useFollowStatus } from '@/lib/hooks/queries/useFollow'
import { useToggleFollow } from '@/lib/hooks/mutations/useFollow'
import { ProfileStats } from '@/components/profile/ProfileStats'
import { BattleHistory } from '@/components/profile/BattleHistory'
import { TierBadge } from '@/components/subscriptions/TierBadge'
import { AdDisplay } from '@/components/ads/AdDisplay'
import Link from 'next/link'

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  const userId = params.id as string

  // Redirect to own profile page if viewing self
  useEffect(() => {
    if (currentUser && userId === currentUser.id) {
      router.push('/profile')
    }
  }, [currentUser, userId, router])

  const { data: profile, isLoading, isError, refetch } = useProfile(userId)
  const { data: debatesData } = useDebates({ userId, status: 'COMPLETED,VERDICT_READY', limit: 5 })
  const { data: followStatus } = useFollowStatus(userId, currentUser?.id)
  const toggleFollow = useToggleFollow(userId)

  const recentDebates = debatesData?.debates || []

  const handleToggleFollow = () => {
    if (!currentUser) {
      showToast({ type: 'error', title: 'Login Required', description: 'Please log in to follow users' })
      return
    }
    toggleFollow.mutate(undefined, {
      onSuccess: (data) => {
        showToast({
          type: 'success',
          title: data.following ? 'Following' : 'Unfollowed',
          description: data.following
            ? `You are now following ${profile?.username}`
            : `You are no longer following ${profile?.username}`,
        })
      },
      onError: (error: any) => {
        showToast({ type: 'error', title: 'Error', description: error.message || 'Failed to toggle follow' })
      },
    })
  }

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

  if (isError || !profile) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="PROFILE" />
        <div className="pt-20">
          <ErrorDisplay title="Failed to load profile" onRetry={() => refetch()} />
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
          <AdDisplay placement="PROFILE_BANNER" userId={userId} context="public-profile" />

          {/* Profile Header */}
          <Card>
            <CardBody>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <Avatar src={profile.avatarUrl} alt={profile.username} size="xl" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-text-primary">{profile.username}</h1>
                    {profile.subscription && (
                      <TierBadge tier={profile.subscription.tier} showVerified={profile.subscription.tier === 'PRO'} />
                    )}
                  </div>
                  <p className="text-text-secondary mb-2">Member since {joinDate}</p>

                  {followStatus && (
                    <div className="flex items-center gap-4 text-sm text-text-secondary mb-2">
                      <span>
                        <span className="font-semibold text-text-primary">{followStatus.followerCount}</span> followers
                      </span>
                      <span>
                        <span className="font-semibold text-text-primary">{followStatus.followingCount}</span> following
                      </span>
                    </div>
                  )}

                  {currentUser && currentUser.id !== userId && (
                    <div className="mb-4">
                      <Button
                        variant={followStatus?.isFollowing ? 'secondary' : 'primary'}
                        onClick={handleToggleFollow}
                        isLoading={toggleFollow.isPending}
                        className="min-w-[100px]"
                      >
                        {followStatus?.isFollowing ? 'Following' : 'Follow'}
                      </Button>
                    </div>
                  )}

                  {profile.bio && <p className="text-text-secondary mb-4">{profile.bio}</p>}

                  <ProfileStats profile={profile} tournamentStats={undefined} />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Battle History */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">Battle History</h2>
              <p className="text-sm text-text-secondary mt-1">Users you&apos;ve debated with</p>
            </CardHeader>
            <CardBody>
              <BattleHistory userId={userId} />
            </CardBody>
          </Card>

          {/* Recent Debates */}
          {recentDebates.length > 0 ? (
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
                          <h3 className="text-text-primary font-semibold mb-1">{debate.topic}</h3>
                          <p className="text-text-secondary text-sm">
                            {debate.category} • {new Date(debate.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {debate.status === 'VERDICT_READY' && <Badge variant="success">Completed</Badge>}
                      </div>
                    </Link>
                  ))}
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody>
                <p className="text-text-secondary text-center py-8">No debates yet</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
