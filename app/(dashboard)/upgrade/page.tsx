'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/Loading'
import { TopNav } from '@/components/layout/TopNav'
import { useSubscription } from '@/lib/hooks/queries/useSubscription'
import { fetchClient } from '@/lib/api/fetchClient'
import { useRequireFeature } from '@/lib/hooks/useRequireFeature'
import { FEATURE_KEYS } from '@/lib/features'

interface Pricing {
  monthly: number
  yearly: number
}

const PRO_FEATURES = [
  'Unlimited Speed Mode debates',
  'Priority matchmaking',
  'Advanced analytics dashboard',
  '4 tournament credits/month',
  '12 appeals per month',
  '"That\'s The One" unlimited',
  'Debate replay & export',
  'Custom profile themes',
  'Verified badge',
  'No ads',
]

export default function UpgradePage() {
  const router = useRouter()
  const { showToast } = useToast()
  useRequireFeature(FEATURE_KEYS.SUBSCRIPTIONS)
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY')
  const [promoCode, setPromoCode] = useState('')
  const [promoValid, setPromoValid] = useState<{ valid: boolean; discount?: number } | null>(null)

  const { data: subscription, isLoading: subLoading } = useSubscription()
  const { data: pricing = { monthly: 9.99, yearly: 89.0 }, isLoading: pricingLoading } = useQuery<Pricing>({
    queryKey: ['pricing'],
    queryFn: () => fetchClient<Pricing>('/api/subscriptions/pricing'),
    staleTime: 300_000,
  })

  const promoMutation = useMutation({
    mutationFn: () =>
      fetchClient<{ valid: boolean; discountAmount?: number; error?: string }>('/api/subscriptions/validate-promo-code', {
        method: 'POST',
        body: JSON.stringify({ code: promoCode.toUpperCase(), tier: 'PRO', billingCycle }),
      }),
    onSuccess: (data) => {
      if (data.valid) {
        const basePrice = billingCycle === 'MONTHLY' ? pricing.monthly : pricing.yearly
        setPromoValid({ valid: true, discount: data.discountAmount })
        showToast({ type: 'success', title: 'Promo Code Applied', description: `You'll save $${data.discountAmount?.toFixed(2)}!` })
      } else {
        setPromoValid({ valid: false })
        showToast({ type: 'error', title: 'Invalid Promo Code', description: data.error || 'This promo code is not valid' })
      }
    },
    onError: (error: any) => {
      setPromoValid({ valid: false })
      showToast({ type: 'error', title: 'Error', description: error.message || 'Failed to validate promo code' })
    },
  })

  const checkoutMutation = useMutation({
    mutationFn: () =>
      fetchClient<{ checkoutUrl: string }>('/api/subscriptions/checkout', {
        method: 'POST',
        body: JSON.stringify({
          tier: 'PRO',
          billingCycle,
          promoCode: promoValid?.valid ? promoCode.toUpperCase() : undefined,
        }),
      }),
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl
    },
    onError: (error: any) => {
      showToast({ type: 'error', title: 'Error', description: error.message || 'Failed to start checkout' })
    },
  })

  if (subLoading || pricingLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="UPGRADE" />
        <div className="flex items-center justify-center min-h-[60vh] pt-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (subscription?.tier === 'PRO') {
    router.push('/settings/subscription')
    return null
  }

  const basePrice = billingCycle === 'MONTHLY' ? pricing.monthly : pricing.yearly
  const discount = promoValid?.discount || 0
  const finalPrice = Math.max(0, basePrice - discount)

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
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-text-primary mb-4">Choose Your Plan</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <button type="button" onClick={() => { setBillingCycle('MONTHLY'); setPromoValid(null) }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${billingCycle === 'MONTHLY' ? 'border-electric-blue bg-electric-blue/10' : 'border-bg-tertiary bg-bg-secondary'}`}>
                  <div className="text-lg font-bold text-text-primary mb-1">Monthly</div>
                  <div className="text-3xl font-bold text-electric-blue">${pricing.monthly.toFixed(2)}</div>
                  <div className="text-sm text-text-secondary">per month</div>
                </button>
                <button type="button" onClick={() => { setBillingCycle('YEARLY'); setPromoValid(null) }}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left relative ${billingCycle === 'YEARLY' ? 'border-electric-blue bg-electric-blue/10' : 'border-bg-tertiary bg-bg-secondary'}`}>
                  <div className="absolute top-2 right-2 bg-cyber-green text-black px-2 py-1 rounded text-xs font-bold">
                    SAVE {Math.round(((pricing.monthly * 12 - pricing.yearly) / (pricing.monthly * 12)) * 100)}%
                  </div>
                  <div className="text-lg font-bold text-text-primary mb-1">Yearly</div>
                  <div className="text-3xl font-bold text-electric-blue">${pricing.yearly.toFixed(2)}</div>
                  <div className="text-sm text-text-secondary">per year</div>
                </button>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold text-text-primary mb-4">Promo Code</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex gap-2">
                  <Input type="text" value={promoCode} onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoValid(null) }} placeholder="Enter promo code" className="flex-1" />
                  <Button variant="secondary" onClick={() => promoMutation.mutate()} isLoading={promoMutation.isPending}>Apply</Button>
                </div>
                {promoValid?.valid && (
                  <div className="p-3 bg-cyber-green/10 border border-cyber-green/30 rounded-lg">
                    <p className="text-sm text-cyber-green">Promo code applied! Save ${discount.toFixed(2)}</p>
                  </div>
                )}
                {promoValid?.valid === false && (
                  <div className="p-3 bg-neon-orange/10 border border-neon-orange/30 rounded-lg">
                    <p className="text-sm text-neon-orange">Invalid promo code</p>
                  </div>
                )}
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
                  {billingCycle === 'YEARLY' && <p className="text-xs text-text-secondary mt-2 text-center">Billed annually. Cancel anytime.</p>}
                </div>
                <Button variant="primary" onClick={() => checkoutMutation.mutate()} isLoading={checkoutMutation.isPending} className="w-full py-3 text-base font-semibold">Subscribe to Pro</Button>
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">What&apos;s Included in Pro</h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PRO_FEATURES.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-cyber-green mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-text-primary">{feature}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
