'use client'

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

const MOCK_TOPICS: Topic[] = [
  {
    id: '1',
    title: 'Is AI Art Real Art?',
    category: 'TECH',
    icon: '',
    debateCount: 234,
  },
  {
    id: '2',
    title: 'Mahomes vs Brady: Who\'s Better?',
    category: 'SPORTS',
    icon: '',
    debateCount: 456,
  },
  {
    id: '3',
    title: 'Should UBI Exist?',
    category: 'POLITICS',
    icon: '',
    debateCount: 189,
  },
  {
    id: '4',
    title: 'Streaming vs Theaters',
    category: 'ENTERTAINMENT',
    icon: '',
    debateCount: 312,
  },
  {
    id: '5',
    title: 'Is Nuclear Energy Safe?',
    category: 'SCIENCE',
    icon: '',
    debateCount: 167,
  },
]

interface TrendingTopicsProps {
  onTopicClick?: (topic: Topic) => void
}

export function TrendingTopics({ onTopicClick }: TrendingTopicsProps) {
  const router = useRouter()
  const { showToast } = useToast()

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

      {/* Horizontal Scroll */}
      <div className="flex gap-6 overflow-x-auto overflow-y-visible pt-2 pb-4 scrollbar-thin scrollbar-thumb-electric-blue scrollbar-track-bg-secondary mt-6">
        {MOCK_TOPICS.map((topic, index) => (
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
    </div>
  )
}

