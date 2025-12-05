'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'

export default function CreatorSetupPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [taxInfo, setTaxInfo] = useState<any>(null)
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchTaxInfo()
  }, [])

  const fetchTaxInfo = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/creator/tax-info')
      if (response.ok) {
        const data = await response.json()
        setTaxInfo(data.taxInfo)
        
        // If no Stripe account, get onboarding URL
        if (!data.taxInfo?.stripeAccountId) {
          const onboardingRes = await fetch('/api/creator/stripe-onboarding')
          if (onboardingRes.ok) {
            const onboardingData = await onboardingRes.json()
            setOnboardingUrl(onboardingData.url)
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch tax info:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartOnboarding = () => {
    if (onboardingUrl) {
      window.location.href = onboardingUrl
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="CREATOR" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="CREATOR" />
      <div className="pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Creator Setup</h1>
            <p className="text-text-secondary mt-2">
              Complete your Stripe Connect setup to start receiving payments
            </p>
          </div>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">Payment Setup</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              {!taxInfo?.stripeAccountId ? (
                <div>
                  <p className="text-text-secondary mb-4">
                    To receive payments from advertisers, you need to connect your Stripe account.
                    This process takes about 5 minutes and requires:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-text-secondary mb-6">
                    <li>Tax information (W-9 form)</li>
                    <li>Bank account details</li>
                    <li>Identity verification</li>
                  </ul>
                  {onboardingUrl ? (
                    <Button variant="primary" onClick={handleStartOnboarding} className="w-full">
                      Start Stripe Onboarding
                    </Button>
                  ) : (
                    <p className="text-text-secondary">Loading onboarding link...</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-cyber-green/10 border border-cyber-green/30 rounded-lg">
                    <div>
                      <p className="font-semibold text-cyber-green">Stripe Account Connected</p>
                      <p className="text-sm text-text-secondary">
                        Account ID: {taxInfo.stripeAccountId}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className={`p-4 rounded-lg border ${
                      taxInfo.taxFormComplete
                        ? 'bg-cyber-green/10 border-cyber-green/30'
                        : 'bg-bg-secondary border-bg-tertiary'
                    }`}>
                      <div className={`text-2xl mb-2 ${taxInfo.taxFormComplete ? 'text-cyber-green' : 'text-gray-400'}`}>
                        {taxInfo.taxFormComplete ? '✓' : '○'}
                      </div>
                      <div className="text-sm font-semibold text-text-primary">Tax Form</div>
                      <div className="text-xs text-text-secondary">
                        {taxInfo.taxFormComplete ? 'Complete' : 'Pending'}
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg border ${
                      taxInfo.bankVerified
                        ? 'bg-cyber-green/10 border-cyber-green/30'
                        : 'bg-bg-secondary border-bg-tertiary'
                    }`}>
                      <div className={`text-2xl mb-2 ${taxInfo.bankVerified ? 'text-cyber-green' : 'text-gray-400'}`}>
                        {taxInfo.bankVerified ? '✓' : '○'}
                      </div>
                      <div className="text-sm font-semibold text-text-primary">Bank Account</div>
                      <div className="text-xs text-text-secondary">
                        {taxInfo.bankVerified ? 'Verified' : 'Pending'}
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg border ${
                      taxInfo.payoutEnabled
                        ? 'bg-cyber-green/10 border-cyber-green/30'
                        : 'bg-bg-secondary border-bg-tertiary'
                    }`}>
                      <div className={`text-2xl mb-2 ${taxInfo.payoutEnabled ? 'text-cyber-green' : 'text-gray-400'}`}>
                        {taxInfo.payoutEnabled ? '✓' : '○'}
                      </div>
                      <div className="text-sm font-semibold text-text-primary">Payouts</div>
                      <div className="text-xs text-text-secondary">
                        {taxInfo.payoutEnabled ? 'Enabled' : 'Pending'}
                      </div>
                    </div>
                  </div>

                  {taxInfo.payoutEnabled ? (
                    <Button
                      variant="primary"
                      onClick={() => router.push('/creator/dashboard')}
                      className="w-full"
                    >
                      Go to Creator Dashboard
                    </Button>
                  ) : (
                    <p className="text-text-secondary text-sm">
                      Complete all steps above to enable payouts. You'll receive an email when your account is ready.
                    </p>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

