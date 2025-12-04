'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [newNotificationCount, setNewNotificationCount] = useState(0)
  const tickerRef = useRef<HTMLDivElement>(null)
  const lastFetchRef = useRef<Date>(new Date())

  useEffect(() => {
    if (!user) return

    // Fetch notifications immediately
    fetchNotifications()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications(true)
    }, 30000)

    return () => clearInterval(interval)
  }, [user])

  const fetchNotifications = async (isPoll = false) => {
    if (!user) return

    try {
      const response = await fetch('/api/notifications?limit=20')
      if (response.ok) {
        const data = await response.json()
        const fetchedNotifications = Array.isArray(data) ? data : (data.notifications || [])
        
        if (isPoll) {
          // Check for new notifications
          const newCount = fetchedNotifications.filter(
            (n: Notification) => !n.read && new Date(n.createdAt) > lastFetchRef.current
          ).length
          if (newCount > 0) {
            setNewNotificationCount(newCount)
            // Reset after 5 seconds
            setTimeout(() => setNewNotificationCount(0), 5000)
          }
        }
        
        setNotifications(fetchedNotifications)
        lastFetchRef.current = new Date()
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  const getNotificationColor = (notification: Notification): string => {
    if (!notification.read && newNotificationCount > 0) {
      // New/unread notifications get bright colors
      switch (notification.type) {
        case 'YOUR_TURN':
        case 'DEBATE_TURN':
          return 'bg-neon-orange text-black border-neon-orange'
        case 'VERDICT_READY':
        case 'DEBATE_COMPLETE':
          return 'bg-cyber-green text-black border-cyber-green'
        case 'APPEAL_SUBMITTED':
        case 'APPEAL_RESOLVED':
          return 'bg-yellow-500 text-black border-yellow-500'
        case 'REMATCH_REQUESTED':
          return 'bg-purple-500 text-white border-purple-500'
        case 'DEBATE_ACCEPTED':
        case 'NEW_CHALLENGE':
          return 'bg-electric-blue text-black border-electric-blue'
        default:
          return 'bg-electric-blue text-black border-electric-blue'
      }
    } else {
      // Read notifications get muted colors
      return 'bg-bg-tertiary text-text-secondary border-bg-secondary'
    }
  }

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'YOUR_TURN':
      case 'DEBATE_TURN':
        return '⚡'
      case 'VERDICT_READY':
      case 'DEBATE_COMPLETE':
        return '⚖️'
      case 'APPEAL_SUBMITTED':
      case 'APPEAL_RESOLVED':
        return '📢'
      case 'REMATCH_REQUESTED':
        return '🔄'
      case 'DEBATE_ACCEPTED':
      case 'NEW_CHALLENGE':
        return '🎯'
      default:
        return '🔔'
    }
  }

  const getNotificationUrl = (notification: Notification): string => {
    if (notification.debateId) {
      return `/debate/${notification.debateId}`
    }
    return '/'
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
      className="fixed bottom-0 left-0 right-0 z-50 bg-bg-secondary border-t border-bg-tertiary overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative h-12 flex items-center">
        {/* Label */}
        <div className="absolute left-0 top-0 bottom-0 bg-electric-blue text-black px-4 flex items-center font-bold text-sm z-10 border-r border-bg-tertiary">
          <span className="whitespace-nowrap">LIVE</span>
        </div>

        {/* Scrolling notifications */}
        <div
          ref={tickerRef}
          className="flex-1 overflow-hidden ml-24"
        >
          <motion.div
            className="flex items-center gap-6 h-full"
            animate={{
              x: isPaused ? 0 : `-${50 * visibleNotifications.length}%`,
            }}
            transition={{
              duration: visibleNotifications.length * 5,
              repeat: Infinity,
              ease: 'linear',
              repeatType: 'loop',
            }}
          >
            {visibleNotifications.map((notification, index) => (
              <motion.div
                key={`${notification.id}-${index}`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border whitespace-nowrap transition-all hover:scale-105 cursor-pointer"
                style={{ minWidth: '300px' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href={getNotificationUrl(notification)}
                  className="flex items-center gap-2 w-full"
                  onClick={async () => {
                    // Mark as read
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
                  <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                  <span className={`text-sm font-medium ${getNotificationColor(notification)} px-3 py-1 rounded border`}>
                    {notification.title}
                  </span>
                  <span className="text-xs text-text-secondary truncate max-w-[200px]">
                    {notification.message}
                  </span>
                  {!notification.read && (
                    <span className="w-2 h-2 bg-neon-orange rounded-full animate-pulse" />
                  )}
                </Link>
              </motion.div>
            ))}
            {/* Duplicate for seamless loop */}
            {visibleNotifications.map((notification, index) => (
              <motion.div
                key={`${notification.id}-duplicate-${index}`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border whitespace-nowrap transition-all hover:scale-105 cursor-pointer"
                style={{ minWidth: '300px' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href={getNotificationUrl(notification)}
                  className="flex items-center gap-2 w-full"
                >
                  <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                  <span className={`text-sm font-medium ${getNotificationColor(notification)} px-3 py-1 rounded border`}>
                    {notification.title}
                  </span>
                  <span className="text-xs text-text-secondary truncate max-w-[200px]">
                    {notification.message}
                  </span>
                  {!notification.read && (
                    <span className="w-2 h-2 bg-neon-orange rounded-full animate-pulse" />
                  )}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

