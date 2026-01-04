'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'
import { EditBeltModal } from '@/components/admin/EditBeltModal'
import { ViewBeltModal } from '@/components/admin/ViewBeltModal'

interface BeltDetails {
  id: string
  name: string
  type: string
  category: string | null
  status: string
  currentHolder: {
    id: string
    username: string
    avatarUrl: string | null
    eloRating: number
    totalBeltWins: number
    totalBeltDefenses: number
  } | null
  tournament: {
    id: string
    name: string
    status: string
  } | null
  coinValue: number
  creationCost: number
  acquiredAt: string | null
  lastDefendedAt: string | null
  nextDefenseDue: string | null
  inactiveAt: string | null
  timesDefended: number
  successfulDefenses: number
  totalDaysHeld: number
  gracePeriodEnds: string | null
  isFirstHolder: boolean
  isStaked: boolean
  stakedInDebateId: string | null
  stakedInTournamentId: string | null
  designImageUrl: string | null
  sponsorName: string | null
  sponsorLogoUrl: string | null
  createdAt: string
  history: Array<{
    id: string
    fromUser: { id: string; username: string; avatarUrl: string | null } | null
    toUser: { id: string; username: string; avatarUrl: string | null } | null
    reason: string
    debate: { id: string; topic: string } | null
    tournament: { id: string; name: string } | null
    daysHeld: number
    defensesWon: number
    defensesLost: number
    transferredAt: string
  }>
  challenges: Array<{
    id: string
    challenger: {
      id: string
      username: string
      avatarUrl: string | null
      eloRating: number
    }
    status: string
    entryFee: number
    coinReward: number
    expiresAt: string
    createdAt: string
    debateTopic: string | null
    debateDescription: string | null
    debateCategory: string | null
    debateChallengerPosition: string | null
    debateTotalRounds: number | null
    debateSpeedMode: boolean | null
    debateAllowCopyPaste: boolean | null
  }>
}

