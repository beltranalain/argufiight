'use client'

import { useState } from 'react'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardBody } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorDisplay } from '@/components/ui/ErrorDisplay'
import { Pagination } from '@/components/ui/Pagination'
import { useAuth } from '@/lib/hooks/useAuth'
import { Tabs } from '@/components/ui/Tabs'
import { useLeaderboard } from '@/lib/hooks/queries/useLeaderboard'
import type { ELOLeaderboardEntry, TournamentLeaderboardEntry } from '@/lib/hooks/queries/useLeaderboard'
import Link from 'next/link'

function getRankBadge(rank: number) {
  if (rank === 1) return <Badge variant="default" className="bg-electric-blue text-black text-lg px-3 py-1">1</Badge>
  if (rank === 2) return <Badge variant="default" className="bg-text-muted text-text-primary text-lg px-3 py-1">2</Badge>
  if (rank === 3) return <Badge variant="default" className="bg-neon-orange/80 text-black text-lg px-3 py-1">3</Badge>
  return <span className="text-text-muted font-bold text-lg">#{rank}</span>
}

function ELOStats({ entry }: { entry: ELOLeaderboardEntry }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
      <div>
        <span className="text-text-secondary block text-xs mb-0.5">ELO</span>
        <span className="text-electric-blue font-bold">{entry.eloRating}</span>
      </div>
      <div>
        <span className="text-text-secondary block text-xs mb-0.5">Score</span>
        <span className="text-cyber-green font-bold">{entry.overallScore}</span>
        <span className="text-text-muted text-xs ml-1">({entry.overallScorePercent}%)</span>
      </div>
      <div>
        <span className="text-text-secondary block text-xs mb-0.5">Record</span>
        <div className="flex items-center gap-1.5">
          <span className="text-cyber-green font-semibold">{entry.debatesWon}W</span>
          <span className="text-neon-orange font-semibold">{entry.debatesLost}L</span>
          <span className="text-yellow-500 font-semibold">{entry.debatesTied || 0}T</span>
        </div>
      </div>
      <div>
        <span className="text-text-secondary block text-xs mb-0.5">Win Rate</span>
        <span className="text-electric-blue font-bold">{entry.winRate}%</span>
        <span className="text-text-muted text-xs ml-1">({entry.totalDebates} debates)</span>
      </div>
    </div>
  )
}

function TournamentStats({ entry }: { entry: TournamentLeaderboardEntry }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
      <div>
        <span className="text-text-secondary block text-xs mb-0.5">Tournament Score</span>
        <span className="text-electric-blue font-bold">{Number(entry.tournamentScore).toFixed(2)}</span>
      </div>
      <div>
        <span className="text-text-secondary block text-xs mb-0.5">Championships</span>
        <span className="text-cyber-green font-bold">{entry.tournamentsWon}</span>
        <span className="text-text-muted text-xs ml-1">won</span>
      </div>
      <div>
        <span className="text-text-secondary block text-xs mb-0.5">Record</span>
        <div className="flex items-center gap-1.5">
          <span className="text-cyber-green font-semibold">{entry.totalTournamentWins}W</span>
          <span className="text-neon-orange font-semibold">{entry.totalTournamentLosses}L</span>
        </div>
      </div>
      <div>
        <span className="text-text-secondary block text-xs mb-0.5">Avg Score</span>
        <span className="text-cyber-green font-bold">{entry.averageTournamentScore}/100</span>
        <span className="text-text-muted text-xs ml-1">({entry.tournamentWinRate}% win rate)</span>
      </div>
    </div>
  )
}

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'elo' | 'tournaments'>('elo')
  const [eloPage, setEloPage] = useState(1)
  const [tournamentPage, setTournamentPage] = useState(1)

  const page = activeTab === 'elo' ? eloPage : tournamentPage
  const setPage = activeTab === 'elo' ? setEloPage : setTournamentPage

  const { data, isLoading, isError, refetch } = useLeaderboard(activeTab, page, user?.id)

  const leaderboard = data?.leaderboard || []
  const pagination = data?.pagination

  const renderContent = () => {
    if (isLoading) {
      return (
        <Card>
          <CardBody>
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          </CardBody>
        </Card>
      )
    }

    if (isError) {
      return <ErrorDisplay title="Failed to load leaderboard" onRetry={() => refetch()} />
    }

    if (leaderboard.length === 0) {
      return (
        <Card>
          <CardBody>
            <EmptyState
              title="No Rankings Yet"
              description={
                activeTab === 'elo'
                  ? 'Complete debates to appear on the leaderboard'
                  : 'Participate in tournaments to appear on the tournament leaderboard'
              }
            />
          </CardBody>
        </Card>
      )
    }

    return (
      <Card>
        <CardBody>
          <div className="space-y-3">
            {leaderboard.map((entry) => {
              const isCurrentUser = user?.id === entry.id
              return (
                <Link
                  key={entry.id}
                  href={`/${entry.username}`}
                  className={`block p-5 rounded-xl border-2 transition-all hover:shadow-lg ${
                    isCurrentUser
                      ? 'bg-gradient-to-br from-electric-blue/20 to-electric-blue/5 border-electric-blue/50 hover:border-electric-blue shadow-electric-blue/20'
                      : 'bg-bg-tertiary border-bg-secondary hover:border-bg-primary'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">{getRankBadge(entry.rank)}</div>
                    <Avatar src={entry.avatarUrl} username={entry.username} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <p className={`font-bold text-lg truncate ${isCurrentUser ? 'text-electric-blue' : 'text-text-primary'}`}>
                          {entry.username}
                        </p>
                        {isCurrentUser && (
                          <Badge variant="default" size="sm" className="bg-electric-blue text-black px-2 py-0.5">You</Badge>
                        )}
                      </div>
                      {activeTab === 'elo'
                        ? <ELOStats entry={entry as ELOLeaderboardEntry} />
                        : <TournamentStats entry={entry as TournamentLeaderboardEntry} />
                      }
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 pt-6 border-t border-bg-tertiary">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav currentPanel="LEADERBOARD" />

      <div className="pt-20 px-4 md:px-8 pb-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-text-primary mb-2">Leaderboard</h1>
            <p className="text-text-secondary">
              {activeTab === 'elo'
                ? 'Top debaters ranked by ELO rating'
                : 'Top debaters ranked by tournament performance'}
            </p>
          </div>

          <Tabs
            tabs={[
              { id: 'elo', label: 'ELO Leaderboard' },
              { id: 'tournaments', label: 'Tournament Scores' },
            ]}
            activeTab={activeTab}
            onTabChange={(tabId) => setActiveTab(tabId as 'elo' | 'tournaments')}
          />

          {renderContent()}
        </div>
      </div>
    </div>
  )
}
