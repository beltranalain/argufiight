'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ONBOARDING_TOPICS, type OnboardingTopic } from '@/lib/onboarding/topics'

interface CategoryData {
  id: string
  name: string
  label: string
  description?: string
  color?: string
  icon?: string
}

const FALLBACK_CATEGORIES: CategoryData[] = [
  { id: '1', name: 'SPORTS', label: 'Sports', icon: '🏆', color: '#FF6B35' },
  { id: '2', name: 'POLITICS', label: 'Politics', icon: '🏛️', color: '#4ECDC4' },
  { id: '3', name: 'TECH', label: 'Tech', icon: '💻', color: '#00D4FF' },
  { id: '4', name: 'ENTERTAINMENT', label: 'Entertainment', icon: '🎬', color: '#FF6ECB' },
  { id: '5', name: 'SCIENCE', label: 'Science', icon: '🔬', color: '#7B68EE' },
  { id: '6', name: 'MUSIC', label: 'Music', icon: '🎵', color: '#FFD700' },
  { id: '7', name: 'OTHER', label: 'Other', icon: '💡', color: '#FF4444' },
]

type Step = 'category' | 'topic' | 'side' | 'creating'

export function OnboardingFlow() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('category')
  const [categories, setCategories] = useState<CategoryData[]>(FALLBACK_CATEGORIES)
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<OnboardingTopic | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<'FOR' | 'AGAINST' | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  const [isSkipping, setIsSkipping] = useState(false)

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => {
        if (data.categories?.length > 0) {
          // Merge DB categories with fallback icons/colors
          const merged = data.categories.map((cat: CategoryData) => {
            const fallback = FALLBACK_CATEGORIES.find(f => f.name === cat.name)
            return {
              ...cat,
              icon: cat.icon || fallback?.icon || '💬',
              color: cat.color || fallback?.color || '#00D4FF',
            }
          })
          // Ensure all 7 categories are present
          for (const fb of FALLBACK_CATEGORIES) {
            if (!merged.find((m: CategoryData) => m.name === fb.name)) {
              merged.push(fb)
            }
          }
          setCategories(merged)
        }
      })
      .catch(() => {})
  }, [])

  const handleCategorySelect = (cat: CategoryData) => {
    setSelectedCategory(cat)
    setSelectedTopic(null)
    setSelectedPosition(null)
    setStep('topic')
  }

  const handleTopicSelect = (topic: OnboardingTopic) => {
    setSelectedTopic(topic)
    setSelectedPosition(null)
    setStep('side')
  }

  const handleSideSelect = async (position: 'FOR' | 'AGAINST') => {
    setSelectedPosition(position)
    setStep('creating')
    setIsCreating(true)
    setError('')

    try {
      const res = await fetch('/api/onboarding/create-debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory!.name,
          topic: selectedTopic!.topic,
          position,
        }),
      })

      const data = await res.json()

      if (data.skipped) {
        // No AI available — redirect to dashboard
        window.location.href = '/'
        return
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create debate')
      }

      // Redirect to the debate page
      router.push(`/debate/${data.debateId}`)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setIsCreating(false)
      setStep('side')
    }
  }

  const handleSkip = async () => {
    setIsSkipping(true)
    try {
      await fetch('/api/onboarding/complete', { method: 'POST' })
      window.location.href = '/'
    } catch {
      window.location.href = '/'
    }
  }

  const handleBack = () => {
    if (step === 'topic') {
      setStep('category')
      setSelectedCategory(null)
    } else if (step === 'side') {
      setStep('topic')
      setSelectedTopic(null)
    }
  }

  const topics = selectedCategory ? ONBOARDING_TOPICS[selectedCategory.name] || [] : []

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          {step !== 'category' && step !== 'creating' && (
            <button
              onClick={handleBack}
              className="text-text-secondary hover:text-white transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <StepIndicator current={step} />
        </div>
        {step !== 'creating' && (
          <button
            onClick={handleSkip}
            disabled={isSkipping}
            className="text-text-secondary hover:text-white text-sm transition-colors disabled:opacity-50"
          >
            {isSkipping ? 'Skipping...' : 'Skip'}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
        {step === 'category' && (
          <div className="w-full max-w-2xl animate-fadeIn">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Welcome to Argufight!
              </h1>
              <p className="text-text-secondary text-lg">
                Pick a category and jump into your first debate with an AI opponent.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => handleCategorySelect(cat)}
                  className="group relative bg-bg-secondary border border-bg-tertiary rounded-xl p-5 text-center transition-all duration-200 hover:border-electric-blue hover:shadow-[0_0_20px_rgba(0,212,255,0.15)]"
                >
                  <div className="text-3xl mb-2">{cat.icon}</div>
                  <div className="text-white font-semibold text-sm">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'topic' && selectedCategory && (
          <div className="w-full max-w-xl animate-fadeIn">
            <div className="text-center mb-8">
              <div className="text-3xl mb-2">{selectedCategory.icon}</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {selectedCategory.label}
              </h2>
              <p className="text-text-secondary">
                Pick a topic to debate
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {topics.map((topic, i) => (
                <button
                  key={i}
                  onClick={() => handleTopicSelect(topic)}
                  className="group bg-bg-secondary border border-bg-tertiary rounded-xl p-5 text-left transition-all duration-200 hover:border-electric-blue hover:shadow-[0_0_20px_rgba(0,212,255,0.15)]"
                >
                  <div className="text-white font-medium">{topic.topic}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'side' && selectedTopic && (
          <div className="w-full max-w-md animate-fadeIn">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-3">
                Pick your side
              </h2>
              <p className="text-text-secondary text-sm px-4">
                &ldquo;{selectedTopic.topic}&rdquo;
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => handleSideSelect('FOR')}
                className="bg-bg-secondary border-2 border-cyber-green/30 rounded-xl p-6 text-center transition-all duration-200 hover:border-cyber-green hover:shadow-[0_0_25px_rgba(0,255,136,0.15)]"
              >
                <div className="text-cyber-green font-bold text-lg mb-1">FOR</div>
                <div className="text-text-secondary text-sm">{selectedTopic.forLabel}</div>
              </button>
              <div className="text-center text-text-secondary text-sm font-medium">VS</div>
              <button
                onClick={() => handleSideSelect('AGAINST')}
                className="bg-bg-secondary border-2 border-neon-orange/30 rounded-xl p-6 text-center transition-all duration-200 hover:border-neon-orange hover:shadow-[0_0_25px_rgba(255,110,0,0.15)]"
              >
                <div className="text-neon-orange font-bold text-lg mb-1">AGAINST</div>
                <div className="text-text-secondary text-sm">{selectedTopic.againstLabel}</div>
              </button>
            </div>
            {error && (
              <div className="mt-4 text-red-400 text-sm text-center">{error}</div>
            )}
          </div>
        )}

        {step === 'creating' && (
          <div className="w-full max-w-md animate-fadeIn text-center">
            <div className="mb-6">
              <div className="w-12 h-12 border-2 border-electric-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                Setting up your debate...
              </h2>
              <p className="text-text-secondary">
                Finding you an AI opponent
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StepIndicator({ current }: { current: Step }) {
  const steps: Step[] = ['category', 'topic', 'side']
  const currentIdx = steps.indexOf(current)

  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full transition-colors ${
              i <= currentIdx ? 'bg-electric-blue' : 'bg-bg-tertiary'
            }`}
          />
          {i < steps.length - 1 && (
            <div
              className={`w-6 h-px transition-colors ${
                i < currentIdx ? 'bg-electric-blue' : 'bg-bg-tertiary'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}
