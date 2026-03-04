'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ONBOARDING_TOPICS, type OnboardingTopic } from '@/lib/onboarding/topics'
import { ArrowLeft, Swords } from 'lucide-react'

interface CategoryData {
  id: string
  name: string
  label: string
  description?: string
  color?: string
  icon?: string
}

const FALLBACK_CATEGORIES: CategoryData[] = [
  { id: '1', name: 'SPORTS', label: 'Sports' },
  { id: '2', name: 'POLITICS', label: 'Politics' },
  { id: '3', name: 'TECH', label: 'Tech' },
  { id: '4', name: 'ENTERTAINMENT', label: 'Entertainment' },
  { id: '5', name: 'SCIENCE', label: 'Science' },
  { id: '6', name: 'MUSIC', label: 'Music' },
  { id: '7', name: 'OTHER', label: 'Other' },
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
  const [customTopic, setCustomTopic] = useState('')

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => {
        if (data.categories?.length > 0) {
          const merged = data.categories.map((cat: CategoryData) => {
            const fallback = FALLBACK_CATEGORIES.find(f => f.name === cat.name)
            return { ...cat, label: cat.label || fallback?.label || cat.name }
          })
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

  const handleCustomTopicSubmit = () => {
    if (!customTopic.trim()) return
    const topic: OnboardingTopic = {
      topic: customTopic.trim(),
      forLabel: 'For',
      againstLabel: 'Against',
    }
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
        window.location.href = '/dashboard'
        return
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create debate')
      }

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
      window.location.href = '/dashboard'
    } catch {
      window.location.href = '/dashboard'
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
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          {step !== 'category' && step !== 'creating' && (
            <button
              onClick={handleBack}
              className="text-text-3 hover:text-text transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-accent flex items-center justify-center">
              <Swords size={14} className="text-accent-fg" />
            </div>
            <span className="text-sm font-[300] tracking-[2px] uppercase text-text-2">
              Argu<strong className="font-[600] text-accent">Fight</strong>
            </span>
          </div>
          <StepIndicator current={step} />
        </div>
        {step !== 'creating' && (
          <button
            onClick={handleSkip}
            disabled={isSkipping}
            className="text-text-3 hover:text-text text-sm transition-colors disabled:opacity-50"
          >
            {isSkipping ? 'Skipping...' : 'Skip'}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
        {step === 'category' && (
          <div className="w-full max-w-2xl animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-[200] text-text mb-3 tracking-tight">
                Welcome to <span className="text-accent font-[500]">ArguFight</span>
              </h1>
              <p className="text-text-2 text-base">
                Pick a category and jump into your first debate with an AI opponent.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => handleCategorySelect(cat)}
                  className="group bg-surface border border-border rounded-[var(--radius)] p-5 text-center transition-all duration-200 hover:border-accent hover:shadow-[0_0_20px_rgba(212,240,80,0.08)]"
                >
                  <div className="text-text font-[500] text-[15px]">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'topic' && selectedCategory && (
          <div className="w-full max-w-xl animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="heading-1 text-text mb-2">
                {selectedCategory.label}
              </h2>
              <p className="text-text-2 text-sm">
                Pick a topic or submit your own
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {topics.map((topic, i) => (
                <button
                  key={i}
                  onClick={() => handleTopicSelect(topic)}
                  className="group bg-surface border border-border rounded-[var(--radius)] p-5 text-left transition-all duration-200 hover:border-accent hover:shadow-[0_0_20px_rgba(212,240,80,0.08)]"
                >
                  <div className="text-text font-[400] text-[15px]">{topic.topic}</div>
                </button>
              ))}

              <div className="relative mt-2">
                <div className="text-center text-text-3 text-xs mb-2">or write your own</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomTopicSubmit()}
                    placeholder="Type your own debate topic..."
                    maxLength={200}
                    className="flex-1 bg-surface border border-border rounded-[var(--radius)] px-4 py-3 text-text placeholder-text-3 text-sm focus:outline-none focus:border-accent transition-colors"
                  />
                  <button
                    onClick={handleCustomTopicSubmit}
                    disabled={!customTopic.trim()}
                    className="px-5 py-3 bg-accent/10 border border-accent/30 rounded-[var(--radius)] text-accent font-[500] text-sm transition-all hover:bg-accent/20 hover:border-accent disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Go
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'side' && selectedTopic && (
          <div className="w-full max-w-md animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="heading-1 text-text mb-3">
                Pick your side
              </h2>
              <p className="text-text-2 text-sm px-4">
                &ldquo;{selectedTopic.topic}&rdquo;
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => handleSideSelect('FOR')}
                className="bg-surface border-2 border-green/30 rounded-[var(--radius-lg)] p-6 text-center transition-all duration-200 hover:border-green hover:shadow-[0_0_25px_rgba(77,255,145,0.1)]"
              >
                <div className="text-green font-[600] text-lg mb-1">FOR</div>
                <div className="text-text-2 text-sm">{selectedTopic.forLabel}</div>
              </button>
              <div className="text-center text-text-3 text-sm font-[500]">VS</div>
              <button
                onClick={() => handleSideSelect('AGAINST')}
                className="bg-surface border-2 border-red/30 rounded-[var(--radius-lg)] p-6 text-center transition-all duration-200 hover:border-red hover:shadow-[0_0_25px_rgba(255,77,77,0.1)]"
              >
                <div className="text-red font-[600] text-lg mb-1">AGAINST</div>
                <div className="text-text-2 text-sm">{selectedTopic.againstLabel}</div>
              </button>
            </div>
            {error && (
              <div className="mt-4 text-red text-sm text-center">{error}</div>
            )}
          </div>
        )}

        {step === 'creating' && (
          <div className="w-full max-w-md animate-fade-in text-center">
            <div className="mb-6">
              <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h2 className="heading-1 text-text mb-2">
                Setting up your debate...
              </h2>
              <p className="text-text-2">
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
    <div className="flex items-center gap-2 ml-3">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full transition-colors ${
              i <= currentIdx ? 'bg-accent' : 'bg-border'
            }`}
          />
          {i < steps.length - 1 && (
            <div
              className={`w-6 h-px transition-colors ${
                i < currentIdx ? 'bg-accent' : 'bg-border'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}
