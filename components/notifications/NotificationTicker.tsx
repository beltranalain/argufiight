'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  debateId: string | null
  read: boolean
  createdAt: string
  priority?: 'high' | 'medium' | 'low'
}

interface TickerUpdate {
  id: string
  type: 'BIG_BATTLE' | 'HIGH_VIEWS' | 'MAJOR_UPSET' | 'NEW_VERDICT' | 'STREAK' | 'MILESTONE'
  title: string
  message: string
  debateId: string | null
  priority: 'high' | 'medium' | 'low'
  createdAt: string
}

export function NotificationTicker() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [tickerUpdates, setTickerUpdates] = useState<TickerUpdate[]>([])
  const [allItems, setAllItems] = useState<(Notification | TickerUpdate)[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const tickerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchTickerUpdates()
    const tickerInterval = setInterval(() => {
      fetchTickerUpdates()
    }, 60000) // Update ticker every minute

    if (user) {
      fetchNotifications()
      const notificationInterval = setInterval(() => {
        fetchNotifications()
      }, 30000) // Update notifications every 30 seconds

      return () => {
        clearInterval(tickerInterval)
        clearInterval(notificationInterval)
      }
    }

    return () => clearInterval(tickerInterval)
  }, [user])

  useEffect(() => {
    // Merge notifications and ticker updates, prioritizing unread notifications
    const merged: (Notification | TickerUpdate)[] = []
    
    // Add unread notifications first
    const unreadNotifications = notifications.filter(n => !n.read)
    merged.push(...unreadNotifications)
    
    // Add ticker updates
    merged.push(...tickerUpdates)
    
    // Add read notifications (less priority)
    const readNotifications = notifications.filter(n => n.read)
    merged.push(...readNotifications)
    
    // Sort by priority and recency
    merged.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const aPriority = 'priority' in a ? (a.priority || 'low') : 'low'
      const bPriority = 'priority' in b ? (b.priority || 'low') : 'low'
      const priorityDiff = priorityOrder[bPriority] - priorityOrder[aPriority]
      if (priorityDiff !== 0) return priorityDiff
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    
    setAllItems(merged)
  }, [notifications, tickerUpdates])

  useEffect(() => {
    if (!contentRef.current || allItems.length === 0) return

    // Filter items to show (recent items within last 24 hours)
    const visibleItems = allItems.filter(
      item => {
        const itemDate = new Date(item.createdAt)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        return itemDate > oneDayAgo || ('read' in item && !item.read)
      }
    ).slice(0, 15)

    if (visibleItems.length === 0) return

    const content = contentRef.current
    let animationId: number
    let position = 0
    const speed = 0.3 // pixels per frame - slower, smoother scroll

    const animate = () => {
      if (!isPaused && content) {
        position += speed
        
        // Calculate width of one set of items
        const gap = 16 // gap-4 = 16px
        let singleSetWidth = 0
        for (let i = 0; i < visibleItems.length; i++) {
          const child = content.children[i] as HTMLElement
          if (child) {
            singleSetWidth += child.getBoundingClientRect().width + gap
          }
        }
        
        // Reset when we've scrolled one full set
        if (position >= singleSetWidth) {
          position = 0
        }
        
        content.style.transform = `translateX(-${position}px)`
      }
      
      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [allItems, isPaused])

  const fetchNotifications = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/notifications?limit=20')
      if (response.ok) {
        const data = await response.json()
        const fetchedNotifications = Array.isArray(data) ? data : (data.notifications || [])
        setNotifications(fetchedNotifications)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  const fetchTickerUpdates = async () => {
    try {
      const response = await fetch('/api/ticker')
      if (response.ok) {
        const data = await response.json()
        setTickerUpdates(data.updates || [])
      }
    } catch (error) {
      console.error('Failed to fetch ticker updates:', error)
    }
  }

  const getItemColor = (item: Notification | TickerUpdate): string => {
    // Handle ticker updates
    if ('priority' in item && !('read' in item)) {
      const tickerUpdate = item as TickerUpdate
      switch (tickerUpdate.type) {
        case 'BIG_BATTLE':
          return 'text-neon-orange'
        case 'HIGH_VIEWS':
          return 'text-electric-blue'
        case 'MAJOR_UPSET':
          return 'text-red-400'
        case 'NEW_VERDICT':
          return 'text-cyber-green'
        case 'STREAK':
          return 'text-yellow-400'
        case 'MILESTONE':
          return 'text-purple-400'
        default:
          return 'text-electric-blue'
      }
    }
    
    // Handle notifications
    const notification = item as Notification
    const isWin = notification.title.toLowerCase().includes('won') || 
                  notification.message.toLowerCase().includes('won')
    const isLoss = notification.title.toLowerCase().includes('lost') || 
                   notification.message.toLowerCase().includes('lost')
    
    if (!notification.read) {
      if (isWin) {
        return 'text-cyber-green'
      }
      if (isLoss) {
        return 'text-red-400'
      }
      
      switch (notification.type) {
        case 'YOUR_TURN':
        case 'DEBATE_TURN':
          return 'text-neon-orange'
        case 'VERDICT_READY':
        case 'DEBATE_COMPLETE':
          return 'text-cyber-green'
        case 'APPEAL_SUBMITTED':
        case 'APPEAL_RESOLVED':
          return 'text-yellow-400'
        case 'REMATCH_REQUESTED':
          return 'text-purple-400'
        case 'DEBATE_ACCEPTED':
        case 'NEW_CHALLENGE':
          return 'text-electric-blue'
        default:
          return 'text-electric-blue'
      }
    } else {
      return 'text-text-secondary'
    }
  }

  const getItemUrl = (item: Notification | TickerUpdate): string => {
    if (item.debateId) {
      return `/debate/${item.debateId}`
    }
    return '/dashboard'
  }

  // Show ticker if there are any items (notifications or ticker updates)
  const visibleItems = allItems.filter(
    item => {
      const itemDate = new Date(item.createdAt)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return itemDate > oneDayAgo || ('read' in item && !item.read)
    }
  ).slice(0, 15)

  if (visibleItems.length === 0) {
    return null
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-bg-secondary border-t border-bg-tertiary"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative h-9 flex items-center overflow-hidden">
        {/* LIVE Badge */}
        <div className="absolute left-0 top-0 bottom-0 bg-electric-blue text-black px-3 flex items-center font-bold text-[10px] tracking-wider z-10 border-r border-bg-tertiary">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
            <span className="whitespace-nowrap uppercase">LIVE</span>
          </div>
        </div>

        {/* Scrolling notifications */}
        <div
          ref={tickerRef}
          className="flex-1 overflow-hidden ml-14"
        >
          <div
            ref={contentRef}
            className="ticker-content flex items-center gap-4 h-full"
            style={{ width: 'max-content' }}
          >
            {/* Original items */}
            {visibleItems.map((item) => (
              <Link
                key={item.id}
                href={getItemUrl(item)}
                className={`flex items-center gap-2 px-3 py-1 transition-colors hover:opacity-80 whitespace-nowrap ${getItemColor(item)}`}
                onClick={async () => {
                  if ('read' in item && !item.read && user) {
                    try {
                      await fetch(`/api/notifications/${item.id}/read`, {
                        method: 'POST',
                      })
                      fetchNotifications()
                    } catch (error) {
                      console.error('Failed to mark notification as read:', error)
                    }
                  }
                }}
              >
                <span className="text-xs font-semibold">
                  {item.title}
                </span>
                <span className="text-[10px] opacity-70">
                  {item.message}
                </span>
                {'read' in item && !item.read && (
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0 bg-current" />
                )}
              </Link>
            ))}
            
            {/* Duplicate for seamless loop */}
            {visibleItems.map((item) => (
              <Link
                key={`${item.id}-duplicate`}
                href={getItemUrl(item)}
                className={`flex items-center gap-2 px-3 py-1 transition-colors hover:opacity-80 whitespace-nowrap ${getItemColor(item)}`}
              >
                <span className="text-xs font-semibold">
                  {item.title}
                </span>
                <span className="text-[10px] opacity-70">
                  {item.message}
                </span>
                {'read' in item && !item.read && (
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0 bg-current" />
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
