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
}

export function NotificationTicker() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const tickerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    if (!user) return

    // Fetch notifications immediately
    fetchNotifications()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications()
    }, 30000)

    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    // Handle smooth infinite scroll animation
    if (!tickerRef.current || notifications.length === 0) return

    const container = tickerRef.current
    const content = container.querySelector('.ticker-content') as HTMLElement
    if (!content) return

    let scrollPosition = 0
    const scrollSpeed = 0.5 // pixels per frame

    const animate = () => {
      if (!isPaused && content) {
        scrollPosition += scrollSpeed
        const contentWidth = content.scrollWidth / 2 // Divide by 2 because we duplicate content
        
        if (scrollPosition >= contentWidth) {
          scrollPosition = 0
        }
        
        content.style.transform = `translateX(-${scrollPosition}px)`
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [notifications, isPaused])

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

  const getNotificationColor = (notification: Notification): string => {
    // Check if notification is about winning
    const isWin = notification.title.toLowerCase().includes('won') || 
                  notification.message.toLowerCase().includes('won') ||
                  notification.type === 'VERDICT_READY' && notification.message.toLowerCase().includes('winner')
    
    // Check if notification is about losing
    const isLoss = notification.title.toLowerCase().includes('lost') || 
                   notification.message.toLowerCase().includes('lost')
    
    if (!notification.read) {
      // Win notifications - light green
      if (isWin) {
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      }
      // Loss notifications - light red
      if (isLoss) {
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      }
      
      // Other notification types
      switch (notification.type) {
        case 'YOUR_TURN':
        case 'DEBATE_TURN':
          return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
        case 'VERDICT_READY':
        case 'DEBATE_COMPLETE':
          return 'bg-green-500/20 text-green-400 border-green-500/30'
        case 'APPEAL_SUBMITTED':
        case 'APPEAL_RESOLVED':
          return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
        case 'REMATCH_REQUESTED':
          return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
        case 'DEBATE_ACCEPTED':
        case 'NEW_CHALLENGE':
          return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        default:
          return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      }
    } else {
      return 'bg-bg-tertiary/50 text-text-secondary border-bg-secondary/50'
    }
  }

  const getNotificationUrl = (notification: Notification): string => {
    if (notification.debateId) {
      return `/debate/${notification.debateId}`
    }
    return '/dashboard'
  }

  if (!user || notifications.length === 0) {
    return null
  }

  // Filter to show only unread or recent notifications
  const visibleNotifications = notifications.filter(
    n => !n.read || new Date(n.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).slice(0, 10)

  if (visibleNotifications.length === 0) {
    return null
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-bg-secondary/95 backdrop-blur-sm border-t border-bg-tertiary"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative h-10 flex items-center overflow-hidden">
        {/* LIVE Badge */}
        <div className="absolute left-0 top-0 bottom-0 bg-electric-blue text-black px-3 flex items-center font-bold text-[10px] tracking-wider z-10 border-r border-electric-blue/50">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
            <span className="whitespace-nowrap uppercase">LIVE</span>
          </div>
        </div>

        {/* Scrolling notifications container */}
        <div
          ref={tickerRef}
          className="flex-1 overflow-hidden ml-16"
        >
          <div
            className="ticker-content flex items-center gap-4 h-full"
            style={{ width: 'max-content' }}
          >
            {/* Original notifications */}
            {visibleNotifications.map((notification) => (
              <Link
                key={notification.id}
                href={getNotificationUrl(notification)}
                className="flex items-center gap-2 px-3 py-1.5 rounded border transition-all hover:opacity-80 whitespace-nowrap"
                style={{ minWidth: '280px' }}
                onClick={async () => {
                  if (!notification.read) {
                    try {
                      await fetch(`/api/notifications/${notification.id}/read`, {
                        method: 'POST',
                      })
                      fetchNotifications()
                    } catch (error) {
                      console.error('Failed to mark notification as read:', error)
                    }
                  }
                }}
              >
                <div className={`flex items-center gap-2 px-3 py-1 rounded border ${getNotificationColor(notification)}`}>
                  <span className="text-xs font-semibold truncate max-w-[200px]">
                    {notification.title}
                  </span>
                  <span className="text-[10px] opacity-75 truncate max-w-[150px]">
                    {notification.message}
                  </span>
                  {!notification.read && (
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" 
                      style={{ backgroundColor: 'currentColor' }}
                    />
                  )}
                </div>
              </Link>
            ))}
            
            {/* Duplicate for seamless infinite loop */}
            {visibleNotifications.map((notification) => (
              <Link
                key={`${notification.id}-duplicate`}
                href={getNotificationUrl(notification)}
                className="flex items-center gap-2 px-3 py-1.5 rounded border transition-all hover:opacity-80 whitespace-nowrap"
                style={{ minWidth: '280px' }}
              >
                <div className={`flex items-center gap-2 px-3 py-1 rounded border ${getNotificationColor(notification)}`}>
                  <span className="text-xs font-semibold truncate max-w-[200px]">
                    {notification.title}
                  </span>
                  <span className="text-[10px] opacity-75 truncate max-w-[150px]">
                    {notification.message}
                  </span>
                  {!notification.read && (
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" 
                      style={{ backgroundColor: 'currentColor' }}
                    />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
