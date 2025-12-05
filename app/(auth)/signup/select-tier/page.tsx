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

  useEffect(() => {
    // Check if user is authenticated
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.push('/login')
        } else {
          setIsLoading(false)
        }
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
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Choose Your Plan</h1>
          <p className="text-text-secondary">Select the plan that's right for you</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Free Tier */}
          <Card className="relative">
            <CardHeader>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Free</h2>
                <div className="text-4xl font-bold text-electric-blue mb-1">
                  $0
                  <span className="text-lg text-text-secondary font-normal">/forever</span>
                </div>
                <p className="text-sm text-text-secondary">Perfect for getting started</p>
              </div>
            </CardHeader>
            <CardBody>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-cyber-green text-lg">✅</span>
                  <span className="text-text-primary">Unlimited standard debates (24-hour rounds, 5 rounds)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyber-green text-lg">✅</span>
                  <span className="text-text-primary">Create & accept challenges</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyber-green text-lg">✅</span>
                  <span className="text-text-primary">AI judge verdicts (3 judges)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyber-green text-lg">✅</span>
                  <span className="text-text-primary">ELO ranking system</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyber-green text-lg">✅</span>
                  <span className="text-text-primary">Watch live debates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyber-green text-lg">✅</span>
                  <span className="text-text-primary">Basic profile stats</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyber-green text-lg">✅</span>
                  <span className="text-text-primary">Join free tournaments</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyber-green text-lg">✅</span>
                  <span className="text-text-primary">"That's The One" (10/month)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyber-green text-lg">✅</span>
                  <span className="text-text-primary">4 appeals per month</span>
                </li>
              </ul>
              <Button
                variant="secondary"
                onClick={handleSelectFree}
                isLoading={isCreatingSubscription}
                className="w-full"
              >
                Continue with Free
              </Button>
            </CardBody>
          </Card>

          {/* Pro Tier */}
          <Card className="relative border-2 border-electric-blue">
            <div className="absolute top-4 right-4 bg-electric-blue text-black px-3 py-1 rounded-full text-xs font-bold">
              POPULAR
            </div>
            <CardHeader>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Pro</h2>
                <div className="text-4xl font-bold text-electric-blue mb-1">
                  $9.99
                  <span className="text-lg text-text-secondary font-normal">/month</span>
                </div>
                <p className="text-sm text-text-secondary">or $89/year (save 25%)</p>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-text-secondary mb-4">Everything in Free, PLUS:</p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-cyber-green text-lg">✅</span>
                  <span className="text-text-primary">Unlimited Speed Mode debates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyber-green text-lg">✅</span>
                  <span className="text-text-primary">Priority matchmaking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyber-green text-lg">✅</span>
                  <span className="text-text-primary">Advanced analytics dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyber-green text-lg">✅</span>
                  <span className="text-text-primary">4 tournament credits/month</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyber-green text-lg">✅</span>
                  <span className="text-text-primary">12 appeals per month</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyber-green text-lg">✅</span>
                  <span className="text-text-primary">"That's The One" unlimited</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyber-green text-lg">✅</span>
                  <span className="text-text-primary">Debate replay & export</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyber-green text-lg">✅</span>
                  <span className="text-text-primary">Custom profile themes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyber-green text-lg">✅</span>
                  <span className="text-text-primary">Verified badge</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyber-green text-lg">✅</span>
                  <span className="text-text-primary">No ads</span>
                </li>
              </ul>
              <Button
                variant="primary"
                onClick={handleSelectPro}
                className="w-full"
              >
                Upgrade to Pro
              </Button>
            </CardBody>
          </Card>
        </div>

        <div className="text-center">
          <Link href="/" className="text-text-secondary hover:text-text-primary text-sm">
            Skip for now
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}

