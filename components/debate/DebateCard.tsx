'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { cardHover, cardTap } from '@/lib/animations'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'

interface DebateCardProps {
  debate: {
    id: string
    slug?: string | null
    topic: string
    category: string
    challengeType?: string
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
        format?: string
        currentRound: number
        totalRounds: number
      }
      round: {
        roundNumber: number
      }
    } | null
    participants?: Array<{
      id: string
      userId: string
      status: string
      user: {
        id: string
        username: string
        avatarUrl: string | null
        eloRating: number
      }
    }>
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
  // For tournament debates, use tournament round number; otherwise use debate round
  const displayRound = debate.tournamentMatch 
    ? debate.tournamentMatch.round.roundNumber 
    : debate.currentRound
  const displayTotalRounds = debate.tournamentMatch 
    ? debate.tournamentMatch.tournament.totalRounds 
    : debate.totalRounds
  const progress = (displayRound / displayTotalRounds) * 100
  const timeLeft = calculateTimeLeft(debate.roundDeadline)
  
  // Check if this is a GROUP debate (King of the Hill)
  const isGroupDebate = debate.challengeType === 'GROUP' || (debate.participants && debate.participants.length > 2)
  const isKingOfTheHill = debate.tournamentMatch?.tournament?.format === 'KING_OF_THE_HILL'
  
  // Get active participants for GROUP debates
  const activeParticipants = isGroupDebate && debate.participants
    ? debate.participants.filter(p => p.status === 'ACTIVE' || p.status === 'ACCEPTED')
    : []

  return (
    <motion.div
      whileHover={cardHover}
      whileTap={cardTap}
    >
      <Link
        href={debate.slug ? `/debates/${debate.slug}` : `/debate/${debate.id}`}
        className="block bg-bg-secondary border border-bg-tertiary rounded-xl p-5 hover:border-electric-blue hover:shadow-[0_8px_32px_rgba(0,217,255,0.15)] transition-all relative overflow-hidden"
      >
      {/* Category Badge - Top Right */}
      <div className="flex items-start justify-between mb-3">
        <Badge 
          variant={debate.category.toLowerCase() as any}
          size="sm"
          className="shrink-0"
        >
          {debate.category}
        </Badge>
        {debate.status === 'ACTIVE' && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-cyber-green/20 border border-cyber-green/30 rounded-full">
            <span className="w-1.5 h-1.5 bg-cyber-green rounded-full animate-pulse" />
            <span className="text-cyber-green text-xs font-semibold">LIVE</span>
          </div>
        )}
      </div>

      {/* Topic - Limited to 2 lines */}
      <h4 className="text-base font-bold text-white mb-4 line-clamp-2 group-hover:text-electric-blue transition-colors leading-snug">
        {debate.topic}
      </h4>

      {/* Images - Compact */}
      {debate.images && debate.images.length > 0 && (
        <div className="mb-4">
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

      {/* Debaters - Compact Layout (Avatars Only) */}
      <div className="flex items-center justify-center gap-4 mb-4">
        {/* Challenger */}
        <div className="flex flex-col items-center gap-1">
          <Avatar 
            src={debate.challenger.avatarUrl}
            username={debate.challenger.username}
            size="md"
          />
          <p className="text-[10px] text-text-muted uppercase">
            {debate.challengerPosition}
          </p>
        </div>

        {/* VS - Smaller */}
        <span className="text-sm font-bold text-text-muted">VS</span>

        {/* Opponent */}
        {debate.opponent ? (
          <div className="flex flex-col items-center gap-1">
            <Avatar 
              src={debate.opponent.avatarUrl}
              username={debate.opponent.username}
              size="md"
            />
            <p className="text-[10px] text-text-muted uppercase">
              {debate.opponentPosition}
            </p>
          </div>
        ) : (
          <div className="text-text-muted text-xs">Waiting...</div>
        )}
      </div>

      {/* Progress - Compact */}
      <div className="mb-4">
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="text-text-secondary">
            Round {displayRound}/{displayTotalRounds}
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

      {/* Footer - Compact */}
      <div className="flex items-center justify-between text-xs pt-3 border-t border-bg-tertiary">
        <span className="flex items-center gap-1.5 text-text-secondary">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {debate.spectatorCount}
        </span>
        <span className="text-electric-blue font-semibold flex items-center gap-1 hover:text-electric-blue/80 transition-colors">
          Watch
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

