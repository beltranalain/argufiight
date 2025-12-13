'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'

interface Creator {
  id: string
  username: string
  email: string
  eloRating: number
  creatorStatus: string | null
  totalDebates: number
  createdAt: string
  stripeAccountId: string | null
  payoutEnabled: boolean
  taxFormComplete: boolean
  bankVerified: boolean
  totalContracts: number
  totalEarned: number
  pendingPayout: number
}

export function CreatorsTab() {
  const { showToast } = useToast()
  const [creators, setCreators] = useState<Creator[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending_setup'>('all')

  useEffect(() => {
    fetchCreators()
  }, [searchQuery, statusFilter])

  const fetchCreators = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/admin/creators?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setCreators(data.creators || [])
      }
    } catch (error) {
      console.error('Failed to fetch creators:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (creator: Creator) => {
    if (!creator.stripeAccountId) {
      return <Badge className="bg-red-500/20 text-red-400">No Stripe Account</Badge>
    }
    if (!creator.payoutEnabled) {
      return <Badge className="bg-yellow-500/20 text-yellow-400">Setup Incomplete</Badge>
    }
    return <Badge className="bg-cyber-green/20 text-cyber-green">Active</Badge>
  }

  const getTierBadge = (status: string | null) => {
    if (!status) return null
    const colors: Record<string, string> = {
      BRONZE: 'bg-amber-600/20 text-amber-400',
      SILVER: 'bg-gray-400/20 text-gray-300',
      GOLD: 'bg-yellow-500/20 text-yellow-400',
      PLATINUM: 'bg-cyan-500/20 text-cyan-400',
    }
    return (
      <Badge className={colors[status] || 'bg-gray-500/20 text-gray-400'}>
        {status}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Input
          type="text"
          placeholder="Search creators by username or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-2">
          {(['all', 'active', 'pending_setup'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === status
                  ? 'bg-electric-blue text-white'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              {status === 'all' ? 'All' : status === 'active' ? 'Active' : 'Pending Setup'}
            </button>
          ))}
        </div>
      </div>

      {/* Creators List */}
      {creators.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-text-secondary text-center py-8">
              No creators found.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {creators.map((creator) => (
            <Card key={creator.id}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-text-primary">
                        @{creator.username}
                      </h3>
                      {getTierBadge(creator.creatorStatus)}
                      {getStatusBadge(creator)}
                    </div>
                    <div className="text-sm text-text-secondary space-y-1">
                      <p>Email: {creator.email}</p>
                      <p>ELO: {creator.eloRating} • Debates: {creator.totalDebates}</p>
                      <p>Contracts: {creator.totalContracts} • Total Earned: ${creator.totalEarned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      {creator.pendingPayout > 0 && (
                        <p className="text-electric-blue">
                          Pending Payout: ${creator.pendingPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      )}
                      <p>Joined: {new Date(creator.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {!creator.stripeAccountId && (
                      <Badge className="bg-red-500/20 text-red-400 text-xs">
                        Stripe Not Set Up
                      </Badge>
                    )}
                    {creator.stripeAccountId && !creator.payoutEnabled && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                        Onboarding Incomplete
                      </Badge>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

