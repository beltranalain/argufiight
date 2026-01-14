'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import Link from 'next/link'

interface Campaign {
  id: string
  name: string
  type: string
  category: string
  status: string
  paymentStatus?: string | null
  budget: number
  startDate: string
  endDate: string
  destinationUrl: string
  ctaText: string
  bannerUrl: string | null
  minELO: number | null
  targetCategories: string[]
  minFollowers: number | null
  maxBudgetPerCreator: number | null
  impressionsDelivered: number
  clicksDelivered: number
}

const formatStatus = (status: string) => {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

const formatCampaignType = (type: string) => {
  return type
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
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
    case 'APPROVED':
      return 'bg-cyber-green/20 text-cyber-green'
    case 'REJECTED':
      return 'bg-red-500/20 text-red-500'
    case 'COMPLETED':
      return 'bg-cyber-green/20 text-cyber-green'
    case 'CANCELLED':
      return 'bg-gray-500/20 text-gray-400'
    default:
      return 'bg-gray-500/20 text-gray-400'
  }
}

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const campaignId = params.id as string
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  useEffect(() => {
    fetchCampaign()
  }, [campaignId])

  const fetchCampaign = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/advertiser/campaigns/${campaignId}`)
      if (response.ok) {
        const data = await response.json()
        setCampaign(data.campaign)
      } else if (response.status === 404) {
        router.push('/advertiser/dashboard')
      }
    } catch (error) {
      console.error('Failed to fetch campaign:', error)
    } finally {
      setIsLoading(false)
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

  if (!campaign) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="ADVERTISER" />
        <div className="pt-20 px-4 md:px-8 pb-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardBody>
                <p className="text-text-secondary text-center py-8">
                  Campaign not found
                </p>
                <div className="flex justify-center">
                  <Button variant="primary" onClick={() => router.push('/advertiser/dashboard')}>
                    Back to Dashboard
                  </Button>
                </div>
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
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">{campaign.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getStatusColor(campaign.status)}>
                  {formatStatus(campaign.status)}
                </Badge>
              </div>
            </div>
            <div className="flex gap-3">
              {(campaign.status === 'PENDING_PAYMENT' || campaign.paymentStatus === 'PENDING') && (
                <Button
                  variant="primary"
                  onClick={async () => {
                    try {
                      setIsProcessingPayment(true)
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
                    } finally {
                      setIsProcessingPayment(false)
                    }
                  }}
                  isLoading={isProcessingPayment}
                >
                  Pay Now
                </Button>
              )}
              {campaign.paymentStatus === 'PAID' && (campaign as any).paidAt && (
                <Button
                  variant="secondary"
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
    <div class="row"><span class="label">Campaign Budget:</span><span class="value">$${receipt.payment.budget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
    <div class="row"><span class="label">Stripe Processing Fee:</span><span class="value">$${receipt.payment.stripeFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
    <div class="row total"><span>Total Paid:</span><span>$${receipt.payment.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
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
                          // Auto-print after a short delay
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
                  View Receipt
                </Button>
              )}
              <Link href={`/advertiser/campaigns/${campaign.id}/analytics`}>
                <Button variant="secondary">Analytics</Button>
              </Link>
              {(campaign.status !== 'ACTIVE' && campaign.status !== 'COMPLETED' && campaign.paymentStatus !== 'PAID') && (
                <Button
                  variant="secondary"
                  onClick={async () => {
                    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
                      return
                    }
                    try {
                      setIsDeleting(true)
                      const response = await fetch(`/api/advertiser/campaigns/${campaign.id}`, {
                        method: 'DELETE',
                      })
                      if (response.ok) {
                        showToast({
                          type: 'success',
                          title: 'Campaign Deleted',
                          description: 'The campaign has been deleted successfully.',
                        })
                        router.push('/advertiser/dashboard')
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
                    } finally {
                      setIsDeleting(false)
                    }
                  }}
                  isLoading={isDeleting}
                >
                  Delete
                </Button>
              )}
              <Button variant="secondary" onClick={() => router.push('/advertiser/dashboard')}>
                Back to Dashboard
              </Button>
            </div>
          </div>

          {/* Campaign Details */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">Campaign Details</h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-text-secondary">Campaign Type</label>
                  <p className="text-text-primary font-semibold mt-1">
                    {formatCampaignType(campaign.type)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">Category</label>
                  <p className="text-text-primary font-semibold mt-1">{campaign.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">Budget</label>
                  <p className="text-text-primary font-semibold mt-1">
                    ${Number(campaign.budget ?? 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">Duration</label>
                  <p className="text-text-primary font-semibold mt-1">
                    {new Date(campaign.startDate).toLocaleDateString()} -{' '}
                    {new Date(campaign.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">Destination URL</label>
                  <p className="text-text-primary font-semibold mt-1">
                    <a
                      href={campaign.destinationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-electric-blue hover:underline"
                    >
                      {campaign.destinationUrl}
                    </a>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">CTA Text</label>
                  <p className="text-text-primary font-semibold mt-1">{campaign.ctaText}</p>
                </div>
              </div>

              {campaign.bannerUrl && (
                <div className="mt-6">
                  <label className="text-sm font-medium text-text-secondary">Banner Image</label>
                  <div className="mt-2">
                    <img
                      src={campaign.bannerUrl}
                      alt="Campaign banner"
                      className="max-w-full h-auto rounded-lg border border-bg-tertiary"
                    />
                  </div>
                </div>
              )}

              {/* Targeting (for creator sponsorships) */}
              {campaign.type === 'CREATOR_SPONSORSHIP' && (
                <div className="mt-6 pt-6 border-t border-bg-tertiary">
                  <h3 className="text-lg font-bold text-text-primary mb-4">Targeting Options</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {campaign.minELO && (
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Min ELO</label>
                        <p className="text-text-primary font-semibold mt-1">{campaign.minELO}</p>
                      </div>
                    )}
                    {campaign.minFollowers && (
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Min Followers</label>
                        <p className="text-text-primary font-semibold mt-1">
                          {campaign.minFollowers.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {campaign.maxBudgetPerCreator && (
                      <div>
                        <label className="text-sm font-medium text-text-secondary">
                          Max Budget Per Creator
                        </label>
                        <p className="text-text-primary font-semibold mt-1">
                          ${Number(campaign.maxBudgetPerCreator ?? 0).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {campaign.targetCategories.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-text-secondary">
                          Target Categories
                        </label>
                        <p className="text-text-primary font-semibold mt-1">
                          {campaign.targetCategories.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">Performance Summary</h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-text-secondary">Total Impressions</label>
                  <p className="text-2xl font-bold text-electric-blue mt-1">
                    {campaign.impressionsDelivered.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">Total Clicks</label>
                  <p className="text-2xl font-bold text-cyber-green mt-1">
                    {campaign.clicksDelivered.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

