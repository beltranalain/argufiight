'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/Loading'
import { createStripeClient } from '@/lib/stripe/stripe-client'

export default function SuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    if (!sessionId) {
      router.push('/signup/select-tier')
      return
    }

    // Verify and process the checkout session
    verifyCheckoutSession(sessionId)
  }, [searchParams, router])

  const verifyCheckoutSession = async (sessionId: string) => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/subscriptions/verify-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to verify checkout')
      }

      const data = await response.json()
      setSuccess(true)
      setIsLoading(false)

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to complete subscription',
      })
      setIsLoading(false)
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading || isProcessing) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
          <p className="text-text-secondary mt-4">Processing your subscription...</p>
        </div>
      </AuthLayout>
    )
  }

  if (!success) {
    return (
      <AuthLayout>
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <h1 className="text-2xl font-bold text-white">Subscription Failed</h1>
          </CardHeader>
          <CardBody>
            <p className="text-text-secondary mb-4">
              We couldn't verify your subscription. Please contact support if you were charged.
            </p>
            <Button variant="primary" onClick={() => router.push('/signup/select-tier')}>
              Try Again
            </Button>
          </CardBody>
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to Pro!</h1>
            <p className="text-text-secondary">Your subscription is now active</p>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4 mb-6">
            <div className="p-4 bg-cyber-green/10 border border-cyber-green/30 rounded-lg">
              <p className="text-cyber-green font-semibold mb-2">✅ Subscription Active</p>
              <p className="text-sm text-text-secondary">
                You now have access to all Pro features including unlimited speed debates, advanced analytics, and more!
              </p>
            </div>
          </div>
          <Button variant="primary" onClick={() => router.push('/')} className="w-full">
            Go to Dashboard
          </Button>
          <p className="text-xs text-text-secondary text-center mt-4">
            Redirecting automatically in 3 seconds...
          </p>
        </CardBody>
      </Card>
    </AuthLayout>
  )
}

