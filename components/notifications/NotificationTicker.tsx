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
    if (!notification.read) {
      switch (notification.type) {
        case 'YOUR_TURN':
        case 'DEBATE_TURN':
          return 'bg-gradient-to-r from-neon-orange to-orange-600 text-black'
        case 'VERDICT_READY':
        case 'DEBATE_COMPLETE':
          return 'bg-gradient-to-r from-cyber-green to-green-600 text-black'
        case 'APPEAL_SUBMITTED':
        case 'APPEAL_RESOLVED':
          return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black'
        case 'REMATCH_REQUESTED':
          return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
        case 'DEBATE_ACCEPTED':
        case 'NEW_CHALLENGE':
          return 'bg-gradient-to-r from-electric-blue to-blue-600 text-black'
        default:
          return 'bg-gradient-to-r from-electric-blue to-blue-600 text-black'
      }
    } else {
      return 'bg-bg-tertiary text-text-secondary border-bg-secondary'
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
      className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-bg-secondary via-bg-tertiary to-bg-secondary border-t-2 border-electric-blue/30 shadow-lg"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative h-14 flex items-center overflow-hidden">
        {/* LIVE Badge */}
        <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-br from-electric-blue to-blue-600 text-black px-5 flex items-center font-bold text-xs tracking-wider z-10 border-r-2 border-electric-blue/50 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-black rounded-full animate-pulse" />
            <span className="whitespace-nowrap uppercase">LIVE</span>
          </div>
        </div>

        {/* Scrolling notifications container */}
        <div
          ref={tickerRef}
          className="flex-1 overflow-hidden ml-20"
        >
          <div
            className="ticker-content flex items-center gap-8 h-full"
            style={{ width: 'max-content' }}
          >
            {/* Original notifications */}
            {visibleNotifications.map((notification) => (
              <Link
                key={notification.id}
                href={getNotificationUrl(notification)}
                className="flex items-center gap-3 px-5 py-2 rounded-lg border-2 transition-all hover:scale-105 hover:shadow-lg whitespace-nowrap"
                style={{ minWidth: '350px' }}
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
                <div className={`flex-1 flex items-center gap-3 px-4 py-2 rounded-md border ${getNotificationColor(notification)}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold uppercase tracking-wide">
                        {notification.title}
                      </span>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-black rounded-full animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs opacity-90 truncate max-w-[250px]">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
            
            {/* Duplicate for seamless infinite loop */}
            {visibleNotifications.map((notification) => (
              <Link
                key={`${notification.id}-duplicate`}
                href={getNotificationUrl(notification)}
                className="flex items-center gap-3 px-5 py-2 rounded-lg border-2 transition-all hover:scale-105 hover:shadow-lg whitespace-nowrap"
                style={{ minWidth: '350px' }}
              >
                <div className={`flex-1 flex items-center gap-3 px-4 py-2 rounded-md border ${getNotificationColor(notification)}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold uppercase tracking-wide">
                        {notification.title}
                      </span>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-black rounded-full animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs opacity-90 truncate max-w-[250px]">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
