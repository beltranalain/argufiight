'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { cardHover, cardTap } from '@/lib/animations'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'

interface DebateCardProps {
  debate: {
    id: string
    topic: string
    category: string
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
    challengerPosition: string
    opponentPosition: string
    currentRound: number
    totalRounds: number
    status: string
    roundDeadline: Date | string | null
    spectatorCount: number
    tournamentMatch?: {
      id: string
      tournament: {
        id: string
        name: string
        currentRound: number
        totalRounds: number
      }
      round: {
        roundNumber: number
      }
    } | null
    images?: Array<{
      id: string
      url: string
      alt: string | null
      caption: string | null
      order: number
    }>
  }
}

export function DebateCard({ debate }: DebateCardProps) {
  const progress = (debate.currentRound / debate.totalRounds) * 100
  const timeLeft = calculateTimeLeft(debate.roundDeadline)

  return (
    <motion.div
      whileHover={cardHover}
      whileTap={cardTap}
    >
      <Link
        href={`/debate/${debate.id}`}
        className="block bg-bg-secondary border border-bg-tertiary rounded-2xl p-6 hover:border-electric-blue hover:shadow-[0_8px_32px_rgba(0,217,255,0.15)] transition-all"
      >
      {/* Category and Tournament Badges */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Badge 
          variant={debate.category.toLowerCase() as any}
          size="md"
        >
          {debate.category}
        </Badge>
        {debate.tournamentMatch && (
          <Badge 
            variant="default"
            size="md"
            className="bg-purple-600 text-white border-purple-500"
          >
            🏆 Tournament: Round {debate.tournamentMatch.round.roundNumber}/{debate.tournamentMatch.tournament.totalRounds}
          </Badge>
        )}
      </div>

      {/* Topic */}
      <h4 className="text-xl font-bold text-white mb-5 group-hover:text-electric-blue transition-colors">
        {debate.topic}
      </h4>

      {/* Images */}
      {debate.images && debate.images.length > 0 && (
        <div className="mb-5">
          <div className={`grid gap-2 ${
            debate.images.length === 1 ? 'grid-cols-1' :
            debate.images.length === 2 ? 'grid-cols-2' :
            debate.images.length === 3 ? 'grid-cols-3' :
            debate.images.length === 4 ? 'grid-cols-2' :
            'grid-cols-2'
          }`}>
            {debate.images.slice(0, 4).map((image) => (
              <div key={image.id} className="relative aspect-square rounded-lg overflow-hidden border border-bg-tertiary bg-bg-tertiary">
                <img
                  src={image.url}
                  alt={image.alt || debate.topic}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debaters */}
      <div className="flex items-center justify-between mb-5">
        {/* Challenger */}
        <div className="flex items-center gap-3">
          <Avatar 
            src={debate.challenger.avatarUrl}
            username={debate.challenger.username}
            size="md"
          />
          <div>
            <p className="font-semibold text-white text-sm">
              {debate.challenger.username}
            </p>
            <p className="text-xs text-text-muted uppercase">
              {debate.challengerPosition}
            </p>
          </div>
        </div>

        {/* VS */}
        <span className="text-xl font-bold text-text-muted">VS</span>

        {/* Opponent */}
        {debate.opponent ? (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-semibold text-white text-sm">
                {debate.opponent.username}
              </p>
              <p className="text-xs text-text-muted uppercase">
                {debate.opponentPosition}
              </p>
            </div>
            <Avatar 
              src={debate.opponent.avatarUrl}
              username={debate.opponent.username}
              size="md"
            />
          </div>
        ) : (
          <div className="text-text-muted text-sm">Waiting...</div>
        )}
      </div>

      {/* Progress */}
      <div className="mb-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-text-secondary">
            Round {debate.currentRound}/{debate.totalRounds}
          </span>
          <span className="text-electric-blue font-medium">
            {timeLeft}
          </span>
        </div>
        <div className="w-full h-1 bg-bg-tertiary rounded-full overflow-hidden">
          <div 
            className="h-full bg-electric-blue transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4 text-text-secondary">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {debate.spectatorCount} watching
          </span>
          {debate.status === 'ACTIVE' && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-cyber-green rounded-full animate-pulse" />
              <span className="text-cyber-green font-semibold">LIVE</span>
            </div>
          )}
        </div>
        <span className="text-electric-blue font-semibold flex items-center gap-1">
          Watch
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
    </motion.div>
  )
}

function calculateTimeLeft(deadline: Date | string | null): string {
  if (!deadline) return '—'
  
  // Convert string to Date if needed (API returns dates as strings)
  const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline)
  
  // Check if date is valid
  if (isNaN(deadlineDate.getTime())) return '—'
  
  const now = new Date()
  const diff = deadlineDate.getTime() - now.getTime()
  
  if (diff <= 0) return 'Ended'
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  return `${hours}h ${minutes}m left`
}

