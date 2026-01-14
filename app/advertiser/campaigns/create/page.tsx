'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/Loading'
import { AdPlacementGuide } from '@/components/advertiser/AdPlacementGuide'

type Step = 1 | 2 | 3 | 4 | 5 | 6

// Helper function to format campaign type for display (remove underscores, capitalize)
const formatCampaignType = (type: string): string => {
  return type
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function CreateCampaignPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [todayDate] = useState<string>(getTodayDate()) // Get today's date once on mount
  const [formData, setFormData] = useState({
    // Step 1: Campaign Type
    type: 'PLATFORM_ADS' as 'PLATFORM_ADS' | 'CREATOR_SPONSORSHIP' | 'TOURNAMENT_SPONSORSHIP',
    
    // Step 2: Campaign Details
    name: '',
    category: '',
    budget: '',
    startDate: '',
    endDate: '',
    destinationUrl: '',
    ctaText: 'Learn More',
    adType: null as null | 'BANNER' | 'IN_FEED' | 'SPONSORED_DEBATE', // Ad placement type (for PLATFORM_ADS) - null until user selects
    
    // Step 3: Creative Assets
    bannerUrl: '',
    
    // Step 4: Targeting (for creator sponsorships)
    minELO: '',
    targetCategories: [] as string[],
    minFollowers: '',
    maxBudgetPerCreator: '',
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  // Auto-advance past step 4 if not creator sponsorship
  useEffect(() => {
    if (currentStep === 4 && formData.type !== 'CREATOR_SPONSORSHIP') {
      setCurrentStep(5)
    }
  }, [currentStep, formData.type])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        const categoryNames = (data.categories || []).map((cat: any) => cat.name)
        setCategories(categoryNames)
      } else {
        // Fallback to default categories
        setCategories(['SPORTS', 'TECH', 'POLITICS', 'SCIENCE', 'ENTERTAINMENT', 'OTHER'])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      // Fallback to default categories
      setCategories(['SPORTS', 'TECH', 'POLITICS', 'SCIENCE', 'ENTERTAINMENT', 'OTHER'])
    }
  }

  const handleNext = () => {
    // For PLATFORM_ADS, go to payment step (6) after review (5)
    // For other types, submit directly
    if (formData.type === 'PLATFORM_ADS' && currentStep === 5) {
      setCurrentStep(6)
    } else if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as Step)
    }
  }

  const handleBack = () => {
    console.log('[CreateCampaign] handleBack called, currentStep:', currentStep)
    if (currentStep > 1) {
      // Special handling for step 6: go back to step 5
      if (currentStep === 6) {
        setCurrentStep(5)
        return
      }
      // For other steps, go back normally
      const newStep = (currentStep - 1) as Step
      console.log('[CreateCampaign] Moving to step:', newStep)
      setCurrentStep(newStep)
    } else {
      // On step 1, navigate back to dashboard
      console.log('[CreateCampaign] On step 1, navigating to dashboard')
      router.push('/advertiser/dashboard')
    }
  }

  const handleSubmit = async () => {
    console.log('[CreateCampaign] handleSubmit called')
    console.log('[CreateCampaign] Form data:', formData)
    console.log('[CreateCampaign] Selected file:', selectedFile)
    console.log('[CreateCampaign] Banner URL:', formData.bannerUrl)
    
    // Validate required fields
    if (!formData.name || !formData.category || !formData.budget || !formData.startDate || !formData.endDate || !formData.destinationUrl) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
      })
      return
    }

    // Validate adType for PLATFORM_ADS
    if (formData.type === 'PLATFORM_ADS' && !formData.adType) {
      showToast({
        type: 'error',
        title: 'Placement Required',
        description: 'Please select where you want your ad to appear in Step 1.',
      })
      return
    }

    // Validate image
    if (!selectedFile && !formData.bannerUrl) {
      showToast({
        type: 'error',
        title: 'Image Required',
        description: 'Please upload a banner image or provide an image URL.',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const submitFormData = new FormData()
      submitFormData.append('name', formData.name)
      submitFormData.append('type', formData.type)
      submitFormData.append('category', formData.category)
      submitFormData.append('budget', formData.budget)
      submitFormData.append('startDate', formData.startDate)
      submitFormData.append('endDate', formData.endDate)
      submitFormData.append('destinationUrl', formData.destinationUrl)
      submitFormData.append('ctaText', formData.ctaText)
      
      // Add adType for PLATFORM_ADS (matches Direct Ads types)
      if (formData.type === 'PLATFORM_ADS' && formData.adType) {
        submitFormData.append('adType', formData.adType)
      }
      
      if (selectedFile) {
        console.log('[CreateCampaign] Appending file:', selectedFile.name, selectedFile.size, 'bytes')
        submitFormData.append('file', selectedFile)
      } else if (formData.bannerUrl) {
        console.log('[CreateCampaign] Appending banner URL:', formData.bannerUrl)
        submitFormData.append('bannerUrl', formData.bannerUrl)
      }

      if (formData.type === 'CREATOR_SPONSORSHIP') {
        if (formData.minELO) submitFormData.append('minELO', formData.minELO)
        if (formData.targetCategories.length > 0) {
          submitFormData.append('targetCategories', JSON.stringify(formData.targetCategories))
        }
        if (formData.minFollowers) submitFormData.append('minFollowers', formData.minFollowers)
        if (formData.maxBudgetPerCreator) submitFormData.append('maxBudgetPerCreator', formData.maxBudgetPerCreator)
      }

      console.log('[CreateCampaign] Submitting to API...')
      console.log('[CreateCampaign] Request URL: /api/advertiser/campaigns')
      console.log('[CreateCampaign] Request method: POST')
      
      const response = await fetch('/api/advertiser/campaigns', {
        method: 'POST',
        body: submitFormData,
      })

      console.log('[CreateCampaign] Response status:', response.status)
      console.log('[CreateCampaign] Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        // Capture raw response text before parsing
        const contentType = response.headers.get('content-type') || ''
        const isJson = contentType.includes('application/json')
        
        let rawResponseText = ''
        let errorData: any = {}
        
        try {
          rawResponseText = await response.text()
          console.error('[CreateCampaign] Raw response text:', rawResponseText)
          console.error('[CreateCampaign] Response Content-Type:', contentType)
          
          if (rawResponseText) {
            if (isJson) {
              try {
                errorData = JSON.parse(rawResponseText)
              } catch (parseError) {
                console.error('[CreateCampaign] JSON parse error:', parseError)
                // If JSON parsing fails, use raw text as error message
                errorData = { error: rawResponseText || `Failed to create campaign (${response.status})` }
              }
            } else {
              // Non-JSON response - use raw text as error message
              errorData = { error: rawResponseText || `Failed to create campaign (${response.status})` }
            }
          } else {
            // Empty response body - create status-based error
            errorData = { error: `Failed to create campaign (${response.status})` }
          }
        } catch (textError) {
          console.error('[CreateCampaign] Error reading response text:', textError)
          errorData = { error: `Failed to create campaign (${response.status})` }
        }
        
        console.error('[CreateCampaign] API error:', errorData)
        console.error('[CreateCampaign] Response status:', response.status)
        console.error('[CreateCampaign] Response URL:', response.url)
        
        // Extract error message from various possible formats
        const errorMessage = errorData.error || 
                            errorData.message || 
                            errorData.detail ||
                            (rawResponseText && !isJson ? rawResponseText : null) ||
                            `Failed to create campaign (${response.status})`
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('[CreateCampaign] Campaign created:', data)

      // For PLATFORM_ADS, save campaign ID and go to payment step
      if (formData.type === 'PLATFORM_ADS' && data.campaign?.id) {
        setCreatedCampaignId(data.campaign.id)
        setCurrentStep(6)
        showToast({
          type: 'success',
          title: 'Campaign Created',
          description: 'Please proceed to payment.',
        })
      } else {
        // For other types, redirect to dashboard
        showToast({
          type: 'success',
          title: 'Campaign Created',
          description: 'Your campaign is pending admin review.',
        })
        router.push('/advertiser/dashboard')
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to create campaign',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-text-primary mb-4">Choose Campaign Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'PLATFORM_ADS' })}
                className={`p-6 border-2 rounded-lg text-left transition-all ${
                  formData.type === 'PLATFORM_ADS'
                    ? 'border-electric-blue bg-electric-blue/10'
                    : 'border-bg-tertiary hover:border-bg-secondary'
                }`}
              >
                <h4 className="font-bold text-text-primary mb-2">Platform Ads</h4>
                <p className="text-sm text-text-secondary">
                  Traditional banner ads shown to all users
                </p>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'CREATOR_SPONSORSHIP' })}
                className={`p-6 border-2 rounded-lg text-left transition-all ${
                  formData.type === 'CREATOR_SPONSORSHIP'
                    ? 'border-electric-blue bg-electric-blue/10'
                    : 'border-bg-tertiary hover:border-bg-secondary'
                }`}
              >
                <h4 className="font-bold text-text-primary mb-2">Creator Sponsorship</h4>
                <p className="text-sm text-text-secondary">
                  Sponsor specific creators for targeted reach
                </p>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'TOURNAMENT_SPONSORSHIP' })}
                className={`p-6 border-2 rounded-lg text-left transition-all ${
                  formData.type === 'TOURNAMENT_SPONSORSHIP'
                    ? 'border-electric-blue bg-electric-blue/10'
                    : 'border-bg-tertiary hover:border-bg-secondary'
                }`}
              >
                <h4 className="font-bold text-text-primary mb-2">Tournament Sponsorship</h4>
                <p className="text-sm text-text-secondary">
                  Sponsor tournaments for maximum visibility
                </p>
              </button>
              </div>
            </div>
            {formData.type === 'PLATFORM_ADS' && (
              <AdPlacementGuide 
                campaignType={formData.type}
                selectedAdType={formData.adType}
                onSelectPlacement={(adType) => setFormData({ ...formData, adType })}
              />
            )}
            {formData.type && formData.type !== 'PLATFORM_ADS' && (
              <AdPlacementGuide campaignType={formData.type} />
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-text-primary mb-4">Campaign Details</h3>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Campaign Name *
              </label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Summer Sale 2025"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary"
                >
                  <option value="">Select Category</option>
                  <option value="SPORTS">Sports</option>
                  <option value="TECH">Tech</option>
                  <option value="POLITICS">Politics</option>
                  <option value="SCIENCE">Science</option>
                  <option value="ENTERTAINMENT">Entertainment</option>
                </select>
              </div>
              {formData.type === 'PLATFORM_ADS' && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Ad Placement * (Selected in Step 1)
                  </label>
                  <select
                    required
                    value={formData.adType || ''}
                    onChange={(e) => setFormData({ ...formData, adType: e.target.value ? (e.target.value as 'BANNER' | 'IN_FEED' | 'SPONSORED_DEBATE') : null })}
                    className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary"
                  >
                    <option value="">Select placement (go back to Step 1 to choose)</option>
                    <option value="BANNER">Profile Banner</option>
                    <option value="IN_FEED">In-Feed Ads</option>
                    <option value="SPONSORED_DEBATE">Debate Sidebar</option>
                  </select>
                  {!formData.adType && (
                    <p className="text-xs text-neon-orange mt-1">
                      ⚠️ Please go back to Step 1 and select a placement for your ad.
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Budget ($) *
                </label>
                <Input
                  type="number"
                  required
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Destination URL *
                </label>
                <Input
                  type="url"
                  required
                  value={formData.destinationUrl}
                  onChange={(e) => setFormData({ ...formData, destinationUrl: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Start Date *
                </label>
                <Input
                  type="date"
                  required
                  min={todayDate}
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  End Date *
                </label>
                <Input
                  type="date"
                  required
                  min={formData.startDate || getTodayDate()}
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                CTA Text
              </label>
              <Input
                value={formData.ctaText}
                onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                placeholder="Learn More"
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-text-primary mb-4">Creative Assets</h3>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Banner Image *
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  console.log('[CreateCampaign] File selected:', file?.name, file?.size, 'bytes')
                  setSelectedFile(file || null)
                  // Clear bannerUrl if file is selected
                  if (file) {
                    setFormData(prev => ({ ...prev, bannerUrl: '' }))
                  }
                }}
              />
              {!selectedFile && (
                <div className="mt-2">
                  <Input
                    value={formData.bannerUrl}
                    onChange={(e) => {
                      console.log('[CreateCampaign] Banner URL changed:', e.target.value)
                      setFormData({ ...formData, bannerUrl: e.target.value })
                    }}
                    placeholder="Or enter image URL"
                  />
                </div>
              )}
              {selectedFile && (
                <div className="mt-2 p-2 bg-bg-secondary rounded text-sm text-text-secondary">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </div>
              )}
              <p className="text-xs text-text-secondary mt-1">
                Recommended: 728x90px for banners, 1200x630px for social
              </p>
            </div>
          </div>
        )

      case 4:
        // This step is only for CREATOR_SPONSORSHIP
        // If we reach here and it's not creator sponsorship, show a message
        // (useEffect should have advanced us, but just in case)
        if (formData.type !== 'CREATOR_SPONSORSHIP') {
          return (
            <div className="space-y-4">
              <p className="text-text-secondary">Loading next step...</p>
            </div>
          )
        }
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-text-primary mb-4">Targeting Options</h3>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Minimum ELO (Optional)
              </label>
              <Input
                type="number"
                value={formData.minELO}
                onChange={(e) => setFormData({ ...formData, minELO: e.target.value })}
                placeholder="1500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Target Categories
              </label>
              <div className="space-y-2">
                {categories.length === 0 ? (
                  <p className="text-text-secondary text-sm">Loading categories...</p>
                ) : (
                  categories.map((cat) => (
                    <label key={cat} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.targetCategories.includes(cat)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              targetCategories: [...formData.targetCategories, cat],
                            })
                          } else {
                            setFormData({
                              ...formData,
                              targetCategories: formData.targetCategories.filter((c) => c !== cat),
                            })
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-text-primary">{cat}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Minimum Followers
                </label>
                <Input
                  type="number"
                  value={formData.minFollowers}
                  onChange={(e) => setFormData({ ...formData, minFollowers: e.target.value })}
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Max Budget Per Creator ($)
                </label>
                <Input
                  type="number"
                  value={formData.maxBudgetPerCreator}
                  onChange={(e) => setFormData({ ...formData, maxBudgetPerCreator: e.target.value })}
                  placeholder="500"
                />
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-text-primary mb-4">Review & Submit</h3>
            <AdPlacementGuide campaignType={formData.type} compact />
            <div className="bg-bg-secondary rounded-lg p-6 space-y-4">
              <div>
                <span className="text-text-secondary">Campaign Type:</span>
                <span className="ml-2 text-text-primary font-semibold">{formatCampaignType(formData.type)}</span>
              </div>
              <div>
                <span className="text-text-secondary">Name:</span>
                <span className="ml-2 text-text-primary font-semibold">{formData.name}</span>
              </div>
              <div>
                <span className="text-text-secondary">Category:</span>
                <span className="ml-2 text-text-primary font-semibold">{formData.category}</span>
              </div>
              <div>
                <span className="text-text-secondary">Budget:</span>
                <span className="ml-2 text-text-primary font-semibold">
                  ${Number(formData.budget).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-text-secondary">Duration:</span>
                <span className="ml-2 text-text-primary font-semibold">
                  {formData.startDate && formData.endDate ? (() => {
                    // Parse date string (YYYY-MM-DD) and format for display
                    // The date string is already in the correct format, just reformat for display
                    const [startYear, startMonth, startDay] = formData.startDate.split('-')
                    const [endYear, endMonth, endDay] = formData.endDate.split('-')
                    // Format as M/D/YYYY (Eastern Time format)
                    return `${parseInt(startMonth)}/${parseInt(startDay)}/${startYear} - ${parseInt(endMonth)}/${parseInt(endDay)}/${endYear}`
                  })() : 'N/A'}
                </span>
              </div>
            </div>
            <div className="bg-bg-tertiary rounded-lg p-4">
              <p className="text-sm text-text-secondary">
                {formData.type === 'PLATFORM_ADS' 
                  ? 'After payment, your campaign will be submitted for admin review.'
                  : 'Your campaign will be submitted for admin review. You\'ll be notified once it\'s approved.'}
              </p>
            </div>
          </div>
        )

      case 6:
        // Payment step (only for PLATFORM_ADS)
        if (formData.type !== 'PLATFORM_ADS' || !createdCampaignId) {
          return null
        }

        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-4">Payment Required</h2>
              <p className="text-text-secondary mb-4">
                To submit your Platform Ads campaign, payment is required. Your payment will be held in escrow
                and will be processed once your campaign is approved.
              </p>
              
              <div className="bg-bg-secondary rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-text-secondary">Campaign Budget:</span>
                  <span className="text-text-primary font-semibold">${Number(formData.budget).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-text-secondary">
                  <span>Processing Fee (2.9% + $0.30):</span>
                  <span>${(Number(formData.budget) * 0.029 + 0.30).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="border-t border-bg-tertiary mt-2 pt-2 flex justify-between items-center">
                  <span className="text-text-primary font-bold">Total:</span>
                  <span className="text-electric-blue font-bold text-lg">
                    ${(Number(formData.budget) * 1.029 + 0.30).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="bg-bg-tertiary rounded-lg p-4">
                <p className="text-sm text-text-secondary">
                  <strong>Note:</strong> If your campaign is rejected, your payment will be refunded in full.
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const handlePayment = async () => {
    if (!createdCampaignId) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Campaign ID not found',
      })
      return
    }

    try {
      setIsProcessingPayment(true)
      const response = await fetch('/api/advertiser/campaigns/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: createdCampaignId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create payment session')
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
        description: error.message || 'Failed to process payment',
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="ADVERTISER" />
      <div className="pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-text-primary">Create Campaign</h1>
                <div className="text-sm text-text-secondary">
                  Step {currentStep} of {formData.type === 'PLATFORM_ADS' ? 6 : 5}
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-bg-tertiary rounded-full h-2">
                <div
                  className="bg-electric-blue h-2 rounded-full transition-all"
                  style={{ width: `${(currentStep / (formData.type === 'PLATFORM_ADS' ? 6 : 5)) * 100}%` }}
                />
              </div>
            </CardHeader>
            <CardBody>
              {renderStep()}
              <div className="flex justify-between mt-8 pt-6 border-t border-bg-tertiary">
                <Button
                  variant="secondary"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('[CreateCampaign] Back button clicked, currentStep:', currentStep)
                    handleBack()
                  }}
                  type="button"
                >
                  Back
                </Button>
                {currentStep < 5 ? (
                  <Button 
                    variant="primary" 
                    onClick={(e) => {
                      e.preventDefault()
                      console.log('[CreateCampaign] Next button clicked, currentStep:', currentStep)
                      handleNext()
                    }}
                    type="button"
                  >
                    Next
                  </Button>
                ) : currentStep === 5 ? (
                  <Button
                    variant="primary"
                    onClick={async (e) => {
                      e.preventDefault()
                      console.log('[CreateCampaign] Submit button clicked, currentStep:', currentStep)
                      await handleSubmit()
                    }}
                    isLoading={isSubmitting}
                    type="button"
                  >
                    {formData.type === 'PLATFORM_ADS' ? 'Continue to Payment' : 'Submit Campaign'}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={async (e) => {
                      e.preventDefault()
                      console.log('[CreateCampaign] Payment button clicked, currentStep:', currentStep)
                      await handlePayment()
                    }}
                    isLoading={isProcessingPayment}
                    type="button"
                  >
                    Proceed to Payment
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

