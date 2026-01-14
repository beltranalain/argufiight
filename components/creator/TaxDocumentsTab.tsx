'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { W9Form } from './W9Form'

interface TaxForm1099 {
  id: string
  taxYear: number
  totalCompensation: number
  status: string
  pdfUrl: string | null
  generatedAt: string | null
  sentToCreator: boolean
}

interface TaxInfo {
  w9Submitted: boolean
  w9SubmittedAt: string | null
  legalName: string | null
  taxIdType: string | null
  yearlyEarnings: Record<string, number>
  taxForms1099: TaxForm1099[]
}

export function TaxDocumentsTab() {
  const { showToast } = useToast()
  const [taxInfo, setTaxInfo] = useState<TaxInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingW9, setIsSubmittingW9] = useState(false)
  const [showW9Form, setShowW9Form] = useState(false)

  useEffect(() => {
    fetchTaxInfo()
  }, [])

  const fetchTaxInfo = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/creator/tax-info?' + new Date().getTime(), {
        credentials: 'include',
        cache: 'no-store',
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[TaxDocumentsTab] Tax info data:', data)
        console.log('[TaxDocumentsTab] Tax forms count:', data.taxForms1099?.length || 0)
        console.log('[TaxDocumentsTab] Tax forms:', data.taxForms1099)
        setTaxInfo(data)
        // Show W-9 form if not submitted
        if (!data.w9Submitted) {
          setShowW9Form(true)
        }
      } else {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText || `HTTP ${response.status}: ${response.statusText}` }
        }
        console.error('Tax info fetch error:', response.status, errorData)
        showToast({
          type: 'error',
          title: 'Error',
          description: errorData.error || `Failed to load tax information (${response.status})`,
        })
      }
    } catch (error) {
      console.error('Failed to fetch tax info:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load tax information',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleW9Submit = async (formData: any) => {
    try {
      setIsSubmittingW9(true)
      const response = await fetch('/api/creator/tax-info/w9', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit W-9')
      }

      await fetchTaxInfo()
      setShowW9Form(false)
    } catch (error: any) {
      throw error
    } finally {
      setIsSubmittingW9(false)
    }
  }

  const download1099 = async (taxYear: number) => {
    try {
      const response = await fetch(`/api/creator/tax-info/1099/${taxYear}/download`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to download 1099')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `1099-NEC-${taxYear}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      showToast({
        type: 'success',
        title: 'Download Started',
        description: 'Your 1099 form is downloading',
      })
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Download Failed',
        description: error.message || 'Failed to download 1099 form',
      })
    }
  }

  const currentYear = new Date().getFullYear()
  const currentYearEarnings = taxInfo?.yearlyEarnings?.[currentYear.toString()] || 0
  const needs1099 = currentYearEarnings >= 600

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* W-9 Form Section */}
      {showW9Form && (
        <W9Form
          existingData={taxInfo ? {
            legalName: taxInfo.legalName || undefined,
            taxIdType: taxInfo.taxIdType as 'SSN' | 'EIN' | '' || undefined,
            businessType: 'Individual',
          } : null}
          onSubmit={handleW9Submit}
          isLoading={isSubmittingW9}
        />
      )}

      {/* Tax Status Overview */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold text-white">Tax Status</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg">
              <div>
                <div className="text-sm text-text-secondary">W-9 Status</div>
                <div className="text-lg font-semibold text-white mt-1">
                  {taxInfo?.w9Submitted ? (
                    <span className="text-cyber-green">✓ Submitted</span>
                  ) : (
                    <span className="text-neon-orange">⚠ Required</span>
                  )}
                </div>
                {taxInfo?.w9SubmittedAt && (
                  <div className="text-xs text-text-secondary mt-1">
                    Submitted: {new Date(taxInfo.w9SubmittedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
              {!taxInfo?.w9Submitted && (
                <Button
                  variant="primary"
                  onClick={() => setShowW9Form(true)}
                >
                  Complete W-9
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg">
              <div>
                <div className="text-sm text-text-secondary">{currentYear} Year-to-Date Earnings</div>
                <div className="text-lg font-semibold text-white mt-1">
                  ${currentYearEarnings.toLocaleString()}
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  {needs1099 ? (
                    <span className="text-cyber-green">✓ 1099 will be issued</span>
                  ) : (
                    <span>1099 threshold: $600 (${(600 - currentYearEarnings).toLocaleString()} remaining)</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tax Documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Tax Documents</h2>
              <p className="text-sm text-text-secondary mt-1">
                Download your 1099-NEC forms for tax filing
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchTaxInfo}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {!taxInfo?.w9Submitted ? (
            <div className="text-center py-8">
              <p className="text-text-secondary mb-4">
                Please complete your W-9 form to receive tax documents
              </p>
              <Button
                variant="primary"
                onClick={() => setShowW9Form(true)}
              >
                Complete W-9 Form
              </Button>
            </div>
          ) : taxInfo.taxForms1099.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-secondary">
                No 1099 forms available yet. Forms are generated at the end of each tax year.
              </p>
              {needs1099 && (
                <div className="mt-4 space-y-2">
                  <p className="text-text-secondary text-sm">
                    You've earned ${currentYearEarnings.toLocaleString()} this year. Your 1099-NEC for {currentYear} will be available by January 31, {currentYear + 1}.
                  </p>
                  {/* Show earnings for previous years that might need 1099 */}
                  {Object.entries(taxInfo.yearlyEarnings || {}).map(([year, earnings]) => {
                    const yearNum = parseInt(year)
                    const yearEarnings = typeof earnings === 'number' ? earnings : 0
                    if (yearEarnings >= 600 && yearNum < currentYear) {
                      return (
                        <p key={year} className="text-text-secondary text-sm">
                          You earned ${yearEarnings.toLocaleString()} in {year}. Contact support to request your 1099-NEC for {year}.
                        </p>
                      )
                    }
                    return null
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {taxInfo.taxForms1099.map((form) => (
                <div
                  key={form.id}
                  className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg border border-bg-tertiary"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">
                        1099-NEC - {form.taxYear}
                      </h3>
                      <Badge
                        className={
                          form.status === 'FILED'
                            ? 'bg-green-500 text-white'
                            : form.status === 'SENT'
                            ? 'bg-blue-500 text-white'
                            : form.status === 'GENERATED'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-gray-500 text-white'
                        }
                      >
                        {form.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-text-secondary">
                      <p>Total Compensation: <span className="text-white font-semibold">${form.totalCompensation.toLocaleString()}</span></p>
                      {form.generatedAt && (
                        <p>Generated: {new Date(form.generatedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {form.pdfUrl && form.status !== 'PENDING' ? (
                      <Button
                        variant="secondary"
                        onClick={() => download1099(form.taxYear)}
                      >
                        Download PDF
                      </Button>
                    ) : (
                      <span className="text-text-secondary text-sm">Not available yet</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Yearly Earnings Summary */}
      {taxInfo && Object.keys(taxInfo.yearlyEarnings || {}).length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-white">Earnings by Year</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {Object.entries(taxInfo.yearlyEarnings)
                .sort(([a], [b]) => parseInt(b) - parseInt(a))
                .map(([year, earnings]) => (
                  <div
                    key={year}
                    className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg"
                  >
                    <span className="text-white font-semibold">{year}</span>
                    <span className="text-electric-blue font-bold">
                      ${(earnings as number).toLocaleString()}
                    </span>
                  </div>
                ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
