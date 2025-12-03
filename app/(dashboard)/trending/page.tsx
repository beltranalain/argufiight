'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { Badge } from '@/components/ui/Badge'
import { DebateCard } from '@/components/debate/DebateCard'
import { LoadingCard } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { CreateDebateModal } from '@/components/debate/CreateDebateModal'

interface Topic {
  id: string
  title: string
  category: string
  debateCount: number
}

interface Debate {
  id: string
  topic: string
  category: string
  status: string
  challenger: {
    id: string
    username: string
    avatarUrl: string | null
    eloRating: number
  }
  opponent: {
    id: string
    username: string
    avatarUrl: string | null
    eloRating: number
  } | null
  challengerPosition?: string
  opponentPosition?: string
  currentRound?: number
  totalRounds?: number
  roundDeadline?: Date | string | null
  spectatorCount?: number
  images?: Array<{
    id: string
    url: string
    alt: string | null
    caption: string | null
    order: number
  }>
  createdAt: string
}

const ALL_TOPICS: Topic[] = [
  { id: '1', title: 'Is AI Art Real Art?', category: 'TECH', debateCount: 0 },
  { id: '2', title: 'Mahomes vs Brady: Who\'s Better?', category: 'SPORTS', debateCount: 0 },
  { id: '3', title: 'Should UBI Exist?', category: 'POLITICS', debateCount: 0 },
  { id: '4', title: 'Streaming vs Theaters', category: 'ENTERTAINMENT', debateCount: 0 },
  { id: '5', title: 'Is Nuclear Energy Safe?', category: 'SCIENCE', debateCount: 0 },
  { id: '6', title: 'Remote Work vs Office', category: 'TECH', debateCount: 0 },
  { id: '7', title: 'Electric Cars vs Gas', category: 'SCIENCE', debateCount: 0 },
  { id: '8', title: 'Social Media Impact', category: 'TECH', debateCount: 0 },
  { id: '9', title: 'Climate Change Solutions', category: 'SCIENCE', debateCount: 0 },
  { id: '10', title: 'Cryptocurrency Future', category: 'TECH', debateCount: 0 },
]

const CATEGORIES = ['ALL', 'SPORTS', 'TECH', 'POLITICS', 'ENTERTAINMENT', 'SCIENCE'] as const

