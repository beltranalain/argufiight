'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  const [isProcessing, setIsProcessing] = useState(false)
  const [offer, setOffer] = useState<any>(null)
  const [contract, setContract] = useState<any>(null)

  useEffect(() => {
    const offerId = searchParams.get('offerId')
    const contractId = searchParams.get('contractId')
    
    if (!offerId && !contractId) {
      router.push('/advertiser/dashboard')
      return
    }

    fetchDetails(offerId, contractId)
  }, [searchParams, router])

  const fetchDetails = async (offerId: string | null, contractId: string | null) => {
    try {
      setIsLoading(true)
      
      if (offerId) {
        const response = await fetch(`/api/advertiser/offers/${offerId}`)
        if (response.ok) {
          const data = await response.json()
          setOffer(data.offer)
        } else {
          throw new Error('Failed to fetch offer')
        }
      } else if (contractId) {
        // For now, contracts will be fetched from the checkout API
        // We'll get the amount from the checkout session
        setContract({ id: contractId })
      } else {
        throw new Error('No offer or contract ID provided')
      }
    } catch (error) {
      console.error('Failed to fetch details:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load payment details',
      })
      router.push('/advertiser/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckout = async () => {
    setIsProcessing(true)
    try {
      const offerId = searchParams.get('offerId')
      const contractId = searchParams.get('contractId')
      
      const response = await fetch('/api/advertiser/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: offerId || undefined,
          contractId: contractId || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const data = await response.json()
      
      // Redirect to Stripe Checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to start checkout',
      })
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="ADVERTISER" />
        <div className="flex items-center justify-center min-h-[60vh] pt-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  const paymentInfo = offer || contract
  const amount = offer ? Number(offer.amount) : (contract ? Number(contract.totalAmount) : 0)
  const description = offer 
    ? `Campaign: ${offer.campaign?.name} - Creator: ${offer.creator?.username}`
    : (contract ? `Campaign: ${contract.campaign?.name} - Creator: ${contract.creator?.username}` : '')

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
                <div className="bg-bg-tertiary rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Description:</span>
                    <span className="text-text-primary font-medium">{description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Amount:</span>
                    <span className="text-electric-blue font-bold text-xl">
                      ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
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
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCheckout}
                  isLoading={isProcessing}
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

