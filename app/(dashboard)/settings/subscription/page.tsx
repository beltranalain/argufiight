'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Modal } from '@/components/ui/Modal'

interface UserSubscription {
  id: string
  tier: string
  billingCycle: string | null
  status: string
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  cancelledAt: string | null
}

export default function SubscriptionPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [usage, setUsage] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)

  useEffect(() => {
    fetchSubscription()
    fetchUsage()
  }, [])

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions')
      if (response.ok) {
        const data = await response.json()
        setSubscription(data.subscription)
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/subscriptions/usage')
      if (response.ok) {
        const data = await response.json()
        setUsage(data.usage)
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error)
    }
  }

  const handleUpgrade = () => {
    router.push('/signup/payment?tier=PRO&cycle=MONTHLY')
  }

  const handleCancel = async () => {
    setIsCancelling(true)
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ atPeriodEnd: true }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to cancel subscription')
      }

      showToast({
        type: 'success',
        title: 'Subscription Cancelled',
        description: 'Your subscription will remain active until the end of the current billing period.',
      })

      setCancelModalOpen(false)
      fetchSubscription()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to cancel subscription',
      })
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const isPro = subscription?.tier === 'PRO'
  const isActive = subscription?.status === 'ACTIVE'
  const willCancel = subscription?.cancelAtPeriodEnd

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Subscription</h1>
        <p className="text-text-secondary">Manage your subscription and billing</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Current Plan</h2>
              <p className="text-text-secondary mt-1">
                {isPro ? 'Pro Subscription' : 'Free Plan'}
              </p>
            </div>
            <Badge
              variant="default"
              className={isPro ? 'bg-electric-blue/20 text-electric-blue border border-electric-blue/30' : ''}
            >
              {subscription?.tier || 'FREE'}
            </Badge>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          {isPro && isActive && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-secondary mb-1">Billing Cycle</p>
                  <p className="text-white font-semibold">
                    {subscription.billingCycle === 'MONTHLY' ? 'Monthly' : 'Yearly'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">Status</p>
                  <p className="text-white font-semibold capitalize">{subscription.status}</p>
                </div>
                {subscription.currentPeriodEnd && (
                  <>
                    <div>
                      <p className="text-sm text-text-secondary mb-1">Current Period Ends</p>
                      <p className="text-white font-semibold">
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-text-secondary mb-1">Next Billing Date</p>
                      <p className="text-white font-semibold">
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {willCancel && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 font-semibold mb-1">Subscription Cancelled</p>
                  <p className="text-sm text-text-secondary">
                    Your subscription will remain active until {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'the end of the billing period'}.
                    You can reactivate anytime before then.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-bg-tertiary">
                {!willCancel && (
                  <Button
                    variant="danger"
                    onClick={() => setCancelModalOpen(true)}
                  >
                    Cancel Subscription
                  </Button>
                )}
                {willCancel && (
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/subscriptions/cancel', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ atPeriodEnd: false }),
                        })
                        if (response.ok) {
                          showToast({
                            type: 'success',
                            title: 'Subscription Reactivated',
                            description: 'Your subscription has been reactivated.',
                          })
                          fetchSubscription()
                        }
                      } catch (error: any) {
                        showToast({
                          type: 'error',
                          title: 'Error',
                          description: 'Failed to reactivate subscription',
                        })
                      }
                    }}
                  >
                    Reactivate Subscription
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => router.push('/signup/payment?tier=PRO&cycle=' + (subscription.billingCycle === 'MONTHLY' ? 'YEARLY' : 'MONTHLY'))}
                >
                  {subscription.billingCycle === 'MONTHLY' ? 'Switch to Yearly' : 'Switch to Monthly'}
                </Button>
              </div>
            </>
          )}

          {!isPro && (
            <div>
              <p className="text-text-secondary mb-4">
                Upgrade to Pro to unlock advanced features, unlimited speed debates, and more.
              </p>
              <Button variant="primary" onClick={handleUpgrade}>
                Upgrade to Pro
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {isPro && usage && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Usage This Month</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-text-primary">Appeals</span>
                <span className="text-white font-semibold">
                  {usage.appeals?.current || 0} / {usage.appeals?.limit || 12}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-primary">"That's The One"</span>
                <span className="text-white font-semibold">
                  {usage.thatsTheOne?.current || 0} {usage.thatsTheOne?.limit === -1 ? '(Unlimited)' : `/ ${usage.thatsTheOne?.limit || 10}`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-primary">Tournament Credits</span>
                <span className="text-white font-semibold">
                  {usage.tournamentCredits?.current || 0} / {usage.tournamentCredits?.limit || 4}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Subscription"
      >
        <div className="space-y-4">
          <p className="text-text-primary">
            Are you sure you want to cancel your subscription? You'll continue to have access to Pro features until the end of your current billing period.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setCancelModalOpen(false)}>
              Keep Subscription
            </Button>
            <Button variant="danger" onClick={handleCancel} isLoading={isCancelling}>
              Cancel Subscription
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

