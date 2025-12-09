'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useAuth } from '@/lib/hooks/useAuth'
import { UserSearchInput } from '@/components/debate/UserSearchInput'
import { getEasternTimeLocal, fromEasternDateTimeLocal, getMinEasternDateTimeLocal } from '@/lib/utils/eastern-timezone'

export default function CreateTournamentPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { showToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [canCreate, setCanCreate] = useState<{ allowed: boolean; currentUsage?: number; limit?: number } | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxParticipants: 16,
    startDate: '',
    minElo: '',
    roundDuration: 24,
    reseedAfterRound: true,
    isPrivate: false,
    format: 'BRACKET' as 'BRACKET' | 'CHAMPIONSHIP' | 'KING_OF_THE_HILL',
    selectedPosition: null as 'PRO' | 'CON' | null,
  })
  const [invitedUsers, setInvitedUsers] = useState<Array<{ id: string; username: string; avatarUrl: string | null; eloRating: number }>>([])

  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (authLoading) {
      return
    }

    // If auth finished loading and no user, redirect to login
    if (!user) {
      router.push('/login')
      return
    }

    // User is loaded, check if they can create tournaments
    checkCanCreate()
  }, [user, authLoading, router])

  const checkCanCreate = async () => {
    try {
      setIsChecking(true)
      const response = await fetch('/api/subscriptions/usage')
      if (response.ok) {
        const data = await response.json()
        // Check both formats: array and object
        const tournamentUsage = data.usageArray
          ? data.usageArray.find((u: any) => u.featureType === 'tournaments')
          : data.usage?.tournaments
        const limit = data.limits?.TOURNAMENTS || 1
        const currentUsage = tournamentUsage?.count || tournamentUsage?.current || 0

        const allowed = limit === -1 || currentUsage < limit

        setCanCreate({
          allowed,
          currentUsage,
          limit,
        })

        // If not allowed, redirect to upgrade
        if (!allowed) {
          showToast({
            type: 'warning',
            title: 'Tournament Limit Reached',
            description: `You've used your ${limit} tournament${limit === 1 ? '' : 's'} this month. Upgrade to Pro for unlimited tournaments!`,
          })
          setTimeout(() => {
            window.location.href = '/upgrade'
          }, 2000)
        }
      }
    } catch (error) {
      console.error('Failed to check create limit:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!canCreate?.allowed) {
      router.push('/upgrade')
      return
    }

    if (!formData.name || !formData.startDate) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        description: 'Name and start date are required',
      })
      return
    }

    // Validate Championship format requires position selection
    if (formData.format === 'CHAMPIONSHIP' && !formData.selectedPosition) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        description: 'Championship format requires selecting a position (PRO or CON)',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          maxParticipants: parseInt(String(formData.maxParticipants)),
          // Convert Eastern time datetime-local string to ISO string for API
          startDate: formData.startDate ? fromEasternDateTimeLocal(formData.startDate).toISOString() : null,
          minElo: formData.minElo ? parseInt(String(formData.minElo)) : null,
          roundDuration: parseInt(String(formData.roundDuration)),
          reseedAfterRound: formData.reseedAfterRound,
          isPrivate: formData.isPrivate,
          invitedUserIds: formData.isPrivate && invitedUsers.length > 0 
            ? invitedUsers.map(u => u.id) 
            : null,
          format: formData.format,
          selectedPosition: formData.format === 'CHAMPIONSHIP' ? formData.selectedPosition : null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Verify tournament ID exists in response
        const tournamentId = data.tournament?.id || data.id
        if (!tournamentId) {
          console.error('Tournament ID missing from response:', data)
          showToast({
            type: 'error',
            title: 'Error',
            description: 'Tournament created but ID not found. Redirecting to tournaments page.',
          })
          setTimeout(() => {
            window.location.href = '/tournaments'
          }, 2000)
          return
        }

        showToast({
          type: 'success',
          title: 'Tournament Created!',
          description: 'Your tournament has been created successfully',
        })
        
        // Redirect to tournament detail page
        // Use window.location for full page reload to ensure session is maintained
        setTimeout(() => {
          window.location.href = `/tournaments/${tournamentId}`
        }, 500)
      } else {
        // Check if it's a limit error with redirect
        if (data.redirectTo || response.status === 403) {
          showToast({
            type: 'warning',
            title: 'Tournament Limit Reached',
            description: data.error || `You've used your ${data.limit || 1} tournament${(data.limit || 1) === 1 ? '' : 's'} this month. Upgrade to Pro for unlimited tournaments!`,
          })
          // Redirect to upgrade page
          window.location.href = data.redirectTo || '/upgrade'
        } else {
          showToast({
            type: 'error',
            title: 'Error',
            description: data.error || 'Failed to create tournament',
          })
        }
      }
    } catch (error: any) {
      console.error('Failed to create tournament:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to create tournament',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading while auth is loading or while checking permissions
  if (authLoading || isChecking) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="TOURNAMENTS" />
        <div className="pt-20 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  // If auth finished loading and no user, don't render (redirect will happen)
  if (!user) {
    return null
  }

  if (!canCreate?.allowed) {
    const limit = canCreate?.limit || 1
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="TOURNAMENTS" />
        <div className="pt-20 px-4 md:px-8 pb-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardBody>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-text-primary mb-4">
                    Tournament Limit Reached
                  </h2>
                  <p className="text-text-secondary mb-6">
                    You've used your {limit} tournament{limit === 1 ? '' : 's'} this month.
                    Upgrade to Pro for unlimited tournaments!
                  </p>
                  <Button onClick={() => router.push('/upgrade')} variant="primary">
                    Upgrade to Pro
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="TOURNAMENTS" />
      
      <div className="pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" onClick={() => router.push('/tournaments')} className="mb-4">
              ← Back to Tournaments
            </Button>
            <h1 className="text-4xl font-bold text-text-primary mb-2">Create Tournament</h1>
            <p className="text-text-secondary">
              {canCreate.limit === -1
                ? 'Create unlimited tournaments (Pro member)'
                : `${(canCreate.currentUsage || 0) + 1} / ${canCreate.limit} tournament${canCreate.limit === 1 ? '' : 's'} this month`}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-text-primary">Tournament Details</h2>
              </CardHeader>
              <CardBody className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Tournament Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Winter Debate Championship"
                    required
                    maxLength={100}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your tournament..."
                    className="w-full px-4 py-3 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-electric-blue transition-colors resize-none"
                    rows={4}
                    maxLength={500}
                  />
                </div>

                {/* Tournament Format */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Tournament Format *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, format: 'BRACKET', selectedPosition: null })
                      }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.format === 'BRACKET'
                          ? 'border-electric-blue bg-electric-blue/10'
                          : 'border-bg-tertiary bg-bg-secondary hover:border-electric-blue/50'
                      }`}
                    >
                      <div className="text-left">
                        <h3 className="font-semibold text-text-primary mb-1">Bracket Format</h3>
                        <p className="text-sm text-text-secondary">
                          Traditional elimination bracket. Winners advance to next round.
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, format: 'CHAMPIONSHIP', selectedPosition: null })
                      }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.format === 'CHAMPIONSHIP'
                          ? 'border-electric-blue bg-electric-blue/10'
                          : 'border-bg-tertiary bg-bg-secondary hover:border-electric-blue/50'
                      }`}
                    >
                      <div className="text-left">
                        <h3 className="font-semibold text-text-primary mb-1">Championship Format</h3>
                        <p className="text-sm text-text-secondary">
                          Position-based. Advance by individual scores, not just match wins.
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, format: 'KING_OF_THE_HILL', selectedPosition: null })
                      }}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.format === 'KING_OF_THE_HILL'
                          ? 'border-electric-blue bg-electric-blue/10'
                          : 'border-bg-tertiary bg-bg-secondary hover:border-electric-blue/50'
                      }`}
                    >
                      <div className="text-left">
                        <h3 className="font-semibold text-text-primary mb-1">King of the Hill</h3>
                        <p className="text-sm text-text-secondary">
                          Free-for-all format. Bottom 25% eliminated each round until champion.
                        </p>
                      </div>
                    </button>
                  </div>
                  {formData.format === 'CHAMPIONSHIP' && (
                    <div className="mt-3 p-3 bg-cyber-green/10 border border-cyber-green/30 rounded-lg">
                      <p className="text-sm text-text-primary">
                        <strong>How it works:</strong> Players choose PRO or CON position. Advancement is based on individual scores within your position group. You can lose your match but still advance if you score higher than peers on your side!
                      </p>
                    </div>
                  )}
                  {formData.format === 'KING_OF_THE_HILL' && (
                    <div className="mt-3 p-3 bg-neon-orange/10 border border-neon-orange/30 rounded-lg">
                      <p className="text-sm text-text-primary">
                        <strong>How it works:</strong> All participants debate simultaneously. After each round, the AI judge eliminates the bottom 25% based on performance scores. This continues until only the champion remains!
                      </p>
                    </div>
                  )}
                </div>

                {/* Position Selection (Championship only) */}
                {formData.format === 'CHAMPIONSHIP' && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Your Position * (Championship Format)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, selectedPosition: 'PRO' })}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          formData.selectedPosition === 'PRO'
                            ? 'border-cyber-green bg-cyber-green/10'
                            : 'border-bg-tertiary bg-bg-secondary hover:border-cyber-green/50'
                        }`}
                      >
                        <div className="text-center">
                          <h3 className="font-semibold text-text-primary mb-1">PRO</h3>
                          <p className="text-xs text-text-secondary">Argue in favor</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, selectedPosition: 'CON' })}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          formData.selectedPosition === 'CON'
                            ? 'border-neon-orange bg-neon-orange/10'
                            : 'border-bg-tertiary bg-bg-secondary hover:border-neon-orange/50'
                        }`}
                      >
                        <div className="text-center">
                          <h3 className="font-semibold text-text-primary mb-1">CON</h3>
                          <p className="text-xs text-text-secondary">Argue against</p>
                        </div>
                      </button>
                    </div>
                    {!formData.selectedPosition && (
                      <p className="text-text-secondary text-sm mt-2">
                        Please select which position you want to argue
                      </p>
                    )}
                  </div>
                )}

                {/* Max Participants */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Max Participants *
                  </label>
                  <select
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary focus:outline-none focus:border-electric-blue transition-colors"
                    required
                  >
                    <option value={4}>4 participants</option>
                    <option value={8}>8 participants</option>
                    <option value={16}>16 participants</option>
                    <option value={32}>32 participants</option>
                    <option value={64}>64 participants</option>
                  </select>
                  <p className="text-text-secondary text-sm mt-1">
                    {formData.format === 'CHAMPIONSHIP' 
                      ? `${formData.maxParticipants / 2} PRO + ${formData.maxParticipants / 2} CON positions`
                      : `Tournament will have ${Math.log2(formData.maxParticipants)} rounds`
                    }
                  </p>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Start Date * (Eastern Time)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                      min={getMinEasternDateTimeLocal()}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        // Set to current Eastern time
                        const easternTime = getEasternTimeLocal()
                        setFormData({ ...formData, startDate: easternTime })
                      }}
                      className="whitespace-nowrap"
                    >
                      Start Now
                    </Button>
                  </div>
                  <p className="text-text-secondary text-sm mt-1">
                    All times are in Eastern Time (ET)
                  </p>
                </div>

                {/* Min ELO */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Minimum ELO (Optional)
                  </label>
                  <Input
                    type="number"
                    value={formData.minElo}
                    onChange={(e) => setFormData({ ...formData, minElo: e.target.value })}
                    placeholder="e.g., 1200"
                    min={0}
                  />
                  <p className="text-text-secondary text-sm mt-1">
                    Only users with this ELO or higher can join
                  </p>
                </div>

                {/* Round Duration */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Round Duration (Hours)
                  </label>
                  <Input
                    type="number"
                    value={formData.roundDuration}
                    onChange={(e) => setFormData({ ...formData, roundDuration: parseInt(e.target.value) || 24 })}
                    min={1}
                    max={168}
                  />
                  <p className="text-text-secondary text-sm mt-1">
                    How long each round lasts (default: 24 hours)
                  </p>
                </div>

                {/* Reseed After Round */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="reseed"
                    checked={formData.reseedAfterRound}
                    onChange={(e) => setFormData({ ...formData, reseedAfterRound: e.target.checked })}
                    className="w-4 h-4 rounded border-bg-tertiary bg-bg-secondary text-electric-blue focus:ring-electric-blue"
                  />
                  <label htmlFor="reseed" className="text-text-primary">
                    Reseed participants after each round (by ELO)
                  </label>
                </div>

                {/* Privacy & Invitations */}
                <div className="border-t border-bg-tertiary pt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isPrivate"
                      checked={formData.isPrivate}
                      onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                      className="w-4 h-4 rounded border-bg-tertiary bg-bg-secondary text-electric-blue focus:ring-electric-blue"
                    />
                    <label htmlFor="isPrivate" className="text-text-primary font-medium">
                      Make this tournament private (invite-only)
                    </label>
                  </div>
                  <p className="text-text-secondary text-sm ml-7">
                    Private tournaments are only visible to invited users and the creator. Only invited users can join.
                  </p>

                  {formData.isPrivate && (
                    <div className="ml-7">
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Invite Users
                      </label>
                      <UserSearchInput
                        selectedUsers={invitedUsers}
                        onUsersChange={setInvitedUsers}
                        maxUsers={formData.maxParticipants}
                        placeholder="Search for users to invite..."
                        allowMultiple={true}
                      />
                      {invitedUsers.length > 0 && (
                        <div className="mt-3">
                          <p className="text-text-secondary text-sm mb-2">
                            Invited users ({invitedUsers.length}):
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {invitedUsers.map((user) => (
                              <div
                                key={user.id}
                                className="flex items-center gap-2 px-3 py-1.5 bg-bg-secondary border border-bg-tertiary rounded-lg"
                              >
                                <span className="text-text-primary text-sm">@{user.username}</span>
                                <button
                                  type="button"
                                  onClick={() => setInvitedUsers(invitedUsers.filter(u => u.id !== user.id))}
                                  className="text-text-secondary hover:text-text-primary"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {formData.isPrivate && invitedUsers.length === 0 && (
                        <p className="text-neon-orange text-sm mt-2">
                          ⚠️ You must invite at least one user for a private tournament
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.push('/tournaments')}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                    className="flex-1"
                  >
                    Create Tournament
                  </Button>
                </div>
              </CardBody>
            </Card>
          </form>
        </div>
      </div>
    </div>
  )
}

