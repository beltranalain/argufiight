'use client'

interface DebateStreakBadgeProps {
  streak: number
  longestStreak: number
}

export function DebateStreakBadge({ streak, longestStreak }: DebateStreakBadgeProps) {
  if (streak === 0 && longestStreak === 0) return null

  return (
    <div className="bg-bg-tertiary rounded-lg px-3 py-2 flex items-center gap-2">
      <span className="text-lg" title="Debate streak"></span>
      <div className="flex flex-col">
        <span className="text-white font-semibold text-sm leading-tight">
          {streak} day{streak !== 1 ? 's' : ''}
        </span>
        {longestStreak > streak && (
          <span className="text-text-secondary text-xs leading-tight">
            Best: {longestStreak}
          </span>
        )}
      </div>
    </div>
  )
}