export default function TrendingTopicsPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [debates, setDebates] = useState<Record<string, Debate[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [initialDebateData, setInitialDebateData] = useState<{ topic?: string; category?: string } | null>(null)

  useEffect(() => {
    fetchAllDebates()
  }, [selectedCategory])

  // Listen for custom event to open create debate modal
  // Only listen if this component is mounted (not during page refresh)
  useEffect(() => {
    let isMounted = true
    
    const handleOpenModal = (event: any) => {
      // Only handle if component is mounted and page is visible
      if (isMounted && document.visibilityState === 'visible') {
        const data = event.detail || {}
        setInitialDebateData(data)
        setIsCreateModalOpen(true)
      }
    }
    
    // Small delay to avoid catching events from page refresh
    const timeoutId = setTimeout(() => {
      window.addEventListener('open-create-debate-modal', handleOpenModal as EventListener)
    }, 100)
    
    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      window.removeEventListener('open-create-debate-modal', handleOpenModal as EventListener)
    }
  }, [])

  const fetchAllDebates = async () => {
    try {
      setIsLoading(true)
      
      // Fetch debates for each topic/category
      const categoryFilter = selectedCategory !== 'ALL' ? selectedCategory : null
      const statusFilter = 'ACTIVE,COMPLETED,VERDICT_READY'
      
      const params = new URLSearchParams()
      if (categoryFilter) {
        params.append('category', categoryFilter)
      }
      params.append('status', statusFilter)
      
      const response = await fetch(`/api/debates?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch debates: ${response.statusText}`)
      }
      
      const allDebates: Debate[] = await response.json()
      
      // Group debates by topic - match debates to topics based on topic title similarity
      // and category match
      const debatesByTopic: Record<string, Debate[]> = {}
      
      ALL_TOPICS.forEach((topic) => {
        debatesByTopic[topic.id] = []
      })
      
      allDebates.forEach((debate) => {
        // Find matching topics for this debate
        // Match by category first, then check if topic title is similar to debate topic
        ALL_TOPICS.forEach((topic) => {
          if (topic.category === debate.category) {
            // Check if debate topic contains keywords from topic title or vice versa
            const topicKeywords = topic.title.toLowerCase().split(/\s+/)
            const debateTopicLower = debate.topic.toLowerCase()
            
            // Check if any significant keywords match (words longer than 3 chars)
            const hasMatch = topicKeywords.some(keyword => 
              keyword.length > 3 && debateTopicLower.includes(keyword)
            ) || debateTopicLower.includes(topic.title.toLowerCase().substring(0, 10))
            
            if (hasMatch) {
              if (!debatesByTopic[topic.id]) {
                debatesByTopic[topic.id] = []
              }
              debatesByTopic[topic.id].push(debate)
            }
          }
        })
      })
      
      // If no matches found, fall back to category grouping for that topic
      ALL_TOPICS.forEach((topic) => {
        if (!debatesByTopic[topic.id] || debatesByTopic[topic.id].length === 0) {
          // Fallback: show debates from same category
          const categoryDebates = allDebates.filter(d => d.category === topic.category)
          debatesByTopic[topic.id] = categoryDebates.slice(0, 5) // Limit to 5 to avoid too many duplicates
        }
      })
      
      // Sort debates by recency and activity (most recent first)
      Object.keys(debatesByTopic).forEach((key) => {
        debatesByTopic[key].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        // Remove duplicates based on debate ID
        const seen = new Set<string>()
        debatesByTopic[key] = debatesByTopic[key].filter(debate => {
          if (seen.has(debate.id)) {
            return false
          }
          seen.add(debate.id)
          return true
        })
      })
      
      setDebates(debatesByTopic)
      
      // Update topic counts
      ALL_TOPICS.forEach((topic) => {
        const topicDebates = debatesByTopic[topic.id] || []
        topic.debateCount = topicDebates.length
      })
    } catch (error) {
      console.error('Failed to fetch debates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTopics = selectedCategory === 'ALL' 
    ? ALL_TOPICS 
    : ALL_TOPICS.filter(t => t.category === selectedCategory)

  const handleTopicClick = (topic: Topic) => {
    setInitialDebateData({ topic: topic.title, category: topic.category })
    setIsCreateModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="THE ARENA" />
      <div className="pt-20 md:pt-24 p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-text-primary mb-2">Trending Topics</h1>
              <p className="text-text-secondary">Explore the hottest debates across all categories</p>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              Create Debate
            </Button>
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                  selectedCategory === category
                    ? 'border-electric-blue bg-electric-blue/10 text-electric-blue'
                    : 'border-bg-tertiary text-text-secondary hover:border-text-secondary'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Topics List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <LoadingCard key={i} lines={4} />
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            {filteredTopics.map((topic) => {
              const topicDebates = debates[topic.id] || []
              const hotDebates = topicDebates.slice(0, 5) // Top 5 hottest debates

              return (
                <div key={topic.id} className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary">
                  {/* Topic Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge 
                          variant={topic.category.toLowerCase() as any}
                          size="sm"
                        >
                          {topic.category}
                        </Badge>
                        <span className="text-text-secondary text-sm">
                          {topic.debateCount} {topic.debateCount === 1 ? 'debate' : 'debates'}
                        </span>
                      </div>
                      <h2 className="text-2xl font-bold text-text-primary mb-2">{topic.title}</h2>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleTopicClick(topic)}
                    >
                      Start Debate
                    </Button>
                  </div>

                  {/* Hottest Debates */}
                  {hotDebates.length > 0 ? (
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary mb-4">
                        Hottest Debates
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {hotDebates.map((debate) => (
                          <DebateCard 
                            key={debate.id} 
                            debate={{
                              ...debate,
                              challengerPosition: debate.challengerPosition || 'FOR',
                              opponentPosition: debate.opponentPosition || 'AGAINST',
                              currentRound: debate.currentRound || 1,
                              totalRounds: debate.totalRounds || 5,
                              roundDeadline: debate.roundDeadline || null,
                              spectatorCount: debate.spectatorCount || 0,
                            }} 
                          />
                        ))}
                      </div>
                      {topicDebates.length > 5 && (
                        <div className="mt-4 text-center">
                          <Button
                            variant="ghost"
                            onClick={() => router.push(`/debates/history?category=${topic.category}`)}
                          >
                            View All {topicDebates.length} Debates →
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <EmptyState
                      title="No Debates Yet"
                      description={`Be the first to start a debate on "${topic.title}"`}
                      action={{
                        label: 'Start Debate',
                        onClick: () => handleTopicClick(topic),
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
        </div>
      </div>

      {/* Create Debate Modal */}
      <CreateDebateModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setInitialDebateData(null)
        }}
        onSuccess={() => {
          fetchAllDebates()
          setInitialDebateData(null)
        }}
        initialTopic={initialDebateData?.topic}
        initialCategory={initialDebateData?.category as any}
      />
    </div>
  )
}

