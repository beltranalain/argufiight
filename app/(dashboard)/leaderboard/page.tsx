'use client'

import { useState, useEffect } from 'react'
import { TopNav } from '@/components/layout/TopNav'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/Loading'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/lib/hooks/useAuth'
import { Tabs } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

interface ELOLeaderboardEntry {
  rank: number
  id: string
  username: string
  avatarUrl: string | null
  eloRating: number
  debatesWon: number
  debatesLost: number
  debatesTied: number
  totalDebates: number
  winRate: number
  overallScore: string
  overallScorePercent: number
}

interface TournamentLeaderboardEntry {
  rank: number
  id: string
  username: string
  avatarUrl: string | null
  tournamentsWon: number
  totalTournamentWins: number
  totalTournamentLosses: number
  totalTournamentMatches: number
  tournamentWinRate: number
  averageTournamentScore: number
  tournamentScore: number
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'elo' | 'tournaments'>('elo')
  const [eloLeaderboard, setEloLeaderboard] = useState<ELOLeaderboardEntry[]>([])
  const [tournamentLeaderboard, setTournamentLeaderboard] = useState<TournamentLeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [eloPagination, setEloPagination] = useState<PaginationInfo>({ page: 1, limit: 25, total: 0, totalPages: 0 })
  const [tournamentPagination, setTournamentPagination] = useState<PaginationInfo>({ page: 1, limit: 25, total: 0, totalPages: 0 })

  useEffect(() => {
    if (activeTab === 'elo') {
      fetchELOLeaderboard(eloPagination.page)
    } else {
      fetchTournamentLeaderboard(tournamentPagination.page)
    }
  }, [activeTab])

  // Reset to page 1 when switching tabs
  useEffect(() => {
    if (activeTab === 'elo') {
      setEloPagination(prev => ({ ...prev, page: 1 }))
    } else {
      setTournamentPagination(prev => ({ ...prev, page: 1 }))
    }
  }, [activeTab])

