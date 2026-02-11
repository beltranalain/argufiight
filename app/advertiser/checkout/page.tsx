'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/fetchClient'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { TopNav } from '@/components/layout/TopNav'

function CheckoutPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [offer, setOffer] = useState<any>(null)
  const [contract, setContract] = useState<any>(null)
  const [isAdvertiser, setIsAdvertiser] = useState(false)

  useEffect(() => {
    verifyAdvertiser()
  }, [])

  useEffect(() => {
    if (!isAdvertiser) return

    const offerId = searchParams.get('offerId')
    const contractId = searchParams.get('contractId')

    if (offerId && (offerId === '<OFFER_ID>' || offerId.length < 10)) {
      showToast({
        type: 'error',
        title: 'Invalid Offer ID',
        description: 'Please select an offer from your dashboard to pay.',
      })
      router.push('/advertiser/dashboard')
      return
    }

    if (!offerId && !contractId) {
      showToast({
        type: 'error',
        title: 'Missing Information',
        description: 'Please select an offer or contract to pay for.',
      })
      router.push('/advertiser/dashboard')
      return
    }

    fetchDetails(offerId, contractId)
  }, [searchParams, router, isAdvertiser])

  const verifyAdvertiser = async () => {
    try {
      const response = await fetch('/api/advertiser/me')
      if (response.ok) {
        setIsAdvertiser(true)
      } else if (response.status === 404) {
        showToast({
          type: 'error',
          title: 'Advertiser Account Required',
          description: 'You need an advertiser account to access this page.',
        })
        router.push('/advertise')
      } else {
        router.push('/login?userType=advertiser')
      }
    } catch {
      router.push('/advertiser/dashboard')
    }
  }

  const fetchDetails = async (offerId: string | null, contractId: string | null) => {
    try {
      setIsLoading(true)

      if (offerId) {
        const data = await fetchClient<{ offer: any }>(`/api/advertiser/offers/${encodeURIComponent(offerId)}`)
        if (data.offer) {
          setOffer(data.offer)
        } else {
          throw new Error('Offer not found')
        }
      } else if (contractId) {
        setContract({ id: contractId })
      } else {
        throw new Error('No offer or contract ID provided')
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to load payment details',
      })
      router.push('/advertiser/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const checkoutMutation = useMutation({
    mutationFn: () => {
      const offerId = searchParams.get('offerId')
      const contractId = searchParams.get('contractId')

      return fetchClient<{ checkoutUrl: string }>('/api/advertiser/checkout', {
        method: 'POST',
        body: JSON.stringify({
          offerId: offerId || undefined,
          contractId: contractId || undefined,
        }),
      })
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        throw new Error('No checkout URL received')
      }
    },
    onError: (error: Error) => {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to start checkout',
      })
    },
  })

  if (isLoading || !isAdvertiser) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="ADVERTISER" />
        <div className="flex items-center justify-center min-h-[60vh] pt-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!offer && !contract) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="ADVERTISER" />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <h1 className="text-2xl font-bold text-white">Payment Not Available</h1>
            </CardHeader>
            <CardBody>
              <p className="text-text-secondary mb-4">
                Unable to load payment details. Please select an offer from your dashboard.
              </p>
              <Button
                variant="primary"
                onClick={() => router.push('/advertiser/dashboard')}
              >
                Back to Dashboard
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    )
  }

  const baseAmount = offer ? Number(offer.amount) : (contract ? Number(contract.totalAmount) : 0)
  const description = offer
    ? `Campaign: ${offer.campaign?.name || 'N/A'} - Creator: ${offer.creator?.username || 'N/A'}`
    : (contract ? `Campaign: ${contract.campaign?.name || 'N/A'} - Creator: ${contract.creator?.username || 'N/A'}` : 'Payment')

  // Calculate Stripe fees (2.9% + $0.30)
  const stripeFee = baseAmount * 0.029 + 0.30
  const totalAmount = baseAmount + stripeFee

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="ADVERTISER" />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold text-white">Complete Payment</h1>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-2">Payment Details</h2>
                <div className="bg-bg-tertiary rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Description:</span>
                    <span className="text-text-primary font-medium">{description}</span>
                  </div>
                  <div className="border-t border-bg-secondary pt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Contract Amount:</span>
                      <span className="text-text-primary font-medium">
                        ${baseAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Processing Fee (2.9% + $0.30):</span>
                      <span className="text-text-secondary">
                        ${stripeFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-bg-secondary pt-2">
                      <span className="text-text-primary font-semibold">Total Amount:</span>
                      <span className="text-electric-blue font-bold text-xl">
                        ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-electric-blue/10 border border-electric-blue/30 rounded-lg p-4">
                <p className="text-sm text-text-secondary">
                  <strong className="text-electric-blue">Payment will be held in escrow</strong> and released to the creator when the contract is completed.
                  Platform fees will be deducted before the creator receives payment.
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="secondary"
                  onClick={() => router.push('/advertiser/dashboard')}
                  className="flex-1"
                  disabled={checkoutMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => checkoutMutation.mutate()}
                  isLoading={checkoutMutation.isPending}
                  className="flex-1"
                >
                  Proceed to Payment
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default function AdvertiserCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <CheckoutPageContent />
    </Suspense>
  )
}
