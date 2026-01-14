'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/lib/hooks/useAuth'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { NotificationsModal } from '@/components/notifications/NotificationsModal'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { AccountSwitcher } from '@/components/auth/AccountSwitcher'
import { AnimatePresence } from 'framer-motion'

interface TopNavProps {
  currentPanel: string
}

export function TopNav({ currentPanel }: TopNavProps) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isAccountSwitcherOpen, setIsAccountSwitcherOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [userTier, setUserTier] = useState<'FREE' | 'PRO' | null>(null)
  const [isAdvertiser, setIsAdvertiser] = useState(false)
  const [accountCount, setAccountCount] = useState(0)
  const [beltCount, setBeltCount] = useState(0)
  const [coinBalance, setCoinBalance] = useState<number | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (currentPanel === 'ADVERTISER') {
      // Always go to advertiser dashboard, even if already there (refresh)
      router.push('/advertiser/dashboard')
      router.refresh()
    } else if (currentPanel === 'ADMIN') {
      router.push('/admin')
    } else if (currentPanel === 'CREATOR') {
      router.push('/creator/dashboard')
    } else {
      router.push('/')
    }
  }

  useEffect(() => {
    if (user && isMounted) {
      console.log('[TopNav] useEffect running, currentPanel:', currentPanel, 'user:', user.email)
      
      // On advertiser dashboard - explicitly set count to 0 and don't fetch
      if (currentPanel === 'ADVERTISER') {
        console.log('[TopNav] On advertiser dashboard - setting notification count to 0, skipping fetch')
        setUnreadCount(0)
      } else {
        // Only fetch notifications if not on advertiser dashboard
        console.log('[TopNav] Not on advertiser dashboard - fetching notifications')
        fetchUnreadCount()
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000)
        return () => clearInterval(interval)
      }
      fetchUserTier()
      checkIfAdvertiser()
      fetchAccountCount()
      fetchBeltCount()
      fetchCoinBalance()
    }
  }, [user, isMounted, currentPanel])

  const fetchAccountCount = async () => {
    try {
      if (typeof window === 'undefined') return
      const linkedAccountIds = JSON.parse(localStorage.getItem('argufight_linked_accounts') || '[]')
      const response = await fetch('/api/auth/sessions', {
        headers: {
          'x-linked-accounts': JSON.stringify(linkedAccountIds),
        },
      })
      if (response.ok) {
        const data = await response.json()
        setAccountCount(data.sessions?.length || 1)
      }
    } catch (error) {
      console.error('Failed to fetch account count:', error)
      setAccountCount(1)
    }
  }
  
  const checkIfAdvertiser = async () => {
    try {
      const response = await fetch('/api/advertiser/me')
      if (response.ok) {
        setIsAdvertiser(true)
      } else if (response.status === 404) {
        // 404 is expected if user is not an advertiser - not an error
        setIsAdvertiser(false)
      } else {
        // Other errors (401, 403, 500, etc.) - user is not an advertiser
        setIsAdvertiser(false)
      }
    } catch (error) {
      // Network error - assume not an advertiser
      // Silently fail - don't log 404s as errors
      setIsAdvertiser(false)
    }
  }

  const fetchUserTier = async () => {
    try {
      const response = await fetch('/api/subscriptions')
      if (response.ok) {
        const data = await response.json()
        setUserTier(data.subscription?.tier || 'FREE')
      }
    } catch (error) {
      console.error('Failed to fetch user tier:', error)
      setUserTier('FREE') // Default to FREE
    }
  }

  const fetchBeltCount = async () => {
    try {
      const response = await fetch('/api/belts/room', {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        const count = data.currentBelts?.length || 0
        setBeltCount(count)
        console.log('[TopNav] Belt count fetched:', count)
      } else if (response.status === 403) {
        // Belt system not enabled
        setBeltCount(0)
      } else if (response.status === 401) {
        // Not logged in
        setBeltCount(0)
      } else {
        setBeltCount(0)
      }
    } catch (error) {
      // Silently fail - belt system might not be enabled
      console.error('[TopNav] Failed to fetch belt count:', error)
      setBeltCount(0)
    }
  }

  const fetchCoinBalance = async () => {
    try {
      const response = await fetch('/api/profile', {
        credentials: 'include',
        cache: 'no-store',
      })
      
      if (response.ok) {
        const data = await response.json()
        const coins = data.coins || 0
        setCoinBalance(coins)
      } else {
        setCoinBalance(0)
      }
    } catch (error) {
      console.error('[TopNav] Failed to fetch coin balance:', error)
      setCoinBalance(0)
    }
  }

  const fetchUnreadCount = async () => {
    // Don't fetch notifications on advertiser dashboard
    if (currentPanel === 'ADVERTISER') {
      console.log('[TopNav] Skipping notification fetch - on advertiser dashboard')
      setUnreadCount(0)
      return
    }
    
    try {
      // Use cache-busting to prevent stale data
      const response = await fetch(`/api/notifications?unreadOnly=true&t=${Date.now()}`, {
        cache: 'no-store',
        credentials: 'include',
      })
      
      if (response.ok) {
        const notifications = await response.json()
        // Ensure notifications is an array and filter out any that are marked as read
        const unreadNotifications = Array.isArray(notifications) 
          ? notifications.filter((n: any) => {
              // Handle both boolean and string 'false' values
              const isRead = n.read === true || n.read === 'true' || n.read === 1 || n.read === '1'
              return !isRead
            })
          : []
        const count = unreadNotifications.length
        console.log('[TopNav] Unread notification count:', count, 'from', notifications.length, 'total notifications')
        
        // Only update if count changed to prevent unnecessary re-renders
        if (count !== unreadCount) {
          setUnreadCount(count)
        }
      } else {
        // If API fails, set count to 0
        console.log('[TopNav] Failed to fetch notifications, setting count to 0')
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('[TopNav] Failed to fetch unread count:', error)
      setUnreadCount(0)
    }
  }

  const menuItems = isAdvertiser ? [
    {
      label: 'Profile',
      onClick: () => window.location.href = '/advertiser/dashboard',
    },
    {
      label: 'Settings',
      onClick: () => window.location.href = '/advertiser/settings',
    },
    {
      label: `Log out @${user?.username || ''}`,
      variant: 'danger' as const,
      onClick: logout,
    },
  ] : [
    {
      label: 'Profile',
      onClick: () => window.location.href = '/profile',
    },
    {
      label: 'Saved Debates',
      onClick: () => window.location.href = '/debates/saved',
    },
    {
      label: 'Trending Topics',
      onClick: () => window.location.href = '/trending',
    },
    {
      label: 'Belts',
      onClick: () => window.location.href = '/belts/room',
    },
    {
      label: 'Direct Messages',
      onClick: () => window.location.href = '/messages',
    },
    {
      label: 'Support',
      onClick: () => window.location.href = '/support',
    },
    {
      label: 'Creator Dashboard',
      onClick: () => window.location.href = '/creator/dashboard',
      variant: 'default' as const,
    },
    {
      label: 'My Coins',
      onClick: () => router.push('/coins'),
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Buy Coins',
      onClick: () => router.push('/coins/purchase'),
      variant: 'default' as const,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
    },
    ...(userTier === 'FREE' ? [{
      label: 'Upgrade to Pro',
      onClick: () => window.location.href = '/upgrade',
      variant: 'default' as const,
    }] : []),
    {
      label: 'Settings',
      onClick: () => window.location.href = '/settings',
    },
    {
      label: `Log out @${user?.username || ''}`,
      variant: 'danger' as const,
      onClick: logout,
    },
  ]

  // Coin balance header for dropdown
  const coinHeader = coinBalance !== null ? (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-electric-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm font-semibold text-text-primary">Coins</span>
      </div>
      <span className="text-lg font-bold text-electric-blue">{coinBalance.toLocaleString()}</span>
    </div>
  ) : null

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 md:h-20 bg-bg-primary/80 backdrop-blur-sm border-b border-bg-tertiary z-50">
      <div className="h-full px-4 md:px-8 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <button
            onClick={handleLogoClick}
            className="flex items-center cursor-pointer bg-transparent border-none p-0"
            type="button"
          >
            <span className="text-lg md:text-xl font-bold text-electric-blue hover:text-electric-blue/80 transition-colors">
              ARGU FIGHT
            </span>
          </button>
        </div>

        {/* Panel Title */}
        <h2 className="absolute left-1/2 -translate-x-1/2 text-lg md:text-2xl font-bold text-text-primary hidden md:block">
          {currentPanel}
        </h2>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Admin Link (only for admins) */}
          {user?.isAdmin && (
            <Link 
              href="/admin" 
              className="px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm font-medium text-electric-blue hover:text-neon-orange transition-colors border border-electric-blue/30 rounded-lg hover:bg-electric-blue/10"
            >
              <span className="hidden sm:inline">Admin</span>
              <span className="sm:hidden">A</span>
            </Link>
          )}

          {/* Notifications - Hidden on Advertiser Dashboard */}
          {user && currentPanel !== 'ADVERTISER' && (
            <button 
              onClick={() => setIsNotificationsOpen(true)}
              className="relative p-1.5 md:p-2 hover:bg-bg-tertiary rounded-lg transition-colors touch-manipulation"
              aria-label="Notifications"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 md:top-1 md:right-1 min-w-[16px] h-[16px] md:min-w-[18px] md:h-[18px] px-1 md:px-1.5 bg-neon-orange text-black text-[10px] md:text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Switch Account Box */}
          {user && (
            <button
              onClick={() => setIsAccountSwitcherOpen(true)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-bg-tertiary rounded-lg transition-colors border border-electric-blue/30 hover:border-electric-blue bg-bg-tertiary/50"
              title="Switch Account"
            >
              <svg className="w-4 h-4 text-electric-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="text-sm font-medium text-electric-blue">
                {accountCount > 1 ? `${accountCount} accounts` : 'Switch'}
              </span>
            </button>
          )}

          {/* Profile */}
          {user ? (
            <DropdownMenu
              trigger={
                <div className="flex items-center gap-3 hover:bg-bg-tertiary rounded-lg p-2 transition-colors cursor-pointer">
                  <Avatar 
                    src={user.avatarUrl} 
                    username={user.username}
                    size="sm"
                  />
                  <span className="font-semibold text-text-primary hidden sm:block">
                    {user.username}
                  </span>
                </div>
              }
              items={menuItems}
              header={coinHeader}
            />
          ) : (
            <Link href="/login">
              <button className="px-4 py-2 bg-electric-blue text-black font-semibold rounded-lg hover:bg-[#00B8E6] transition-colors">
                Sign In
              </button>
            </Link>
          )}
        </div>
      </div>
      
      {/* Notifications Modal - Hidden on Advertiser Dashboard */}
      {user && currentPanel !== 'ADVERTISER' && (
        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => {
            setIsNotificationsOpen(false)
            fetchUnreadCount() // Refresh count when closing
          }}
        />
      )}

      {/* Account Switcher Modal */}
      <AnimatePresence>
        {isAccountSwitcherOpen && user && (
          <AccountSwitcher
            onClose={() => {
              setIsAccountSwitcherOpen(false)
              fetchAccountCount() // Refresh account count when switcher closes
            }}
          />
        )}
      </AnimatePresence>
    </nav>
  )
}

