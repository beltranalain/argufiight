'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

interface CreatorTaxInfo {
  id: string
  creatorId: string
  creator: {
    id: string
    username: string
    email: string
  }
  legalName: string | null
  businessName: string | null
  taxIdType: string | null
  w9Submitted: boolean
  w9SubmittedAt: string | null
  yearlyEarnings: Record<string, number>
  taxForms1099: TaxForm1099[]
}

interface TaxForm1099 {
  id: string
  taxYear: number
  totalCompensation: number
  status: string
  pdfUrl: string | null
  generatedAt: string | null
  sentToCreator: boolean
  sentAt: string | null
  filedWithIRS: boolean
  filedAt: string | null
}

export default function CreatorTaxesPage() {
  const { showToast } = useToast()
  const [creators, setCreators] = useState<CreatorTaxInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() - 1)
  const [filterStatus, setFilterStatus] = useState<'all' | 'w9-missing' | 'needs-1099' | '1099-pending'>('all')

  useEffect(() => {
    fetchCreators()
  }, [])

  const fetchCreators = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/creator-taxes', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setCreators(data.creators || [])
      } else {
        showToast({
          type: 'error',
          title: 'Error',
          description: 'Failed to load creator tax information',
        })
      }
    } catch (error) {
      console.error('Failed to fetch creators:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load creator tax information',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generate1099 = async (creatorId: string, taxYear: number) => {
    try {
      const response = await fetch(`/api/admin/creator-taxes/${creatorId}/1099/${taxYear}/generate`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate 1099')
      }

      showToast({
        type: 'success',
        title: 'Success',
        description: '1099 form generated successfully',
      })

      await fetchCreators()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to generate 1099',
      })
    }
  }

  const markAsSent = async (creatorId: string, taxYear: number) => {
    try {
      const response = await fetch(`/api/admin/creator-taxes/${creatorId}/1099/${taxYear}/mark-sent`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to mark as sent')
      }

      showToast({
        type: 'success',
        title: 'Success',
        description: 'Marked as sent to creator',
      })

      await fetchCreators()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to update status',
      })
    }
  }

  const markAsFiled = async (creatorId: string, taxYear: number) => {
    try {
      const response = await fetch(`/api/admin/creator-taxes/${creatorId}/1099/${taxYear}/mark-filed`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to mark as filed')
      }

      showToast({
        type: 'success',
        title: 'Success',
        description: 'Marked as filed with IRS',
      })

      await fetchCreators()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to update status',
      })
    }
  }

  const bulkGenerate1099 = async () => {
    if (!confirm(`Generate 1099 forms for ALL qualifying creators for ${selectedYear}? This will generate forms for creators with W-9 submitted and earnings >= $600.`)) {
      return
    }

    try {
      showToast({
        type: 'info',
        title: 'Processing',
        description: 'Generating 1099 forms... This may take a moment.',
      })

      const response = await fetch('/api/admin/creator-taxes/bulk-generate-1099', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ taxYear: selectedYear }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to bulk generate 1099s')
      }

      const result = await response.json()

      showToast({
        type: 'success',
        title: 'Bulk Generation Complete',
        description: `Generated ${result.results.generated} forms, skipped ${result.results.skipped}, ${result.results.errors.length} errors`,
      })

      await fetchCreators()
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to bulk generate 1099 forms',
      })
    }
  }

  const filteredCreators = creators.filter((creator) => {
    if (filterStatus === 'w9-missing') {
      return !creator.w9Submitted
    }
    if (filterStatus === 'needs-1099') {
      const earnings = creator.yearlyEarnings[selectedYear.toString()] || 0
      return earnings >= 600 && !creator.taxForms1099.find(f => f.taxYear === selectedYear)
    }
    if (filterStatus === '1099-pending') {
      return creator.taxForms1099.some(f => f.taxYear === selectedYear && f.status === 'GENERATED')
    }
    return true
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-white">Creator Tax Management</h1>
            <p className="text-text-secondary mt-2">Manage W-9 forms and 1099 tax documents</p>
          </div>

          {/* Filters */}
          <Card>
            <CardBody>
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Tax Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white"
                  >
                    {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Filter</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-4 py-2 bg-bg-tertiary border border-bg-tertiary rounded-lg text-white"
                  >
                    <option value="all">All Creators</option>
                    <option value="w9-missing">Missing W-9</option>
                    <option value="needs-1099">Needs 1099 ({selectedYear})</option>
                    <option value="1099-pending">1099 Pending Send</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="primary"
                    onClick={bulkGenerate1099}
                    className="mt-6"
                  >
                    Generate All 1099s ({selectedYear})
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Creators List */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-white">
                Creators ({filteredCreators.length})
              </h2>
            </CardHeader>
            <CardBody>
              {filteredCreators.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  No creators found matching the selected filters
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCreators.map((creator) => {
                    const yearEarnings = creator.yearlyEarnings[selectedYear.toString()] || 0
                    const form1099 = creator.taxForms1099.find(f => f.taxYear === selectedYear)
                    const needs1099 = yearEarnings >= 600

                    return (
                      <div
                        key={creator.id}
                        className="p-4 bg-bg-secondary rounded-lg border border-bg-tertiary"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-white">
                              {creator.creator.username}
                            </h3>
                            <p className="text-sm text-text-secondary">{creator.creator.email}</p>
                            {creator.legalName && (
                              <p className="text-sm text-text-secondary mt-1">
                                Legal Name: {creator.legalName}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {creator.w9Submitted ? (
                              <Badge className="bg-green-500 text-white">W-9 Submitted</Badge>
                            ) : (
                              <Badge className="bg-red-500 text-white">W-9 Missing</Badge>
                            )}
                            {needs1099 && (
                              <Badge className="bg-yellow-500 text-white">
                                Needs 1099 ({selectedYear})
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <div className="text-sm text-text-secondary">W-9 Submitted</div>
                            <div className="text-white font-semibold">
                              {creator.w9SubmittedAt
                                ? new Date(creator.w9SubmittedAt).toLocaleDateString()
                                : 'Never'}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-text-secondary">{selectedYear} Earnings</div>
                            <div className="text-white font-semibold">
                              ${(yearEarnings ?? 0).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-text-secondary">1099 Status</div>
                            <div className="text-white font-semibold">
                              {form1099 ? (
                                <Badge
                                  className={
                                    form1099.status === 'FILED'
                                      ? 'bg-green-500'
                                      : form1099.status === 'SENT'
                                      ? 'bg-blue-500'
                                      : 'bg-yellow-500'
                                  }
                                >
                                  {form1099.status}
                                </Badge>
                              ) : (
                                <span className="text-text-secondary">Not Generated</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-text-secondary">Tax ID Type</div>
                            <div className="text-white font-semibold">
                              {creator.taxIdType || 'N/A'}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-4 border-t border-bg-tertiary">
                          {needs1099 && !form1099 && creator.w9Submitted && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => generate1099(creator.creatorId, selectedYear)}
                            >
                              Generate 1099 ({selectedYear})
                            </Button>
                          )}
                          {form1099 && form1099.status === 'GENERATED' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => markAsSent(creator.creatorId, selectedYear)}
                            >
                              Mark as Sent
                            </Button>
                          )}
                          {form1099 && form1099.status === 'SENT' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => markAsFiled(creator.creatorId, selectedYear)}
                            >
                              Mark as Filed
                            </Button>
                          )}
                          {form1099 && form1099.pdfUrl && (
                            <a
                              href={`/api/admin/creator-taxes/${creator.creatorId}/1099/${selectedYear}/download`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="secondary" size="sm">
                                Download PDF
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
