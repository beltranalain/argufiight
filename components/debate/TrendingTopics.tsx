'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cardHover, cardTap } from '@/lib/animations'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'

interface Topic {
  id: string
  title: string
  category: string
  icon: string
  debateCount: number
}

interface TrendingTopicsProps {
  onTopicClick?: (topic: Topic) => void
}

export function TrendingTopics({ onTopicClick }: TrendingTopicsProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [topics, setTopics] = useState<Topic[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const handleViewAll = () => {
    router.push('/trending')
  }

  const handleStartDebate = (topic: Topic, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    // Dispatch event with topic data to pre-fill the create debate modal
    window.dispatchEvent(new CustomEvent('open-create-debate-modal', {
      detail: { topic: topic.title, category: topic.category }
    }))
  }

  const handleCardClick = (topic: Topic) => {
    if (onTopicClick) {
      onTopicClick(topic)
    } else {
      // Default: open create debate modal with topic
      window.dispatchEvent(new CustomEvent('open-create-debate-modal', {
        detail: { topic: topic.title, category: topic.category }
      }))
    }
  }

  // Fetch trending topics from API
  useEffect(() => {
    async function fetchTrendingTopics() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/trending-topics')
        if (!response.ok) {
          throw new Error('Failed to fetch trending topics')
        }
        const data = await response.json()
        setTopics(data)
      } catch (error) {
        console.error('Error fetching trending topics:', error)
        showToast('Failed to load trending topics', 'error')
        // Fallback to empty array if API fails
        setTopics([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrendingTopics()
  }, [showToast])

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-3xl font-bold text-text-primary">Trending Topics</h3>
        <button 
          onClick={handleViewAll}
          className="text-electric-blue hover:text-neon-orange text-sm font-medium transition-colors"
        >
          View All →
        </button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex gap-6 overflow-x-auto pt-2 pb-4 mt-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="min-w-[320px] max-w-[320px] h-[200px] bg-bg-secondary border border-bg-tertiary rounded-xl p-6 animate-pulse"
            >
              <div className="h-6 bg-bg-tertiary rounded w-20 mb-3"></div>
              <div className="h-6 bg-bg-tertiary rounded w-full mb-2"></div>
              <div className="h-6 bg-bg-tertiary rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-bg-tertiary rounded w-24 mt-auto"></div>
            </div>
          ))}
        </div>
      ) : topics.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          <p>No trending topics yet. Be the first to start a debate!</p>
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto overflow-y-visible pt-2 pb-4 scrollbar-thin scrollbar-thumb-electric-blue scrollbar-track-bg-secondary mt-6">
          {topics.map((topic, index) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileHover={cardHover}
              whileTap={cardTap}
              onClick={() => handleCardClick(topic)}
              className="min-w-[320px] max-w-[320px] h-[200px] bg-bg-secondary border border-bg-tertiary rounded-xl p-6 hover:border-electric-blue hover:shadow-[0_8px_24px_rgba(0,217,255,0.1)] transition-all text-left flex flex-col flex-shrink-0 shadow-sm cursor-pointer"
            >
              <Badge 
                variant={topic.category.toLowerCase() as any}
                size="sm"
                className="mb-3 self-start"
              >
                {topic.category}
              </Badge>
              
              <h4 className="text-lg font-bold text-text-primary mb-4 flex-grow line-clamp-2">
                {topic.title}
              </h4>
              
              <div className="flex items-center justify-between text-sm mt-auto pt-2">
                <span className="text-text-secondary">
                  {topic.debateCount} debates
                </span>
                <button
                  onClick={(e) => handleStartDebate(topic, e)}
                  className="text-electric-blue font-semibold whitespace-nowrap hover:text-neon-orange transition-colors"
                >
                  Start Debate →
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
  )
}

