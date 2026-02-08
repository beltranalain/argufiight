'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/lib/hooks/useAuth'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { NotificationsModal } from '@/components/notifications/NotificationsModal'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { NAV_POLL_INTERVAL_MS } from '@/lib/constants'
import { AccountSwitcher } from '@/components/auth/AccountSwitcher'
import { useVisibleInterval } from '@/lib/hooks/useVisibleInterval'

interface TopNavProps {
  currentPanel: string
  initialNavData?: any
}

export function TopNav({ currentPanel, initialNavData }: TopNavProps) {
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

  // Fetch all nav data in a single API call (replaces 6 separate calls)
  const fetchNavData = async () => {
    try {
      const linkedAccountIds = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('argufight_linked_accounts') || '[]')
        : []

      const response = await fetch('/api/nav-data', {
        credentials: 'include',
        headers: {
          'x-linked-accounts': JSON.stringify(linkedAccountIds),
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (currentPanel !== 'ADVERTISER') {
          setUnreadCount(data.unreadCount || 0)
        }
        setUserTier(data.tier || 'FREE')
        setIsAdvertiser(data.isAdvertiser || false)
        setAccountCount(data.accountCount || 1)
        setBeltCount(data.beltCount || 0)
        setCoinBalance(data.coinBalance || 0)
      }
    } catch {
      // Set defaults on error
      setUserTier('FREE')
      setIsAdvertiser(false)
      setAccountCount(1)
      setBeltCount(0)
      setCoinBalance(0)
    }
  }

  // Lightweight poll for just notification count (used by 30s interval)
  const fetchUnreadCount = async () => {
    if (currentPanel === 'ADVERTISER') {
      setUnreadCount(0)
      return
    }
    try {
      const response = await fetch('/api/nav-data', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.unreadCount || 0)
      }
    } catch {
      // ignore
    }
  }

  // Apply initial nav data from consolidated dashboard endpoint
  useEffect(() => {
    if (initialNavData) {
      if (currentPanel !== 'ADVERTISER') {
        setUnreadCount(initialNavData.unreadCount || 0)
      }
      setUserTier(initialNavData.tier || 'FREE')
      setIsAdvertiser(initialNavData.isAdvertiser || false)
      setBeltCount(initialNavData.beltCount || 0)
      setCoinBalance(initialNavData.coinBalance || 0)
    }
  }, [initialNavData])

  useEffect(() => {
    if (user && isMounted) {
      if (currentPanel === 'ADVERTISER') {
        setUnreadCount(0)
      }
      // Skip initial fetch if initialNavData is provided (dashboard mode)
      if (!initialNavData) {
        fetchNavData()
      }
    }
  }, [user, isMounted, currentPanel])

  // Visibility-aware polling for notification count — pauses when tab is backgrounded
  useVisibleInterval(() => {
    if (user && currentPanel !== 'ADVERTISER') {
      fetchUnreadCount()
    }
  }, NAV_POLL_INTERVAL_MS)

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
            fetchUnreadCount()
          }}
        />
      )}

      {/* Account Switcher Modal */}
      {isAccountSwitcherOpen && user && (
        <AccountSwitcher
          onClose={() => {
            setIsAccountSwitcherOpen(false)
            fetchNavData()
          }}
        />
      )}
    </nav>
  )
}

