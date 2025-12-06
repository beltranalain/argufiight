'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/Loading'

export default function SelectTierPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false)
  const [pricing, setPricing] = useState({ monthly: 9.99, yearly: 89.0 })

  useEffect(() => {
    // Check if user is authenticated and fetch pricing
    Promise.all([
      fetch('/api/auth/me'),
      fetch('/api/subscriptions/pricing'),
    ])
      .then(async ([authRes, pricingRes]) => {
        if (!authRes.ok) {
          router.push('/login')
          return
        }
        if (pricingRes.ok) {
          const pricingData = await pricingRes.json()
          setPricing(pricingData)
        }
        setIsLoading(false)
      })
      .catch(() => {
        router.push('/login')
      })
  }, [router])

  const handleSelectFree = async () => {
    setIsCreatingSubscription(true)
    try {
      // Create FREE subscription
      const response = await fetch('/api/subscriptions/create-free', {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create subscription')
      }

      // Redirect to dashboard
      router.push('/')
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to set up account',
      })
    } finally {
      setIsCreatingSubscription(false)
    }
  }

  const handleSelectPro = () => {
    router.push('/signup/payment?tier=PRO&cycle=MONTHLY')
  }

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Choose Your Plan</h1>
          <p className="text-text-secondary text-lg">Select the plan that's right for you</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Free Tier */}
          <Card className="relative border border-electric-blue/30 hover:border-electric-blue/50 transition-colors">
            <CardHeader className="pb-4">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-3">Free</h2>
                <div className="text-5xl font-bold text-electric-blue mb-2">
                  $0
                  <span className="text-xl text-text-secondary font-normal ml-1">/forever</span>
                </div>
                <p className="text-sm text-text-secondary mt-2">Perfect for getting started</p>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">Unlimited standard debates (24-hour rounds, 5 rounds)</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">Create & accept challenges</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">AI judge verdicts (3 judges)</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">ELO ranking system</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">Watch live debates</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">Basic profile stats</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">Join free tournaments</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">"That's The One" (10/month)</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">4 appeals per month</span>
                </li>
              </ul>
              <Button
                variant="secondary"
                onClick={handleSelectFree}
                isLoading={isCreatingSubscription}
                className="w-full py-3 text-base font-semibold"
              >
                Continue with Free
              </Button>
            </CardBody>
          </Card>

          {/* Pro Tier */}
          <Card className="relative border-2 border-electric-blue hover:border-electric-blue transition-colors">
            <div className="absolute -top-3 right-6 bg-electric-blue text-black px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
              POPULAR
            </div>
            <CardHeader className="pb-4">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-3">Pro</h2>
                <div className="text-5xl font-bold text-electric-blue mb-2">
                  $9.99
                  <span className="text-xl text-text-secondary font-normal ml-1">/month</span>
                </div>
                <p className="text-sm text-text-secondary mt-2">
                  or ${pricing.yearly.toFixed(2)}/year
                  {pricing.monthly * 12 > pricing.yearly && (
                    <span className="text-cyber-green ml-1">
                      (save {Math.round(((pricing.monthly * 12 - pricing.yearly) / (pricing.monthly * 12)) * 100)}%)
                    </span>
                  )}
                </p>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <p className="text-sm text-text-secondary mb-6 font-medium">Everything in Free, PLUS:</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">Unlimited Speed Mode debates</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">Priority matchmaking</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">Advanced analytics dashboard</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">4 tournament credits/month</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">12 appeals per month</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">"That's The One" unlimited</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">Debate replay & export</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">Custom profile themes</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">Verified badge</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">No ads</span>
                </li>
              </ul>
              <Button
                variant="primary"
                onClick={handleSelectPro}
                className="w-full py-3 text-base font-semibold"
              >
                Upgrade to Pro
              </Button>
            </CardBody>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Link href="/" className="text-text-secondary hover:text-text-primary text-sm transition-colors">
            Skip for now
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}

