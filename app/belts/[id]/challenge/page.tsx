'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/Loading'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'

export default function ChallengeBeltPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()
  const beltId = params.id as string
  
  const [belt, setBelt] = useState<any>(null)
  const [topic, setTopic] = useState('')
  const [category, setCategory] = useState('GENERAL')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (beltId && user) {
      fetchBelt()
    }
  }, [beltId, user])

  const fetchBelt = async () => {
    try {
      const response = await fetch(`/api/belts/${beltId}`)
      if (response.ok) {
        const data = await response.json()
        setBelt(data.belt)
      } else {
        showToast({
          type: 'error',
          title: 'Error',
          description: 'Failed to load belt information',
        })
        router.push('/belts/room')
      }
    } catch (error) {
      console.error('Failed to fetch belt:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to load belt information',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!topic.trim()) {
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Please enter a debate topic',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/belts/challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          beltId,
          topic: topic.trim(),
          category,
          challengerPosition: 'FOR',
          totalRounds: 5,
          roundDuration: 86400000,
          speedMode: false,
          allowCopyPaste: true,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Challenge Created',
          description: 'Your challenge has been sent!',
        })
        router.push('/belts/room')
      } else {
        showToast({
          type: 'error',
          title: 'Error',
          description: data.error || 'Failed to create challenge',
        })
      }
    } catch (error) {
      console.error('Failed to create challenge:', error)
      showToast({
        type: 'error',
        title: 'Error',
        description: 'Failed to create challenge',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="BELT CHALLENGE" />
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (!belt) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <TopNav currentPanel="BELT CHALLENGE" />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardBody>
              <p className="text-text-secondary">Belt not found</p>
              <Button onClick={() => router.push('/belts/room')} className="mt-4">
                Back to Belt Room
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="BELT CHALLENGE" />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold text-white">
              Challenge for {belt.name}
            </h1>
            {belt.currentHolder && (
              <p className="text-text-secondary">
                Current Holder: {belt.currentHolder.username}
              </p>
            )}
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  label="Debate Topic (Required)"
                  placeholder="Enter the topic you want to debate for this belt..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-electric-blue"
                >
                  <option value="GENERAL">General</option>
                  <option value="TECH">Tech</option>
                  <option value="SCIENCE">Science</option>
                  <option value="SPORTS">Sports</option>
                  <option value="ENTERTAINMENT">Entertainment</option>
                  <option value="POLITICS">Politics</option>
                  <option value="PHILOSOPHY">Philosophy</option>
                </select>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push('/belts/room')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  disabled={!topic.trim() || isSubmitting}
                >
                  Create Challenge
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
