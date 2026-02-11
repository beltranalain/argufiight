'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useAuth } from '@/lib/hooks/useAuth'
import { useUsage } from '@/lib/hooks/queries/useSubscription'
import { fetchClient } from '@/lib/api/fetchClient'
import { UserSearchInput } from '@/components/debate/UserSearchInput'
import { getEasternTimeLocal, fromEasternDateTimeLocal, getMinEasternDateTimeLocal } from '@/lib/utils/eastern-timezone'

export default function CreateTournamentPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { showToast } = useToast()
  const { data: usageData, isLoading: usageLoading } = useUsage()

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

  const tournamentUsage = usageData?.usage?.tournaments
  const limit = usageData?.limits?.TOURNAMENTS ?? 1
  const currentUsage = tournamentUsage?.current ?? 0
  const canCreate = limit === -1 || currentUsage < limit

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetchClient<{ tournament?: { id: string }; id?: string }>('/api/tournaments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      const tournamentId = data.tournament?.id || data.id
      if (!tournamentId) {
        showToast({ type: 'error', title: 'Error', description: 'Tournament created but ID not found.' })
        setTimeout(() => { window.location.href = '/tournaments' }, 2000)
        return
      }
      showToast({ type: 'success', title: 'Tournament Created!', description: 'Your tournament has been created successfully' })
      setTimeout(() => { window.location.href = `/tournaments/${tournamentId}` }, 500)
    },
    onError: (error: any) => {
      showToast({ type: 'error', title: 'Error', description: error.message || 'Failed to create tournament' })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!canCreate) {
      showToast({
        type: 'warning',
        title: 'Tournament Limit Reached',
        description: `You've used your ${limit} tournament${limit === 1 ? '' : 's'} this month. Upgrade to Pro for unlimited tournaments!`,
      })
      return
    }

    if (!formData.name || !formData.startDate) {
      showToast({ type: 'error', title: 'Validation Error', description: 'Name and start date are required' })
      return
    }

    if (formData.format === 'CHAMPIONSHIP' && !formData.selectedPosition) {
      showToast({ type: 'error', title: 'Validation Error', description: 'Championship format requires selecting a position (PRO or CON)' })
      return
    }

    if (formData.format === 'KING_OF_THE_HILL' && formData.maxParticipants < 3) {
      showToast({ type: 'error', title: 'Validation Error', description: 'King of the Hill format requires at least 3 participants' })
      return
    }

    if ((formData.format === 'BRACKET' || formData.format === 'CHAMPIONSHIP') &&
        ![4, 8, 16, 32, 64].includes(formData.maxParticipants)) {
      showToast({ type: 'error', title: 'Validation Error', description: 'Bracket and Championship formats require 4, 8, 16, 32, or 64 participants' })
      return
    }

    createMutation.mutate({
      name: formData.name,
      description: formData.description || null,
      maxParticipants: parseInt(String(formData.maxParticipants)),
      startDate: formData.startDate ? fromEasternDateTimeLocal(formData.startDate).toISOString() : null,
      minElo: formData.minElo ? parseInt(String(formData.minElo)) : null,
      roundDuration: parseInt(String(formData.roundDuration)),
      reseedAfterRound: formData.reseedAfterRound,
      isPrivate: formData.isPrivate,
      invitedUserIds: formData.isPrivate && invitedUsers.length > 0 ? invitedUsers.map(u => u.id) : null,
      format: formData.format,
      selectedPosition: formData.format === 'CHAMPIONSHIP' ? formData.selectedPosition : null,
    })
  }

  if (authLoading || usageLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="TOURNAMENTS" />
        <div className="pt-20 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  if (!canCreate) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="TOURNAMENTS" />
        <div className="pt-20 px-4 md:px-8 pb-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardBody>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold text-text-primary mb-4">Tournament Limit Reached</h2>
                  <p className="text-text-secondary mb-6">
                    You&apos;ve used your {limit} tournament{limit === 1 ? '' : 's'} this month. Upgrade to Pro for unlimited tournaments!
                  </p>
                  <Button onClick={() => router.push('/upgrade')} variant="primary">Upgrade to Pro</Button>
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
          <div className="mb-8">
            <Button variant="ghost" onClick={() => router.push('/tournaments')} className="mb-4">&larr; Back to Tournaments</Button>
            <h1 className="text-4xl font-bold text-text-primary mb-2">Create Tournament</h1>
            <p className="text-text-secondary">
              {limit === -1
                ? 'Create unlimited tournaments (Pro member)'
                : `${currentUsage + 1} / ${limit} tournament${limit === 1 ? '' : 's'} this month`}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-text-primary">Tournament Details</h2>
              </CardHeader>
              <CardBody className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Tournament Name *</label>
                  <Input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Winter Debate Championship" required maxLength={100} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe your tournament..." className="w-full px-4 py-3 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-electric-blue transition-colors resize-none" rows={4} maxLength={500} />
                </div>

                {/* Tournament Format */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Tournament Format *</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {([
                      { value: 'BRACKET', label: 'Bracket Format', desc: 'Traditional elimination bracket. Winners advance to next round.' },
                      { value: 'CHAMPIONSHIP', label: 'Championship Format', desc: 'Position-based. Advance by individual scores, not just match wins.' },
                      { value: 'KING_OF_THE_HILL', label: 'King of the Hill', desc: 'Free-for-all elimination. Bottom 25% eliminated each round.' },
                    ] as const).map(({ value, label, desc }) => (
                      <button key={value} type="button" onClick={() => setFormData({ ...formData, format: value, selectedPosition: null })}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${formData.format === value ? 'border-electric-blue bg-electric-blue/10' : 'border-bg-tertiary bg-bg-secondary hover:border-electric-blue/50'}`}>
                        <h3 className="font-semibold text-text-primary mb-1">{label}</h3>
                        <p className="text-sm text-text-secondary">{desc}</p>
                      </button>
                    ))}
                  </div>
                  {formData.format === 'CHAMPIONSHIP' && (
                    <div className="mt-3 p-3 bg-cyber-green/10 border border-cyber-green/30 rounded-lg">
                      <p className="text-sm text-text-primary"><strong>How it works:</strong> Players choose PRO or CON position. Advancement is based on individual scores within your position group.</p>
                    </div>
                  )}
                  {formData.format === 'KING_OF_THE_HILL' && (
                    <div className="mt-3 p-3 bg-neon-orange/10 border border-neon-orange/30 rounded-lg">
                      <p className="text-sm text-text-primary"><strong>How it works:</strong> All participants compete in open GROUP debates. Each round, the bottom 25% are eliminated. The final two face off in a 1v1.</p>
                    </div>
                  )}
                </div>

                {formData.format === 'CHAMPIONSHIP' && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Your Position * (Championship Format)</label>
                    <div className="grid grid-cols-2 gap-4">
                      {(['PRO', 'CON'] as const).map((pos) => (
                        <button key={pos} type="button" onClick={() => setFormData({ ...formData, selectedPosition: pos })}
                          className={`p-4 rounded-lg border-2 transition-all text-center ${formData.selectedPosition === pos ? (pos === 'PRO' ? 'border-cyber-green bg-cyber-green/10' : 'border-neon-orange bg-neon-orange/10') : 'border-bg-tertiary bg-bg-secondary hover:border-electric-blue/50'}`}>
                          <h3 className="font-semibold text-text-primary mb-1">{pos}</h3>
                          <p className="text-xs text-text-secondary">{pos === 'PRO' ? 'Argue in favor' : 'Argue against'}</p>
                        </button>
                      ))}
                    </div>
                    {!formData.selectedPosition && <p className="text-text-secondary text-sm mt-2">Please select which position you want to argue</p>}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Max Participants *</label>
                  {formData.format === 'KING_OF_THE_HILL' ? (
                    <Input type="number" value={formData.maxParticipants} onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 3 })} min={3} max={64} required />
                  ) : (
                    <select value={formData.maxParticipants} onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })} className="w-full px-4 py-3 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary focus:outline-none focus:border-electric-blue transition-colors" required>
                      {[4, 8, 16, 32, 64].map(n => <option key={n} value={n}>{n} participants</option>)}
                    </select>
                  )}
                  <p className="text-text-secondary text-sm mt-1">
                    {formData.format === 'CHAMPIONSHIP'
                      ? `${formData.maxParticipants / 2} PRO + ${formData.maxParticipants / 2} CON positions`
                      : formData.format === 'KING_OF_THE_HILL'
                      ? 'Minimum 3 participants. Bottom 25% eliminated each round until finals.'
                      : `Tournament will have ${Math.log2(formData.maxParticipants)} rounds`}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Start Date * (Eastern Time)</label>
                  <div className="flex gap-2">
                    <Input type="datetime-local" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required min={getMinEasternDateTimeLocal()} className="flex-1" />
                    <Button type="button" variant="secondary" onClick={() => setFormData({ ...formData, startDate: getEasternTimeLocal() })} className="whitespace-nowrap">Start Now</Button>
                  </div>
                  <p className="text-text-secondary text-sm mt-1">All times are in Eastern Time (ET)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Minimum ELO (Optional)</label>
                  <Input type="number" value={formData.minElo} onChange={(e) => setFormData({ ...formData, minElo: e.target.value })} placeholder="e.g., 1200" min={0} />
                  <p className="text-text-secondary text-sm mt-1">Only users with this ELO or higher can join</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Round Duration (Hours)</label>
                  <Input type="number" value={formData.roundDuration} onChange={(e) => setFormData({ ...formData, roundDuration: parseInt(e.target.value) || 24 })} min={1} max={168} />
                  <p className="text-text-secondary text-sm mt-1">How long each round lasts (default: 24 hours)</p>
                </div>

                <div className="flex items-center gap-3">
                  <input type="checkbox" id="reseed" checked={formData.reseedAfterRound} onChange={(e) => setFormData({ ...formData, reseedAfterRound: e.target.checked })} className="w-4 h-4 rounded border-bg-tertiary bg-bg-secondary text-electric-blue focus:ring-electric-blue" />
                  <label htmlFor="reseed" className="text-text-primary">Reseed participants after each round (by ELO)</label>
                </div>

                <div className="border-t border-bg-tertiary pt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="isPrivate" checked={formData.isPrivate} onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })} className="w-4 h-4 rounded border-bg-tertiary bg-bg-secondary text-electric-blue focus:ring-electric-blue" />
                    <label htmlFor="isPrivate" className="text-text-primary font-medium">Make this tournament private (invite-only)</label>
                  </div>
                  <p className="text-text-secondary text-sm ml-7">Private tournaments are only visible to invited users and the creator.</p>

                  {formData.isPrivate && (
                    <div className="ml-7">
                      <label className="block text-sm font-medium text-text-primary mb-2">Invite Users</label>
                      <UserSearchInput selectedUsers={invitedUsers} onUsersChange={setInvitedUsers} maxUsers={formData.maxParticipants} placeholder="Search for users to invite..." allowMultiple={true} />
                      {invitedUsers.length > 0 && (
                        <div className="mt-3">
                          <p className="text-text-secondary text-sm mb-2">Invited users ({invitedUsers.length}):</p>
                          <div className="flex flex-wrap gap-2">
                            {invitedUsers.map((u) => (
                              <div key={u.id} className="flex items-center gap-2 px-3 py-1.5 bg-bg-secondary border border-bg-tertiary rounded-lg">
                                <span className="text-text-primary text-sm">@{u.username}</span>
                                <button type="button" onClick={() => setInvitedUsers(invitedUsers.filter(x => x.id !== u.id))} className="text-text-secondary hover:text-text-primary">&times;</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {formData.isPrivate && invitedUsers.length === 0 && (
                        <p className="text-neon-orange text-sm mt-2">You must invite at least one user for a private tournament</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="secondary" onClick={() => router.push('/tournaments')} className="flex-1">Cancel</Button>
                  <Button type="submit" variant="primary" isLoading={createMutation.isPending} className="flex-1">Create Tournament</Button>
                </div>
              </CardBody>
            </Card>
          </form>
        </div>
      </div>
    </div>
  )
}
