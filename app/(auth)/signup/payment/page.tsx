'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/Loading'

export default function PaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  
  const tier = searchParams.get('tier') || 'PRO'
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>(
    (searchParams.get('cycle') as 'MONTHLY' | 'YEARLY') || 'MONTHLY'
  )
  const [promoCode, setPromoCode] = useState('')
  const [isValidatingPromo, setIsValidatingPromo] = useState(false)
  const [promoValid, setPromoValid] = useState<{ valid: boolean; discount?: number; finalPrice?: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  const monthlyPrice = 9.99
  const yearlyPrice = 89.00
  const basePrice = billingCycle === 'MONTHLY' ? monthlyPrice : yearlyPrice

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
          code: promoCode.trim(),
          tier,
          billingCycle,
        }),
      })

      const data = await response.json()

      if (data.valid) {
        setPromoValid({
          valid: true,
          discount: data.discountAmount,
          finalPrice: data.finalPrice,
        })
        showToast({
          type: 'success',
          title: 'Promo Code Applied',
          description: `Discount: $${data.discountAmount.toFixed(2)}`,
        })
      } else {
        setPromoValid({ valid: false })
        showToast({
          type: 'error',
          title: 'Invalid Promo Code',
          description: data.error || 'This promo code is not valid',
        })
      }
    } catch (error: any) {
      setPromoValid({ valid: false })
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to validate promo code',
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
          tier,
          billingCycle,
          promoCode: promoCode.trim() || undefined,
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

  const finalPrice = promoValid?.finalPrice || basePrice
  const discount = promoValid?.discount || 0

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
      <div className="w-full max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Complete Your Subscription</h1>
          <p className="text-text-secondary">Choose your billing cycle and enter a promo code if you have one</p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold text-white">Pro Subscription</h2>
          </CardHeader>
          <CardBody className="space-y-6">
            {/* Billing Cycle Selection */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                Billing Cycle
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setBillingCycle('MONTHLY')
                    setPromoValid(null) // Reset promo validation when cycle changes
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    billingCycle === 'MONTHLY'
                      ? 'border-electric-blue bg-electric-blue/10'
                      : 'border-bg-tertiary bg-bg-secondary hover:border-bg-tertiary'
                  }`}
                >
                  <div className="text-lg font-bold text-white mb-1">Monthly</div>
                  <div className="text-2xl font-bold text-electric-blue">$9.99</div>
                  <div className="text-sm text-text-secondary">per month</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBillingCycle('YEARLY')
                    setPromoValid(null) // Reset promo validation when cycle changes
                  }}
                  className={`p-4 rounded-lg border-2 transition-all relative ${
                    billingCycle === 'YEARLY'
                      ? 'border-electric-blue bg-electric-blue/10'
                      : 'border-bg-tertiary bg-bg-secondary hover:border-bg-tertiary'
                  }`}
                >
                  <div className="absolute top-2 right-2 bg-cyber-green text-black px-2 py-1 rounded text-xs font-bold">
                    SAVE 25%
                  </div>
                  <div className="text-lg font-bold text-white mb-1">Yearly</div>
                  <div className="text-2xl font-bold text-electric-blue">$89</div>
                  <div className="text-sm text-text-secondary">per year</div>
                </button>
              </div>
            </div>

            {/* Promo Code */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Promo Code (Optional)
              </label>
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
                  disabled={!promoCode.trim()}
                >
                  Apply
                </Button>
              </div>
              {promoValid?.valid && (
                <div className="mt-2 p-2 bg-cyber-green/20 text-cyber-green border border-cyber-green/30 rounded text-sm">
                  ✅ Promo code applied! Discount: ${discount.toFixed(2)}
                </div>
              )}
              {promoValid?.valid === false && (
                <div className="mt-2 p-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-sm">
                  ❌ Invalid promo code
                </div>
              )}
            </div>

            {/* Price Summary */}
            <div className="border-t border-bg-tertiary pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-text-secondary">Subtotal:</span>
                <span className="text-white font-semibold">${basePrice.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between items-center mb-2 text-cyber-green">
                  <span>Discount:</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-bg-tertiary">
                <span className="text-lg font-bold text-white">Total:</span>
                <span className="text-2xl font-bold text-electric-blue">${finalPrice.toFixed(2)}</span>
              </div>
              {billingCycle === 'YEARLY' && (
                <p className="text-xs text-text-secondary mt-2 text-center">
                  Billed annually. Cancel anytime.
                </p>
              )}
            </div>

            {/* Subscribe Button */}
            <Button
              variant="primary"
              onClick={handleSubscribe}
              isLoading={isProcessing}
              className="w-full"
              size="large"
            >
              Subscribe to Pro
            </Button>

            <div className="text-center">
              <Link href="/signup/select-tier" className="text-text-secondary hover:text-text-primary text-sm">
                ← Back to plan selection
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </AuthLayout>
  )
}