  // Add ItemList schema markup for SEO
  useEffect(() => {
    const currentLeaderboard = activeTab === 'elo' ? eloLeaderboard : tournamentLeaderboard
    if (currentLeaderboard.length === 0) return

    const itemListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": activeTab === 'elo' ? "Argu Fight Top Debaters - ELO Rankings" : "Argu Fight Tournament Leaderboard",
      "description": activeTab === 'elo' 
        ? "Top debaters ranked by ELO rating on Argu Fight"
        : "Top debaters ranked by tournament performance on Argu Fight",
      "itemListElement": currentLeaderboard.slice(0, 50).map((entry, index) => ({
        "@type": "ListItem",
        "position": entry.rank,
        "item": {
          "@type": "Person",
          "name": entry.username,
          "url": `https://www.argufight.com/${entry.username}`,
          "description": activeTab === 'elo'
            ? `ELO: ${(entry as ELOLeaderboardEntry).eloRating}, Record: ${(entry as ELOLeaderboardEntry).debatesWon}W-${(entry as ELOLeaderboardEntry).debatesLost}L-${(entry as ELOLeaderboardEntry).debatesTied || 0}T`
            : `Tournament Score: ${Number((entry as TournamentLeaderboardEntry).tournamentScore).toFixed(2)}, Championships: ${(entry as TournamentLeaderboardEntry).tournamentsWon}`
        }
      }))
    }

    // Remove existing schema if any
    const existingScript = document.getElementById('leaderboard-schema')
    if (existingScript) {
      existingScript.remove()
    }

    // Add new schema
    const script = document.createElement('script')
    script.id = 'leaderboard-schema'
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(itemListSchema)
    document.head.appendChild(script)

    return () => {
      const scriptToRemove = document.getElementById('leaderboard-schema')
      if (scriptToRemove) {
        scriptToRemove.remove()
      }
    }
  }, [activeTab, eloLeaderboard, tournamentLeaderboard])

  const fetchELOLeaderboard = async (page: number = 1) => {
    try {
      setIsLoading(true)
      // Add cache-busting to ensure fresh data
      const response = await fetch(`/api/leaderboard?page=${page}&limit=25&t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      if (response.ok) {
        const data = await response.json()
        console.log('[Leaderboard] API response:', {
          leaderboardLength: data.leaderboard?.length || 0,
          total: data.pagination?.total || 0,
          firstUser: data.leaderboard?.[0]?.username || 'none',
        })
        // Ensure leaderboard is an array before setting
        if (Array.isArray(data.leaderboard)) {
          setEloLeaderboard(data.leaderboard)
        } else if (Array.isArray(data)) {
          setEloLeaderboard(data)
        } else {
          setEloLeaderboard([])
        }
        // Update pagination info
        if (data.pagination) {
          setEloPagination({
            page: data.pagination.page || page,
            limit: data.pagination.limit || 25,
            total: data.pagination.total || 0,
            totalPages: data.pagination.totalPages || 0,
          })
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('[Leaderboard] API error:', response.status, errorData)
        setEloLeaderboard([])
      }
    } catch (error) {
      console.error('Failed to fetch ELO leaderboard:', error)
      setEloLeaderboard([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTournamentLeaderboard = async (page: number = 1) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/leaderboard/tournaments?page=${page}&limit=25`)
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data.leaderboard)) {
          setTournamentLeaderboard(data.leaderboard)
        } else {
          setTournamentLeaderboard([])
        }
        // Update pagination info
        if (data.pagination) {
          setTournamentPagination({
            page: data.pagination.page || page,
            limit: data.pagination.limit || 25,
            total: data.pagination.total || 0,
            totalPages: data.pagination.totalPages || 0,
          })
        }
      } else {
        setTournamentLeaderboard([])
      }
    } catch (error) {
      console.error('Failed to fetch tournament leaderboard:', error)
      setTournamentLeaderboard([])
    } finally {
      setIsLoading(false)
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return <Badge variant="default" className="bg-electric-blue text-black text-lg px-3 py-1">1</Badge>
    } else if (rank === 2) {
      return <Badge variant="default" className="bg-text-muted text-text-primary text-lg px-3 py-1">2</Badge>
    } else if (rank === 3) {
      return <Badge variant="default" className="bg-neon-orange/80 text-black text-lg px-3 py-1">3</Badge>
    }
    return <span className="text-text-muted font-bold text-lg">#{rank}</span>
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

          {/* Tabs */}
          <Tabs
            tabs={[
              { id: 'elo', label: 'ELO Leaderboard' },
              { id: 'tournaments', label: 'Tournament Scores' },
            ]}
            activeTab={activeTab}
            onTabChange={(tabId) => setActiveTab(tabId as 'elo' | 'tournaments')}
          />

          {isLoading ? (
            <Card>
              <CardBody>
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              </CardBody>
            </Card>
          ) : (activeTab === 'elo' ? eloLeaderboard : tournamentLeaderboard).length === 0 ? (
            <Card>
              <CardBody>
                <EmptyState
                  icon={
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  }
                  title="No Rankings Yet"
                  description={
                    activeTab === 'elo'
                      ? 'Complete debates to appear on the leaderboard'
                      : 'Participate in tournaments to appear on the tournament leaderboard'
                  }
                />
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody>
                <div className="space-y-3">
                  {(activeTab === 'elo' ? eloLeaderboard : tournamentLeaderboard).map((entry) => {
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
                          <div className="flex-shrink-0">
                            {getRankBadge(entry.rank)}
                          </div>
                          <Avatar
                            src={entry.avatarUrl}
                            username={entry.username}
                            size="lg"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <p className={`font-bold text-lg truncate ${isCurrentUser ? 'text-electric-blue' : 'text-text-primary'}`}>
                                {entry.username}
                              </p>
                              {isCurrentUser && (
                                <Badge variant="default" size="sm" className="bg-electric-blue text-black px-2 py-0.5">
                                  You
                                </Badge>
                              )}
                            </div>
                            {activeTab === 'elo' ? (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <span className="text-text-secondary block text-xs mb-0.5">ELO</span>
                                  <span className="text-electric-blue font-bold">{(entry as ELOLeaderboardEntry).eloRating}</span>
                                </div>
                                <div>
                                  <span className="text-text-secondary block text-xs mb-0.5">Score</span>
                                  <span className="text-cyber-green font-bold">{(entry as ELOLeaderboardEntry).overallScore}</span>
                                  <span className="text-text-muted text-xs ml-1">({(entry as ELOLeaderboardEntry).overallScorePercent}%)</span>
                                </div>
                                <div>
                                  <span className="text-text-secondary block text-xs mb-0.5">Record</span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-cyber-green font-semibold">{(entry as ELOLeaderboardEntry).debatesWon}W</span>
                                    <span className="text-neon-orange font-semibold">{(entry as ELOLeaderboardEntry).debatesLost}L</span>
                                    <span className="text-yellow-500 font-semibold">{((entry as ELOLeaderboardEntry).debatesTied || 0)}T</span>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-text-secondary block text-xs mb-0.5">Win Rate</span>
                                  <span className="text-electric-blue font-bold">{(entry as ELOLeaderboardEntry).winRate}%</span>
                                  <span className="text-text-muted text-xs ml-1">({(entry as ELOLeaderboardEntry).totalDebates} debates)</span>
                                </div>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <span className="text-text-secondary block text-xs mb-0.5">Tournament Score</span>
                                  <span className="text-electric-blue font-bold">
                                    {Number((entry as TournamentLeaderboardEntry).tournamentScore).toFixed(2)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-text-secondary block text-xs mb-0.5">Championships</span>
                                  <span className="text-cyber-green font-bold">{(entry as TournamentLeaderboardEntry).tournamentsWon}</span>
                                  <span className="text-text-muted text-xs ml-1">won</span>
                                </div>
                                <div>
                                  <span className="text-text-secondary block text-xs mb-0.5">Record</span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-cyber-green font-semibold">{(entry as TournamentLeaderboardEntry).totalTournamentWins}W</span>
                                    <span className="text-neon-orange font-semibold">{(entry as TournamentLeaderboardEntry).totalTournamentLosses}L</span>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-text-secondary block text-xs mb-0.5">Avg Score</span>
                                  <span className="text-cyber-green font-bold">{(entry as TournamentLeaderboardEntry).averageTournamentScore}/100</span>
                                  <span className="text-text-muted text-xs ml-1">({(entry as TournamentLeaderboardEntry).tournamentWinRate}% win rate)</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
                
                {/* Pagination Controls */}
                {(() => {
                  const pagination = activeTab === 'elo' ? eloPagination : tournamentPagination
                  if (pagination.totalPages <= 1) return null
                  
                  return (
                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-bg-tertiary">
                      <div className="text-sm text-text-secondary">
                        Showing {((pagination.page - 1) * pagination.limit) + 1}-
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            if (activeTab === 'elo') {
                              const newPage = eloPagination.page - 1
                              setEloPagination(prev => ({ ...prev, page: newPage }))
                              fetchELOLeaderboard(newPage)
                            } else {
                              const newPage = tournamentPagination.page - 1
                              setTournamentPagination(prev => ({ ...prev, page: newPage }))
                              fetchTournamentLeaderboard(newPage)
                            }
                          }}
                          disabled={pagination.page === 1 || isLoading}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                            let pageNum: number
                            if (pagination.totalPages <= 7) {
                              pageNum = i + 1
                            } else if (pagination.page <= 4) {
                              pageNum = i + 1
                            } else if (pagination.page >= pagination.totalPages - 3) {
                              pageNum = pagination.totalPages - 6 + i
                            } else {
                              pageNum = pagination.page - 3 + i
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => {
                                  if (activeTab === 'elo') {
                                    setEloPagination(prev => ({ ...prev, page: pageNum }))
                                    fetchELOLeaderboard(pageNum)
                                  } else {
                                    setTournamentPagination(prev => ({ ...prev, page: pageNum }))
                                    fetchTournamentLeaderboard(pageNum)
                                  }
                                }}
                                disabled={isLoading}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                  pageNum === pagination.page
                                    ? 'bg-electric-blue text-black'
                                    : 'bg-bg-secondary text-text-primary hover:bg-bg-tertiary'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                {pageNum}
                              </button>
                            )
                          })}
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            if (activeTab === 'elo') {
                              const newPage = eloPagination.page + 1
                              setEloPagination(prev => ({ ...prev, page: newPage }))
                              fetchELOLeaderboard(newPage)
                            } else {
                              const newPage = tournamentPagination.page + 1
                              setTournamentPagination(prev => ({ ...prev, page: newPage }))
                              fetchTournamentLeaderboard(newPage)
                            }
                          }}
                          disabled={pagination.page >= pagination.totalPages || isLoading}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )
                })()}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

