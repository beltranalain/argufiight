'use client'

import { SeoAnalysis } from '@/lib/utils/seo-score'

const gradeColors: Record<SeoAnalysis['grade'], string> = {
  Excellent: '#00FF94',
  Good: '#00D9FF',
  'Needs Work': '#FF6B35',
  Poor: '#ef4444',
}

export function SeoScoreWidget({ analysis }: { analysis: SeoAnalysis }) {
  const color = gradeColors[analysis.grade]
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const progress = (analysis.score / 100) * circumference
  const offset = circumference - progress

  const warnings = analysis.suggestions.filter(s => s.type === 'warning' || s.type === 'error')

  return (
    <div className="space-y-4">
      {/* Circular Score */}
      <div className="flex flex-col items-center">
        <svg width="100" height="100" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-bg-tertiary"
          />
          {/* Progress circle */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 50 50)"
            className="transition-all duration-500"
          />
          {/* Score text */}
          <text
            x="50" y="46"
            textAnchor="middle"
            className="fill-white text-2xl font-bold"
            style={{ fontSize: '24px', fontWeight: 700 }}
          >
            {analysis.score}
          </text>
          <text
            x="50" y="62"
            textAnchor="middle"
            style={{ fontSize: '9px', fill: color }}
          >
            {analysis.grade} SEO
          </text>
        </svg>
      </div>

      {/* Suggestions */}
      {warnings.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">AI Suggestions</p>
          {warnings.map((s) => (
            <div
              key={s.id}
              className="flex items-start gap-2 text-xs"
            >
              <span className={`mt-0.5 flex-shrink-0 ${s.type === 'error' ? 'text-red-400' : 'text-neon-orange'}`}>
                {s.type === 'error' ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M6 3.5v3M6 8h.005" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1l1.5 3.5L11 5l-2.5 2.5.5 3.5L6 9.5 3 11l.5-3.5L1 5l3.5-.5z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/></svg>
                )}
              </span>
              <span className="text-text-secondary leading-tight">{s.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
