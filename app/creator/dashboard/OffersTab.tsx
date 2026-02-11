'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/fetchClient'
import { ApiError } from '@/lib/api/fetchClient'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'

interface Offer {
  id: string
  amount: number
  placement: string
  duration: number
  paymentType: string
  message: string | null
  status: string
  expiresAt: string
  createdAt: string
  advertiser: {
    companyName: string
  }
  campaign: {
    name: string
  }
}

export function OffersTab() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<'PENDING' | 'ACCEPTED' | 'DECLINED' | 'ALL'>('PENDING')

  const { data: offers = [], isLoading, error, refetch } = useQuery<Offer[]>({
    queryKey: ['creator', 'offers', filter],
    queryFn: async () => {
      const url = filter === 'ALL' ? '/api/creator/offers' : `/api/creator/offers?status=${filter}`
      const data = await fetchClient<{ offers: Offer[] }>(url)
      return data.offers || []
    },
  })

  const acceptMutation = useMutation({
    mutationFn: (offerId: string) =>
      fetchClient(`/api/creator/offers/${offerId}/accept`, { method: 'POST' }),
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Offer Accepted',
        description: 'Contract created and payment held in escrow.',
      })
      queryClient.invalidateQueries({ queryKey: ['creator', 'offers'] })
      queryClient.invalidateQueries({ queryKey: ['creator', 'dashboard'] })
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 402) {
        showToast({
          type: 'warning',
          title: 'Payment Required',
          description: 'The advertiser needs to complete payment. The contract will be created once payment is processed.',
        })
        queryClient.invalidateQueries({ queryKey: ['creator', 'offers'] })
      } else {
        showToast({
          type: 'error',
          title: 'Error',
          description: error instanceof ApiError ? error.message : 'Failed to accept offer',
        })
      }
    },
  })

  const declineMutation = useMutation({
    mutationFn: (offerId: string) =>
      fetchClient(`/api/creator/offers/${offerId}/decline`, { method: 'POST' }),
    onSuccess: () => {
      showToast({
        type: 'success',
        title: 'Offer Declined',
      })
      queryClient.invalidateQueries({ queryKey: ['creator', 'offers'] })
      queryClient.invalidateQueries({ queryKey: ['creator', 'dashboard'] })
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to decline offer',
      })
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-500'
      case 'ACCEPTED':
        return 'bg-cyber-green/20 text-cyber-green'
      case 'DECLINED':
        return 'bg-gray-500/20 text-gray-400'
      case 'EXPIRED':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to load offers"
        message={error instanceof Error ? error.message : 'Something went wrong. Please try again.'}
        onRetry={() => refetch()}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-primary">Offer Inbox</h2>
        <div className="flex gap-2">
          {(['PENDING', 'ACCEPTED', 'DECLINED', 'ALL'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === f
                  ? 'bg-electric-blue text-white'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {offers.length === 0 ? (
        <Card>
          <CardBody>
            <p className="text-text-secondary text-center py-8">
              No offers found.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <Card key={offer.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-text-primary">
                      {offer.advertiser.companyName}
                    </h3>
                    <p className="text-text-secondary mt-1">
                      Campaign: {offer.campaign.name}
                    </p>
                  </div>
                  <Badge className={getStatusColor(offer.status)}>{offer.status}</Badge>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-text-secondary">Amount:</span>
                      <div className="text-lg font-bold text-cyber-green">
                        ${Number(offer.amount ?? 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-text-secondary">Duration:</span>
                      <div className="text-lg font-bold text-text-primary">
                        {offer.duration} days
                      </div>
                    </div>
                    <div>
                      <span className="text-text-secondary">Placement:</span>
                      <div className="text-lg font-bold text-text-primary">
                        {offer.placement.replace(/_/g, ' ')}
                      </div>
                    </div>
                    <div>
                      <span className="text-text-secondary">Payment Type:</span>
                      <div className="text-lg font-bold text-text-primary">
                        {offer.paymentType.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>

                  {offer.message && (
                    <div className="bg-bg-secondary rounded-lg p-4">
                      <p className="text-sm font-semibold text-text-secondary mb-1">
                        Message from Advertiser:
                      </p>
                      <p className="text-text-primary">{offer.message}</p>
                    </div>
                  )}

                  <div className="text-sm text-text-secondary">
                    <p>
                      Expires: {new Date(offer.expiresAt).toLocaleDateString()}
                    </p>
                    <p>
                      Received: {new Date(offer.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {offer.status === 'PENDING' && (
                    <div className="flex gap-2 pt-4 border-t border-bg-tertiary">
                      <Button
                        variant="primary"
                        onClick={() => acceptMutation.mutate(offer.id)}
                        isLoading={acceptMutation.isPending && acceptMutation.variables === offer.id}
                        className="flex-1"
                      >
                        Accept Offer
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => declineMutation.mutate(offer.id)}
                        isLoading={declineMutation.isPending && declineMutation.variables === offer.id}
                        className="flex-1"
                      >
                        Decline
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          // TODO: Open counter offer modal
                        }}
                        className="flex-1"
                      >
                        Counter Offer
                      </Button>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
