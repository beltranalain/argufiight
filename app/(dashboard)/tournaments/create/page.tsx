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

export default function CreateTournamentPage() {
  const router = useRouter()
  const { user } = useAuth()
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
  })

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }

    checkCanCreate()
  }, [user, router])

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
          startDate: formData.startDate,
          minElo: formData.minElo ? parseInt(String(formData.minElo)) : null,
          roundDuration: parseInt(String(formData.roundDuration)),
          reseedAfterRound: formData.reseedAfterRound,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Tournament Created!',
          description: 'Your tournament has been created successfully',
        })
        router.push(`/tournaments/${data.tournament.id}`)
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

  if (!user) {
    return null
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="TOURNAMENTS" />
        <div className="pt-20 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
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
                    Tournament will have {Math.log2(formData.maxParticipants)} rounds
                  </p>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Start Date *
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    min={new Date().toISOString().slice(0, 16)}
                  />
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

