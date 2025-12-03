import { cn } from '@/lib/utils'

interface PanelProps {
  children: React.ReactNode
  className?: string
}

export function Panel({ children, className }: PanelProps) {
  return (
    <div
      className={cn(
        // Desktop: full width horizontal
        'md:min-w-screen md:w-screen md:h-full',
        // Mobile: full width vertical
        'w-full min-h-screen',
        'snap-start',
        'overflow-y-auto overflow-x-hidden',
        'p-6 md:p-10',
        className
      )}
    >
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  )
}

