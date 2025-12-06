'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/Loading'
import { TopNav } from '@/components/layout/TopNav'

interface Pricing {
  monthly: number
  yearly: number
}

export default function UpgradePage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [pricing, setPricing] = useState<Pricing>({ monthly: 9.99, yearly: 89.0 })
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY')
  const [promoCode, setPromoCode] = useState('')
  const [isValidatingPromo, setIsValidatingPromo] = useState(false)
  const [promoValid, setPromoValid] = useState<{ valid: boolean; discount?: number; finalPrice?: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [userTier, setUserTier] = useState<'FREE' | 'PRO' | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [pricingRes, subscriptionRes] = await Promise.all([
        fetch('/api/subscriptions/pricing'),
        fetch('/api/subscriptions'),
      ])

      if (pricingRes.ok) {
        const pricingData = await pricingRes.json()
        setPricing(pricingData)
      }

      if (subscriptionRes.ok) {
        const subData = await subscriptionRes.json()
        setUserTier(subData.subscription?.tier || 'FREE')
        // If already PRO, redirect to settings
        if (subData.subscription?.tier === 'PRO') {
          router.push('/settings/subscription')
          return
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) {
      setPromoValid(null)
      return
    }

    setIsValidatingPromo(true)
    try {
      const response = await fetch('/api/subscriptions/validate-promo-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCode.toUpperCase(),
          tier: 'PRO',
          billingCycle,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.valid) {
          const basePrice = billingCycle === 'MONTHLY' ? pricing.monthly : pricing.yearly
          const finalPrice = basePrice - (data.discountAmount || 0)
          setPromoValid({
            valid: true,
            discount: data.discountAmount,
            finalPrice: Math.max(0, finalPrice),
          })
          showToast({
            type: 'success',
            title: 'Promo Code Applied',
            description: `You'll save $${data.discountAmount?.toFixed(2)}!`,
          })
        } else {
          setPromoValid({ valid: false })
          showToast({
            type: 'error',
            title: 'Invalid Promo Code',
            description: data.error || 'This promo code is not valid',
          })
        }
      } else {
        const error = await response.json()
        setPromoValid({ valid: false })
        showToast({
          type: 'error',
          title: 'Error',
          description: error.error || 'Failed to validate promo code',
        })
      }
    } catch (error: any) {
      setPromoValid({ valid: false })
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to validate promo code',
      })
    } finally {
      setIsValidatingPromo(false)
    }
  }

  const handleSubscribe = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: 'PRO',
          billingCycle,
          promoCode: promoValid?.valid ? promoCode.toUpperCase() : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const data = await response.json()
      // Redirect to Stripe Checkout
      window.location.href = data.checkoutUrl
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to start checkout',
      })
      setIsProcessing(false)
    }
  }

  const basePrice = billingCycle === 'MONTHLY' ? pricing.monthly : pricing.yearly
  const discount = promoValid?.discount || 0
  const finalPrice = Math.max(0, basePrice - discount)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="UPGRADE" />
        <div className="flex items-center justify-center min-h-[60vh] pt-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (userTier === 'PRO') {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="UPGRADE" />
      <div className="pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-text-primary mb-2">Upgrade to Pro</h1>
            <p className="text-text-secondary text-lg">Unlock all premium features</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Billing Cycle Selection */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-text-primary mb-4">Choose Your Plan</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    setBillingCycle('MONTHLY')
                    setPromoValid(null)
                  }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    billingCycle === 'MONTHLY'
                      ? 'border-electric-blue bg-electric-blue/10'
                      : 'border-bg-tertiary bg-bg-secondary hover:border-bg-tertiary'
                  }`}
                >
                  <div className="text-lg font-bold text-text-primary mb-1">Monthly</div>
                  <div className="text-3xl font-bold text-electric-blue">${pricing.monthly.toFixed(2)}</div>
                  <div className="text-sm text-text-secondary">per month</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBillingCycle('YEARLY')
                    setPromoValid(null)
                  }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left relative ${
                    billingCycle === 'YEARLY'
                      ? 'border-electric-blue bg-electric-blue/10'
                      : 'border-bg-tertiary bg-bg-secondary hover:border-bg-tertiary'
                  }`}
                >
                  <div className="absolute top-2 right-2 bg-cyber-green text-black px-2 py-1 rounded text-xs font-bold">
                    SAVE {Math.round(((pricing.monthly * 12 - pricing.yearly) / (pricing.monthly * 12)) * 100)}%
                  </div>
                  <div className="text-lg font-bold text-text-primary mb-1">Yearly</div>
                  <div className="text-3xl font-bold text-electric-blue">${pricing.yearly.toFixed(2)}</div>
                  <div className="text-sm text-text-secondary">per year</div>
                </button>
              </CardBody>
            </Card>

            {/* Promo Code & Summary */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-text-primary mb-4">Promo Code</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value.toUpperCase())
                      setPromoValid(null)
                    }}
                    placeholder="Enter promo code"
                    className="flex-1"
                  />
                  <Button
                    variant="secondary"
                    onClick={handleValidatePromo}
                    isLoading={isValidatingPromo}
                  >
                    Apply
                  </Button>
                </div>

                {promoValid?.valid && (
                  <div className="p-3 bg-cyber-green/10 border border-cyber-green/30 rounded-lg">
                    <p className="text-sm text-cyber-green">
                      ✓ Promo code applied! Save ${discount.toFixed(2)}
                    </p>
                  </div>
                )}

                {promoValid?.valid === false && (
                  <div className="p-3 bg-neon-orange/10 border border-neon-orange/30 rounded-lg">
                    <p className="text-sm text-neon-orange">
                      Invalid promo code
                    </p>
                  </div>
                )}

                {/* Price Summary */}
                <div className="pt-4 border-t border-bg-tertiary space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Subtotal:</span>
                    <span className="text-text-primary font-semibold">${basePrice.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center text-cyber-green">
                      <span>Discount:</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-bg-tertiary">
                    <span className="text-lg font-bold text-text-primary">Total:</span>
                    <span className="text-2xl font-bold text-electric-blue">${finalPrice.toFixed(2)}</span>
                  </div>
                  {billingCycle === 'YEARLY' && (
                    <p className="text-xs text-text-secondary mt-2 text-center">
                      Billed annually. Cancel anytime.
                    </p>
                  )}
                </div>

                <Button
                  variant="primary"
                  onClick={handleSubscribe}
                  isLoading={isProcessing}
                  className="w-full py-3 text-base font-semibold"
                >
                  Subscribe to Pro
                </Button>
              </CardBody>
            </Card>
          </div>

          {/* Pro Features */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">What's Included in Pro</h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">Unlimited Speed Mode debates</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">Priority matchmaking</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">Advanced analytics dashboard</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">4 tournament credits/month</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">12 appeals per month</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">"That's The One" unlimited</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">Debate replay & export</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">Custom profile themes</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">Verified badge</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-primary">No ads</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

