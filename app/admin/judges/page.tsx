'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

interface Judge {
  id: string
  name: string
  personality: string
  emoji: string
  description: string
  systemPrompt: string
  debatesJudged: number
  createdAt: string
  _count?: {
    verdicts: number
  }
}

interface Verdict {
  id: string
  debateId: string
  decision: 'CHALLENGER_WINS' | 'OPPONENT_WINS' | 'TIE'
  reasoning: string
  challengerScore: number | null
  opponentScore: number | null
  winnerId: string | null
  createdAt: string
  debate: {
    id: string
    topic: string
    category: string
    status: string
    challenger: {
      id: string
      username: string
      avatarUrl: string | null
    }
    opponent: {
      id: string
      username: string
      avatarUrl: string | null
    } | null
    createdAt: string
  }
}

export default function JudgesPage() {
  const { showToast } = useToast()
  const [judges, setJudges] = useState<Judge[]>([])
  const [selectedJudgeId, setSelectedJudgeId] = useState<string | null>(null)
  const [verdicts, setVerdicts] = useState<Record<string, Verdict[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingVerdicts, setIsLoadingVerdicts] = useState<Record<string, boolean>>({})
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    personality: '',
    description: '',
    systemPrompt: '',
  })

  useEffect(() => {
    fetchJudges()
  }, [])

  useEffect(() => {
    if (selectedJudgeId && !verdicts[selectedJudgeId]) {
      fetchVerdicts(selectedJudgeId)
    }
  }, [selectedJudgeId])

  const fetchJudges = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/judges')
      if (response.ok) {
        const data = await response.json()
        setJudges(data.judges)
        if (data.judges.length > 0 && !selectedJudgeId) {
          setSelectedJudgeId(data.judges[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch judges:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load judges',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchVerdicts = async (judgeId: string) => {
    try {
      setIsLoadingVerdicts(prev => ({ ...prev, [judgeId]: true }))
      const response = await fetch(`/api/admin/judges/${judgeId}/verdicts`)
      if (response.ok) {
        const data = await response.json()
        setVerdicts(prev => ({ ...prev, [judgeId]: data.verdicts }))
      }
    } catch (error) {
      console.error('Failed to fetch verdicts:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load verdicts',
      })
    } finally {
      setIsLoadingVerdicts(prev => ({ ...prev, [judgeId]: false }))
    }
  }

  const handleSeedDatabase = async () => {
    if (!confirm('This will seed the database with initial data (Categories, Judges, Homepage Sections, Legal Pages). Continue?')) {
      return
    }

    setIsSeeding(true)
    try {
      const response = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Database Seeded',
          description: `Seeded ${data.results.categories} categories, ${data.results.judges} judges, ${data.results.homepageSections} sections, and ${data.results.legalPages} legal pages.`,
        })
        // Refresh judges list
        fetchJudges()
      } else {
        showToast({
          type: 'error',
          title: 'Seed Failed',
          description: data.error || 'Failed to seed database',
        })
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to seed database',
      })
    } finally {
      setIsSeeding(false)
    }
  }

  const handleAddJudge = async () => {
    if (!formData.name || !formData.personality || !formData.description || !formData.systemPrompt) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'All fields are required',
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/judges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Success',
          description: 'Judge created successfully',
        })
        setIsAddModalOpen(false)
        setFormData({
          name: '',
          personality: '',
          description: '',
          systemPrompt: '',
        })
        fetchJudges()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create judge')
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to create judge',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'CHALLENGER_WINS':
        return <Badge variant="default" className="bg-cyber-green text-white">Challenger Wins</Badge>
      case 'OPPONENT_WINS':
        return <Badge variant="default" className="bg-neon-orange text-white">Opponent Wins</Badge>
      case 'TIE':
        return <Badge variant="default" className="bg-text-muted text-white">Tie</Badge>
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const selectedJudge = judges.find(j => j.id === selectedJudgeId)
  const selectedVerdicts = selectedJudgeId ? verdicts[selectedJudgeId] || [] : []
  const isLoadingSelectedVerdicts = selectedJudgeId ? isLoadingVerdicts[selectedJudgeId] : false

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">AI Judges</h1>
          <p className="text-text-secondary mt-2">
            Manage AI judge personalities and view their verdicts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSeedDatabase}
            disabled={isSeeding}
            variant="secondary"
            className="bg-cyber-green text-black hover:bg-cyber-green/90 disabled:opacity-50"
          >
            {isSeeding ? 'Seeding...' : '🌱 Seed Database'}
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            Add Judge
          </Button>
        </div>
      </div>

      {/* Judge Tabs */}
      {judges.length > 0 && (
        <Card>
          <CardBody>
            <div className="border-b border-bg-tertiary">
              <div className="flex gap-1 overflow-x-auto">
                {judges.map((judge) => (
                  <button
                    key={judge.id}
                    onClick={() => setSelectedJudgeId(judge.id)}
                    className={`px-4 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                      selectedJudgeId === judge.id
                        ? 'text-electric-blue border-b-2 border-electric-blue'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <span>{judge.name}</span>
                    {judge._count?.verdicts !== undefined && (
                      <Badge variant="default" size="sm" className="ml-2">
                        {judge._count.verdicts}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Selected Judge Details */}
      {selectedJudge && (
        <div className="space-y-6">
          {/* Judge Info */}
          <Card>
            <CardHeader>
              <div>
                <h2 className="text-2xl font-bold text-text-primary">{selectedJudge.name}</h2>
                <p className="text-text-secondary">{selectedJudge.personality}</p>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-text-secondary mb-2">Description</h3>
                  <p className="text-text-primary">{selectedJudge.description}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-secondary mb-2">System Prompt</h3>
                  <div className="bg-bg-tertiary rounded-lg p-4">
                    <pre className="text-sm text-text-secondary whitespace-pre-wrap font-mono">
                      {selectedJudge.systemPrompt}
                    </pre>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div>
                    <p className="text-sm text-text-secondary">Debates Judged</p>
                    <p className="text-2xl font-bold text-text-primary">
                      {selectedJudge._count?.verdicts || selectedJudge.debatesJudged || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Created</p>
                    <p className="text-text-primary">
                      {new Date(selectedJudge.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Verdicts */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-text-primary">Verdicts</h2>
            </CardHeader>
            <CardBody>
              {isLoadingSelectedVerdicts ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : selectedVerdicts.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  This judge hasn't judged any debates yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedVerdicts.map((verdict) => (
                    <div
                      key={verdict.id}
                      className="bg-bg-tertiary rounded-lg p-4 border border-bg-tertiary hover:border-bg-secondary transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <Link
                            href={`/debate/${verdict.debate.id}`}
                            className="text-lg font-semibold text-text-primary hover:text-electric-blue transition-colors"
                          >
                            {verdict.debate.topic}
                          </Link>
                          <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
                            <Badge variant="default" size="sm">
                              {verdict.debate.category}
                            </Badge>
                            <span>
                              {verdict.debate.challenger.username} vs{' '}
                              {verdict.debate.opponent?.username || 'TBD'}
                            </span>
                            <span>
                              {new Date(verdict.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getDecisionBadge(verdict.decision)}
                          {verdict.challengerScore !== null && verdict.opponentScore !== null && (
                            <div className="text-sm text-text-secondary">
                              {verdict.challengerScore} - {verdict.opponentScore}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-text-secondary mb-1">Reasoning:</p>
                        <p className="text-text-primary text-sm leading-relaxed">{verdict.reasoning}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Add Judge Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Judge"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., The Philosopher"
            required
          />
          <Input
            label="Personality"
            value={formData.personality}
            onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
            placeholder="e.g., Wisdom-focused"
            required
          />
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the judge's personality and judging style..."
              className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent resize-none"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              System Prompt
            </label>
            <textarea
              value={formData.systemPrompt}
              onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
              placeholder="Enter the system prompt that defines how this judge evaluates debates..."
              className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-electric-blue focus:border-transparent resize-none font-mono text-sm"
              rows={8}
              required
            />
            <p className="text-xs text-text-muted mt-1">
              This prompt defines the judge's personality, values, and judging criteria. Be specific about what the judge should prioritize.
            </p>
          </div>
          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddJudge}
              isLoading={isSaving}
            >
              Create Judge
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  )
}

