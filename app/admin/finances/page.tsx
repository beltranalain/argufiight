'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { Tabs } from '@/components/ui/Tabs'

interface FinanceOverview {
  isTestMode: boolean
  period: {
    startDate: Date
    endDate: Date
  }
  revenue: {
    subscriptions: {
      total: number
      count: number
      transactions: any[]
    }
    advertisements: {
      total: number
      count: number
      transactions: any[]
    }
    total: number
  }
  fees: {
    platform: number
    stripe: number
  }
  payouts: {
    creators: number
    count: number
  }
  net: {
    revenue: number
    balance: number
    pending: number
  }
  transactions: any[]
}

export default function FinancesPage() {
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isTestMode, setIsTestMode] = useState(false)
  const [overview, setOverview] = useState<FinanceOverview | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState(30)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [useCustomRange, setUseCustomRange] = useState(false)
  const datePickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchStripeMode()
  }, [])

  useEffect(() => {
    fetchOverview()
  }, [selectedPeriod, useCustomRange, customStartDate, customEndDate])

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false)
      }
    }

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDatePicker])

  const fetchStripeMode = async () => {
    try {
      const response = await fetch('/api/admin/finances/stripe-mode')
      if (response.ok) {
        const data = await response.json()
        setIsTestMode(data.isTestMode)
      }
    } catch (error) {
      console.error('Failed to fetch Stripe mode:', error)
    }
  }

  const fetchOverview = async () => {
    setIsLoading(true)
    try {
      let url = `/api/admin/finances/overview?`
      if (useCustomRange && customStartDate && customEndDate) {
        url += `startDate=${customStartDate}&endDate=${customEndDate}`
      } else {
        url += `days=${selectedPeriod}`
      }
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch finances overview')
      }
      const data = await response.json()
      setOverview(data)
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to load finances',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickFilter = (days: number) => {
    setUseCustomRange(false)
    setSelectedPeriod(days)
    setCustomStartDate('')
    setCustomEndDate('')
    setShowDatePicker(false)
  }

  const handleCustomDateRange = () => {
    if (!customStartDate || !customEndDate) {
      showToast({
        type: 'error',
        title: 'Invalid Date Range',
        description: 'Please select both start and end dates',
      })
      return
    }

    if (new Date(customStartDate) > new Date(customEndDate)) {
      showToast({
        type: 'error',
        title: 'Invalid Date Range',
        description: 'Start date must be before end date',
      })
      return
    }

    setUseCustomRange(true)
    setShowDatePicker(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Finances</h1>
              <p className="text-text-secondary mt-1">Manage all financial transactions and payouts</p>
            </div>
            {isTestMode && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-2">
                <p className="text-yellow-500 text-sm font-semibold">⚠️ TEST MODE</p>
              </div>
            )}
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex gap-2">
              {[7, 30, 90, 365].map((days) => (
                <Button
                  key={days}
                  variant={!useCustomRange && selectedPeriod === days ? 'primary' : 'secondary'}
                  onClick={() => handleQuickFilter(days)}
                  className="text-sm"
                >
                  {days === 365 ? '1 Year' : `${days} Days`}
                </Button>
              ))}
            </div>
            
            <div className="relative" ref={datePickerRef}>
              <Button
                variant={useCustomRange ? 'primary' : 'secondary'}
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="text-sm"
              >
                Custom Range
              </Button>
              
              {showDatePicker && (
                <div className="absolute top-full left-0 mt-2 bg-bg-secondary border border-bg-tertiary rounded-lg p-4 shadow-lg z-50 min-w-[300px]">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-text-primary focus:outline-none focus:border-electric-blue"
                        max={customEndDate || undefined}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full px-3 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-text-primary focus:outline-none focus:border-electric-blue"
                        min={customStartDate || undefined}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        onClick={handleCustomDateRange}
                        className="flex-1 text-sm"
                        disabled={!customStartDate || !customEndDate}
                      >
                        Apply
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setShowDatePicker(false)
                          setCustomStartDate('')
                          setCustomEndDate('')
                        }}
                        className="flex-1 text-sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {useCustomRange && customStartDate && customEndDate && (
              <div className="text-sm text-text-secondary">
                {formatDate(customStartDate)} - {formatDate(customEndDate)}
              </div>
            )}
          </div>

          {overview && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader>
                    <h3 className="text-sm font-medium text-text-secondary">Total Revenue</h3>
                  </CardHeader>
                  <CardBody>
                    <p className="text-2xl font-bold text-electric-blue">
                      {formatCurrency(overview.revenue.total)}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      {overview.revenue.subscriptions.count} subscriptions + {overview.revenue.advertisements.count} ads
                    </p>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <h3 className="text-sm font-medium text-text-secondary">Platform Fees</h3>
                  </CardHeader>
                  <CardBody>
                    <p className="text-2xl font-bold text-neon-orange">
                      {formatCurrency(overview.fees.platform)}
                    </p>
                    <p className="text-xs text-text-muted mt-1">From advertisements</p>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <h3 className="text-sm font-medium text-text-secondary">Creator Payouts</h3>
                  </CardHeader>
                  <CardBody>
                    <p className="text-2xl font-bold text-[#FF6B35]">
                      {formatCurrency(overview.payouts.creators)}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      {overview.payouts.count} payouts sent
                    </p>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <h3 className="text-sm font-medium text-text-secondary">Net Revenue</h3>
                  </CardHeader>
                  <CardBody>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(overview.net.revenue)}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      Balance: {formatCurrency(overview.net.balance)}
                    </p>
                  </CardBody>
                </Card>
              </div>

              {/* Detailed Breakdown */}
              <Tabs
                tabs={[
                  {
                    id: 'overview',
                    label: 'Overview',
                    content: (
                      <div className="space-y-6">
                        <Card>
                          <CardHeader>
                            <h2 className="text-xl font-bold text-white">Revenue Breakdown</h2>
                          </CardHeader>
                          <CardBody>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center p-4 bg-bg-tertiary rounded-lg">
                                <div>
                                  <p className="font-semibold text-text-primary">Subscriptions</p>
                                  <p className="text-sm text-text-secondary">
                                    {overview.revenue.subscriptions.count} active PRO subscriptions
                                  </p>
                                </div>
                                <p className="text-xl font-bold text-electric-blue">
                                  {formatCurrency(overview.revenue.subscriptions.total)}
                                </p>
                              </div>
                              <div className="flex justify-between items-center p-4 bg-bg-tertiary rounded-lg">
                                <div>
                                  <p className="font-semibold text-text-primary">Advertisements</p>
                                  <p className="text-sm text-text-secondary">
                                    {overview.revenue.advertisements.count} contracts
                                  </p>
                                </div>
                                <p className="text-xl font-bold text-neon-orange">
                                  {formatCurrency(overview.revenue.advertisements.total)}
                                </p>
                              </div>
                            </div>
                          </CardBody>
                        </Card>

                        <Card>
                          <CardHeader>
                            <h2 className="text-xl font-bold text-white">Payouts & Fees</h2>
                          </CardHeader>
                          <CardBody>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center p-4 bg-bg-tertiary rounded-lg">
                                <div>
                                  <p className="font-semibold text-text-primary">Platform Fees Collected</p>
                                  <p className="text-sm text-text-secondary">From creator marketplace</p>
                                </div>
                                <p className="text-xl font-bold text-neon-orange">
                                  {formatCurrency(overview.fees.platform)}
                                </p>
                              </div>
                              <div className="flex justify-between items-center p-4 bg-bg-tertiary rounded-lg">
                                <div>
                                  <p className="font-semibold text-text-primary">Creator Payouts</p>
                                  <p className="text-sm text-text-secondary">
                                    {overview.payouts.count} payouts processed
                                  </p>
                                </div>
                                <p className="text-xl font-bold text-[#FF6B35]">
                                  {formatCurrency(overview.payouts.creators)}
                                </p>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      </div>
                    ),
                  },
                  {
                    id: 'subscriptions',
                    label: 'Subscriptions',
                    content: (
                      <Card>
                        <CardHeader>
                          <h2 className="text-xl font-bold text-white">Subscription Revenue</h2>
                        </CardHeader>
                        <CardBody>
                          <div className="space-y-2">
                            {overview.revenue.subscriptions.transactions.length === 0 ? (
                              <p className="text-text-secondary text-center py-8">No subscription transactions</p>
                            ) : (
                              overview.revenue.subscriptions.transactions.map((tx) => (
                                <div
                                  key={tx.id}
                                  className="flex justify-between items-center p-4 bg-bg-tertiary rounded-lg"
                                >
                                  <div>
                                    <p className="font-semibold text-text-primary">
                                      {tx.user?.username || tx.user?.email}
                                    </p>
                                    <p className="text-sm text-text-secondary">
                                      {formatDate(tx.date)}
                                    </p>
                                  </div>
                                  <p className="text-lg font-bold text-electric-blue">
                                    {formatCurrency(tx.amount)}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        </CardBody>
                      </Card>
                    ),
                  },
                  {
                    id: 'advertisements',
                    label: 'Advertisements',
                    content: (
                      <Card>
                        <CardHeader>
                          <h2 className="text-xl font-bold text-white">Advertisement Revenue</h2>
                        </CardHeader>
                        <CardBody>
                          <div className="space-y-2">
                            {overview.revenue.advertisements.transactions.length === 0 ? (
                              <p className="text-text-secondary text-center py-8">No advertisement transactions</p>
                            ) : (
                              overview.revenue.advertisements.transactions.map((tx) => (
                                <div
                                  key={tx.id}
                                  className="p-4 bg-bg-tertiary rounded-lg space-y-2"
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-semibold text-text-primary">
                                        {tx.campaign?.name || 'Campaign'}
                                      </p>
                                      <p className="text-sm text-text-secondary">
                                        {tx.advertiser?.companyName} → {tx.creator?.username}
                                      </p>
                                      <p className="text-xs text-text-muted mt-1">
                                        {formatDate(tx.date)} • {tx.status}
                                      </p>
                                    </div>
                                    <p className="text-lg font-bold text-neon-orange">
                                      {formatCurrency(tx.amount)}
                                    </p>
                                  </div>
                                  <div className="flex gap-4 text-sm pt-2 border-t border-bg-secondary">
                                    <div>
                                      <span className="text-text-secondary">Platform Fee: </span>
                                      <span className="text-neon-orange font-semibold">
                                        {formatCurrency(tx.platformFee)}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-text-secondary">Creator Payout: </span>
                                      <span className="text-[#FF6B35] font-semibold">
                                        {formatCurrency(tx.creatorPayout)}
                                      </span>
                                    </div>
                                    {tx.payoutSent && (
                                      <span className="text-green-500 ml-auto">✓ Paid</span>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </CardBody>
                      </Card>
                    ),
                  },
                  {
                    id: 'transactions',
                    label: 'All Transactions',
                    content: (
                      <Card>
                        <CardHeader>
                          <h2 className="text-xl font-bold text-white">All Transactions</h2>
                        </CardHeader>
                        <CardBody>
                          <div className="space-y-2">
                            {overview.transactions.length === 0 ? (
                              <p className="text-text-secondary text-center py-8">No transactions</p>
                            ) : (
                              overview.transactions.map((tx) => (
                                <div
                                  key={tx.id}
                                  className="flex justify-between items-center p-4 bg-bg-tertiary rounded-lg"
                                >
                                  <div>
                                    <p className="font-semibold text-text-primary">
                                      {tx.type === 'subscription' 
                                        ? `Subscription - ${tx.user?.username || tx.user?.email}`
                                        : `Ad - ${tx.campaign?.name || 'Campaign'}`}
                                    </p>
                                    <p className="text-sm text-text-secondary">
                                      {formatDate(tx.date)}
                                    </p>
                                  </div>
                                  <p className={`text-lg font-bold ${
                                    tx.type === 'subscription' ? 'text-electric-blue' : 'text-neon-orange'
                                  }`}>
                                    {formatCurrency(tx.amount)}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        </CardBody>
                      </Card>
                    ),
                  },
                ]}
                defaultTab="overview"
              />
            </>
          )}
        </div>
    </div>
  )
}

