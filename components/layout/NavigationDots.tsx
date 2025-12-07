'use client'

import { cn } from '@/lib/utils'

interface NavigationDotsProps {
  total: number
  active: number
  onDotClick: (index: number) => void
}

export function NavigationDots({ total, active, onDotClick }: NavigationDotsProps) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-50">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onDotClick(index)}
          className={cn(
            'h-3 rounded-full transition-all duration-300',
            index === active
              ? 'w-8 bg-electric-blue'
              : 'w-3 bg-text-muted hover:bg-text-secondary'
          )}
          aria-label={`Go to panel ${index + 1}`}
        />
      ))}
    </div>
  )
}


