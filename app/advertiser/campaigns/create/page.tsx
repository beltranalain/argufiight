'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/Loading'

type Step = 1 | 2 | 3 | 4 | 5

export default function CreateCampaignPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
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
    
    // Step 3: Creative Assets
    bannerUrl: '',
    
    // Step 4: Targeting (for creator sponsorships)
    minELO: '',
    targetCategories: [] as string[],
    minFollowers: '',
    maxBudgetPerCreator: '',
  })

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as Step)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step)
    }
  }

  const handleSubmit = async () => {
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
      
      if (selectedFile) {
        submitFormData.append('file', selectedFile)
      } else if (formData.bannerUrl) {
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

      const response = await fetch('/api/advertiser/campaigns', {
        method: 'POST',
        body: submitFormData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create campaign')
      }

      showToast({
        type: 'success',
        title: 'Campaign Created',
        description: 'Your campaign is pending admin review.',
      })

      router.push('/advertiser/dashboard')
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
          <div className="space-y-4">
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
                  setSelectedFile(file || null)
                }}
              />
              {!selectedFile && (
                <div className="mt-2">
                  <Input
                    value={formData.bannerUrl}
                    onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                    placeholder="Or enter image URL"
                  />
                </div>
              )}
              <p className="text-xs text-text-secondary mt-1">
                Recommended: 728x90px for banners, 1200x630px for social
              </p>
            </div>
          </div>
        )

      case 4:
        if (formData.type !== 'CREATOR_SPONSORSHIP') {
          // Skip to step 5 if not creator sponsorship
          return renderStep()
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
                {['SPORTS', 'TECH', 'POLITICS', 'SCIENCE', 'ENTERTAINMENT'].map((cat) => (
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
                ))}
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
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-text-primary mb-4">Review & Submit</h3>
            <div className="bg-bg-secondary rounded-lg p-6 space-y-4">
              <div>
                <span className="text-text-secondary">Campaign Type:</span>
                <span className="ml-2 text-text-primary font-semibold">{formData.type}</span>
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
                  ${Number(formData.budget).toLocaleString()}
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
                Your campaign will be submitted for admin review. You'll be notified once it's approved.
              </p>
            </div>
          </div>
        )

      default:
        return null
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
                  Step {currentStep} of 5
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-bg-tertiary rounded-full h-2">
                <div
                  className="bg-electric-blue h-2 rounded-full transition-all"
                  style={{ width: `${(currentStep / 5) * 100}%` }}
                />
              </div>
            </CardHeader>
            <CardBody>
              {renderStep()}
              <div className="flex justify-between mt-8 pt-6 border-t border-bg-tertiary">
                <Button
                  variant="secondary"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                >
                  Back
                </Button>
                {currentStep < 5 ? (
                  <Button variant="primary" onClick={handleNext}>
                    Next
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    isLoading={isSubmitting}
                  >
                    Submit Campaign
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

