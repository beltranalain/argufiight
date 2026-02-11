'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/fetchClient'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'

function SuccessPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const verifyPaymentMutation = useMutation({
    mutationFn: (sessionId: string) =>
      fetchClient<{ success: boolean }>('/api/advertiser/payment/verify', {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      }),
    onSuccess: () => {
      setSuccess(true)
      showToast({
        type: 'success',
        title: 'Payment Successful',
        description: 'Your payment has been processed and held in escrow.',
      })
      setTimeout(() => {
        window.location.href = '/advertiser/dashboard'
      }, 2000)
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to verify payment')
      showToast({
        type: 'error',
        title: 'Payment Verification Failed',
        description: err.message || 'Please contact support if you were charged.',
      })
    },
  })

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    if (!sessionId) {
      setError('No session ID found. If payment was successful, please check your dashboard.')
      setTimeout(() => {
        window.location.href = '/advertiser/dashboard'
      }, 5000)
      return
    }

    verifyPaymentMutation.mutate(sessionId)
  }, [searchParams])

  if (verifyPaymentMutation.isPending) {
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
                onClick={() => {
                  window.location.href = '/advertiser/dashboard'
                }}
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
              onClick={() => {
                window.location.href = '/advertiser/dashboard'
              }}
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
