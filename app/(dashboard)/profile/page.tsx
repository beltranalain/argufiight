'use client'

import { useRouter } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/Loading'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { useAuth } from '@/lib/hooks/useAuth'
import { useProfile, useTournamentStats } from '@/lib/hooks/queries/useProfile'
import { ProfileStats } from '@/components/profile/ProfileStats'
import { ProfileEditForm } from '@/components/profile/ProfileEditForm'
import { BattleHistory } from '@/components/profile/BattleHistory'
import { CreatorCTA } from '@/components/profile/CreatorCTA'
import { AdDisplay } from '@/components/ads/AdDisplay'

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { data: profile, isLoading, isError, refetch } = useProfile()
  const { data: tournamentStats } = useTournamentStats()

  if (!authLoading && !user) {
    router.replace('/')
    return null
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="PROFILE" />
        <div className="pt-20 flex items-center justify-center min-h-[calc(100vh-80px)]">
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
          <ErrorDisplay
            title="Failed to load profile"
            message="Could not load your profile data."
            onRetry={() => refetch()}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="PROFILE" />

      <div className="pt-24 px-4 md:px-8 pb-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <AdDisplay placement="PROFILE_BANNER" userId={profile.id} context="own-profile" />

          {/* Profile Header */}
          <Card>
            <CardBody>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                <ProfileEditForm profile={profile} />

                <div className="flex-1">
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold text-text-primary mb-2">{profile.username}</h1>
                    <p className="text-text-secondary">{profile.email}</p>
                  </div>

                  <ProfileStats profile={profile} tournamentStats={tournamentStats} />
                </div>
              </div>
            </CardBody>
          </Card>

          <CreatorCTA
            userId={profile.id}
            eloRating={profile.eloRating}
            totalDebates={profile.totalDebates}
            createdAt={new Date(profile.createdAt)}
          />

          {user && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-text-primary">Battle History</h2>
                <p className="text-sm text-text-secondary mt-1">Users you&apos;ve debated with</p>
              </CardHeader>
              <CardBody>
                <BattleHistory userId={user.id} />
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
