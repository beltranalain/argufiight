'use client'

import { useState, useEffect } from 'react'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'

interface Pricing {
  monthly: number
  yearly: number
}

export default function SubscriptionPricingPage() {
  const { showToast } = useToast()
  const [pricing, setPricing] = useState<Pricing>({ monthly: 9.99, yearly: 89.0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    monthly: '9.99',
    yearly: '89.00',
  })

  useEffect(() => {
    fetchPricing()
  }, [])

  const fetchPricing = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/subscriptions/pricing')
      if (response.ok) {
        const data = await response.json()
        setPricing(data)
        setFormData({
          monthly: data.monthly.toString(),
          yearly: data.yearly.toString(),
        })
      }
    } catch (error) {
      console.error('Failed to fetch pricing:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load pricing',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    const monthly = parseFloat(formData.monthly)
    const yearly = parseFloat(formData.yearly)

    if (isNaN(monthly) || isNaN(yearly)) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Please enter valid numbers',
      })
      return
    }

    if (monthly <= 0 || yearly <= 0) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Prices must be greater than 0',
      })
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch('/api/subscriptions/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthly, yearly }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update pricing')
      }

      const data = await response.json()
      setPricing(data.pricing)
      showToast({
        type: 'success',
        title: 'Success',
        description: 'Pricing updated successfully!',
      })
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to update pricing',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const calculateSavings = () => {
    const monthlyYearly = pricing.monthly * 12
    if (monthlyYearly > pricing.yearly) {
      const savings = monthlyYearly - pricing.yearly
      const savingsPercent = ((savings / monthlyYearly) * 100).toFixed(0)
      return { savings, savingsPercent }
    }
    return null
  }

  const savings = calculateSavings()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="ADMIN" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="ADMIN" />
      <div className="pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Subscription Pricing</h1>
            <p className="text-text-secondary mt-2">
              Manage Pro subscription pricing. Changes will apply to new subscriptions immediately.
            </p>
          </div>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">Pro Subscription Pricing</h2>
              <p className="text-sm text-text-secondary mt-1">
                Set the monthly and yearly prices for Pro subscriptions
              </p>
            </CardHeader>
            <CardBody className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Monthly Pricing */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-secondary">
                    Monthly Price (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                      $
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.monthly}
                      onChange={(e) => setFormData({ ...formData, monthly: e.target.value })}
                      className="pl-8"
                      placeholder="9.99"
                    />
                  </div>
                  <p className="text-xs text-text-secondary">
                    Current: ${pricing.monthly.toFixed(2)}/month
                  </p>
                </div>

                {/* Yearly Pricing */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-text-secondary">
                    Yearly Price (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                      $
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.yearly}
                      onChange={(e) => setFormData({ ...formData, yearly: e.target.value })}
                      className="pl-8"
                      placeholder="89.00"
                    />
                  </div>
                  <p className="text-xs text-text-secondary">
                    Current: ${pricing.yearly.toFixed(2)}/year
                  </p>
                </div>
              </div>

              {/* Savings Calculation */}
              {savings && (
                <div className="p-4 bg-cyber-green/10 border border-cyber-green/30 rounded-lg">
                  <p className="text-sm text-cyber-green">
                    <strong>Yearly Savings:</strong> ${savings.savings.toFixed(2)} ({savings.savingsPercent}% off)
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    Monthly × 12 = ${(pricing.monthly * 12).toFixed(2)} vs Yearly = ${pricing.yearly.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Warning */}
              <div className="p-4 bg-neon-orange/10 border border-neon-orange/30 rounded-lg">
                <p className="text-sm text-neon-orange">
                  <strong>Note:</strong> Price changes only affect new subscriptions. Existing subscribers will continue at their current rate until they cancel and resubscribe.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="primary"
                  onClick={handleSave}
                  isLoading={isSaving}
                  className="flex-1"
                >
                  Save Pricing
                </Button>
                <Button
                  variant="secondary"
                  onClick={fetchPricing}
                  className="flex-1"
                >
                  Reset
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Current Pricing Display */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">Current Pricing</h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-bg-secondary rounded-lg">
                  <div className="text-sm text-text-secondary mb-1">Monthly</div>
                  <div className="text-3xl font-bold text-electric-blue">
                    ${pricing.monthly.toFixed(2)}
                    <span className="text-lg text-text-secondary font-normal">/month</span>
                  </div>
                </div>
                <div className="p-4 bg-bg-secondary rounded-lg">
                  <div className="text-sm text-text-secondary mb-1">Yearly</div>
                  <div className="text-3xl font-bold text-electric-blue">
                    ${pricing.yearly.toFixed(2)}
                    <span className="text-lg text-text-secondary font-normal">/year</span>
                  </div>
                  {savings && (
                    <div className="mt-2 text-xs text-cyber-green">
                      Save {savings.savingsPercent}% vs monthly
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
