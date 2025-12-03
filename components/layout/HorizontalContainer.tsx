'use client'

import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface HorizontalContainerProps {
  children: React.ReactNode
  activePanel: number
  onPanelChange: (index: number) => void
}

export function HorizontalContainer({ 
  children, 
  activePanel,
  onPanelChange 
}: HorizontalContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Scroll to active panel
  useEffect(() => {
    if (!containerRef.current) return
    
    const panelWidth = containerRef.current.clientWidth
    containerRef.current.scrollTo({
      left: activePanel * panelWidth,
      behavior: 'smooth'
    })
  }, [activePanel])

  // Update active panel on scroll
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft
      const panelWidth = container.clientWidth
      const newPanel = Math.round(scrollLeft / panelWidth)
      
      if (newPanel !== activePanel) {
        onPanelChange(newPanel)
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [activePanel, onPanelChange])

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex h-[calc(100vh-80px)] mt-20',
        'overflow-x-auto overflow-y-hidden',
        'snap-x snap-mandatory',
        'scrollbar-hide',
        // Mobile: vertical layout
        'md:flex-row flex-col md:overflow-x-auto md:overflow-y-hidden overflow-y-auto overflow-x-hidden md:h-[calc(100vh-80px)] h-auto'
      )}
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {children}
    </div>
  )
}

