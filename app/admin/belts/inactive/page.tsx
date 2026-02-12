'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

interface InactiveBelt {
  id: string
  name: string
  type: string
  category: string | null
  coinValue: number
  inactiveAt: string | null
  lastDefendedAt: string | null
  currentHolder: {
    id: string
    username: string
    avatarUrl: string | null
    eloRating: number
  } | null
}

export default function InactiveBeltsPage() {
  const { showToast } = useToast()
  const [belts, setBelts] = useState<InactiveBelt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isChecking, setIsChecking] = useState(false)
  const [now] = useState(() => Date.now())

  useEffect(() => {
    fetchInactiveBelts()
  }, [])

  const fetchInactiveBelts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/belts/inactive')
      if (response.ok) {
        const data = await response.json()
        setBelts(data.belts || [])
      } else {
        const error = await response.json()
        showToast({
          type: 'error',
          title: 'Error',
          description: error.error || 'Failed to load inactive belts',
        })
      }
    } catch (error) {
      console.error('Failed to fetch inactive belts:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load inactive belts',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckInactive = async () => {
    try {
      setIsChecking(true)
      const response = await fetch('/api/admin/belts/inactive', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        showToast({
          type: 'success',
          title: 'Success',
          description: `Checked inactive belts. ${data.beltsMarkedInactive} belt(s) marked as inactive.`,
        })
        fetchInactiveBelts()
      } else {
        const error = await response.json()
        showToast({
          type: 'error',
          title: 'Error',
          description: error.error || 'Failed to check inactive belts',
        })
      }
    } catch (error) {
      console.error('Failed to check inactive belts:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to check inactive belts',
      })
    } finally {
      setIsChecking(false)
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'ROOKIE':
        return 'bg-blue-500 text-white'
      case 'CATEGORY':
        return 'bg-green-500 text-white'
      case 'CHAMPIONSHIP':
        return 'bg-yellow-500 text-white'
      case 'UNDEFEATED':
        return 'bg-purple-500 text-white'
      case 'TOURNAMENT':
        return 'bg-orange-500 text-white'
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Inactive Belts</h1>
          <p className="text-text-secondary">
            Belts that haven't been defended within the inactivity period
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleCheckInactive}
            variant="primary"
            isLoading={isChecking}
          >
            Check for Inactive Belts
          </Button>
          <Link href="/admin/belts">
            <Button variant="secondary">
              Back to Belts
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-white">
            Inactive Belts ({belts.length})
          </h2>
        </CardHeader>
        <CardBody>
          {belts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-secondary text-lg mb-4">
                No inactive belts found
              </p>
              <p className="text-text-secondary">
                All belts are currently active or have been defended recently.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {belts.map((belt) => {
                const inactiveDate = belt.inactiveAt ? new Date(belt.inactiveAt) : null
                const lastDefendedDate = belt.lastDefendedAt ? new Date(belt.lastDefendedAt) : null
                const daysInactive = inactiveDate && lastDefendedDate
                  ? Math.floor((now - lastDefendedDate.getTime()) / (24 * 60 * 60 * 1000))
                  : null

                return (
                  <div
                    key={belt.id}
                    className="bg-bg-tertiary p-6 rounded-lg border border-yellow-500/50"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold text-white">
                            {belt.name}
                          </h3>
                          <Badge className={getTypeBadgeColor(belt.type)} style={{ color: '#ffffff' }}>
                            {belt.type}
                          </Badge>
                          {belt.category && (
                            <span className="inline-flex items-center font-bold rounded-full transition-colors px-3 py-1 text-xs bg-gray-600" style={{ color: '#ffffff' }}>
                              {belt.category}
                            </span>
                          )}
                        </div>

                        {belt.currentHolder && (
                          <div className="mb-2">
                            <p className="text-text-secondary text-sm">Current Holder:</p>
                            <p className="text-white">
                              <Link
                                href={`/profile/${belt.currentHolder.username}`}
                                className="text-primary hover:underline"
                              >
                                {belt.currentHolder.username}
                              </Link>
                              {' '}
                              <span className="text-text-secondary">
                                (ELO: {belt.currentHolder.eloRating})
                              </span>
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                          <div>
                            <p className="text-text-secondary">Coin Value</p>
                            <p className="text-white font-medium">{belt.coinValue}</p>
                          </div>
                          {lastDefendedDate && (
                            <div>
                              <p className="text-text-secondary">Last Defended</p>
                              <p className="text-white font-medium">
                                {lastDefendedDate.toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {inactiveDate && (
                            <div>
                              <p className="text-text-secondary">Became Inactive</p>
                              <p className="text-white font-medium">
                                {inactiveDate.toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {daysInactive !== null && (
                            <div>
                              <p className="text-text-secondary">Days Inactive</p>
                              <p className="text-white font-medium">{daysInactive}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <Link href={`/admin/belts/${belt.id}`}>
                          <Button variant="secondary" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
