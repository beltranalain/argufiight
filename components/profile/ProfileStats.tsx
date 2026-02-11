'use client'

import type { UserProfile, TournamentStats } from '@/lib/hooks/queries/useProfile'

interface ProfileStatsProps {
  profile: UserProfile
  tournamentStats: TournamentStats | undefined
}

export function ProfileStats({ profile, tournamentStats }: ProfileStatsProps) {
  const winRate = profile.totalDebates > 0
    ? ((profile.debatesWon / profile.totalDebates) * 100).toFixed(1)
    : '0.0'

  return (
    <>
      {/* ELO and Overall Score */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 bg-electric-blue/20 border border-electric-blue/30 rounded-lg px-6 py-4">
          <p className="text-xs text-text-secondary mb-1">ELO Rating</p>
          <p className="text-3xl font-bold text-electric-blue">{profile.eloRating || 1200}</p>
          <p className="text-xs text-text-muted mt-1">Current rating</p>
        </div>
        {profile.totalMaxScore > 0 ? (
          <div className="flex-1 bg-cyber-green/20 border border-cyber-green/30 rounded-lg px-6 py-4">
            <p className="text-xs text-text-secondary mb-1">Overall Score</p>
            <p className="text-3xl font-bold text-cyber-green">
              {profile.totalScore.toLocaleString()}/{profile.totalMaxScore.toLocaleString()}
            </p>
            <p className="text-xs text-text-muted mt-1">
              {Math.round((profile.totalScore / profile.totalMaxScore) * 100)}% average
            </p>
          </div>
        ) : (
          <div className="flex-1 bg-bg-tertiary border border-bg-secondary rounded-lg px-6 py-4">
            <p className="text-xs text-text-secondary mb-1">Overall Score</p>
            <p className="text-3xl font-bold text-text-secondary">N/A</p>
            <p className="text-xs text-text-muted mt-1">No completed debates yet</p>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-bg-tertiary rounded-lg p-3">
          <p className="text-xs text-text-secondary mb-1">Total</p>
          <p className="text-xl font-bold text-text-primary">{profile.totalDebates || 0}</p>
        </div>
        <div className="bg-bg-tertiary rounded-lg p-3">
          <p className="text-xs text-text-secondary mb-1">Wins</p>
          <p className="text-xl font-bold text-cyber-green">{profile.debatesWon || 0}</p>
        </div>
        <div className="bg-bg-tertiary rounded-lg p-3">
          <p className="text-xs text-text-secondary mb-1">Losses</p>
          <p className="text-xl font-bold text-neon-orange">{profile.debatesLost || 0}</p>
        </div>
        <div className="bg-bg-tertiary rounded-lg p-3">
          <p className="text-xs text-text-secondary mb-1">Ties</p>
          <p className="text-xl font-bold text-text-muted">{profile.debatesTied || 0}</p>
        </div>
        <div className="bg-bg-tertiary rounded-lg p-3">
          <p className="text-xs text-text-secondary mb-1">Win Rate</p>
          <p className="text-xl font-bold text-electric-blue">{winRate}%</p>
        </div>
      </div>

      {/* Performance Analytics */}
      <div className="mt-6 pt-6 border-t border-bg-tertiary">
        <h3 className="text-lg font-bold text-text-primary mb-4">Performance Analytics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-bg-tertiary rounded-lg p-4 border border-bg-secondary">
            <p className="text-text-secondary text-sm mb-1">Total Words</p>
            <p className="text-2xl font-bold text-text-primary">
              {profile.totalWordCount?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-text-muted mt-1">Across all debates</p>
          </div>
          <div className="bg-bg-tertiary rounded-lg p-4 border border-bg-secondary">
            <p className="text-text-secondary text-sm mb-1">Avg Words/Statement</p>
            <p className="text-2xl font-bold text-electric-blue">
              {Math.round(profile.averageWordCount || 0)}
            </p>
            <p className="text-xs text-text-muted mt-1">Per argument</p>
          </div>
          <div className="bg-bg-tertiary rounded-lg p-4 border border-bg-secondary">
            <p className="text-text-secondary text-sm mb-1">Total Statements</p>
            <p className="text-2xl font-bold text-text-primary">
              {profile.totalStatements?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-text-muted mt-1">Arguments submitted</p>
          </div>
          <div className="bg-bg-tertiary rounded-lg p-4 border border-bg-secondary">
            <p className="text-text-secondary text-sm mb-1">Avg Rounds/Debate</p>
            <p className="text-2xl font-bold text-cyber-green">
              {profile.averageRounds?.toFixed(1) || '0.0'}
            </p>
            <p className="text-xs text-text-muted mt-1">Per debate</p>
          </div>
        </div>
      </div>

      {/* Tournament Stats */}
      {tournamentStats && (
        <div className="mt-6 pt-6 border-t border-bg-tertiary">
          <h3 className="text-lg font-bold text-text-primary mb-4">Tournament Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-bg-tertiary rounded-lg p-4 border border-bg-secondary">
              <p className="text-text-secondary text-sm mb-1">Total Tournaments</p>
              <p className="text-2xl font-bold text-text-primary">
                {tournamentStats.totalTournaments}
              </p>
              <p className="text-xs text-text-muted mt-1">Participated</p>
            </div>
            <div className="bg-bg-tertiary rounded-lg p-4 border border-bg-secondary">
              <p className="text-text-secondary text-sm mb-1">Championships</p>
              <p className="text-2xl font-bold text-cyber-green">
                {tournamentStats.championships}
              </p>
              <p className="text-xs text-text-muted mt-1">Tournaments won</p>
            </div>
            <div className="bg-bg-tertiary rounded-lg p-4 border border-bg-secondary">
              <p className="text-text-secondary text-sm mb-1">Tournament Win Rate</p>
              <p className="text-2xl font-bold text-electric-blue">
                {tournamentStats.winRate}%
              </p>
              <p className="text-xs text-text-muted mt-1">
                {tournamentStats.totalTournamentWins}W / {tournamentStats.totalTournamentLosses}L
              </p>
            </div>
            <div className="bg-bg-tertiary rounded-lg p-4 border border-bg-secondary">
              <p className="text-text-secondary text-sm mb-1">Active Tournaments</p>
              <p className="text-2xl font-bold text-neon-orange">
                {tournamentStats.activeTournaments}
              </p>
              <p className="text-xs text-text-muted mt-1">Currently playing</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