export default function BeltDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const [belt, setBelt] = useState<BeltDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [transferUserId, setTransferUserId] = useState('')
  const [isTransferring, setIsTransferring] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  // Define formatBeltStatus at the top to ensure it's always available
  const formatBeltStatus = (status: string) => {
    return status.replace(/_/g, ' ')
  }

  useEffect(() => {
    if (params.id) {
      fetchBeltDetails()
    }
  }, [params.id])

  const fetchBeltDetails = async () => {
    try {
      setIsLoading(true)
      // Add cache busting to ensure fresh data
      const response = await fetch(`/api/belts/${params.id}?t=${Date.now()}`, {
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched belt data:', data.belt)
        console.log('Belt designImageUrl:', data.belt?.designImageUrl)
        setBelt(data.belt)
      } else {
        const error = await response.json()
        showToast({
          type: 'error',
          title: 'Error',
          description: error.error || 'Failed to load belt details',
        })
      }
    } catch (error) {
      console.error('Failed to fetch belt details:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load belt details',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTransfer = async () => {
    if (!transferUserId.trim()) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Please enter a user ID or username',
      })
      return
    }

    try {
      setIsTransferring(true)
      const response = await fetch(`/api/admin/belts/${params.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId: transferUserId,
          reason: 'ADMIN_TRANSFER',
        }),
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Success',
          description: 'Belt transferred successfully',
        })
        setTransferUserId('')
        // Refresh belt details
        await fetchBeltDetails()
        // Trigger a custom event to notify the list page to refresh
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('beltUpdated'))
        }
      } else {
        const error = await response.json()
        showToast({
          type: 'error',
          title: 'Error',
          description: error.error || 'Failed to transfer belt',
        })
      }
    } catch (error) {
      console.error('Failed to transfer belt:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to transfer belt',
      })
    } finally {
      setIsTransferring(false)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500 text-white'
      case 'INACTIVE':
        return 'bg-yellow-500 text-white'
      case 'VACANT':
        return 'bg-gray-500 text-white'
      case 'STAKED':
        return 'bg-blue-500 text-white'
      case 'MANDATORY':
        return 'bg-red-500 text-white'
      case 'GRACE_PERIOD':
      case 'GRACEPERIOD':
        return 'bg-purple-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (!belt) {
    return (
      <div className="text-center py-8">
        <p className="text-text-secondary">Belt not found</p>
        <Button onClick={() => router.push('/admin/belts')} className="mt-4">
          Back to Belts
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button
            onClick={() => router.push('/admin/belts')}
            variant="secondary"
            className="mb-4"
          >
            ← Back to Belts
          </Button>
          <h1 className="text-4xl font-bold text-white mb-2">{belt.name}</h1>
          <div className="flex items-center gap-2">
            <Badge className={getStatusBadgeColor(belt.status)} style={{ color: '#ffffff' }}>{formatBeltStatus(belt.status)}</Badge>
            <Badge className="bg-blue-500 text-white" style={{ color: '#ffffff' }}>{belt.type}</Badge>
            {belt.category && (
              <span className="inline-flex items-center font-bold rounded-full transition-colors px-3 py-1 text-xs bg-gray-600" style={{ color: '#ffffff' }}>
                {belt.category}
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 flex gap-2">
          <Button
            onClick={() => setIsViewModalOpen(true)}
            variant="secondary"
            className="whitespace-nowrap"
          >
            View Belt
          </Button>
          <Button
            onClick={() => setIsEditModalOpen(true)}
            variant="primary"
            className="whitespace-nowrap"
          >
            Edit Belt
          </Button>
        </div>
      </div>

      {/* Belt Visual Display */}
      {belt.designImageUrl ? (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Belt Design</h2>
          </CardHeader>
          <CardBody>
            <div className="relative w-full min-h-[500px] bg-bg-secondary border-2 border-bg-tertiary rounded-xl overflow-hidden flex items-center justify-center p-8">
              <img
                src={belt.designImageUrl}
                alt={belt.name}
                className="max-w-full max-h-[600px] w-auto h-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  const parent = e.currentTarget.parentElement
                  if (parent) {
                    parent.innerHTML = '<div class="flex items-center justify-center h-full text-text-secondary text-lg">Image not available or failed to load</div>'
                  }
                }}
              />
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Belt Design</h2>
          </CardHeader>
          <CardBody>
            <div className="relative w-full min-h-[500px] bg-bg-secondary border-2 border-bg-tertiary border-dashed rounded-xl overflow-hidden flex items-center justify-center">
              <div className="text-center text-text-secondary">
                <p className="text-lg mb-2">No belt image set</p>
                <p className="text-sm">Add a design image URL to see the visual belt</p>
                <Button
                  onClick={() => setIsEditModalOpen(true)}
                  variant="secondary"
                  className="mt-4"
                >
                  Add Belt Image
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Holder Info */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Current Holder</h2>
          </CardHeader>
          <CardBody>
            {belt.currentHolder ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {belt.currentHolder.avatarUrl ? (
                    <img
                      src={belt.currentHolder.avatarUrl}
                      alt={belt.currentHolder.username}
                      className="w-16 h-16 rounded-full border-2 border-primary object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full border-2 border-primary bg-bg-secondary flex items-center justify-center text-2xl font-bold text-primary">
                      {belt.currentHolder.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p>
                      <span className="text-white">User: </span>
                      <a
                        href={`/admin/users?userId=${belt.currentHolder.id}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {belt.currentHolder.username}
                      </a>
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                <p>
                  <span className="text-white">ELO: </span>
                  <span className="text-white">{belt.currentHolder.eloRating}</span>
                </p>
                <p>
                  <span className="text-white">Total Belt Wins: </span>
                  <span className="text-white">{belt.currentHolder.totalBeltWins}</span>
                </p>
                <p>
                  <span className="text-white">Total Defenses: </span>
                  <span className="text-white">{belt.currentHolder.totalBeltDefenses}</span>
                </p>
                <p>
                  <span className="text-white">Acquired: </span>
                  <span className="text-white">
                    {belt.acquiredAt
                      ? new Date(belt.acquiredAt).toLocaleString()
                      : 'N/A'}
                  </span>
                </p>
                {belt.gracePeriodEnds && (
                  <p>
                    <span className="text-white">Grace Period Ends: </span>
                    <span className="text-white">
                      {new Date(belt.gracePeriodEnds).toLocaleString()}
                    </span>
                  </p>
                )}
                </div>
              </div>
            ) : (
              <p className="text-white">No current holder (Vacant)</p>
            )}
          </CardBody>
        </Card>

        {/* Belt Stats */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Belt Statistics</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              <p>
                <span className="text-white">Times Defended: </span>
                <span className="text-white">{belt.timesDefended}</span>
              </p>
              <p>
                <span className="text-white">Successful Defenses: </span>
                <span className="text-white">{belt.successfulDefenses}</span>
              </p>
              <p>
                <span className="text-white">Total Days Held: </span>
                <span className="text-white">{belt.totalDaysHeld}</span>
              </p>
              <p>
                <span className="text-white">Coin Value: </span>
                <span className="text-white">{belt.coinValue}</span>
              </p>
              <p>
                <span className="text-white">Creation Cost: </span>
                <span className="text-white">{belt.creationCost}</span>
              </p>
              <p>
                <span className="text-white">Last Defended: </span>
                <span className="text-white">
                  {belt.lastDefendedAt
                    ? new Date(belt.lastDefendedAt).toLocaleString()
                    : 'Never'}
                </span>
              </p>
              {belt.nextDefenseDue && (
                <p>
                  <span className="text-white">Next Defense Due: </span>
                  <span className="text-white">
                    {new Date(belt.nextDefenseDue).toLocaleString()}
                  </span>
                </p>
              )}
              {belt.isStaked && (
                <p className="text-yellow-500 font-medium">
                  ⚠️ Belt is currently staked
                </p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Admin Transfer */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-white">Admin Transfer</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Transfer to User ID
              </label>
              <Input
                type="text"
                value={transferUserId}
                onChange={(e) => setTransferUserId(e.target.value)}
                placeholder="Enter user ID"
              />
            </div>
            <Button
              onClick={handleTransfer}
              disabled={isTransferring || !transferUserId.trim()}
            >
              {isTransferring ? 'Transferring...' : 'Transfer Belt'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Pending Challenges */}
      {belt.challenges.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">
              Pending Challenges ({belt.challenges.length})
            </h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {belt.challenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="bg-bg-tertiary p-4 rounded-lg border border-border"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white font-medium mb-2">
                        Challenger:{' '}
                        <a
                          href={`/admin/users?userId=${challenge.challenger.id}`}
                          className="text-primary hover:underline"
                        >
                          {challenge.challenger.username}
                        </a>
                      </p>
                      
                      {/* Debate Topic - Most Important */}
                      {challenge.debateTopic && (
                        <div className="mb-3 p-3 bg-bg-secondary rounded-lg border border-border">
                          <p className="text-text-secondary text-xs uppercase tracking-wide mb-1">
                            Debate Topic
                          </p>
                          <p className="text-white font-semibold text-base">
                            {challenge.debateTopic}
                          </p>
                          {challenge.debateDescription && (
                            <p className="text-text-secondary text-sm mt-2">
                              {challenge.debateDescription}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Debate Settings */}
                      <div className="mb-2 space-y-1">
                        {challenge.debateCategory && (
                          <p className="text-white text-sm">
                            Category: <span className="text-primary">{challenge.debateCategory}</span>
                          </p>
                        )}
                        {challenge.debateChallengerPosition && (
                          <p className="text-white text-sm">
                            Challenger Position: <span className="text-primary">{challenge.debateChallengerPosition}</span>
                          </p>
                        )}
                        {challenge.debateTotalRounds && (
                          <p className="text-white text-sm">
                            Rounds: <span className="text-primary">{challenge.debateTotalRounds}</span>
                            {challenge.debateSpeedMode && (
                              <span className="text-yellow-400 ml-2">(Speed Mode)</span>
                            )}
                          </p>
                        )}
                        {challenge.debateAllowCopyPaste === false && (
                          <p className="text-white text-sm">
                            <span className="text-yellow-400">⚠️ Copy-paste disabled</span>
                          </p>
                        )}
                      </div>
                      
                      {/* Challenge Details */}
                      <div className="mt-3 pt-3 border-t border-bg-tertiary">
                        <p className="text-white text-sm">
                          ELO: {challenge.challenger.eloRating} | Entry Fee: {challenge.entryFee}{' '}
                          coins | Expires: {new Date(challenge.expiresAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge className="ml-4">{challenge.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Belt History */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-white">Transfer History</h2>
        </CardHeader>
        <CardBody>
          {belt.history.length === 0 ? (
            <p className="text-white">No transfer history</p>
          ) : (
            <div className="space-y-4">
              {belt.history.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-bg-tertiary p-4 rounded-lg border border-border"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-gray-600 !text-white">{entry.reason}</Badge>
                        <span className="text-white text-sm">
                          {new Date(entry.transferredAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-white">From</p>
                          <p className="text-white">
                            {entry.fromUser ? (
                              <a
                                href={`/admin/users?userId=${entry.fromUser.id}`}
                                className="text-primary hover:underline"
                              >
                                {entry.fromUser.username}
                              </a>
                            ) : (
                              'N/A'
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-white">To</p>
                          <p className="text-white">
                            {entry.toUser ? (
                              <a
                                href={`/admin/users?userId=${entry.toUser.id}`}
                                className="text-primary hover:underline"
                              >
                                {entry.toUser.username}
                              </a>
                            ) : (
                              'N/A'
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-white">Days Held</p>
                          <p className="text-white">{entry.daysHeld}</p>
                        </div>
                        <div>
                          <p className="text-white">Defenses</p>
                          <p className="text-white">
                            {entry.defensesWon}W / {entry.defensesLost}L
                          </p>
                        </div>
                      </div>
                      {entry.debate && (
                        <p className="text-sm text-white mt-2">
                          Debate:{' '}
                          <a
                            href={`/admin/debates?debateId=${entry.debate.id}`}
                            className="text-primary hover:underline"
                          >
                            {entry.debate.topic}
                          </a>
                        </p>
                      )}
                      {entry.tournament && (
                        <p className="text-sm text-white mt-2">
                          Tournament:{' '}
                          <a
                            href={`/admin/tournaments?tournamentId=${entry.tournament.id}`}
                            className="text-primary hover:underline"
                          >
                            {entry.tournament.name}
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* View Belt Modal */}
      {belt && (
        <ViewBeltModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          belt={{
            id: belt.id,
            name: belt.name,
            type: belt.type,
            category: belt.category,
            status: belt.status,
            coinValue: belt.coinValue,
            designImageUrl: belt.designImageUrl,
            sponsorName: belt.sponsorName,
            sponsorLogoUrl: belt.sponsorLogoUrl,
            currentHolder: belt.currentHolder,
            timesDefended: belt.timesDefended,
            successfulDefenses: belt.successfulDefenses,
            acquiredAt: belt.acquiredAt,
            lastDefendedAt: belt.lastDefendedAt,
            createdAt: belt.createdAt,
          }}
        />
      )}

      {/* Edit Belt Modal */}
      {belt && (
        <EditBeltModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            console.log('EditBeltModal onSuccess called, refreshing belt details...')
            fetchBeltDetails()
          }}
          belt={{
            id: belt.id,
            name: belt.name,
            type: belt.type,
            category: belt.category,
            coinValue: belt.coinValue,
            designImageUrl: belt.designImageUrl,
            sponsorName: belt.sponsorName,
            sponsorLogoUrl: belt.sponsorLogoUrl,
          }}
        />
      )}
    </div>
  )
}
