'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Tabs } from '@/components/ui/Tabs'
import Link from 'next/link'
import { formatPlacement } from '@/lib/ads/placement-formatter'

interface Campaign {
  id: string
  name: string
  type: string
  status: string
  paymentStatus?: string | null
  budget: number
  startDate: string
  endDate: string
  impressionsDelivered?: number
  clicksDelivered?: number
}

interface Advertiser {
  id: string
  companyName: string
  status: string
  paymentReady: boolean
}

interface Offer {
  id: string
  placement: string
  duration: number
  paymentType: string
  amount: string
  status: string
  createdAt: string
  expiresAt: string
  creator: {
    id: string
    username: string
    avatarUrl: string | null
  }
  campaign: {
    id: string
    name: string
  }
}

interface SupportTicket {
  id: string
  subject: string
  description: string
  category: string | null
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  createdAt: string
  replies: Array<{
    id: string
    content: string
    createdAt: string
    author: {
      id: string
      username: string
      avatarUrl: string | null
      isAdmin: boolean
    }
  }>
}

export default function AdvertiserDashboardPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalSpent: 0,
    pendingPayment: 0,
  })
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([])
  const [showSupportModal, setShowSupportModal] = useState(false)
  const [showSupportDetailModal, setShowSupportDetailModal] = useState(false)
  const [selectedSupportTicket, setSelectedSupportTicket] = useState<SupportTicket | null>(null)
  const [supportSubject, setSupportSubject] = useState('')
  const [supportDescription, setSupportDescription] = useState('')
  const [supportCategory, setSupportCategory] = useState('Technical')
  const [supportPriority, setSupportPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM')
  const [supportReplyContent, setSupportReplyContent] = useState('')
  const [isSubmittingSupportTicket, setIsSubmittingSupportTicket] = useState(false)
  const [isSubmittingSupportReply, setIsSubmittingSupportReply] = useState(false)
  const [activeTab, setActiveTab] = useState('campaigns')

  useEffect(() => {
    fetchData()
    
    // Refresh data when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Advertiser Dashboard] Page became visible, refreshing data...')
        fetchData()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Check for payment success/error messages in URL
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')
    const message = urlParams.get('message')
    
    if (success === 'payment_completed') {
      console.log('[Advertiser Dashboard] Payment completed, refreshing data')
      showToast({
        type: 'success',
        title: 'Payment Successful',
        description: 'Your payment has been processed. Your campaign is now pending admin review.',
      })
      // Refresh campaign data to show updated status
      setTimeout(() => {
        console.log('[Advertiser Dashboard] Refreshing campaign data after payment')
        fetchData()
      }, 1000)
      // Clean up URL
      window.history.replaceState({}, '', '/advertiser/dashboard')
    } else if (success === 'already_paid') {
      showToast({
        type: 'success',
        title: 'Payment Already Processed',
        description: 'This payment was already processed successfully.',
      })
      // Refresh campaign data
      setTimeout(() => {
        fetchData()
      }, 500)
      window.history.replaceState({}, '', '/advertiser/dashboard')
    } else if (error) {
      const errorMessages: Record<string, string> = {
        missing_params: 'Missing required parameters. Please try again.',
        stripe_not_configured: 'Payment system not configured. Please contact support.',
        payment_not_completed: 'Payment was not completed. Please try again.',
        campaign_mismatch: 'Campaign verification failed. Please contact support.',
        campaign_not_found: 'Campaign not found. Please contact support.',
        advertiser_mismatch: 'Verification failed. Please contact support.',
        payment_intent_missing: 'Payment verification failed. Please contact support.',
        verification_failed: message || 'Payment verification failed. Please contact support if you were charged.',
      }
      console.error('[Advertiser Dashboard] Payment error:', {
        errorCode: error,
        errorMessage: message,
        userMessage: errorMessages[error] || 'An error occurred. Please contact support.',
      })
      showToast({
        type: 'error',
        title: 'Payment Error',
        description: errorMessages[error] || 'An error occurred. Please contact support.',
      })
      window.history.replaceState({}, '', '/advertiser/dashboard')
    }
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [showToast])

  useEffect(() => {
    // Fetch support tickets once advertiser is loaded (for all approved advertisers)
    if (advertiser && advertiser.id && !isLoading) {
      fetchSupportTickets()
    }
  }, [advertiser, isLoading])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      console.log('[Advertiser Dashboard] Fetching fresh data...')
      const [advertiserRes, campaignsRes, offersRes] = await Promise.all([
        fetch('/api/advertiser/me', { cache: 'no-store' }),
        fetch('/api/advertiser/campaigns', { 
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        }),
        fetch('/api/advertiser/offers', { cache: 'no-store' }),
      ])

      if (advertiserRes.ok) {
        const advertiserData = await advertiserRes.json()
        setAdvertiser(advertiserData.advertiser)
      } else if (advertiserRes.status === 401) {
        // Redirect to login with advertiser userType
        router.push('/login?userType=advertiser')
        return
      } else if (advertiserRes.status === 404) {
        // Not an advertiser, redirect to apply
        router.push('/advertise')
        return
      } else if (advertiserRes.status === 403) {
        // 403 means advertiser exists but not approved - try to get advertiser data anyway
        // The API should return 200 now, but handle 403 as fallback
        try {
          const errorData = await advertiserRes.json()
          // If error data has advertiser info, use it
          if (errorData.advertiser) {
            setAdvertiser(errorData.advertiser)
          } else {
            // Fallback: create minimal advertiser object
            setAdvertiser({
              id: '',
              companyName: '',
              status: 'PENDING',
              paymentReady: false,
            })
          }
        } catch (e) {
          // If can't parse error, create minimal advertiser
          setAdvertiser({
            id: '',
            companyName: '',
            status: 'PENDING',
            paymentReady: false,
          })
        }
      } else {
        // Other error - show error message
        console.error('Failed to fetch advertiser:', advertiserRes.status)
        const errorData = await advertiserRes.json().catch(() => ({}))
        // Try to show error message if available
        if (errorData.error) {
          showToast({
            type: 'error',
            title: 'Error',
            description: errorData.error,
          })
        }
        setAdvertiser(null)
      }

      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json()
        console.log('[Advertiser Dashboard] Fetched campaigns:', campaignsData.campaigns?.length || 0)
        console.log('[Advertiser Dashboard] Campaign statuses:', campaignsData.campaigns?.map((c: Campaign) => ({ 
          id: c.id, 
          name: c.name, 
          status: c.status,
          paymentStatus: c.paymentStatus 
        })))
        setCampaigns(campaignsData.campaigns || [])
        
        // Calculate stats
        const active = campaignsData.campaigns.filter((c: Campaign) => c.status === 'ACTIVE')
        const totalImpressions = campaignsData.campaigns.reduce(
          (sum: number, c: Campaign) => sum + (c.impressionsDelivered || 0),
          0
        )
        const totalClicks = campaignsData.campaigns.reduce(
          (sum: number, c: Campaign) => sum + (c.clicksDelivered || 0),
          0
        )
        // Only count paid PLATFORM_ADS campaigns in totalSpent
        // Creator Sponsorship and Tournament Sponsorship don't require payment upfront
        const totalSpent = campaignsData.campaigns
          .filter((c: Campaign) => {
            // Only PLATFORM_ADS campaigns require payment
            // Only count if paymentStatus is PAID
            return c.type === 'PLATFORM_ADS' && c.paymentStatus === 'PAID'
          })
          .reduce((sum: number, c: Campaign) => {
            const budget = typeof c.budget === 'string' ? parseFloat(c.budget) : Number(c.budget)
            return sum + (isNaN(budget) ? 0 : budget)
          }, 0)
        // Calculate pending payment amount (campaigns with PENDING_PAYMENT status)
        const pendingPayment = campaignsData.campaigns
          .filter((c: Campaign) => c.status === 'PENDING_PAYMENT' || c.paymentStatus === 'PENDING')
          .reduce((sum: number, c: Campaign) => {
            const budget = typeof c.budget === 'string' ? parseFloat(c.budget) : Number(c.budget)
            return sum + (isNaN(budget) ? 0 : budget)
          }, 0)

        setStats({
          activeCampaigns: active.length,
          totalImpressions,
          totalClicks,
          totalSpent,
          pendingPayment,
        })
      }

      if (offersRes.ok) {
        const offersData = await offersRes.json()
        setOffers(offersData.offers || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSupportTickets = async () => {
    try {
      const response = await fetch(`/api/support/tickets?t=${Date.now()}`, {
        cache: 'no-store',
      })
      if (response.ok) {
        const data = await response.json()
        console.log('[Advertiser Dashboard] Fetched support tickets:', data.tickets?.length || 0)
        // Log reply counts for each ticket
        if (data.tickets && data.tickets.length > 0) {
          data.tickets.forEach((ticket: any) => {
            console.log('[Advertiser Dashboard] Ticket:', {
              id: ticket.id,
              subject: ticket.subject,
              replyCount: ticket.replies?.length || 0,
            })
          })
        }
        setSupportTickets(data.tickets || [])
      } else {
        console.error('[Advertiser Dashboard] Failed to fetch support tickets:', response.status)
      }
    } catch (error) {
      console.error('[Advertiser Dashboard] Failed to fetch support tickets:', error)
    }
  }

  const handleCreateSupportTicket = async () => {
    if (!supportSubject.trim() || !supportDescription.trim()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        description: 'Subject and description are required',
      })
      return
    }

    setIsSubmittingSupportTicket(true)
    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: supportSubject.trim(),
          description: supportDescription.trim(),
          category: supportCategory || null,
          priority: supportPriority,
        }),
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Ticket Created',
          description: 'Your support ticket has been created successfully',
        })
        setShowSupportModal(false)
        setSupportSubject('')
        setSupportDescription('')
        setSupportCategory('Technical')
        setSupportPriority('MEDIUM')
        fetchSupportTickets()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create ticket')
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to create support ticket',
      })
    } finally {
      setIsSubmittingSupportTicket(false)
    }
  }

  const handleSubmitSupportReply = async () => {
    if (!selectedSupportTicket || !supportReplyContent.trim()) return

    setIsSubmittingSupportReply(true)
    try {
      const response = await fetch(`/api/support/tickets/${selectedSupportTicket.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: supportReplyContent.trim(),
          isInternal: false, // Explicitly set to false for advertiser replies
        }),
      })

      if (response.ok) {
        const replyData = await response.json()
        console.log('[Advertiser Dashboard] Reply sent successfully:', replyData.reply?.id)
        
        showToast({
          type: 'success',
          title: 'Reply Sent',
          description: 'Your reply has been added to the ticket',
        })
        setSupportReplyContent('')
        
        // Refresh ticket with cache-busting
        const ticketResponse = await fetch(`/api/support/tickets/${selectedSupportTicket.id}?t=${Date.now()}`, {
          cache: 'no-store',
        })
        if (ticketResponse.ok) {
          const ticketData = await ticketResponse.json()
          console.log('[Advertiser Dashboard] Refreshed ticket with replies:', {
            ticketId: ticketData.ticket?.id,
            replyCount: ticketData.ticket?.replies?.length || 0,
            replies: ticketData.ticket?.replies?.map((r: any) => ({
              id: r.id,
              author: r.author?.username,
              isAdmin: r.author?.isAdmin,
            })) || [],
          })
          setSelectedSupportTicket(ticketData.ticket)
        } else {
          console.error('[Advertiser Dashboard] Failed to refresh ticket:', ticketResponse.status)
        }
        // Refresh ticket list with a small delay to ensure server has processed the reply
        setTimeout(() => {
          fetchSupportTickets()
        }, 500)
      } else {
        const error = await response.json()
        console.error('[Advertiser Dashboard] Failed to send reply:', error)
        throw new Error(error.error || 'Failed to send reply')
      }
    } catch (error: any) {
      console.error('[Advertiser Dashboard] Reply error:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to send reply',
      })
    } finally {
      setIsSubmittingSupportReply(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-cyber-green/20 text-cyber-green'
      case 'SCHEDULED':
        return 'bg-electric-blue/20 text-electric-blue'
      case 'PAUSED':
        return 'bg-neon-orange/20 text-neon-orange'
      case 'PENDING_PAYMENT':
        return 'bg-neon-orange/20 text-neon-orange'
      case 'PENDING_REVIEW':
        return 'bg-yellow-500/20 text-yellow-500'
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-500'
      case 'ACCEPTED':
        return 'bg-cyber-green/20 text-cyber-green'
      case 'DECLINED':
        return 'bg-red-500/20 text-red-500'
      case 'EXPIRED':
        return 'bg-gray-500/20 text-gray-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="ADVERTISER" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (!advertiser) {
    return null // Will redirect
  }

  if (advertiser.status !== 'APPROVED') {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="ADVERTISER" />
        <div className="pt-20 px-4 md:px-8 pb-20">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <h1 className="text-2xl font-bold text-text-primary">Application Pending</h1>
              </CardHeader>
              <CardBody>
                <p className="text-text-secondary">
                  Your advertiser application is currently <strong>{advertiser.status}</strong>.
                  {advertiser.status === 'PENDING' && ' We\'ll notify you via email once it\'s been reviewed.'}
                  {advertiser.status === 'REJECTED' && ' Please contact support if you have questions.'}
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="ADVERTISER" />
      <div className="pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Advertiser Dashboard</h1>
              <p className="text-text-secondary mt-2">Welcome, {advertiser.companyName}</p>
            </div>
            <div className="flex gap-3">
              <Link href="/advertiser/creators">
                <Button variant="secondary">Discover Creators</Button>
              </Link>
              <Link href="/advertiser/campaigns/create">
                <Button variant="primary">Create Campaign</Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className={`grid grid-cols-1 gap-4 ${stats.pendingPayment > 0 ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
            <Card>
              <CardBody>
                <div className="text-2xl font-bold text-text-primary">{stats.activeCampaigns}</div>
                <div className="text-text-secondary">Active Campaigns</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-2xl font-bold text-electric-blue">
                  {(stats.totalImpressions ?? 0).toLocaleString()}
                </div>
                <div className="text-text-secondary">Total Impressions</div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-2xl font-bold text-cyber-green">
                  {(stats.totalClicks ?? 0).toLocaleString()}
                </div>
                <div className="text-text-secondary">Total Clicks</div>
              </CardBody>
            </Card>
            {(stats.pendingPayment ?? 0) > 0 && (
              <Card className="border-neon-orange/50 bg-neon-orange/10">
                <CardBody>
                  <div className="text-2xl font-bold text-neon-orange">
                    ${(stats.pendingPayment ?? 0).toLocaleString()}
                  </div>
                  <div className="text-text-secondary">Pending Payment</div>
                </CardBody>
              </Card>
            )}
            <Card>
              <CardBody>
                <div className="text-2xl font-bold text-cyber-green">
                  ${(stats.totalSpent ?? 0).toLocaleString()}
                </div>
                <div className="text-text-secondary">Total Spent</div>
              </CardBody>
            </Card>
          </div>

          {/* Payment Setup Warning */}
          {!advertiser.paymentReady && (
            <Card className="border-neon-orange/50 bg-neon-orange/10">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary mb-2">
                      Payment Setup Required
                    </h3>
                    <p className="text-text-secondary">
                      Connect your payment account to start creating campaigns and making offers to creators.
                    </p>
                  </div>
                  <Button 
                    variant="primary"
                    onClick={() => router.push('/advertiser/settings')}
                  >
                    Connect Account
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Tabs for Campaigns and Support */}
          <Card>
            <Tabs
              tabs={[
                {
                  id: 'campaigns',
                  label: 'Campaigns',
                  content: (
                    <div className="space-y-6">
                      {/* Sent Offers */}
                      {offers.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-text-primary">Sent Offers ({offers.length})</h3>
                            <Link href="/advertiser/creators">
                              <Button variant="secondary" size="sm">Make New Offer</Button>
                            </Link>
                          </div>
                          <div className="space-y-4">
                            {offers.slice(0, 5).map((offer) => (
                              <div
                                key={offer.id}
                                className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-bg-tertiary"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-lg font-bold text-text-primary">@{offer.creator.username}</h3>
                                    <Badge className={getStatusColor(offer.status)}>
                                      {offer.status}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-text-secondary space-y-1">
                                    <p>Campaign: {offer.campaign.name}</p>
                                    <p>
                                      ${Number(offer.amount ?? 0).toLocaleString()} for {offer.duration} days • {formatPlacement(offer.placement)}
                                    </p>
                                    <p>Expires: {new Date(offer.expiresAt).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  {offer.status === 'PENDING' && (
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => router.push(`/advertiser/checkout?offerId=${offer.id}`)}
                                    >
                                      Pay Now
                                    </Button>
                                  )}
                                  {offer.status === 'ACCEPTED' && (
                                    <Badge className="bg-cyber-green/20 text-cyber-green border-cyber-green/30">
                                      Accepted
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                            {offers.length > 5 && (
                              <div className="text-center pt-2">
                                <Link href="/advertiser/offers">
                                  <Button variant="secondary" size="sm">View All Offers</Button>
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Campaigns */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-text-primary">Your Campaigns</h3>
                          <Link href="/advertiser/campaigns/create">
                            <Button variant="primary" size="sm">+ New Campaign</Button>
                          </Link>
                        </div>
                        {campaigns.length === 0 ? (
                          <div className="text-center py-12">
                            <p className="text-text-secondary mb-4">No campaigns yet</p>
                            <Link href="/advertiser/campaigns/create">
                              <Button variant="primary">Create Your First Campaign</Button>
                            </Link>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {campaigns.map((campaign) => (
                              <div
                                key={campaign.id}
                                className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-bg-tertiary"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-lg font-bold text-text-primary">{campaign.name}</h3>
                                    <Badge className={getStatusColor(campaign.status)}>
                                      {campaign.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-text-secondary space-y-1">
                                    <p>Budget: ${Number(campaign.budget ?? 0).toLocaleString()}</p>
                                    <p>
                                      {new Date(campaign.startDate).toLocaleDateString()} -{' '}
                                      {new Date(campaign.endDate).toLocaleDateString()}
                                    </p>
                                    {(campaign.impressionsDelivered || campaign.clicksDelivered) && (
                                      <p>
                                        {campaign.impressionsDelivered?.toLocaleString()} impressions •{' '}
                                        {campaign.clicksDelivered?.toLocaleString()} clicks
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  {(campaign.status === 'PENDING_PAYMENT' || campaign.paymentStatus === 'PENDING') && (
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          const response = await fetch(`/api/advertiser/campaigns/payment`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ campaignId: campaign.id }),
                                          })
                                          if (response.ok) {
                                            const data = await response.json()
                                            if (data.checkoutUrl) {
                                              window.location.href = data.checkoutUrl
                                            }
                                          } else {
                                            const error = await response.json()
                                            showToast({
                                              type: 'error',
                                              title: 'Payment Error',
                                              description: error.error || 'Failed to initiate payment',
                                            })
                                          }
                                        } catch (error: any) {
                                          showToast({
                                            type: 'error',
                                            title: 'Error',
                                            description: error.message || 'Failed to process payment',
                                          })
                                        }
                                      }}
                                    >
                                      Pay Now
                                    </Button>
                                  )}
                                  {campaign.paymentStatus === 'PAID' && (
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={async () => {
                                        try {
                                          const response = await fetch(`/api/advertiser/campaigns/${campaign.id}/receipt`)
                                          if (response.ok) {
                                            const data = await response.json()
                                            const receipt = data.receipt
                                            
                                            // Create receipt HTML
                                            const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Receipt - ${receipt.receiptNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
    .receipt-number { font-size: 24px; font-weight: bold; }
    .section { margin: 20px 0; }
    .section-title { font-weight: bold; font-size: 18px; margin-bottom: 10px; }
    .row { display: flex; justify-content: space-between; margin: 8px 0; }
    .label { color: #666; }
    .value { font-weight: bold; }
    .total { border-top: 2px solid #333; padding-top: 10px; margin-top: 20px; font-size: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>ARGU FIGHT</h1>
    <div class="receipt-number">Receipt: ${receipt.receiptNumber}</div>
    <div>Date: ${new Date(receipt.date).toLocaleString()}</div>
  </div>
  
  <div class="section">
    <div class="section-title">Advertiser Information</div>
    <div class="row"><span class="label">Company:</span><span class="value">${receipt.advertiser.companyName}</span></div>
    <div class="row"><span class="label">Contact:</span><span class="value">${receipt.advertiser.contactName || receipt.advertiser.contactEmail}</span></div>
    <div class="row"><span class="label">Email:</span><span class="value">${receipt.advertiser.contactEmail}</span></div>
  </div>
  
  <div class="section">
    <div class="section-title">Campaign Details</div>
    <div class="row"><span class="label">Campaign:</span><span class="value">${receipt.campaign.name}</span></div>
    <div class="row"><span class="label">Type:</span><span class="value">${receipt.campaign.type}</span></div>
    <div class="row"><span class="label">Category:</span><span class="value">${receipt.campaign.category}</span></div>
    <div class="row"><span class="label">Duration:</span><span class="value">${new Date(receipt.campaign.startDate).toLocaleDateString()} - ${new Date(receipt.campaign.endDate).toLocaleDateString()}</span></div>
  </div>
  
  <div class="section">
    <div class="section-title">Payment Details</div>
    <div class="row"><span class="label">Campaign Budget:</span><span class="value">$${(receipt.payment.budget ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
    <div class="row"><span class="label">Stripe Processing Fee:</span><span class="value">$${(receipt.payment.stripeFee ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
    <div class="row total"><span>Total Paid:</span><span>$${(receipt.payment.totalPaid ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
    <div class="row"><span class="label">Payment ID:</span><span class="value">${receipt.payment.stripePaymentId}</span></div>
    <div class="row"><span class="label">Paid At:</span><span class="value">${new Date(receipt.payment.paidAt).toLocaleString()}</span></div>
  </div>
</body>
</html>
                                            `
                                            
                                            // Open receipt in new window for printing
                                            const printWindow = window.open('', '_blank')
                                            if (printWindow) {
                                              printWindow.document.write(receiptHTML)
                                              printWindow.document.close()
                                              printWindow.focus()
                                              setTimeout(() => {
                                                printWindow.print()
                                              }, 250)
                                            }
                                          } else {
                                            const error = await response.json()
                                            showToast({
                                              type: 'error',
                                              title: 'Error',
                                              description: error.error || 'Failed to load receipt',
                                            })
                                          }
                                        } catch (error: any) {
                                          showToast({
                                            type: 'error',
                                            title: 'Error',
                                            description: error.message || 'Failed to load receipt',
                                          })
                                        }
                                      }}
                                    >
                                      Receipt
                                    </Button>
                                  )}
                                  <Link href={`/advertiser/campaigns/${campaign.id}`}>
                                    <Button variant="secondary" size="sm">View</Button>
                                  </Link>
                                  <Link href={`/advertiser/campaigns/${campaign.id}/analytics`}>
                                    <Button variant="secondary" size="sm">Analytics</Button>
                                  </Link>
                                  {(campaign.status !== 'ACTIVE' && campaign.status !== 'COMPLETED' && campaign.paymentStatus !== 'PAID') && (
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={async () => {
                                        if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
                                          return
                                        }
                                        try {
                                          const response = await fetch(`/api/advertiser/campaigns/${campaign.id}`, {
                                            method: 'DELETE',
                                          })
                                          if (response.ok) {
                                            showToast({
                                              type: 'success',
                                              title: 'Campaign Deleted',
                                              description: 'The campaign has been deleted successfully.',
                                            })
                                            fetchData()
                                          } else {
                                            const error = await response.json()
                                            showToast({
                                              type: 'error',
                                              title: 'Delete Failed',
                                              description: error.error || 'Failed to delete campaign',
                                            })
                                          }
                                        } catch (error: any) {
                                          showToast({
                                            type: 'error',
                                            title: 'Error',
                                            description: error.message || 'Failed to delete campaign',
                                          })
                                        }
                                      }}
                                    >
                                      Delete
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'support',
                  label: 'Support Tickets',
                  content: (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-text-primary">Support Tickets</h3>
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => {
                            setShowSupportModal(true)
                            setSupportSubject('')
                            setSupportDescription('')
                            setSupportCategory('Technical')
                            setSupportPriority('MEDIUM')
                          }}
                        >
                          + New Ticket
                        </Button>
                      </div>
                      {supportTickets.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-text-secondary mb-4">No support tickets yet</p>
                          <Button 
                            variant="primary"
                            onClick={() => {
                              setShowSupportModal(true)
                              setSupportSubject('')
                              setSupportDescription('')
                              setSupportCategory('Technical')
                              setSupportPriority('MEDIUM')
                            }}
                          >
                            Create Support Ticket
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {supportTickets.map((ticket) => (
                            <div
                              key={ticket.id}
                              className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-bg-tertiary hover:border-electric-blue transition-colors cursor-pointer"
                              onClick={async () => {
                                // Fetch fresh ticket data when opening modal
                                try {
                                  const response = await fetch(`/api/support/tickets/${ticket.id}?t=${Date.now()}`, {
                                    cache: 'no-store',
                                  })
                                  if (response.ok) {
                                    const data = await response.json()
                                    console.log('[Advertiser Dashboard] Opening ticket with replies:', data.ticket?.replies?.length || 0)
                                    setSelectedSupportTicket(data.ticket)
                                  } else {
                                    // Fallback to ticket from list if fetch fails
                                    setSelectedSupportTicket(ticket)
                                  }
                                } catch (error) {
                                  console.error('[Advertiser Dashboard] Failed to fetch ticket:', error)
                                  // Fallback to ticket from list if fetch fails
                                  setSelectedSupportTicket(ticket)
                                }
                                setShowSupportDetailModal(true)
                              }}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-lg font-bold text-text-primary">{ticket.subject}</h3>
                                  <Badge className={
                                    ticket.status === 'OPEN' ? 'bg-electric-blue/20 backdrop-blur-sm border border-electric-blue/50 text-electric-blue font-semibold' :
                                    ticket.status === 'IN_PROGRESS' ? 'bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/50 text-yellow-400 font-semibold' :
                                    ticket.status === 'RESOLVED' ? 'bg-cyber-green/20 backdrop-blur-sm border border-cyber-green/50 text-cyber-green font-semibold' :
                                    'bg-text-secondary/20 backdrop-blur-sm border border-text-secondary/50 text-text-secondary font-semibold'
                                  }>
                                    {ticket.status.replace('_', ' ')}
                                  </Badge>
                                  <Badge className={
                                    ticket.priority === 'URGENT' ? 'bg-red-500/20 backdrop-blur-sm border border-red-500/50 text-red-400 font-semibold' :
                                    ticket.priority === 'HIGH' ? 'bg-neon-orange/20 backdrop-blur-sm border border-neon-orange/50 text-neon-orange font-semibold' :
                                    ticket.priority === 'MEDIUM' ? 'bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/50 text-yellow-400 font-semibold' :
                                    'bg-cyber-green/20 backdrop-blur-sm border border-cyber-green/50 text-cyber-green font-semibold'
                                  }>
                                    {ticket.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-text-secondary line-clamp-2 mb-2">{ticket.description}</p>
                                <div className="flex items-center gap-4 text-xs text-text-secondary">
                                  <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                  <span>{ticket.replies.length} {ticket.replies.length === 1 ? 'reply' : 'replies'}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ),
                },
              ]}
              defaultTab="campaigns"
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </Card>
        </div>
      </div>
      
      {/* Support Ticket Modal */}
      <Modal
        isOpen={showSupportModal}
        onClose={() => {
          setShowSupportModal(false)
          setSupportSubject('')
          setSupportDescription('')
          setSupportCategory('Technical')
          setSupportPriority('MEDIUM')
        }}
        title="Create Support Ticket"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Subject *
            </label>
            <Input
              value={supportSubject}
              onChange={(e) => setSupportSubject(e.target.value)}
              placeholder="Brief description of your issue"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Description *
            </label>
            <textarea
              value={supportDescription}
              onChange={(e) => setSupportDescription(e.target.value)}
              placeholder="Please provide details about your issue..."
              rows={6}
              className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-bg-tertiary"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Category
              </label>
              <select
                value={supportCategory}
                onChange={(e) => setSupportCategory(e.target.value)}
                className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-electric-blue"
              >
                <option value="Technical">Technical</option>
                <option value="Billing">Billing</option>
                <option value="Campaign">Campaign</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Priority
              </label>
              <select
                value={supportPriority}
                onChange={(e) => setSupportPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')}
                className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-electric-blue"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowSupportModal(false)
                setSupportSubject('')
                setSupportDescription('')
                setSupportCategory('Technical')
                setSupportPriority('MEDIUM')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateSupportTicket}
              isLoading={isSubmittingSupportTicket}
              disabled={!supportSubject.trim() || !supportDescription.trim()}
            >
              Submit Ticket
            </Button>
          </div>
        </div>
      </Modal>

      {/* Support Ticket Detail Modal */}
      {selectedSupportTicket && (
        <Modal
          isOpen={showSupportDetailModal}
          onClose={() => {
            setShowSupportDetailModal(false)
            setSelectedSupportTicket(null)
            setSupportReplyContent('')
          }}
          title={selectedSupportTicket.subject}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={
                selectedSupportTicket.status === 'OPEN' ? 'bg-electric-blue/20 backdrop-blur-sm border border-electric-blue/50 text-electric-blue font-semibold' :
                selectedSupportTicket.status === 'IN_PROGRESS' ? 'bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/50 text-yellow-400 font-semibold' :
                selectedSupportTicket.status === 'RESOLVED' ? 'bg-cyber-green/20 backdrop-blur-sm border border-cyber-green/50 text-cyber-green font-semibold' :
                'bg-text-secondary/20 backdrop-blur-sm border border-text-secondary/50 text-text-secondary font-semibold'
              }>
                {selectedSupportTicket.status.replace('_', ' ')}
              </Badge>
              <Badge className={
                selectedSupportTicket.priority === 'URGENT' ? 'bg-red-500/20 backdrop-blur-sm border border-red-500/50 text-red-400 font-semibold' :
                selectedSupportTicket.priority === 'HIGH' ? 'bg-neon-orange/20 backdrop-blur-sm border border-neon-orange/50 text-neon-orange font-semibold' :
                selectedSupportTicket.priority === 'MEDIUM' ? 'bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/50 text-yellow-400 font-semibold' :
                'bg-cyber-green/20 backdrop-blur-sm border border-cyber-green/50 text-cyber-green font-semibold'
              }>
                {selectedSupportTicket.priority}
              </Badge>
            </div>
            <div className="bg-bg-tertiary rounded-lg p-4">
              <p className="text-text-primary whitespace-pre-wrap">{selectedSupportTicket.description}</p>
              <p className="text-xs text-text-secondary mt-2">
                Created {new Date(selectedSupportTicket.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-text-primary">Replies</h3>
              {selectedSupportTicket.replies && selectedSupportTicket.replies.length > 0 ? (
                selectedSupportTicket.replies.map((reply) => (
                <div
                  key={reply.id}
                  className={`bg-bg-tertiary rounded-lg p-4 ${
                    reply.author.isAdmin ? 'border-l-4 border-electric-blue' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-text-primary">{reply.author.username}</span>
                    {reply.author.isAdmin && (
                      <Badge className="bg-electric-blue/20 backdrop-blur-sm border border-electric-blue/50 text-electric-blue font-semibold">
                        Admin
                      </Badge>
                    )}
                    <span className="text-xs text-text-secondary ml-auto">
                      {new Date(reply.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-text-secondary whitespace-pre-wrap">{reply.content}</p>
                </div>
              ))
              ) : (
                <p className="text-text-secondary text-sm">No replies yet.</p>
              )}
            </div>
            <div className="border-t border-bg-tertiary pt-4">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Add Reply
              </label>
              <textarea
                value={supportReplyContent}
                onChange={(e) => setSupportReplyContent(e.target.value)}
                placeholder="Type your reply..."
                rows={4}
                className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-bg-tertiary mb-2"
              />
              <Button
                onClick={handleSubmitSupportReply}
                isLoading={isSubmittingSupportReply}
                disabled={!supportReplyContent.trim()}
              >
                Send Reply
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

