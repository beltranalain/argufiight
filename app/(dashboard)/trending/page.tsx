'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { TopNav } from '@/components/layout/TopNav'
import { Badge } from '@/components/ui/Badge'
import { DebateCard } from '@/components/debate/DebateCard'
import { LoadingCard } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { CreateDebateModal } from '@/components/debate/CreateDebateModal'
import { AdDisplay } from '@/components/ads/AdDisplay'
import { fetchClient } from '@/lib/api/fetchClient'
import { useDebates } from '@/lib/hooks/queries/useDebates'

interface Topic {
  id: string
  title: string
  category: string
  debateCount: number
}

const ALL_TOPICS: Topic[] = [
  { id: '1', title: 'Is AI Art Real Art?', category: 'TECH', debateCount: 0 },
  { id: '2', title: "Mahomes vs Brady: Who's Better?", category: 'SPORTS', debateCount: 0 },
  { id: '3', title: 'Should UBI Exist?', category: 'POLITICS', debateCount: 0 },
  { id: '4', title: 'Streaming vs Theaters', category: 'ENTERTAINMENT', debateCount: 0 },
  { id: '5', title: 'Is Nuclear Energy Safe?', category: 'SCIENCE', debateCount: 0 },
  { id: '6', title: 'Remote Work vs Office', category: 'TECH', debateCount: 0 },
  { id: '7', title: 'Electric Cars vs Gas', category: 'SCIENCE', debateCount: 0 },
  { id: '8', title: 'Social Media Impact', category: 'TECH', debateCount: 0 },
  { id: '9', title: 'Climate Change Solutions', category: 'SCIENCE', debateCount: 0 },
  { id: '10', title: 'Cryptocurrency Future', category: 'TECH', debateCount: 0 },
]

export default function TrendingTopicsPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [initialDebateData, setInitialDebateData] = useState<{ topic?: string; category?: string } | null>(null)

  const { data: categoriesData } = useQuery<string[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const data = await fetchClient<{ categories: Array<{ name: string }> }>('/api/categories')
      return ['ALL', ...(data.categories || []).map(c => c.name)]
    },
    staleTime: 300_000,
    placeholderData: ['ALL', 'SPORTS', 'TECH', 'POLITICS', 'ENTERTAINMENT', 'SCIENCE', 'OTHER'],
  })

  const categories = categoriesData || ['ALL']

  const { data: debatesData, isLoading, refetch } = useDebates({
    category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
    status: 'ACTIVE,COMPLETED,VERDICT_READY',
  })

  const allDebates = debatesData?.debates || []

  // Group debates by topic category
  const getDebatesForTopic = (topic: Topic) => {
    return allDebates
      .filter(d => d.category === topic.category)
      .slice(0, 5)
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
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-text-primary mb-2">Trending Topics</h1>
                <p className="text-text-secondary">Explore the hottest debates across all categories</p>
              </div>
              <Button onClick={() => setIsCreateModalOpen(true)}>Create Debate</Button>
            </div>

            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
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

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => <LoadingCard key={i} lines={4} />)}
            </div>
          ) : (
            <div className="space-y-12">
              {filteredTopics.map((topic, topicIndex) => {
                const topicDebates = getDebatesForTopic(topic)

                return (
                  <div key={topic.id}>
                    {topicIndex > 0 && topicIndex % 3 === 0 && (
                      <div className="mb-6">
                        <AdDisplay placement="IN_FEED" context="trending-page" />
                      </div>
                    )}

                    <div className="bg-bg-secondary rounded-xl p-6 border border-bg-tertiary">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant={topic.category.toLowerCase() as any} size="sm">{topic.category}</Badge>
                            <span className="text-text-secondary text-sm">
                              {topicDebates.length} {topicDebates.length === 1 ? 'debate' : 'debates'}
                            </span>
                          </div>
                          <h2 className="text-2xl font-bold text-text-primary mb-2">{topic.title}</h2>
                        </div>
                        <Button variant="primary" size="sm" onClick={() => handleTopicClick(topic)}>Start Debate</Button>
                      </div>

                      {topicDebates.length > 0 ? (
                        <div>
                          <h3 className="text-lg font-semibold text-text-primary mb-4">Hottest Debates</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {topicDebates.map((debate) => (
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
                        </div>
                      ) : (
                        <EmptyState
                          title="No Debates Yet"
                          description={`Be the first to start a debate on "${topic.title}"`}
                          action={{ label: 'Start Debate', onClick: () => handleTopicClick(topic) }}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <CreateDebateModal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); setInitialDebateData(null) }}
        onSuccess={() => { refetch(); setInitialDebateData(null) }}
        initialTopic={initialDebateData?.topic}
        initialCategory={initialDebateData?.category as any}
      />
    </div>
  )
}
