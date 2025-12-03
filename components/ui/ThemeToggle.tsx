'use client'

import { useTheme } from '@/lib/contexts/ThemeContext'

export function ThemeToggle() {
  try {
    const { theme, setTheme } = useTheme()

    const themes: Array<{ value: 'dark' | 'light' | 'grape'; label: string }> = [
      { value: 'dark', label: 'Dark' },
      { value: 'light', label: 'Light' },
      { value: 'grape', label: 'Grape' },
    ]

    return (
      <div className="flex items-center gap-1 bg-bg-tertiary rounded-lg p-1">
        {themes.map((t) => (
          <button
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              theme === t.value
                ? 'bg-electric-blue text-black'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
            }`}
            title={t.label}
          >
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.label.charAt(0)}</span>
          </button>
        ))}
      </div>
    )
  } catch (error) {
    // Fallback if ThemeProvider is not available
    return null
  }
}

