'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'

function SuccessPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    if (!sessionId) {
      router.push('/advertiser/dashboard')
      return
    }

    // Verify and process the payment
    verifyPayment(sessionId)
  }, [searchParams, router])

  const verifyPayment = async (sessionId: string) => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/advertiser/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to verify payment')
      }

      const data = await response.json()
      setSuccess(true)
      
      showToast({
        type: 'success',
        title: 'Payment Successful',
        description: 'Your payment has been processed and held in escrow.',
      })

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/advertiser/dashboard')
      }, 3000)
    } catch (error: any) {
      console.error('Payment verification error:', error)
      setError(error.message || 'Failed to verify payment')
      showToast({
        type: 'error',
        title: 'Payment Verification Failed',
        description: error.message || 'Please contact support if you were charged.',
      })
    } finally {
      setIsProcessing(false)
      setIsLoading(false)
    }
  }

  if (isLoading || isProcessing) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-text-secondary mt-4">Processing your payment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <h1 className="text-2xl font-bold text-white">Payment Failed</h1>
          </CardHeader>
          <CardBody>
            <p className="text-text-secondary mb-4">
              We couldn't verify your payment. Please contact support if you were charged.
            </p>
            <div className="flex gap-4">
              <Button
                variant="primary"
                onClick={() => router.push('/advertiser/dashboard')}
                className="flex-1"
              >
                Back to Dashboard
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push('/advertiser/settings')}
                className="flex-1"
              >
                Contact Support
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <h1 className="text-2xl font-bold text-electric-blue">Payment Successful!</h1>
          </CardHeader>
          <CardBody>
            <p className="text-text-secondary mb-4">
              Your payment has been processed and is being held in escrow. The funds will be released to the creator when the contract is completed.
            </p>
            <p className="text-sm text-text-muted mb-6">
              Redirecting to your dashboard...
            </p>
            <Button
              variant="primary"
              onClick={() => router.push('/advertiser/dashboard')}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardBody>
        </Card>
      </div>
    )
  }

  return null
}

export default function AdvertiserPaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  )
}

